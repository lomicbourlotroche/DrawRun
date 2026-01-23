package com.drawrun.app.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.foundation.text.KeyboardOptions
import com.drawrun.app.*
import com.drawrun.app.ui.components.*
import com.drawrun.app.logic.TrainingPlanGenerator
import com.drawrun.app.logic.PerformanceAnalyzer
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle as JavaTextStyle
import java.util.Locale
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items

/**
 * Composable for displaying a single day as a detailed flashcard
 */
@Composable
fun DayFlashcard(
    day: TrainingPlanGenerator.DayPlan,
    weekNum: Int,
    dayIndex: Int,
    state: AppState,
    modifier: Modifier = Modifier
) {
    val completionKey = "week${weekNum - 1}_day$dayIndex"
    val completion = state.workoutCompletions[completionKey]
    
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = when(completion?.status) {
                CompletionStatus.COMPLETED -> Color(0xFF22C55E).copy(alpha = 0.08f)
                CompletionStatus.PARTIAL -> Color(0xFFF59E0B).copy(alpha = 0.08f)
                CompletionStatus.SKIPPED -> Color(0xFFEF4444).copy(alpha = 0.08f)
                else -> MaterialTheme.colorScheme.surface
            }
        ),
        border = BorderStroke(
            1.dp,
            if (day.isQuality) MaterialTheme.colorScheme.primary.copy(alpha = 0.3f)
            else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Header with date and type badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = day.date.format(
                            DateTimeFormatter.ofPattern("EEEE d MMMM", Locale.FRENCH)
                        ).replaceFirstChar { it.uppercase() },
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = day.name,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                    )
                }
                
                // Type badge
                Surface(
                    color = when(day.type) {
                        "E" -> Color(0xFF10B981).copy(alpha = 0.15f)
                        "M" -> Color(0xFF3B82F6).copy(alpha = 0.15f)
                        "T" -> Color(0xFFF59E0B).copy(alpha = 0.15f)
                        "I", "R" -> Color(0xFFA855F7).copy(alpha = 0.15f)
                        else -> MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f)
                    },
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = day.type,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Black,
                        color = when(day.type) {
                            "E" -> Color(0xFF10B981)
                            "M" -> Color(0xFF3B82F6)
                            "T" -> Color(0xFFF59E0B)
                            "I", "R" -> Color(0xFFA855F7)
                            else -> MaterialTheme.colorScheme.onSurface
                        }
                    )
                }
            }
            
            // Title
            Text(
                text = day.title,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Black
            )
            
            // Metrics row
            if (day.dist > 0) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Distance
                    Surface(
                        modifier = Modifier.weight(1f),
                        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.Route,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(20.dp)
                            )
                            Column {
                                Text(
                                    text = "${"%.1f".format(day.dist)} km",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Distance",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                    fontSize = 10.sp
                                )
                            }
                        }
                    }
                    
                    // Target pace
                    Surface(
                        modifier = Modifier.weight(1f),
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.Speed,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                modifier = Modifier.size(20.dp)
                            )
                            Column {
                                Text(
                                    text = day.target,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Allure",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                                    fontSize = 10.sp
                                )
                            }
                        }
                    }
                }
            }
            
            // Workout details
            if (day.details.isNotEmpty()) {
                Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f))
                
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    day.details.forEach { detail ->
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.Top
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .offset(y = 6.dp)
                                    .background(
                                        if (detail.highlight) MaterialTheme.colorScheme.primary
                                        else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f),
                                        CircleShape
                                    )
                            )
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = detail.label,
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                )
                                Text(
                                    text = detail.content,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = if (detail.highlight) MaterialTheme.colorScheme.primary
                                           else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                                )
                            }
                        }
                    }
                }
            }
            
            // Completion status & Linking
            Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f))
            
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                // Status Text / Icon
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (completion != null) {
                        Icon(
                            imageVector = when(completion.status) {
                                CompletionStatus.COMPLETED -> Icons.Default.CheckCircle
                                CompletionStatus.PARTIAL -> Icons.Default.Warning
                                CompletionStatus.SKIPPED -> Icons.Default.Cancel
                                else -> Icons.Default.RadioButtonUnchecked
                            },
                            contentDescription = null,
                            tint = when(completion.status) {
                                CompletionStatus.COMPLETED -> Color(0xFF22C55E)
                                CompletionStatus.PARTIAL -> Color(0xFFF59E0B)
                                CompletionStatus.SKIPPED -> Color(0xFFEF4444)
                                else -> MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f)
                            },
                            modifier = Modifier.size(20.dp)
                        )
                        Text(
                            text = when(completion.status) {
                                CompletionStatus.COMPLETED -> "Complété"
                                CompletionStatus.PARTIAL -> "Partiel"
                                CompletionStatus.SKIPPED -> "Sauté"
                                else -> "À venir"
                            },
                            style = MaterialTheme.typography.bodySmall,
                            fontWeight = FontWeight.Medium
                        )
                    } else {
                        Text(
                            text = "Non réalisé",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                    }
                }

                // Action Buttons (Link / Unlink)
                var showLinkingDialog by remember { mutableStateOf(false) }

                if (completion == null) {
                    Button(
                        onClick = { showLinkingDialog = true },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                            contentColor = MaterialTheme.colorScheme.primary
                        ),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.height(32.dp)
                    ) {
                        Icon(Icons.Default.Link, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("LIER", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                } else {
                     IconButton(
                        onClick = {
                            val map = state.workoutCompletions.toMutableMap()
                            map.remove(completionKey)
                            state.workoutCompletions = map
                        },
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(Icons.Default.LinkOff, contentDescription = "Délier", tint = Color.Gray, modifier = Modifier.size(16.dp))
                    }
                }

                if (showLinkingDialog) {
                    LinkingDialog(
                        activities = state.activities.sortedByDescending { it.date }, // Recent first
                        onActivitySelected = { activity ->
                            // Create link
                            val newCompletion = WorkoutCompletion(
                                planWeek = weekNum,
                                planDay = dayIndex,
                                plannedDate = day.date.toString(),
                                completedDate = activity.date,
                                actualActivity = activity,
                                status = CompletionStatus.COMPLETED, // Logic customizable
                                completionScore = 100 // Logic customizable
                            )
                            val map = state.workoutCompletions.toMutableMap()
                            map[completionKey] = newCompletion
                            state.workoutCompletions = map
                            showLinkingDialog = false
                        },
                        onDismiss = { showLinkingDialog = false }
                    )
                }
            }
        }
    }
}

