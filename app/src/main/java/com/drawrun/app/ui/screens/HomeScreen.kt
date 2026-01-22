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
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.graphics.vector.ImageVector
import com.drawrun.app.AppState
import com.drawrun.app.ui.components.StatCard
import com.drawrun.app.logic.CoachAI
import com.drawrun.app.logic.PerformanceAnalyzer
import com.drawrun.app.PmcDataPoint
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.ui.input.pointer.pointerInput
import kotlin.math.abs
import kotlin.math.roundToInt
import kotlin.math.abs
import kotlin.math.roundToInt

@Composable
fun HomeScreen(state: AppState) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        // Readiness Card
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(40.dp))
                .background(MaterialTheme.colorScheme.surface)
                .border(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), RoundedCornerShape(40.dp))
                .padding(24.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(24.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "DISPONIBILITÉ",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                        letterSpacing = 2.sp
                    )
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(4.dp))
                            .background(Color(0xFF22C55E).copy(alpha = 0.1f))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "OPTIMAL",
                            style = MaterialTheme.typography.labelSmall,
                            color = Color(0xFF22C55E),
                            fontSize = 9.sp
                        )
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(24.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Gauge
                    Box(
                        modifier = Modifier
                            .size(128.dp)
                            .clickable {
                                state.explanationTitle = "Score de Disponibilité"
                                state.explanationContent = "Calculé à partir du sommeil, du HRV et de la charge d'entraînement récente. Un score élevé indique un état optimal pour la performance."
                                state.showExplanation = true
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        val primaryColor = MaterialTheme.colorScheme.primary
                        val strokeColor = Color(0xFF2C2C2E).copy(alpha = if (state.appTheme == com.drawrun.app.ui.theme.AppTheme.LIGHT) 0.1f else 1f)
                        Canvas(modifier = Modifier.fillMaxSize()) {
                            drawCircle(
                                color = strokeColor,
                                radius = size.minDimension / 2 - 6.dp.toPx(),
                                style = Stroke(width = 12.dp.toPx())
                            )
                            drawArc(
                                color = primaryColor,
                                startAngle = -90f,
                                sweepAngle = 351f * (85f/100f),
                                useCenter = false,
                                style = Stroke(width = 12.dp.toPx(), cap = StrokeCap.Round)
                            )
                        }
                        Text(
                            text = state.readiness,
                            style = MaterialTheme.typography.displayLarge,
                            fontSize = 32.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }

                    // HRV Stats
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        StatCard(
                            title = "VRC / HRV",
                            value = state.hrv,
                            unit = "ms",
                            modifier = Modifier.height(64.dp),
                            onClick = {
                                state.explanationTitle = "HRV (Variabilité Cardiaque)"
                                state.explanationContent = "Indicateur de la récupération du système nerveux. Plus elle est élevée par rapport à votre moyenne, plus vous êtes prêt à encaisser une séance intense."
                                state.showExplanation = true
                            }
                        )
                        StatCard(
                            title = "Sommeil",
                            value = state.sleepScore,
                            unit = "/100",
                            modifier = Modifier.height(64.dp),
                            onClick = {
                                state.explanationTitle = "Score de Sommeil"
                                state.explanationContent = "Qualité de votre récupération nocturne. Un score élevé favorise la reconstruction musculaire et mentale."
                                state.showExplanation = true
                            }
                        )
                    }
                }
            }
        }

        // Daily Training Section
        DailyTrainingSection(state)

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(128.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            StatCard(
                title = "Forme (CTL)",
                value = state.ctl,
                unit = "pts",
                icon = Icons.Default.TrendingUp,
                modifier = Modifier.weight(1f),
                onClick = {
                    state.explanationTitle = "CTL (Chronic Training Load)"
                    state.explanationContent = "Représente votre condition physique à long terme (moyenne pondérée sur 42 jours). C'est votre 'réservoir' de forme."
                    state.showExplanation = true
                }
            )
            StatCard(
                title = "Balance (TSB)",
                value = state.tsb,
                unit = "pts",
                color = if ((state.tsb.toIntOrNull() ?: 0) >= 0) Color(0xFF22C55E) else Color(0xFFEF4444),
                icon = Icons.Default.History,
                modifier = Modifier.weight(1f),
                onClick = {
                    state.explanationTitle = "TSB (Training Stress Balance)"
                    state.explanationContent = "Différence entre la forme et la fatigue. Un score positif indique une fraîcheur physique, idéal avant une compétition."
                    state.showExplanation = true
                }
            )
        }

        // Banister Chart (PMC)
        if (state.banisterPmcData.isNotEmpty()) {
            PmcChart(state.banisterPmcData)
        }

        // Recent Activity
        val lastAct = state.activities.firstOrNull()
        if (lastAct != null) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(220.dp)
                    .clip(RoundedCornerShape(32.dp))
                    .background(MaterialTheme.colorScheme.surface)
                    .border(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), RoundedCornerShape(32.dp))
                    .clickable { state.selectedActivity = lastAct }
            ) {
                // Background (Map Placeholder)
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color(0xFF2C2C2E)) // Always dark map background for contrast
                ) {
                   if (lastAct.mapPolyline != null) {
                       Canvas(modifier = Modifier.fillMaxSize()) {
                           val path = androidx.compose.ui.graphics.Path()
                           // Dynamic visual for route
                           val w = size.width
                           val h = size.height
                           path.moveTo(w * 0.2f, h * 0.7f)
                           path.cubicTo(w * 0.4f, h * 0.3f, w * 0.6f, h * 0.8f, w * 0.8f, h * 0.4f)
                           drawPath(path, color = lastAct.color, style = Stroke(width = 4.dp.toPx(), cap = StrokeCap.Round))
                       }
                   } else {
                       Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                           Icon(Icons.Default.Map, contentDescription = null, tint = Color.White.copy(alpha=0.1f), modifier = Modifier.size(64.dp))
                       }
                   }
                }

                // Glassmorphism Overlay
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .fillMaxWidth()
                        .background(
                            androidx.compose.ui.graphics.Brush.verticalGradient(
                                colors = listOf(Color.Transparent, Color.Black.copy(alpha = 0.9f)),
                                startY = 0f
                            )
                        )
                        .padding(24.dp)
                ) {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Header
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(lastAct.color)
                                        .padding(horizontal = 10.dp, vertical = 5.dp)
                                ) {
                                    Text(
                                        text = lastAct.type.uppercase(),
                                        color = Color.White,
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Black,
                                        letterSpacing = 1.sp
                                    )
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = lastAct.title,
                                    style = MaterialTheme.typography.headlineSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White,
                                    maxLines = 1
                                )
                                Text(
                                    text = lastAct.date,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Color.White.copy(alpha = 0.6f)
                                )
                            }
                            
                            // Activity Icon
                            Icon(
                                imageVector = lastAct.icon,
                                contentDescription = null,
                                tint = Color.White.copy(alpha = 0.8f),
                                modifier = Modifier.size(32.dp)
                            )
                        }

                        Divider(color = Color.White.copy(alpha = 0.15f))
                        
                        // Metrics Row
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            MetricItem("TEMPS", lastAct.duration, Icons.Default.Timer)
                            MetricItem("ALLURE", lastAct.pace, Icons.Default.Speed)
                            MetricItem("DISTANCE", lastAct.dist, Icons.Default.Place)
                        }
                    }
                }
            }
        } else {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(100.dp)
                    .clip(RoundedCornerShape(28.dp))
                    .background(MaterialTheme.colorScheme.surface)
                    .border(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), RoundedCornerShape(28.dp))
                    .padding(20.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "AUCUNE ACTIVITÉ RÉCENTE",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                )
            }
        }
    }
}

