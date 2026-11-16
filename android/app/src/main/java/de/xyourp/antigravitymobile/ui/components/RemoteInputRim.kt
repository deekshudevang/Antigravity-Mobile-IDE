package de.xyourp.antigravitymobile.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import de.xyourp.antigravitymobile.ui.theme.AgTheme

@Composable
fun RemoteInputRim(
    active: Boolean,
    modifier: Modifier = Modifier
) {
    AnimatedVisibility(
        visible = active,
        enter = expandVertically(),
        exit = shrinkVertically(),
        modifier = modifier
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(18.dp)
                .background(AgTheme.colors.warn)
                .padding(horizontal = 8.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "● INPUT ACTIVE",
                style = AgTheme.typography.monoSmall,
                color = AgTheme.colors.bg,
                textAlign = TextAlign.Center
            )
        }
    }
}
