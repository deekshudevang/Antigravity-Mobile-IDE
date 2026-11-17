# Social Media Announcements (Drafts)

---

## 1. X (formerly Twitter) Thread

**Post 1 (Main)**:
Ever run an AI coding task in Google Antigravity, step away from your desk, and realize the agent is blocked waiting for you to click "Run command"?

I built Antigravity Mobile IDE: an open-source Android companion + local bridge for monitoring and steering Antigravity from your phone. 🧵👇

**Post 2**:
Zero cloud dependencies. The bridge binds to 127.0.0.1:5000 and connects to your phone over private peer-to-peer @Tailscale WireGuard mesh. No third-party servers see your code or prompts.

**Post 3**:
Native Android app built with Kotlin & Jetpack Compose:
• Live chat turn mirror
• Interactive questionnaire approval buttons (Run, Allow, Reject)
• Workspace file browser with syntax highlighting
• Git working-tree inspector & commit tool
• Emergency desktop kill switch

**Post 4**:
Security by design:
• Dual rotating tokens in Android Hardware Keystore (AES-256-GCM)
• SEC-06 startup admin token + reverse proxy header rejection
• Realpath workspace traversal defenses

**Post 5**:
100% open source (MIT). 78 automated tests in CI.

GitHub: https://github.com/deekshudevang/Antigravity-Mobile-IDE
Docs: https://deekshudevang.github.io/Antigravity-Mobile-IDE/

*(Unofficial community project, not affiliated with Google).* Feedback welcome!

---

## 2. LinkedIn Post

**Post**:
I’m excited to share an open-source project I’ve been developing: **Antigravity Mobile IDE**.

As autonomous AI coding agents like Google Antigravity take on larger software engineering tasks, developers frequently find themselves waiting for long builds or interactive tool permissions.

Antigravity Mobile IDE is a native Android companion app and local bridge that provides a calm, secure instrument panel for your workstation:

🔹 **Real-time Monitoring**: Streams agent conversational turns, tool executions, and state changes live over WebSocket via Chrome DevTools Protocol (CDP).
🔹 **Actionable Control**: Review interactive multiple-choice cards and click approvals (`Run`, `Allow`, `Cancel`) directly from your phone.
🔹 **Zero-Cloud Architecture**: Connects peer-to-peer using your private Tailscale WireGuard network—no external cloud relays.
🔹 **Enterprise-Grade Security**: Hardware Keystore token storage, SEC-06 local admin protection, rotating refresh credentials, and realpath workspace boundaries.

The project is fully open source (MIT) with comprehensive automated test suites and complete documentation:
- GitHub: https://github.com/deekshudevang/Antigravity-Mobile-IDE
- Documentation: https://deekshudevang.github.io/Antigravity-Mobile-IDE/

*(Disclaimer: Independent community project not affiliated with or endorsed by Google LLC.)*
