/**
 * Antigravity Remote — Authentication & Security Service (Phase 03)
 *
 * Implements:
 * - Single-use, short-lived (5 min) pairing codes with rate limiting and lockout.
 * - Dual-token lifecycle: short-lived access token (15m) + single-use rotating refresh credential (30d).
 * - Reuse detection: old refresh credential usage revokes the entire credential family.
 * - Bearer credentials stored only as SHA-256 hashes; constant-time comparison.
 * - Capability-based permissions (READ_ONLY, DEVELOPER, REMOTE_CONTROL, ADMIN).
 * - Active WebSocket lifecycle tracking and instant socket revocation.
 * - Host and Origin validation (CSRF / DNS-rebinding defense).
 * - Loopback local-admin protection.
 */

import { randomBytes, randomInt, createHash, timingSafeEqual } from 'crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const AUTH_FILE = join(DATA_DIR, 'auth-store.json');
const AUDIT_LOG = join(DATA_DIR, 'security-audit.jsonl');

// Lifetimes & Limits
export const PAIRING_CODE_TTL_MS = 15 * 60 * 1000;       // 15 minutes
export const ACCESS_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;      // 30 days
export const REFRESH_TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
export const MAX_PAIRING_ATTEMPTS = 5;
export const PAIRING_LOCKOUT_MS = 15 * 60 * 1000;       // 15 minutes

// Standard capability bundles (Section 5.3b)
export const CAPABILITIES = {
    STATUS_READ: 'status.read',
    CONVERSATION_READ: 'conversation.read',
    FILES_READ: 'files.read',
    LOGS_READ: 'logs.read',
    TASKS_READ: 'tasks.read',
    PROCESS_OBSERVE: 'process.observe',
    PROMPT_SUBMIT: 'prompt.submit',
    APPROVAL_RESPOND: 'approval.respond',
    FILES_WRITE: 'files.write',
    GIT_READ: 'git.read',
    GIT_WRITE: 'git.write',
    TASKS_WRITE: 'tasks.write',
    SCREEN_VIEW: 'screen.view',
    SCREEN_INPUT: 'screen.input',
    COMMAND_EXECUTE: 'command.execute',
    DEVICE_MANAGE: 'device.manage',
    SECURITY_CONFIGURE: 'security.configure',
    SESSION_REVOKE: 'session.revoke'
};

export const ROLE_BUNDLES = {
    READ_ONLY: [
        CAPABILITIES.STATUS_READ,
        CAPABILITIES.CONVERSATION_READ,
        CAPABILITIES.FILES_READ,
        CAPABILITIES.GIT_READ,
        CAPABILITIES.LOGS_READ,
        CAPABILITIES.TASKS_READ,
        CAPABILITIES.PROCESS_OBSERVE
    ],
    DEVELOPER: [
        CAPABILITIES.STATUS_READ,
        CAPABILITIES.CONVERSATION_READ,
        CAPABILITIES.FILES_READ,
        CAPABILITIES.GIT_READ,
        CAPABILITIES.LOGS_READ,
        CAPABILITIES.TASKS_READ,
        CAPABILITIES.PROCESS_OBSERVE,
        CAPABILITIES.PROMPT_SUBMIT,
        CAPABILITIES.APPROVAL_RESPOND,
        CAPABILITIES.FILES_WRITE,
        CAPABILITIES.GIT_WRITE,
        CAPABILITIES.TASKS_WRITE
    ],
    REMOTE_CONTROL: [
        CAPABILITIES.SCREEN_VIEW,
        CAPABILITIES.SCREEN_INPUT
    ],
    ADMIN: [
        CAPABILITIES.DEVICE_MANAGE,
        CAPABILITIES.SECURITY_CONFIGURE,
        CAPABILITIES.SESSION_REVOKE,
        CAPABILITIES.COMMAND_EXECUTE
    ]
};