@Composable
fun MetricItem(label: String, value: String, icon: ImageVector) {
    Column(horizontalAlignment = Alignment.Start) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            Icon(imageVector = icon, contentDescription = null, tint = Color.White.copy(alpha = 0.5f), modifier = Modifier.size(12.dp))
            Text(text = label, style = MaterialTheme.typography.labelSmall, color = Color.White.copy(alpha = 0.5f), fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
        }
        Text(text = value, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Black, color = Color.White)
    }
}

@Composable
fun DailyTrainingSection(state: AppState) {
    // Memoize recommendation calculation - only recalculate when dependencies change
    val recommendation = remember(
        state.activities.size,
        state.readiness,
        state.vdot,
        state.generatedRunPlan.size,
        java.time.LocalDate.now().toString()
    ) {
        CoachAI.getDailyTraining(state)
    }
    
    // Color based on intensity
    val intensityColor = when(recommendation.intensityColor) {
        "red" -> Color(0xFFEF4444)
        "orange" -> Color(0xFFF59E0B)
        "purple" -> Color(0xFFA855F7)
        "blue" -> Color(0xFF3B82F6)
        else -> Color(0xFF10B981) // green
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
                                imageVector = when(recommendation.type) {
                                    "REST" -> Icons.Default.NightsStay
                                    "I", "R" -> Icons.Default.Bolt
                                    "T" -> Icons.Default.TrendingUp
                                    else -> Icons.Default.DirectionsRun
                                },
                                contentDescription = null,
                                tint = intensityColor,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                    Text(
                        text = if (recommendation.isFromPlan) "ENTRAÎNEMENT DU JOUR" else "SUGGESTION DU COACH",
                        style = MaterialTheme.typography.labelSmall,
                        color = intensityColor,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }
                
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (recommendation.duration > 0) {
                        Surface(
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                horizontalArrangement = Arrangement.spacedBy(4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Timer,
                                    contentDescription = null,
                                    modifier = Modifier.size(12.dp),
                                    tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                )
                                Text(
                                    text = "${recommendation.duration}'",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f),
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                    
                    if (recommendation.isFromPlan) {
                        Surface(
                            color = intensityColor,
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = "PLAN",
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                style = MaterialTheme.typography.labelSmall,
                                color = Color.White,
                                fontSize = 8.sp,
                                fontWeight = FontWeight.Black
                            )
                        }
                    }
                }
            }

            // Title and subtitle
            Column {
                Text(
                    text = recommendation.title,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Black
                )
                Text(
                    text = recommendation.subtitle,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
            }

            // Description
            if (recommendation.description.isNotBlank()) {
                Surface(
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = recommendation.description,
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(16.dp),
                        fontStyle = FontStyle.Italic
                    )
                }
            }

            // Weather Warning
            if (recommendation.weatherWarning != null) {
                Surface(
                    color = Color(0xFFF59E0B).copy(alpha = 0.1f),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Warning,
                            contentDescription = null,
                            tint = Color(0xFFF59E0B),
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = recommendation.weatherWarning,
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFFF59E0B)
                        )
                    }
                }
            }

            // Workout Structure
            if (recommendation.structure.isNotEmpty()) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "STRUCTURE",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                    recommendation.structure.forEach { step ->
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.Top
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .offset(y = 6.dp)
                                    .background(intensityColor, CircleShape)
                            )
                            Text(
                                text = step,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                            )
                        }
                    }
                }
            }

            // Paces and HR Zone
            if (recommendation.targetPace != null || recommendation.hrZone != null) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    if (recommendation.targetPace != null) {
                        Surface(
                            color = intensityColor.copy(alpha = 0.1f),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(
                                modifier = Modifier.padding(12.dp),
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text(
                                    text = "ALLURE CIBLE",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                                    fontSize = 9.sp,
                                    letterSpacing = 0.5.sp
                                )
                                Row(
                                    verticalAlignment = Alignment.Bottom,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Text(
                                        text = recommendation.targetPace,
                                        style = MaterialTheme.typography.titleLarge,
                                        fontWeight = FontWeight.Black,
                                        color = intensityColor
                                    )
                                    Text(
                                        text = "/km",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                                        modifier = Modifier.offset(y = (-2).dp)
                                    )
                                }
                            }
                        }
                    }
                    
                    if (recommendation.hrZone != null) {
                        Surface(
                            color = Color(0xFFEF4444).copy(alpha = 0.1f),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(
                                modifier = Modifier.padding(12.dp),
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text(
                                    text = "ZONE FC",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                                    fontSize = 9.sp,
                                    letterSpacing = 0.5.sp
                                )
                                Text(
                                    text = recommendation.hrZone,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFFEF4444)
                                )
                            }
                        }
                    }
                }
            }

            // Compliance Check (if activity done today)
            val todayDate = java.time.LocalDate.now().toString()
            val todaysActivities = state.activities.filter { it.date == todayDate }
            // Only show compliance if it was a planned/suggested session (not just "REST")
            if (todaysActivities.isNotEmpty() && recommendation.type != "REST") {
                val compliance = CoachAI.calculateCompliance(recommendation, todaysActivities)
                if (compliance != null) {
                    Surface(
                        color = when(compliance.color) {
                            "green" -> Color(0xFF22C55E).copy(alpha = 0.15f)
                            "orange" -> Color(0xFFF97316).copy(alpha = 0.15f)
                            "red" -> Color(0xFFEF4444).copy(alpha = 0.15f)
                            else -> Color(0xFF3B82F6).copy(alpha = 0.15f)
                        },
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .background(Color.White, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "${compliance.score}%",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.Black
                                )
                            }
                            Column {
                                Text(
                                    text = compliance.feedback.uppercase(),
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Black,
                                    color = when(compliance.color) {
                                        "green" -> Color(0xFF22C55E)
                                        "orange" -> Color(0xFFF97316)
                                        "red" -> Color(0xFFEF4444)
                                        else -> Color(0xFF3B82F6)
                                    }
                                )
                                Text(
                                    text = compliance.details,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                                )
                            }
                        }
                    }
                }
            } else if (recommendation.physiologicalGain.isNotBlank()) {
                Surface(
                    color = Color(0xFF3B82F6).copy(alpha = 0.1f),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.EmojiEvents,
                            contentDescription = null,
                            tint = Color(0xFF3B82F6),
                            modifier = Modifier.size(16.dp)
                        )
                        Column {
                            Text(
                                text = "GAIN PHYSIOLOGIQUE",
                                style = MaterialTheme.typography.labelSmall,
                                color = Color(0xFF3B82F6).copy(alpha = 0.7f),
                                fontSize = 9.sp,
                                letterSpacing = 0.5.sp
                            )
                            Text(
                                text = recommendation.physiologicalGain,
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFF3B82F6),
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
            }

            Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))

            // Advice
            Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Icon(
                    imageVector = Icons.Default.Lightbulb,
                    contentDescription = null,
                    tint = Color(0xFFF59E0B),
                    modifier = Modifier.size(20.dp)
                )
                Text(
                    text = recommendation.advice,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f),
                    lineHeight = 18.sp
                )
            }
        }
    }
}

