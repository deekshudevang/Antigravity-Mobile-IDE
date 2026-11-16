import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { randomBytes } from 'crypto';

/**
 * Mock Rust Helper WebSocket Server implementing Section 5.5 security rules:
 * - Listens exclusively on 127.0.0.1
 * - Requires a per-start shared authentication secret
 * - Enforces monotonic sequence numbers to prevent replay attacks
 * - Validates strict schema on input commands (no arbitrary execution)
 * - Enforces maximum payload size limits (rejects oversized messages)
 */
function createMockHelperServer(port, sharedSecret) {
    const server = createServer();
    const wss = new WebSocketServer({ noServer: true });
    let lastSeq = 0;
    const receivedCommands = [];

    server.on('upgrade', (req, socket, head) => {
        // 1. Loopback bind / origin check: reject any remote or non-loopback requests
        const remoteIp = socket.remoteAddress;
        if (remoteIp !== '127.0.0.1' && remoteIp !== '::1' && remoteIp !== '::ffff:127.0.0.1') {
            socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
            socket.destroy();
            return;
        }

        // 2. Authentication: check shared secret query param or header
        const url = new URL(req.url, 'http://127.0.0.1');
        const token = url.searchParams.get('secret') || req.headers['x-helper-secret'];
        if (token !== sharedSecret) {
            socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
            socket.destroy();
            return;
        }

        wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req);
        });
    });

    wss.on('connection', (ws) => {
        // Send initial Hello event with primary display geometry
        ws.send(JSON.stringify({
            event: 'hello',
            width: 1920,
            height: 1080,
            monitor: 0,
            pairing_code: null
        }));

        ws.on('message', (data, isBinary) => {
            // Reject oversized frames (> 64KB for control/input)
            if (data.length > 65536) {
                ws.close(1009, 'message_too_big');
                return;
            }

            if (!isBinary) {
                try {
                    const cmd = JSON.parse(data.toString());
                    // 3. Monotonic sequence number enforcement
                    if (typeof cmd.seq === 'number') {
                        if (cmd.seq <= lastSeq) {
                            ws.send(JSON.stringify({ event: 'error', code: 'REPLAY_DETECTED', seq: cmd.seq }));
                            return;
                        }
                        lastSeq = cmd.seq;
                    }

                    // 4. Input validation: strict whitelist of allowed command types
                    const allowedTypes = ['move', 'button', 'scroll', 'key', 'text', 'video'];
                    if (!allowedTypes.includes(cmd.type)) {
                        ws.send(JSON.stringify({ event: 'error', code: 'INVALID_COMMAND_TYPE', type: cmd.type }));
                        return;
                    }

                    // Validated
                    receivedCommands.push(cmd);
                    ws.send(JSON.stringify({ event: 'ack', seq: cmd.seq, type: cmd.type }));
                } catch (e) {
                    ws.send(JSON.stringify({ event: 'error', code: 'MALFORMED_JSON' }));
                }
            }
        });
    });

    return {
        server,
        wss,
        listen: () => new Promise(res => server.listen(port, '127.0.0.1', res)),
        close: () => new Promise(res => {
            wss.close();
            server.close(res);
        }),
        getReceived: () => receivedCommands
    };
}

test('Rust Helper Security & Protocol Suite (Section 5.5 / Section 10)', async (t) => {
    const port = 49100 + Math.floor(Math.random() * 500);
    const sharedSecret = randomBytes(16).toString('hex');
    const helper = createMockHelperServer(port, sharedSecret);
    await helper.listen();

    t.after(async () => {
        await helper.close();
    });

    await t.test('1. Unauthenticated connection attempt to helper is rejected with 401', async () => {
        await assert.rejects(async () => {
            await new Promise((resolve, reject) => {
                const ws = new WebSocket(`ws://127.0.0.1:${port}/`);
                ws.on('open', () => { ws.close(); resolve(); });
                ws.on('error', reject);
            });
        });
    });

    await t.test('2. Authenticated connection receives hello event with display geometry', async () => {
        const ws = new WebSocket(`ws://127.0.0.1:${port}/?secret=${sharedSecret}`);
        const helloMsg = await new Promise((resolve, reject) => {
            ws.on('message', (d) => {
                const msg = JSON.parse(d.toString());
                if (msg.event === 'hello') {
                    ws.close();
                    resolve(msg);
                }
            });
            ws.on('error', reject);
        });

        assert.equal(helloMsg.event, 'hello');
        assert.equal(helloMsg.width, 1920);
        assert.equal(helloMsg.height, 1080);
    });

    await t.test('3. Enforces monotonic sequence numbers and detects replay attacks', async () => {
        const ws = new WebSocket(`ws://127.0.0.1:${port}/?secret=${sharedSecret}`);
        const responses = [];
        ws.on('message', d => responses.push(JSON.parse(d.toString())));
        await new Promise(r => ws.on('open', r));

        // Send seq 1
        ws.send(JSON.stringify({ seq: 1, type: 'move', x: 0.5, y: 0.5 }));
        await new Promise(r => setTimeout(r, 50));
        const ack1 = responses.find(m => m.event === 'ack');
        assert.ok(ack1);
        assert.equal(ack1.seq, 1);

        // Replay seq 1 (must be rejected)
        ws.send(JSON.stringify({ seq: 1, type: 'move', x: 0.6, y: 0.6 }));
        await new Promise(r => setTimeout(r, 50));
        const replayErr = responses.find(m => m.code === 'REPLAY_DETECTED');
        assert.ok(replayErr);

        ws.close();
    });

    await t.test('4. Rejects disallowed or arbitrary execution commands', async () => {
        const ws = new WebSocket(`ws://127.0.0.1:${port}/?secret=${sharedSecret}`);
        const responses = [];
        ws.on('message', d => responses.push(JSON.parse(d.toString())));
        await new Promise(r => ws.on('open', r));

        // Attempt command injection command
        ws.send(JSON.stringify({ seq: 5, type: 'exec', cmd: 'calc.exe' }));
        await new Promise(r => setTimeout(r, 50));
        const err = responses.find(m => m.code === 'INVALID_COMMAND_TYPE');
        assert.ok(err);

        ws.close();
    });

    await t.test('5. Rejects oversized control frames', async () => {
        const ws = new WebSocket(`ws://127.0.0.1:${port}/?secret=${sharedSecret}`);
        await new Promise(r => ws.on('open', r));

        // Send 70KB oversized payload
        const hugeText = 'A'.repeat(70000);
        ws.send(JSON.stringify({ seq: 10, type: 'text', text: hugeText }));

        const closeCode = await new Promise((resolve) => {
            ws.on('close', (code) => resolve(code));
        });
        assert.equal(closeCode, 1009); // 1009 = Message Too Big
    });
});
