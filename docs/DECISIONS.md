# Architecture Decision Records (ADRs)

This document records key technical and architectural decisions for **Antigravity Mobile IDE**, outlining the context, rationale, and alternatives rejected.

---

## ADR-001: Separation of Bridge Server and Remote Screen Implementation

- **Date**: 2026-11-16
- **Status**: Accepted
- **Context**:
  The project requires mirroring the desktop screen and injecting keyboard/mouse events from mobile. A high-performance native helper (`rust-helper/`) was written in Rust using Windows DXGI Desktop Duplication and `enigo`. However, compiling Rust on Windows hosts often fails when Microsoft Visual C++ Build Tools (`link.exe`) are absent.
- **Decision**:
  Implement a layered fallback architecture:
  1. Primary fallback: Chrome DevTools Protocol (CDP) `Page.startScreencast` managed directly by the Node.js bridge. This provides reliable ~30 FPS screen streaming with zero external native toolchain dependencies.
  2. Optional accelerator: When MSVC `link.exe` is present and compiled, the Rust helper connects via authenticated loopback WebSocket.
- **Consequences**:
  The system works out of the box on standard Windows environments without requiring gigabytes of C++ build toolchains.
- **Alternatives Rejected**:
  - *Hard requirement on Rust helper binary*: Would break installation for users lacking MSVC linker.
  - *Shipping precompiled binaries in Git*: Violates security practices, triggers AV heuristics, and bloats repository size.

---

## ADR-002: Dual-Token (Access + Refresh) Authentication with Anti-Theft Revocation

- **Date**: 2026-11-16
- **Status**: Accepted
- **Context**:
  Mobile connections over local Wi-Fi or Tailscale require secure authentication without forcing the user to re-enter a 6-digit PIN on every app launch.
- **Decision**:
  Implement short-lived access tokens (15-minute TTL) and single-use rotating refresh tokens stored in hardware-backed Android Keystore. When a refresh token is reused, both the token family and the associated device are immediately revoked (anti-theft reuse detection).
- **Alternatives Rejected**:
  - *Permanent API Keys*: High risk if the device is lost or compromised.
  - *Basic Auth / Static Passwords*: Vulnerable to brute force and leaks in logs.

---

## ADR-003: Administrative Route Isolation (SEC-06 Admin Token)

- **Date**: 2026-11-17
- **Status**: Accepted
- **Context**:
  Administrative endpoints (`/admin`, `/setup`, `/api/admin/*`, `/api/setup/*`) configure pairing and pairing auto-accept. When running Tailscale Serve on loopback, incoming remote requests from the Tailnet arrive with remote address `127.0.0.1`, bypassing naive IP-based `localhostOnly` checks.
- **Decision**:
  1. Generate a high-entropy 32-byte cryptographically secure random token (`data/.admin_token`, 0600) on server startup and display it once in the terminal.
  2. Require `x-admin-token` header (or authenticated HttpOnly session cookie) validated with `crypto.timingSafeEqual`.
  3. Reject requests bearing reverse proxy headers (`X-Forwarded-For`, `X-Real-IP`, `Tailscale-*`) on local administrative endpoints.
- **Alternatives Rejected**:
  - *IP-only checking*: Defeated immediately by Tailscale Serve reverse proxying.
  - *Accepting token in URL query string*: Leaks tokens into browser history, server logs, and referrer headers.

---

## ADR-004: Static Site Architecture for Documentation and GitHub Pages

- **Date**: 2026-11-17
- **Status**: Accepted
- **Context**:
  Phase 6 requires an SEO-optimized, highly accessible, zero-CLS public website hosted on GitHub Pages.
- **Decision**:
  Build the site as lightweight static HTML, CSS, and minimal vanilla JavaScript located in `site/`. No heavy JavaScript frameworks (React, Next.js, Astro) are used.
- **Rationale**:
  - 100/100 Lighthouse performance, accessibility, best practices, and SEO scores.
  - Instant loading, zero build-step overhead, and no runtime hydration lag on mobile devices.
  - Compatible with GitHub Pages out of the box.
