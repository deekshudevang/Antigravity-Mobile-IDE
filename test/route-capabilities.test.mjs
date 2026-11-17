import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { app } from '../src/http-server.mjs';
import {
    generatePairingCode,
    pairDevice,
    updateDeviceCapabilities,
    createWebSocketUpgradeHandler,
    CAPABILITIES
} from '../src/auth-service.mjs';

function extractTargetRoutes(appInstance) {
    const targetRoutes = [];
    function processStack(stack, prefix = '') {
        for (const layer of stack) {
            if (layer.route) {
                const path = prefix + layer.route.path;
                for (const m of Object.keys(layer.route.methods)) {
                    if (layer.route.methods[m]) {
                        targetRoutes.push({
                            method: m.toUpperCase(),
                            path,
                            stack: layer.route.stack
                        });
                    }
                }
            } else if (layer.name === 'router' && layer.handle?.stack) {
                let routePrefix = '';
                if (layer.regexp) {
                    const match = layer.regexp.source.match(/\\\/(.*?)(?=\\\/|\(\?|\$)/);
                    if (match) routePrefix = '/' + match[1];
                }
                processStack(layer.handle.stack, prefix + routePrefix);
            }
        }
    }
    processStack(appInstance._router.stack);
    return targetRoutes.filter(r => /^\/api\/(git|cdp|files|screenshots|supervisor)/.test(r.path));
}

function resolveTestPath(routePath) {
    return routePath
        .replace(':filename', 'test.jpg')
        .replace(':index', '0')
        .replace(':id', '1');
}

test('Item 3: Scoped Capability & Unprotected Route Families Suite', async (t) => {
    // Enumerate target routes from the live app
    const targetRoutes = extractTargetRoutes(app);

    // Start server on an ephemeral port
    const wss = new WebSocketServer({ noServer: true });
    const server = createServer(app);
    server.on('upgrade', createWebSocketUpgradeHandler(wss));

    await new Promise((resolve) => {
        server.listen(0, '127.0.0.1', resolve);
    });

    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    // Create a fully-privileged device token
    const pair1 = generatePairingCode();
    const res1 = pairDevice(pair1.code, 'Fully Privileged Device', '127.0.0.1');
    assert.equal(res1.success, true);
    const fullToken = res1.accessToken;
    const devIdFull = res1.deviceId;
    updateDeviceCapabilities(devIdFull, Object.values(CAPABILITIES));

    // Create an under-privileged (zero capabilities) device token
    const pair2 = generatePairingCode();
    const res2 = pairDevice(pair2.code, 'Zero Capability Device', '127.0.0.1');
    assert.equal(res2.success, true);
    const restrictedToken = res2.accessToken;
    const devIdRestricted = res2.deviceId;
    updateDeviceCapabilities(devIdRestricted, []);

    try {
        await t.test('1. Regression tripwire: live app has target routes registered with auth guards', () => {
            assert.ok(targetRoutes.length >= 35, `Expected >= 35 target routes, found ${targetRoutes.length}`);
            for (const route of targetRoutes) {
                assert.ok(
                    route.stack.length >= 2,
                    `Route ${route.method} ${route.path} has no auth guard layer (stack size: ${route.stack.length})`
                );
            }
        });

        await t.test('2. Unauthenticated request to every target route returns 401 Unauthorized', async () => {
            for (const route of targetRoutes) {
                const urlPath = resolveTestPath(route.path);
                const res = await fetch(`${baseUrl}${urlPath}`, {
                    method: route.method,
                    headers: { 'Content-Type': 'application/json' },
                    body: route.method !== 'GET' && route.method !== 'HEAD' ? JSON.stringify({}) : undefined
                });
                assert.equal(
                    res.status,
                    401,
                    `Route ${route.method} ${route.path} should return 401 without auth, got ${res.status}`
                );
            }
        });

        await t.test('3. Under-privileged device token to every target route returns 403 Forbidden', async () => {
            for (const route of targetRoutes) {
                const urlPath = resolveTestPath(route.path);
                const res = await fetch(`${baseUrl}${urlPath}`, {
                    method: route.method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${restrictedToken}`
                    },
                    body: route.method !== 'GET' && route.method !== 'HEAD' ? JSON.stringify({}) : undefined
                });
                assert.equal(
                    res.status,
                    403,
                    `Route ${route.method} ${route.path} should return 403 for under-privileged token, got ${res.status}`
                );
            }
        });

        await t.test('4. Fully-privileged device token passes auth guard for every target route (status != 401/403)', async () => {
            const failedRoutes = [];
            for (const route of targetRoutes) {
                const urlPath = resolveTestPath(route.path);
                const res = await fetch(`${baseUrl}${urlPath}`, {
                    method: route.method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${fullToken}`
                    },
                    body: route.method !== 'GET' && route.method !== 'HEAD' ? JSON.stringify({}) : undefined
                });
                if (res.status === 401 || res.status === 403) {
                    failedRoutes.push(`${route.method} ${route.path} -> ${res.status}`);
                }
            }
            assert.deepEqual(failedRoutes, [], `Some routes failed auth with full token: ${failedRoutes.join(', ')}`);
        });

        await t.test('5. WebSocket upgrade without token is rejected with 401 Unauthorized', async () => {
            const wsUrl = baseUrl.replace('http://', 'ws://');
            const rejected = await new Promise((resolve) => {
                const ws = new WebSocket(wsUrl);
                ws.on('unexpected-response', (req, res) => {
                    try { ws.terminate(); } catch (e) {}
                    resolve({ rejected: true, status: res.statusCode });
                });
                ws.on('open', () => {
                    try { ws.terminate(); } catch (e) {}
                    resolve({ rejected: false, status: 200 });
                });
                ws.on('error', (err) => {
                    try { ws.terminate(); } catch (e) {}
                    resolve({ rejected: true, error: err.message });
                });
            });

            assert.equal(rejected.rejected, true);
            if (rejected.status) {
                assert.equal(rejected.status, 401);
            }
        });
    } finally {
        try {
            await fetch(`${baseUrl}/api/files/unwatch`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${fullToken}` }
            });
        } catch (e) {}
        try { wss.close(); } catch (e) {}
        if (server) {
            if (typeof server.closeAllConnections === 'function') {
                server.closeAllConnections();
            }
            await new Promise((resolve) => server.close(resolve));
        }
        try {
            const { getGlobalDispatcher } = await import('undici');
            await getGlobalDispatcher().destroy();
        } catch (e) {}
    }
});
