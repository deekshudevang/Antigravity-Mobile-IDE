# Compatibility & Environment Support

This document details compatibility between **Antigravity Mobile IDE** and host environments, IDE versions, Android operating systems, and network configurations.

---

## 1. Antigravity IDE Compatibility

| Component / Version | Compatibility Level | Notes |
|---|---|---|
| **Antigravity 2.x (Modern)** | **SUPPORTED & VERIFIED** | Chat interface located in isolated webview (`extensionView=true`). CDP target discovery, DOM extraction, interactive questionnaire cards (`ask_question`, `ask_permission`), and quota polling verified. |
| **Antigravity IDE 1.x (Legacy)** | **SUPPORTED** | Root DOM `#cascade` and legacy conversation pill selectors retained as fallbacks in `src/antigravity-dom.mjs`. |
| **CDP Remote Debugging Port** | **Port 9222 / 9333** | Default discovery checks port 9222 and `DevToolsActivePort`. |

---

## 2. Android Client Compatibility

| Android Version | API Level | Status | Notes |
|---|---|---|---|
| **Android 14 – 16** | API 34 – 36 | **VERIFIED** | Full Material You dynamic theme support, edge-to-edge layout, notification channels. Verified on Motorola edge 50 pro (API 34). |
| **Android 12 – 13** | API 31 – 33 | **SUPPORTED** | Dynamic theming active; runtime notification permission requested. |
| **Android 10 – 11** | API 29 – 30 | **SUPPORTED (Minimum)** | `minSdk = 29`. Fallback color themes used; hardware Keystore active. |
| **Android 9 and below** | < API 29 | **UNSUPPORTED** | Jetpack Compose and modern crypto APIs require API 29+. |

---

## 3. Host Desktop OS Compatibility

| Desktop OS | Architecture | Status | Supported Features |
|---|---|---|---|
| **Windows 11 (64-bit)** | x86_64 | **VERIFIED** | Full Node.js bridge, CDP screencast, quota service, supervisor scripts. |
| **Windows 10 (64-bit)** | x86_64 | **SUPPORTED** | Same feature set as Windows 11. |
| **macOS / Linux** | x86_64 / arm64 | **PARTIAL (Untested)** | Node bridge, Git, files, and chat streaming should operate; quota service and native Rust helper are Windows-specific. |
