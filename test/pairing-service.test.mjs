import test from 'node:test';
import assert from 'node:assert/strict';
import * as Pairing from '../src/pairing-service.mjs';

test('Pairing Service Adapter', () => {
    // 1. Init generates a 6-char code
    const initRes = Pairing.init();
    assert.equal(initRes.code.length, 6);
    assert.equal(Pairing.getCode(), initRes.code);

    // 2. Successful pair returns an access token
    const token = Pairing.pair(initRes.code, 'Test Device', '127.0.0.1');
    assert.ok(token);
    assert.ok(token.startsWith('agt_'));
    assert.equal(Pairing.isPaired(token), true);

    // 3. Code burned (single use)
    assert.equal(Pairing.getCode(), null);
    const failPair = Pairing.pair(initRes.code, 'Attacker', '127.0.0.1');
    assert.equal(failPair, null);

    // 4. Fake token is not paired
    assert.equal(Pairing.isPaired('agt_fake_nonexistent'), false);

    // 5. Rotate code generates a new code
    const newCode = Pairing.rotateCode();
    assert.equal(newCode.length, 6);
    assert.equal(Pairing.getCode(), newCode);
});