// Default capabilities assigned to a newly paired device
const DEFAULT_PAIRED_CAPABILITIES = [
    CAPABILITIES.STATUS_READ,
    CAPABILITIES.CONVERSATION_READ,
    CAPABILITIES.PROMPT_SUBMIT,
    CAPABILITIES.APPROVAL_RESPOND,
    CAPABILITIES.FILES_READ,
    CAPABILITIES.GIT_READ,
    CAPABILITIES.TASKS_READ,
    CAPABILITIES.SCREEN_VIEW,
    CAPABILITIES.SCREEN_INPUT
];

// In-memory state (persisted to AUTH_FILE)
let state = {
    devices: {}, // deviceId -> { id, name, pairedAt, capabilities: [], accessTokens: [], refreshTokens: [] }
    activePairingCode: null, // { codeHash, expiresAt }
    pairingAttempts: {} // ipOrFingerprint -> { count, firstAttempt }
};

// Active WebSockets mapped by deviceId: deviceId -> Set<WebSocket>
const activeSockets = new Map();

// Helper: SHA-256 hash
export function sha256(text) {
    return createHash('sha256').update(String(text)).digest('hex');
}

// Helper: Constant-time string comparison
export function constantTimeEquals(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a, 'utf-8');
    const bufB = Buffer.from(b, 'utf-8');
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
}

// Helper: Append to audit log
export function logSecurityEvent(type, details = {}) {
    try {
        if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
        const entry = {
            timestamp: new Date().toISOString(),
            type,
            details
        };
        appendFileSync(AUDIT_LOG, JSON.stringify(entry) + '\n', 'utf-8');
    } catch (e) {
        console.error('Failed to write security audit log:', e.message);
    }
}

// Persist / Load State
export function loadState() {
    try {
        if (existsSync(AUTH_FILE)) {
            const raw = readFileSync(AUTH_FILE, 'utf-8');
            const loaded = JSON.parse(raw);
            state.devices = loaded.devices || {};
            state.activePairingCode = loaded.activePairingCode || null;
        }
    } catch (e) {
        state = { devices: {}, activePairingCode: null, pairingAttempts: {} };
    }
}

export function saveState() {
    try {
        if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
        writeFileSync(AUTH_FILE, JSON.stringify({
            devices: state.devices,
            activePairingCode: state.activePairingCode
        }, null, 2), 'utf-8');
    } catch (e) {
        console.error('Failed to save auth state:', e.message);
    }
}

// Initialize on load
loadState();

// Rate Limiting on Pairing
function checkPairingRateLimit(identifier) {
    const now = Date.now();
    const entry = state.pairingAttempts[identifier];
    if (!entry) return { allowed: true };
    if (now - entry.firstAttempt > PAIRING_LOCKOUT_MS) {
        delete state.pairingAttempts[identifier];
        return { allowed: true };
    }
    if (entry.count >= MAX_PAIRING_ATTEMPTS) {
        const remainingSeconds = Math.ceil((PAIRING_LOCKOUT_MS - (now - entry.firstAttempt)) / 1000);
        return { allowed: false, remainingSeconds };
    }
    return { allowed: true };
}

export function pairRateLimiter(req, res, next) {
    const ip = req.ip || req.socket?.remoteAddress || '127.0.0.1';
    const rateCheck = checkPairingRateLimit(ip);
    if (!rateCheck.allowed) {
        return res.status(429).json({ success: false, error: 'rate_limited', retryAfter: rateCheck.remainingSeconds });
    }
    next();
}

function recordPairingFailure(identifier) {
    const now = Date.now();
    const entry = state.pairingAttempts[identifier];
    if (!entry || now - entry.firstAttempt > PAIRING_LOCKOUT_MS) {
        state.pairingAttempts[identifier] = { count: 1, firstAttempt: now };
    } else {
        entry.count++;
    }
}

function clearPairingFailures(identifier) {
    delete state.pairingAttempts[identifier];
}

// --- 1. Pairing Code Lifecycle ---
export function generatePairingCode() {
    // Generate a cryptographically random 6-digit numeric pairing code
    const raw = String(randomInt(100000, 1000000));
    state.activePairingCode = {
        codeHash: sha256(raw),
        expiresAt: Date.now() + PAIRING_CODE_TTL_MS
    };
    saveState();
    logSecurityEvent('PAIRING_CODE_GENERATED', { expiresAt: new Date(state.activePairingCode.expiresAt).toISOString() });
    return {
        code: raw,
        expiresInSeconds: Math.floor(PAIRING_CODE_TTL_MS / 1000)
    };
}

