# Search Intent Map & Content Architecture

This document maps target search queries to real developer intent, identifying the single authoritative landing page that serves each intent to prevent duplicate or doorway pages.

---

## 1. Intent Mapping Table

| Query Theme | Target Keywords | Real User Intent | Authoritative Canonical Page | Current Repository Gap | Page Differentiation Note |
|---|---|---|---|---|---|
| **Discovery & Overview** | "antigravity mobile", "antigravity android app", "control antigravity from phone", "ai coding agent mobile dashboard" | Discover what the tool does, whether it fits their workflow, see screenshots, and learn how to get started | `site/index.html` (`/`) | Existing README is monolithic and lacks clear value proposition, above-the-fold screenshots, and visual architecture. | **Homepage**: High-level value proposition, native Android screenshots, live feature overview, and quick links. |
| **Setup & Installation** | "antigravity mobile setup", "how to install antigravity android", "antigravity remote setup wizard", "tailscale antigravity mobile" | Step-by-step instructions to install the Android APK, start the desktop bridge on Windows, and pair over Tailscale | `site/install.html` (`/install/`) | Install instructions previously buried in README; no clear step-by-step checklist or APK download instructions. | **Install Guide**: Detailed prerequisites, Android APK sideloading, Tailscale configuration, and first-time pairing walkthrough. |
| **Architecture & Protocol** | "how antigravity mobile works", "antigravity cdp screencast", "antigravity remote desktop architecture" | Understand the technical mechanics: CDP integration, WebSocket streaming, low-latency screen mirroring, and host limits | `site/architecture.html` (`/architecture/`) | Architecture diagram previously limited to plain ASCII; does not explain CDP screencast vs Rust helper fallback. | **Architecture**: Technical deep-dive, component sequence diagrams (Mermaid/SVG), CDP DOM adapter explanation, and data flow. |
| **Security & Privacy** | "is antigravity mobile safe", "antigravity remote control security", "antigravity token authentication" | Evaluate security risks before running on a primary developer workstation (access tokens, host command execution, network exposure) | `site/security.html` (`/security/`) | Security model was fragmented across multiple audit markdown files; lacked a clear threat model summary for newcomers. | **Security**: Threat model, token lifecycle, local-admin defense (SEC-06), Keystore storage, and known limitations. |
| **Troubleshooting & Diagnostics** | "antigravity connection failed", "unable to resolve host tailscale antigravity", "antigravity pairing timeout" | Solve specific runtime issues: Tailscale DNS errors, port conflicts, pairing code expiry, or CDP connection refusals | `site/troubleshooting.html` (`/troubleshooting/`) | Common real-world errors (like MagicDNS FQDN resolution failures on Android) lacked documented troubleshooting recipes. | **Troubleshooting & FAQ**: Concrete error messages, symptom-to-solution matrices, network debug steps, and FAQ answers. |
| **Alternatives & Comparison** | "antigravity mobile vs antimatter", "antigravity phone chat alternatives", "cursor mobile vs antigravity mobile" | Objective evaluation of differences between community tools and official features | `site/compare.html` (`/compare/`) | No factual comparison existed; users could not easily determine which tool fits their specific stack. | **Comparison**: Feature-by-feature factual table grounded strictly in `docs/FEATURE_MATRIX.md`. No disparagement. |
| **Releases & Changelog** | "antigravity mobile changelog", "antigravity android apk download", "antigravity mobile updates" | Find release history, download verified APK builds with SHA-256 checksums, review breaking changes | `site/changelog.html` (`/changelog/`) | No `CHANGELOG.md` existed in Keep a Changelog format; release notes were not consolidated. | **Changelog**: SemVer release history, verified SHA-256 checksums, and upgrade migration guides. |

---

## 2. Doorway Page Prevention Policy

Per Section 1.1 and 9 of the Operating Contract:
- **No keyword-stuffed variant pages**: Do not create separate pages for "Antigravity phone", "Antigravity Android", "Antigravity mobile", or "Antigravity remote". All discoverability for mobile form factors is consolidated into `site/index.html`.
- **Unique Value Proposition**: Every subpage must serve a completely distinct user intent (e.g., Installation vs Security vs Architecture).
- **Near-Duplicate Similarity Check**: The automated SEO audit script (`scripts/seo-audit.mjs`) will enforce a maximum content similarity threshold between pages.
