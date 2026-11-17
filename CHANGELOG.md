# Changelog

All notable changes to **Antigravity Mobile IDE** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-11-17

### Security
- **Admin Token Defense (SEC-06)**: Added high-entropy 32-byte startup token (`data/.admin_token`, mode 0600) required via `x-admin-token` header or authenticated cookie on `/admin`, `/setup`, `/api/admin/*`, and `/api/setup/*`. Enforces `crypto.timingSafeEqual` and blocks requests with reverse proxy headers (`X-Forwarded-For`, `Tailscale-*`) from bypassing localhost checks.
- **Supervisor Path Traversal Protection**: Enforced strict `FileSecurity.validateWorkspacePath` on `/api/supervisor/file/read` and `/api/supervisor/file/list`, terminating directory traversal attacks (`../`, `%2e%2e%2f`), outside-workspace absolute paths, and unauthorized access with generic 403 responses.
- **Granular Scoped Capabilities RBAC**: Implemented capability-based access control across all 29 target endpoints (`/api/git/*`, `/api/cdp/*`, `/api/files/*`, `/api/screenshots/*`, `/api/supervisor/*`, `/api/workspace`, `/api/clipboard`, `/api/chat/*`). Added `GIT_READ` and `GIT_WRITE` capability separation.
- **Helper Protocol Hardening**: Replaced unauthenticated loopback helper listener with environment-isolated 32-byte secret handshake (`DESKTOP_HELPER_SECRET`), constant-time handshake verification, 64KB frame size limits, and monotonic input sequence numbering (`seq`) to prevent replay attacks.
- **Dependency Vulnerability Remediation**: Remediated critical/high vulnerabilities in `express`, `ws`, `body-parser`, `proxy-addr`, and `path-to-regexp` via targeted upgrades.

### Added
- **GitHub Actions CI (`.github/workflows/ci.yml`)**: Automated CI pipeline running Node test suites (`npm test`), WCAG contrast checks (`node scripts/check-contrast.mjs`), and Android unit tests (`testDebugUnitTest`).
- **Comprehensive Verification Suites**: Added 27 new automated tests across `admin-auth.test.mjs`, `supervisor-file-security.test.mjs`, `route-capabilities.test.mjs`, and `rust-helper-protocol.test.mjs` (75 total tests).

### Changed
- **Honest Platform Status Downgrades**: Updated `docs/CAPABILITY_MATRIX.md` and `docs/STATUS_AUDIT.md` to classify native Rust helper compilation as `BLOCKED_ON_TOOLCHAIN` (due to missing MSVC `link.exe` on Windows host) and established CDP screencast as the sole active and verified screen streaming implementation.
- **Background Event Loop Management**: Moved `HelperBridge.start()` inside `startServer()` and unreferenced background intervals in `src/telegram-bot.mjs` to prevent hangs during test runner imports.

---

## [1.0.0] - 2026-11-04

### Added
- **Antigravity 2.x Architecture Support**: Relocated chat extraction to inspect isolated iframe webview targets (`extensionView=true`) alongside root frame.
- **Dynamic CDP Port Resolution**: Integrated dynamic `DevToolsActivePort` inspection to discover active CDP instances.
- **Interactive Questionnaires**: Full extraction and dispatch for Antigravity 2.x `ask_question` and `ask_permission` cards.
- **Smart Quick-Response Chips**: Context-aware Quick Action buttons ('Yes', 'No', 'Continue', 'Stop') mapped to active IDE approval triggers.
- **Remote Stop Agent API**: Added `CDP.stopAgent()` and `POST /api/chat/stop-agent` to cancel active runs remotely.
- **Multi-Model Quota Polling**: Added live language server quota tracking for Antigravity 2.x hub processes (`agy.exe`).
- **Jetpack Compose Android App**: Native Material 3 Android companion application with dynamic theming.
