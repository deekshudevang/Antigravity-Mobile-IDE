package de.xyourp.antigravitymobile.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

enum class ThemeMode {
    DARK,
    LIGHT,
    AMOLED,
    SYSTEM
}

val LocalAgColors = staticCompositionLocalOf { DarkColorTokens }
val LocalAgTypography = staticCompositionLocalOf { DefaultAgTypography }
val LocalAgSpacing = staticCompositionLocalOf { AgSpacing }
val LocalAgShapes = staticCompositionLocalOf { AgShapes }
val LocalAgMotion = staticCompositionLocalOf { AgMotion }

object AgTheme {
    val colors: AgColorTokens
        @Composable
        @ReadOnlyComposable
        get() = LocalAgColors.current

    val typography: AgTypography
        @Composable
        @ReadOnlyComposable
        get() = LocalAgTypography.current

    val spacing: AgSpacing
        @Composable
        @ReadOnlyComposable
        get() = LocalAgSpacing.current

    val shapes: AgShapes
        @Composable
        @ReadOnlyComposable
        get() = LocalAgShapes.current

    val motion: AgMotion
        @Composable
        @ReadOnlyComposable
        get() = LocalAgMotion.current
}

fun AgColorTokens.toMaterial3ColorScheme(isDark: Boolean): ColorScheme {
    return if (isDark) {
        darkColorScheme(
            primary = accent,
            onPrimary = onAccent,
            primaryContainer = accentMuted,
            onPrimaryContainer = text1,
            secondary = accent,
            onSecondary = onAccent,
            secondaryContainer = surface3,
            onSecondaryContainer = text1,
            tertiary = ok,
            onTertiary = onAccent,
            tertiaryContainer = surface2,
            onTertiaryContainer = text1,
            background = bg,
            onBackground = text1,
            surface = surface1,
            onSurface = text1,
            surfaceVariant = surface2,
            onSurfaceVariant = text2,
            surfaceContainerLowest = bg,
            surfaceContainerLow = surface1,
            surfaceContainer = surface2,
            surfaceContainerHigh = surface3,
            surfaceContainerHighest = surface3,
            outline = outlineControl,
            outlineVariant = hairline,
            error = error,
            onError = onAccent,
            errorContainer = surface2,
            onErrorContainer = error
        )
    } else {
        lightColorScheme(
            primary = accent,
            onPrimary = onAccent,
            primaryContainer = accentMuted,
            onPrimaryContainer = text1,
            secondary = accent,
            onSecondary = onAccent,
            secondaryContainer = surface3,
            onSecondaryContainer = text1,
            tertiary = ok,
            onTertiary = onAccent,
            tertiaryContainer = surface2,
            onTertiaryContainer = text1,
            background = bg,
            onBackground = text1,
            surface = surface1,
            onSurface = text1,
            surfaceVariant = surface2,
            onSurfaceVariant = text2,
            surfaceContainerLowest = surface1,
            surfaceContainerLow = surface2,
            surfaceContainer = surface2,
            surfaceContainerHigh = surface3,
            surfaceContainerHighest = surface3,
            outline = outlineControl,
            outlineVariant = hairline,
            error = error,
            onError = onAccent,
            errorContainer = surface2,
            onErrorContainer = error
        )
    }
}

@Composable
fun AntigravityTheme(
    mode: ThemeMode = ThemeMode.DARK,
    // Material You dynamic colour is disabled by default per section 3.1
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit,
) {
    val context = LocalContext.current
    val systemInDark = isSystemInDarkTheme()

    val effectiveDark = when (mode) {
        ThemeMode.DARK, ThemeMode.AMOLED -> true
        ThemeMode.LIGHT -> false
        ThemeMode.SYSTEM -> systemInDark
    }

    val agTokens = when (mode) {
        ThemeMode.DARK -> DarkColorTokens
        ThemeMode.LIGHT -> LightColorTokens
        ThemeMode.AMOLED -> AmoledColorTokens
        ThemeMode.SYSTEM -> if (systemInDark) DarkColorTokens else LightColorTokens
    }

    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S ->
            if (effectiveDark) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        else -> agTokens.toMaterial3ColorScheme(effectiveDark)
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            val controller = WindowCompat.getInsetsController(window, view)
            controller.isAppearanceLightStatusBars = !effectiveDark
            controller.isAppearanceLightNavigationBars = !effectiveDark
        }
    }

    CompositionLocalProvider(
        LocalAgColors provides agTokens,
        LocalAgTypography provides DefaultAgTypography,
        LocalAgSpacing provides AgSpacing,
        LocalAgShapes provides AgShapes,
        LocalAgMotion provides AgMotion
    ) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = DefaultAgTypography.toMaterial3Typography(),
            content = content,
        )
    }
}