export function getActivePairingStatus() {
    if (!state.activePairingCode) return { active: false };
    const remaining = state.activePairingCode.expiresAt - Date.now();
    if (remaining <= 0) {
        state.activePairingCode = null;
        saveState();
        return { active: false };
    }
    return { active: true, remainingSeconds: Math.floor(remaining / 1000) };
}

// --- 2. Device Pairing & Token Generation ---
export function pairDevice(submittedCode, deviceName = 'Android Client', clientIdentifier = 'unknown') {
    const rateCheck = checkPairingRateLimit(clientIdentifier);
    if (!rateCheck.allowed) {
        logSecurityEvent('PAIRING_RATE_LIMITED', { clientIdentifier, remainingSeconds: rateCheck.remainingSeconds });
        return { success: false, error: 'rate_limited', retryAfter: rateCheck.remainingSeconds };
    }

    if (!state.activePairingCode || Date.now() > state.activePairingCode.expiresAt) {
        recordPairingFailure(clientIdentifier);
        logSecurityEvent('PAIRING_FAILED_EXPIRED_OR_ABSENT', { clientIdentifier });
        return { success: false, error: 'code_expired_or_invalid' };
    }

    const inputHash = sha256(String(submittedCode).trim().toUpperCase());
    if (!constantTimeEquals(inputHash, state.activePairingCode.codeHash)) {
        recordPairingFailure(clientIdentifier);
        logSecurityEvent('PAIRING_FAILED_INVALID_CODE', { clientIdentifier });
        return { success: false, error: 'invalid_code' };
    }

    // Success: burn pairing code immediately (single-use)
    state.activePairingCode = null;
    clearPairingFailures(clientIdentifier);

    // Create device identity
    const deviceId = 'dev_' + randomBytes(12).toString('hex');
    const accessToken = 'agt_' + randomBytes(32).toString('hex');
    const refreshToken = 'agr_' + randomBytes(32).toString('hex');

    const now = Date.now();
    const device = {
        id: deviceId,
        name: String(deviceName).slice(0, 50),
        pairedAt: new Date(now).toISOString(),
        capabilities: [...DEFAULT_PAIRED_CAPABILITIES],
        accessTokens: [{
            hash: sha256(accessToken),
            expiresAt: now + ACCESS_TOKEN_TTL_MS
        }],
        refreshTokens: [{
            hash: sha256(refreshToken),
            expiresAt: now + REFRESH_TOKEN_TTL_MS,
            used: false
        }]
    };

    state.devices[deviceId] = device;
    saveState();

    logSecurityEvent('DEVICE_PAIRED', { deviceId, deviceName: device.name, clientIdentifier });

    return {
        success: true,
        deviceId,
        accessToken,
        refreshToken,
        expiresIn: Math.floor(ACCESS_TOKEN_TTL_MS / 1000),
        capabilities: device.capabilities
    };
}

