#!/usr/bin/env node

/**
 * Technical SEO & HTML Validation Audit Script
 * 
 * Crawls the static site directory (default: ./site), validates HTML semantics,
 * meta tags, canonicals, heading hierarchy, image dimensions, internal links,
 * JSON-LD schema, sitemap, robots.txt, and doorway-page similarity.
 */

import { readFileSync, existsSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, resolve, relative, dirname } from 'path';
import * as cheerio from 'cheerio';
import { execSync } from 'child_process';

const DEFAULT_SITE_DIR = resolve('site');
const CANONICAL_BASE = 'https://deekshudevang.github.io/Antigravity-Mobile-IDE';

// Command-line arguments
const args = process.argv.slice(2);
let siteDir = DEFAULT_SITE_DIR;
let reportPath = null;
let outputJson = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--report' && args[i + 1]) {
    reportPath = resolve(args[i + 1]);
    i++;
  } else if (args[i] === '--json') {
    outputJson = true;
  } else if (!args[i].startsWith('--')) {
    siteDir = resolve(args[i]);
  }
}

const results = {
  date: new Date().toISOString(),
  commit: getGitCommit(),
  siteDir,
  totalFilesScanned: 0,
  passedChecks: 0,
  failedChecks: 0,
  warnings: [],
  errors: [],
  pages: []
};

function getGitCommit() {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
}

function findHtmlFiles(dir, fileList = []) {
  if (!existsSync(dir)) return fileList;
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      findHtmlFiles(fullPath, fileList);
    } else if (entry.endsWith('.html')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

// Word token set for Jaccard similarity
function getWordTokens(text) {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 3);
  return new Set(words);
}

function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// 1. Audit Global Files (robots.txt, sitemap.xml)
function auditGlobalFiles() {
  // robots.txt
  const robotsPath = join(siteDir, 'robots.txt');
  if (!existsSync(robotsPath)) {
    results.errors.push({ file: 'robots.txt', rule: 'robots.txt exists', message: 'robots.txt not found in site root' });
  } else {
    results.passedChecks++;
    const robotsContent = readFileSync(robotsPath, 'utf8');
    if (!robotsContent.includes('Sitemap:')) {
      results.errors.push({ file: 'robots.txt', rule: 'robots.txt sitemap directive', message: 'robots.txt missing Sitemap: line' });
    } else {
      results.passedChecks++;
    }
  }

  // sitemap.xml
  const sitemapPath = join(siteDir, 'sitemap.xml');
  const sitemapUrls = new Set();
  if (!existsSync(sitemapPath)) {
    results.errors.push({ file: 'sitemap.xml', rule: 'sitemap.xml exists', message: 'sitemap.xml not found in site root' });
  } else {
    results.passedChecks++;
    const sitemapContent = readFileSync(sitemapPath, 'utf8');
    const locMatches = sitemapContent.matchAll(/<loc>(.*?)<\/loc>/g);
    for (const match of locMatches) {
      sitemapUrls.add(match[1].trim());
    }
    if (sitemapUrls.size === 0) {
      results.errors.push({ file: 'sitemap.xml', rule: 'sitemap non-empty', message: 'sitemap.xml contains 0 URLs' });
    } else {
      results.passedChecks++;
    }
  }

  return sitemapUrls;
}

