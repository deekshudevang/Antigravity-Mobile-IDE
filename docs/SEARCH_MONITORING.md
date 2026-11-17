# Search Engine Monitoring & Verification Guide (`docs/SEARCH_MONITORING.md`)

This guide details setup, indexing, verification, and monitoring procedures for **Antigravity Mobile IDE** on Google Search Console, Bing Webmaster Tools, and IndexNow.

---

## 1. Google Search Console (GSC) Setup

### Property Type
- **Recommended**: **URL-Prefix Property** for GitHub Pages:
  `https://deekshudevang.github.io/Antigravity-Mobile-IDE/`
  *(Domain properties require custom DNS control; URL-prefix is immediate for `github.io` subpaths).*

### Verification Procedure (Owner Action)
1. In GSC, click **Add Property** &rarr; enter `https://deekshudevang.github.io/Antigravity-Mobile-IDE/`.
2. Choose **HTML tag** verification method.
3. Copy the verification meta tag:
   ```html
   <meta name="google-site-verification" content="<!-- GSC_VERIFICATION_TOKEN_PLACEHOLDER -->">
   ```
4. Insert this tag into the `<head>` of `site/index.html` (recorded in `docs/OWNER_ACTIONS.md`).
5. Click **Verify** in GSC.

### Sitemap Submission
- Once verified, navigate to **Sitemaps** in the GSC left sidebar.
- Enter `sitemap.xml` and click **Submit**.
- Verify that GSC reports status **Success** and detects 7 submitted URLs.

### Key Reports to Monitor
- **Page Indexing (Coverage)**: Check for 404s, redirect errors, or `Excluded by 'noindex'` tags (only `404.html` should be excluded).
- **Performance**: Track organic queries for keywords ("antigravity mobile", "antigravity remote android").
- **Core Web Vitals**: Monitor Good/Needs Improvement/Poor ratings on mobile and desktop field data.

---

## 2. Bing Webmaster Tools Setup

### Immediate Import via Google Search Console
1. Log in to [Bing Webmaster Tools](https://www.bing.com/webmasters).
2. Click **Import from Google Search Console**.
3. Select the verified `https://deekshudevang.github.io/Antigravity-Mobile-IDE/` property.
4. All verified URLs, sitemaps, and settings will automatically synchronize with Bing without requiring separate DNS or meta-tag verification.

---

## 3. IndexNow (Optional Fast Crawling)

For immediate indexing of newly published releases or changelog updates:
- Generate an IndexNow key via Bing Webmaster Tools or standard key generator.
- Place `<key>.txt` in `site/` containing the key string.
- Submit changed URLs via IndexNow API POST request.

---

## 4. Recurring Health & Maintenance Routine

| Frequency | Task | Procedure | Target Threshold |
|---|---|---|---|
| **Weekly** | Broken Link Check | Run `node scripts/seo-audit.mjs` locally | 0 broken internal links, 0 errors |
| **Bi-weekly** | GSC Indexing Review | Inspect GSC Pages report for indexing status | 0 5xx or unhandled 404 errors |
| **Monthly** | WCAG Contrast Check | Run `node scripts/check-contrast.mjs` | 100% pass across Dark, Light, AMOLED |
| **Quarterly** | Dependency Audit | Run `npm audit` and update lockfile | 0 high or critical vulnerabilities |

---

## 5. Privacy-First Analytics Policy

**Default**: Zero analytics, zero third-party trackers, zero cookies.
- No cookie consent banners are required because no personal data or trackers are collected.
- If web analytics are desired in the future, the owner should choose cookieless, privacy-preserving solutions such as [Plausible Analytics](https://plausible.io) or [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/) (requires explicit owner authorization).
