package de.xyourp.antigravitymobile.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import de.xyourp.antigravitymobile.ui.theme.AgTheme

enum class StepState {
    PENDING,
    ACTIVE,
    COMPLETED,
    FAILED
}

data class LifecycleStep(
    val name: String,
    val state: StepState
)

@Composable
fun CommandLifecycleTrack(
    steps: List<LifecycleStep>,
    failureReason: String? = null,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            steps.forEachIndexed { index, step ->
                StepDot(
                    name = step.name,
                    state = step.state
                )
                if (index < steps.size - 1) {
                    val nextStep = steps[index + 1]
                    val linePassed = step.state == StepState.COMPLETED &&
                            (nextStep.state == StepState.COMPLETED || nextStep.state == StepState.ACTIVE)
                    val lineColor = if (linePassed) AgTheme.colors.accent else AgTheme.colors.hairline
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(1.dp)
                            .padding(horizontal = 4.dp)
                            .background(lineColor)
                    )
                }
            }
        }

        if (failureReason != null) {
            Spacer(Modifier.height(4.dp))
            Text(
                text = failureReason,
                style = AgTheme.typography.monoSmall,
                color = AgTheme.colors.error
            )
        }
    }
}

@Composable
private fun StepDot(
    name: String,
    state: StepState,
    modifier: Modifier = Modifier
) {
    val dotColor = when (state) {
        StepState.COMPLETED -> AgTheme.colors.accent
        StepState.ACTIVE -> AgTheme.colors.warn
        StepState.FAILED -> AgTheme.colors.error
        StepState.PENDING -> AgTheme.colors.hairlineStrong
    }

    val textColor = when (state) {
        StepState.COMPLETED, StepState.ACTIVE -> AgTheme.colors.text1
        StepState.FAILED -> AgTheme.colors.error
        StepState.PENDING -> AgTheme.colors.text3
    }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier
    ) {
        Box(
            modifier = Modifier
                .size(6.dp)
                .clip(AgTheme.shapes.pill)
                .background(dotColor)
        )
        Spacer(Modifier.height(2.dp))
        Text(
            text = name,
            style = AgTheme.typography.monoSmall,
            color = textColor
        )
    }
}
