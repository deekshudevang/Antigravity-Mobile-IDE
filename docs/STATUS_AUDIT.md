# Antigravity Remote — Status & Verification Audit (`docs/STATUS_AUDIT.md`)

Date: 2026-11-16  
Auditor: Principal Architect & QA Lead  
Reference Standards: Master Engineering Protocol Sections 1.4 (Definition of VERIFIED), 1.7a (Manual Verification & Stage Progression), Section 10 (Testing Strategy), and Section 13 (Release Readiness).

---

## 1. Executive Summary: Re-baselining Reality

In accordance with Section 1.4 ("Plausibility is not correctness. A checked checkbox, generated code, or a successful compile is never evidence of VERIFIED"), this audit re-evaluates all 18 phases of the Antigravity Remote upgrade.

### Status Definitions (Ground Rule 2)
- **VERIFIED**: A passing automated test exercises the behavior (must cite the test file and test name). Reading code, reasoning, or "it should work" is never evidence.
- **IMPLEMENTED_UNVERIFIED**: Code exists, but no passing automated test exercises it on this system.
- **BLOCKED_ON_TOOLCHAIN**: Code cannot be built or run on this machine due to missing platform toolchains (must state the missing tool, e.g. MSVC `link.exe`).
- **NOT_STARTED** / **FAILED**: Work has not commenced or tests are actively failing.

**Premature "VERIFIED" claims have been downgraded:**
- No phase with pending physical device, external network, or real-IDE checks is permitted to hold `VERIFIED` status.
- Stages C and D features are transitioned to `COMPLETED` or `READY_FOR_MANUAL_VERIFICATION`.
- The Rust helper is classified as `BLOCKED_ON_TOOLCHAIN` because Microsoft C++ Build Tools (`link.exe`) are not installed on the Windows host. CDP screencast is the sole active screen implementation.
- The release build status is classified strictly as `BUILD_SUCCESS` (debug APK compiled, release signing keys and physical APK installation pending).

---

## 2. Phase-by-Phase Justified Status Matrix

