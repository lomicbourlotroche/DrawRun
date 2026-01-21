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
import androidx.compose.material.icons.filled.ElectricBolt
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
import androidx.compose.ui.text.style.TextOverflow
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
                    
                    // Paces Display (Always Visible) - SAFE ACCESS TO PREVENT CRASH
                    val runZones = state.zones?.runZones
                    val paces = try {
                         runZones?.pace?.let { allure ->
                            val list = mutableListOf<Pair<String, String>>()
                            // Safe access for all zones - PerformanceAnalyzer returns 5 zones (indices 0-4)
                            allure.getOrNull(0)?.let { list.add("Recup (Z1)" to "${formatPace(it.first)}-${formatPace(it.second)}") }
                            allure.getOrNull(1)?.let { list.add("Easy (Z2)" to "${formatPace(it.first)}-${formatPace(it.second)}") }
                            allure.getOrNull(2)?.let { list.add("Marathon (Z3)" to formatPace(it.first)) }
                            allure.getOrNull(3)?.let { list.add("Seuil (Z4)" to formatPace(it.first)) }
                            allure.getOrNull(4)?.let { list.add("Interval (Z5)" to formatPace(it.first)) }
                            // R-Pace is typically faster than Z5, calculate if needed
                            allure.getOrNull(4)?.let { z5 -> 
                                val rPace = z5.first * 0.95 // R-pace is ~5% faster than Z5
                                list.add("Répétition (R)" to formatPace(rPace))
                            }
                            list
                         }
                    } catch (e: Exception) {
                        android.util.Log.e("DrawRun", "Error loading paces", e)
                        null
                    } ?: listOf(
                        "Easy (E)" to "5:30 - 6:00",
                        "Marathon (M)" to "4:45",
                        "Seuil (T)" to "4:15",
                        "Interval (I)" to "3:55",
                        "Répétition (R)" to "3:30"
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
                    
                    // Weekly Plan Section - Modern Card Layout
                    if (state.generatedRunPlan.isNotEmpty()) {
                        // Overall Progress Header
                        val totalWorkouts = state.generatedRunPlan.sumOf { it.days.count { d -> d.dist > 0 } }
                        val completedWorkouts = state.workoutCompletions.values.count { it.status == com.drawrun.app.CompletionStatus.COMPLETED }
                        val overallProgress = if (totalWorkouts > 0) (completedWorkouts.toFloat() / totalWorkouts * 100).toInt() else 0
                        
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = "VOTRE PLAN (12 SEMAINES)",
                                        style = MaterialTheme.typography.labelLarge,
                                        color = MaterialTheme.colorScheme.primary,
                                        fontWeight = FontWeight.Black
                                    )
                                    Text(
                                        text = "$completedWorkouts/$totalWorkouts séances complétées",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                    )
                                }
                                
                                // Progress Badge
                                Surface(
                                    color = when {
                                        overallProgress >= 75 -> Color(0xFF22C55E).copy(alpha = 0.15f)
                                        overallProgress >= 50 -> Color(0xFFF59E0B).copy(alpha = 0.15f)
                                        else -> MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)
                                    },
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            Icons.Default.TrendingUp,
                                            contentDescription = null,
                                            modifier = Modifier.size(16.dp),
                                            tint = when {
                                                overallProgress >= 75 -> Color(0xFF22C55E)
                                                overallProgress >= 50 -> Color(0xFFF59E0B)
                                                else -> MaterialTheme.colorScheme.primary
                                            }
                                        )
                                        Text(
                                            text = "$overallProgress%",
                                            style = MaterialTheme.typography.labelMedium,
                                            fontWeight = FontWeight.Black,
                                            color = when {
                                                overallProgress >= 75 -> Color(0xFF22C55E)
                                                overallProgress >= 50 -> Color(0xFFF59E0B)
                                                else -> MaterialTheme.colorScheme.primary
                                            }
                                        )
                                    }
                                }
                            }
                            
                            // Progress Bar
                            LinearProgressIndicator(
                                progress = overallProgress / 100f,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(6.dp)
                                    .clip(RoundedCornerShape(3.dp)),
                                color = when {
                                    overallProgress >= 75 -> Color(0xFF22C55E)
                                    overallProgress >= 50 -> Color(0xFFF59E0B)
                                    else -> MaterialTheme.colorScheme.primary
                                },
                                trackColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f)
                            )
                        }
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        // Week Cards in Carousel
                        // New Training Plan UI: Flashcards for current week + Dropdown for future
                        val currentWeek = state.generatedRunPlan.firstOrNull()
                        val futureWeeks = state.generatedRunPlan.drop(1)
                        
                        if (currentWeek != null) {
                            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                                Text(
                                    text = "SEMAINE ACTUELLE (${currentWeek.weekNum})",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Black,
                                    color = MaterialTheme.colorScheme.primary,
                                    letterSpacing = 1.sp
                                )
                                
                                // Current week days as flashcards
                                currentWeek.days.forEachIndexed { dayIndex, day ->
                                    DayFlashcard(
                                        day = day,
                                        weekNum = currentWeek.weekNum,
                                        dayIndex = dayIndex,
                                        state = state
                                    )
                                }
                                
                                if (futureWeeks.isNotEmpty()) {
                                    Spacer(modifier = Modifier.height(16.dp))
                                    FutureWeeksDropdown(
                                        weeks = futureWeeks,
                                        state = state
                                    )
                                }
                            }
                        } else {
                            // Placeholder if no plan
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(200.dp)
                                    .clip(RoundedCornerShape(24.dp))
                                    .background(MaterialTheme.colorScheme.surface)
                                    .border(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), RoundedCornerShape(24.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(Icons.Default.EventNote, contentDescription = null, modifier = Modifier.size(48.dp), tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f))
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Text("Aucun plan généré", style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f))
                                }
                            }
                        }
                    }

                    var showPlanSetup by remember { mutableStateOf(false) }

                    if (showPlanSetup) {
                        val insights = remember { com.drawrun.app.logic.ActivityAnalyzer.analyzeActivities(state.activities) }
                        var useAutoConfig by remember { mutableStateOf(true) }
                        var distText by remember { mutableStateOf("") }
                        var timeText by remember { mutableStateOf("") }
                        
                        AlertDialog(
                            onDismissRequest = { showPlanSetup = false },
                            title = { Text("Configuration Intelligente", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black) },
                            text = {
                                Column(verticalArrangement = Arrangement.spacedBy(16.dp), modifier = Modifier.verticalScroll(rememberScrollState())) {
                                    // Activity insights section
                                    if (insights.totalRuns > 0) {
                                        Surface(
                                            color = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                                            shape = RoundedCornerShape(12.dp)
                                        ) {
                                            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                                    Icon(Icons.Default.Analytics, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
                                                    Text("📊 Analyse de votre historique", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.primary)
                                                }
                                                
                                                Divider(color = MaterialTheme.colorScheme.primary.copy(alpha = 0.2f), modifier = Modifier.padding(vertical = 4.dp))
                                                
                                                // Best times
                                                insights.bestTimes[10000.0]?.let { perf ->
                                                    Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                                                        Text("Meilleur 10km:", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f))
                                                        Text("${(perf.timeSeconds / 60).toInt()}:${((perf.timeSeconds % 60).toInt()).toString().padStart(2, '0')} (${perf.pace})", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                                                    }
                                                }
                                                
                                                insights.bestTimes[5000.0]?.let { perf ->
                                                    Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                                                        Text("Meilleur 5km:", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f))
                                                        Text("${(perf.timeSeconds / 60).toInt()}:${((perf.timeSeconds % 60).toInt()).toString().padStart(2, '0')} (${perf.pace})", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                                                    }
                                                }
                                                
                                                // Weekly average
                                                Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                                                    Text("Moyenne hebdo:", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f))
                                                    Text("${insights.weeklyAverage.toInt()} km/semaine", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                                                }
                                                
                                                // Longest run
                                                Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                                                    Text("Plus longue sortie:", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f))
                                                    Text("${"%.1f".format(insights.longestRun)} km", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                                                }
                                                
                                                // VDOT estimate
                                                insights.estimatedVDOT?.let { vdot ->
                                                    Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                                                        Text("VDOT estimé:", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f))
                                                        Text("${"%.1f".format(vdot)}", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = Color(0xFFF59E0B))
                                                    }
                                                }
                                            }
                                        }
                                        
                                        // Auto-config toggle
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text("Utiliser ces données", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                                            Switch(
                                                checked = useAutoConfig,
                                                onCheckedChange = { useAutoConfig = it },
                                                colors = SwitchDefaults.colors(checkedThumbColor = MaterialTheme.colorScheme.primary)
                                            )
                                        }
                                    } else {
                                        Text("Aucune activité trouvée. Entrez vos données manuellement.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                                    }
                                    
                                    if (!useAutoConfig || insights.totalRuns == 0) {
                                        Text("Configuration manuelle", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                                        OutlinedTextField(
                                            value = distText,
                                            onValueChange = { distText = it },
                                            label = { Text("Distance (m)") },
                                            placeholder = { Text("ex: 10000") },
                                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                            modifier = Modifier.fillMaxWidth(),
                                            shape = RoundedCornerShape(12.dp)
                                        )
                                        OutlinedTextField(
                                            value = timeText,
                                            onValueChange = { timeText = it },
                                            label = { Text("Temps (min)") },
                                            placeholder = { Text("ex: 45.5") },
                                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                            modifier = Modifier.fillMaxWidth(),
                                            shape = RoundedCornerShape(12.dp)
                                        )
                                    }
                                    
                                    Column {
                                        Text(text = "Fréquence: ${state.runPlanFreq.toInt()} séances/semaine", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
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
                                Text(text = "${session.totalDistance}m • ${session.estimatedDuration} min", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f))
                            }

                            // Display all exercises
                            for (exercise in session.exercises) {
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
                                        Icon(Icons.Default.Waves, contentDescription = null, tint = Color(0xFF0EA5E9), modifier = Modifier.size(16.dp))
                                        Text(exercise.type.uppercase(), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = Color(0xFF0EA5E9))
                                        Text("${exercise.distance}m", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                                    }
                                    
                                    Text(
                                        text = exercise.description,
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = FontWeight.Medium
                                    )
                                    
                                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                        Surface(color = Color(0xFF0EA5E9).copy(alpha = 0.1f), shape = RoundedCornerShape(8.dp)) {
                                            Text(
                                                text = exercise.intensity,
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                                style = MaterialTheme.typography.labelSmall,
                                                color = Color(0xFF0EA5E9)
                                            )
                                        }
                                        exercise.restTime?.let { rest ->
                                            Surface(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), shape = RoundedCornerShape(8.dp)) {
                                                Text(
                                                    text = "Récup: $rest",
                                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                                    style = MaterialTheme.typography.labelSmall,
                                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                                )
                                            }
                                        }
                                    }
                                }
                            }

                            Button(
                                onClick = {
                                    val newSession = SwimSession(data = session)
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
                                var isExpanded by remember { mutableStateOf(false) }
                                Card(
                                    modifier = Modifier.fillMaxWidth().clickable { isExpanded = !isExpanded },
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                                ) {
                                    Column(modifier = Modifier.padding(16.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Column {
                                                Text(session.date, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                                                Text("${session.data.focus} • ${session.data.totalDistance}m", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
                                            }
                                            Row {
                                                IconButton(onClick = { 
                                                    val current = state.savedSwimSessions.toMutableList()
                                                    current.removeAll { s: SwimSession -> s.id == session.id }
                                                    state.savedSwimSessions = current
                                                }) {
                                                    Icon(Icons.Default.Delete, contentDescription = "Delete", tint = Color(0xFFFF3B30).copy(alpha = 0.4f), modifier = Modifier.size(16.dp))
                                                }
                                                Icon(
                                                    imageVector = if (isExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                                                    contentDescription = null,
                                                    tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f)
                                                )
                                            }
                                        }
                                        
                                        AnimatedVisibility(visible = isExpanded) {
                                            Column(
                                                modifier = Modifier.padding(top = 16.dp),
                                                verticalArrangement = Arrangement.spacedBy(12.dp)
                                            ) {
                                                session.data.exercises.forEach { exercise ->
                                                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                                            Icon(Icons.Default.Waves, contentDescription = null, tint = Color(0xFF0EA5E9), modifier = Modifier.size(12.dp))
                                                            Text(exercise.type.uppercase(), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = Color(0xFF0EA5E9), fontSize = 10.sp)
                                                            Text("${exercise.distance}m", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                                                        }
                                                        Text(text = exercise.description, style = MaterialTheme.typography.bodySmall)
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
