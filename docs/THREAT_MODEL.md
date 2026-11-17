# Threat Model & System Security Architecture (`docs/THREAT_MODEL.md`)

**Date**: 2026-11-17  
**Scope**: Threat analysis for Antigravity Mobile IDE (Desktop Bridge, Android App, Rust Helper, and Network Transport)

---

## 1. System Overview & Trust Boundaries

Antigravity Mobile IDE allows developers to monitor and control local AI coding sessions running in Antigravity IDE on a Windows 11 host from an Android phone.

### Trust Boundaries:
1. **The Host Boundary**: The Windows workstation running Antigravity IDE, local repositories, shell tools, and the Node.js bridge.
2. **The Local Network / Tailnet Boundary**: The transport link between the Android device and the host machine (peer-to-peer Tailscale VPN or private LAN).
3. **The Mobile Boundary**: The Android phone running the native companion application and storing authentication credentials.

---

## 2. Threat Vector Analysis & Mitigations

### 2.1 Threat Vector 1: Unauthorized Network Access (Eavesdropping & Impersonation)
- **Threat**: An attacker on the same local Wi-Fi or compromised Tailnet node attempts to view conversation streams, file contents, or inject commands.
- **Mitigations**:
  - **Loopback Binding**: The Node bridge binds exclusively to `127.0.0.1:5000` (`src/http-server.mjs`). It is never exposed on `0.0.0.0`.
  - **Tailscale Transport Encryption**: All remote communication is routed over Tailscale's WireGuard mesh network, providing end-to-end cryptographic encapsulation and mutual authentication.
  - **Dual-Token Authentication**: All protected API endpoints (`/api/*`) and WebSocket upgrades require a valid `Authorization: Bearer <access_token>` or WebSocket token parameter verified against `data/devices.json`.
  - **Reverse Proxy Header Rejection (SEC-06)**: Local-admin endpoints (`/admin`, `/setup`) reject incoming requests bearing reverse proxy headers (`X-Forwarded-For`, `X-Real-IP`, `Tailscale-*`) to prevent spoofing `127.0.0.1` remote addresses.

### 2.2 Threat Vector 2: Pairing Code Brute-Force & Replay
- **Threat**: An attacker attempts to guess a 6-digit pairing PIN or replay an expired pairing code to register an unauthorized device.
- **Mitigations**:
  - **Cryptographic Entropy**: 6-digit pairing codes are generated using cryptographically secure random integers (`crypto.randomInt(100000, 999999)`).
  - **Single-Use Lifecycle**: Pairing codes are strictly single-use; once submitted, the code is immediately purged from memory.
  - **5-Minute Expiration**: Codes automatically expire after 300 seconds if not claimed.
  - **HTTP Rate Limiting**: Pairing attempts are throttled (`src/auth-service.mjs`). After 5 consecutive failed attempts, the client IP is locked out for 15 minutes, returning HTTP 429 (`Too Many Requests`).

### 2.3 Threat Vector 3: Credential Theft & Mobile Device Loss
- **Threat**: An attacker extracts access or refresh tokens from an Android device to issue unauthorized commands.
- **Mitigations**:
  - **Hardware-Backed Keystore Storage**: Android credentials are encrypted with AES-256-GCM using keys stored in the Android Hardware Keystore (`android/.../KeyStoreHelper.kt`).
  - **Backup Disabled**: `android:allowBackup="false"` in `AndroidManifest.xml` prevents credentials from being extracted via Android ADB cloud/local backups.
  - **Short-Lived Access Tokens**: Access tokens carry a short 15-minute expiration timestamp.
  - **Rotating Refresh Tokens & Anti-Theft Revocation**: Refresh tokens are single-use and rotate upon every refresh call. If an already-used refresh token is presented, the system treats it as an active token theft attempt and revokes the entire device token family and terminates open WebSockets immediately.
  - **Remote Device Revocation**: Administrators can revoke any paired device via `/api/auth/revoke` or the admin console, closing active connections with WebSocket code `4403`.

### 2.4 Threat Vector 4: Arbitrary Host File Access & Traversal
- **Threat**: An authenticated mobile client attempts to read sensitive files outside the project workspace (e.g. `C:\Windows\System32`, `~/.ssh/id_rsa`, `.env`).
- **Mitigations**:
  - **Canonical Path Resolution**: `FileSecurity.validateWorkspacePath` resolves all paths to their true canonical target using `fs.realpathSync`, preventing bypasses via symlinks, hardlinks, or Windows directory junctions.
  - **Traversal Denials**: Paths containing `../`, encoded traversal `%2e%2e%2f`, or null bytes are rejected with generic 403 Forbidden responses.
  - **Sensitive File Deny-List**: Direct access to `.env`, `.git/`, `.admin_token`, key files, and keystores is explicitly denied.
  - **Windows Device Name Denials**: Reserved Windows device names (`CON`, `PRN`, `AUX`, `NUL`, `COM1-9`, `LPT1-9`) and UNC paths (`\\attacker\share`) are rejected.

### 2.5 Threat Vector 5: Remote Desktop Control Hijacking
- **Threat**: Malicious or erratic input sent over screen mirroring drives unintended actions on the Windows desktop.
- **Mitigations**:
  - **Emergency Kill Switch**: The `/api/screen/kill-switch` endpoint disengages remote control immediately, severing the stream, flushing queued input commands, and emitting `remote_control_disengaged`.
  - **Monotonic Input Sequence Numbers**: Every input command includes a monotonic sequence counter (`seq`). Out-of-order or duplicate sequence numbers are dropped as replay attacks.
  - **Payload Limits**: WebSocket frames exceeding 64KB are rejected.

---

## 3. Residual Risks & Known Limitations

1. **Windows NTFS Permissions**: POSIX file permissions (`chmod 0600`) on `data/.admin_token` are no-ops on Windows NTFS. Security relies on Windows user profile directory isolation.
2. **Native Rust Helper Toolchain**: The native `desktop-helper.exe` requires Microsoft C++ Build Tools (`link.exe`) to link. Without it, the system operates on the verified CDP screencast engine.
3. **Localhost Single-User Assumption**: The local admin panel assumes processes running as the local user are trusted. The 32-byte admin token guards against cross-process WebSockets and proxy bypasses.
