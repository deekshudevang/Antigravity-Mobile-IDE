# Known Limitations & Operational Boundaries

This document lists strictly verified technical limitations, environmental constraints, and architectural boundaries for **Antigravity Mobile IDE**.

---

## 1. Native Desktop Helper & Toolchain Boundary

- **Issue**: Compiling the native desktop helper binary (`rust-helper/`) requires Microsoft Visual C++ Build Tools (`link.exe`).
- **Impact**: On Windows machines without Visual Studio or C++ Build Tools installed, running `cargo build --release` or `cargo check` fails with `error: linker link.exe not found`.
- **Mitigation / Architecture**:
  The system includes an automatic, zero-dependency fallback: Chrome DevTools Protocol (CDP) `Page.startScreencast`. All screen streaming, remote shortcut keys, and canvas view functionality in the Android app operate via CDP screencast without requiring any native C++ compilers. The native Rust helper is an optional accelerator.
- **Status**: `BLOCKED_ON_TOOLCHAIN` (for Rust compilation on machines lacking MSVC Build Tools).

---

## 2. Windows NTFS File Modes (0600 Permissions)

- **Issue**: `fs.chmod(path, 0o600)` on Windows NTFS filesystems is largely a no-op.
- **Impact**: POSIX permission masks cannot restrict read access to `data/.admin_token` from other processes running under the same Windows user account.
- **Mitigation**:
  Token storage relies on Windows user profile directory isolation (`%USERPROFILE%`). For multi-user workstations, run the bridge from a dedicated or protected user account.

---

## 3. Remote Network Routing & Tailscale Configuration

- **Issue**: Accessing the bridge from outside local Wi-Fi requires a private WireGuard mesh network (Tailscale).
- **Impact**:
  - The Android app requires the numerical Tailscale 100.x.y.z IPv4 address unless MagicDNS is actively enabled in the Tailscale admin console and the VPN toggle is active on the mobile device.
  - If a user inputs `https://...` or an FQDN into the "Tailscale IP" field without Android MagicDNS resolution, Android returns `Unable to resolve host: No address associated with hostname`.
- **Mitigation**:
  Always use the numerical Tailscale IP (found via `tailscale ip -4` on the desktop) when configuring the Android app.

---

## 4. Localhost Single-User Assumption

- **Issue**: Administrative routes (`/admin`, `/setup`) assume the user operating on the local console is the workstation owner.
- **Mitigation**:
  A 32-byte cryptographically secure random token (`data/.admin_token`) is generated on startup and printed once to the console. Requests must present this token via the `x-admin-token` header or an authenticated session cookie. Reverse proxy headers are rejected on administrative endpoints.
