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
import com.drawrun.app.utils.ShareUtils
import com.drawrun.app.utils.WorkoutImageGenerator
import androidx.compose.ui.platform.LocalContext
import java.util.UUID

@Composable
fun WorkoutCreator(
    initialWorkout: CustomRunWorkout? = null,
    onSave: (CustomRunWorkout) -> Unit,
    onCancel: () -> Unit
) {
    var workoutName by remember { mutableStateOf(initialWorkout?.name ?: "Nouvel Entraînement") }
    var workoutDesc by remember { mutableStateOf(initialWorkout?.description ?: "") }
    var steps by remember { mutableStateOf<List<WorkoutStep>>(initialWorkout?.steps ?: emptyList()) }
    var editingStep by remember { mutableStateOf<Pair<Int, WorkoutStep>?>(null) } // Only for top-level non-block steps
    
    // For nested editing (Block Index + Step Index + Step)
    var editingSubStep by remember { mutableStateOf<Triple<Int, Int, WorkoutStep>?>(null) }

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
            Text(if (initialWorkout != null) "MODIFIER SÉANCE" else "CRÉATEUR SÉANCE", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
            Row(verticalAlignment = Alignment.CenterVertically) {
                val context = LocalContext.current
                IconButton(onClick = {
                    val tempWorkout = CustomRunWorkout(
                        name = workoutName,
                        description = workoutDesc,
                        steps = steps,
                        totalDistance = totalDist.toDouble(),
                        totalDuration = totalDuration.toInt()
                    )
                    val bitmap = WorkoutImageGenerator.generateRunWorkoutImage(tempWorkout)
                    ShareUtils.shareBitmap(context, bitmap, "Export_${workoutName}")
                }) {
                    Icon(Icons.Default.Share, contentDescription = "Exporter en image", tint = MaterialTheme.colorScheme.primary)
                }
                
                Button(
                    onClick = {
                    val workout = CustomRunWorkout(
                        id = initialWorkout?.id ?: UUID.randomUUID().toString(),
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
    }
        
        // Fixed Tools Row at the top
        Card(
            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
            shape = RoundedCornerShape(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(4.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                ToolButton("ÉCHAUF", Icons.Default.Waves, Color(0xFF60A5FA), Modifier.weight(1f)) {
                    steps = steps + WorkoutStep(type = "WARMUP", durationType = "TIME", durationValue = 600.0, targetType = "HR_ZONE", targetValue = "Z1")
                }
                ToolButton("RUN", Icons.Default.DirectionsRun, Color(0xFF22C55E), Modifier.weight(1f)) {
                    steps = steps + WorkoutStep(type = "RUN", durationType = "DISTANCE", durationValue = 1000.0, targetType = "PACE", targetValue = "5:00")
                }
                ToolButton("RÉCUP", Icons.Default.SelfImprovement, Color(0xFFF59E0B), Modifier.weight(1f)) {
                    steps = steps + WorkoutStep(type = "REST", durationType = "TIME", durationValue = 120.0, targetType = "NONE", targetValue = "")
                }
                ToolButton("COOL", Icons.Default.AcUnit, Color(0xFF3B82F6), Modifier.weight(1f)) {
                    steps = steps + WorkoutStep(type = "COOL", durationType = "TIME", durationValue = 300.0, targetType = "HR_ZONE", targetValue = "Z1")
                }
                ToolButton("RÉPÉT.", Icons.Default.Repeat, Color(0xFFEC4899), Modifier.weight(1f)) {
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
                ToolButton("RENFO", Icons.Default.FitnessCenter, Color(0xFF8B5CF6), Modifier.weight(1f)) {
                    steps = steps + WorkoutStep(type = "PPG", durationType = "REPS", durationValue = 20.0, targetType = "NONE", targetValue = "Squats")
                }
            }
        }

        
        // Steps List
        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(12.dp) // Normal vertical spacing
        ) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedTextField(
                            value = workoutName,
                            onValueChange = { workoutName = it },
                            label = { Text("Nom de la séance") },
                            modifier = Modifier.fillMaxWidth().height(56.dp),
                            shape = RoundedCornerShape(12.dp),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = workoutDesc,
                            onValueChange = { workoutDesc = it },
                            label = { Text("Description (optionnel)") },
                            modifier = Modifier.fillMaxWidth().height(56.dp),
                            shape = RoundedCornerShape(12.dp),
                            singleLine = true
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
            }

            if (steps.isEmpty()) {
                item {
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
                }
            }
            
            itemsIndexed(steps) { index, step ->
                if (step.type == "INTERVAL_BLOCK") {
                    BlockCard(
                        step = step,
                        index = index,
                        totalSteps = steps.size,
                        onUpdate = { updatedStep ->
                            steps = steps.toMutableList().also { it[index] = updatedStep }
                        },
                        onRemove = {
                            steps = steps.toMutableList().also { it.removeAt(index) }
                        },
                        onMoveUp = {
                            if (index > 0) {
                                val list = steps.toMutableList()
                                java.util.Collections.swap(list, index, index - 1)
                                steps = list
                            }
                        },
                        onMoveDown = {
                             if (index < steps.size - 1) {
                                val list = steps.toMutableList()
                                java.util.Collections.swap(list, index, index + 1)
                                steps = list
                            }
                        },
                        onEditSubStep = { subIndex, subStep -> 
                            editingSubStep = Triple(index, subIndex, subStep)
                        }
                    )
                } else {
                    StepCard(
                        step = step,
                        index = index,
                        totalSteps = steps.size,
                        onClick = { editingStep = index to step },
                        onRemove = { steps = steps.toMutableList().also { it.removeAt(index) } },
                        onMoveUp = {
                             if (index > 0) {
                                val list = steps.toMutableList()
                                java.util.Collections.swap(list, index, index - 1)
                                steps = list
                            }
                        },
                        onMoveDown = {
                             if (index < steps.size - 1) {
                                val list = steps.toMutableList()
                                java.util.Collections.swap(list, index, index + 1)
                                steps = list
                            }
                        }
                    )
                }
            }
        }
        
    // Editor Dialogs
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
    
    editingSubStep?.let { (blockIndex, subIndex, subStep) ->
         WorkoutStepEditorDialog(
            step = subStep,
            onDismiss = { editingSubStep = null },
            onSave = { newStep ->
                val block = steps[blockIndex]
                val newSubSteps = block.steps.toMutableList()
                newSubSteps[subIndex] = newStep
                steps = steps.toMutableList().also { it[blockIndex] = block.copy(steps = newSubSteps) }
                editingSubStep = null
            }
        )
    }
}
}

@Composable
fun StepCard(
    step: WorkoutStep,
    index: Int,
    totalSteps: Int,
    onClick: () -> Unit,
    onRemove: () -> Unit,
    onMoveUp: () -> Unit,
    onMoveDown: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Reorder Controls
            Column {
                IconButton(onClick = onMoveUp, enabled = index > 0, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.KeyboardArrowUp, contentDescription = "Up", modifier = Modifier.size(24.dp), tint = if (index > 0) Color.Gray else Color.Transparent)
                }
                IconButton(onClick = onMoveDown, enabled = index < totalSteps - 1, modifier = Modifier.size(32.dp)) {
                     Icon(Icons.Default.KeyboardArrowDown, contentDescription = "Down", modifier = Modifier.size(24.dp), tint = if (index < totalSteps - 1) Color.Gray else Color.Transparent)
                }
            }
            
            Spacer(modifier = Modifier.width(12.dp))
            
            // Icon
            Box(
                modifier = Modifier
                    .size(56.dp) // Normal size
                    .clip(RoundedCornerShape(14.dp))
                    .background(getColorForStep(step.type).copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    getIconForStep(step.type),
                    contentDescription = null,
                    tint = getColorForStep(step.type),
                    modifier = Modifier.size(28.dp) // Normal size
                )
            }
            
            Spacer(modifier = Modifier.width(20.dp))
            
            // Content
            Column(modifier = Modifier.weight(1f)) {
                 Text(
                    if (step.type == "PPG") "PPG: ${step.targetValue}" else getStepTypeLabel(step.type),
                    style = MaterialTheme.typography.titleMedium, // Normal Title
                    fontWeight = FontWeight.Black,
                    color = if (step.type == "PPG") Color(0xFFE040FB) else MaterialTheme.colorScheme.onSurface
                )
                Text(
                    formatStepDuration(step),
                    style = MaterialTheme.typography.bodyLarge, // Normal Body
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                )
                if (step.targetValue.isNotBlank() && step.type != "PPG") {
                      Surface(
                          color = getColorForStep(step.type).copy(alpha = 0.1f),
                          shape = RoundedCornerShape(4.dp),
                          modifier = Modifier.padding(top = 4.dp)
                      ) {
                        Text(
                            "${step.targetType}: ${step.targetValue}",
                            style = MaterialTheme.typography.labelMedium, // Normal Badge
                            fontWeight = FontWeight.Bold,
                            color = getColorForStep(step.type),
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                        )
                      }
                }
            }
            
            IconButton(onClick = onRemove, modifier = Modifier.size(40.dp)) {
                Icon(Icons.Default.Delete, contentDescription = "Supprimer", tint = MaterialTheme.colorScheme.error.copy(alpha=0.7f), modifier = Modifier.size(24.dp))
            }
        }
    }
}

