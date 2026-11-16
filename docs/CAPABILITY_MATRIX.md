# Antigravity Remote — Capability Matrix

Date of Probe: 2026-11-16  
Environment: Windows 11 (Build 26100), Node.js v24.19.0, OpenJDK 17.0.20.1  
Antigravity Process Status: Running (PID 7676, 'Antigravity IDE.exe' without `--remote-debugging-port`)  

Per Section 1.3 of the Master Engineering Protocol:
- If a live Antigravity session is unavailable during Stage A, static code analysis and automated adapter tests against recorded/fake CDP data must be performed.
- Every real-IDE capability must be marked UNTESTED and given the exact manual probe the user must run, with evidence to capture.
- Capabilities are marked SUPPORTED, PARTIAL, UNSUPPORTED, or UNTESTED.

---

## 1. Capability Matrix Summary

| Capability | How it is probed | Result | Evidence / Notes | Break-Detection / Limitation |
|---|---|---|---|---|
| **CDP discovery & target selection** | HTTP probe to `http://127.0.0.1:<port>/json/list` and inspect `DevToolsActivePort` file in `%APPDATA%\Antigravity IDE` | **PARTIAL** (Observed file discovery working; live socket UNTESTED) | `DevToolsActivePort` was located at `%APPDATA%\Antigravity IDE\DevToolsActivePort` pointing to port 9000, but port 9000 connection was refused. Active IDE process (PID 7676) launched without `--remote-debugging-port`. Automated mock tests verify discovery parser. | **Fragile**: If Antigravity changes `DevToolsActivePort` location or format, discovery fails loudly with clear diagnostic error. |
| **Read conversation** | CDP `Runtime.evaluate` on DOM selectors in Cascade/Agent panel (`find-chat`, `#cascade`, `.conversation`) | **UNTESTED** (Mock Verified) | Static adapter in `src/antigravity-dom.mjs` and `src/chat-stream.mjs` targets DOM elements. Live IDE lacks open CDP port. Unit tests verify adapter against recorded snapshot fixtures. | **Fragile**: DOM-selector based. Must isolate selectors into version-fingerprinted adapter module (`src/antigravity-dom.mjs`). |
| **Detect agent state** (running / idle / waiting / error) | CDP inspection of action buttons, status labels ("Worked for", "Thinking", spinner) | **UNTESTED** (Mock Verified) | Real-IDE probe requires live CDP port. Inferred vs observed states must be strictly distinguished in API and UI. | Observed states must come directly from DOM attributes (`aria-label`, data attributes); inferred states are labeled `inferred`. |
| **Submit a prompt** | CDP `Input.insertText` / DOM injection into `#antigravity.agentSidePanelInputBox` followed by Enter key / Submit button click | **UNTESTED** (Mock Verified) | Existing code uses `injectAndSubmit` in `src/cdp-client.mjs`. Live probe pending manual startup with `--remote-debugging-port=9222`. | Must return command lifecycle: `SUBMITTED` -> `ACCEPTED_BY_BRIDGE` -> `DELIVERED_TO_IDE` -> `STARTED`. |
| **Confirm agent received & started it** | Observe DOM mutation / agent state transition after submission (e.g. appearance of user message turn and agent "Thinking"/"Worked for" block) | **UNTESTED** (Mock Verified) | Code currently assumes success on Enter key. Needs explicit DOM observer transition to confirm receipt. | Never report "executed" or "started" when bridge merely accepted prompt text. |
| **Read approval requests** | CDP query for command approval dialogs / buttons (e.g., "Run", "Allow", "Reject", "Always Allow") | **UNTESTED** (Mock Verified) | Existing `getPendingApprovals` queries specific class and button text. Live IDE probe pending. | **Fragile**: Dependent on button text / aria labels. Adapter fingerprinting required. |
| **Approve / reject** | CDP `clickElementByXPath` on approval buttons | **UNTESTED** (Mock Verified) | `respondToApproval` in `src/cdp-client.mjs` executes XPath click. | Requires DEVELOPER permission level. Returns explicit error if button cannot be clicked. |
| **Stop / cancel** | CDP query and click on "Stop" button during active agent execution | **UNTESTED** (Mock Verified) | `stopAgent` in `src/cdp-client.mjs` clicks `div[aria-label="Stop"]`. | If Antigravity version lacks visible Stop button, backend returns explicit `unsupported` status; UI disables button with explanation. |
| **Selected model & quota** | Quota service reading language server metrics / SQLite DB in `%APPDATA%\Antigravity\User\globalStorage\state.vscdb` or CDP DOM dropdown | **PARTIAL** (Observed quota service structure, live UNTESTED) | Language server / DB path exists on Windows. Live reading needs verification against current Antigravity version. | Inferred / cached quota labeled as such; missing quota reported as `unavailable`. |
| **Desktop capture and input** | Rust helper screen capture via DXGI/Desktop Duplication and input injection via `enigo` | **PARTIAL** (Architecture ready, build blocked by missing MSVC `link.exe` on host; Node fallback available) | Rust helper source code exists (`rust-helper/src/main.rs`). `cargo build` on host failed due to missing MSVC `link.exe`. Node-based screenshot capture is implemented as fallback. | Live input requires paired device identity + REMOTE_CONTROL permission + emergency local kill switch. |

---

## 2. Real-IDE Capability Verification Steps (PENDING_MANUAL)

To verify all capabilities against the live, running Antigravity IDE:

1. **Quit Antigravity IDE completely**:
   Ensure all `Antigravity IDE.exe` processes have exited.
2. **Launch Antigravity IDE with Remote Debugging Port**:
   Run the debug launcher:
   ```cmd
   scripts\start-antigravity-ide-debug.bat
   ```
   Or manually:
   ```cmd
   "%LOCALAPPDATA%\Programs\Antigravity IDE\Antigravity IDE.exe" --remote-debugging-port=9222
   ```
3. **Run the Automated Capability Probe**:
   ```cmd
   node scripts/cdp-probe.mjs 9222 find-chat
   node scripts/cdp-probe.mjs 9222 ids
   node scripts/cdp-probe.mjs 9222 survey
   ```
4. **Capture Evidence**:
   Save probe JSON output to `data/evidence/cdp-probe-live.json`.
5. **Update Matrix**:
   Record exact observed elements and transition capabilities from `UNTESTED` to `SUPPORTED` or `PARTIAL`.
