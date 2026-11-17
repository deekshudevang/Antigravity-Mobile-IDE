import { randomBytes, timingSafeEqual } from 'crypto';
import { writeFileSync, mkdirSync, existsSync, chmodSync } from 'fs';
import { join } from 'path';

let currentAdminToken = null;

/**
 * Initializes a new random 32-byte hex admin token and writes it to data/.admin_token.
 * Overwrites on each startup.
 */
export function initAdminToken(dataDir) {
    if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
    }
    const token = randomBytes(32).toString('hex');
    currentAdminToken = token;

    const tokenPath = join(dataDir, '.admin_token');
    writeFileSync(tokenPath, token, { encoding: 'utf8', mode: 0o600 });

    try {
        chmodSync(tokenPath, 0o600);
    } catch {
        // Mode 0600 is best-effort on Windows NTFS
    }

    console.log('\n============================================================');
    console.log('🔑 [ADMIN SECURITY] Local Admin Token:');
    console.log(`   ${token}`);
    console.log('   Required for /admin, /setup, and /api/admin/* endpoints.');
    console.log('============================================================\n');

    return token;
}

/**
 * For testing: manually set or retrieve the admin token.
 */
export function setAdminToken(token) {
    currentAdminToken = token;
}

export function getAdminToken() {
    return currentAdminToken;
}

/**
 * Constant-time comparison between candidate token and the active admin token.
 */
export function verifyAdminToken(candidate) {
    if (!candidate || typeof candidate !== 'string' || !currentAdminToken) {
        return false;
    }
    const candBuf = Buffer.from(candidate, 'utf8');
    const actBuf = Buffer.from(currentAdminToken, 'utf8');
    if (candBuf.length !== actBuf.length) {
        return false;
    }
    return timingSafeEqual(candBuf, actBuf);
}

/**
 * Parses cookies from Cookie header string.
 */
function parseCookies(header = '') {
    const list = {};
    header.split(';').forEach(part => {
        const [name, ...val] = part.split('=');
        if (name && val.length > 0) {
            list[name.trim()] = decodeURIComponent(val.join('=').trim());
        }
    });
    return list;
}

/**
 * Localhost check: ensures request originates from loopback IP and was NOT forwarded
 * through a reverse proxy (e.g., Tailscale Serve, Cloudflare tunnels, or nginx).
 */
export function localhostOnly(req, res, next) {
    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '';
    const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';

    // Reverse proxies (Tailscale Serve, cloudflared, nginx) inject forwarding headers.
    // Loopback requests from external tunnels must NOT be granted admin access.
    const hasProxyHeaders = !!(
        req.headers['x-forwarded-for'] ||
        req.headers['x-forwarded-proto'] ||
        req.headers['tailscale-user-login'] ||
        req.headers['tailscale-user-name'] ||
        req.headers['cf-connecting-ip']
    );

    if (!isLocal || hasProxyHeaders) {
        return res.status(403).json({ error: 'Admin access is localhost only' });
    }
    next();
}

/**
 * Admin token middleware: requires x-admin-token header or admin_token cookie.
 * Does NOT accept token via query string to avoid log/history leakage.
 */
export function requireAdminToken(req, res, next) {
    const headerToken = req.headers['x-admin-token'];
    const cookies = parseCookies(req.headers['cookie']);
    const cookieToken = cookies['admin_token'];
    const token = headerToken || cookieToken;

    if (!token) {
        if (req.accepts && req.accepts('html') && !req.path.startsWith('/api/')) {
            // Provide a minimal login form for browser navigation when unauthenticated
            return res.status(401).send(renderAdminLoginHtml());
        }
        return res.status(401).json({ error: 'Missing admin token' });
    }

    if (!verifyAdminToken(token)) {
        return res.status(403).json({ error: 'Invalid admin token' });
    }

    next();
}

function renderAdminLoginHtml() {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Antigravity Admin Authentication</title>
    <style>
        body { background: #0F1215; color: #E6EDF3; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #161B22; border: 1px solid #30363D; padding: 2rem; border-radius: 8px; width: 360px; }
        h2 { margin-top: 0; font-size: 1.25rem; }
        p { color: #8B949E; font-size: 0.875rem; line-height: 1.4; }
        input { width: 100%; box-sizing: border-box; background: #0D1117; border: 1px solid #30363D; color: #FFF; padding: 0.5rem; border-radius: 4px; margin: 1rem 0; font-family: monospace; }
        button { width: 100%; background: #238636; color: #FFF; border: none; padding: 0.6rem; border-radius: 4px; font-weight: bold; cursor: pointer; }
        button:hover { background: #2EA043; }
        .error { color: #F85149; font-size: 0.8rem; display: none; margin-bottom: 0.5rem; }
    </style>
</head>
<body>
    <div class="card">
        <h2>Admin Authentication</h2>
        <p>Please enter the 32-byte admin token printed to your server console at startup.</p>
        <div id="err" class="error">Invalid token</div>
        <input type="password" id="tok" placeholder="Paste admin token here" autocomplete="off" />
        <button onclick="submitToken()">Authenticate</button>
    </div>
    <script>
        async function submitToken() {
            const tok = document.getElementById('tok').value.trim();
            if (!tok) return;
            const res = await fetch('/api/admin/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: tok })
            });
            if (res.ok) {
                sessionStorage.setItem('adminToken', tok);
                window.location.reload();
            } else {
                document.getElementById('err').style.display = 'block';
            }
        }
    </script>
</body>
</html>`;
}
