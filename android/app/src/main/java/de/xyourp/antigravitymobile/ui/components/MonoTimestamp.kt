package de.xyourp.antigravitymobile.ui.components

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.combinedClickable
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.PlainTooltip
import androidx.compose.material3.Text
import androidx.compose.material3.TooltipBox
import androidx.compose.material3.TooltipDefaults
import androidx.compose.material3.rememberTooltipState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import de.xyourp.antigravitymobile.ui.theme.AgTheme
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

@OptIn(ExperimentalFoundationApi::class, ExperimentalMaterial3Api::class)
@Composable
fun MonoTimestamp(
    timestampMs: Long,
    modifier: Modifier = Modifier
) {
    var now by remember { mutableStateOf(System.currentTimeMillis()) }

    LaunchedEffect(timestampMs) {
        while (true) {
            delay(1000)
            now = System.currentTimeMillis()
        }
    }

    val elapsedSec = ((now - timestampMs) / 1000).coerceAtLeast(0)
    val relativeText = when {
        elapsedSec < 60 -> "${elapsedSec}s ago"
        elapsedSec < 3600 -> "${elapsedSec / 60}m ago"
        elapsedSec < 86400 -> "${elapsedSec / 3600}h ago"
        else -> "${elapsedSec / 86400}d ago"
    }

    val absoluteText = remember(timestampMs) {
        val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm:ss z", Locale.getDefault())
        sdf.timeZone = TimeZone.getDefault()
        sdf.format(Date(timestampMs))
    }

    val tooltipState = rememberTooltipState()

    TooltipBox(
        positionProvider = TooltipDefaults.rememberPlainTooltipPositionProvider(),
        tooltip = {
            PlainTooltip {
                Text(absoluteText, style = AgTheme.typography.monoSmall)
            }
        },
        state = tooltipState
    ) {
        Text(
            text = relativeText,
            style = AgTheme.typography.monoSmall,
            color = AgTheme.colors.text3,
            modifier = modifier
        )
    }
}
