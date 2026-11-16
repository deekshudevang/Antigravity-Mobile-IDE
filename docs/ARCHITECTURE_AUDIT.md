# Antigravity Remote — Architecture Audit

Date: 2026-11-16  
Auditor: Principal Architect  
Status: Stage A Baseline Audit  

---

## 1. System Overview & Data Flow

Antigravity Remote consists of four core subsystems:
1. **Android Client (`android/`)**: Native Kotlin / Jetpack Compose / Material 3 application. Communicates with the bridge via HTTPS REST and WSS WebSocket.
2. **Node.js Bridge (`src/`)**: Central orchestrator running on the Windows 11 host. Manages CDP connection to Antigravity IDE, authentication, task monitoring, file services, git operations, and relays screen frames and input to/from the Rust helper.
3. **Rust Desktop Helper (`rust-helper/`)**: Native Windows background helper for desktop capture (DXGI Desktop Duplication / JPEG / H.264) and low-level mouse/keyboard input injection (`enigo`).
4. **Antigravity IDE / 2.0**: The AI development environment exposing Chrome DevTools Protocol (CDP) on loopback for workspace inspection, conversation mirroring, prompt submission, and approval response.

```
┌────────────────────────────────────────────────────────┐
│ Android Device (Phone)                                 │
│ Jetpack Compose UI (M3) ── DataStore (Encrypted)       │
│ OkHttp (TLS) ── WebSocket (WSS)                        │
└──────────────────────────┬─────────────────────────────┘
                           │ Tailscale Tunnel (WireGuard)
┌──────────────────────────▼─────────────────────────────┐
│ Windows 11 Host                                        │
│  [Tailscale Serve] (TLS Termination, Port 443/5000)    │
│            │ (Loopback proxy to 127.0.0.1:5000)        │
│  ┌─────────▼────────────────────────────────────────┐  │
│  │ Node.js Bridge (127.0.0.1:5000)                  │  │
│  │ - Auth & Session Engine (Hashed tokens, RBAC)    │  │
│  │ - CDP Adapter (DOM Isolation, Lifecycle FSM)     │  │
│  │ - File & Git Service (realpath verification)     │  │
│  │ - Task Service (task.md watcher & parser)        │  │
│  │ - Helper Bridge (Authenticated WS link)          │  │
│  └──────┬───────────────────────────────┬───────────┘  │
│         │ Loopback WS (47632 + Secret)  │ Loopback CDP │
│  ┌──────▼─────────────┐       ┌─────────▼───────────┐  │
│  │ Rust Desktop Helper│       │ Antigravity IDE     │  │
│  │ (Capture & Input)  │       │ (CDP Port 9222/9333)│  │
│  └────────────────────┘       └─────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 2. Component Audits & Baseline Assessment

### 2.1 Node.js Bridge (`src/`)
- **Strengths**: Lightweight, modular ES modules architecture. Comprehensive coverage of IDE inspection routines in `cdp-client.mjs` and `chat-stream.mjs`.
- **Architectural Issues**:
  - `http-server.mjs` is an oversized monolith (2,942 lines) containing server setup, auth, static bundling, file operations, git endpoints, and WebSocket message routing in a single file.
  - Fragile DOM selectors are interspersed throughout `cdp-client.mjs`, `chat-stream.mjs`, and `antigravity-dom.mjs`.
  - Missing structured command lifecycle: submitting a prompt currently returns immediately upon injecting text without waiting for agent acknowledgment or observing DOM state transitions.
  - Missing unified event bus: events are emitted using ad-hoc `broadcast()` calls without unique monotonic sequence IDs or `lastEventId` reconnection support.
- **Technology Decision (Backend Framework)**:
  - *Decision*: Maintain existing Node.js HTTP/Express 4 stack; do not rewrite or migrate to Express 5 / Fastify / Nest.
  - *Why*: The existing stack is fully functional for all requirements. A framework rewrite would introduce massive diff bloat and instability without architectural benefit (Ponytail Reuse Ladder rule).
  - *Refactoring*: Surgically modularize `http-server.mjs` into dedicated route handlers (`auth.mjs`, `cdp.mjs`, `files.mjs`, `git.mjs`, `tasks.mjs`, `ws.mjs`).

### 2.2 Android Application (`android/`)
- **Strengths**: Clean modern Kotlin architecture using Jetpack Compose, Material 3, Coroutines, StateFlow, OkHttp, and kotlinx.serialization. Build system (`assembleDebug`) is verified working.
- **Architectural Issues**:
  - Incomplete screen implementations: Dashboard is basic; Task/Phase monitoring (`task.md`) screen is missing; Terminal/Build monitoring is missing.
  - Plaintext credential storage in unencrypted DataStore (`SettingsStore.kt`).
  - Single combined "connected" boolean state rather than the four independent connection states required (Tailscale integration, tailnet endpoint reachability, bridge connectivity, application authentication).
  - Missing in-band reauthorization on WebSocket and automatic session refresh handling.
- **Technology Decision (Android Architecture)**:
  - *Decision*: Retain Kotlin + Jetpack Compose + StateFlow + OkHttp. Replace plain DataStore token keys with Android Keystore-backed encrypted storage (`EncryptedSharedPreferences` / Keystore-wrapped DataStore). Room is not needed as event history is ephemeral and bounded (Ponytail YAGNI).

### 2.3 Rust Desktop Helper (`rust-helper/`)
- **Strengths**: High-performance DXGI Desktop Duplication capture via `scrap` and native input injection via `enigo`. Tokio asynchronous WebSocket server.
- **Build & Compatibility Issues**:
  - `cargo build --release` fails on the host machine because the MSVC C++ Build Tools linker (`link.exe`) is not installed.
  - *Mitigation & Strategy*:
    1. Maintain complete Rust helper source code with proper protocol authentication (per-start secret, sequence numbering, permission validation).
    2. Provide a robust Node.js-based fallback for desktop capture and input injection that operates reliably when the native helper executable is not compiled on the user's system.
    3. Document exact prerequisites for building `rust-helper` (Visual Studio C++ Build Tools) in `docs/WINDOWS_SETUP.md`.

### 2.4 Transport Security & Tailscale Architecture
- **Decision**: Tailscale Serve with loopback binding.
- **Why**: Tailscale Serve provides legitimate HTTPS with Let's Encrypt certificates for the machine's MagicDNS name, terminating TLS cleanly without requiring self-signed certificates or cleartext HTTP over WireGuard.
- **Loopback Isolation**: The Node bridge binds exclusively to `127.0.0.1:5000`. Tailscale Serve publishes only this port to authorized tailnet members. CDP and the Rust helper remain bound to loopback and are never forwarded or exposed.

---

## 3. Dependency & Vulnerability Findings

### 3.1 npm Dependencies
`npm ci` completed with 15 reported vulnerabilities:
- `multer@1.4.5-lts.1` (impacted by DoS vulnerabilities in 1.x)
- `request@2.88.2` (deprecated transitive dependency of `node-telegram-bot-api`)
- `uuid@3.4.0` (insecure Math.random PRNG)
*Fix*: Update `multer` to 1.4.5-lts.2 / safely migrate upload paths, prune unused transitive packages, and ensure all cryptographic random tokens use Node's native `crypto.randomBytes()`.

### 3.2 Android Gradle Toolchain
- Baseline `gradlew.bat` failed on fresh download because `services.gradle.org` connection timed out (10000ms).
- Host has cached Gradle 8.11.1 at `C:\Users\deeks\.gradle\wrapper\dists\gradle-8.11.1-bin`.
- Setting `JAVA_HOME="C:\Users\deeks\.jdks\ms-17.0.20.1"` (OpenJDK 17 LTS) and `ANDROID_HOME="C:\Users\deeks\AppData\Local\Android\Sdk"` builds `assembleDebug` successfully in 2m 36s.
- `gradle-wrapper.properties` should be updated to point to Gradle 8.11.1 to ensure reproducible builds.
