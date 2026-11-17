# Repository Owner Actions Checklist

This document contains manual actions requiring repository owner privileges (GitHub settings, secret keys, external accounts) that cannot or must not be performed automatically by agents under Section 1.3 of the Operating Contract.

---

## 1. GitHub Repository Settings & Presentation

- [ ] **1.1 Set Repository Description & Topics**
  - **Where**: Repository Root -> Click the ⚙️ gear icon next to "About".
  - **Description** (≤350 chars):
    > Open-source Android companion and remote-control dashboard for monitoring and controlling your Antigravity coding workflow from your phone. Unofficial community project.
  - **Website**: `https://deekshudevang.github.io/Antigravity-Mobile-IDE/` (once GitHub Pages is enabled).
  - **Topics**:
    `antigravity`, `antigravity-ide`, `antigravity-mobile`, `antigravity-android`, `android`, `kotlin`, `jetpack-compose`, `remote-control`, `ai-coding-agent`, `developer-tools`, `mobile-dashboard`, `tailscale`, `nodejs`
    *(Note: Do not tag `remote-desktop` until native DXGI helper builds; current screen mirroring operates via CDP screencast).*

- [ ] **1.2 Upload Social Preview Image**
  - **Where**: `Settings` -> `General` -> `Social preview` -> `Edit` -> `Upload an image...`
  - **Asset**: `docs/site/assets/social-preview.png` (1280×640 PNG).

- [ ] **1.3 Enable Community Features**
  - **Where**: `Settings` -> `General` -> `Features`:
    - [ ] Check **Discussions**.
    - [ ] Check **Issues** (Issue templates are provided in `.github/ISSUE_TEMPLATE/`).

- [ ] **1.4 Enable Security Features**
  - **Where**: `Settings` -> `Code security and analysis`:
    - [ ] Enable **Private vulnerability reporting** (allows researchers to submit CVEs privately).
    - [ ] Enable **Dependabot alerts**.
    - [ ] Enable **Dependabot security updates**.

---

## 2. GitHub Pages Deployment

- [ ] **2.1 Configure GitHub Pages Source**
  - **Where**: `Settings` -> `Pages` -> `Build and deployment`:
    - **Source**: `Deploy from a branch`
    - **Branch**: `main` (or dedicated branch) / Folder: `/site` (or GitHub Actions).

---

## 3. Release & APK Signing

- [ ] **3.1 Release APK Signing Key Setup**
  - Generate a production Android signing keystore locally:
    ```bash
    keytool -genkey -v -keystore release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias antigravity
    ```
  - Store `release.jks` in a secure location outside the repository. **Never commit a keystore to Git.**
  - Sign the release APK:
    ```bash
    apksigner sign --ks release.jks --out app-release-signed.apk android/app/build/outputs/apk/release/app-release-unsigned.apk
    ```
- [ ] **3.2 Publish GitHub Release v2.0.0**
  - Generate SHA-256 checksum:
    ```bash
    certutil -hashfile app-release-signed.apk SHA256
    ```
  - Create release tag `v2.0.0` and attach the signed APK and SHA-256 checksum file.

---

## 4. Search Console & Verification

- [ ] **4.1 Google Search Console Verification**
  - Add property `https://deekshudevang.github.io/Antigravity-Mobile-IDE/`.
  - Add the HTML verification meta tag to `site/index.html` (replace `<!-- GSC_VERIFICATION_TOKEN -->`).
- [ ] **4.2 Bing Webmaster Tools Import**
  - Import verified property from Google Search Console into Bing Webmaster Tools.

---

## 5. Trademark & Naming Review

- [ ] **5.1 Trademark Risk Assessment**
  - **Context**: "Antigravity" is a Google trademark/brand for the AI-assisted IDE.
  - **Current Positioning**: The repository states clearly in all documents: *"Unofficial community project. Not affiliated with, endorsed by, or sponsored by Google."*
  - **Recommendation**: If Google legal policy requires further differentiation, consider renaming repository to `AG-Mobile-IDE` or `Companion-for-Antigravity`.
