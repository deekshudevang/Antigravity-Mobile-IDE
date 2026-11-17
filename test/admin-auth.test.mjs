import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createServer } from 'http';
import { readFileSync, existsSync, statSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
    initAdminToken,
    requireAdminToken,
    localhostOnly,
    verifyAdminToken,
    setAdminToken
} from '../src/admin-auth.mjs';

function createTestAdminApp(adminToken) {
    const app = express();
    app.use(express.json());

    setAdminToken(adminToken);

    // Guard all /api/admin/* and /api/setup/* endpoints
    app.use('/api/admin', localhostOnly, requireAdminToken);
    app.use('/api/setup', localhostOnly, requireAdminToken);

    app.get('/admin', localhostOnly, requireAdminToken, (req, res) => {
        res.status(200).send('<html>Admin Shell</html>');
    });

    app.get('/setup', localhostOnly, requireAdminToken, (req, res) => {
        res.status(200).send('<html>Setup Wizard</html>');
    });

    app.get('/api/setup/status', (req, res) => {
        res.status(200).json({ status: 'ok' });
    });

    app.post('/api/admin/auto-accept/toggle', (req, res) => {
        res.status(200).json({ success: true, autoAccept: true });
    });

    return app;
}

test('Item 1: Admin Token & Localhost Defense Suite (SEC-06)', async (t) => {
    const validToken = 'a'.repeat(64);
    const wrongToken = 'b'.repeat(64);
    const app = createTestAdminApp(validToken);

    const server = createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    t.after(() => server.close());

    await t.test('1. /admin from 127.0.0.1 without token returns 401', async () => {
        const res = await fetch(`${baseUrl}/admin`);
        assert.equal(res.status, 401);
    });

    await t.test('2. /admin with a valid token returns 200', async () => {
        const res = await fetch(`${baseUrl}/admin`, {
            headers: { 'x-admin-token': validToken }
        });
        assert.equal(res.status, 200);
        const text = await res.text();
        assert.match(text, /Admin Shell/);
    });

    await t.test('3. /admin with a wrong token returns 403', async () => {
        const res = await fetch(`${baseUrl}/admin`, {
            headers: { 'x-admin-token': wrongToken }
        });
        assert.equal(res.status, 403);
    });

    await t.test('4. POST /api/admin/auto-accept/toggle without token returns 401', async () => {
        const res = await fetch(`${baseUrl}/api/admin/auto-accept/toggle`, {
            method: 'POST'
        });
        assert.equal(res.status, 401);
    });

    await t.test('5. POST /api/admin/auto-accept/toggle with valid token returns 200', async () => {
        const res = await fetch(`${baseUrl}/api/admin/auto-accept/toggle`, {
            method: 'POST',
            headers: { 'x-admin-token': validToken }
        });
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.success, true);
    });

    await t.test('6. /setup and /api/setup/* without token return 401', async () => {
        const resSetup = await fetch(`${baseUrl}/setup`);
        assert.equal(resSetup.status, 401);

        const resApiSetup = await fetch(`${baseUrl}/api/setup/status`);
        assert.equal(resApiSetup.status, 401);
    });

    await t.test('7. /setup with valid token returns 200', async () => {
        const resSetup = await fetch(`${baseUrl}/setup`, {
            headers: { 'x-admin-token': validToken }
        });
        assert.equal(resSetup.status, 200);

        const resApiSetup = await fetch(`${baseUrl}/api/setup/status`, {
            headers: { 'x-admin-token': validToken }
        });
        assert.equal(resApiSetup.status, 200);
    });

    await t.test('8. Reverse proxy headers (Tailscale Serve / X-Forwarded-For) are rejected with 403 even with token', async () => {
        const res = await fetch(`${baseUrl}/admin`, {
            headers: {
                'x-admin-token': validToken,
                'x-forwarded-for': '100.81.111.40'
            }
        });
        assert.equal(res.status, 403);

        const resTailscale = await fetch(`${baseUrl}/admin`, {
            headers: {
                'x-admin-token': validToken,
                'tailscale-user-login': 'alice@example.com'
            }
        });
        assert.equal(resTailscale.status, 403);
    });

    await t.test('9. Token file exists after start (and mode is 0600 on POSIX only)', async () => {
        const testDataDir = join(tmpdir(), `ag-admin-test-${Date.now()}`);
        const token = initAdminToken(testDataDir);
        const tokenPath = join(testDataDir, '.admin_token');

        assert.equal(existsSync(tokenPath), true);
        const readToken = readFileSync(tokenPath, 'utf8').trim();
        assert.equal(readToken, token);
        assert.equal(readToken.length, 64);

        if (process.platform !== 'win32') {
            const stats = statSync(tokenPath);
            const mode = stats.mode & 0o777;
            assert.equal(mode, 0o600, 'Token file must have 0600 permissions on POSIX');
        }

        // Clean up test temp dir
        rmSync(testDataDir, { recursive: true, force: true });
    });

    await t.test('10. Token file path is present in .gitignore', async () => {
        const gitignoreContent = readFileSync(join(process.cwd(), '.gitignore'), 'utf8');
        assert.match(gitignoreContent, /data\/\.admin_token/);
    });
});
