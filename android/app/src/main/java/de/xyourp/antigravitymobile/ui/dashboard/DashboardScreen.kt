package de.xyourp.antigravitymobile.ui.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import de.xyourp.antigravitymobile.ui.components.ObservationType
import de.xyourp.antigravitymobile.ui.components.PulseLine
import de.xyourp.antigravitymobile.ui.components.SignalStrip
import de.xyourp.antigravitymobile.ui.components.SignalStripState
import de.xyourp.antigravitymobile.ui.components.StateMarker
import de.xyourp.antigravitymobile.ui.session.AgentStatus
import de.xyourp.antigravitymobile.ui.theme.AgTheme

data class NeedsYouItem(
    val id: String,
    val title: String,
    val ageText: String,
    val isApproval: Boolean = false
)

data class RecentEventItem(
    val time: String,
    val category: String,
    val summary: String
)

data class TaskProgressSummary(
    val total: Int = 0,
    val completed: Int = 0,
    val verified: Int = 0
)

data class DashboardUiState(
    val signalStrip: SignalStripState = SignalStripState(),
    val lastHeartbeatMs: Long = System.currentTimeMillis(),
    val agentState: AgentStatus = AgentStatus.Idle,
    val agentStateObservation: ObservationType = ObservationType.OBSERVED,
    val projectName: String = "anti mobile",
    val currentTask: String = "Idle",
    val modelName: String? = "Gemini 2.5 Flash",
    val laptopStatus: String = "ONLINE",
    val needsYouList: List<NeedsYouItem> = emptyList(),
    val taskProgress: TaskProgressSummary = TaskProgressSummary(),
    val recentEvents: List<RecentEventItem> = emptyList()
)

@Composable
fun DashboardScreen(
    state: DashboardUiState,
    onNavigateToChat: () -> Unit,
    onNavigateToActivity: () -> Unit,
    onReviewApproval: (String) -> Unit = {},
    modifier: Modifier = Modifier
) {
    val scroll = rememberScrollState()

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(AgTheme.colors.bg)
            .verticalScroll(scroll)
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        // 1. Signal strip
        SignalStrip(state = state.signalStrip)

        // 2. Pulse line
        PulseLine(lastHeartbeatMs = state.lastHeartbeatMs)

        Spacer(Modifier.height(8.dp))

        // 3. Agent Block (Hero)
        AgentHeroBlock(
            agentState = state.agentState,
            observation = state.agentStateObservation,
            projectName = state.projectName,
            currentTask = state.currentTask,
            modelName = state.modelName,
            laptopStatus = state.laptopStatus,
            onReviewApproval = {
                val firstApproval = state.needsYouList.firstOrNull { it.isApproval }
                if (firstApproval != null) {
                    onReviewApproval(firstApproval.id)
                } else {
                    onNavigateToChat()
                }
            }
        )

        Spacer(Modifier.height(16.dp))

        // 4. Needs You Section
        SectionHeader(title = "NEEDS YOU")
        Spacer(Modifier.height(8.dp))
        if (state.needsYouList.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(AgTheme.shapes.sm)
                    .background(AgTheme.colors.surface1)
                    .border(1.dp, AgTheme.colors.hairline, AgTheme.shapes.sm)
                    .padding(16.dp),
                contentAlignment = Alignment.CenterStart
            ) {
                Text(
                    text = "Nothing needs you.",
                    style = AgTheme.typography.body,
                    color = AgTheme.colors.text3
                )
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(AgTheme.shapes.sm)
                    .background(AgTheme.colors.surface1)
                    .border(1.dp, AgTheme.colors.hairline, AgTheme.shapes.sm)
            ) {
                state.needsYouList.forEachIndexed { index, item ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                if (item.isApproval) onReviewApproval(item.id) else onNavigateToChat()
                            }
                            .padding(horizontal = 14.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                            Icon(
                                Icons.Filled.Warning,
                                contentDescription = null,
                                tint = if (item.isApproval) AgTheme.colors.warn else AgTheme.colors.error,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(Modifier.width(8.dp))
                            Text(
                                text = item.title,
                                style = AgTheme.typography.body,
                                color = AgTheme.colors.text1
                            )
                        }
                        Text(
                            text = item.ageText,
                            style = AgTheme.typography.monoSmall,
                            color = AgTheme.colors.text3
                        )
                    }
                    if (index < state.needsYouList.size - 1) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(1.dp)
                                .background(AgTheme.colors.hairline)
                        )
                    }
                }
            }
        }

        Spacer(Modifier.height(16.dp))

        // 5. Tasks Progress
        SectionHeader(title = "TASKS")
        Spacer(Modifier.height(8.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(AgTheme.shapes.sm)
                .background(AgTheme.colors.surface1)
                .border(1.dp, AgTheme.colors.hairline, AgTheme.shapes.sm)
                .padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.Check,
                    contentDescription = null,
                    tint = AgTheme.colors.accent,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(Modifier.width(4.dp))
                Text(
                    text = "${state.taskProgress.completed} done",
                    style = AgTheme.typography.body,
                    color = AgTheme.colors.text1
                )
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Outlined.CheckCircle,
                    contentDescription = null,
                    tint = AgTheme.colors.ok,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(Modifier.width(4.dp))
                Text(
                    text = "${state.taskProgress.verified} VERIFIED",
                    style = AgTheme.typography.body,
                    color = AgTheme.colors.ok
                )
            }

            val left = (state.taskProgress.total - state.taskProgress.completed).coerceAtLeast(0)
            Text(
                text = "$left left",
                style = AgTheme.typography.monoSmall,
                color = AgTheme.colors.text3
            )
        }

        Spacer(Modifier.height(16.dp))

        // 6. Recent Events
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            SectionHeader(title = "RECENT ACTIVITY")
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.clickable(onClick = onNavigateToActivity)
            ) {
                Text(
                    text = "see all",
                    style = AgTheme.typography.monoSmall,
                    color = AgTheme.colors.accent
                )
                Icon(
                    Icons.Filled.ChevronRight,
                    contentDescription = null,
                    tint = AgTheme.colors.accent,
                    modifier = Modifier.size(14.dp)
                )
            }
        }
        Spacer(Modifier.height(8.dp))
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(AgTheme.shapes.sm)
                .background(AgTheme.colors.surface1)
                .border(1.dp, AgTheme.colors.hairline, AgTheme.shapes.sm)
        ) {
            if (state.recentEvents.isEmpty()) {
                Box(modifier = Modifier.padding(14.dp)) {
                    Text(
                        text = "No recent events logged.",
                        style = AgTheme.typography.body,
                        color = AgTheme.colors.text3
                    )
                }
            } else {
                state.recentEvents.take(5).forEachIndexed { idx, ev ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 14.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = ev.time,
                            style = AgTheme.typography.monoSmall,
                            color = AgTheme.colors.text3,
                            modifier = Modifier.width(52.dp)
                        )
                        Text(
                            text = ev.category.lowercase(),
                            style = AgTheme.typography.label,
                            color = AgTheme.colors.accent,
                            modifier = Modifier.width(60.dp)
                        )
                        Text(
                            text = ev.summary,
                            style = AgTheme.typography.body,
                            color = AgTheme.colors.text1,
                            maxLines = 1,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    if (idx < state.recentEvents.take(5).size - 1) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(1.dp)
                                .background(AgTheme.colors.hairline)
                        )
                    }
                }
            }
        }

        Spacer(Modifier.height(24.dp))
    }
}

