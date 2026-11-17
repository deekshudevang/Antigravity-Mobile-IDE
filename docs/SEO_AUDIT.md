# Technical SEO & Crawlability Audit (`docs/SEO_AUDIT.md`)

**Date**: 2026-11-17  
**Scope**: Web crawlability, search engine indexing, metadata, structured data, and keyword relevance.

---

## 1. Current State Assessment

Currently, **no public website exists** for this repository. All documentation is stored in raw GitHub Markdown files.

### Gaps Identified:
1. **Zero Organic Web Presence Outside GitHub**:
   - Prospective users searching for "antigravity mobile", "antigravity android companion", or "control antigravity from phone" on Google or Bing can only find raw GitHub markdown or discussions.
   - GitHub raw markdown does not render rich HTML metadata, Open Graph preview tags, Twitter cards, or JSON-LD structured data.
2. **Missing Crawl Directives**:
   - No `robots.txt` exists to guide search spiders.
   - No `sitemap.xml` exists to index core pages.
3. **No Structured Data (JSON-LD)**:
   - Search engines cannot extract application schemas (`SoftwareApplication`, `operatingSystem: Android, Windows`, `applicationCategory: DeveloperApplication`).
4. **No LLM Fact Sheet (`llms.txt`)**:
   - AI search engines (Perplexity, ChatGPT Search, Gemini) rely on concise, factual markdown summaries at `/llms.txt` to answer queries about developer tools accurately without hallucinating official status.

---

## 2. Technical SEO Plan (Phase 6 Architecture)

To resolve all discoverability gaps, Phase 6 will deploy a lightweight, static, high-performance website to GitHub Pages (`site/`):

- **Target Domain / Base URL**: `https://deekshudevang.github.io/Antigravity-Mobile-IDE/`
- **Foundation Files**:
  - `site/robots.txt`: Allows indexing of all public pages and declares sitemap location.
  - `site/sitemap.xml`: Canonical list of indexable URLs with accurate `lastmod` timestamps.
  - `site/manifest.webmanifest`: PWA manifest for modern mobile install prompts.
  - `site/llms.txt`: Factual project summary for AI search systems.
- **On-Page SEO Standards**:
  - Unique `<title>` (≤60 characters) and `<meta name="description">` (≤160 characters) per page.
  - Self-referencing `<link rel="canonical">` handling project subpaths.
  - Open Graph (`og:title`, `og:description`, `og:image`, `og:url`) and Twitter Cards.
  - Truthful `SoftwareApplication` JSON-LD omitting fake review/rating/download counts.
  - Zero Cumulative Layout Shift (CLS) through explicit image dimensions.
  - Semantic HTML landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`, single `<h1>`).
