import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import {
    generatePairingCode,
    pairDevice,
    validateAccessToken,
    refreshAccessToken,
    revokeDevice,
    registerActiveSocket,
    requireAuth,
    requireCapability,
    validateOriginAndHost,
    CAPABILITIES
} from '../src/auth-service.mjs';
import { registerCommand, transitionCommand, COMMAND_STATE } from '../src/command-lifecycle.mjs';
import { emitEvent, getEventsSince } from '../src/event-bus.mjs';

// Setup an isolated test Express & WebSocket server
function createTestApp() {
    const app = express();
    app.use(express.json());
    app.use(validateOriginAndHost(['localhost', '127.0.0.1']));

    // Public health endpoint
    app.get('/api/status', (req, res) => {
        res.json({ status: 'ok', version: '2.0.0' });
    });

    // Pairing bootstrap endpoint
    app.post('/api/pair', (req, res) => {
        const { code, name } = req.body || {};
        const ip = req.ip || '127.0.0.1';
        const result = pairDevice(code, name, ip);
        if (!result.success) {
            return res.status(result.error === 'rate_limited' ? 429 : 401).json(result);
        }
        res.json(result);
    });

    // Protected endpoint requiring authentication
    app.get('/api/chat', requireCapability(CAPABILITIES.CONVERSATION_READ), (req, res) => {
        res.json({ messages: ['hello'] });
    });

    // Protected command execution endpoint (SEC-01)
    app.post('/api/commands/execute', requireCapability(CAPABILITIES.PROMPT_SUBMIT), (req, res) => {
        const { prompt, idempotencyKey } = req.body;
        if (!prompt) return res.status(400).json({ error: 'prompt required' });
        const reg = registerCommand(prompt, idempotencyKey, req.authSession.deviceId);
        res.json(reg);
    });

    // Token refresh endpoint
    app.post('/api/auth/token/refresh', (req, res) => {
        const { refreshToken } = req.body || {};
        const result = refreshAccessToken(refreshToken);
        if (!result.success) return res.status(401).json(result);
        res.json(result);
    });

    // Session revocation endpoint (Milestone 1 item 12)
    app.post('/api/auth/revoke', (req, res) => {
        const auth = validateAccessToken(req.headers['authorization']);
        if (!auth) return res.status(401).json({ error: 'unauthorized' });
        const targetDeviceId = req.body?.deviceId || auth.deviceId;
        if (targetDeviceId !== auth.deviceId && !auth.capabilities.includes(CAPABILITIES.SESSION_REVOKE)) {
            return res.status(403).json({ error: 'forbidden' });
        }
        const revoked = revokeDevice(targetDeviceId);
        res.json({ success: revoked });
    });

    const server = createServer(app);
    const wss = new WebSocketServer({ noServer: true });

    // Handle WebSocket upgrade with authentication (SEC-02)
    server.on('upgrade', (req, socket, head) => {
        const url = new URL(req.url, 'http://127.0.0.1');
        const token = url.searchParams.get('token') || req.headers['authorization'];
        const session = validateAccessToken(token);

        if (!session) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
            return;
        }

        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req, session);
        });
    });

    wss.on('connection', (ws, req, session) => {
        registerActiveSocket(session.deviceId, ws);
        ws.on('message', (data) => {
            const msg = JSON.parse(data.toString());
            if (msg.action === 'inject') {
                if (!session.capabilities.includes(CAPABILITIES.PROMPT_SUBMIT)) {
                    ws.send(JSON.stringify({ error: 'forbidden', code: 4403 }));
                    return;
                }
                const reg = registerCommand(msg.text, msg.idempotencyKey, session.deviceId);
                ws.send(JSON.stringify({ event: 'command_accepted', data: reg }));
            }
        });
    });

    return { server, app };
}

