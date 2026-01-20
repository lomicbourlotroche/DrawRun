package com.drawrun.app.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

enum class AppTheme {
    ONYX, EMERALD, RUBY, LIGHT
}

private val OnyxColorScheme = darkColorScheme(
    primary = OnyxAccent,
    background = OnyxBlack,
    surface = OnyxCard,
    onPrimary = Color.White,
    onBackground = Color.White,
    onSurface = Color.White,
    surfaceVariant = OnyxNav
)

private val EmeraldColorScheme = darkColorScheme(
    primary = EmeraldAccent,
    background = EmeraldBg,
    surface = EmeraldCard,
    onPrimary = Color.White,
    onBackground = Color.White,
    onSurface = Color.White,
    surfaceVariant = EmeraldNav
)

private val RubyColorScheme = darkColorScheme(
    primary = RubyAccent,
    background = OnyxBlack,
    surface = OnyxCard,
    onPrimary = Color.White,
    onBackground = Color.White,
    onSurface = Color.White,
    surfaceVariant = OnyxNav
)

private val LightColorScheme = lightColorScheme(
    primary = OnyxAccent,
    background = LightBg,
    surface = LightCard,
    onPrimary = Color.White,
    onBackground = LightText,
    onSurface = LightText,
    surfaceVariant = Color.White
)

@Composable
fun DrawRunTheme(
    appTheme: AppTheme = AppTheme.ONYX,
    content: @Composable () -> Unit
) {
    val colorScheme = when (appTheme) {
        AppTheme.ONYX -> OnyxColorScheme
        AppTheme.EMERALD -> EmeraldColorScheme
        AppTheme.RUBY -> RubyColorScheme
        AppTheme.LIGHT -> LightColorScheme
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = appTheme == AppTheme.LIGHT
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
