package com.drawrun.app.ui.screens

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.filled.Waves
import androidx.compose.material.icons.filled.SelfImprovement
import androidx.compose.material.icons.filled.Straighten
import androidx.compose.material.icons.filled.Zap
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.foundation.text.KeyboardOptions
import com.drawrun.app.*
import com.drawrun.app.ui.components.*
import com.drawrun.app.logic.TrainingPlanGenerator
import com.drawrun.app.logic.PerformanceAnalyzer
import java.time.LocalDate

@Composable
fun PlanningScreen(state: AppState) {
    var planningSport by remember { mutableStateOf("run") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        // Sport Toggle
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(MaterialTheme.colorScheme.surface)
                .border(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), RoundedCornerShape(20.dp))
                .padding(4.dp)
        ) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(if (planningSport == "run") MaterialTheme.colorScheme.primary else Color.Transparent)
                    .clickable { planningSport = "run" },
                contentAlignment = Alignment.Center
            ) {
                Text(text = "PLAN RUN (DANIELS)", style = MaterialTheme.typography.labelSmall, color = if (planningSport == "run") Color.White else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontWeight = FontWeight.Black)
            }
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(if (planningSport == "swim") MaterialTheme.colorScheme.primary else Color.Transparent)
                    .clickable { planningSport = "swim" },
                contentAlignment = Alignment.Center
            ) {
                Text(text = "SÉANCE SWIM", style = MaterialTheme.typography.labelSmall, color = if (planningSport == "swim") Color.White else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontWeight = FontWeight.Black)
            }
        }

        if (planningSport == "run") {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(32.dp))
                    .background(MaterialTheme.colorScheme.surface)
                    .border(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), RoundedCornerShape(32.dp))
                    .padding(24.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    Text(text = "JACK DANIELS VDOT", style = MaterialTheme.typography.headlineMedium, fontStyle = FontStyle.Italic, fontWeight = FontWeight.Black)
                    
                    // Paces Display (Always Visible)
                    // Paces Display (Always Visible)
                    val runZones = state.zones?.runZones
                    val paces = runZones?.pace?.let { allure ->
                        val list = mutableListOf<Pair<String, String>>()
                        allure.getOrNull(1)?.let { list.add("Easy (Z2)" to "${formatPace(it.first)}-${formatPace(it.second)}") }
                        allure.getOrNull(2)?.let { list.add("Marathon (Z3)" to formatPace(it.first)) }
                        allure.getOrNull(3)?.let { list.add("Seuil (Z4)" to formatPace(it.first)) }
                        allure.getOrNull(4)?.let { list.add("Interval (Z5)" to formatPace(it.first)) }
                        allure.getOrNull(5)?.let { list.add("Répétition (R)" to formatPace(it.first)) }
                        list
                    } ?: listOf(
                        "Easy (E)" to "5:30 - 6:00",
                        "Marathon (M)" to "4:45",
                        "Seuil (T)" to "4:15",
                        "Interval (I)" to "3:55",
                        "Répétition (R)" to "3:30" // Added R-Pace
                    )

                    paces.forEach { (label, pace) ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(text = label.uppercase(), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f))
                            Text(text = "$pace /km", style = MaterialTheme.typography.bodyLarge, fontStyle = FontStyle.Italic, fontWeight = FontWeight.Black)
                        }
                    }

                    Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f))
                    
                    // Weekly Plan Section - Flashcards
                    if (state.generatedRunPlan.isNotEmpty()) {
                        Text(text = "VOTRE PLAN (12 SEMAINES)", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                        
                        AppCarousel(
                            items = state.generatedRunPlan,
                            itemWidth = 320.dp,
                            itemHeight = 450.dp,
                            modifier = Modifier.fillMaxWidth()
                        ) { weekPlan, index ->
                            Card(
                                modifier = Modifier.fillMaxSize(),
                                shape = RoundedCornerShape(40.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                border = if (weekPlan.isDecharge) BorderStroke(2.dp, Color(0xFF10B981)) else null,
                                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
                            ) {
                                Column(modifier = Modifier.padding(24.dp)) {
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                        Column {
                                            Text(text = "SEMAINE ${weekPlan.weekNum}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.primary)
                                            val phaseName = when(weekPlan.phase) {
                                                1 -> "FONDATION"
                                                2 -> "FORCE & VMA"
                                                3 -> "SEUIL & SPÉ"
                                                else -> "AFFUTAGE"
                                            }
                                            Text(text = phaseName, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f))
                                        }
                                        if (weekPlan.isDecharge) {
                                            Surface(color = Color(0xFF10B981).copy(alpha = 0.15f), shape = RoundedCornerShape(12.dp)) {
                                                Text(text = "DÉCHARGE", color = Color(0xFF10B981), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp))
                                            }
                                        }
                                    }
                                    Text(text = "Vol: ${"%.1f".format(weekPlan.km)} km", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f))
                                    Spacer(modifier = Modifier.height(16.dp))
                                    
                                    Column(verticalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.verticalScroll(rememberScrollState())) {
                                        for (day in weekPlan.days) {
                                            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                                                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                                        Box(
                                                            modifier = Modifier.size(32.dp).clip(RoundedCornerShape(8.dp)).background(if (day.isQuality) MaterialTheme.colorScheme.primary.copy(alpha = 0.1f) else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f)),
                                                            contentAlignment = Alignment.Center
                                                        ) {
                                                            Icon(
                                                                imageVector = if (day.isQuality) Icons.Default.Zap else if (day.type == "L") Icons.Default.Straighten else Icons.Default.DirectionsRun,
                                                                contentDescription = null,
                                                                modifier = Modifier.size(16.dp),
                                                                tint = if (day.isQuality) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                                                            )
                                                        }
                                                        Column {
                                                            Text(text = day.title, style = MaterialTheme.typography.labelSmall, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurface, fontWeight = FontWeight.Bold)
                                                            val workoutSummary = day.details.find { det: TrainingPlanGenerator.Detail -> det.label == "Cœur" || det.label == "Objectif" }?.content ?: ""
                                                            if (workoutSummary.isNotBlank()) {
                                                                Text(text = workoutSummary, style = MaterialTheme.typography.labelSmall, fontSize = 9.sp, color = if (day.isQuality) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                                                            }
                                                        }
                                                    }
                                                    Text(text = if (day.dist > 0) "${"%.1f".format(day.dist)}km" else "REPOS", style = MaterialTheme.typography.labelSmall, fontSize = 10.sp, fontWeight = FontWeight.Black, color = if (day.dist > 0) MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f) else Color(0xFF10B981))
                                                }
                                            }
                                            Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                                        }
                                    }
                                }
                            }
                        }
                    }

                    var showPlanSetup by remember { mutableStateOf(false) }

                    if (showPlanSetup) {
                        var distText by remember { mutableStateOf("") }
                        var timeText by remember { mutableStateOf("") }
                        
                        AlertDialog(
                            onDismissRequest = { showPlanSetup = false },
                            title = { Text("Configuration du Plan", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black) },
                            text = {
                                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                                    Text("Entrez une performance récente pour calibrer vos allures (VDOT).", style = MaterialTheme.typography.bodyMedium)
                                    
                                    OutlinedTextField(
                                        value = distText,
                                        onValueChange = { distText = it },
                                        label = { Text("Distance Course (m)") },
                                        placeholder = { Text("ex: 5000") },
                                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(12.dp)
                                    )
                                    OutlinedTextField(
                                        value = timeText,
                                        onValueChange = { timeText = it },
                                        label = { Text("Chrono (min)") },
                                        placeholder = { Text("ex: 22.5") },
                                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(12.dp)
                                    )
                                    
                                    Column {
                                        Text(text = "Volume: ${state.runPlanFreq.toInt()} séances / semaine", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                                        Slider(
                                            value = state.runPlanFreq,
                                            onValueChange = { state.runPlanFreq = it },
                                            valueRange = 3f..7f,
                                            steps = 3
                                        )
                                    }
                                }
                            },
                            confirmButton = {
                                Button(
                                    onClick = { 
                                         // VDOT COACH ELITE V6.4 Generation
                                         val d = distText.toDoubleOrNull() ?: 10000.0
                                         val m = timeText.substringBefore(".").toIntOrNull() ?: 45
                                         val s = timeText.substringAfter(".", "0").toIntOrNull() ?: 0
                                         
                                         val peakVol = PerformanceAnalyzer.calculatePeakWeeklyVolume(state.activities)
                                         
                                         val config = TrainingPlanGenerator.PlanConfig(
                                             method = if (state.zones?.runZones?.fc?.isNotEmpty() == true) "hr" else "vdot",
                                             raceDistance = d,
                                             minutes = m,
                                             seconds = s,
                                             peakWeeklyKm = peakVol,
                                             programWeeks = 12,
                                             maxHR = 185,
                                             restHR = state.restingHR.toIntOrNull() ?: 55
                                         )
                                         
                                         state.generatedRunPlan = TrainingPlanGenerator.generatePlan(config)
                                         showPlanSetup = false
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                                ) {
                                    Text("CALIBRER & GÉNÉRER", fontWeight = FontWeight.Black)
                                }
                            },
                            dismissButton = {
                                TextButton(onClick = { showPlanSetup = false }) { Text("Annuler") }
                            },
                            containerColor = MaterialTheme.colorScheme.surface,
                            shape = RoundedCornerShape(24.dp)
                        )
                    }

                    Button(
                        onClick = { showPlanSetup = true },
                        modifier = Modifier.fillMaxWidth().height(56.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primaryContainer, contentColor = MaterialTheme.colorScheme.onPrimaryContainer)
                    ) {
                        Text(text = if (state.generatedRunPlan.isEmpty()) "CONFIGURER & GÉNÉRER PLAN" else "RECONFIGURER LE PLAN", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black)
                    }
                }
            }
        } else {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(32.dp))
                    .background(MaterialTheme.colorScheme.surface)
                    .border(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), RoundedCornerShape(32.dp))
                    .padding(24.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(24.dp)) {
                    Text(text = "SWIM COACH IA", style = MaterialTheme.typography.headlineMedium, fontStyle = FontStyle.Italic, fontWeight = FontWeight.Black)
                    
                    // Swim Mode Toggle (Time OR Distance)
                    var swimMode by remember { mutableStateOf("distance") } // "distance" or "duration"
                    
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                            .padding(2.dp)
                    ) {
                        listOf("distance" to "DISTANCE", "duration" to "TEMPS").forEach { (id, label) ->
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(if (swimMode == id) MaterialTheme.colorScheme.surface else Color.Transparent)
                                    .clickable { swimMode = id }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(text = label, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = if (swimMode == id) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                            }
                        }
                    }

                    // Dynamic Input Slider
                    if (swimMode == "distance") {
                        Column {
                            Text(text = "Distance Cible: ${state.swimDistInput.toInt()}m", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                            Slider(value = state.swimDistInput, onValueChange = { state.swimDistInput = it }, valueRange = 500f..5000f, steps = 8)
                        }
                    } else {
                        Column {
                            Text(text = "Durée Cible: ${state.swimDurationInput.toInt()} min", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                            Slider(value = state.swimDurationInput, onValueChange = { state.swimDurationInput = it }, valueRange = 15f..90f, steps = 5)
                        }
                    }

                    if (state.generatedSwimSession != null) {
                        val session = state.generatedSwimSession!!
                        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Surface(color = Color(0xFF0EA5E9).copy(alpha = 0.15f), shape = RoundedCornerShape(8.dp)) {
                                    Text(text = session.focus.uppercase(), color = Color(0xFF0EA5E9), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp))
                                }
                                Text(text = "${session.dist}m • ${session.duration} min", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f))
                            }

                            // Warmup
                            SwimPartCard(title = "ÉCHAUFFEMENT", content = session.warmup, icon = Icons.Default.Waves, color = Color(0xFF0EA5E9).copy(alpha = 0.4f))
                            
                            // Main Set
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(24.dp))
                                    .background(Color(0xFF0EA5E9).copy(alpha = 0.05f))
                                    .border(1.dp, Color(0xFF0EA5E9).copy(alpha = 0.1f), RoundedCornerShape(24.dp))
                                    .padding(20.dp),
                                verticalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Icon(Icons.Default.Timer, contentDescription = null, tint = Color(0xFF0EA5E9), modifier = Modifier.size(16.dp))
                                    Text("CORPS DE SÉANCE", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = Color(0xFF0EA5E9))
                                }
                                session.mainSet.forEach { item ->
                                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                        Text("•", color = Color(0xFF0EA5E9), fontWeight = FontWeight.Black)
                                        Text(text = item, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                                    }
                                }
                            }

                            // Cooldown
                            SwimPartCard(title = "RETOUR AU CALME", content = session.cooldown, icon = Icons.Default.SelfImprovement, color = Color(0xFF10B981).copy(alpha = 0.4f))

                            Button(
                                onClick = {
                                    val newSession = SwimSession(content = "${session.focus}: ${session.dist}m - ${session.mainSet.joinToString(" | ")}")
                                    state.savedSwimSessions = state.savedSwimSessions + newSession
                                    state.generatedSwimSession = null
                                },
                                modifier = Modifier.fillMaxWidth().height(50.dp),
                                shape = RoundedCornerShape(16.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), contentColor = MaterialTheme.colorScheme.onSurface)
                            ) {
                                Text("ENREGISTRER LA SÉANCE", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black)
                            }
                        }
                    }

                    Button(
                        onClick = { 
                            state.generatedSwimSession = TrainingPlanGenerator.generateSwimSession(
                                mode = swimMode,
                                target = if (swimMode == "distance") state.swimDistInput.toInt() else state.swimDurationInput.toInt()
                            )
                        },
                        modifier = Modifier.fillMaxWidth().height(56.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0EA5E9), contentColor = Color.White)
                    ) {
                        Text(text = "GÉNÉRER SÉANCE", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black)
                    }
                    
                    Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f))
                    
                    // Saved Sessions List
                    if (state.savedSwimSessions.isNotEmpty()) {
                        Text("SÉANCES SAUVEGARDÉES", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                        
                        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                            state.savedSwimSessions.asReversed().forEach { session ->
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                                ) {
                                    Column(modifier = Modifier.padding(16.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text(session.date, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                                            Row {
                                                IconButton(onClick = { /* Share Logic */ }) {
                                                    Icon(Icons.Default.Share, contentDescription = "Share", tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), modifier = Modifier.size(16.dp))
                                                }
                                                IconButton(onClick = { 
                                                    val current = state.savedSwimSessions.toMutableList()
                                                    current.removeAll { s: SwimSession -> s.id == session.id }
                                                    state.savedSwimSessions = current
                                                }) {
                                                    Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Color(0xFFFF3B30), modifier = Modifier.size(16.dp))
                                                }
                                            }
                                        }
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text(session.content, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SwimPartCard(title: String, content: String, icon: androidx.compose.ui.graphics.vector.ImageVector, color: Color) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(color.copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(20.dp))
        }
        Column {
            Text(text = title, style = MaterialTheme.typography.labelSmall, color = color, fontWeight = FontWeight.Black)
            Text(text = content, style = MaterialTheme.typography.bodySmall)
        }
    }
}
