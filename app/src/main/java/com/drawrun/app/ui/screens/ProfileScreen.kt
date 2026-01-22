package com.drawrun.app.ui.screens

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.drawrun.app.AppState
import com.drawrun.app.Screen
import com.drawrun.app.ui.theme.AppTheme
import androidx.health.connect.client.PermissionController
import androidx.compose.animation.core.*

import com.drawrun.app.logic.DataSyncManager
import com.drawrun.app.logic.PerformanceAnalyzer
import kotlinx.coroutines.launch
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.platform.LocalContext
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue


@Composable
fun ProfileScreen(state: AppState, syncManager: DataSyncManager) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(16.dp))
        
        // Avatar - "L'éclair" Logo
        Box(
            modifier = Modifier
                .size(96.dp)
                .clip(RoundedCornerShape(28.dp)) // Squircle
                .background(Color.White)
                .border(1.dp, Color.Black.copy(alpha = 0.05f), RoundedCornerShape(28.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Bolt, 
                contentDescription = null, 
                size = 56.dp, 
                tint = Color(0xFF007AFF) // Strava/iOS Blue
            )
        }
        
        Text(
            text = state.firstName.uppercase(),
            style = MaterialTheme.typography.displayMedium,
            fontStyle = FontStyle.Italic,
            fontWeight = FontWeight.Black
        )

        // Theme Card
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(32.dp))
                .background(MaterialTheme.colorScheme.surface)
                .border(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), RoundedCornerShape(32.dp))
                .padding(20.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(imageVector = Icons.Default.Palette, contentDescription = null, tint = MaterialTheme.colorScheme.onSurface, modifier = Modifier.size(14.dp))
                    Text(text = "THÈME", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), letterSpacing = 2.sp)
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    // Utility to handle theme change
                    val onThemeChange: (AppTheme) -> Unit = { newTheme ->
                        state.appTheme = newTheme
                        val prefs = context.getSharedPreferences("drawrun_prefs", android.content.Context.MODE_PRIVATE)
                        prefs.edit().putString("app_theme", newTheme.name).apply()
                        com.drawrun.app.logic.BrandingManager.updateLauncherIcon(context, newTheme)
                    }

                    ThemeCircle(AppTheme.ONYX, Color(0xFF007AFF), state.appTheme == AppTheme.ONYX) { onThemeChange(AppTheme.ONYX) }
                    ThemeCircle(AppTheme.EMERALD, Color(0xFF4D8B83), state.appTheme == AppTheme.EMERALD) { onThemeChange(AppTheme.EMERALD) }
                    ThemeCircle(AppTheme.RUBY, Color(0xFFE53935), state.appTheme == AppTheme.RUBY) { onThemeChange(AppTheme.RUBY) }
                    ThemeCircle(AppTheme.LIGHT, Color(0xFFF2F2F7), state.appTheme == AppTheme.LIGHT) { onThemeChange(AppTheme.LIGHT) }
                }
            }
        }


        // Connections Card
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(32.dp))
                .background(MaterialTheme.colorScheme.surface)
                .border(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), RoundedCornerShape(32.dp))
                .padding(20.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(imageVector = Icons.Default.Share, contentDescription = null, tint = MaterialTheme.colorScheme.onSurface, modifier = Modifier.size(14.dp))
                    Text(text = "CONNEXIONS", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), letterSpacing = 2.sp)
                }

                // Strava Toggle
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(text = "Strava", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold)
                        Text(text = if (state.stravaConnected) "Connecté" else "Déconnecté", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                    }
                    Switch(
                        checked = state.stravaConnected,
                        onCheckedChange = { isChecked -> 
                            if (isChecked) {
                                // Launch OAuth flow
                                syncManager.startStravaAuth()
                            } else {
                                // Disconnect
                                state.stravaConnected = false
                                val prefs = context.getSharedPreferences("drawrun_prefs", android.content.Context.MODE_PRIVATE)
                                prefs.edit().putBoolean("strava_connected", false).apply()
                            }
                        },
                        colors = SwitchDefaults.colors(checkedThumbColor = Color(0xFFFC6100), checkedTrackColor = Color(0xFFFC6100).copy(alpha = 0.2f))
                    )
                }
                
                if (state.stravaConnected && state.athleteStats != null) {
                    Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                    AthleteTotalsSection(state.athleteStats!!)
                    
                    Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                    
                    // Records / Bilan
                    val records = remember(state.activities) {
                        PerformanceAnalyzer.calculateRecordStats(state.activities)
                    }
                    if (records.isNotEmpty()) {
                         Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Icon(imageVector = Icons.Default.EmojiEvents, contentDescription = null, tint = MaterialTheme.colorScheme.onSurface, modifier = Modifier.size(14.dp))
                                Text(text = "RECORDS PERSONNELS", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), letterSpacing = 2.sp)
                            }
                            
                            Row(modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                records.forEach { (label, value) ->
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(16.dp))
                                            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                                            .padding(16.dp)
                                    ) {
                                        Column {
                                            Text(text = label.uppercase(), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f), fontSize = 10.sp)
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Text(text = value, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                
                Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))

                // Health Connect Toggle
                val permissionLauncher = rememberLauncherForActivityResult(
                    PermissionController.createRequestPermissionResultContract()
                ) { granted ->
                    val allGranted = granted.containsAll(syncManager.permissions)
                    state.healthConnectPermissionsGranted = allGranted
                    // We stay "connected" but show "Missing permissions" if not all granted
                    state.healthConnectConnected = true
                    val prefs = context.getSharedPreferences("drawrun_prefs", android.content.Context.MODE_PRIVATE)
                    prefs.edit().putBoolean("health_connected", true).apply()
                    
                    if (allGranted) {
                        scope.launch { syncManager.syncHealthData() }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(text = "Health Connect", style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold)
                        val statusText = if (state.healthConnectConnected) {
                            if (state.healthConnectPermissionsGranted) "ACTIF & AUTORISÉ ✅" else "ATTENTION : PERMISSIONS MANQUANTES ⚠️"
                        } else "DÉCONNECTÉ"
                        
                        val statusColor = if (state.healthConnectConnected) {
                            if (state.healthConnectPermissionsGranted) MaterialTheme.colorScheme.primary else Color(0xFFF59E0B)
                        } else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)

                        Text(
                            text = statusText,
                            style = MaterialTheme.typography.labelSmall,
                            color = statusColor,
                            fontWeight = if (state.healthConnectConnected) FontWeight.Black else FontWeight.Normal
                        )
                        
                        // Small button to re-request permissions if missing
                        if (state.healthConnectConnected && !state.healthConnectPermissionsGranted) {
                            Text(
                                text = "Appuyez sur le switch pour corriger",
                                style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp),
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f),
                                modifier = Modifier.padding(top = 4.dp)
                            )
                        }
                    }
                    Switch(
                        checked = state.healthConnectConnected,
                        onCheckedChange = { isChecked ->
                            if (isChecked) {
                                scope.launch {
                                    val allGranted = syncManager.healthConnectManager.hasPermissions(syncManager.permissions as Set<String>)
                                    state.healthConnectConnected = true
                                    state.healthConnectPermissionsGranted = allGranted
                                    
                                    val prefs = context.getSharedPreferences("drawrun_prefs", android.content.Context.MODE_PRIVATE)
                                    prefs.edit().putBoolean("health_connected", true).apply()
                                    
                                    if (allGranted) {
                                        syncManager.syncHealthData()
                                    } else {
                                        // Still launch if some missing, or if none missing but user wants to refresh
                                        permissionLauncher.launch(syncManager.permissions)
                                    }
                                }
                            } else {
                                state.healthConnectConnected = false
                                state.healthConnectPermissionsGranted = false
                                val prefs = context.getSharedPreferences("drawrun_prefs", android.content.Context.MODE_PRIVATE)
                                prefs.edit().putBoolean("health_connected", false).apply()
                            }
                        },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = if (state.healthConnectPermissionsGranted) MaterialTheme.colorScheme.primary else Color(0xFFF59E0B), 
                            checkedTrackColor = (if (state.healthConnectPermissionsGranted) MaterialTheme.colorScheme.primary else Color(0xFFF59E0B)).copy(alpha = 0.2f)
                        )
                    )
                }
            }
        }
        
        // Manual Sync Button
        Button(
            onClick = { 
                scope.launch {
                    state.isSyncing = true
                    // Artificial delay for UX visibility if sync is too fast
                    val minTime = System.currentTimeMillis() + 2000 
                    
                    if (state.stravaConnected) syncManager.syncStravaActivities()
                    if (state.healthConnectConnected) syncManager.syncHealthData()
                    
                    // Update workout completion tracking after sync
                    com.drawrun.app.logic.WorkoutMatcher.updateWorkoutCompletions(state)
                    
                    // UX: Ensure at least 2000ms animation so user sees the runner
                    val remaining = 2000 - (System.currentTimeMillis() - minTime + 2000)
                    if (remaining > 0) kotlinx.coroutines.delay(remaining)
                    
                    state.isSyncing = false
                }
            },
            enabled = !state.isSyncing,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primaryContainer,
                contentColor = MaterialTheme.colorScheme.onPrimaryContainer
            )
        ) {
            if (state.isSyncing) {
                RunningLoader(color = MaterialTheme.colorScheme.onPrimaryContainer)
                Spacer(modifier = Modifier.width(12.dp))
                Text(text = "RÉCUPÉRATION...", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, letterSpacing = 2.sp)
            } else {
                Icon(imageVector = Icons.Default.Sync, contentDescription = null, tint = MaterialTheme.colorScheme.onPrimaryContainer, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text(text = "SYNCHRONISER MAINTENANT", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, letterSpacing = 2.sp)
            }
        }

        // Reset Button
        var showResetConfirm by remember { mutableStateOf(false) }
        
        if (showResetConfirm) {
            AlertDialog(
                onDismissRequest = { showResetConfirm = false },
                title = { Text("Réinitialiser l'application ?", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold) },
                text = { Text("Attention : Cette action supprimera toutes vos données locales (profil, connexions, cache) et redémarrera l'application.", style = MaterialTheme.typography.bodyMedium) },
                confirmButton = {
                    Button(
                        onClick = {
                            showResetConfirm = false
                            // Wipe Data
                            val prefs = context.getSharedPreferences("drawrun_prefs", android.content.Context.MODE_PRIVATE)
                            prefs.edit().clear().apply()
                            
                            // Reset State (Basic fields)
                            state.firstName = ""
                            state.stravaConnected = false
                            state.healthConnectConnected = false
                            // ... other resets implicitly handled by restart or overwrites
                            
                            state.currentScreen = Screen.OnboardingProfile
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF3B30))
                    ) {
                        Text("TOUT EFFACER", fontWeight = FontWeight.Black)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showResetConfirm = false }) { Text("Annuler") }
                },
                containerColor = MaterialTheme.colorScheme.surface,
                shape = RoundedCornerShape(24.dp)
            )
        }

        Button(
            onClick = { showResetConfirm = true },
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFFFF3B30).copy(alpha = 0.1f),
                contentColor = Color(0xFFFF3B30)
            )
        ) {
            Text(text = "RÉINITIALISER L'APP", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, letterSpacing = 2.sp)
        }
    }
}

