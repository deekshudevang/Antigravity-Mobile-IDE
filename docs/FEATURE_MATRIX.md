# Canonical Feature Matrix

This matrix defines every user-facing capability of **Antigravity Mobile IDE**. All documentation, website copy, schema, release notes, and launch announcements must draw strictly from this canonical source of truth.

Status definitions:
- **verified**: Passing automated test or verified physical runtime execution recorded with exact proof.
- **partial**: Core functionality implemented, but specific sub-paths or platforms remain pending verification.
- **unverified**: Code exists in the repository, but has not yet been exercised by an automated test or confirmed physical run.
- **not implemented**: Planned or aspirational feature with no working implementation in the codebase.

---

## 1. Authentication, Pairing & Security

| Feature | Component | Source File(s) | How Verified | Status |
|---|---|---|---|---|
| Single-use 6-digit PIN Pairing | Node Bridge / Android | `src/pairing-service.mjs`, `android/.../SettingsViewModel.kt` | `test/api-security.test.mjs` ("Pairing code generation & single-use lifecycle", "Reused pairing code is rejected") | **verified** |
| Dual-token JWT Lifecycle (Access + Refresh) | Node Bridge / Android | `src/auth-service.mjs`, `android/.../ApiClient.kt` | `test/auth-service.test.mjs`, `test/api-security.test.mjs` ("Token refresh and rotation") | **verified** |
| Anti-theft Refresh Token Reuse Revocation | Node Bridge | `src/auth-service.mjs` | `test/auth-service.test.mjs` ("Refresh token reuse detection revokes device") | **verified** |
| Instant Device Revocation Closes Sockets | Node Bridge | `src/auth-service.mjs`, `src/http-server.mjs` | `test/api-security.test.mjs` ("Revoking device closes active sockets") | **verified** |
| Granular Scoped Capabilities RBAC | Node Bridge | `src/auth-service.mjs`, `src/http-server.mjs` | `test/route-capabilities.test.mjs` (5 tests), `test/api-security.test.mjs` ("Under-privileged token returns 403") | **verified** |
| Admin Token & Localhost Proxy Defense (SEC-06) | Node Bridge / Web Admin | `src/admin-auth.mjs`, `public/admin.html` | `test/admin-auth.test.mjs` (10 tests, timing-safe auth & proxy header blocking) | **verified** |
| Hardware Keystore Secret Storage | Android Client | `android/.../KeyStoreHelper.kt`, `SettingsStore.kt` | Android unit tests (`testDebugUnitTest`) + physical Motorola edge 50 pro run | **verified** |

---

## 2. Conversation & Live Agent Monitoring

| Feature | Component | Source File(s) | How Verified | Status |
|---|---|---|---|---|
| Real-time WebSocket Turn Streaming | Node Bridge / Android | `src/chat-stream.mjs`, `src/event-bus.mjs`, `android/.../LiveSocket.kt` | `test/api-security.test.mjs`, Android `testDebugUnitTest` | **verified** |
| Antigravity 2.0 DOM Message Extraction | Node Bridge | `src/antigravity-dom.mjs`, `src/cdp-client.mjs` | `test/antigravity-dom.test.mjs` (6 DOM adapter tests) | **verified** |
| Agent State Detection (`idle`, `running`, `approval`) | Node Bridge / Android | `src/antigravity-dom.mjs`, `android/.../ChatViewModel.kt` | `test/antigravity-dom.test.mjs` ("Agent state detection identifies idle, running, and waiting_approval") | **verified** |
| Markdown Message & Tool Call Turn Rendering | Android Client | `android/.../ChatScreen.kt`, `android/.../LifecycleTrack.kt` | Android Compose UI compilation & unit tests | **verified** |
| Human-in-the-Loop Decision Execution (`approve`/`reject`) | Node Bridge / Android | `src/antigravity-dom.mjs`, `src/http-server.mjs`, `android/.../ChatScreen.kt` | `test/antigravity-dom.test.mjs` ("Approval extraction and decision action") | **verified** |
| Remote Agent Stop / Cancellation | Node Bridge / Android | `src/antigravity-dom.mjs`, `src/http-server.mjs`, `android/.../ChatScreen.kt` | `test/antigravity-dom.test.mjs` ("Stop button execution") | **verified** |

---

## 3. Remote AI Composer & Prompt Submission

| Feature | Component | Source File(s) | How Verified | Status |
|---|---|---|---|---|
| Atomic Prompt Submission | Node Bridge | `src/cdp-client.mjs`, `src/http-server.mjs` | `test/composer-submission.test.mjs` (6 tests) | **verified** |
| Pre-filled Draft Preservation (`draft_preserved`) | Node Bridge | `src/cdp-client.mjs` | `test/composer-submission.test.mjs` ("Pre-filled composer is replaced cleanly and draft is preserved") | **verified** |
| Strict Composer Readback Verification | Node Bridge | `src/cdp-client.mjs` | `test/composer-submission.test.mjs` ("Composer readback mismatch fails command immediately") | **verified** |
| Idempotency Key Caching | Node Bridge | `src/http-server.mjs`, `src/cdp-client.mjs` | `test/composer-submission.test.mjs` ("Retries with same idempotency key are strictly idempotent") | **verified** |
| Multi-line & Unicode Prompt Preservation | Node Bridge | `src/cdp-client.mjs` | `test/composer-submission.test.mjs` ("Multi-line and special characters are preserved exactly") | **verified** |

