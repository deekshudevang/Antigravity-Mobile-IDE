package de.xyourp.antigravitymobile.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.PlainTooltip
import androidx.compose.material3.Text
import androidx.compose.material3.TooltipBox
import androidx.compose.material3.TooltipDefaults
import androidx.compose.material3.rememberTooltipState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import de.xyourp.antigravitymobile.ui.theme.AgTheme

enum class ObservationType {
    OBSERVED,
    INFERRED,
    UNKNOWN
}

@OptIn(ExperimentalFoundationApi::class, ExperimentalMaterial3Api::class)
@Composable
fun StateMarker(
    type: ObservationType,
    color: Color = AgTheme.colors.accent,
    size: Dp = 10.dp,
    modifier: Modifier = Modifier
) {
    val description = when (type) {
        ObservationType.OBSERVED -> "Directly observed from IDE"
        ObservationType.INFERRED -> "Inferred from bridge telemetry"
        ObservationType.UNKNOWN -> "State unknown or unavailable"
    }

    val tooltipState = rememberTooltipState()

    TooltipBox(
        positionProvider = TooltipDefaults.rememberPlainTooltipPositionProvider(),
        tooltip = {
            PlainTooltip {
                Text(description, style = AgTheme.typography.monoSmall)
            }
        },
        state = tooltipState
    ) {
        Box(
            modifier = modifier
                .size(size)
                .semantics { contentDescription = description },
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.size(size)) {
                val radius = this.size.minDimension / 2f
                val center = Offset(radius, radius)

                when (type) {
                    ObservationType.OBSERVED -> {
                        drawCircle(
                            color = color,
                            radius = radius,
                            center = center
                        )
                    }
                    ObservationType.INFERRED -> {
                        drawCircle(
                            color = color,
                            radius = radius - 1.dp.toPx(),
                            center = center,
                            style = Stroke(width = 1.5.dp.toPx())
                        )
                    }
                    ObservationType.UNKNOWN -> {
                        val intervals = floatArrayOf(3.dp.toPx(), 3.dp.toPx())
                        drawCircle(
                            color = color,
                            radius = radius - 1.dp.toPx(),
                            center = center,
                            style = Stroke(
                                width = 1.5.dp.toPx(),
                                pathEffect = PathEffect.dashPathEffect(intervals, 0f)
                            )
                        )
                    }
                }
            }
        }
    }
}
