import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTaskMarkdown, getTaskProgress } from '../src/task-parser.mjs';

test('Task Parser Suite (Phase 12)', async (t) => {
    await t.test('1. Parses task.md content extracting focus, blockers, and phases', () => {
        const sampleMarkdown = `
# Antigravity Remote Tracker

## Current Focus
Completing Stage C and testing Phase 12.

## Blockers
- Missing MSVC build tools
- CDP remote port needs debug launch

## PENDING_MANUAL
1. **PM-01 (Live IDE Debug Startup)**: Quit Antigravity IDE and run bat file.
2. **PM-02 (Tailscale Connectivity)**: Install Tailscale on phone.

## Phase Tracking

### Phase 01: Repository Intelligence Audit
- **Objective**: Full baseline inspection
- **Status**: **VERIFIED**

### Phase 02: Architecture and Integration Design
- **Objective**: Establish target architecture
- **Status**: **VERIFIED**

### Phase 03: Security Engineering
- **Objective**: Implement pairing lifecycle
- **Status**: **VERIFIED**

### Phase 12: Task and Phase Monitoring
- **Objective**: Incremental task.md parser
- **Status**: **IN_PROGRESS**
`;

        const parsed = parseTaskMarkdown(sampleMarkdown);
        assert.equal(parsed.currentFocus, 'Completing Stage C and testing Phase 12.');
        assert.equal(parsed.blockers.length, 2);
        assert.equal(parsed.blockers[0], 'Missing MSVC build tools');
        assert.equal(parsed.pendingManual.length, 2);
        assert.equal(parsed.phases.length, 4);

        assert.equal(parsed.phases[0].id, '01');
        assert.equal(parsed.phases[0].status, 'VERIFIED');
        assert.equal(parsed.phases[3].id, '12');
        assert.equal(parsed.phases[3].status, 'IN_PROGRESS');

        assert.equal(parsed.summary.total, 4);
        assert.equal(parsed.summary.verified, 3);
        assert.equal(parsed.summary.inProgress, 1);
        assert.ok(parsed.summary.percent > 70);
    });

    await t.test('2. getTaskProgress parses real project task.md', () => {
        const result = getTaskProgress();
        assert.equal(result.success, true);
        assert.ok(result.phases.length >= 18);
        assert.ok((result.summary.verified + result.summary.completed + result.summary.inProgress) >= 3);
    });
});