---

## 4. Workspace & File Explorer

| Feature | Component | Source File(s) | How Verified | Status |
|---|---|---|---|---|
| Realpath Workspace Traversal Defense | Node Bridge | `src/file-security.mjs`, `src/http-server.mjs` | `test/file-security.test.mjs` (7 security checks), `test/supervisor-file-security.test.mjs` (10 checks) | **verified** |
| File Tree & Directory Navigation | Node Bridge / Android | `src/file-security.mjs`, `android/.../FilesViewModel.kt`, `FilesScreen.kt` | `test/route-capabilities.test.mjs`, Android `testDebugUnitTest` | **verified** |
| File Content Viewing with Syntax Highlighting | Node Bridge / Android | `src/http-server.mjs`, `android/.../CodeHighlighter.kt`, `FilesScreen.kt` | `test/route-capabilities.test.mjs`, Android unit tests | **verified** |
| In-Workspace File Saving | Node Bridge | `src/http-server.mjs`, `src/file-security.mjs` | `test/file-security.test.mjs` ("Cannot write to forbidden files (.env, .git)") | **verified** |
| Workspace Root Switching & Reset | Node Bridge / Android | `src/http-server.mjs`, `android/.../DirectoryPickerSheet.kt` | `test/route-capabilities.test.mjs` | **verified** |

---

## 5. Git Operations

| Feature | Component | Source File(s) | How Verified | Status |
|---|---|---|---|---|
| Working Tree Status & Branch Inspection | Node Bridge / Android | `src/git-service.mjs`, `android/.../GitViewModel.kt`, `GitScreen.kt` | `test/route-capabilities.test.mjs` (`GET /api/git/status`, `branches`, `log`, `diff`) | **verified** |
| Branch Checkout & Commit | Node Bridge | `src/git-service.mjs`, `src/http-server.mjs` | `test/route-capabilities.test.mjs` (`POST /api/git/checkout`, `commit`) | **verified** |
| Stash & Stash Pop | Node Bridge | `src/git-service.mjs`, `src/http-server.mjs` | `test/route-capabilities.test.mjs` (`POST /api/git/stash`, `stash/pop`) | **verified** |

---

## 6. Remote Desktop & Screen Mirroring

| Feature | Component | Source File(s) | How Verified | Status |
|---|---|---|---|---|
| CDP Screencast Live Screen Streaming | Node Bridge / Android | `src/cdp-client.mjs`, `src/http-server.mjs`, `android/.../ScreenScreen.kt` | Verified on physical device (`screenshots/physical-device/phone_screen_streaming.png`) | **verified** |
| Remote Shortcut Keyboard Strip (Ctrl, Alt, Shift, Escape, Enter, Arrows) | Android Client | `android/.../ScreenScreen.kt`, `RemoteInputRim.kt` | Android Jetpack Compose unit tests & manual screen run | **verified** |
| Emergency Remote Desktop Kill Switch | Node Bridge | `src/http-server.mjs`, `src/helper-bridge.mjs` | `test/api-security.test.mjs` (Kill switch terminates stream and emits `remote_control_disengaged`) | **verified** |
| Native DXGI Desktop Capture & Low-level Enigo Input | Rust Helper | `rust-helper/src/main.rs`, `server.rs`, `protocol.rs` | Source code complete; binary compilation blocked on missing MSVC `link.exe` | **unverified** (BLOCKED_ON_TOOLCHAIN) |
| Helper-to-Node Authenticated WebSocket Secret Handshake | Node Bridge / Rust | `src/helper-bridge.mjs`, `rust-helper/src/server.rs` | `test/rust-helper-protocol.test.mjs` (Tests 1–3 verified in Node; Rust binary test skipped) | **partial** |

---

## 7. Process Health & Task Monitoring

| Feature | Component | Source File(s) | How Verified | Status |
|---|---|---|---|---|
| Process Supervisor Metrics (Uptime, Memory RSS, Stats) | Node Bridge | `src/process-supervisor.mjs`, `src/http-server.mjs` | `test/process-supervisor.test.mjs` (2 tests) | **verified** |
| Task.md Progress Parser (Phases, Focus, Blockers) | Node Bridge | `src/task-parser.mjs` | `test/task-parser.test.mjs` (2 tests) | **verified** |
| Background Foreground Notification Service | Android Client | `android/.../AgentMonitor.kt`, `AgentActionReceiver.kt` | Compiles in Android debug APK; physical notification channel registered | **verified** |
| Inlined Zero-dependency Web Dashboard | Web Frontend | `src/html-inline.mjs`, `public/index.html` | Automated build test in `src/http-server.mjs` (209KB inlined bundle) | **verified** |
