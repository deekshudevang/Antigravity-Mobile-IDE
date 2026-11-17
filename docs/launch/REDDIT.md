# Reddit Community Posts Drafts

> **Rule Reminder**: Follow each subreddit's guidelines on self-promotion (e.g. 9:1 community participation rule). Never spam. Engage genuinely in comments and answer technical questions.

---

## 1. Post for r/selfhosted

**Title**: I built an open-source, zero-cloud Android remote companion for Google Antigravity IDE (Tailscale + Jetpack Compose)

**Target Subreddit**: `r/selfhosted`  
**Flair**: Project / Self-Hosted

**Body**:
Hey r/selfhosted,

Like many developers experimenting with agentic coding IDEs like Antigravity, I found myself tethered to my desk watching terminal progress and waiting for tool approvals.

I wanted a phone companion that didn't depend on proprietary cloud servers or exposing my laptop via random public web tunnels.

So I built **Antigravity Mobile IDE**:
- **Zero Cloud**: Runs over private peer-to-peer Tailscale (WireGuard mesh). The Node bridge binds only to `127.0.0.1:5000`.
- **Hardware-Stored Auth**: Android Keystore stores dual rotating JWT tokens. Single-use 5-minute PIN pairing with rate limiting.
- **Local Admin Protection (SEC-06)**: Generates a 32-byte secret token at boot and rejects reverse proxy headers (`X-Forwarded-For`) to prevent localhost spoofing behind Tailscale Serve.
- **CDP Screencast Streaming**: Mirrors the desktop screen using Chrome DevTools Protocol with modifier keyboard keys and an emergency kill switch.
- **Native Android App**: Jetpack Compose (Material 3) with dynamic wallpaper theming (Android 10+).

It's 100% open source (MIT) with an automated test suite covering all security guards:
- GitHub: https://github.com/deekshudevang/Antigravity-Mobile-IDE
- Docs: https://deekshudevang.github.io/Antigravity-Mobile-IDE/

*(Disclaimer: Unofficial community project. Not affiliated with Google.)*

Curious to hear feedback on the architecture and threat model!

---

## 2. Post for r/androiddev

**Title**: Showcasing Antigravity Mobile IDE — Jetpack Compose, Material 3 & Android Keystore for remote developer tooling

**Target Subreddit**: `r/androiddev`  
**Flair**: Show-and-Tell

**Body**:
Hi all,

I wanted to share an open-source Android app I’ve been developing as a companion for Google Antigravity coding workflows: **Antigravity Mobile IDE**.

Key Android architectural details:
- **UI Architecture**: 100% Jetpack Compose with Material 3 and Material You dynamic color extraction (`dynamicDarkColorScheme` / `dynamicLightColorScheme`).
- **State Management**: Unidirectional Data Flow using `StateFlow` and custom `ViewModelProvider.Factory`.
- **Crypto & Security**: `KeyStoreHelper.kt` encrypts rotating refresh and access tokens with AES-256-GCM using hardware-backed Android Keystore keys. `allowBackup="false"` in manifest to block ADB backup exfiltration.
- **Networking**: OkHttp WebSocket client connecting over Tailscale WireGuard mesh with exponential reconnection backoff and token refresh interceptors.
- **Realtime Canvas**: High-frequency bitmap canvas rendering for CDP screencast screen mirroring.

Source code and tests:
https://github.com/deekshudevang/Antigravity-Mobile-IDE

Any critique on the Compose state flow or Keystore implementation is welcome!
