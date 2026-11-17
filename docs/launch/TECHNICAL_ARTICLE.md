# Technical Article Draft (Dev.to / Medium)

**Title**: How I Built an Open-Source, Zero-Cloud Android Companion for Google Antigravity IDE

**Subtitle**: Real-time CDP DOM extraction, Android Hardware Keystore auth, and peer-to-peer Tailscale transport for autonomous coding agents.

**Tags**: `#android` `#devops` `#opensource` `#security`

---

## Introduction

Autonomous AI coding agents represent a fundamental shift in software engineering. When an agent like Antigravity refactors a module or runs a multi-step test suite, developers often step away from their workstations.

However, remote monitoring has historically presented a dilemma:
- **Cloud Solutions**: Route your proprietary workstation traffic through third-party servers.
- **Generic Remote Desktops**: Offer heavy, battery-draining full-screen streaming without specialized mobile-optimized controls for tool approvals or git diffs.

This article explores the technical architecture of **Antigravity Mobile IDE**, an open-source Android companion that solves this problem using Chrome DevTools Protocol (CDP), Tailscale peer-to-peer networking, and Android Hardware Keystore encryption.

---

## 1. Inspecting the Modern Antigravity 2.x Webview

Antigravity 2.x isolates its conversational agent interface inside an internal webview (flagged with `extensionView=true`) rather than rendering directly in the top-level Electron DOM.

To bridge this without custom binary patching:
1. The bridge inspects `DevToolsActivePort` on the Windows host to dynamically discover the CDP port (default `9222`).
2. When querying targets, it matches `type: "iframe"` and `url.includes("extensionView=true")`.
3. It listens for DOM mutations, streaming conversational turns, tool execution collapsible groups, and questionnaire cards (`ask_question`, `ask_permission`) over WebSocket.

---

## 2. Hardening the Bridge: Defense-in-Depth

Controlling a workstation remotely requires rigorous security engineering:

### SEC-06 Admin Token Defense
When using Tailscale Serve to publish local ports to your Tailnet, requests arrive at the loopback socket as `127.0.0.1`. A naive IP-based `localhostOnly` check would grant full administrative access to any Tailnet peer.

To solve this:
1. The bridge generates a 32-byte cryptographically secure random token (`crypto.randomBytes(32)`) on boot and writes it to `data/.admin_token` (mode 0600).
2. All administrative routes (`/admin`, `/setup`) require an `x-admin-token` header validated with `crypto.timingSafeEqual`.
3. The bridge explicitly rejects any request carrying reverse proxy headers (`X-Forwarded-For`, `X-Real-IP`, `Tailscale-*`) on local administrative endpoints.

### Realpath Workspace Boundaries
To prevent directory traversal attacks, `FileSecurity.validateWorkspacePath` canonicalizes every file path with `fs.realpathSync`, neutralizing symlinks, directory junctions, Windows reserved names (`CON`, `PRN`), and encoded traversal sequences (`%2e%2e%2f`).

---

## 3. Android Keystore & Token Rotation

On Android, credentials cannot be stored in plaintext. `KeyStoreHelper.kt` generates an AES-256-GCM key inside the Android Hardware Keystore:
- **Access Tokens**: Short-lived (15 minutes).
- **Refresh Tokens**: Single-use rotating credentials.
- **Anti-Theft Revocation**: If a previously used refresh token is presented, the system treats it as token theft, instantly invalidating the device's token family and dropping active WebSockets.

---

## Conclusion & Open-Source Release

Antigravity Mobile IDE demonstrates that remote developer tooling can be calm, high-performance, and secure without relying on third-party cloud brokers.

- **GitHub**: https://github.com/deekshudevang/Antigravity-Mobile-IDE
- **Website**: https://deekshudevang.github.io/Antigravity-Mobile-IDE/

*(Notice: Unofficial community project. Not affiliated with Google LLC.)*
