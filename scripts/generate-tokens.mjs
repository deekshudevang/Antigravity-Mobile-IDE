#!/usr/bin/env node
/**
 * Antigravity Remote — Token Generator (design/tokens.json -> Tokens.kt)
 * Single source of truth code generator for Android Jetpack Compose tokens.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = join(__dirname, '..', 'design', 'tokens.json');
const OUTPUT_PATH = join(__dirname, '..', 'android', 'app', 'src', 'main', 'java', 'de', 'xyourp', 'antigravitymobile', 'ui', 'theme', 'Tokens.kt');

export function generateTokens() {
    const raw = readFileSync(TOKENS_PATH, 'utf-8');
    const tokens = JSON.parse(raw);

    const formatColor = (hex) => `Color(0xFF${hex.replace('#', '').toUpperCase()})`;

    const generatePalette = (themeName, colors) => {
        return `val ${themeName}ColorTokens = AgColorTokens(
    bg = ${formatColor(colors.bg)},
    surface1 = ${formatColor(colors.surface1)},
    surface2 = ${formatColor(colors.surface2)},
    surface3 = ${formatColor(colors.surface3)},
    hairline = ${formatColor(colors.hairline)},
    hairlineStrong = ${formatColor(colors.hairlineStrong)},
    outlineControl = ${formatColor(colors.outlineControl)},
    text1 = ${formatColor(colors.text1)},
    text2 = ${formatColor(colors.text2)},
    text3 = ${formatColor(colors.text3)},
    accent = ${formatColor(colors.accent)},
    onAccent = ${formatColor(colors.onAccent)},
    accentMuted = ${formatColor(colors.accentMuted)},
    ok = ${formatColor(colors.ok)},
    warn = ${formatColor(colors.warn)},
    error = ${formatColor(colors.error)},
    info = ${formatColor(colors.info)}
)`;
    };

    const content = `// AUTO-GENERATED from design/tokens.json — DO NOT EDIT DIRECTLY
package de.xyourp.antigravitymobile.ui.theme

import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Immutable
data class AgColorTokens(
    val bg: Color,
    val surface1: Color,
    val surface2: Color,
    val surface3: Color,
    val hairline: Color,
    val hairlineStrong: Color,
    val outlineControl: Color,
    val text1: Color,
    val text2: Color,
    val text3: Color,
    val accent: Color,
    val onAccent: Color,
    val accentMuted: Color,
    val ok: Color,
    val warn: Color,
    val error: Color,
    val info: Color
)

${generatePalette('Dark', tokens.color.dark)}

${generatePalette('Light', tokens.color.light)}

${generatePalette('Amoled', tokens.color.amoled)}

object AgSpacing {
    val xs = ${tokens.space.xs}.dp
    val sm = ${tokens.space.sm}.dp
    val md = ${tokens.space.md}.dp
    val base = ${tokens.space.base}.dp
    val lg = ${tokens.space.lg}.dp
    val xl = ${tokens.space.xl}.dp
    val xxl = ${tokens.space.xxl}.dp
    val xxxl = ${tokens.space.xxxl}.dp
    val gutter = ${tokens.space.gutter}.dp
    val rowMin = ${tokens.space.rowMin}.dp
    val rowCompact = ${tokens.space.rowCompact}.dp
}

object AgShapes {
    val xs = RoundedCornerShape(${tokens.radius.xs}.dp)
    val sm = RoundedCornerShape(${tokens.radius.sm}.dp)
    val md = RoundedCornerShape(${tokens.radius.md}.dp)
    val lg = RoundedCornerShape(${tokens.radius.lg}.dp)
    val pill = CircleShape
}

object AgMotion {
    const val pressFeedbackMs = ${tokens.motion.pressFeedbackMs}
    const val stateChangeMs = ${tokens.motion.stateChangeMs}
    const val screenTransitionMs = ${tokens.motion.screenTransitionMs}
    const val heartbeatTickMs = ${tokens.motion.heartbeatTickMs}
}
`;

    writeFileSync(OUTPUT_PATH, content, 'utf-8');
    console.log(`[SUCCESS] Generated ${OUTPUT_PATH}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    generateTokens();
}
