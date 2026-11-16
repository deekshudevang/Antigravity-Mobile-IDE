#!/usr/bin/env node
/**
 * Antigravity Remote — Design Tokens Contrast Checker
 * Validates WCAG 2.1 AA / AAA contrast ratios across Dark, Light, and AMOLED themes.
 * Fails the build if any required pair drops below its minimum threshold.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = join(__dirname, '..', 'design', 'tokens.json');

function srgbToLinear(c) {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function calculateLuminance(hex) {
    const cleanHex = hex.replace('#', '').trim();
    const num = parseInt(cleanHex, 16);
    const r = srgbToLinear((num >> 16) & 255);
    const g = srgbToLinear((num >> 8) & 255);
    const b = srgbToLinear(num & 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function calculateContrastRatio(hex1, hex2) {
    const l1 = calculateLuminance(hex1);
    const l2 = calculateLuminance(hex2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

export function runContrastAudit() {
    const tokens = JSON.parse(readFileSync(TOKENS_PATH, 'utf-8'));
    const { color, contrastPairs } = tokens;
    const themes = ['dark', 'light', 'amoled'];

    let totalChecks = 0;
    let failedChecks = 0;
    const failures = [];

    console.log('══════════════════════════════════════════════════════════════════════');
    console.log('  🎨 Antigravity Remote — WCAG Contrast Ratio Verification');
    console.log('══════════════════════════════════════════════════════════════════════');

    for (const theme of themes) {
        const palette = color[theme];
        if (!palette) {
            console.error(`[ERROR] Missing palette for theme: ${theme}`);
            process.exit(1);
        }

        console.log(`\n▶ Theme: ${theme.toUpperCase()}`);

        for (const pair of contrastPairs) {
            totalChecks++;
            const fgHex = palette[pair.fg];
            const bgHex = palette[pair.bg];

            if (!fgHex || !bgHex) {
                failures.push({ theme, pair, reason: `Missing token: fg=${pair.fg} (${fgHex}), bg=${pair.bg} (${bgHex})` });
                failedChecks++;
                continue;
            }

            const ratio = calculateContrastRatio(fgHex, bgHex);
            const passed = ratio >= pair.minRatio;

            if (!passed) {
                failedChecks++;
                failures.push({
                    theme,
                    fg: pair.fg,
                    fgHex,
                    bg: pair.bg,
                    bgHex,
                    ratio: ratio.toFixed(2),
                    minRatio: pair.minRatio,
                    role: pair.role
                });
                console.log(`  ✖ [FAIL] ${pair.fg} (${fgHex}) on ${pair.bg} (${bgHex}) = ${ratio.toFixed(2)}:1 (min ${pair.minRatio}:1)`);
            } else {
                console.log(`  ✔ [PASS] ${pair.fg.padEnd(14)} on ${pair.bg.padEnd(10)}: ${ratio.toFixed(2).padStart(5)}:1 (req ${pair.minRatio}:1)`);
            }
        }
    }

    console.log('\n──────────────────────────────────────────────────────────────────────');
    console.log(`Total checks: ${totalChecks} | Passed: ${totalChecks - failedChecks} | Failures: ${failedChecks}`);

    if (failedChecks > 0) {
        console.error('\n❌ CONTRAST VERIFICATION FAILED:');
        for (const f of failures) {
            console.error(`   - [${f.theme}] ${f.fg} on ${f.bg}: ${f.ratio}:1 (expected >= ${f.minRatio}:1)`);
        }
        return false;
    }

    console.log('✅ ALL WCAG CONTRAST CHECKS PASSED SUCCESSFULLY!\n');
    return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const success = runContrastAudit();
    process.exit(success ? 0 : 1);
}
