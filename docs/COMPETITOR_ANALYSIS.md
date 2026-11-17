# Competitor Analysis & Ecosystem Landscape

This analysis reviews existing tools for remote monitoring and control of AI coding agents (specifically Antigravity IDE and Cursor), documenting strictly verifiable public facts.

---

## 1. Antigravity Ecosystem Tools

| Project / Tool | Repository / URL | Stack | Primary Capabilities | Networking / Security Model | License & Activity | Key Differentiator for Antigravity Mobile IDE |
|---|---|---|---|---|---|---|
| **OmniAntigravityRemoteChat** | `diegosouzapw/OmniAntigravityRemoteChat` | Node.js, Web frontend, CDP | Mirrors Antigravity chat sessions to mobile browser; model switching; multi-window support | Relies on public tunnels (Cloudflare, Pinggy); unauthenticated or basic web access | MIT; active community tool | Antigravity Mobile IDE provides a native Android app (Jetpack Compose), hardware Keystore security, and low-latency canvas screen streaming with keyboard modifier bar. |
| **Antimatter** | `saifmukhtar/antimatter` | Kotlin / Jetpack Compose, VS Code extension | Android companion; real-time agent transcripts; code diff reviews & approvals | Cloudflare Zero Trust tunnel | Open source; active | Antigravity Mobile IDE uses zero-cloud peer-to-peer Tailscale networking with dual-token hardware Keystore auth and local-only fallback, requiring no third-party cloud accounts. |
| **Antigravity Phone Chat** | `krishnakanthb13/antigravity_phone_chat` | Python / Node bridge, Web UI | Chat monitoring and basic command dispatching | ngrok, Cloudflare, Pinggy, or local Wi-Fi | Open source; recent | Antigravity Mobile IDE provides an end-to-end Git working-tree manager, workspace file explorer with syntax highlighting, and emergency remote desktop kill switch. |
| **AG2R** | `the-future-company/ag2r` | Web / Node client | Lightweight Antigravity 2.0 remote client | Local network / direct HTTP | Open source | Antigravity Mobile IDE features atomic composer replacement with pre-fill draft preservation (`draft_preserved`) and strict readback verification. |
| **Official Google Antigravity Remote** | Built-in IDE feature (`antigravity.google`) | Google Proprietary | Built-in Remote Control toggle and remote background agents | Google account ecosystem | Proprietary; official Google feature | Antigravity Mobile IDE is a lightweight, open-source community companion offering local device ownership, customized mobile dashboards, and peer-to-peer Tailscale transport without vendor cloud lock-in. |

---

## 2. Cursor AI Ecosystem Tools

| Project / Tool | Repository / URL | Stack | Primary Capabilities | Networking / Security Model |
|---|---|---|---|---|
| **CursorRemote** | `len5ky/CursorRemote` | TypeScript, WebSockets, Telegram bot | Real-time session monitoring, plan inspection, step approvals | Self-hosted WebSocket relay + optional Telegram bot |
| **deadhand** | `jdconley/deadhand` | Go / TypeScript, Web | Mobile web dashboard for local Cursor instances, agent prompts | Localhost / custom proxy |
| **Official Cursor iOS App** | `cursor.com` (App Store) | Native iOS | Cloud agent tracking, local agent pairing, code review approvals | Cursor Cloud Account auth |

---

## 3. Genuine Technical Differentiators for Antigravity Mobile IDE

Each differentiator below is verified directly in the repository source code and automated test suite:

1. **Native Android Client + Inlined Web Dashboard**:
   A dedicated Kotlin Jetpack Compose app with Material 3 dynamic theming, supplemented by a 209KB zero-dependency inlined HTML dashboard (`src/html-inline.mjs`) for low-bandwidth browser access.
2. **Atomic Composer Prompting with Draft Preservation**:
   Prompt submissions verify composer DOM state via CDP, preserve existing unsent drafts in a `draft_preserved` event, execute atomic selection replacement, and verify submission readback (`test/composer-submission.test.mjs`).
3. **Hardware Keystore & Anti-Theft Token Security**:
   Tokens are stored in Android `KeyStoreHelper`. Dual-token rotation immediately revokes the device and severing active WebSockets if an expired or stolen refresh token is reused (`test/auth-service.test.mjs`).
4. **Peer-to-Peer Private Networking**:
   Tailscale loopback isolation (`127.0.0.1:5000`) avoids exposing dev machines to the public internet, backed by SEC-06 reverse proxy protection against unauthorized local proxy bypasses.
5. **Integrated Dev Workflow**:
   Includes an interactive Git working-tree inspector/committer (`src/git-service.mjs`), realpath-secured workspace file editor (`src/file-security.mjs`), and task tracker parsing `task.md` (`src/task-parser.mjs`).
