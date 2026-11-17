# Antigravity Mobile IDE — Demo Video Script (60–90 Seconds)

**Target Duration:** 75 seconds  
**Format:** Screen recording split / Picture-in-Picture: Phone screen capture on left (portrait), Windows 11 host desktop on right (landscape).  
**Tone:** Technical, honest, clear, zero hype.  
**Disclaimer Requirement:** Opening title card and closing card must display the non-affiliation notice.

---

## Visual Overview & Requirements
- **Host Device:** Windows 11 running Google Antigravity IDE (with Chrome remote debugging enabled or standard bridge).
- **Mobile Device:** Physical Android device (e.g. Motorola Edge 50 Pro or Pixel running Android 14/15) with Tailscale VPN active.
- **No Mock Data:** All interactions shown are real network requests over the local Tailnet.

---

## Shot-by-Shot Timeline

### 00:00 – 00:06 | Title Card & Non-Affiliation
- **Visual (Full Screen):** Clean typography on `#0b0f14` background.
  - Heading: "Antigravity Mobile IDE"
  - Subtitle: "Unofficial Android companion for monitoring & controlling Antigravity workflows"
  - Mandatory Disclaimer: *"Unofficial community project. Not affiliated with, endorsed by, or sponsored by Google."*
- **Caption:** An open-source companion app to monitor AI coding agents from your phone.

---

### 00:06 – 00:18 | Starting the Bridge & Device Pairing
- **Visual (Split Screen):**
  - **Right (Windows):** Terminal running `npm start`. The server binds to `127.0.0.1:5000` and outputs:
    ```text
    ┌─────────────────────────────────────────────┐
    │  Pairing code (valid 5 min):   849201       │
    │  Enter it once on the phone (Settings → Pair) │
    └─────────────────────────────────────────────┘
    ```
  - **Left (Android):** User opens Antigravity Mobile app. Taps "Settings", enters Tailscale IP `100.x.y.z:5000`, and types the 6-digit PIN `849201`.
  - **Action:** User taps "Pair Device".
  - **Result:** Phone displays "Paired securely. Dual tokens stored in Android Keystore." Server prints `[AUTH] Device Motorola Edge 50 Pro authenticated`.
- **Caption:** 1. Start the bridge on Windows. 2. Enter your Tailscale IP and 6-digit one-time PIN. Cryptographic access tokens are stored in Android Keystore.

---

### 00:18 – 00:36 | Live Agent Status & Prompt Delivery
- **Visual (Split Screen):**
  - **Left (Android):** Dashboard shows agent status: `IDLE`. User navigates to the "Chat / Composer" tab.
  - **Action:** User types a real prompt into the mobile composer:
    `"Run npm test and inspect test/auth-service.test.mjs"`
  - User taps "Send".
  - **Right (Windows):** Antigravity IDE composer updates immediately. The command lifecycle transitions: `SUBMITTED → ACCEPTED_BY_BRIDGE → DELIVERED_TO_IDE → STARTED`.
  - **Left (Android):** Live status chip flips from `IDLE` to `RUNNING`.
- **Caption:** Send instructions to your active coding agent. Commands are validated and tracked through a five-stage finite state machine.

---

### 00:36 – 00:52 | Streaming Agent Output & Human-in-the-Loop Approval
- **Visual (Split Screen):**
  - **Right (Windows):** Antigravity agent proposes running a terminal command requiring confirmation.
  - **Left (Android):** An "Approval Needed" card surfaces at the top of the chat view with the command diff and options: `[Approve]` or `[Reject]`.
  - **Action:** User taps `[Approve]` on mobile.
  - **Right (Windows):** Antigravity immediately executes the tool call and output streams back.
  - **Left (Android):** Markdown output streams in real-time with syntax-highlighted code blocks.
- **Caption:** Review and approve agent actions while away from your desk over your encrypted Tailnet.

---

### 00:52 – 01:05 | Live Desktop & Fallback Screencast
- **Visual (Split Screen):**
  - **Left (Android):** User switches to the "Screen" tab.
  - The live desktop workspace renders smoothly via the CDP screencast stream.
  - User pinches to zoom in on a terminal build log.
- **Caption:** Inspect editor state and build logs via live screencast.

---

### 01:05 – 01:15 | Summary & Open Source Links
- **Visual (Full Screen):**
  - Clean card displaying:
    - GitHub: `github.com/deekshudevang/Antigravity-Mobile-IDE`
    - Documentation: `deekshudevang.github.io/Antigravity-Mobile-IDE/`
    - License: MIT License
    - Stack: Kotlin / Jetpack Compose + Node.js Bridge
  - Non-affiliation notice: *"Google Antigravity is a trademark of Google LLC. This project is independently developed."*
- **Caption:** Fully open source. No cloud relays. All traffic stays on your private network.
