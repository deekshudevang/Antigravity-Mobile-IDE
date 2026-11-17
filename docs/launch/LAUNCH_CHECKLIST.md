# Antigravity Mobile IDE — Launch Checklist & Response Protocol

This protocol guides the maintainer through the launch sequence for **Antigravity Mobile IDE v2.0.0**, ensuring operational readiness, truthful communication, and disciplined community response.

---

## 1. T-Minus Countdown Checklist

### T-7 Days: Code Freeze & Security Review
- [ ] **Security verification:** Confirm all Phase 3 audit findings (`docs/THREAT_MODEL.md`, `SECURITY.md`) are resolved.
- [ ] **Automated test suite:** Run `npm test` and `./gradlew testDebugUnitTest`. Ensure 100% pass rate.
- [ ] **SEO & Metadata verification:** Run `node scripts/seo-audit.mjs` and `node scripts/check-contrast.mjs`. Verify 0 errors.
- [ ] **Repository presentation:** Confirm GitHub topics, 192-char description, and social preview card are configured per `docs/OWNER_ACTIONS.md`.
- [ ] **Google non-affiliation check:** Audit README, static website, and launch drafts to confirm disclaimer is prominent on all assets.

### T-24 Hours: Release Packaging & Verification
- [ ] **Version synchronization:** Run `node scripts/check-version-sync.mjs` to ensure `package.json`, `build.gradle.kts`, `Cargo.toml`, and `CHANGELOG.md` match `2.0.0`.
- [ ] **APK build & checksum:** Generate release APK (or test debug APK). Calculate SHA-256 checksum:
  ```powershell
  Get-FileHash -Algorithm SHA256 android/app/build/outputs/apk/debug/app-debug.apk
  ```
- [ ] **GitHub Pages live verification:** Check that `https://deekshudevang.github.io/Antigravity-Mobile-IDE/` loads cleanly with 0 console errors and valid `sitemap.xml`.
- [ ] **Search Console:** Submit `sitemap.xml` in Google Search Console and Bing Webmaster Tools.

### T-1 Hour: Final Sanity Checks
- [ ] **Local bridge dry run:** Run `npm start`, confirm one-time pairing code prints in console, and test pairing with a physical Android device over Tailscale.
- [ ] **Review drafts:** Open `docs/launch/SHOW_HN.md` and `docs/launch/REDDIT.md`. Check that all markdown links resolve correctly.
- [ ] **Prepare discussion threads:** Ensure GitHub Discussions is enabled with categories per `docs/launch/DISCUSSIONS_AND_ISSUES.md`.

### T-0: Launch Execution
- [ ] **Hacker News:** Submit `docs/launch/SHOW_HN.md` to Show HN (`https://news.ycombinator.com/show`).
- [ ] **Reddit:** Post `docs/launch/REDDIT.md` to `/r/selfhosted` or `/r/androiddev` (flair: `Open Source` / `Dev Project`).
- [ ] **Social Thread:** Publish launch thread from `docs/launch/SOCIAL_POSTS.md`.

---

## 2. Post-Launch Community & Incident Response Protocol

### Ground Rules for Maintainer Replies
1. **Never fabricate or over-promise:**
   - If someone asks: *"Does this support iOS?"* → Reply: *"Not currently. The mobile app is written in Jetpack Compose for Android. A cross-platform Flutter/KMP port is on our future exploration list, but today it is strictly Android."*
   - If someone asks: *"Can it control remote servers without Tailscale?"* → Reply: *"The bridge binds exclusively to loopback 127.0.0.1 for security. To reach it remotely, you must use Tailscale or an SSH tunnel. We intentionally avoid cloud relays to prevent credential exposure."*
2. **Reiterate non-affiliation when confused:**
   - Always state clearly: *"This is an independent community project and is not affiliated with, endorsed by, or sponsored by Google."*
3. **Turn valid feedback into GitHub issues immediately:**
   - If a commenter reports an unhandled edge case (e.g. specific Android OEM battery killing the background service), thank them directly and open an issue within 1 hour referencing their feedback.

---

## 3. Security Incident Escalation (P0/P1)

If a security researcher or user reports a security vulnerability:
1. **Direct to Private Disclosure:** Do not discuss details in public HN/Reddit comments or public GitHub issues. Direct them to the private GitHub Security Advisory form:
   `https://github.com/deekshudevang/Antigravity-Mobile-IDE/security/advisories/new`
2. **Acknowledge within 24 hours:** Send a receipt confirmation acknowledging the report.
3. **Reproduce & Patch:** Create a private advisory branch, reproduce the issue, craft the smallest effective fix, and run automated regression tests.
4. **Publish Advisory & Release:** Release a point patch (e.g. v2.0.1) and publish the advisory with full credit to the reporter.
