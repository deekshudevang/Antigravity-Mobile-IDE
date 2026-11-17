# GitHub Discussions Structure & Good First Issues

This guide defines the community onboarding structure, initial pinned discussion post, and 3 scoped "Good First Issue" templates ready to be published on the repository.

---

## 1. GitHub Discussions Categories

Enable GitHub Discussions under **Settings → Features → Discussions**, and configure these 4 categories:

| Category | Description | Format |
|---|---|---|
| **Announcements** 📢 | Official updates, release notes, and security disclosures from maintainers. | Announcements (only maintainers can post) |
| **Q&A** 💬 | Getting started questions, Tailscale setup assistance, and troubleshooting. | Q&A (marked answers enabled) |
| **Ideas & RFCs** 💡 | Proposals for new companion features, UI improvements, and workflows. | Open discussion |
| **Show and Tell** 🚀 | Screenshots and setups of community members using the mobile companion. | Open discussion |

---

## 2. Pinned Welcome Discussion Post

**Category:** Announcements 📢  
**Title:** Welcome to Antigravity Mobile IDE! 👋 Read this first

```markdown
Hello and welcome! 👋

**Antigravity Mobile IDE** is an open-source, community-built Android companion for Google Antigravity IDE. It allows you to monitor running coding agents, submit prompts, review command approvals, and inspect desktop logs directly from your phone over your private Tailscale network.

> [!NOTE]
> **Trademark & Non-Affiliation Disclaimer:**  
> This is an independent, community-driven project. It is **not affiliated with, endorsed by, or sponsored by Google LLC**. "Antigravity" is used purely to denote compatibility.

### Where to Start?
- 📖 **Documentation & Setup:** [Read our official guide](https://deekshudevang.github.io/Antigravity-Mobile-IDE/)
- ⚙️ **Architecture & Security:** Check out our [Threat Model](docs/THREAT_MODEL.md) and [Capability Matrix](docs/CAPABILITY_MATRIX.md)
- 🐛 **Found a bug?** Open a report using our [Bug Report Form](.github/ISSUE_TEMPLATE/bug_report.yml)
- 🔒 **Security vulnerability?** Review our [Security Policy](SECURITY.md) — report privately via GitHub Security Advisories.

### Community Ground Rules
We follow the [Contributor Covenant 2.1](CODE_OF_CONDUCT.md). Please keep conversations civil, constructive, and focused on building great developer tooling.

If you have questions about pairing, network setup, or general feedback, reply right here in **Q&A**!
```

---

## 3. Scoped "Good First Issue" Candidates

### Good First Issue 1: Display Tailscale MagicDNS Troubleshooting Tip on Hostname Resolution Error
- **Labels:** `good first issue`, `ux`, `android`
- **Context:** When a user enters a Tailscale MagicDNS name (e.g. `laptop.tailnet.ts.net`) while Tailscale VPN is not active on the phone or MagicDNS is disabled, Android throws `UnknownHostException: Unable to resolve host ... No address associated with hostname`. Users often think the bridge server crashed.
- **Task:** In `android/app/src/main/java/de/xyourp/antigravitymobile/ui/screens/SettingsScreen.kt`, catch `UnknownHostException` in the connection test routine and display a dedicated warning message:
  `"Could not resolve MagicDNS hostname. Tip: Make sure Tailscale VPN is connected on your phone, or enter your PC's 100.x.y.z numerical Tailscale IP directly."`
- **Verification:** Unit test in `SettingsViewModelTest.kt` verifying the formatted error message is surfaced when host resolution fails.

---

### Good First Issue 2: Add Robolectric Unit Test for KeyStoreHelper Hardware Failure Fallback
- **Labels:** `good first issue`, `testing`, `security`
- **Context:** `KeyStoreHelper.kt` utilizes the Android Keystore system with AES-256-GCM. On certain low-end or customized ROMs without hardware-backed StrongBox, Keystore initialization can fail.
- **Task:** Write a unit test using Robolectric in `android/app/src/test/java/de/xyourp/antigravitymobile/KeyStoreHelperTest.kt` that simulates a Keystore exception and verifies graceful degradation (explicit error reporting rather than silent credential corruption).
- **Verification:** Run `./gradlew testDebugUnitTest` and verify the test passes.

---

### Good First Issue 3: Add Automated MSVC Cargo Build Step in GitHub Actions
- **Labels:** `good first issue`, `ci`, `rust`
- **Context:** The native Windows Rust helper (`rust-helper/`) requires an MSVC linker (`link.exe`) which may not be present on individual contributor laptops, but is pre-installed on GitHub Actions `windows-latest` virtual environments.
- **Task:** In `.github/workflows/rust.yml`, verify that `cargo check` and `cargo test` execute cleanly against `rust-helper/Cargo.toml`, outputting clear diagnostic logs.
- **Verification:** Trigger workflow on a test branch and ensure GitHub Actions runner passes with green exit code.
