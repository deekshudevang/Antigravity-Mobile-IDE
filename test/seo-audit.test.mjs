/**
 * Automated Unit Test Suite for scripts/seo-audit.mjs
 * 
 * Verifies that the SEO audit script correctly passes valid sites
 * and catches broken pages (missing titles, missing alt, multiple h1, broken links).
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execSync } from 'node:child_process';

test('SEO Validation Script Suite (Phase 9)', async (t) => {
  await t.test('1. Passes cleanly on the production site/ directory', () => {
    const cmd = `node scripts/seo-audit.mjs --json`;
    const output = execSync(cmd).toString();
    const parsed = JSON.parse(output);
    assert.equal(parsed.errors.length, 0, 'Production site should have 0 SEO errors');
    assert.ok(parsed.passedChecks > 200, 'Should have verified > 200 checks');
  });

  await t.test('2. Correctly flags missing title, multiple H1, and missing alt in broken fixtures', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'seo-broken-fixture-'));
    try {
      // Create broken robots and sitemap
      writeFileSync(join(tempDir, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://deekshudevang.github.io/Antigravity-Mobile-IDE/sitemap.xml\n');
      writeFileSync(join(tempDir, 'sitemap.xml'), '<urlset><url><loc>https://deekshudevang.github.io/Antigravity-Mobile-IDE/</loc></url></urlset>');

      // Create broken index.html
      const brokenHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="viewport" content="width=device-width">
  <link rel="canonical" href="https://deekshudevang.github.io/Antigravity-Mobile-IDE/">
</head>
<body>
  <h1>First Heading</h1>
  <h1>Second Duplicate Heading</h1>
  <img src="missing.png">
  <a href="broken-link.html">Broken Link</a>
</body>
</html>`;
      writeFileSync(join(tempDir, 'index.html'), brokenHtml);

      // Run audit against the broken fixture
      let failed = false;
      try {
        execSync(`node scripts/seo-audit.mjs "${tempDir}" --json`);
      } catch (err) {
        failed = true;
        const stdout = err.stdout.toString();
        const parsed = JSON.parse(stdout);
        assert.ok(parsed.errors.length > 0, 'Broken fixture must produce errors');
        const errMessages = parsed.errors.map(e => e.message).join('; ');
        assert.ok(errMessages.includes('Missing or empty <title>'), 'Must flag missing title');
        assert.ok(errMessages.includes('multiple <h1>'), 'Must flag multiple H1');
        assert.ok(errMessages.includes('missing alt attribute'), 'Must flag missing alt');
        assert.ok(errMessages.includes('Broken internal link'), 'Must flag broken link');
      }
      assert.equal(failed, true, 'Audit script must exit with non-zero on broken pages');
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
