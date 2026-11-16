# Antigravity Remote — Implementation Roadmap

Date: 2026-11-16  
Status: Stage A Baseline Audit  

---

## 1. Staged Execution Plan

### Stage A: Baseline & Intelligence Audit (Phases 01–02)
- **Exit Criteria**: Skills discovery recorded; audit documents written (`ARCHITECTURE_AUDIT.md`, `SECURITY_AUDIT.md`, `API_INVENTORY.md`, `FEATURE_GAP_ANALYSIS.md`, `CAPABILITY_MATRIX.md`); baseline build and test results documented; capability matrix probed with real-IDE/mock fallback.
- **Status**: Completed in Stage A.

---

### Stage B: Secure Vertical Slice (Phases 03 in full + MVP of 04, 05, 06, 07, 08, 14)
The vertical slice delivers the first end-to-end milestone:
1. **Phase 03 (Security Engineering — Full Scope)**:
   - Cryptographically random single-use 5-minute pairing code with global and code-fingerprint rate limits.
   - Dual-token lifecycle: short-lived 15-minute access token + single-use rotating refresh credential.
   - Server stores SHA-256 token hashes only; timing-safe equality checks.
   - Android Keystore-backed encrypted token storage (`EncryptedSharedPreferences` / Keystore DataStore); `android:allowBackup="false"`.
   - Loopback-only binding (`127.0.0.1`); reject external interface binding.
   - Full capability-based authorization engine (`READ_ONLY`, `DEVELOPER`, `REMOTE_CONTROL`, `ADMIN`).
   - Automated security test suite verifying 401 unauthenticated and 403 forbidden responses on every protected route.
2. **Phase 04 (Remote Networking — MVP)**:
   - Tailscale Serve architecture documentation and loopback reverse-proxy verification.
   - Android independent state reporting (Tailscale integration, tailnet reachability, bridge, auth).
3. **Phase 05 (Windows Agent Reliability — MVP)**:
   - Node-to-Helper authentication using a securely generated per-start shared secret.
   - Bounded restart budget and supervisor health endpoint.
4. **Phase 06 (Antigravity IDE Integration — MVP)**:
   - Centralize DOM selectors into version-fingerprinted `src/antigravity-dom.mjs`.
   - Break-detection strategy returning clear diagnostic status on selector mismatch.
   - Mock CDP server fixture for automated regression testing.
5. **Phase 07 (Live Monitoring Engine — MVP)**:
   - Monotonic event numbering (`id`, `timestamp`, `source`, `type`, `payload`).
   - Distinguish observed vs inferred states.
   - WebSocket connection authentication and heartbeat.
6. **Phase 08 (Remote AI Control — MVP)**:
   - Explicit prompt delivery lifecycle state machine:
     `SUBMITTED` -> `ACCEPTED_BY_BRIDGE` -> `DELIVERED_TO_IDE` -> `STARTED` -> `COMPLETED`.
   - Idempotency key tracking to prevent duplicate prompt execution.
7. **Phase 14 (Full Remote Desktop — MVP)**:
   - Bounded frame buffer (drop oldest on slow clients).
   - Authenticated input injection with `REMOTE_CONTROL` capability verification.
   - Emergency local kill-switch hotkey.

**Stage B Milestone Acceptance Test (Section 1.7)**:
- Verified automatically via integration test suite and marked `READY_FOR_MANUAL_VERIFICATION` for real-device/real-network checks.

---

### Stage C: Reliability & Advanced Features (Phases 04–16 Full Completion)
- **Phase 04 (Full)**: Comprehensive connection recovery, reconnection backoff, tailnet ACL configuration guide.
- **Phase 05 (Full)**: Diagnostic reporting of CPU, memory, and network RSS metrics in bridge.
- **Phase 06 (Full)**: Multi-target Antigravity 2.0 vs IDE source switching and auto-recovery.
- **Phase 07 (Full)**: `lastEventId` event replay and buffer resume after network drop.
- **Phase 08 (Full)**: Approval response handling with optional PIN step-up.
- **Phase 09 (Android Dashboard)**: Full Compose UI with Material 3 tokens, UI/UX Pro Max guidelines, error badges, quota cards.
- **Phase 10 (Conversation & Prompt Interface)**: Markdown message rendering, prompt execution timeline, approval response cards.
- **Phase 11 (Project & Code Explorer)**: Canonical `realpath` file tree, sensitive file deny-list, git diff viewer, staging/committing.
- **Phase 12 (Task & Phase Monitoring)**: Dedicated `task.md` parser and tracking UI.
- **Phase 13 (Terminal & Build Monitoring)**: Observe-only build process monitor with stdout/stderr caps.
- **Phase 15 (Notifications)**: Local Android foreground service notification engine.
- **Phase 16 (Multi-Project & Multi-Device)**: RBAC device management, per-device capability assignment, immediate revocation.

---

### Stage D: Hardening & Production Release (Phases 17–18)
- **Phase 17 (Full QA & Security Audit)**:
  - Run comprehensive test suites across Node, Android, and Protocol.
  - Zero failing or skipped tests.
  - Final security audit verification (DNS rebinding, path traversal, token reuse, brute force lockout).
- **Phase 18 (Production Release & Packaging)**:
  - Gradle `assembleDebug` and `assembleRelease` builds.
  - Windows service/startup scripts (`install.bat`, `start.bat`, `stop.bat`, `health-check.ps1`).
  - Documentation validation and release status reporting (`RELEASE_APPROVED` / `READY_FOR_MANUAL_VERIFICATION`).