@Composable
fun AthleteTotalsSection(stats: com.drawrun.app.AthleteStats) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Icon(imageVector = Icons.Default.BarChart, contentDescription = null, tint = MaterialTheme.colorScheme.onSurface, modifier = Modifier.size(14.dp))
            Text(text = "CUMUL STRAVA (HISTORIQUE)", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), letterSpacing = 2.sp)
        }
        
        AthleteTotalsRow("Course", stats.allRunTotals, Icons.Default.DirectionsRun, Color(0xFFFF3300))
        AthleteTotalsRow("Vélo", stats.allBikeTotals, Icons.Default.DirectionsBike, Color(0xFFFF8800))
        AthleteTotalsRow("Natation", stats.allSwimTotals, Icons.Default.Pool, Color(0xFF007AFF))
    }
}

@Composable
fun AthleteTotalsRow(label: String, totals: com.drawrun.app.Totals, icon: ImageVector, color: Color) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Box(
                modifier = Modifier.size(32.dp).clip(CircleShape).background(color.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(imageVector = icon, contentDescription = null, size = 16.dp, tint = color)
            }
            Text(text = label, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
        }
        
        Column(horizontalAlignment = Alignment.End) {
            Text(
                text = "%.0f km".format(totals.distance / 1000.0),
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Black
            )
            Text(
                text = "${totals.count} activités",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
            )
        }
    }
}

