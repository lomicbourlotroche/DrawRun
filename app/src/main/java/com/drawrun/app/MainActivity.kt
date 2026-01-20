package com.drawrun.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.Crossfade
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import com.drawrun.app.ui.screens.OnboardingProfileScreen
import com.drawrun.app.ui.screens.OnboardingSyncScreen
import com.drawrun.app.ui.screens.WelcomeSplashScreen
import com.drawrun.app.ui.theme.DrawRunTheme
import com.drawrun.app.logic.DataSyncManager
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    
    private lateinit var syncManager: DataSyncManager
    private lateinit var appState: AppState

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        appState = AppState()
        syncManager = DataSyncManager(this, appState)
        
        setContent {
            // Keep remember for recomposition safety if needed, or pass the prop
            val rememberedAppState = remember { appState } 
            val rememberedSyncManager = remember { syncManager }
            val systemInDark = isSystemInDarkTheme()
            
            // Initialize theme based on system if not switched
            LaunchedEffect(systemInDark) {
                if (rememberedAppState.appTheme == com.drawrun.app.ui.theme.AppTheme.ONYX || 
                    rememberedAppState.appTheme == com.drawrun.app.ui.theme.AppTheme.LIGHT) {
                    rememberedAppState.appTheme = if (systemInDark) com.drawrun.app.ui.theme.AppTheme.ONYX else com.drawrun.app.ui.theme.AppTheme.LIGHT
                }
            }

            DrawRunTheme(appTheme = rememberedAppState.appTheme) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    Crossfade(targetState = rememberedAppState.currentScreen, label = "ScreenTransition") { screen ->
                        when (screen) {
                            Screen.OnboardingProfile -> OnboardingProfileScreen(rememberedAppState)
                            Screen.OnboardingSync -> OnboardingSyncScreen(rememberedAppState, rememberedSyncManager)
                            Screen.WelcomeSplash -> WelcomeSplashScreen(rememberedAppState, rememberedSyncManager)
                            Screen.MainApp -> MainScaffold(rememberedAppState, rememberedSyncManager)
                        }
                    }
                }
            }
            
            // Initial Navigation Logic
            LaunchedEffect(Unit) {
                val prefs = getSharedPreferences("drawrun_prefs", MODE_PRIVATE)
                val onboardingComplete = prefs.getBoolean("onboarding_complete", false)
                if (onboardingComplete) {
                    rememberedAppState.stravaConnected = prefs.getBoolean("strava_connected", false)
                    rememberedAppState.healthConnectConnected = prefs.getBoolean("health_connected", false)
                    rememberedAppState.firstName = prefs.getString("first_name", "") ?: ""
                    rememberedAppState.age = prefs.getString("user_age", "") ?: ""
                    rememberedAppState.sex = prefs.getString("user_sex", "") ?: ""
                    rememberedAppState.weight = prefs.getString("user_weight", "") ?: ""
                    rememberedAppState.restingHR = prefs.getString("user_hr", "") ?: ""
                    
                    // Load Theme
                    val savedTheme = prefs.getString("app_theme", null)
                    if (savedTheme != null) {
                        try {
                            rememberedAppState.appTheme = com.drawrun.app.ui.theme.AppTheme.valueOf(savedTheme)
                        } catch (e: Exception) {}
                    }

                    rememberedAppState.currentScreen = Screen.WelcomeSplash
                    
                    // Restore connections and sync data
                    rememberedSyncManager.restoreConnections()
                } else {
                    rememberedAppState.currentScreen = Screen.OnboardingProfile
                }
            }
        }
    }
    
    override fun onNewIntent(intent: android.content.Intent?) {
        super.onNewIntent(intent)
        setIntent(intent) // Good practice
        
        // Handle OAuth Callback
        val uri = intent?.data
        if (uri != null && (uri.toString().startsWith("drawrun://strava_callback") || uri.toString().startsWith("http://localhost/strava_callback"))) {
            val code = uri.getQueryParameter("code")
            if (code != null) {
                android.widget.Toast.makeText(this, "Connexion Strava en cours...", android.widget.Toast.LENGTH_SHORT).show()
                
                // Launch coroutine to exchange token using the Activity's scope
                lifecycleScope.launch {
                    val success = syncManager.exchangeToken(code)
                    if (success) {
                        android.widget.Toast.makeText(this@MainActivity, "Strava Connecté !", android.widget.Toast.LENGTH_SHORT).show()
                        appState.stravaConnected = true
                    } else {
                        android.widget.Toast.makeText(this@MainActivity, "Échec connexion Strava", android.widget.Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
    }
}

