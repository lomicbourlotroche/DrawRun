package com.drawrun.app.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*

import androidx.compose.runtime.*
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.drawrun.app.AppState
import com.drawrun.app.Screen
import com.drawrun.app.logic.DataSyncManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.health.connect.client.PermissionController
import com.drawrun.app.ui.theme.AppTheme
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun OnboardingProfileScreen(state: AppState) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(32.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = Icons.Default.Bolt,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(48.dp)
        )
        Text(
            text = "PERFORMANCE",
            style = MaterialTheme.typography.displayLarge,
            color = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier.padding(top = 16.dp)
        )
        Text(
            text = "Profil scientifique (Run, Swim, Bike).",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
            modifier = Modifier.padding(top = 8.dp, bottom = 40.dp)
        )

        OnboardingTextField(
            label = "PRÉNOM",
            value = state.firstName,
            onValueChange = { state.firstName = it },
            placeholder = "Ex: Thomas"
        )

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            OnboardingTextField(
                label = "ÂGE",
                value = state.age,
                onValueChange = { state.age = it },
                modifier = Modifier.weight(1f),
                keyboardType = KeyboardType.Number,
                placeholder = "Ex: 31"
            )
            SexPicker(
                label = "SEXE",
                selected = state.sex,
                onSelect = { state.sex = it },
                modifier = Modifier.weight(1f)
            )
        }

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            OnboardingTextField(
                label = "POIDS (KG)",
                value = state.weight,
                onValueChange = { state.weight = it },
                modifier = Modifier.weight(1f),
                keyboardType = KeyboardType.Number,
                placeholder = "Ex: 78"
            )
            OnboardingTextField(
                label = "FC REPOS",
                value = state.restingHR,
                onValueChange = { state.restingHR = it },
                modifier = Modifier.weight(1f),
                keyboardType = KeyboardType.Number,
                placeholder = "Ex: 54"
            )
        }

        Spacer(modifier = Modifier.height(40.dp))

        Button(
            onClick = { state.currentScreen = Screen.OnboardingSync },
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp),
            shape = RoundedCornerShape(24.dp),
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
            enabled = state.firstName.isNotBlank() && state.weight.isNotBlank()
        ) {
            Text(
                text = "SUIVANT",
                style = MaterialTheme.typography.labelSmall,
                color = Color.White,
                fontWeight = FontWeight.Black
            )
        }
    }
}



@Composable
fun OnboardingSyncScreen(state: AppState, syncManager: DataSyncManager) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val scope = rememberCoroutineScope()
    
    val healthPermissionLauncher = rememberLauncherForActivityResult(
        PermissionController.createRequestPermissionResultContract()
    ) { granted ->
        if (granted.containsAll(syncManager.permissions)) {
            state.healthConnectConnected = true
            // Launch immediate sync
            scope.launch {
                syncManager.syncHealthData()
                android.widget.Toast.makeText(context, "Données santé synchronisées !", android.widget.Toast.LENGTH_SHORT).show()
            }
        }
    }

    // Check availability on load
    LaunchedEffect(Unit) {
        val status = androidx.health.connect.client.HealthConnectClient.getSdkStatus(context)
        if (status != androidx.health.connect.client.HealthConnectClient.SDK_AVAILABLE) {
             android.widget.Toast.makeText(context, "Health Connect Status: $status", android.widget.Toast.LENGTH_LONG).show()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(32.dp)
    ) {
        Spacer(modifier = Modifier.height(60.dp))
        Text(
            text = "SOURCES EXTERNES",
            style = MaterialTheme.typography.displayMedium,
            color = MaterialTheme.colorScheme.onBackground
        )
        
        Spacer(modifier = Modifier.height(32.dp))
        
        SyncButton(
            title = "Strava",
            subtitle = if (state.stravaConnected) "CONNECTÉ ✅" else "ACTIVITÉS",
            icon = Icons.Default.Share,
            iconColor = Color(0xFFFC6100),
            connected = state.stravaConnected,
            onClick = { 
                if (!state.stravaConnected) syncManager.startStravaAuth()
            },
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        SyncButton(
            title = "Health Connect",
            subtitle = if (state.healthConnectConnected) "SYNCHRONISÉ ✅" else "SANTÉ",
            icon = Icons.Default.Favorite,
            iconColor = MaterialTheme.colorScheme.primary,
            connected = state.healthConnectConnected,
            onClick = { 
                if (state.healthConnectConnected) return@SyncButton
                
                try {
                    if (syncManager.permissions.isEmpty()) {
                         android.widget.Toast.makeText(context, "Erreur: Aucune permission demandée", android.widget.Toast.LENGTH_LONG).show()
                    } else {
                        android.widget.Toast.makeText(context, "Lancement Health Connect...", android.widget.Toast.LENGTH_SHORT).show()
                        healthPermissionLauncher.launch(syncManager.permissions)
                    }
                } catch (e: Exception) {
                     android.widget.Toast.makeText(context, "Erreur Lancement: ${e.message}", android.widget.Toast.LENGTH_LONG).show()
                }
            }
        )
        
        Spacer(modifier = Modifier.weight(1f))
        
        val context = androidx.compose.ui.platform.LocalContext.current
        Button(
            onClick = {
                val prefs = context.getSharedPreferences("drawrun_prefs", android.content.Context.MODE_PRIVATE)
                prefs.edit()
                    .putBoolean("onboarding_complete", true)
                    .putString("first_name", state.firstName)
                    .putString("user_sex", state.sex)
                    .putString("user_weight", state.weight)
                    .putString("user_age", state.age)
                    .putString("user_hr", state.restingHR)
                    .putBoolean("strava_connected", state.stravaConnected)
                    .putBoolean("health_connected", state.healthConnectConnected)
                    .apply()
                state.currentScreen = Screen.WelcomeSplash
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp),
            shape = RoundedCornerShape(24.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = if (state.appTheme == AppTheme.LIGHT) Color.Black else Color.White,
                contentColor = if (state.appTheme == AppTheme.LIGHT) Color.White else Color.Black
            )
        ) {
            Text(
                text = "LANCER L'APP",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Black
            )
        }
    }
}

@Composable
fun WelcomeSplashScreen(state: AppState, syncManager: DataSyncManager) {
    LaunchedEffect(Unit) {
        // Real Sync on startup
        if (state.healthConnectConnected) {
            syncManager.syncHealthData()
        }
        if (state.stravaConnected) {
            // Real sync using stored credentials in SyncManager
            syncManager.syncStravaActivities()
        }
        delay(3500)
        state.currentScreen = Screen.MainApp
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.primary),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            LoadingSpinner()
            Spacer(modifier = Modifier.height(24.dp))
            Text( // Removed LoadingSpinner as it was undefined/duplicate
                text = "DRAWRUN",
                style = MaterialTheme.typography.displayLarge,
                color = Color.White,
                fontWeight = FontWeight.Black,
                letterSpacing = 4.sp
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "BONJOUR ${state.firstName.uppercase()}",
                style = MaterialTheme.typography.displayMedium,
                color = Color.White
            )
        }
    }
}