test('API Security & Auth Middleware Suite', async (t) => {
    const { server } = createTestApp();
    await new Promise(res => server.listen(0, '127.0.0.1', res));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    t.after(() => server.close());

    await t.test('1. Public health endpoint succeeds unauthenticated and leaks no secrets', async () => {
        const res = await fetch(`${baseUrl}/api/status`);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.status, 'ok');
        assert.equal(data.version, '2.0.0');
        assert.equal(data.token, undefined);
        assert.equal(data.path, undefined);
    });

    await t.test('2. Protected route /api/commands/execute returns 401 without credentials (SEC-01)', async () => {
        const res = await fetch(`${baseUrl}/api/commands/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: 'test' })
        });
        assert.equal(res.status, 401);
        const data = await res.json();
        assert.equal(data.error, 'unauthorized');
    });

    await t.test('3. Pairing and subsequent authenticated prompt execution with lifecycle', async () => {
        const { code } = generatePairingCode();
        const pairRes = await fetch(`${baseUrl}/api/pair`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, name: 'Test Client' })
        });
        assert.equal(pairRes.status, 200);
        const pairData = await pairRes.json();
        assert.ok(pairData.accessToken);

        // Execute prompt with valid access token
        const execRes = await fetch(`${baseUrl}/api/commands/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${pairData.accessToken}`
            },
            body: JSON.stringify({ prompt: 'Create login screen', idempotencyKey: 'idemp_123' })
        });
        assert.equal(execRes.status, 200);
        const execData = await execRes.json();
        assert.equal(execData.isDuplicate, false);
        assert.equal(execData.command.state, COMMAND_STATE.ACCEPTED_BY_BRIDGE);

        // Duplicate retry with same idempotencyKey returns existing without re-executing
        const retryRes = await fetch(`${baseUrl}/api/commands/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${pairData.accessToken}`
            },
            body: JSON.stringify({ prompt: 'Create login screen', idempotencyKey: 'idemp_123' })
        });
        assert.equal(retryRes.status, 200);
        const retryData = await retryRes.json();
        assert.equal(retryData.isDuplicate, true);
    });

    await t.test('4. WebSocket rejects unauthenticated upgrade (SEC-02)', async () => {
        const wsUrl = `ws://127.0.0.1:${port}/`;
        await assert.rejects(async () => {
            await new Promise((resolve, reject) => {
                const ws = new WebSocket(wsUrl);
                ws.on('open', () => { ws.close(); resolve(); });
                ws.on('error', (err) => reject(err));
            });
        });
    });

    await t.test('5. WebSocket accepts authenticated client with token query param', async () => {
        const { code } = generatePairingCode();
        const pairRes = await fetch(`${baseUrl}/api/pair`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, name: 'WS Client' })
        });
        const { accessToken } = await pairRes.json();

        const wsUrl = `ws://127.0.0.1:${port}/?token=${accessToken}`;
        await new Promise((resolve, reject) => {
            const ws = new WebSocket(wsUrl);
            ws.on('open', () => {
                ws.send(JSON.stringify({ action: 'inject', text: 'Prompt via WS', idempotencyKey: 'ws_cmd_1' }));
            });
            ws.on('message', (msg) => {
                const parsed = JSON.parse(msg.toString());
                if (parsed.event === 'command_accepted') {
                    assert.equal(parsed.data.command.state, COMMAND_STATE.ACCEPTED_BY_BRIDGE);
                    ws.close();
                    resolve();
                }
            });
            ws.on('error', reject);
        });
    });

    await t.test('6. Host header validation blocks DNS rebinding', async () => {
        const { request } = await import('http');
        const status = await new Promise((resolve, reject) => {
            const req = request({
                hostname: '127.0.0.1',
                port,
                path: '/api/status',
                headers: { 'Host': 'attacker.malicious.com' }
            }, res => {
                resolve(res.statusCode);
            });
            req.on('error', reject);
            req.end();
        });
        assert.equal(status, 400);
    });

    await t.test('7. Browser Origin check blocks cross-site attacks', async () => {
        const res = await fetch(`${baseUrl}/api/status`, {
            headers: { 'Origin': 'http://evil-website.com' }
        });
        assert.equal(res.status, 403);
        const data = await res.json();
        assert.equal(data.error, 'invalid_origin');
    });

    await t.test('8. Revoking device closes active sockets and future requests fail with 401 (Milestone 1 item 12)', async () => {
        const { code } = generatePairingCode();
        const pairRes = await fetch(`${baseUrl}/api/pair`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, name: 'Revoke Target' })
        });
        const { accessToken, deviceId } = await pairRes.json();

        // Connect WebSocket with device token
        const wsUrl = `ws://127.0.0.1:${port}/?token=${accessToken}`;
        let socketClosed = false;
        const ws = new WebSocket(wsUrl);
        await new Promise((resolve) => ws.on('open', resolve));
        ws.on('close', () => { socketClosed = true; });

        // Revoke the device
        const revokeRes = await fetch(`${baseUrl}/api/auth/revoke`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ deviceId })
        });
        assert.equal(revokeRes.status, 200);

        // Wait a brief moment for socket close
        await new Promise((r) => setTimeout(r, 50));
        assert.equal(socketClosed, true);

        // Subsequent requests with old access token fail
        const rejectedRes = await fetch(`${baseUrl}/api/commands/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ prompt: 'Should fail' })
        });
        assert.equal(rejectedRes.status, 401);
    });

    await t.test('9. Token refresh endpoint rotates refresh tokens and yields new access token', async () => {
        const { code } = generatePairingCode();
        const pairRes = await fetch(`${baseUrl}/api/pair`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, name: 'Refresh Client' })
        });
        const { accessToken, refreshToken } = await pairRes.json();
        assert.ok(refreshToken);

        const refreshRes = await fetch(`${baseUrl}/api/auth/token/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });
        assert.equal(refreshRes.status, 200);
        const refreshData = await refreshRes.json();
        assert.ok(refreshData.accessToken);
        assert.ok(refreshData.refreshToken);
        assert.notEqual(refreshData.accessToken, accessToken);
        assert.notEqual(refreshData.refreshToken, refreshToken);

        // Using old refresh token again triggers theft revocation
        const reuseRes = await fetch(`${baseUrl}/api/auth/token/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });
        assert.equal(reuseRes.status, 401);
    });
});
