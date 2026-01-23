package com.drawrun.app.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.platform.LocalContext
import com.drawrun.app.*
import com.drawrun.app.data.PlanRepository
import com.drawrun.app.ui.components.*
import com.drawrun.app.ui.components.formatDuration
import com.drawrun.app.logic.TrainingPlanGenerator
import com.drawrun.app.logic.PerformanceAnalyzer
import java.time.LocalDate

@Composable
fun PlanningScreen(state: AppState) {
    val context = LocalContext.current
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
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(if (planningSport == "custom") MaterialTheme.colorScheme.primary else Color.Transparent)
                    .clickable { planningSport = "custom" },
                contentAlignment = Alignment.Center
            ) {
                Text(text = "CRÉATION", style = MaterialTheme.typography.labelSmall, color = if (planningSport == "custom") Color.White else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontWeight = FontWeight.Black)
            }
        }

        var showWorkoutCreator by remember { mutableStateOf(false) }
        var workoutToEdit by remember { mutableStateOf<CustomRunWorkout?>(null) }

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
                    
                    // Paces removed (available in Performance Screen)

                    
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
                                
                                // Progress Badge & Delete
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    IconButton(
                                        onClick = {
                                            PlanRepository.deletePlan(context)
                                            state.generatedRunPlan = emptyList()
                                            state.runPlanObjective = ""
                                        },
                                        modifier = Modifier.size(32.dp)
                                    ) {
                                        Icon(
                                            Icons.Default.Delete,
                                            contentDescription = "Supprimer le plan",
                                            tint = MaterialTheme.colorScheme.error.copy(alpha = 0.5f),
                                            modifier = Modifier.size(20.dp)
                                        )
                                    }

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
                        // Use cached insights from AppState
                        val insights = state.activityInsights
                        
                        // Default values based on insights (e.g. improve 10k by 2%)
                        val defaultDist = 10000.0
                        val defaultTime = insights.bestTimes[defaultDist]?.timeSeconds?.times(0.98)?.toInt() ?: 3000

                        // New Plan Configuration Dialog
                        com.drawrun.app.ui.components.PlanConfigurationDialog(
                            initialDistance = defaultDist,
                            initialDurationSeconds = defaultTime,
                            insights = insights,
                            onDismiss = { showPlanSetup = false },
                            onGenerate = { distance, h, m, s, startDate ->
                                // Calculate total minutes
                                val totalMin = h * 60 + m + s / 60.0
                                
                                val currentPeak = com.drawrun.app.logic.PerformanceAnalyzer.calculatePeakWeeklyVolume(state.activities)
                                val avgVol = insights.weeklyAverage
                                // Target peak should be higher than current average, typically plan peaks at ~130-150% of base
                                val peakVol = maxOf(currentPeak, avgVol * 1.3, 30.0)

                                // Generate Config
                                val config = TrainingPlanGenerator.PlanConfig(
                                    method = "vdot",
                                    raceDistance = distance,
                                    minutes = (totalMin).toInt(),
                                    seconds = s,
                                    peakWeeklyKm = peakVol,
                                    startDate = startDate
                                )
                                
                                // Generate Call
                                state.generatedRunPlan = TrainingPlanGenerator.generatePlan(config, state.vdot)
                                state.runPlanObjective = "Objectif: ${(distance/1000).toInt()}km en ${String.format("%d:%02d", h, m)}"
                                
                                // Save Plan
                                PlanRepository.savePlan(context, state.generatedRunPlan, state.runPlanObjective)
                                
                                // Also update user stats if needed
                                showPlanSetup = false
                            }
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
        } else if (planningSport == "custom") {
             if (showWorkoutCreator) {
                  WorkoutCreator(
                      onSave = { workout ->
                           state.savedRunWorkouts = state.savedRunWorkouts + workout
                           showWorkoutCreator = false
                      },
                      onCancel = { showWorkoutCreator = false }
                  )
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
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text(text = "MES SÉANCES", style = MaterialTheme.typography.headlineMedium, fontStyle = FontStyle.Italic, fontWeight = FontWeight.Black)
                            Button(
                                onClick = { showWorkoutCreator = true },
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("CRÉER", fontWeight = FontWeight.Bold)
                            }
                        }

                        if (state.savedRunWorkouts.isEmpty()) {
                             Box(modifier = Modifier.fillMaxWidth().height(150.dp).background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha=0.3f), RoundedCornerShape(16.dp)), contentAlignment = Alignment.Center) {
                                 Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                     Icon(Icons.Default.Edit, contentDescription = null, tint = Color.Gray)
                                     Text("Aucune séance personnalisée", color = Color.Gray)
                                 }
                             }
                        } else {
                            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                                state.savedRunWorkouts.reversed().forEach { workout ->
                                     var isExpanded by remember { mutableStateOf(false) }
                                     CustomWorkoutCard(
                                         workout = workout,
                                         onDelete = {
                                             val list = state.savedRunWorkouts.toMutableList()
                                             list.remove(workout)
                                             state.savedRunWorkouts = list
                                         },
                                         onEdit = {
                                             workoutToEdit = workout
                                             showWorkoutCreator = true
                                         },
                                         onExpandToggle = { isExpanded = !isExpanded },
                                         isExpanded = isExpanded
                                     )
                                }
                            }
                        }
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
                // ... Existing Swim Content ...
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
                                    var showEducationDialog by remember { mutableStateOf(false) }
                                    
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Icon(Icons.Default.Waves, contentDescription = null, tint = Color(0xFF0EA5E9), modifier = Modifier.size(16.dp))
                                        Text(exercise.type.uppercase(), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = Color(0xFF0EA5E9))
                                        Text("${exercise.distance}m", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                                        
                                        // Education icon for drills
                                        if (exercise.type.contains("Éducatifs", ignoreCase = true)) {
                                            IconButton(
                                                onClick = { showEducationDialog = true },
                                                modifier = Modifier.size(24.dp)
                                            ) {
                                                Icon(
                                                    Icons.Default.School,
                                                    contentDescription = "Voir les éducatifs",
                                                    tint = Color(0xFF0EA5E9),
                                                    modifier = Modifier.size(16.dp)
                                                )
                                            }
                                        }
                                    }
                                    
                                    if (showEducationDialog) {
                                        com.drawrun.app.ui.components.SwimEducationDialog(
                                            onDismiss = { showEducationDialog = false }
                                        )
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

@Composable
fun CustomWorkoutCard(
    workout: CustomRunWorkout,
    onDelete: () -> Unit,
    onEdit: () -> Unit,
    onExpandToggle: () -> Unit,
    isExpanded: Boolean
) {
    // Determine color based on intensity (rough heuristic)
    val intensityColor = remember(workout) {
         if (workout.steps.any { it.intensity == "MAX" || it.targetValue.contains("Z5") }) Color(0xFFEF4444)
         else if (workout.steps.any { it.intensity == "HIGH" || it.targetValue.contains("Z4") }) Color(0xFFF59E0B)
         else Color(0xFF3B82F6) // Default Blue
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(32.dp))
            .background(
                brush = androidx.compose.ui.graphics.Brush.linearGradient(
                    colors = listOf(
                        intensityColor.copy(alpha = 0.15f),
                        MaterialTheme.colorScheme.surface
                    )
                )
            )
            .border(1.dp, intensityColor.copy(alpha = 0.2f), RoundedCornerShape(32.dp))
            .clickable { onExpandToggle() }
            .padding(24.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Surface(
                        color = intensityColor.copy(alpha = 0.2f),
                        shape = CircleShape,
                        modifier = Modifier.size(32.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.DirectionsRun,
                                contentDescription = null,
                                tint = intensityColor,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                    Text(
                        text = "SÉANCE PERSONNALISÉE",
                        style = MaterialTheme.typography.labelSmall,
                        color = intensityColor,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onEdit, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.Edit, contentDescription = "Modifier", tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                    }
                    IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.Delete, contentDescription = "Supprimer", tint = MaterialTheme.colorScheme.error.copy(alpha = 0.5f))
                    }
                }
            }

            // Title
            Column {
                Text(
                    text = workout.name,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Black
                )
                if (workout.description.isNotBlank()) {
                     Text(
                        text = workout.description,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                        fontStyle = FontStyle.Italic
                    )
                }
            }

             // Metrics Row (Summary)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Distance
                Surface(
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                         Text("DISTANCE", style = MaterialTheme.typography.labelSmall, fontSize = 8.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha=0.5f))
                         Text("${(workout.totalDistance/1000).toInt()}km", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }
                }
                 // Duration
                Surface(
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                         Text("DURÉE ESTIMÉE", style = MaterialTheme.typography.labelSmall, fontSize = 8.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha=0.5f))
                         Text(formatDuration(workout.totalDuration), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Structure (Always visible or expandable?) - Let's show a preview always
             Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "STRUCTURE",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                workout.steps.forEach { step ->
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.Top
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .offset(y = 6.dp)
                                .background(getColorForStep(step.type), CircleShape)
                        )
                         Column {
                             Text(
                                text = "${getStepTypeLabel(step.type)} • ${formatStepDuration(step)}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.9f),
                                fontWeight = FontWeight.Bold
                            )
                             if (step.targetValue.isNotBlank()) {
                                 Text(
                                    text = if (step.type == "PPG") step.targetValue else "@ ${step.targetValue}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                )
                             }
                             // Show substeps for blocks
                             if (step.steps.isNotEmpty()) {
                                 Text(
                                     text = "${step.repeatCount}x (${step.steps.joinToString(" + ") { formatStepDuration(it) }})",
                                      style = MaterialTheme.typography.bodySmall,
                                      color = MaterialTheme.colorScheme.primary
                                 )
                             }
                         }
                    }
                }
            }
        }
    }
}