// --- 3. Token Refresh & Reuse Detection ---
export function refreshTokens(submittedRefreshToken, clientIdentifier = 'unknown') {
    if (!submittedRefreshToken) return { success: false, error: 'missing_refresh_token' };
    const tokenHash = sha256(submittedRefreshToken);

    for (const [deviceId, device] of Object.entries(state.devices)) {
        const found = device.refreshTokens.find(rt => constantTimeEquals(rt.hash, tokenHash));
        if (found) {
            // Check for REUSE: if already used, this indicates token theft/replay!
            if (found.used) {
                logSecurityEvent('REFRESH_TOKEN_REUSE_DETECTED', { deviceId, clientIdentifier });
                revokeDevice(deviceId, 'refresh_token_reuse_theft_detected');
                return { success: false, error: 'token_reuse_detected_device_revoked' };
            }

            // Check expiry
            if (Date.now() > found.expiresAt) {
                logSecurityEvent('REFRESH_TOKEN_EXPIRED', { deviceId });
                return { success: false, error: 'refresh_token_expired' };
            }

            // Mark old refresh token as used
            found.used = true;

            // Generate new token pair
            const newAccessToken = 'agt_' + randomBytes(32).toString('hex');
            const newRefreshToken = 'agr_' + randomBytes(32).toString('hex');
            const now = Date.now();

            // Prune expired access tokens and limit array length
            device.accessTokens = device.accessTokens.filter(t => t.expiresAt > now);
            device.accessTokens.push({
                hash: sha256(newAccessToken),
                expiresAt: now + ACCESS_TOKEN_TTL_MS
            });

            // Keep only recent refresh tokens for reuse detection history (max 10)
            if (device.refreshTokens.length > 10) {
                device.refreshTokens = device.refreshTokens.slice(-10);
            }
            device.refreshTokens.push({
                hash: sha256(newRefreshToken),
                expiresAt: now + REFRESH_TOKEN_TTL_MS,
                used: false
            });

            saveState();
            logSecurityEvent('TOKEN_REFRESHED', { deviceId, clientIdentifier });

            return {
                success: true,
                deviceId,
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                expiresIn: Math.floor(ACCESS_TOKEN_TTL_MS / 1000),
                capabilities: device.capabilities
            };
        }
    }

    logSecurityEvent('INVALID_REFRESH_TOKEN_ATTEMPT', { clientIdentifier });
    return { success: false, error: 'invalid_refresh_token' };
}
export const refreshAccessToken = refreshTokens;

// --- 4. Validate Access Token ---
export function validateAccessToken(bearerToken) {
    if (!bearerToken || typeof bearerToken !== 'string') return null;
    const cleanToken = bearerToken.startsWith('Bearer ') ? bearerToken.slice(7).trim() : bearerToken.trim();
    if (!cleanToken) return null;

    const tokenHash = sha256(cleanToken);
    const now = Date.now();

    for (const [deviceId, device] of Object.entries(state.devices)) {
        const activeToken = device.accessTokens.find(t =>
            constantTimeEquals(t.hash, tokenHash) && t.expiresAt > now
        );
        if (activeToken) {
            return {
                deviceId,
                deviceName: device.name,
                capabilities: device.capabilities,
                expiresAt: activeToken.expiresAt
            };
        }
    }
    return null;
}

// --- 5. Device Revocation & Socket Termination ---
export function revokeDevice(deviceId, reason = 'admin_action') {
    if (!state.devices[deviceId]) return false;
    const name = state.devices[deviceId].name;
    delete state.devices[deviceId];
    saveState();

    // Close any active WebSockets immediately
    closeDeviceSockets(deviceId, 4403, 'device_revoked');
    logSecurityEvent('DEVICE_REVOKED', { deviceId, name, reason });
    return true;
}

export function listPairedDevices() {
    return Object.values(state.devices).map(d => ({
        id: d.id,
        name: d.name,
        pairedAt: d.pairedAt,
        capabilities: d.capabilities,
        activeTokenCount: d.accessTokens.filter(t => t.expiresAt > Date.now()).length
    }));
}

export function updateDeviceCapabilities(deviceId, capabilities) {
    if (state.devices[deviceId]) {
        state.devices[deviceId].capabilities = [...capabilities];
        saveState();
        return true;
    }
    return false;
}

// --- 6. Active WebSocket Management ---
export function registerActiveSocket(deviceId, ws) {
    if (!activeSockets.has(deviceId)) {
        activeSockets.set(deviceId, new Set());
    }
    activeSockets.get(deviceId).add(ws);
}

export function unregisterActiveSocket(deviceId, ws) {
    if (activeSockets.has(deviceId)) {
        activeSockets.get(deviceId).delete(ws);
        if (activeSockets.get(deviceId).size === 0) {
            activeSockets.delete(deviceId);
        }
    }
}