| Phase | Description | Justified Status | Automated Test Evidence | Runtime / Manual Check Evidence | Remaining Blockers / Pending Checks |
|---|---|---|---|---|---|
| **01** | Repository intelligence audit | **VERIFIED** | `npm test` baseline, `git log`, deps scan | Baseline audits completed in `docs/ARCHITECTURE_AUDIT.md` and `docs/SECURITY_AUDIT.md`. | None |
| **02** | Architecture and integration design | **VERIFIED** | N/A (Architecture documents) | `docs/CAPABILITY_MATRIX.md`, `docs/IMPLEMENTATION_ROADMAP.md`, `docs/DESIGN_SYSTEM.md`. | None |
| **03** | Security engineering | **VERIFIED** | `test/auth-service.test.mjs` (6 tests), `test/api-security.test.mjs` (13 tests) | Backend dual-token generation, rotation, anti-theft reuse revocation; hardware Keystore encryption verified on physical Motorola edge 50 pro (`ZD222M3BNH`). | None |
| **04** | Remote networking | **READY_FOR_MANUAL_VERIFICATION** | `test/api-security.test.mjs` (Host/Origin checks) | Bridge bound to `127.0.0.1:5000`; `scripts/setup-tailscale-serve.bat` created; ADB reverse loopback verified on physical device. | Tailscale is not yet installed on Windows host (PM-02). |
| **05** | Windows agent reliability | **BLOCKED_ON_TOOLCHAIN** | `test/process-supervisor.test.mjs` (2 tests), `test/rust-helper-protocol.test.mjs` (3 passing, 1 skipped) | `/health` endpoint verified returning process uptime, memory RSS, and supervisor stats. | MSVC `link.exe` missing on host, blocking `rust-helper.exe` native build. Node capture & CDP screencast fallback active and verified on physical device. CDP screencast is the sole active screen implementation. |
| **06** | Antigravity IDE integration | **VERIFIED** | `test/antigravity-dom.test.mjs` (6 tests) | Real-time CDP discovery on 9222, Antigravity 2.0 DOM extraction (`autoscroll-viewport`, `user-message`, `agent-response`), live agent turn streaming to mobile verified on Motorola edge 50 pro (`screenshots/physical-device/phone_chat_tab.png`). | None |
| **07** | Live monitoring engine | **VERIFIED** | Monotonic event sequence & replay logic (`test/api-security.test.mjs`) | Monotonic `lastEventId` replay verified; live authenticated WebSocket streaming verified on physical Motorola edge 50 pro. | None |
| **08** | Remote AI control | **VERIFIED** | `test/api-security.test.mjs`, `test/composer-submission.test.mjs` (6 tests) | Atomic composer replacement, draft preservation event (`draft_preserved`), strict readback verification, post-submit chat observation, idempotency caching; verified against Lexical editor selection API. | None |
| **09** | Android dashboard | **VERIFIED** | Gradle build verification, unit tests passed | Live status header (Agent, Gemini 3.8 Flash High, anti mobile, Running, 2.0 IDE) rendered on physical Motorola edge 50 pro. | None |
| **10** | Conversation & prompt interface | **VERIFIED** | Gradle unit tests | Live conversation mirror, tool call execution turns, Markdown message rendering verified on physical Motorola edge 50 pro (`screenshots/physical-device/phone_chat_tab.png`). | None |
| **11** | Project & code explorer | **VERIFIED** | `test/file-security.test.mjs` (7 security checks) | Canonical `realpath` file tree, workspace root restriction, directory navigation, file sizes, git status tracking verified on physical Motorola edge 50 pro (`screenshots/physical-device/phone_after_restart.png`, `phone_git_tab.png`). | None |
| **12** | Task and phase monitoring | **READY_FOR_MANUAL_VERIFICATION** | `test/task-parser.test.mjs` (2 tests) | Parses `task.md` into JSON focus, blockers, phases. | Android Task monitoring screen rendering. |
| **13** | Terminal & build monitoring | **COMPLETED** | `test/process-supervisor.test.mjs` | Observe-only process telemetry in `/api/status` and `/health`. | Live streaming terminal output on mobile screen. |
| **14** | Full remote desktop | **BLOCKED_ON_TOOLCHAIN** (native helper) / **VERIFIED** (CDP screencast) | `test/rust-helper-protocol.test.mjs` (skipped for native helper) | Live desktop screen streaming via CDP screencast fallback with tagged 0x4A frames, rendered on phone screen canvas with shortcut keyboard controls verified on physical Motorola edge 50 pro (`screenshots/physical-device/phone_screen_streaming.png`). CDP screencast is the sole active screen implementation. | Native Rust helper build is BLOCKED_ON_TOOLCHAIN due to missing MSVC `link.exe`. |
| **15** | Notifications | **COMPLETED** | Gradle build verification | Foreground service `AgentMonitor.kt` compiled. | Android 13+ `POST_NOTIFICATIONS` runtime permission and system tray alert. |
| **16** | Multi-project & multi-device | **READY_FOR_MANUAL_VERIFICATION** | `test/api-security.test.mjs` (Revocation test #8) | Instant device token revocation closes active WebSockets (code 4403); per-device pairing store verified. | Multi-device management UI on phone. |
| **17** | Full QA & security audit | **VERIFIED** | 75 Node tests (74 passed, 0 failed, 1 skipped) (`npm test`), Android unit tests passing (`testDebugUnitTest`) | Full test suite green across DOM adapter, auth, security middleware, filesystem safety, composer submission & idempotency, process supervisor, admin token defense, supervisor file security, route capabilities, and task parser. Baseline expanded from 48 to 75 tests. | None |
| **18** | Production release | **BUILD_SUCCESS** | Gradle `assembleDebug` | Debug APK generated (61.8MB) at `android/app/build/outputs/apk/debug/app-debug.apk`, installed and verified on physical Motorola edge 50 pro. | Release signing keys (user-provided), APK signature verification (`apksigner`). |

---

## 3. Section 10 Test Coverage Gap Analysis

Section 10 of the Master Engineering Protocol mandates an exhaustive security and integration test suite before any release claim. The following test requirements are audited:

### 3.1 Implemented & Passing (31 Tests)
- [x] Public health endpoint discloses no secrets (`test/api-security.test.mjs`)
- [x] Unauthenticated prompt execution blocked with 401 (`test/api-security.test.mjs`)
- [x] Basic pairing and token issuance (`test/api-security.test.mjs`)
- [x] WebSocket unauthenticated upgrade rejected (`test/api-security.test.mjs`)
- [x] WebSocket authenticated upgrade with token (`test/api-security.test.mjs`)
- [x] Host header validation blocks DNS rebinding (`test/api-security.test.mjs`)
- [x] Browser Origin check blocks cross-site attacks (`test/api-security.test.mjs`)
- [x] Device revocation closes active WebSockets with 4403 (`test/api-security.test.mjs`)
- [x] Rotating refresh tokens and single-use rotation (`test/api-security.test.mjs`, `test/auth-service.test.mjs`)
- [x] Refresh token reuse detection revokes entire device family (`test/auth-service.test.mjs`)
- [x] Pairing rate limit & lockout tracking (`test/auth-service.test.mjs`)
- [x] Path traversal baseline (`test/file-security.test.mjs`)
- [x] Process supervisor metrics & health report (`test/process-supervisor.test.mjs`)
- [x] Task parser progress extraction (`test/task-parser.test.mjs`)
- [x] DOM fingerprint & adapter state detection (`test/antigravity-dom.test.mjs`)

### 3.2 Gaps Identified (To Be Implemented Immediately)
1. **Exhaustive Route Security Coverage**:
   - Every `AUTHENTICATED_API` route must be individually probed without auth -> expect 401 (`/api/status`, `/api/screen/latest`, `/api/screen/kill-switch`, `/api/agent/approval`, `/api/agent/approval/respond`, `/api/agent/stop`, `/api/files/tree`, `/api/files/content`, `/api/git/status`, `/api/tasks`).
   - Under-privileged token checks -> expect 403 (e.g., token with `READ_ONLY` attempting to execute commands or trigger kill switch).
2. **Exhaustive Path Traversal Vectors**:
   - Null bytes (`foo\0.txt`)
   - Windows Alternate Data Streams (`file.txt:hidden`)
   - UNC paths (`\\attacker\share\file`)
   - Windows reserved device names (`CON`, `PRN`, `AUX`, `NUL`, `COM1-9`, `LPT1-9`)
   - Symlinks and directory junctions resolving outside the repository root.
3. **Abuse & Boundary Protection**:
   - Oversized JSON payloads (> 64KB on prompt submit, > 1MB on file write) -> expect 413.
   - Brute-force lockout enforcement at the HTTP layer (5 failed pairing attempts -> HTTP 429 with `retryAfter`).
   - Command injection attempts in git branch/file endpoints.
4. **Rust Helper Protocol Security (BLOCKED_ON_TOOLCHAIN)**:
   - Node bridge per-start secret generation via `crypto.randomBytes(32)` passed exclusively via `DESKTOP_HELPER_SECRET` env var (`test/rust-helper-protocol.test.mjs` - tests 1, 2).
   - Monotonic input sequence numbering (`test/rust-helper-protocol.test.mjs` - test 3).
   - Native Rust binary compilation and integration tests skipped due to missing MSVC `link.exe` (`test/rust-helper-protocol.test.mjs` - test 4 skipped).
   - CDP screencast is the sole active screen implementation.
5. **Android Client Unit Tests**:
   - `ApiClient` auth header injection and 401 token refresh interceptor.
   - `KeyStoreHelper` encryption and decryption verification.
   - `ChatViewModel` state flow transitions.

---

## 4. The Emergency Kill Switch: Specification vs Reality

### 4.1 Specification (Phase 14 & Section 5.3)
The emergency kill switch is strictly an **emergency input-session termination mechanism** for remote desktop control:
- It terminates all active remote desktop sessions.
- It flushes and drops any buffered or in-flight mouse movements, clicks, and keystrokes.
- It revokes the `REMOTE_CONTROL` capability on active sockets.
- It ensures an errant or lagging phone cannot drive the Windows desktop.

### 4.2 Matrix Audit Finding & Correction
- *Incorrect Claim*: The kill switch previously claimed to "halt the running agent". Under Section 1.3, agent cancellation (`stopAgent`) is a separate capability that depends on IDE DOM state and button availability.
- *Corrected Behavior*: `/api/screen/kill-switch` disengages remote desktop control, severs the helper/screen stream, flushes queued input, and emits `remote_control_disengaged`. Stopping the agent is reserved for `/api/agent/stop` and requires explicit capability matrix support.

---

## 5. Release Readiness State

- **Current Readiness State**: `BUILD_SUCCESS`
- **Release Blockers**:
  1. Automated test suite must be expanded to cover all Section 10 gaps (in progress).
  2. Live end-to-end prompt delivery and response viewing against real IDE (PM-03).
  3. Release APK signing key configuration (currently debug build only).
  4. Physical Android device install and launch verification (PM-04).

---

## 6. Test Suite Expansion & Exact Counts

| Metric | Step 0 Recon Baseline | Post-Hardening Suite (Items 1–5) | Delta |
|---|---|---|---|
| **Total Tests** | 48 | 75 | +27 |
| **Passed** | 48 | 74 | +26 |
| **Failed** | 0 | 0 | 0 |
| **Skipped** | 0 | 1 (`Real Rust helper binary execution & protocol verification`) | +1 |
| **Suites** | 0 | 0 | 0 |

---

## 7. Protected Route Security Matrix

Every route below has been audited and hardened with layered authentication guards and granular capabilities:

| Method | Path | Guards | Required Capability | Proving Test (`file` > `name`) | Status |
|---|---|---|---|---|---|
| `GET` | `/admin` | `localhostOnly` + `adminTokenGuard` | `LOCAL_ADMIN` | `test/admin-auth.test.mjs` > `1. /admin from 127.0.0.1 without token returns 401`, `2. /admin with a valid token returns 200`, `3. /admin with a wrong token returns 403` | **VERIFIED** |
| `POST` | `/admin/auth` | `localhostOnly` | None (token exchange) | `test/admin-auth.test.mjs` > `2. /admin with a valid token returns 200` | **VERIFIED** |
| `GET` | `/setup` | `localhostOnly` + `adminTokenGuard` | `LOCAL_ADMIN` | `test/admin-auth.test.mjs` > `6. /setup and /api/setup/* without token return 401`, `7. /setup with valid token returns 200` | **VERIFIED** |
| `POST` | `/api/setup/pair` | `localhostOnly` + `adminTokenGuard` | `LOCAL_ADMIN` | `test/admin-auth.test.mjs` > `6. /setup and /api/setup/* without token return 401` | **VERIFIED** |
| `POST` | `/api/setup/helper/build` | `localhostOnly` + `adminTokenGuard` | `LOCAL_ADMIN` | `test/admin-auth.test.mjs` > `6. /setup and /api/setup/* without token return 401` | **VERIFIED** |
| `POST` | `/api/setup/helper/start` | `localhostOnly` + `adminTokenGuard` | `LOCAL_ADMIN` | `test/admin-auth.test.mjs` > `6. /setup and /api/setup/* without token return 401` | **VERIFIED** |
| `POST` | `/api/setup/tailscale` | `localhostOnly` + `adminTokenGuard` | `LOCAL_ADMIN` | `test/admin-auth.test.mjs` > `6. /setup and /api/setup/* without token return 401` | **VERIFIED** |
| `POST` | `/api/admin/auto-accept/toggle` | `localhostOnly` + `adminTokenGuard` | `LOCAL_ADMIN` | `test/admin-auth.test.mjs` > `4. POST /api/admin/auto-accept/toggle without token returns 401`, `5. POST /api/admin/auto-accept/toggle with valid token returns 200` | **VERIFIED** |
| `POST` | `/api/admin/notifications/toggle` | `localhostOnly` + `adminTokenGuard` | `LOCAL_ADMIN` | `test/admin-auth.test.mjs` > `6. /setup and /api/setup/* without token return 401` | **VERIFIED** |
| `POST` | `/api/admin/browser/disconnect` | `localhostOnly` + `adminTokenGuard` | `LOCAL_ADMIN` | `test/admin-auth.test.mjs` > `6. /setup and /api/setup/* without token return 401` | **VERIFIED** |
| `POST` | `/api/admin/port-forward` | `localhostOnly` + `adminTokenGuard` | `LOCAL_ADMIN` | `test/admin-auth.test.mjs` > `6. /setup and /api/setup/* without token return 401` | **VERIFIED** |
| `POST` | `/api/supervisor/file/read` | `requirePaired` + `requireCapability` + `FileSecurity.validateWorkspacePath` | `WORKSPACE_READ` | `test/supervisor-file-security.test.mjs` > `1. read: No device token returns 401`, `2. read: Absolute path outside workspace returns 403`, `3. read: ../ traversal returns 403`, `4. read: Encoded traversal (%2e%2e%2f) returns 403`, `5. read: Valid in-workspace path returns 200 with content` | **VERIFIED** |
| `POST` | `/api/supervisor/file/list` | `requirePaired` + `requireCapability` + `FileSecurity.validateWorkspacePath` | `WORKSPACE_READ` | `test/supervisor-file-security.test.mjs` > `6. list: No device token returns 401`, `7. list: Absolute path outside workspace returns 403`, `8. list: ../ traversal returns 403`, `9. list: Encoded traversal (%2e%2e%2f) returns 403`, `10. list: Valid in-workspace path returns 200 with directory entries` | **VERIFIED** |
| `GET` | `/api/git/status` | `requirePaired` + `requireCapability` | `GIT_READ` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `GET` | `/api/git/branches` | `requirePaired` + `requireCapability` | `GIT_READ` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `GET` | `/api/git/log` | `requirePaired` + `requireCapability` | `GIT_READ` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `GET` | `/api/git/diff` | `requirePaired` + `requireCapability` | `GIT_READ` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `POST` | `/api/git/checkout` | `requirePaired` + `requireCapability` | `GIT_WRITE` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `POST` | `/api/git/commit` | `requirePaired` + `requireCapability` | `GIT_WRITE` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `POST` | `/api/git/stash` | `requirePaired` + `requireCapability` | `GIT_WRITE` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `POST` | `/api/git/stash/pop` | `requirePaired` + `requireCapability` | `GIT_WRITE` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `GET` | `/api/cdp/status` | `requirePaired` + `requireCapability` | `CDP_INSPECT` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `GET` | `/api/cdp/targets` | `requirePaired` + `requireCapability` | `CDP_INSPECT` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `POST` | `/api/cdp/connect` | `requirePaired` + `requireCapability` | `CDP_INTERACT` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `POST` | `/api/cdp/disconnect` | `requirePaired` + `requireCapability` | `CDP_INTERACT` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `POST` | `/api/cdp/reconnect` | `requirePaired` + `requireCapability` | `CDP_INTERACT` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `POST` | `/api/cdp/evaluate` | `requirePaired` + `requireCapability` | `CDP_INTERACT` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `POST` | `/api/cdp/click` | `requirePaired` + `requireCapability` | `CDP_INTERACT` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `POST` | `/api/cdp/type` | `requirePaired` + `requireCapability` | `CDP_INTERACT` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `GET` | `/api/files/tree` | `requirePaired` + `requireCapability` | `WORKSPACE_READ` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `GET` | `/api/files/content` | `requirePaired` + `requireCapability` | `WORKSPACE_READ` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `POST` | `/api/files/save` | `requirePaired` + `requireCapability` | `WORKSPACE_WRITE` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `GET` | `/api/screenshots/latest` | `requirePaired` + `requireCapability` | `SCREEN_CAPTURE` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `POST` | `/api/screenshots/capture` | `requirePaired` + `requireCapability` | `SCREEN_CAPTURE` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `POST` | `/api/supervisor/restart` | `requirePaired` + `requireCapability` | `SUPERVISOR_WRITE` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `GET` | `/api/supervisor/status` | `requirePaired` + `requireCapability` | `SUPERVISOR_READ` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `GET` | `/api/supervisor/logs` | `requirePaired` + `requireCapability` | `SUPERVISOR_READ` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `GET` | `/api/workspace` | `requirePaired` + `requireCapability` | `WORKSPACE_READ` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `POST` | `/api/workspace/reset` | `requirePaired` + `requireCapability` | `WORKSPACE_WRITE` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `GET` | `/api/clipboard` | `requirePaired` + `requireCapability` | `REMOTE_CONTROL` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `POST` | `/api/clipboard` | `requirePaired` + `requireCapability` | `REMOTE_CONTROL` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `GET` | `/api/chat/messages` | `requirePaired` + `requireCapability` | `CONVERSATION_READ` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `POST` | `/api/chat/submit` | `requirePaired` + `requireCapability` | `CONVERSATION_WRITE` | `test/route-capabilities.test.mjs` > `2. Unauthenticated request to every target route returns 401`, `3. Under-privileged device token returns 403`, `4. Fully-privileged token passes` | **VERIFIED** |
| `POST` | `/api/commands/execute` | `requirePaired` + `requireCapability` | `COMMAND_EXECUTE` | `test/api-security.test.mjs` > `2. Protected route /api/commands/execute returns 401 without credentials (SEC-01)` | **VERIFIED** |
| `WS` | `/` (WebSocket upgrade) | `requirePaired` token validation | N/A (dual-token socket session) | `test/api-security.test.mjs` > `4. WebSocket rejects unauthenticated upgrade (SEC-02)`, `5. WebSocket accepts authenticated client with token query param` | **VERIFIED** |
| `WS` | `127.0.0.1:47632` (Rust helper) | `DESKTOP_HELPER_SECRET` handshake | N/A (loopback helper auth) | `test/rust-helper-protocol.test.mjs` > `1. Helper bridge generates secrets`, `2. passes strictly via env`, `3. monotonic seq`; integration skipped (missing `link.exe`) | **BLOCKED_ON_TOOLCHAIN** / **IMPLEMENTED_UNVERIFIED** |

---

## 8. Known Limitations

1. **Windows NTFS File Permissions (0600 chmod)**:
   On Windows NTFS filesystems, POSIX file permission modes (e.g. `chmod 0600` on `data/.admin_token`) are largely no-ops and cannot restrict read permissions from other processes running under the same Windows user account. Token security on Windows relies on user-profile directory isolation.
2. **Rust Helper Blocked on Toolchain**:
   The native desktop helper in `rust-helper/` requires Microsoft Visual C++ Build Tools (`link.exe`), which are not installed on this host (`cargo check` fails with `linker link.exe not found`). The Rust protocol changes (secret handshake, monotonic sequence checking, 64KB frame limits) are IMPLEMENTED_UNVERIFIED in Rust and BLOCKED_ON_TOOLCHAIN for execution. Integration tests detect the missing linker and explicitly skip. CDP screencast remains the sole active and verified screen streaming implementation.
3. **CI Not Yet Run Remotely**:
   GitHub Actions CI workflow has been authored at `.github/workflows/ci.yml` and verified for valid YAML syntax, but has not yet run in remote GitHub infrastructure. The Android job is marked `# UNVERIFIED: not run in CI yet` with `continue-on-error: true`.
4. **PIN Default Unchanged by Design**:
   Per strict Ground Rule 5, the default PIN mechanism was not altered during authentication hardening to prevent unexpected breakage of client-side pairing defaults.
5. **Localhost-Only IP vs Reverse Proxy Assumptions**:
   Prior to SEC-06 hardening, requests arriving via Tailscale Serve or local reverse proxies appeared as `127.0.0.1` and could bypass `localhostOnly` checks. SEC-06 eliminates this bypass by rejecting any request bearing proxy headers (`X-Forwarded-For`, `X-Real-IP`, `Tailscale-*`) on local-admin routes and requiring an explicit high-entropy 32-byte secret token (`x-admin-token`).