@Composable
fun BlockCard(
    step: WorkoutStep,
    index: Int,
    totalSteps: Int,
    onUpdate: (WorkoutStep) -> Unit,
    onRemove: () -> Unit,
    onMoveUp: () -> Unit,
    onMoveDown: () -> Unit,
    onEditSubStep: (Int, WorkoutStep) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFEC4899).copy(alpha = 0.05f)),
        border = BorderStroke(1.dp, Color(0xFFEC4899).copy(alpha = 0.2f)),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            // Header
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column {
                    IconButton(onClick = onMoveUp, enabled = index > 0, modifier = Modifier.size(24.dp)) {
                        Icon(Icons.Default.KeyboardArrowUp, contentDescription = "Up", tint = if (index > 0) Color.Gray else Color.Transparent)
                    }
                    IconButton(onClick = onMoveDown, enabled = index < totalSteps - 1, modifier = Modifier.size(24.dp)) {
                         Icon(Icons.Default.KeyboardArrowDown, contentDescription = "Down", tint = if (index < totalSteps - 1) Color.Gray else Color.Transparent)
                    }
                }
                
                Spacer(modifier = Modifier.width(8.dp))
                
                Text(
                    "${step.repeatCount} SÉRIES", 
                    style = MaterialTheme.typography.titleMedium, // Normal Block Header
                    fontWeight = FontWeight.Black,
                    color = Color(0xFFEC4899)
                )
                
                Spacer(modifier = Modifier.weight(1f))
            
                // Actions on block
                IconButton(onClick = { 
                    // Edit repetition count via simple dialog or cycle? 
                    // Let's increment/decrement for simplicity or open a small dialog?
                    // Implementation choice: Open custom dialog for block
                    // For now, let's just use Up/Down arrows for reps if space allows or separate editing
                }) {
                   // Icon(Icons.Default.Edit, contentDescription = "Edit Reps", tint = Color(0xFFEC4899))
                }
                
                // Reps control
                IconButton(onClick = { if (step.repeatCount > 1) onUpdate(step.copy(repeatCount = step.repeatCount - 1)) }) {
                    Icon(Icons.Default.RemoveCircleOutline, contentDescription = null, tint = Color(0xFFEC4899))
                }
                Text("${step.repeatCount}", fontWeight = FontWeight.Bold)
                IconButton(onClick = { onUpdate(step.copy(repeatCount = step.repeatCount + 1)) }) {
                    Icon(Icons.Default.AddCircleOutline, contentDescription = null, tint = Color(0xFFEC4899))
                }
                
                IconButton(onClick = onRemove) {
                    Icon(Icons.Default.Close, contentDescription = "Supprimer", tint = MaterialTheme.colorScheme.error)
                }
            }
            
            Divider(color = Color(0xFFEC4899).copy(alpha = 0.1f), modifier = Modifier.padding(vertical = 8.dp))
            
            // Nested Steps
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                step.steps.forEachIndexed { subIndex, subStep ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onEditSubStep(subIndex, subStep) },
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            val label = if (subStep.type == "PPG") "PPG: ${subStep.targetValue}" else getStepTypeLabel(subStep.type)
                            Text("$label • ${formatStepDuration(subStep)}", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = if (subStep.type == "PPG") Color(0xFFE040FB) else MaterialTheme.colorScheme.onSurface, modifier = Modifier.weight(1f))
                             if (subStep.targetValue.isNotBlank()) {
                                 Text("@ ${subStep.targetValue}", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = getColorForStep(subStep.type).copy(alpha = 0.8f))
                             }
                             Spacer(modifier = Modifier.width(12.dp))
                             IconButton(onClick = {
                                 val newSubList = step.steps.toMutableList()
                                 newSubList.removeAt(subIndex)
                                 onUpdate(step.copy(steps = newSubList))
                             }, modifier = Modifier.size(24.dp)) {
                                 Icon(Icons.Default.Close, contentDescription = null, tint = Color.Red.copy(alpha = 0.5f), modifier = Modifier.size(20.dp))
                             }
                        }
                    }
                }
                
                // Add SubStep Buttons
                Row(modifier = Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                    Text("Ajouter : ", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                    IconButton(onClick = {
                        val newSubList = step.steps.toMutableList()
                        newSubList.add(WorkoutStep(type = "RUN", durationType = "DISTANCE", durationValue = 400.0, targetType = "PACE", targetValue = "4:00"))
                        onUpdate(step.copy(steps = newSubList))
                    }) {
                        Box(Modifier.clip(RoundedCornerShape(4.dp)).background(Color(0xFF22C55E).copy(alpha = 0.1f)).padding(4.dp)) {
                            Icon(Icons.Default.DirectionsRun, contentDescription = null, tint = Color(0xFF22C55E), modifier = Modifier.size(16.dp))
                        }
                    }
                     IconButton(onClick = {
                        val newSubList = step.steps.toMutableList()
                        newSubList.add(WorkoutStep(type = "REST", durationType = "TIME", durationValue = 60.0, targetType = "NONE", targetValue = ""))
                        onUpdate(step.copy(steps = newSubList))
                    }) {
                        Box(Modifier.clip(RoundedCornerShape(4.dp)).background(Color(0xFFF59E0B).copy(alpha = 0.1f)).padding(4.dp)) {
                            Icon(Icons.Default.SelfImprovement, contentDescription = null, tint = Color(0xFFF59E0B), modifier = Modifier.size(16.dp))
                        }
                    }
                    IconButton(onClick = {
                        val newSubList = step.steps.toMutableList()
                        newSubList.add(WorkoutStep(type = "PPG", durationType = "REPS", durationValue = 15.0, targetType = "NONE", targetValue = "Exercice"))
                        onUpdate(step.copy(steps = newSubList))
                    }) {
                        Box(Modifier.clip(RoundedCornerShape(4.dp)).background(Color(0xFF8B5CF6).copy(alpha = 0.1f)).padding(4.dp)) {
                            Icon(Icons.Default.FitnessCenter, contentDescription = null, tint = Color(0xFF8B5CF6), modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }
        }
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
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.horizontalScroll(rememberScrollState())) {
                    listOf("WARMUP" to "Échauf", "RUN" to "Run", "REST" to "Récup", "PPG" to "Renfo", "COOL" to "Cool").forEach { (type, label) ->
                        FilterChip(
                            selected = stepType == type,
                            onClick = { 
                                stepType = type
                                // Reset defaults based on type
                                if (type == "PPG") {
                                    durationType = "REPS"
                                    durationValue = "10"
                                    targetType = "NONE"
                                    targetValue = ""
                                } else if (type == "REST" || type == "COOL") {
                                    durationType = "TIME"
                                    targetType = "NONE" 
                                    targetValue = ""
                                } else {
                                    // RUN / WARMUP
                                    if (durationType == "REPS") durationType = "DISTANCE"
                                    if (targetType == "NONE") targetType = "PACE"
                                }
                            },
                            label = { Text(label, fontSize = 12.sp) }
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(4.dp))
                
                // Distance, Durée ou REPS
                Text("Durée / Répétitions", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    if (stepType == "PPG") {
                        FilterChip(
                            selected = durationType == "REPS",
                            onClick = { durationType = "REPS" },
                            label = { Text("Reps", fontSize = 12.sp) }
                        )
                        FilterChip(
                            selected = durationType == "TIME",
                            onClick = { durationType = "TIME" },
                            label = { Text("Temps", fontSize = 12.sp) }
                        )
                    } else {
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
                }
                OutlinedTextField(
                    value = durationValue,
                    onValueChange = { durationValue = it.filter { c -> c.isDigit() } },
                    label = { Text(when(durationType) { "DISTANCE" -> "Mètres"; "TIME" -> "Secondes"; else -> "Répétitions" }) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                
                Spacer(modifier = Modifier.height(4.dp))
                
                if (stepType == "PPG") {
                     // Nom de l'exercice pour PPG
                    Text("Exercice", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    OutlinedTextField(
                        value = targetValue,
                        onValueChange = { targetValue = it },
                        label = { Text("Nom de l'exercice") },
                        placeholder = { Text("Ex: Squats, Gainage...") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                } else {
                    // Type de Cible (Classique)
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
                } // End if not PPG

                // Repeat Count (Only if it's an Interval Block or we want to allow repeats on steps?)
                // Actually, let's only dynamic show it if type is INTERVAL_BLOCK (though dialog usually handles steps)
                if (step.type == "INTERVAL_BLOCK") {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Nombre de Séries", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    var repsStr by remember { mutableStateOf(step.repeatCount.toString()) }
                    OutlinedTextField(
                        value = repsStr,
                        onValueChange = { 
                            repsStr = it.filter { c -> c.isDigit() }
                            editedStep = editedStep.copy(repeatCount = repsStr.toIntOrNull() ?: 1)
                        },
                        label = { Text("Nombre de répétitions") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            }
        },
        confirmButton = {
            Button(onClick = {
                val newStep = editedStep.copy(
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
fun ToolButton(label: String, icon: androidx.compose.ui.graphics.vector.ImageVector, color: Color, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally, 
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 12.dp, horizontal = 4.dp)
    ) {
        Box(
            modifier = Modifier.size(44.dp).clip(RoundedCornerShape(14.dp)).background(color),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = null, tint = Color.White)
        }
        Text(
            text = label, 
            style = MaterialTheme.typography.labelSmall, 
            fontSize = 9.sp, 
            fontWeight = FontWeight.Black, 
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
            modifier = Modifier.padding(top = 6.dp)
        )
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
    "PPG" -> Color(0xFFE040FB) // More distinct Pink/Purple for PPG
    else -> Color.Gray
}

fun getIconForStep(type: String): androidx.compose.ui.graphics.vector.ImageVector = when(type) {
    "WARMUP" -> Icons.Default.Waves
    "RUN" -> Icons.Default.DirectionsRun
    "REST" -> Icons.Default.SelfImprovement
    "COOL" -> Icons.Default.AcUnit
    "PPG" -> Icons.Default.FitnessCenter
    else -> Icons.Default.Circle
}

fun getStepTypeLabel(type: String): String = when(type) {
    "WARMUP" -> "Échauffement"
    "RUN" -> "Course"
    "REST" -> "Récupération"
    "COOL" -> "Retour au calme"
    "INTERVAL_BLOCK" -> "Répétitions"
    "PPG" -> "Renforcement"
    else -> type
}

fun formatStepDuration(step: WorkoutStep): String {
    if (step.durationType == "REPS") {
        return "${step.durationValue.toInt()} reps"
    } else if (step.durationType == "DISTANCE") {
        return "${step.durationValue.toInt()}m"
    } else {
        return formatDuration(step.durationValue.toInt())
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
