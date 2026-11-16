package de.xyourp.antigravitymobile.ui.components

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import de.xyourp.antigravitymobile.ui.theme.AgTheme

@Composable
fun PulseLine(
    lastHeartbeatMs: Long,
    modifier: Modifier = Modifier
) {
    val now = remember(lastHeartbeatMs) { System.currentTimeMillis() }
    val ageSeconds = (now - lastHeartbeatMs) / 1000
    val isAlive = ageSeconds <= 15

    val pulseAnim = remember { Animatable(0f) }

    LaunchedEffect(lastHeartbeatMs) {
        if (isAlive) {
            pulseAnim.snapTo(1f)
            pulseAnim.animateTo(
                targetValue = 0f,
                animationSpec = tween(durationMillis = 600, easing = FastOutSlowInEasing)
            )
        } else {
            pulseAnim.snapTo(0f)
        }
    }

    val lineColor = if (isAlive) AgTheme.colors.accent else AgTheme.colors.hairline
    val pulseColor = AgTheme.colors.accent
    val pulseAlpha = pulseAnim.value

    Box(modifier = modifier.fillMaxWidth().height(16.dp)) {
        Canvas(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .align(Alignment.CenterStart)
        ) {
            val width = size.width
            drawLine(
                color = lineColor.copy(alpha = if (isAlive) 0.6f else 0.3f),
                start = Offset(0f, 0f),
                end = Offset(width, 0f),
                strokeWidth = 1.dp.toPx()
            )

            if (isAlive && pulseAlpha > 0f) {
                // Heartbeat tick blip in center
                val cx = width / 2f
                val tickWidth = 24.dp.toPx()
                drawLine(
                    color = pulseColor.copy(alpha = pulseAlpha),
                    start = Offset(cx - tickWidth / 2f, 0f),
                    end = Offset(cx + tickWidth / 2f, 0f),
                    strokeWidth = 2.dp.toPx()
                )
            }
        }

        if (!isAlive) {
            Text(
                text = "last signal ${ageSeconds}s ago",
                style = AgTheme.typography.monoSmall,
                color = AgTheme.colors.text3,
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .padding(end = 4.dp)
            )
        }
    }
}
