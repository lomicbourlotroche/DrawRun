package com.drawrun.app.ui.components

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.drawrun.app.WorkoutStep
import com.drawrun.app.CustomRunWorkout
import com.drawrun.app.AppState
import java.util.UUID

@Composable
fun WorkoutCreator(
    onSave: (CustomRunWorkout) -> Unit,
    onCancel: () -> Unit
) {
    var workoutName by remember { mutableStateOf("Nouvel Entraînement") }
    var workoutDesc by remember { mutableStateOf("") }
    var steps by remember { mutableStateOf<List<WorkoutStep>>(emptyList()) }
    var editingStep by remember { mutableStateOf<Pair<Int, WorkoutStep>?>(null) }
    val totalDist = remember(steps) { steps.sumOf { calculateStepDist(it) } }
    val totalDuration = remember(steps) { steps.sumOf { calculateStepDuration(it) } }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onCancel) {
                Icon(Icons.Default.Close, contentDescription = "Close")
            }
            Text("CRÉATEUR SÉANCE", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
            Button(
                onClick = {
                    val workout = CustomRunWorkout(
                        name = workoutName,
                        description = workoutDesc,
                        steps = steps,
                        totalDistance = totalDist,
                        totalDuration = totalDuration.toInt()
                    )
                    onSave(workout)
                },
                enabled = steps.isNotEmpty() && workoutName.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Text("SAUVER", fontWeight = FontWeight.Bold)
            }
        }
        
        // Metadata Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = workoutName,
                    onValueChange = { workoutName = it },
                    label = { Text("Nom de la séance") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )
                OutlinedTextField(
                    value = workoutDesc,
                    onValueChange = { workoutDesc = it },
                    label = { Text("Description (optionnel)") },
                   modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    maxLines = 2
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    BadgeInfo(icon = Icons.Default.Straighten, text = "%.1f km".format(totalDist / 1000))
                    BadgeInfo(icon = Icons.Default.Timer, text = formatDuration(totalDuration.toInt()))
                }
            }
        }
        
        // Steps List
        if (steps.isEmpty()) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Box(
                    modifier = Modifier.fillMaxWidth().padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.Edit, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(48.dp))
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("Aucune étape", color = Color.Gray, style = MaterialTheme.typography.bodyMedium)
                        Text("Cliquez sur un bouton ci-dessous", color = Color.Gray.copy(alpha = 0.7f), style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        } else {
            Text(
                "${steps.size} étape(s)",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.Bold
            )
            
            steps.forEachIndexed { index, step ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { editingStep = index to step },
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(56.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(getColorForStep(step.type).copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    getIconForStep(step.type),
                                    contentDescription = null,
                                    tint = getColorForStep(step.type),
                                    modifier = Modifier.size(28.dp)
                                )
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    getStepTypeLabel(step.type),
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    formatStepDuration(step),
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                )
                                if (step.targetType == "PACE" && step.targetValue.isNotBlank()) {
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        "🎯 Allure: ${step.targetValue}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = getColorForStep(step.type),
                                        fontWeight = FontWeight.Medium
                                    )
                                } else if (step.targetType == "HR_ZONE" && step.targetValue.isNotBlank()) {
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        "💓 Zone FC: ${step.targetValue}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = Color(0xFFEF4444),
                                        fontWeight = FontWeight.Medium
                                    )
                                } else if (step.targetType == "PACE_ZONE" && step.targetValue.isNotBlank()) {
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        "⚡ Zone Allure: ${step.targetValue}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = Color(0xFF8B5CF6),
                                        fontWeight = FontWeight.Medium
                                    )
                                }
                            }
                        }
                        IconButton(onClick = { steps = steps.toMutableList().also { it.removeAt(index) } }) {
                            Icon(Icons.Default.Delete, contentDescription = "Supprimer", tint = MaterialTheme.colorScheme.error)
                        }
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.height(8.dp))
        
        // Tools Row
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
            shape = RoundedCornerShape(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(8.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                ToolButton("ÉCHAUF", Icons.Default.Waves, Color(0xFF60A5FA)) {
                    steps = steps + WorkoutStep(type = "WARMUP", durationType = "TIME", durationValue = 600.0, targetType = "HR_ZONE", targetValue = "Z1")
                }
                ToolButton("RUN", Icons.Default.DirectionsRun, Color(0xFF22C55E)) {
                    steps = steps + WorkoutStep(type = "RUN", durationType = "DISTANCE", durationValue = 1000.0, targetType = "PACE", targetValue = "5:00")
                }
                ToolButton("RÉCUP", Icons.Default.SelfImprovement, Color(0xFFF59E0B)) {
                    steps = steps + WorkoutStep(type = "REST", durationType = "TIME", durationValue = 120.0, targetType = "NONE", targetValue = "")
                }
                ToolButton("COOL", Icons.Default.AcUnit, Color(0xFF3B82F6)) {
                    steps = steps + WorkoutStep(type = "COOL", durationType = "TIME", durationValue = 300.0, targetType = "HR_ZONE", targetValue = "Z1")
                }
                ToolButton("RÉPÉT.", Icons.Default.Repeat, Color(0xFFEC4899)) {
                    val run = WorkoutStep(type = "RUN", durationType = "DISTANCE", durationValue = 400.0, targetType = "PACE", targetValue = "4:00")
                    val rest = WorkoutStep(type = "REST", durationType = "TIME", durationValue = 60.0, targetType = "NONE", targetValue = "")
                    steps = steps + WorkoutStep(
                        type = "INTERVAL_BLOCK", 
                        durationType = "OPEN", 
                        durationValue = 0.0, 
                        targetType = "NONE", 
                        targetValue = "", 
                        repeatCount = 10,
                        steps = listOf(run, rest)
                    )
                }
            }
        }
        
        Spacer(modifier = Modifier.height(100.dp))
    }
    
    // Editor Dialog
    editingStep?.let { (index, step) ->
        WorkoutStepEditorDialog(
            step = step,
            onDismiss = { editingStep = null },
            onSave = { newStep ->
                steps = steps.toMutableList().also { it[index] = newStep }
                editingStep = null
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkoutStepEditorDialog(
    step: WorkoutStep,
    onDismiss: () -> Unit,
    onSave: (WorkoutStep) -> Unit
) {
    var editedStep by remember { mutableStateOf(step) }
    var durationType by remember { mutableStateOf(step.durationType) }
    var durationValue by remember { mutableStateOf(step.durationValue.toInt().toString()) }
    var targetType by remember { mutableStateOf(step.targetType) }
    var targetValue by remember { mutableStateOf(step.targetValue) }
    var stepType by remember { mutableStateOf(step.type) }
    var metricDialogInfo by remember { mutableStateOf<MetricInfo?>(null) }
    
    if (metricDialogInfo != null) {
        MetricInfoDialog(
            info = metricDialogInfo!!,
            onDismiss = { metricDialogInfo = null }
        )
    }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Personnaliser l'Étape", fontWeight = FontWeight.Bold) },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Type de Step
                Text("Type d'Étape", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("WARMUP" to "Échauf", "RUN" to "Run", "REST" to "Récup", "COOL" to "Cool").forEach { (type, label) ->
                        FilterChip(
                            selected = stepType == type,
                            onClick = { stepType = type },
                            label = { Text(label, fontSize = 12.sp) }
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(4.dp))
                
                // Distance ou Durée
                Text("Duration", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    FilterChip(
                        selected = durationType == "DISTANCE",
                        onClick = { durationType = "DISTANCE" },
                        label = { Text("Distance", fontSize = 12.sp) }
                    )
                    FilterChip(
                        selected = durationType == "TIME",
                        onClick = { durationType = "TIME" },
                        label = { Text("Durée", fontSize = 12.sp) }
                    )
                }
                OutlinedTextField(
                    value = durationValue,
                    onValueChange = { durationValue = it.filter { c -> c.isDigit() } },
                    label = { Text(if (durationType == "DISTANCE") "Mètres" else "Secondes") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                
                Spacer(modifier = Modifier.height(4.dp))
                
                // Type de Cible
                Text("Cible", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.horizontalScroll(rememberScrollState())
                ) {
                    FilterChip(
                        selected = targetType == "PACE",
                        onClick = { targetType = "PACE"; targetValue = "5:00" },
                        label = { Text("Allure", fontSize = 12.sp) }
                    )
                    FilterChip(
                        selected = targetType == "HR_ZONE",
                        onClick = { targetType = "HR_ZONE"; targetValue = "Z3" },
                        label = { 
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text("Zone FC", fontSize = 12.sp)
                                Icon(
                                    Icons.Default.Info, 
                                    contentDescription = null, 
                                    modifier = Modifier.size(12.dp).clickable { metricDialogInfo = MetricDefinitions.HRZones },
                                    tint = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    )
                    FilterChip(
                        selected = targetType == "PACE_ZONE",
                        onClick = { targetType = "PACE_ZONE"; targetValue = "ZA3" },
                        label = { 
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text("Zone Allure", fontSize = 12.sp)
                                Icon(
                                    Icons.Default.Info, 
                                    contentDescription = null, 
                                    modifier = Modifier.size(12.dp).clickable { metricDialogInfo = MetricDefinitions.PaceZones },
                                    tint = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    )
                    FilterChip(
                        selected = targetType == "NONE",
                        onClick = { targetType = "NONE"; targetValue = "" },
                        label = { Text("Aucune", fontSize = 12.sp) }
                    )
                }
                
                if (targetType == "PACE") {
                    OutlinedTextField(
                        value = targetValue,
                        onValueChange = { targetValue = it },
                        label = { Text("Allure (min/km)") },
                        placeholder = { Text("5:00") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                } else if (targetType == "HR_ZONE") {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("Z1", "Z2", "Z3", "Z4", "Z5").forEach { zone ->
                            FilterChip(
                                selected = targetValue == zone,
                                onClick = { targetValue = zone },
                                label = { Text(zone, fontSize = 12.sp) }
                            )
                        }
                    }
                } else if (targetType == "PACE_ZONE") {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("ZA1", "ZA2", "ZA3", "ZA4", "ZA5").forEach { zone ->
                            FilterChip(
                                selected = targetValue == zone,
                                onClick = { targetValue = zone },
                                label = { Text(zone, fontSize = 12.sp) }
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = {
                val newStep = step.copy(
                    type = stepType,
                    durationType = durationType,
                    durationValue = durationValue.toDoubleOrNull() ?: step.durationValue,
                    targetType = targetType,
                    targetValue = targetValue
                )
                onSave(newStep)
            }) {
                Text("Sauvegarder")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Annuler")
            }
        }
    )
}

@Composable
fun ToolButton(label: String, icon: androidx.compose.ui.graphics.vector.ImageVector, color: Color, onClick: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable(onClick = onClick).padding(8.dp)) {
        Box(
            modifier = Modifier.size(40.dp).clip(RoundedCornerShape(12.dp)).background(color),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = null, tint = Color.White)
        }
        Text(label, style = MaterialTheme.typography.labelSmall, fontSize = 9.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 4.dp))
    }
}

@Composable
fun BadgeInfo(icon: androidx.compose.ui.graphics.vector.ImageVector, text: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        Icon(icon, contentDescription = null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.primary)
        Text(text, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
    }
}

// Helpers
fun getColorForStep(type: String): Color = when(type) {
    "WARMUP" -> Color(0xFF60A5FA)
    "RUN" -> Color(0xFF22C55E)
    "REST" -> Color(0xFFF59E0B)
    "COOL" -> Color(0xFF8B5CF6)
    else -> Color.Gray
}

fun getIconForStep(type: String): androidx.compose.ui.graphics.vector.ImageVector = when(type) {
    "WARMUP" -> Icons.Default.Waves
    "RUN" -> Icons.Default.DirectionsRun
    "REST" -> Icons.Default.SelfImprovement
    "COOL" -> Icons.Default.AcUnit
    else -> Icons.Default.Circle
}

fun getStepTypeLabel(type: String): String = when(type) {
    "WARMUP" -> "Échauffement"
    "RUN" -> "Course"
    "REST" -> "Récupération"
    "COOL" -> "Retour au calme"
    "INTERVAL_BLOCK" -> "Répétitions"
    else -> type
}

fun formatStepDuration(step: WorkoutStep): String {
    return if (step.durationType == "DISTANCE") {
        "${step.durationValue.toInt()}m"
    } else {
        formatDuration(step.durationValue.toInt())
    }
}

fun formatDuration(seconds: Int): String {
    val m = seconds / 60
    val s = seconds % 60
    return if (m > 0) "${m}m ${s}s" else "${s}s"
}

fun calculateStepDist(step: WorkoutStep): Double {
    if (step.type == "INTERVAL_BLOCK") {
        val blockDist = step.steps.sumOf { calculateStepDist(it) }
        return blockDist * step.repeatCount
    }
    return if (step.durationType == "DISTANCE") step.durationValue else 0.0
}

fun calculateStepDuration(step: WorkoutStep): Double {
    if (step.type == "INTERVAL_BLOCK") {
        val blockDur = step.steps.sumOf { calculateStepDuration(it) }
        return blockDur * step.repeatCount
    }
    return if (step.durationType == "TIME") step.durationValue else step.durationValue / 3.3
}
