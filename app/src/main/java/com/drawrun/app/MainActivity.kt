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
        
        // Start background restoration BEFORE setContent
        lifecycleScope.launch {
            val prefs = getSharedPreferences("drawrun_prefs", MODE_PRIVATE)
            val onboardingComplete = prefs.getBoolean("onboarding_complete", false)
            
            if (onboardingComplete) {
                // Restore user profile synchronously (lightweight)
                appState.stravaConnected = prefs.getBoolean("strava_connected", false)
                appState.healthConnectConnected = prefs.getBoolean("health_connected", false)
                appState.firstName = prefs.getString("first_name", "") ?: ""
                appState.age = prefs.getString("user_age", "") ?: ""
                appState.sex = prefs.getString("user_sex", "") ?: ""
                appState.weight = prefs.getString("user_weight", "") ?: ""
                appState.restingHR = prefs.getString("user_hr", "") ?: ""
                
                // Load saved theme
                val savedTheme = prefs.getString("app_theme", null)
                if (savedTheme != null) {
                    try {
                        appState.appTheme = com.drawrun.app.ui.theme.AppTheme.valueOf(savedTheme)
                    } catch (e: Exception) {}
                }
                
                // Load training plan
                val savedPlan = com.drawrun.app.data.PlanRepository.loadPlan(this@MainActivity)
                if (savedPlan != null) {
                    appState.generatedRunPlan = savedPlan.first
                    appState.runPlanObjective = savedPlan.second
                }
                
                // Navigate to splash then trigger heavy sync operations in background
                appState.currentScreen = Screen.WelcomeSplash
                
                // Heavy operations run in background without blocking UI
                syncManager.restoreConnections()
                
                // Check for app updates
                checkForUpdates()
            } else {
                appState.currentScreen = Screen.OnboardingProfile
            }
        }
        
        setContent {
            val rememberedAppState = remember { appState } 
            val rememberedSyncManager = remember { syncManager }
            val systemInDark = isSystemInDarkTheme()
            
            // Auto-adjust theme based on system
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
        }
        
        // Handle callback if app was started by the intent
        handleIntent(intent)
    }
    
    override fun onNewIntent(intent: android.content.Intent?) {
        super.onNewIntent(intent)
        setIntent(intent) 
        handleIntent(intent)
    }

    private fun handleIntent(intent: android.content.Intent?) {
        val uri = intent?.data
        val action = intent?.action
        android.util.Log.d("DrawRun", "MainActivity: handleIntent | Action: $action | URI: $uri")
        
        if (intent != null) {
            val extras = intent.extras
            if (extras != null) {
                for (key in extras.keySet()) {
                    android.util.Log.d("DrawRun", "MainActivity: Intent Extra: $key = ${extras.get(key)}")
                }
            }
        }
        
        if (uri != null) {
            val uriStr = uri.toString()
            if (uriStr.contains("strava_callback")) {
                android.util.Log.i("DrawRun", "Strava: Callback detected: $uriStr")
                
                val code = uri.getQueryParameter("code")
                val error = uri.getQueryParameter("error")
                
                if (code != null) {
                    android.util.Log.d("DrawRun", "Strava: Auth code received: $code")
                    android.widget.Toast.makeText(this, "Connexion Strava en cours...", android.widget.Toast.LENGTH_SHORT).show()
                    
                    lifecycleScope.launch {
                        val success = syncManager.exchangeToken(code)
                        if (success) {
                            android.widget.Toast.makeText(this@MainActivity, "Strava Connecté !", android.widget.Toast.LENGTH_SHORT).show()
                            appState.stravaConnected = true
                        } else {
                            android.widget.Toast.makeText(this@MainActivity, "Échec échange de code", android.widget.Toast.LENGTH_SHORT).show()
                        }
                    }
                } else if (error != null) {
                    android.util.Log.e("DrawRun", "Strava: Auth error returned: $error")
                    android.widget.Toast.makeText(this, "Strava Auth Error: $error", android.widget.Toast.LENGTH_LONG).show()
                }
            }
        }
    }
    
    private fun checkForUpdates() {
        lifecycleScope.launch {
            try {
                val currentVersionCode = packageManager.getPackageInfo(packageName, 0).versionCode
                val updateInfo = com.drawrun.app.logic.UpdateChecker.checkForUpdate(currentVersionCode)
                
                if (updateInfo != null) {
                    runOnUiThread {
                        val dialog = android.app.AlertDialog.Builder(this@MainActivity)
                            .setTitle("✨ Mise à jour disponible")
                            .setMessage(
                                "Version ${updateInfo.version} est disponible !\n\n" +
                                "📝 Nouveautés :\n${updateInfo.releaseNotes}\n\n" +
                                "Voulez-vous télécharger la nouvelle version ?"
                            )
                            .setPositiveButton("Télécharger") { _, _ ->
                                val downloadIntent = android.content.Intent(android.content.Intent.ACTION_VIEW)
                                downloadIntent.data = android.net.Uri.parse(updateInfo.downloadUrl)
                                startActivity(downloadIntent)
                            }
                            .setNegativeButton("Plus tard", null)
                            .setCancelable(true)
                            .create()
                        
                        dialog.show()
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("DrawRun", "Update check failed", e)
            }
        }
    }
}

