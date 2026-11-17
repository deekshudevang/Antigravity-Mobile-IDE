# GitHub Discoverability & Community Health Audit (`docs/GITHUB_DISCOVERABILITY_AUDIT.md`)

**Date**: 2026-11-17  
**Scope**: GitHub repository profile, search indexing within GitHub, community health metrics, and first-screen impression.

---

## 1. GitHub Metadata & Topic Alignment

| Item | Current Status | Audit Finding | Recommended Value / Action |
|---|---|---|---|
| **Repository Name** | `Antigravity-Mobile-IDE` | Descriptive, but carries trademark consideration | Retain name; add clear non-affiliation notice in description and README. |
| **Description** | Unset or default | Missing clear, informative description in GitHub repo settings | *"Open-source Android companion and remote-control dashboard for monitoring and controlling your Antigravity coding workflow from your phone. Unofficial community project."* (192 chars) |
| **Topics** | Unset | Repository lacks GitHub topics, making it invisible in GitHub topic explore pages | `antigravity`, `antigravity-ide`, `antigravity-mobile`, `antigravity-android`, `android`, `kotlin`, `jetpack-compose`, `remote-control`, `ai-coding-agent`, `developer-tools`, `mobile-dashboard`, `tailscale`, `nodejs` |
| **Website URL** | Unset | No link in the "About" box | Set to `https://deekshudevang.github.io/Antigravity-Mobile-IDE/` |
| **Social Preview** | Default GitHub identicon | Link previews on Twitter/Reddit/Discord render blank or generic | Upload custom 1280×640 PNG (`docs/site/assets/social-preview.png`) via GitHub repository settings. |

---

## 2. GitHub Community Health Score Items

GitHub evaluates repository health based on standard community documentation:

- [ ] **`README.md`**: Present, but currently lacks above-the-fold screenshots, official badges, and clear disclaimer (addressed in Phase 5).
- [ ] **`LICENSE`**: MIT License present (`LICENSE`), properly crediting `deekshudevang (with support by Avenal J)`.
- [ ] **`CODE_OF_CONDUCT.md`**: **MISSING**. Needs standard Contributor Covenant 2.1 text.
- [ ] **`CONTRIBUTING.md`**: **MISSING**. Needs guidelines for PRs, local verification, and testing.
- [ ] **`SECURITY.md`**: **MISSING**. Needs vulnerability reporting guidelines and private reporting instructions.
- [ ] **`SUPPORT.md`**: **MISSING**. Needs pointers to Discussions, Issues, and docs.
- [ ] **Issue Templates**: **MISSING**. Needs bug report, feature request, and docs feedback templates in `.github/ISSUE_TEMPLATE/`.
- [ ] **Pull Request Template**: **MISSING**. Needs `.github/pull_request_template.md`.

---

## 3. Releases & Distribution Gaps

1. **No Tagged SemVer Releases**:
   - The repository currently has zero published GitHub Releases.
   - APK files are built locally (`android/app/build/outputs/apk/debug/app-debug.apk`) but not distributed via release assets.
2. **Missing Checksums**:
   - Pre-built APK releases must include SHA-256 checksums to verify package integrity.
3. **Debug Build vs Signed Release**:
   - Current APK is signed with default Android debug keys. Production distribution requires owner-managed release keys (`docs/OWNER_ACTIONS.md`).
