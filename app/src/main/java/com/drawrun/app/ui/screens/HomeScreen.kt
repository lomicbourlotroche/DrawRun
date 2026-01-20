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
                            title = "Readiness",
                            value = state.readiness,
                            unit = "/100",
                            showChart = false,
                            modifier = Modifier.height(64.dp),
                            onClick = {
                                state.explanationTitle = "Score de Disponibilité"
                                state.explanationContent = "Calculé à partir du sommeil, du HRV et de la charge d'entraînement récente. Un score élevé indique un état optimal pour la performance."
                                state.showExplanation = true
                            }
                        )
                    }
                }
            }
        }

        // Daily Training Section
        DailyTrainingSection(state)

        // CTL / TSB Row
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
                color = Color(0xFF22C55E),
                icon = Icons.Default.History,
                modifier = Modifier.weight(1f),
                onClick = {
                    state.explanationTitle = "TSB (Training Stress Balance)"
                    state.explanationContent = "Différence entre la forme et la fatigue. Un score positif indique une fraîcheur physique, idéal avant une compétition."
                    state.showExplanation = true
                }
            )
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
    val recommendation = remember { CoachAI.getDailyTraining(state) }
    
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(32.dp))
            .background(
                brush = androidx.compose.ui.graphics.Brush.linearGradient(
                    colors = listOf(
                        MaterialTheme.colorScheme.primary.copy(alpha = 0.15f),
                        MaterialTheme.colorScheme.surface
                    )
                )
            )
            .border(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.1f), RoundedCornerShape(32.dp))
            .padding(24.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Surface(
                        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                        shape = CircleShape,
                        modifier = Modifier.size(32.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = when(recommendation.type) {
                                    "REST" -> Icons.Default.NightsStay
                                    "I", "R" -> Icons.Default.Bolt
                                    else -> Icons.Default.DirectionsRun
                                },
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                    Text(
                        text = if (recommendation.isFromPlan) "ENTRAÎNEMENT DU JOUR" else "SUGGESTION DU COACH",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }
                
                if (recommendation.isFromPlan) {
                    Surface(
                        color = MaterialTheme.colorScheme.primary,
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

            Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))

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
