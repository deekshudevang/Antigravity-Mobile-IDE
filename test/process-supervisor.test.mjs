import test from 'node:test';
import assert from 'node:assert/strict';
import { ProcessSupervisor, getHealthReport } from '../src/process-supervisor.mjs';

test('Process Supervisor & Health Suite (Phase 05)', async (t) => {
    await t.test('1. ProcessSupervisor tracks stats, uptime, and memory', () => {
        const supervisor = new ProcessSupervisor({
            name: 'test-supervisor',
            minBackoffMs: 100,
            maxBackoffMs: 500
        });

        const stats = supervisor.getStats();
        assert.equal(stats.name, 'test-supervisor');
        assert.equal(typeof stats.uptimeSeconds, 'number');
        assert.ok(stats.memory.rssMb > 0);
        assert.equal(stats.totalRestarts, 0);
    });

    await t.test('2. getHealthReport returns clean JSON with system & connection status', async () => {
        const mockCdp = {
            async isAvailable() { return { available: true }; }
        };
        const mockHelper = {
            isConnected() { return true; }
        };

        const report = await getHealthReport(mockCdp, mockHelper);
        assert.equal(report.status, 'healthy');
        assert.equal(report.service, 'antigravity-remote-bridge');
        assert.equal(report.version, '2.0.0');
        assert.equal(report.cdp.available, true);
        assert.equal(report.helper.connected, true);
        assert.ok(report.memory.rssMb > 0);
        assert.equal(typeof report.uptimeSeconds, 'number');
    });
});
