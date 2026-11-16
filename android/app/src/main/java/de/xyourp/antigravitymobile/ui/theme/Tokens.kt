// AUTO-GENERATED from design/tokens.json — DO NOT EDIT DIRECTLY
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

val DarkColorTokens = AgColorTokens(
    bg = Color(0xFF0E1012),
    surface1 = Color(0xFF14171A),
    surface2 = Color(0xFF1A1E22),
    surface3 = Color(0xFF21262B),
    hairline = Color(0xFF2A3036),
    hairlineStrong = Color(0xFF3A424A),
    outlineControl = Color(0xFF6B7782),
    text1 = Color(0xFFE8ECEF),
    text2 = Color(0xFFA3ADB5),
    text3 = Color(0xFF828E99),
    accent = Color(0xFF3FB8A5),
    onAccent = Color(0xFF06201B),
    accentMuted = Color(0xFF12332E),
    ok = Color(0xFF6BCB8B),
    warn = Color(0xFFE3A23B),
    error = Color(0xFFE5655F),
    info = Color(0xFF6C9BD1)
)

val LightColorTokens = AgColorTokens(
    bg = Color(0xFFF3F1EC),
    surface1 = Color(0xFFFAF9F6),
    surface2 = Color(0xFFEFEDE7),
    surface3 = Color(0xFFE6E3DC),
    hairline = Color(0xFFD9D5CC),
    hairlineStrong = Color(0xFFBDB8AD),
    outlineControl = Color(0xFF7A828A),
    text1 = Color(0xFF15181B),
    text2 = Color(0xFF4A525A),
    text3 = Color(0xFF5E666E),
    accent = Color(0xFF0F7F70),
    onAccent = Color(0xFFFFFFFF),
    accentMuted = Color(0xFFD6EEE9),
    ok = Color(0xFF1F7A45),
    warn = Color(0xFF8A5A00),
    error = Color(0xFFB3261E),
    info = Color(0xFF2F5F96)
)

val AmoledColorTokens = AgColorTokens(
    bg = Color(0xFF000000),
    surface1 = Color(0xFF0A0C0D),
    surface2 = Color(0xFF1A1E22),
    surface3 = Color(0xFF21262B),
    hairline = Color(0xFF2A3036),
    hairlineStrong = Color(0xFF3A424A),
    outlineControl = Color(0xFF6B7782),
    text1 = Color(0xFFE8ECEF),
    text2 = Color(0xFFA3ADB5),
    text3 = Color(0xFF828E99),
    accent = Color(0xFF3FB8A5),
    onAccent = Color(0xFF06201B),
    accentMuted = Color(0xFF12332E),
    ok = Color(0xFF6BCB8B),
    warn = Color(0xFFE3A23B),
    error = Color(0xFFE5655F),
    info = Color(0xFF6C9BD1)
)

object AgSpacing {
    val xs = 4.dp
    val sm = 8.dp
    val md = 12.dp
    val base = 16.dp
    val lg = 20.dp
    val xl = 24.dp
    val xxl = 32.dp
    val xxxl = 48.dp
    val gutter = 16.dp
    val rowMin = 56.dp
    val rowCompact = 40.dp
}

object AgShapes {
    val xs = RoundedCornerShape(4.dp)
    val sm = RoundedCornerShape(8.dp)
    val md = RoundedCornerShape(12.dp)
    val lg = RoundedCornerShape(16.dp)
    val pill = CircleShape
}

object AgMotion {
    const val pressFeedbackMs = 90
    const val stateChangeMs = 180
    const val screenTransitionMs = 240
    const val heartbeatTickMs = 600
}
