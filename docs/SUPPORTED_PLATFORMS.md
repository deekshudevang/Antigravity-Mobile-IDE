# Supported Platforms & Technical Prerequisites

This document lists verified and supported platforms for **Antigravity Mobile IDE**, derived strictly from repository configurations, dependency manifests, and automated test baselines.

---

## 1. Android Client (`android/`)

| Parameter | Specification | Source of Truth | Verification Status |
|---|---|---|---|
| **Minimum OS** | Android 10 (API level 29) | `android/app/build.gradle.kts` (`minSdk = 29`) | Configured in Gradle manifest |
| **Target OS** | Android 16 (API level 36) | `android/app/build.gradle.kts` (`targetSdk = 36`) | Configured in Gradle manifest |
| **Compile SDK** | API level 36 | `android/app/build.gradle.kts` (`compileSdk = 36`) | Configured in Gradle manifest |
| **UI Framework** | Jetpack Compose (Material 3) | `android/gradle/libs.versions.toml` (`compose-bom = "2024.12.01"`) | Verified in component build |
| **Kotlin Version** | 2.0.21 | `android/gradle/libs.versions.toml` (`kotlin = "2.0.21"`) | Verified via Gradle build |
| **Java Compatibility** | Java 17 (`sourceCompatibility`, `targetCompatibility`, `jvmTarget = "17"`) | `android/app/build.gradle.kts` | Verified via `testDebugUnitTest` using JDK 21 runtime |
| **Android Gradle Plugin (AGP)** | 8.7.3 | `android/gradle/libs.versions.toml` (`agp = "8.7.3"`) | Verified via Gradle wrapper 8.10.2 |
| **Tested Physical Hardware** | Motorola edge 50 pro (Android 14, API 34) | Physical device run evidence (`ZD222M3BNH`) | Verified manual run |

---

## 2. Desktop Bridge Backend (`src/`)

| Parameter | Specification | Source of Truth | Verification Status |
|---|---|---|---|
| **Operating System** | Windows 10 / Windows 11 (64-bit) | System test on Windows 11 Home Single Language (NT 10.0.26300.0) | Verified (`npm test` 75 tests passing/skipped) |
| **Node.js Runtime** | Node 18.x, 20.x, 22.x, 24.x | `package.json`, `.github/workflows/ci.yml` matrix (Node 20), host v24.19.0 | Verified (`node --test`) |
| **Package Manager** | npm 9.x+ (Host: 11.4.1) | `package-lock.json` lockfileVersion 3 | Verified (`npm test`) |
| **Network Interfaces** | `127.0.0.1` (loopback only by default) | `src/http-server.mjs` | Verified (`test/api-security.test.mjs`, `test/admin-auth.test.mjs`) |
| **Tailscale Support** | Tailscale Serve / Funnel | `scripts/setup-tailscale-serve.bat` | Script present; reverse proxy headers rejected on `/admin` |

---

## 3. Native Desktop Helper (`rust-helper/`)

| Parameter | Specification | Source of Truth | Verification Status |
|---|---|---|---|
| **Rust Toolchain** | Rust 1.80+ (Host: cargo/rustc 1.99.1) | `rust-helper/Cargo.toml` (edition 2021) | Toolchain present on host |
| **Linker Requirement** | Microsoft Visual C++ Build Tools (`link.exe`) | MSVC target `x86_64-pc-windows-msvc` | **BLOCKED_ON_TOOLCHAIN** on host without MSVC C++ Build Tools |
| **Active Screen Implementation** | Chrome DevTools Protocol (CDP) Screencast | `src/cdp-client.mjs`, `src/http-server.mjs` | **VERIFIED** fallback active in place of native helper |

---

## 4. Antigravity IDE Host Integration

| Parameter | Specification | Source of Truth | Verification Status |
|---|---|---|---|
| **Antigravity IDE** | Antigravity 2.0 / VS Code-based IDE with remote CDP port | `src/antigravity-dom.mjs`, `src/cdp-client.mjs` | Tested against CDP port 9222 |
| **Browser Compatibility** | Chrome, Chromium, Edge (desktop dashboard & CDP) | Chrome 130+ | Tested on Windows 11 host Chrome |
