/**
 * Pairing Service (Phase 03) — Dual-token pairing and authorization.
 *
 * Backed by AuthService:
 * - Single-use 5-minute pairing code with brute-force rate limiting.
 * - Issues short-lived access tokens + rotating single-use refresh credentials.
 * - Plaintext tokens are NEVER persisted (SHA-256 hashes only).
 * - Immediate revocation and WebSocket termination.
 */

import * as AuthService from './auth-service.mjs';

let lastGeneratedCode = null;

export function init() {
    const res = AuthService.generatePairingCode();
    lastGeneratedCode = res.code;
    console.log('\n┌─────────────────────────────────────────────┐');
    console.log(`│  Pairing code (valid 5 min):   ${res.code}       │`);
    console.log('│  Enter it once on the phone (Settings → Pair) │');
    console.log('└─────────────────────────────────────────────┘\n');
    return res;
}

export function getCode() {
    const status = AuthService.getActivePairingStatus();
    return status.active ? lastGeneratedCode : null;
}

export function pair(code, name = 'device', clientIp = '127.0.0.1') {
    const result = AuthService.pairDevice(code, name, clientIp);
    if (!result.success) return null;
    lastGeneratedCode = null; // burned
    return result.accessToken;
}

export function pairFull(code, name = 'device', clientIp = '127.0.0.1') {
    const result = AuthService.pairDevice(code, name, clientIp);
    if (result.success) lastGeneratedCode = null;
    return result;
}

export function isPaired(token) {
    if (!token) return false;
    return !!AuthService.validateAccessToken(token);
}

export function listDevices() {
    return AuthService.listPairedDevices();
}

export function revoke(deviceId) {
    return AuthService.revokeDevice(deviceId, 'user_requested');
}

export function rotateCode() {
    const res = AuthService.generatePairingCode();
    lastGeneratedCode = res.code;
    return res.code;
}

/**
 * Express middleware: require a valid device access token.
 * Checks Bearer header, x-device-token header, or body.token.
 */
export function requirePaired(req, res, next) {
    const token = req.get('authorization') || req.get('x-device-token') || req.body?.token;
    const session = AuthService.validateAccessToken(token);
    if (session) {
        req.authSession = session;
        return next();
    }
    res.status(401).json({ error: 'pairing_required', message: 'Valid device access token required' });
}
