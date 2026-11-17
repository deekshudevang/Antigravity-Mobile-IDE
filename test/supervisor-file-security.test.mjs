import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createServer } from 'http';
import { join, resolve } from 'path';
import { statSync, readFileSync, readdirSync } from 'fs';
import * as Pairing from '../src/pairing-service.mjs';
import * as FileSecurity from '../src/file-security.mjs';
import { generatePairingCode, pairDevice } from '../src/auth-service.mjs';

function createSupervisorFileApp(workspacePath) {
    const app = express();
    app.use(express.json());

    app.post('/api/supervisor/file/read', Pairing.requirePaired, (req, res) => {
        try {
            const { path: reqPath } = req.body || {};
            if (!reqPath) {
                return res.status(400).json({ error: 'Path required' });
            }

            const validated = FileSecurity.validateWorkspacePath(workspacePath, reqPath);
            if (!validated.valid) {
                const status = validated.error === 'path_not_found' ? 404 : 403;
                return res.status(status).json({ error: 'Access denied' });
            }
            const canonical = validated.canonicalPath;
            const stats = statSync(canonical);
            if (stats.isDirectory()) {
                return res.status(400).json({ error: 'Cannot read directory' });
            }
            if (stats.size > 1024 * 1024) {
                return res.status(400).json({ error: 'File too large (max 1MB)' });
            }
            const content = readFileSync(canonical, 'utf8');
            res.json({ success: true, content, size: stats.size });
        } catch (e) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.post('/api/supervisor/file/list', Pairing.requirePaired, (req, res) => {
        try {
            const { path: reqPath } = req.body || {};
            const targetPath = reqPath || '.';

            const validated = FileSecurity.validateWorkspacePath(workspacePath, targetPath);
            if (!validated.valid) {
                const status = validated.error === 'path_not_found' ? 404 : 403;
                return res.status(status).json({ error: 'Access denied' });
            }
            const canonical = validated.canonicalPath;
            const stats = statSync(canonical);
            if (!stats.isDirectory()) {
                return res.status(400).json({ error: 'Not a directory' });
            }
            const entries = readdirSync(canonical, { withFileTypes: true }).slice(0, 100).map(e => ({
                name: e.name,
                type: e.isDirectory() ? 'dir' : 'file',
                size: e.isFile() ? statSync(join(canonical, e.name)).size : 0
            }));
            res.json({ success: true, entries });
        } catch (e) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    return app;
}

test('Item 2: Supervisor File Security & Boundary Defense Suite', async (t) => {
    const workspaceRoot = process.cwd();
    const app = createSupervisorFileApp(workspaceRoot);

    const server = createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    t.after(() => server.close());

    // Pair a device to obtain valid accessToken
    const { code } = generatePairingCode();
    const paired = pairDevice(code, 'test-supervisor-device', '127.0.0.1');
    assert.equal(paired.success, true);
    const validToken = paired.accessToken;
    const authHeader = { 'Authorization': `Bearer ${validToken}`, 'Content-Type': 'application/json' };

    // --- /api/supervisor/file/read tests ---
    await t.test('1. read: No device token returns 401', async () => {
        const res = await fetch(`${baseUrl}/api/supervisor/file/read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: 'package.json' })
        });
        assert.equal(res.status, 401);
    });

    await t.test('2. read: Absolute path outside workspace returns 403', async () => {
        const outsidePath = resolve(workspaceRoot, '..', 'secret.txt');
        const res = await fetch(`${baseUrl}/api/supervisor/file/read`, {
            method: 'POST',
            headers: authHeader,
            body: JSON.stringify({ path: outsidePath })
        });
        assert.equal(res.status, 403);
        const data = await res.json();
        assert.equal(data.error, 'Access denied');
        assert.equal(data.path, undefined); // Never echo resolved path
    });

    await t.test('3. read: ../ traversal returns 403', async () => {
        const res = await fetch(`${baseUrl}/api/supervisor/file/read`, {
            method: 'POST',
            headers: authHeader,
            body: JSON.stringify({ path: '../outside.txt' })
        });
        assert.equal(res.status, 403);
    });

    await t.test('4. read: Encoded traversal (%2e%2e%2f) returns 403', async () => {
        const res = await fetch(`${baseUrl}/api/supervisor/file/read`, {
            method: 'POST',
            headers: authHeader,
            body: JSON.stringify({ path: '%2e%2e%2foutside.txt' })
        });
        assert.equal(res.status, 403);
    });

    await t.test('5. read: Valid in-workspace path returns 200 with content', async () => {
        const res = await fetch(`${baseUrl}/api/supervisor/file/read`, {
            method: 'POST',
            headers: authHeader,
            body: JSON.stringify({ path: 'package.json' })
        });
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.match(data.content, /antigravity-mobile/);
    });

    // --- /api/supervisor/file/list tests ---
    await t.test('6. list: No device token returns 401', async () => {
        const res = await fetch(`${baseUrl}/api/supervisor/file/list`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: '.' })
        });
        assert.equal(res.status, 401);
    });

    await t.test('7. list: Absolute path outside workspace returns 403', async () => {
        const outsideDir = resolve(workspaceRoot, '..');
        const res = await fetch(`${baseUrl}/api/supervisor/file/list`, {
            method: 'POST',
            headers: authHeader,
            body: JSON.stringify({ path: outsideDir })
        });
        assert.equal(res.status, 403);
        const data = await res.json();
        assert.equal(data.error, 'Access denied');
    });

    await t.test('8. list: ../ traversal returns 403', async () => {
        const res = await fetch(`${baseUrl}/api/supervisor/file/list`, {
            method: 'POST',
            headers: authHeader,
            body: JSON.stringify({ path: '..' })
        });
        assert.equal(res.status, 403);
    });

    await t.test('9. list: Encoded traversal (%2e%2e%2f) returns 403', async () => {
        const res = await fetch(`${baseUrl}/api/supervisor/file/list`, {
            method: 'POST',
            headers: authHeader,
            body: JSON.stringify({ path: '%2e%2e%2f' })
        });
        assert.equal(res.status, 403);
    });

    await t.test('10. list: Valid in-workspace path returns 200 with directory entries', async () => {
        const res = await fetch(`${baseUrl}/api/supervisor/file/list`, {
            method: 'POST',
            headers: authHeader,
            body: JSON.stringify({ path: 'src' })
        });
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
        assert.ok(Array.isArray(data.entries));
        assert.ok(data.entries.some(e => e.name === 'http-server.mjs'));
    });
});
