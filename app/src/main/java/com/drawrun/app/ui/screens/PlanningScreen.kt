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
                        AppCarousel(
                            items = state.generatedRunPlan,
                            itemWidth = 340.dp,
                            itemHeight = 520.dp,
                            modifier = Modifier.fillMaxWidth()
                        ) { weekPlan, index ->
                            // Calculate week completion
                            val weekWorkouts = weekPlan.days.count { it.dist > 0 }
                            val weekCompleted = weekPlan.days.indices.count { dayIndex ->
                                val key = "week${weekPlan.weekNum - 1}_day$dayIndex"
                                state.workoutCompletions[key]?.status == com.drawrun.app.CompletionStatus.COMPLETED
                            }
                            val weekProgress = if (weekWorkouts > 0) (weekCompleted.toFloat() / weekWorkouts * 100).toInt() else 0
                            
                            Card(
                                modifier = Modifier.fillMaxSize(),
                                shape = RoundedCornerShape(32.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                border = if (weekPlan.isDecharge) BorderStroke(2.dp, Color(0xFF10B981)) else BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f)),
                                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                            ) {
                                Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                    // Week Header
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column {
                                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                                Text(
                                                    text = "SEMAINE ${weekPlan.weekNum}",
                                                    style = MaterialTheme.typography.titleLarge,
                                                    fontWeight = FontWeight.Black,
                                                    color = MaterialTheme.colorScheme.primary
                                                )
                                                if (weekPlan.isDecharge) {
                                                    Surface(
                                                        color = Color(0xFF10B981).copy(alpha = 0.15f),
                                                        shape = RoundedCornerShape(8.dp)
                                                    ) {
                                                        Text(
                                                            text = "DÉCHARGE",
                                                            color = Color(0xFF10B981),
                                                            style = MaterialTheme.typography.labelSmall,
                                                            fontWeight = FontWeight.Black,
                                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                                        )
                                                    }
                                                }
                                            }
                                            val phaseName = when(weekPlan.phase) {
                                                1 -> "FONDATION"
                                                2 -> "FORCE & VMA"
                                                3 -> "SEUIL & SPÉ"
                                                else -> "AFFUTAGE"
                                            }
                                            Text(
                                                text = phaseName,
                                                style = MaterialTheme.typography.labelSmall,
                                                fontWeight = FontWeight.Bold,
                                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                                            )
                                        }
                                        
                                        // Week Progress Circle
                                        Box(contentAlignment = Alignment.Center) {
                                            CircularProgressIndicator(
                                                progress = weekProgress / 100f,
                                                modifier = Modifier.size(48.dp),
                                                strokeWidth = 4.dp,
                                                color = when {
                                                    weekProgress >= 75 -> Color(0xFF22C55E)
                                                    weekProgress >= 50 -> Color(0xFFF59E0B)
                                                    else -> MaterialTheme.colorScheme.primary
                                                },
                                                trackColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f)
                                            )
                                            Text(
                                                text = "$weekProgress%",
                                                style = MaterialTheme.typography.labelSmall,
                                                fontWeight = FontWeight.Black,
                                                fontSize = 10.sp
                                            )
                                        }
                                    }
                                    
                                    // Week Stats
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                                    ) {
                                        Surface(
                                            modifier = Modifier.weight(1f),
                                            color = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                                            shape = RoundedCornerShape(12.dp)
                                        ) {
                                            Column(
                                                modifier = Modifier.padding(12.dp),
                                                horizontalAlignment = Alignment.CenterHorizontally
                                            ) {
                                                Text(
                                                    text = "${"%.1f".format(weekPlan.km)} km",
                                                    style = MaterialTheme.typography.titleMedium,
                                                    fontWeight = FontWeight.Black,
                                                    color = MaterialTheme.colorScheme.primary
                                                )
                                                Text(
                                                    text = "Volume",
                                                    style = MaterialTheme.typography.labelSmall,
                                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                                )
                                            }
                                        }
                                        
                                        Surface(
                                            modifier = Modifier.weight(1f),
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f),
                                            shape = RoundedCornerShape(12.dp)
                                        ) {
                                            Column(
                                                modifier = Modifier.padding(12.dp),
                                                horizontalAlignment = Alignment.CenterHorizontally
                                            ) {
                                                Text(
                                                    text = "${weekPlan.days.count { it.isQuality }}",
                                                    style = MaterialTheme.typography.titleMedium,
                                                    fontWeight = FontWeight.Black
                                                )
                                                Text(
                                                    text = "Qualité",
                                                    style = MaterialTheme.typography.labelSmall,
                                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                                )
                                            }
                                        }
                                    }
                                    
                                    Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f))
                                    
                                    // Days List
                                    Column(
                                        verticalArrangement = Arrangement.spacedBy(8.dp),
                                        modifier = Modifier.verticalScroll(rememberScrollState())
                                    ) {
                                        weekPlan.days.forEachIndexed { dayIndex, day ->
                                            val completionKey = "week${weekPlan.weekNum - 1}_day$dayIndex"
                                            val completion = state.workoutCompletions[completionKey]
                                            
                                            Surface(
                                                modifier = Modifier.fillMaxWidth(),
                                                color = when(completion?.status) {
                                                    com.drawrun.app.CompletionStatus.COMPLETED -> Color(0xFF22C55E).copy(alpha = 0.08f)
                                                    com.drawrun.app.CompletionStatus.PARTIAL -> Color(0xFFF59E0B).copy(alpha = 0.08f)
                                                    com.drawrun.app.CompletionStatus.SKIPPED -> Color(0xFFEF4444).copy(alpha = 0.08f)
                                                    else -> Color.Transparent
                                                },
                                                shape = RoundedCornerShape(12.dp)
                                            ) {
                                                Row(
                                                    modifier = Modifier.padding(12.dp),
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                                ) {
                                                    // Day Icon
                                                    Box(
                                                        modifier = Modifier
                                                            .size(40.dp)
                                                            .clip(RoundedCornerShape(10.dp))
                                                            .background(
                                                                if (day.isQuality) MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)
                                                                else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)
                                                            ),
                                                        contentAlignment = Alignment.Center
                                                    ) {
                                                        Icon(
                                                            imageVector = if (day.isQuality) Icons.Default.ElectricBolt
                                                                         else if (day.type == "L") Icons.Default.Straighten
                                                                         else Icons.Default.DirectionsRun,
                                                            contentDescription = null,
                                                            modifier = Modifier.size(20.dp),
                                                            tint = if (day.isQuality) MaterialTheme.colorScheme.primary
                                                                   else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                                        )
                                                    }
                                                    
                                                    // Day Info
                                                    Column(modifier = Modifier.weight(1f)) {
                                                        Row(
                                                            verticalAlignment = Alignment.CenterVertically,
                                                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                                                        ) {
                                                            Text(
                                                                text = day.title,
                                                                style = MaterialTheme.typography.labelMedium,
                                                                fontWeight = FontWeight.Bold,
                                                                color = MaterialTheme.colorScheme.onSurface
                                                            )
                                                            
                                                            // Completion Icon
                                                            when(completion?.status) {
                                                                com.drawrun.app.CompletionStatus.COMPLETED -> {
                                                                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF22C55E), modifier = Modifier.size(16.dp))
                                                                }
                                                                com.drawrun.app.CompletionStatus.PARTIAL -> {
                                                                    Icon(Icons.Default.Warning, contentDescription = null, tint = Color(0xFFF59E0B), modifier = Modifier.size(16.dp))
                                                                }
                                                                com.drawrun.app.CompletionStatus.SKIPPED -> {
                                                                    Icon(Icons.Default.Cancel, contentDescription = null, tint = Color(0xFFEF4444), modifier = Modifier.size(16.dp))
                                                                }
                                                                com.drawrun.app.CompletionStatus.PENDING -> {
                                                                    Icon(Icons.Default.RadioButtonUnchecked, contentDescription = null, tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.2f), modifier = Modifier.size(16.dp))
                                                                }
                                                                null -> {}
                                                            }
                                                        }
                                                        
                                                        val workoutSummary = day.details.find { det: TrainingPlanGenerator.Detail -> det.label == "Cœur" || det.label == "Objectif" }?.content ?: ""
                                                        if (workoutSummary.isNotBlank()) {
                                                            Text(
                                                                text = workoutSummary,
                                                                style = MaterialTheme.typography.labelSmall,
                                                                fontSize = 10.sp,
                                                                color = if (day.isQuality) MaterialTheme.colorScheme.primary.copy(alpha = 0.8f)
                                                                       else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                                                maxLines = 1,
                                                                overflow = TextOverflow.Ellipsis
                                                            )
                                                        }
                                                        
                                                        // Show completion details
                                                        completion?.actualActivity?.let { activity ->
                                                            Row(
                                                                verticalAlignment = Alignment.CenterVertically,
                                                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                                                            ) {
                                                                Text(
                                                                    text = "✓ ${activity.dist}",
                                                                    style = MaterialTheme.typography.labelSmall,
                                                                    fontSize = 9.sp,
                                                                    color = when {
                                                                        completion.completionScore >= 85 -> Color(0xFF22C55E)
                                                                        completion.completionScore >= 50 -> Color(0xFFF59E0B)
                                                                        else -> Color(0xFFEF4444)
                                                                    },
                                                                    fontWeight = FontWeight.Bold
                                                                )
                                                                
                                                                Surface(
                                                                    color = when {
                                                                        completion.completionScore >= 85 -> Color(0xFF22C55E).copy(alpha = 0.15f)
                                                                        completion.completionScore >= 50 -> Color(0xFFF59E0B).copy(alpha = 0.15f)
                                                                        else -> Color(0xFFEF4444).copy(alpha = 0.15f)
                                                                    },
                                                                    shape = RoundedCornerShape(4.dp)
                                                                ) {
                                                                    Text(
                                                                        text = "${completion.completionScore}%",
                                                                        style = MaterialTheme.typography.labelSmall,
                                                                        fontSize = 8.sp,
                                                                        color = when {
                                                                            completion.completionScore >= 85 -> Color(0xFF22C55E)
                                                                            completion.completionScore >= 50 -> Color(0xFFF59E0B)
                                                                            else -> Color(0xFFEF4444)
                                                                        },
                                                                        fontWeight = FontWeight.Black,
                                                                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                                                    )
                                                                }
                                                            }
                                                        }
                                                    }
                                                    
                                                    // Distance Badge
                                                    Surface(
                                                        color = if (day.dist > 0) MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)
                                                               else Color(0xFF10B981).copy(alpha = 0.15f),
                                                        shape = RoundedCornerShape(8.dp)
                                                    ) {
                                                        Text(
                                                            text = if (day.dist > 0) "${"%.1f".format(day.dist)}km" else "REPOS",
                                                            style = MaterialTheme.typography.labelSmall,
                                                            fontSize = 10.sp,
                                                            fontWeight = FontWeight.Black,
                                                            color = if (day.dist > 0) MaterialTheme.colorScheme.primary else Color(0xFF10B981),
                                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                                        )
                                                    }
                                                }
                                            }
                                        }
                                    }
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
