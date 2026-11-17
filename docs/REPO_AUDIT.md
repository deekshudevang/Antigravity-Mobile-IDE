# Repository Audit Report (`docs/REPO_AUDIT.md`)

**Date**: 2026-11-17  
**Scope**: Full codebase audit (Android, Node.js backend, Rust helper, web dashboard, docs, and metadata)  
**Standard**: Antigravity Mobile IDE Discoverability, Trust & Open-Source Growth Master Prompt (§4)

---

## 1. Executive Summary & Audit Findings Table

| ID | Area | Severity | Location | Short Description | Status |
|---|---|---|---|---|---|
| **AUD-01** | Documentation / Claims | **HIGH** | `README.md:14,50` | Unverifiable claim that Rust helper binary builds and runs as sole supervisor | OPEN |
| **AUD-02** | Documentation / Claims | **HIGH** | `README.md:1,12` | Missing prominent disclaimer of non-affiliation with Google | OPEN |
| **AUD-03** | Security / Transport | **HIGH** | `README.md:28`, `src/tunnel.mjs` | Recommendation and inclusion of Cloudflare quick tunnels without auth warning | OPEN |
| **AUD-04** | Security / Dependencies | **HIGH** | `package.json`, `package-lock.json` | 15 npm vulnerabilities (3 critical, 4 high) in `express`, `qs`, `ws`, `form-data` | OPEN |
| **AUD-05** | Documentation / Claims | **MEDIUM** | `README.md:18` | Stale pairing claim (claims "persistent code", but implementation uses 5-min single-use codes) | OPEN |
| **AUD-06** | Documentation / Claims | **MEDIUM** | `README.md:55` | Stale CDP port documentation (states 9333, whereas codebase defaults to 9222) | OPEN |
| **AUD-07** | Community Health | **MEDIUM** | Repository Root | Missing standard community health files (`SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, issue/PR templates) | OPEN |
| **AUD-08** | Documentation / Changelog | **LOW** | `CHANGELOG.md` | Corrupted UTF-8 mojibake characters (`ðŸš€`, `â “`) in changelog headers | OPEN |
| **AUD-09** | CI / Release | **LOW** | `.github/workflows/` | Workflows require pinned action SHAs and modular breakdown per component | OPEN |
| **AUD-10** | Website / SEO | **HIGH** | Repository Root | No public static documentation website exists on GitHub Pages | OPEN |

---

## 2. Detailed Findings & Recommended Fixes

### Finding AUD-01: Unverifiable Rust Helper Binary Build Claims
- **Severity**: **HIGH**
- **Location**: `README.md:14`, `README.md:50-51`
- **Evidence**:
  The README instructs users: *"Day-to-day, once the helper is built: just double-click rust-helper/target/release/desktop-helper.exe — it starts capture/input and the bridge, and keeps the bridge alive."*
  However, running `cargo check --manifest-path rust-helper/Cargo.toml` fails with:
  `error: linker link.exe not found`.
  The helper cannot be compiled on Windows without Visual Studio C++ Build Tools installed. Furthermore, the active screen streaming implementation in the app actually runs on the Node CDP screencast fallback.
- **Recommended Fix**:
  Update README to honestly document that CDP screencast is the primary, zero-setup screen streaming engine, and the native Rust helper is an optional high-performance accelerator requiring MSVC Build Tools. Mark Rust binary status in `docs/FEATURE_MATRIX.md` as `BLOCKED_ON_TOOLCHAIN`.

---

### Finding AUD-02: Missing Non-Affiliation / Trademark Disclaimer Above the Fold
- **Severity**: **HIGH**
- **Location**: `README.md:1-4`
- **Evidence**:
  The README currently opens with: *"Mobile dashboard, native Android app, and full remote control for Antigravity IDE"*. It contains no clear, plain-language disclaimer clarifying that this is an independent community project not endorsed by or affiliated with Google.
- **Recommended Fix**:
  Add an explicit non-affiliation disclaimer directly below the project title on the first screen:
  > **Notice**: Antigravity Mobile IDE is an independent, unofficial community project. It is not affiliated with, sponsored by, or endorsed by Google.

---

### Finding AUD-03: Tunnel Configuration Security Warnings
- **Severity**: **HIGH**
- **Location**: `README.md:28`, `src/tunnel.mjs`
- **Evidence**:
  `README.md` mentions *"Remote access via Cloudflare quick tunnels"*. Quick tunnels expose loopback ports to random public `trycloudflare.com` URLs without built-in authentication, conflicting with Section 1.4 of the Operating Contract ("Never recommend exposing the bridge to the public internet; document the supported secure path (e.g., private network/Tailscale)").
- **Recommended Fix**:
  Deprecate or clearly mark public tunnels as dangerous and experimental. Document private peer-to-peer Tailscale VPN as the sole officially supported remote network path.

---

### Finding AUD-04: Vulnerabilities in Node.js Dependencies
- **Severity**: **HIGH**
- **Location**: `package.json`, `package-lock.json`
- **Evidence**:
  `npm audit` reports 15 vulnerabilities (3 critical, 4 high, 8 moderate). These stem from `express` 4.18.2 pulling older `body-parser`, `proxy-addr`, `path-to-regexp`, and `ws` 8.16.0 containing DoS advisories.
- **Recommended Fix**:
  Execute targeted dependency upgrades (`npm audit fix` or update `express` to 4.21.x / `ws` to 8.18.x) while ensuring test suite maintains 100% pass rate.

---

### Finding AUD-05: Stale Pairing Lifecycle Documentation
- **Severity**: **MEDIUM**
- **Location**: `README.md:18`
- **Evidence**:
  `README.md` states: *"a phone enters the PC's pairing code once and receives a long-lived token... Optional PIN auth with rate limiting on top."*
  In the actual code (`src/pairing-service.mjs`, `src/auth-service.mjs`), pairing codes expire in 5 minutes and are single-use. Successful pairing returns a short-lived access token and rotating refresh token with anti-theft reuse revocation.
- **Recommended Fix**:
  Update README to accurately describe the dual-token pairing lifecycle verified by `test/api-security.test.mjs`.

---

### Finding AUD-06: Discrepancy in Default CDP Port Documentation
- **Severity**: **MEDIUM**
- **Location**: `README.md:55`
- **Evidence**:
  `README.md` line 55 claims: *"CDP defaults to port 9333."*
  However, in `src/cdp-client.mjs`, `src/launcher.mjs`, and `scripts/cdp-probe.mjs`, the default port checked is `9222`.
- **Recommended Fix**:
  Correct default port documentation to `9222` and document configurable port resolution via `data/config.json`.

---

### Finding AUD-07: Missing Standard Community Health Files
- **Severity**: **MEDIUM**
- **Location**: Repository Root and `.github/`
- **Evidence**:
  Missing `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SUPPORT.md`, `.github/ISSUE_TEMPLATE/`, and `.github/pull_request_template.md`.
- **Recommended Fix**:
  Author standard open-source community health documents per Section 7 of the Operating Contract.

---

### Finding AUD-08: Corrupted UTF-8 Characters in Changelog
- **Severity**: **LOW**
- **Location**: `CHANGELOG.md`
- **Evidence**:
  The existing `CHANGELOG.md` contains mojibake characters (e.g., `ðŸš€`, `ðŸ§©`, `â “`).
- **Recommended Fix**:
  Clean up encoding and adopt standard Keep a Changelog format.
