# Show HN Draft

**Title**: Show HN: Antigravity Mobile IDE – Open-source Android companion for Google Antigravity

**URL**: https://github.com/deekshudevang/Antigravity-Mobile-IDE

---

## Body Text

Hi HN,

I built Antigravity Mobile IDE, an open-source Android companion app and local bridge for monitoring and steering autonomous coding workflows in Google Antigravity from your phone.

### The Problem
When running agentic coding tasks in Antigravity IDE, tasks often run for 5–20 minutes. Sitting at a workstation just to watch progress or approve a tool action ("Run this shell command?") breaks focus. But traditional remote desktop solutions on a phone feel clumsy, and exposing your dev machine to public tunnels or third-party cloud brokers introduces unnecessary security risk.

### How It Works
1. **Desktop Bridge**: A lightweight Node.js server running on Windows 11 binds strictly to `127.0.0.1:5000`. It discovers Antigravity 2.x webviews via Chrome DevTools Protocol (CDP port 9222) and mirrors conversational turns in real time.
2. **Private Network Transport**: Connects over your own Tailscale WireGuard mesh directly to your phone. No data leaves your private tailnet.
3. **Android App**: Built natively with Jetpack Compose (Material 3). It renders Markdown agent prose, collapsible tool trajectories, interactive questionnaire chips (`ask_question`, `ask_permission`), and working-tree git status.
4. **Screen Mirroring & Kill Switch**: Streams your desktop canvas at ~30 FPS via CDP screencast with a sticky modifier bar (Ctrl, Alt, Shift, Esc, Enter) and an instant emergency kill switch that severs control immediately.

### Security Model
- Pairing uses single-use, 5-minute PINs with brute-force rate limiting (5 attempts = 15-min lockout).
- Dual-token access/refresh tokens are stored in the Android Hardware Keystore (AES-256-GCM). Replay of an expired refresh token triggers anti-theft revocation.
- Administrative routes require a 32-byte startup token (SEC-06) validated with `crypto.timingSafeEqual`, and reverse proxy headers (`X-Forwarded-For`) are rejected to prevent local IP spoofing.
- File browsing enforces `fs.realpathSync` workspace boundaries to stop path traversal.

### Known Limitations
- The bridge is currently tested on Windows 11.
- Compiling the optional native Rust helper requires Microsoft C++ Build Tools (`link.exe`); when absent, the system uses the CDP screencast engine (which requires zero compilers).
- Sideloading requires Android 10+ (API 29+).

Notice: This is an independent community project and is not affiliated with or endorsed by Google.

Code, test suites (78 passing tests), and documentation:
https://github.com/deekshudevang/Antigravity-Mobile-IDE

Website & architecture deep-dive:
https://deekshudevang.github.io/Antigravity-Mobile-IDE/

I would love feedback from developers running agentic workflows.