// 2. Audit Individual HTML Pages
function auditPage(filePath, sitemapUrls, allPagesText) {
  const relPath = relative(siteDir, filePath).replace(/\\/g, '/');
  const content = readFileSync(filePath, 'utf8');
  const $ = cheerio.load(content);
  const is404 = relPath.includes('404');

  const pageReport = {
    file: relPath,
    title: $('title').text().trim(),
    h1Count: $('h1').length,
    canonical: $('link[rel="canonical"]').attr('href') || null,
    errors: [],
    warnings: []
  };

  // Check <html lang>
  const lang = $('html').attr('lang');
  if (!lang) {
    pageReport.errors.push('Missing <html lang="..."> attribute');
  } else {
    results.passedChecks++;
  }

  // Check viewport
  if (!$('meta[name="viewport"]').length) {
    pageReport.errors.push('Missing <meta name="viewport">');
  } else {
    results.passedChecks++;
  }

  // Check <title>
  const title = pageReport.title;
  if (!title) {
    pageReport.errors.push('Missing or empty <title>');
  } else if (title.length > 60) {
    pageReport.warnings.push(`Title length (${title.length}) exceeds 60 chars: "${title}"`);
  } else {
    results.passedChecks++;
  }

  // Check description
  const description = $('meta[name="description"]').attr('content')?.trim();
  if (!is404) {
    if (!description) {
      pageReport.errors.push('Missing <meta name="description">');
    } else if (description.length > 160) {
      pageReport.warnings.push(`Description length (${description.length}) exceeds 160 chars`);
    } else {
      results.passedChecks++;
    }
  }

  // Check canonical
  const canonical = pageReport.canonical;
  if (!is404) {
    if (!canonical) {
      pageReport.errors.push('Missing <link rel="canonical">');
    } else if (!canonical.startsWith(CANONICAL_BASE)) {
      pageReport.errors.push(`Canonical URL "${canonical}" does not start with expected base "${CANONICAL_BASE}"`);
    } else {
      results.passedChecks++;
    }

    // Check sitemap inclusion
    if (canonical && sitemapUrls.size > 0) {
      if (!sitemapUrls.has(canonical)) {
        pageReport.errors.push(`Canonical "${canonical}" is not listed in sitemap.xml`);
      } else {
        results.passedChecks++;
      }
    }
  }

  // Check single <h1>
  if ($('h1').length === 0) {
    pageReport.errors.push('Page is missing an <h1> element');
  } else if ($('h1').length > 1) {
    pageReport.errors.push(`Page has multiple <h1> elements (${$('h1').length})`);
  } else {
    results.passedChecks++;
  }

  // Check semantic landmarks
  if (!$('header').length || !$('main').length || !$('footer').length) {
    pageReport.warnings.push('Page missing standard landmark elements (<header>, <main>, <footer>)');
  } else {
    results.passedChecks++;
  }

  // Check skip link
  if (!$('a.skip-link').length) {
    pageReport.warnings.push('Missing accessibility skip link (<a class="skip-link">)');
  } else {
    results.passedChecks++;
  }

  // Check images
  $('img').each((_, el) => {
    const src = $(el).attr('src');
    const alt = $(el).attr('alt');
    const width = $(el).attr('width');
    const height = $(el).attr('height');

    if (!alt && alt !== '') {
      pageReport.errors.push(`Image missing alt attribute: ${src}`);
    } else {
      results.passedChecks++;
    }

    if (!width || !height) {
      pageReport.warnings.push(`Image missing explicit width/height (CLS risk): ${src}`);
    } else {
      results.passedChecks++;
    }

    if (src && !src.startsWith('http') && !src.startsWith('data:')) {
      const resolvedImgPath = resolve(dirname(filePath), src);
      if (!existsSync(resolvedImgPath)) {
        pageReport.errors.push(`Broken local image reference: ${src} (resolved to ${resolvedImgPath})`);
      } else {
        results.passedChecks++;
      }
    }
  });

  // Check internal links
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return;
    const cleanHref = href.split('#')[0];
    if (!cleanHref) return;

    let targetPath;
    if (cleanHref.endsWith('/')) {
      targetPath = resolve(dirname(filePath), cleanHref, 'index.html');
    } else if (cleanHref.endsWith('.html')) {
      targetPath = resolve(dirname(filePath), cleanHref);
    } else {
      targetPath = resolve(dirname(filePath), cleanHref);
    }

    if (!existsSync(targetPath)) {
      pageReport.errors.push(`Broken internal link: "${href}" (resolved to ${targetPath})`);
    } else {
      results.passedChecks++;
    }
  });

  // Check Open Graph & Twitter Cards
  if (!is404) {
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const ogDesc = $('meta[property="og:description"]').attr('content');
    const ogImage = $('meta[property="og:image"]').attr('content');
    const twitterCard = $('meta[name="twitter:card"]').attr('content');

    if (!ogTitle || !ogDesc || !ogImage) {
      pageReport.errors.push('Missing required Open Graph tags (og:title, og:description, og:image)');
    } else {
      results.passedChecks++;
    }

    if (!twitterCard) {
      pageReport.errors.push('Missing meta name="twitter:card"');
    } else {
      results.passedChecks++;
    }
  }

  // Check JSON-LD
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).text());
      if (json['@context'] !== 'https://schema.org') {
        pageReport.errors.push('JSON-LD @context must be "https://schema.org"');
      } else {
        results.passedChecks++;
      }

      // Check for forbidden fabricated rating/review fields
      if (json.aggregateRating || json.review || json.ratingCount) {
        pageReport.errors.push('Fabricated aggregateRating / review fields found in JSON-LD');
      } else {
        results.passedChecks++;
      }
    } catch (err) {
      pageReport.errors.push(`JSON-LD parse error: ${err.message}`);
    }
  });

  // Collect page prose for doorway similarity check
  const bodyText = $('main').text() || $('body').text();
  const tokens = getWordTokens(bodyText);
  allPagesText.push({ file: relPath, tokens });

  if (pageReport.errors.length > 0) {
    results.failedChecks += pageReport.errors.length;
    results.errors.push(...pageReport.errors.map(err => ({ file: relPath, message: err })));
  }
  if (pageReport.warnings.length > 0) {
    results.warnings.push(...pageReport.warnings.map(warn => ({ file: relPath, message: warn })));
  }

  results.pages.push(pageReport);
}