@Composable
fun ThemeCircle(theme: AppTheme, color: Color, selected: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(40.dp)
            .clip(CircleShape)
            .background(color)
            .border(2.dp, if (selected) MaterialTheme.colorScheme.onSurface else Color.Transparent, CircleShape)
            .clickable { onClick() }
    )
}

@Composable
fun RunningLoader(modifier: Modifier = Modifier, color: Color) {
    val infiniteTransition = rememberInfiniteTransition(label = "runner")
    val xOffset by infiniteTransition.animateFloat(
        initialValue = -10f,
        targetValue = 10f,
        animationSpec = infiniteRepeatable(
            animation = tween(600, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "runner_x"
    )
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.5f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(300, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "runner_alpha"
    )
    
    Icon(
        imageVector = Icons.Default.DirectionsRun, 
        contentDescription = "Running...", 
        size = 24.dp, 
        tint = color.copy(alpha = alpha),
        modifier = modifier.offset(x = xOffset.dp)
    )
}

// Helper for Icon with size
@Composable
fun Icon(imageVector: ImageVector, contentDescription: String?, size: androidx.compose.ui.unit.Dp, tint: Color, modifier: Modifier = Modifier) {
    androidx.compose.material3.Icon(
        imageVector = imageVector,
        contentDescription = contentDescription,
        tint = tint,
        modifier = modifier.size(size)
    )
}
