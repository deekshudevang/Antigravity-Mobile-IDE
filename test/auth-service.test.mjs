import test from 'node:test';
import assert from 'node:assert/strict';
import {
    generatePairingCode,
    pairDevice,
    validateAccessToken,
    refreshTokens,
    revokeDevice,
    getActivePairingStatus,
    CAPABILITIES,
    ROLE_BUNDLES
} from '../src/auth-service.mjs';

test('1. Pairing code generation & single-use lifecycle', () => {
    const { code, expiresInSeconds } = generatePairingCode();
    assert.equal(code.length, 6);
    assert.ok(expiresInSeconds > 0);

    const status = getActivePairingStatus();
    assert.equal(status.active, true);

    // Pair device with code
    const pairResult = pairDevice(code, 'Test Device', '127.0.0.1');
    assert.equal(pairResult.success, true);
    assert.ok(pairResult.accessToken.startsWith('agt_'));
    assert.ok(pairResult.refreshToken.startsWith('agr_'));
    assert.ok(pairResult.deviceId.startsWith('dev_'));

    // Code is single-use: pairing again with same code fails
    const secondTry = pairDevice(code, 'Attacker', '127.0.0.1');
    assert.equal(secondTry.success, false);
    assert.equal(secondTry.error, 'code_expired_or_invalid');
});

test('2. Access token validation & capabilities', () => {
    const { code } = generatePairingCode();
    const pairResult = pairDevice(code, 'Phone', '127.0.0.1');
    assert.equal(pairResult.success, true);

    // Validate with Bearer prefix
    const session = validateAccessToken(`Bearer ${pairResult.accessToken}`);
    assert.ok(session);
    assert.equal(session.deviceId, pairResult.deviceId);
    assert.ok(session.capabilities.includes(CAPABILITIES.STATUS_READ));
    assert.ok(session.capabilities.includes(CAPABILITIES.PROMPT_SUBMIT));

    // Validate without Bearer prefix
    const sessionBare = validateAccessToken(pairResult.accessToken);
    assert.ok(sessionBare);
    assert.equal(sessionBare.deviceId, pairResult.deviceId);

    // Invalid token returns null
    assert.equal(validateAccessToken('agt_invalid_token_12345'), null);
    assert.equal(validateAccessToken(''), null);
});

test('3. Token refresh and rotation', () => {
    const { code } = generatePairingCode();
    const pairResult = pairDevice(code, 'Phone 2', '127.0.0.1');
    assert.equal(pairResult.success, true);

    const oldRefresh = pairResult.refreshToken;
    const oldAccess = pairResult.accessToken;

    // Refresh token
    const refreshResult = refreshTokens(oldRefresh, '127.0.0.1');
    assert.equal(refreshResult.success, true);
    assert.ok(refreshResult.accessToken.startsWith('agt_'));
    assert.ok(refreshResult.refreshToken.startsWith('agr_'));
    assert.notEqual(refreshResult.refreshToken, oldRefresh);

    // New access token validates
    const newSession = validateAccessToken(refreshResult.accessToken);
    assert.ok(newSession);
    assert.equal(newSession.deviceId, pairResult.deviceId);
});

test('4. Refresh token reuse detection revokes device (anti-theft)', () => {
    const { code } = generatePairingCode();
    const pairResult = pairDevice(code, 'Phone 3', '127.0.0.1');
    assert.equal(pairResult.success, true);

    const initialRefresh = pairResult.refreshToken;

    // Normal refresh
    const firstRefresh = refreshTokens(initialRefresh, '127.0.0.1');
    assert.equal(firstRefresh.success, true);

    // Attacker tries to reuse initialRefresh
    const reuseAttempt = refreshTokens(initialRefresh, '10.0.0.5');
    assert.equal(reuseAttempt.success, false);
    assert.equal(reuseAttempt.error, 'token_reuse_detected_device_revoked');

    // Both old and new access tokens are now revoked!
    assert.equal(validateAccessToken(firstRefresh.accessToken), null);
    assert.equal(validateAccessToken(pairResult.accessToken), null);
});

test('5. Rate limiting & brute force lockout on pairing', () => {
    const ip = '192.168.1.100';
    generatePairingCode();

    // 5 invalid attempts
    for (let i = 0; i < 5; i++) {
        const res = pairDevice('WRONG1', 'Bot', ip);
        assert.equal(res.success, false);
    }

    // 6th attempt triggers rate limiting
    const lockedRes = pairDevice('WRONG2', 'Bot', ip);
    assert.equal(lockedRes.success, false);
    assert.equal(lockedRes.error, 'rate_limited');
    assert.ok(lockedRes.retryAfter > 0);
});

test('6. Explicit device revocation', () => {
    const { code } = generatePairingCode();
    const pairResult = pairDevice(code, 'Phone To Revoke', '127.0.0.1');
    assert.equal(pairResult.success, true);

    const sessionBefore = validateAccessToken(pairResult.accessToken);
    assert.ok(sessionBefore);

    const revoked = revokeDevice(pairResult.deviceId, 'manual_test');
    assert.equal(revoked, true);

    const sessionAfter = validateAccessToken(pairResult.accessToken);
    assert.equal(sessionAfter, null);
});