@Composable
private fun AgentHeroBlock(
    agentState: AgentStatus,
    observation: ObservationType,
    projectName: String,
    currentTask: String,
    modelName: String?,
    laptopStatus: String,
    onReviewApproval: () -> Unit,
    modifier: Modifier = Modifier
) {
    val stateWord = when (agentState) {
        AgentStatus.Running -> "RUNNING"
        AgentStatus.Idle -> "IDLE"
        AgentStatus.Waiting -> "WAITING"
        AgentStatus.Offline -> "OFFLINE"
    }

    val stateColor = when (agentState) {
        AgentStatus.Running -> AgTheme.colors.accent
        AgentStatus.Idle -> AgTheme.colors.text2
        AgentStatus.Waiting -> AgTheme.colors.warn
        AgentStatus.Offline -> AgTheme.colors.text3
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(AgTheme.shapes.md)
            .background(AgTheme.colors.surface1)
            .border(1.dp, AgTheme.colors.hairline, AgTheme.shapes.md)
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = stateWord,
                    style = AgTheme.typography.display,
                    color = stateColor
                )
                Spacer(Modifier.width(10.dp))
                StateMarker(type = observation, color = stateColor)
            }

            if (laptopStatus != "ONLINE") {
                Box(
                    modifier = Modifier
                        .clip(AgTheme.shapes.xs)
                        .background(AgTheme.colors.surface2)
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = laptopStatus,
                        style = AgTheme.typography.monoSmall,
                        color = AgTheme.colors.warn
                    )
                }
            }
        }

        Spacer(Modifier.height(10.dp))

        Text(
            text = "project  $projectName",
            style = AgTheme.typography.mono,
            color = AgTheme.colors.text2
        )
        Spacer(Modifier.height(4.dp))
        Text(
            text = "task     $currentTask",
            style = AgTheme.typography.mono,
            color = AgTheme.colors.text2
        )
        if (modelName != null) {
            Spacer(Modifier.height(4.dp))
            Text(
                text = "model    $modelName",
                style = AgTheme.typography.monoSmall,
                color = AgTheme.colors.text3
            )
        }

        if (agentState == AgentStatus.Waiting) {
            Spacer(Modifier.height(14.dp))
            Button(
                onClick = onReviewApproval,
                colors = ButtonDefaults.buttonColors(
                    containerColor = AgTheme.colors.warn,
                    contentColor = AgTheme.colors.bg
                ),
                shape = AgTheme.shapes.sm,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "Review Approval",
                    style = AgTheme.typography.heading
                )
            }
        }
    }
}

@Composable
private fun SectionHeader(title: String) {
    Text(
        text = title,
        style = AgTheme.typography.label,
        color = AgTheme.colors.text3
    )
}