@Composable
fun LinkingDialog(
    activities: List<ActivityItem>,
    onActivitySelected: (ActivityItem) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Lier une activité", fontWeight = FontWeight.Bold) },
        text = {
            if (activities.isEmpty()) {
                Text("Aucune activité récente trouvée.", color = Color.Gray)
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.heightIn(max = 300.dp)
                ) {
                    items(activities) { activity ->
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onActivitySelected(activity) },
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Icon(activity.icon, contentDescription = null, tint = activity.color)
                                Column {
                                    Text(activity.title, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium)
                                    Text("${activity.date} • ${activity.dist}", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                                }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("Annuler") }
        }
    )
}

/**
 * Composable for displaying future weeks in a dropdown/expandable format
 */
@Composable
fun FutureWeeksDropdown(
    weeks: List<TrainingPlanGenerator.WeekPlan>,
    state: AppState,
    modifier: Modifier = Modifier
) {
    var expandedWeek by remember { mutableStateOf<Int?>(null) }
    
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            text = "SEMAINES À VENIR",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Black,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
            letterSpacing = 1.sp
        )
        
        weeks.forEachIndexed { index, week ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { 
                        expandedWeek = if (expandedWeek == index) null else index 
                    },
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                ),
                border = if (week.isDecharge) 
                    BorderStroke(2.dp, Color(0xFF10B981))
                else 
                    BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f)),
                elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    // Week header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = "Semaine ${week.weekNum}",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                if (week.isDecharge) {
                                    Surface(
                                        color = Color(0xFF10B981).copy(alpha = 0.15f),
                                        shape = RoundedCornerShape(6.dp)
                                    ) {
                                        Text(
                                            text = "DÉCHARGE",
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.Bold,
                                            color = Color(0xFF10B981),
                                            fontSize = 9.sp
                                        )
                                    }
                                }
                            }
                            Text(
                                text = "${"%.1f".format(week.km)}km • ${week.days.count { it.dist > 0 }} séances",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                            )
                        }
                        
                        Icon(
                            imageVector = if (expandedWeek == index) 
                                Icons.Default.ExpandLess 
                            else 
                                Icons.Default.ExpandMore,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                        )
                    }
                    
                    // Expanded details
                    AnimatedVisibility(visible = expandedWeek == index) {
                        Column(
                            modifier = Modifier.padding(top = 12.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f))
                            
                            week.days.forEach { day ->
                                if (day.dist > 0) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(vertical = 4.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(
                                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Surface(
                                                color = when(day.type) {
                                                    "E" -> Color(0xFF10B981).copy(alpha = 0.15f)
                                                    "M" -> Color(0xFF3B82F6).copy(alpha = 0.15f)
                                                    "T" -> Color(0xFFF59E0B).copy(alpha = 0.15f)
                                                    "I", "R" -> Color(0xFFA855F7).copy(alpha = 0.15f)
                                                    else -> MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f)
                                                },
                                                shape = RoundedCornerShape(6.dp)
                                            ) {
                                                Text(
                                                    text = day.type,
                                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                                    style = MaterialTheme.typography.labelSmall,
                                                    fontWeight = FontWeight.Bold,
                                                    fontSize = 10.sp,
                                                    color = when(day.type) {
                                                        "E" -> Color(0xFF10B981)
                                                        "M" -> Color(0xFF3B82F6)
                                                        "T" -> Color(0xFFF59E0B)
                                                        "I", "R" -> Color(0xFFA855F7)
                                                        else -> MaterialTheme.colorScheme.onSurface
                                                    }
                                                )
                                            }
                                            Text(
                                                text = day.date.format(
                                                    DateTimeFormatter.ofPattern("EEE d", Locale.FRENCH)
                                                ),
                                                style = MaterialTheme.typography.bodySmall,
                                                fontWeight = FontWeight.Medium
                                            )
                                        }
                                        Text(
                                            text = "${"%.1f".format(day.dist)}km • ${day.target}",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
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
}
