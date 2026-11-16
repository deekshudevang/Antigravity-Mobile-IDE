package de.xyourp.antigravitymobile.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import de.xyourp.antigravitymobile.ui.theme.AgTheme

enum class CellStatus {
    OK,
    WARN,
    ERROR,
    UNKNOWN
}

data class SignalCellData(
    val title: String,
    val statusText: String,
    val status: CellStatus,
    val ageSec: Long?,
    val failureTip: String? = null
)

data class SignalStripState(
    val tailscale: SignalCellData = SignalCellData("Tailscale", "UNKNOWN", CellStatus.UNKNOWN, null),
    val tailnet: SignalCellData = SignalCellData("Tailnet", "UNKNOWN", CellStatus.UNKNOWN, null),
    val bridge: SignalCellData = SignalCellData("Bridge", "UNKNOWN", CellStatus.UNKNOWN, null),
    val auth: SignalCellData = SignalCellData("Auth", "UNKNOWN", CellStatus.UNKNOWN, null)
)

@Composable
fun SignalStrip(
    state: SignalStripState,
    modifier: Modifier = Modifier
) {
    var expandedCell by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(AgTheme.shapes.sm)
            .background(AgTheme.colors.surface1)
            .border(1.dp, AgTheme.colors.hairline, AgTheme.shapes.sm)
            .padding(4.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            SignalCell(
                data = state.tailscale,
                isSelected = expandedCell == "Tailscale",
                onClick = {
                    expandedCell = if (expandedCell == "Tailscale") null else "Tailscale"
                },
                modifier = Modifier.weight(1f)
            )
            SignalCell(
                data = state.tailnet,
                isSelected = expandedCell == "Tailnet",
                onClick = {
                    expandedCell = if (expandedCell == "Tailnet") null else "Tailnet"
                },
                modifier = Modifier.weight(1f)
            )
            SignalCell(
                data = state.bridge,
                isSelected = expandedCell == "Bridge",
                onClick = {
                    expandedCell = if (expandedCell == "Bridge") null else "Bridge"
                },
                modifier = Modifier.weight(1f)
            )
            SignalCell(
                data = state.auth,
                isSelected = expandedCell == "Auth",
                onClick = {
                    expandedCell = if (expandedCell == "Auth") null else "Auth"
                },
                modifier = Modifier.weight(1f)
            )
        }

        // Expanded failure advice
        val activeTip = when (expandedCell) {
            "Tailscale" -> state.tailscale.failureTip ?: "Tailscale VPN service status."
            "Tailnet" -> state.tailnet.failureTip ?: "Reachability of the PC across Tailnet."
            "Bridge" -> state.bridge.failureTip ?: "Bridge HTTP & WebSocket service health."
            "Auth" -> state.auth.failureTip ?: "Active device pairing and security tokens."
            else -> null
        }

        AnimatedVisibility(
            visible = expandedCell != null && activeTip != null,
            enter = expandVertically(),
            exit = shrinkVertically()
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 4.dp)
                    .clip(AgTheme.shapes.xs)
                    .background(AgTheme.colors.surface2)
                    .padding(horizontal = 8.dp, vertical = 6.dp)
            ) {
                Text(
                    text = activeTip.orEmpty(),
                    style = AgTheme.typography.monoSmall,
                    color = AgTheme.colors.text2
                )
            }
        }
    }
}

@Composable
fun SignalCell(
    data: SignalCellData,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val statusColor = when (data.status) {
        CellStatus.OK -> AgTheme.colors.ok
        CellStatus.WARN -> AgTheme.colors.warn
        CellStatus.ERROR -> AgTheme.colors.error
        CellStatus.UNKNOWN -> AgTheme.colors.text3
    }

    val cellBg = if (isSelected) AgTheme.colors.surface3 else AgTheme.colors.surface2

    Column(
        modifier = modifier
            .clip(AgTheme.shapes.xs)
            .background(cellBg)
            .clickable(onClick = onClick)
            .padding(horizontal = 6.dp, vertical = 6.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(
                text = data.title.uppercase(),
                style = AgTheme.typography.label,
                color = AgTheme.colors.text3
            )
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .clip(AgTheme.shapes.pill)
                    .background(statusColor)
            )
        }

        Spacer(Modifier.height(4.dp))

        Text(
            text = data.statusText,
            style = AgTheme.typography.monoSmall,
            color = if (data.status == CellStatus.OK) AgTheme.colors.text1 else statusColor
        )

        val age = data.ageSec?.let { "${it}s" } ?: "—"
        Text(
            text = age,
            style = AgTheme.typography.monoSmall,
            color = AgTheme.colors.text3
        )
    }
}
