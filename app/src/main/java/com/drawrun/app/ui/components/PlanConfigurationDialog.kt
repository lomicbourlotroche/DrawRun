package com.drawrun.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlanConfigurationDialog(
    initialDistance: Double = 10000.0,
    initialDurationSeconds: Int = 3000, // 50 min
    insights: com.drawrun.app.logic.ActivityAnalyzer.ActivityInsights,
    onDismiss: () -> Unit,
    onGenerate: (distance: Double, timeH: Int, timeM: Int, timeS: Int, startDate: LocalDate) -> Unit
) {
    var selectedDistance by remember { mutableStateOf(initialDistance / 1000.0) } // stored in km for UI logic
    
    // Auto-fill logic based on insights
    var targetH by remember { mutableStateOf((initialDurationSeconds / 3600).toString()) }
    var targetM by remember { mutableStateOf(((initialDurationSeconds % 3600) / 60).toString()) }
    var targetS by remember { mutableStateOf((initialDurationSeconds % 60).toString()) }
    
    // Update target if user selects a different distance
    LaunchedEffect(selectedDistance) {
        val distMetres = selectedDistance * 1000
        val bestPerf = insights.bestTimes[distMetres]
        if (bestPerf != null) {
            // Propose slightly better than PB (e.g. 2% better)
            val improvedSeconds = (bestPerf.timeSeconds * 0.98).toInt()
            targetH = (improvedSeconds / 3600).toString()
            targetM = ((improvedSeconds % 3600) / 60).toString()
            targetS = (improvedSeconds % 60).toString()
        }
    }

    var showDatePicker by remember { mutableStateOf(false) }
    var startDate by remember { mutableStateOf(LocalDate.now()) }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = MaterialTheme.colorScheme.surface,
            modifier = Modifier.fillMaxWidth().padding(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(24.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("NOUVEAU PLAN", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, null)
                    }
                }

                // 1. Race Distance Selection
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("DISTANCE CIBLE", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf(5.0 to "5K", 10.0 to "10K", 21.1 to "SEMI", 42.195 to "MARATHON").forEach { (dist, label) ->
                            val selected = selectedDistance == dist
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant)
                                    .clickable { selectedDistance = dist }
                                    .padding(vertical = 12.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = label,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = if (selected) Color.White else MaterialTheme.colorScheme.onSurface,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }

                // 2. Target Time
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("OBJECTIF CHRONO", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = targetH,
                            onValueChange = { if (it.length <= 1) targetH = it.filter { c -> c.isDigit() } },
                            label = { Text("H") },
                            modifier = Modifier.weight(1f),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true
                        )
                        Text(":", fontWeight = FontWeight.Bold)
                        OutlinedTextField(
                            value = targetM,
                            onValueChange = { if (it.length <= 2) targetM = it.filter { c -> c.isDigit() } },
                            label = { Text("MIN") },
                            modifier = Modifier.weight(1f),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true
                        )
                        Text(":", fontWeight = FontWeight.Bold)
                        OutlinedTextField(
                            value = targetS,
                            onValueChange = { if (it.length <= 2) targetS = it.filter { c -> c.isDigit() } },
                            label = { Text("SEC") },
                            modifier = Modifier.weight(1f),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            singleLine = true
                        )
                    }
                }

                // 3. Start Date Picker
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("DATE DE DÉBUT", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .border(1.dp, MaterialTheme.colorScheme.outline.copy(alpha=0.5f), RoundedCornerShape(12.dp))
                            .clickable { showDatePicker = true }
                            .padding(16.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                             Text(
                                text = startDate.format(DateTimeFormatter.ofPattern("dd MMMM yyyy")),
                                style = MaterialTheme.typography.bodyLarge
                             )
                             Icon(Icons.Default.CalendarToday, null, tint = MaterialTheme.colorScheme.primary)
                        }
                    }
                    
                    if (showDatePicker) {
                         val datePickerState = rememberDatePickerState(
                             initialSelectedDateMillis = startDate.atStartOfDay(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli()
                         )
                         
                         DatePickerDialog(
                             onDismissRequest = { showDatePicker = false },
                             confirmButton = {
                                 TextButton(onClick = {
                                     datePickerState.selectedDateMillis?.let { millis ->
                                         startDate = java.time.Instant.ofEpochMilli(millis).atZone(java.time.ZoneId.systemDefault()).toLocalDate()
                                     }
                                     showDatePicker = false
                                 }) { Text("OK") }
                             },
                             dismissButton = {
                                 TextButton(onClick = { showDatePicker = false }) { Text("Annuler") }
                             }
                         ) {
                             DatePicker(state = datePickerState)
                         }
                    }
                }

                // Action Button
                Button(
                    onClick = { 
                        onGenerate(
                            selectedDistance * 1000, 
                            targetH.toIntOrNull() ?: 0, 
                            targetM.toIntOrNull() ?: 0, 
                            targetS.toIntOrNull() ?: 0, 
                            startDate
                        ) 
                    },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Icon(Icons.Default.AutoAwesome, null, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("GÉNÉRER LE PLAN", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
