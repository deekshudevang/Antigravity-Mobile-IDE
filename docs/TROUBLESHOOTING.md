# Troubleshooting Guide (`docs/TROUBLESHOOTING.md`)

This guide addresses real-world issues encountered when running **Antigravity Mobile IDE**, pairing the Android companion, or streaming desktop sessions.

---

## 1. Network & Tailscale Connection Issues

### Symptom: `Unable to resolve host: No address associated with hostname`
- **Error in App**: `Couldn't reach https://msi.tail3cd1f6.ts.net:5000: Unable to resolve host "msi.tail3cd1f6.ts.net": No address associated with hostname`
- **Root Cause**:
  Android cannot resolve Tailscale MagicDNS hostnames unless:
  1. The Tailscale VPN service is actively running and connected on the Android device.
  2. MagicDNS is enabled in your Tailscale Admin Console.
  3. The local Android network configuration allows private DNS fallback.
- **Solution**:
  1. **Recommended**: Use the numerical Tailscale 100.x.y.z IPv4 address instead of the FQDN:
     - On your Windows PC, open a terminal and run:
       ```cmd
       tailscale ip -4
       ```
     - Enter this 100.x.y.z address (e.g. `100.85.12.34`) in the Android app's "Tailscale IP" field.
  2. Ensure the Tailscale app on Android is toggled **ON** and shows your PC as an active peer.

---

### Symptom: `Unable to resolve host "https"`
- **Error in App**: `Couldn't reach https://https://msi.tail3cd1f6.ts.net:5000: Unable to resolve host "https"`
- **Root Cause**: The protocol scheme (`https://`) was mistakenly typed into the host field, causing the Android network client to form an invalid URL: `https://https://...`.
- **Solution**:
  Enter only the IP address or host name (e.g. `100.85.12.34` or `msi.tail3cd1f6.ts.net`) without any `http://` or `https://` prefix.

---

## 2. Authentication & Pairing Issues

### Symptom: Admin Endpoints Return HTTP 401 or 403
- **Endpoints**: `/admin`, `/setup`, `/api/admin/*`, `/api/setup/*`
- **Root Cause**: SEC-06 security hardening requires an explicit 32-byte administrative token (`data/.admin_token`).
- **Solution**:
  1. Check the console where `node src/http-server.mjs` was started.
  2. Copy the 64-character hexadecimal token printed inside the `🔑 [ADMIN SECURITY]` banner.
  3. In the browser, paste this token when prompted by the admin or setup interface.

### Symptom: Pairing Code Expired / Rejected (HTTP 400)
- **Root Cause**: Pairing codes expire after 5 minutes (300 seconds) or become invalid once used.
- **Solution**:
  Refresh the setup wizard or run `node scripts/generate-tokens.mjs` to generate a fresh pairing code.

---

## 3. Chrome DevTools Protocol (CDP) Issues

### Symptom: `CDP connection refused on port 9222`
- **Root Cause**: Antigravity IDE was launched without the `--remote-debugging-port` flag.
- **Solution**:
  1. Close any running Antigravity IDE instances.
  2. Launch Antigravity with debugging enabled:
     ```cmd
     scripts\start-antigravity-2.0-debug.bat
     ```
  3. Alternatively, launch directly via the bridge:
     ```bash
     npm run launch
     ```

---

## 4. Rust Helper Compilation Issues

### Symptom: `error: linker link.exe not found`
- **Root Cause**: Microsoft Visual C++ Build Tools are not installed on the Windows host.
- **Solution**:
  No action is required. Antigravity Mobile IDE automatically uses the Chrome DevTools Protocol (CDP) screencast fallback for all screen mirroring and keyboard control. If you require the native DXGI accelerator, install Visual Studio 2022 with the "Desktop development with C++" workload.