@Composable
fun PmcChart(data: List<PmcDataPoint>) {
    var scrubX by remember { mutableStateOf<Float?>(null) }
    var selectedIndex by remember { mutableStateOf<Int?>(null) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(32.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), RoundedCornerShape(32.dp))
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "GESTION DE PERFORMANCE",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                    letterSpacing = 2.sp,
                    fontWeight = FontWeight.Bold
                )
                if (selectedIndex != null && data.isNotEmpty()) {
                    val pt = data[selectedIndex!!]
                    Text(
                        text = "${pt.date}: CTL ${pt.ctl.toInt()} / TSB ${pt.tsb.toInt()}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
            Icon(Icons.Default.Timeline, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(14.dp))
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(180.dp)
                .pointerInput(Unit) {
                    detectDragGestures(
                        onDragStart = { offset -> scrubX = offset.x },
                        onDrag = { change, _ -> scrubX = change.position.x },
                        onDragEnd = { scrubX = null; selectedIndex = null },
                        onDragCancel = { scrubX = null; selectedIndex = null }
                    )
                }
                .pointerInput(Unit) {
                     detectTapGestures(onTap = { offset: Offset -> scrubX = offset.x })
                }
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                if (data.size < 2) return@Canvas

                val width = size.width
                val height = size.height
                
                // Determine ranges
                val maxVal = data.flatMap { listOf(it.ctl, it.atl) }.maxOrNull()?.coerceAtLeast(10.0) ?: 10.0
                val minTsb = data.map { it.tsb }.minOrNull() ?: -20.0
                val maxTsb = data.map { it.tsb }.maxOrNull()?.coerceAtLeast(10.0) ?: 10.0
                
                // TSB Scale (Separate axis or shared? Typically shared but TSB centers on 0)
                // Let's use a split view or just overlay. Overlay is cleaner for mobile.
                // We'll map TSB 0 to center height.
                
                val stepX = width / (data.size - 1)
                
                // Update selected index based on scrub
                if (scrubX != null) {
                    val idx = (scrubX!! / width * (data.size - 1)).toInt().coerceIn(0, data.size - 1)
                    selectedIndex = idx
                }

                // 1. Draw TSB Area (Yellow)
                // Normalize TSB to fit in bottom half or overlay? Let's use full height but 0 is at 50%
                // Actually standard PMC has Load on Left, TSB on Right.
                // We will scale TSB to use +/- 40 range mapped to bottom 20% to top 80%?
                // Let's keep it simple: Map TSB [-30, 30] to [height, 0] adjusted.
                
                val tsbZeroY = height / 2
                val tsbScale = height / 100.0 // 100 range

                val tsbPath = Path()
                data.forEachIndexed { i, pt ->
                    val x = i * stepX
                    val y = tsbZeroY - (pt.tsb * tsbScale).toFloat()
                    if (i == 0) tsbPath.moveTo(x, tsbZeroY)
                    else {
                        tsbPath.lineTo(x, y)
                    }
                }
                // Close path for filling area
                tsbPath.lineTo(width, tsbZeroY)
                tsbPath.lineTo(0f, tsbZeroY)
                tsbPath.close()
                
                drawPath(tsbPath, color = Color(0xFFF59E0B).copy(alpha = 0.2f))
                
                // 2. Draw CTL (Blue Line) - Fitness
                val loadScale = height / (maxVal * 1.2)
                
                val ctlPath = Path()
                data.forEachIndexed { i, pt ->
                    val x = i * stepX
                    val y = height - (pt.ctl * loadScale).toFloat()
                    if (i == 0) ctlPath.moveTo(x, y) else ctlPath.lineTo(x, y)
                }
                drawPath(ctlPath, color = Color(0xFF3B82F6), style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round))
                
                // 3. Draw ATL (Red Dashed) - Fatigue
                val atlPath = Path()
                data.forEachIndexed { i, pt ->
                    val x = i * stepX
                    val y = height - (pt.atl * loadScale).toFloat()
                    if (i == 0) atlPath.moveTo(x, y) else atlPath.lineTo(x, y)
                }
                drawPath(
                    atlPath, 
                    color = Color(0xFFEF4444), 
                    style = Stroke(width = 1.5.dp.toPx(), pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(floatArrayOf(10f, 10f), 0f))
                )
                
                // 4. Zero Line for TSB
                drawLine(
                    color = Color.Gray.copy(alpha = 0.3f),
                    start = Offset(0f, tsbZeroY),
                    end = Offset(width, tsbZeroY),
                    strokeWidth = 1.dp.toPx()
                )
                
                // 5. Scrub Line & Data Points
                if (selectedIndex != null) {
                    val x = selectedIndex!! * stepX
                    drawLine(Color.White, Offset(x, 0f), Offset(x, height), strokeWidth = 1.dp.toPx())
                    
                    val pt = data[selectedIndex!!]
                    // TSB Point
                    drawCircle(Color(0xFFF59E0B), 4.dp.toPx(), Offset(x, tsbZeroY - (pt.tsb * tsbScale).toFloat()))
                    // CTL Point
                    drawCircle(Color(0xFF3B82F6), 4.dp.toPx(), Offset(x, height - (pt.ctl * loadScale).toFloat()))
                }
            }
        }

        // Legend
        Row(
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            LegendItem("Condition (CTL)", Color(0xFF3B82F6))
            LegendItem("Fatigue (ATL)", Color(0xFFEF4444))
            LegendItem("Fraîcheur (TSB)", Color(0xFFF59E0B))
        }
    }
}

@Composable
private fun LegendItem(label: String, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(color))
        Text(text = label, style = MaterialTheme.typography.labelSmall, fontSize = 8.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
    }
}
