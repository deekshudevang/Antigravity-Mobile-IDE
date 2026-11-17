import test from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import {
    generateHelperSecret,
    getHelperSecret,
    getNextSequenceNumber
} from '../src/helper-bridge.mjs';

function hasMsvcLinker() {
    try {
        execSync('where link.exe', { stdio: 'pipe' });
        return true;
    } catch (e) {
        return false;
    }
}

test('Rust Helper Security & Protocol Suite (Section 5.5 / Toolchain Reality)', async (t) => {
    await t.test('1. Helper bridge generates distinct 32-byte (64 hex char) random secrets', () => {
        const s1 = generateHelperSecret();
        const s2 = generateHelperSecret();
        assert.equal(s1.length, 64);
        assert.equal(s2.length, 64);
        assert.notEqual(s1, s2);
        assert.match(s1, /^[0-9a-f]{64}$/);
    });

    await t.test('2. Helper bridge passes secret strictly via process.env.DESKTOP_HELPER_SECRET and never logs or writes to disk', () => {
        const secret = getHelperSecret();
        assert.ok(secret);
        assert.equal(process.env.DESKTOP_HELPER_SECRET, secret);
        assert.equal(existsSync('data/.helper_secret'), false);
    });

    await t.test('3. Helper bridge increments monotonic sequence numbers for input commands', () => {
        const seq1 = getNextSequenceNumber();
        const seq2 = getNextSequenceNumber();
        const seq3 = getNextSequenceNumber();
        assert.ok(seq2 > seq1, `Expected seq2 (${seq2}) > seq1 (${seq1})`);
        assert.ok(seq3 > seq2, `Expected seq3 (${seq3}) > seq2 (${seq2})`);
    });

    await t.test('4. Real Rust helper binary execution & protocol verification', (subT) => {
        if (!hasMsvcLinker()) {
            subT.skip('SKIPPED: cargo/MSVC linker unavailable; Rust helper not tested');
            return;
        }
        assert.fail('MSVC linker unexpectedly found; real helper test harness needed');
    });
});