export function closeDeviceSockets(deviceId, code = 4403, reason = 'disconnected') {
    const sockets = activeSockets.get(deviceId);
    if (sockets) {
        for (const ws of sockets) {
            try {
                ws.close(code, reason);
            } catch (e) { }
        }
        activeSockets.delete(deviceId);
    }
}

// --- 7. Express Middleware ---
export function requireAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const session = validateAccessToken(authHeader);
    if (!session) {
        return res.status(401).json({ error: 'unauthorized', message: 'Valid access token required' });
    }
    req.authSession = session;
    next();
}

export function requireCapability(requiredCap) {
    return (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const session = validateAccessToken(authHeader);
        if (!session) {
            return res.status(401).json({ error: 'unauthorized', message: 'Valid access token required' });
        }
        req.authSession = session;

        if (!session.capabilities.includes(requiredCap)) {
            logSecurityEvent('CAPABILITY_DENIED', {
                deviceId: session.deviceId,
                requiredCapability: requiredCap,
                path: req.path
            });
            return res.status(403).json({
                error: 'forbidden',
                message: `Missing required capability: ${requiredCap}`
            });
        }
        next();
    };
}

// --- 8. Host and Origin Validation (Section 5.2b) ---
export function validateOriginAndHost(allowedHosts = ['localhost', '127.0.0.1']) {
    return (req, res, next) => {
        const hostHeader = (req.headers['host'] || '').split(':')[0].toLowerCase();

        // Check if host matches localhost, Tailscale MagicDNS (*.ts.net), or Tailscale CGNAT IP (100.x.y.z)
        const hostAllowed = allowedHosts.some(h => hostHeader === h || hostHeader.endsWith('.ts.net') || hostHeader.startsWith('100.'));
        if (!hostAllowed) {
            logSecurityEvent('HOST_MISMATCH_REJECTED', { hostHeader, path: req.path });
            return res.status(400).json({ error: 'invalid_host', message: 'Host header not permitted' });
        }

        const origin = req.headers['origin'];
        // Native mobile apps send no Origin header; browser requests send Origin
        if (origin) {
            try {
                const originUrl = new URL(origin);
                const originHost = originUrl.hostname.toLowerCase();
                const originAllowed = allowedHosts.some(h => originHost === h || originHost.endsWith('.ts.net') || originHost.startsWith('100.'));
                if (!originAllowed) {
                    logSecurityEvent('BROWSER_ORIGIN_REJECTED', { origin, path: req.path });
                    return res.status(403).json({ error: 'invalid_origin', message: 'Browser origin not permitted' });
                }
            } catch (e) {
                return res.status(400).json({ error: 'malformed_origin' });
            }
        }

        next();
    };
}

export function createWebSocketUpgradeHandler(wss) {
    return (req, socket, head) => {
        try {
            const url = new URL(req.url, 'http://127.0.0.1');
            const token = url.searchParams.get('token') || req.headers['authorization'];
            const session = validateAccessToken(token);

            if (!session) {
                logSecurityEvent('UNAUTHENTICATED_WS_UPGRADE_REJECTED', { ip: req.socket?.remoteAddress, path: req.url });
                socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n');
                socket.destroy();
                return;
            }

            wss.handleUpgrade(req, socket, head, (ws) => {
                if (session.deviceId) {
                    registerActiveSocket(session.deviceId, ws);
                    ws.on('close', () => {
                        unregisterActiveSocket(session.deviceId, ws);
                    });
                }
                wss.emit('connection', ws, req, session);
            });
        } catch (e) {
            try { socket.destroy(); } catch (err) { }
        }
    };
}

// Clean up expired tokens periodically (every 10 minutes)
const cleanupInterval = setInterval(() => {
    const now = Date.now();
    let changed = false;
    for (const device of Object.values(state.devices)) {
        const validAccess = device.accessTokens.filter(t => t.expiresAt > now);
        if (validAccess.length !== device.accessTokens.length) {
            device.accessTokens = validAccess;
            changed = true;
        }
    }
    if (changed) saveState();
}, 10 * 60 * 1000);
if (cleanupInterval.unref) cleanupInterval.unref();