@Composable
fun OnboardingTextField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String = "",
    modifier: Modifier = Modifier,
    keyboardType: KeyboardType = KeyboardType.Text
) {
    Column(modifier = modifier.padding(vertical = 8.dp)) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
            modifier = Modifier.padding(start = 4.dp, bottom = 4.dp)
        )
        TextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text(placeholder, style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold)) },
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .border(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.1f), RoundedCornerShape(16.dp)),
            colors = TextFieldDefaults.colors(
                focusedContainerColor = MaterialTheme.colorScheme.surface,
                unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent,
                focusedTextColor = MaterialTheme.colorScheme.onBackground,
                unfocusedTextColor = MaterialTheme.colorScheme.onBackground
            ),
            textStyle = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold),
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType)
        )
    }
}

@Composable
fun SexPicker(
    label: String,
    selected: String,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier.padding(vertical = 8.dp)) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
            modifier = Modifier.padding(start = 4.dp, bottom = 4.dp)
        )
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(60.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(MaterialTheme.colorScheme.surface)
                .border(1.dp, MaterialTheme.colorScheme.onBackground.copy(alpha = 0.1f), RoundedCornerShape(16.dp))
                .padding(4.dp)
        ) {
            listOf("H", "F").forEach { sex ->
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (selected == sex) MaterialTheme.colorScheme.onBackground.copy(alpha = 0.1f) else Color.Transparent)
                        .clickable { onSelect(sex) },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = sex,
                        style = MaterialTheme.typography.labelSmall,
                        color = if (selected == sex) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
                        fontWeight = FontWeight.Black
                    )
                }
            }
        }
    }
}

@Composable
fun SyncButton(
    title: String,
    subtitle: String,
    icon: ImageVector,
    iconColor: Color,
    connected: Boolean,
    onClick: () -> Unit
) {
    val borderColor = if (connected) iconColor else MaterialTheme.colorScheme.onBackground.copy(alpha = 0.1f)
    // Dynamic background: Colored if connected, Surface if not
    val bgColor = if (connected) iconColor.copy(alpha = 0.15f) else MaterialTheme.colorScheme.surface
    
    // Pulse animation (subtle) if connected? No, keep it clean.
    
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(32.dp))
            .background(bgColor)
            .border(if (connected) 2.dp else 1.dp, borderColor, RoundedCornerShape(32.dp))
            .clickable(enabled = !connected) { onClick() } // Disable click if already connected
            .padding(24.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = if (connected) Icons.Default.CheckCircle else icon, 
            contentDescription = null, 
            tint = if (connected) iconColor else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), 
            modifier = Modifier.size(24.dp)
        )
        Spacer(modifier = Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title, 
                style = MaterialTheme.typography.titleLarge, 
                color = MaterialTheme.colorScheme.onBackground,
                fontWeight = if (connected) FontWeight.Bold else FontWeight.Normal
            )
            Text(
                text = if (connected) "ENREGISTRÉ & ACTIF" else subtitle, 
                style = MaterialTheme.typography.labelSmall, 
                color = if (connected) iconColor else MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f),
                fontWeight = if (connected) FontWeight.Black else FontWeight.Normal
            )
        }
        if (connected) {
            Icon(imageVector = Icons.Default.Check, contentDescription = null, tint = iconColor, modifier = Modifier.size(24.dp))
        } else {
            Icon(imageVector = Icons.Default.ChevronRight, contentDescription = null, tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.2f), modifier = Modifier.size(24.dp))
        }
    }
}

@Composable
fun LoadingSpinner() {
    var iconIndex by remember { mutableIntStateOf(0) }
    val icons = listOf(Icons.Default.DirectionsRun, Icons.Default.Pool, Icons.Default.DirectionsBike)
    
    LaunchedEffect(Unit) {
        while(true) {
            delay(600)
            iconIndex = (iconIndex + 1) % icons.size
        }
    }

    Box(contentAlignment = Alignment.Center, modifier = Modifier.size(120.dp)) {
        CircularProgressIndicator(
            modifier = Modifier.fillMaxSize(),
            color = Color.White,
            strokeWidth = 4.dp,
            trackColor = Color.White.copy(alpha = 0.1f)
        )
        Box(
            modifier = Modifier
                .size(96.dp)
                .clip(CircleShape)
                .background(Color.White.copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Crossfade(targetState = icons[iconIndex]) { icon ->
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(48.dp)
                )
            }
        }
    }
}
