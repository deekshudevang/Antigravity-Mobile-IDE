# Antigravity Mobile IDE — Control Antigravity from Your Phone

**Antigravity Mobile IDE** is an open-source Android companion and self-hosted remote-control dashboard for [Google Antigravity](https://antigravity.google). Monitor your AI coding agent, view conversations, browse project files, inspect Git changes, check model quotas, and control your Windows desktop from your phone.

> **Search terms:** Antigravity Mobile IDE · Antigravity Android app · Antigravity remote control · control Antigravity from phone · Antigravity mobile dashboard · Antigravity IDE companion app · remote AI coding agent · Android app for Antigravity

<p align="center">
  <img src="screenshots/screenshot.png" width="620" alt="Antigravity Mobile IDE dashboard and remote control" />
</p>

## What is Antigravity Mobile IDE?

Antigravity Mobile IDE brings your desktop Antigravity coding workflow to Android. Run a local Node.js bridge on your PC, pair your Android device, and access supported IDE and desktop features over your private network. A browser-based mobile dashboard is also included.

This is a community-built companion project. It is not an official Google Antigravity product and is not affiliated with or endorsed by Google.

## Key features

- **Native Android companion:** Kotlin, Jetpack Compose and Material 3 interface, with Material You dynamic colours on Android 12+.
- **Live agent conversation view:** follow chat activity from your phone.
- **Remote desktop control:** view the PC screen and send mouse/keyboard input using the Rust desktop helper.
- **Project file browser:** browse files with syntax highlighting.
- **Git working-tree view:** inspect changes and stage, discard or commit supported changes from the phone.
- **Model quota monitor:** view available quota information where supported.
- **Setup wizard:** guided setup for Antigravity launch/CDP, helper build, Tailscale and phone pairing.
- **Device pairing and optional PIN:** gate remote input behind device pairing, with optional PIN protection and rate limiting.
- **Mobile and lite dashboards:** use the browser interface when you do not want to install the Android app.
- **Optional notifications:** Telegram alerts are disabled unless explicitly configured.

## Quick start

### Requirements

- Windows 11 is the primary developed and tested platform.
- Node.js 18 or newer.
- Google Antigravity installed on the PC.
- Android phone for the native app or a mobile browser for the web dashboard.
- Rust toolchain to build the desktop helper.
- Tailscale is recommended for private phone-to-PC connectivity.

The desktop capture/input helper and quota monitoring are currently Windows-only. Some bridge features may work on macOS/Linux, but those platforms are not currently verified.

### Run the bridge

```bash
git clone https://github.com/deekshudevang/Antigravity-Mobile-IDE.git
cd Antigravity-Mobile-IDE
npm install
node src/http-server.mjs
```

Open `http://localhost:5000/setup` on the PC and follow the setup wizard. It guides you through Antigravity/CDP configuration, the desktop helper, private networking and phone pairing.

- Setup wizard: `http://localhost:5000/setup`
- Admin panel: `http://localhost:5000/admin`
- Mobile dashboard: `http://localhost:5000`
- Phone over Tailscale: `http://<your-tailscale-ip>:5000`

For native Android build and sideload instructions, see [android/README.md](android/README.md).

## How it works

1. Antigravity runs on your PC with its supported Chrome DevTools Protocol connection.
2. The Node.js bridge exposes the mobile dashboard and coordinates local services.
3. The Rust desktop helper provides screen capture and native input support on Windows.
4. Your Android app or mobile browser connects over your private Tailscale network.
5. Pair the device before using remote input. Optional PIN authentication adds another access check.

```text
Android app / mobile browser
          |
     Private network
       (Tailscale)
          |
Node.js bridge ---- Rust desktop helper
          |              |
       CDP/API       Screen + input
          |              |
       Antigravity IDE / Windows desktop
```

## Security notes

Remote desktop control is powerful. Keep the bridge on a trusted private network, pair only devices you control, use the optional PIN when appropriate, and do not expose the service directly to the public internet. Review the security documentation before enabling remote access. Telegram integration is optional and inactive by default.

See [docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md) and [docs/API_INVENTORY.md](docs/API_INVENTORY.md).

## Documentation

- [Android app setup](android/README.md)
- [Architecture audit](docs/ARCHITECTURE_AUDIT.md)
- [Capability matrix](docs/CAPABILITY_MATRIX.md)
- [Security audit](docs/SECURITY_AUDIT.md)
- [API inventory](docs/API_INVENTORY.md)
- [Implementation roadmap](docs/IMPLEMENTATION_ROADMAP.md)
- [Feature gap analysis](docs/FEATURE_GAP_ANALYSIS.md)

## Project layout

| Path | Purpose |
|---|---|
| `android/` | Native Android companion app (Kotlin + Jetpack Compose) |
| `rust-helper/` | Windows desktop capture, input and bridge supervisor |
| `src/` | Node.js bridge, API, WebSocket, pairing and services |
| `public/` | Mobile dashboard, lite view, admin panel and setup wizard |
| `scripts/` | Startup and helper scripts |
| `docs/` | Architecture, security, API and project documentation |

## Troubleshooting

| Issue | What to check |
|---|---|
| Phone cannot connect | Confirm Tailscale is connected on both devices and use the PC's Tailscale IP with port 5000. |
| CDP disconnected | Start Antigravity through the setup wizard or configure the documented remote debugging port. |
| Screen is blank or input does not work | Confirm the Windows desktop helper is running and paired. |
| Pairing fails | Re-run the setup wizard and pair using the current pairing code. |
| Quota does not load | Confirm Antigravity is running and signed in; quota monitoring is Windows-only. |

## Contributing

Bug reports, reproducible issues, documentation improvements and pull requests are welcome. Please include your OS, Node.js version, Android version (when relevant), reproduction steps and redacted logs. Never post pairing tokens, PINs or private network details.

## Credits and project status

- **Maintainer:** [deekshudevang](https://github.com/deekshudevang)
- **Upstream foundation and support:** [AvenalJ/AntigravityMobile](https://github.com/AvenalJ/AntigravityMobile)
- Inspired by [Antigravity-Shit-Chat](https://github.com/gherghett/Antigravity-Shit-Chat)
- Quota-monitoring inspiration: [Antigravity Cockpit](https://marketplace.visualstudio.com/items?itemName=jlcodes.antigravity-cockpit)

## License

MIT — see [LICENSE](LICENSE). Review the repository's included third-party notices and attribution requirements when redistributing.

---

**Looking for an Antigravity mobile app, Android companion, or way to control Antigravity IDE from your phone?** Start with this repository, read the setup guide, and check the platform/security notes before connecting your devices.