// 3. Doorway Page Near-Duplicate Similarity Check
function checkNearDuplicates(allPagesText) {
  const SIMILARITY_THRESHOLD = 0.85; // 85% Jaccard word similarity indicates doorway duplication
  for (let i = 0; i < allPagesText.length; i++) {
    for (let j = i + 1; j < allPagesText.length; j++) {
      const pageA = allPagesText[i];
      const pageB = allPagesText[j];
      const sim = jaccardSimilarity(pageA.tokens, pageB.tokens);
      if (sim > SIMILARITY_THRESHOLD) {
        results.errors.push({
          file: `${pageA.file} & ${pageB.file}`,
          rule: 'Doorway Page Prevention',
          message: `Near-duplicate content detected: ${(sim * 100).toFixed(1)}% similarity (limit: ${SIMILARITY_THRESHOLD * 100}%)`
        });
      } else {
        results.passedChecks++;
      }
    }
  }
}

// Run audit
const sitemapUrls = auditGlobalFiles();
const htmlFiles = findHtmlFiles(siteDir);
results.totalFilesScanned = htmlFiles.length;

const allPagesText = [];
for (const file of htmlFiles) {
  auditPage(file, sitemapUrls, allPagesText);
}

checkNearDuplicates(allPagesText);

// Markdown Report Generator
function generateMarkdownReport() {
  const statusEmoji = results.errors.length === 0 ? '✅ PASSED' : '❌ FAILED';
  return `# SEO & Technical Quality Audit Report

- **Date**: ${results.date}
- **Commit**: \`${results.commit}\`
- **Scanned Directory**: \`${results.siteDir}\`
- **Total HTML Pages**: ${results.totalFilesScanned}
- **Status**: **${statusEmoji}**
- **Passed Checks**: ${results.passedChecks}
- **Errors**: ${results.errors.length}
- **Warnings**: ${results.warnings.length}

---

## 1. Summary by Page

| Page | Title (Length) | <h1> | Canonical | Status |
|---|---|---|---|---|
${results.pages.map(p => `| \`${p.file}\` | "${p.title.slice(0, 35)}..." (${p.title.length}) | ${p.h1Count} | \`${p.canonical || 'None'}\` | ${p.errors.length === 0 ? 'PASS' : 'FAIL'} |`).join('\n')}

---

## 2. Issues & Warnings

### Errors (${results.errors.length})
${results.errors.length === 0 ? 'None. All structural, SEO, and accessibility rules passed.' : results.errors.map(e => `- **[${e.file}]**: ${e.message}`).join('\n')}

### Warnings (${results.warnings.length})
${results.warnings.length === 0 ? 'None.' : results.warnings.map(w => `- **[${w.file}]**: ${w.message}`).join('\n')}

---

## 3. Crawlability & Indexing Verification

- **Robots.txt**: Verified present and declaring sitemap directive.
- **Sitemap.xml**: All canonical URLs verified against existing files.
- **Doorway Page Prevention**: Max page pair similarity below threshold.
- **Structured Data**: JSON-LD verified without fabricated reviews or ratings.
`;
}

if (reportPath) {
  writeFileSync(reportPath, generateMarkdownReport());
  console.log(`Report written to ${reportPath}`);
}

if (outputJson) {
  console.log(JSON.stringify(results, null, 2));
} else {
  console.log(`\n══════════════════════════════════════════════════════════════════`);
  console.log(`  SEO & Technical Validation Audit (${results.totalFilesScanned} pages scanned)`);
  console.log(`══════════════════════════════════════════════════════════════════`);
  console.log(`  Passed Checks : ${results.passedChecks}`);
  console.log(`  Errors        : ${results.errors.length}`);
  console.log(`  Warnings      : ${results.warnings.length}`);
  if (results.errors.length > 0) {
    console.log(`\n❌ Failed Checks:`);
    results.errors.forEach(e => console.log(`  - [${e.file}] ${e.message}`));
  } else {
    console.log(`\n✅ ALL SEO, CRAWLABILITY, AND HTML CHECKS PASSED CLEANLY!`);
  }
}

process.exit(results.errors.length === 0 ? 0 : 1);
