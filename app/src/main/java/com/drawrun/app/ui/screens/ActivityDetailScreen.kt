package com.drawrun.app.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.drawrun.app.AppState
import com.drawrun.app.ui.components.StatCard
import com.drawrun.app.ui.components.Zone
import com.drawrun.app.ui.components.ZoneBar
import com.drawrun.app.ActivityStreams
import com.drawrun.app.ActivityAnalysis
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.ui.graphics.StrokeCap
import kotlin.math.abs

@Composable
fun ActivityDetailScreen(state: AppState, syncManager: com.drawrun.app.logic.DataSyncManager) {
    val act = state.selectedActivity ?: return
    val scope = rememberCoroutineScope()

    LaunchedEffect(act) {
        android.util.Log.d("DrawRun", "ActivityDetail: Opening activity ${act.id} - ${act.title}")
        
        if (state.selectedActivityStreams == null || (state.selectedActivity?.id != act.id)) { // Re-sync if new activity
             // Clear previous
             state.selectedActivityStreams = null
             state.selectedActivityAnalysis = null
             
             android.util.Log.d("DrawRun", "ActivityDetail: Fetching streams for activity ${act.id}")
             
             if (act.load == "HC" && act.startTime != null && act.endTime != null) {
                 // Health Connect Detail Sync
                 android.util.Log.d("DrawRun", "ActivityDetail: Using Health Connect sync (${act.startTime} to ${act.endTime})")
                 try {
                     syncManager.syncHealthConnectDetail(
                         java.time.Instant.parse(act.startTime),
                         java.time.Instant.parse(act.endTime),
                         act.type
                     )
                     android.util.Log.d("DrawRun", "ActivityDetail: HC sync completed")
                 } catch (e: Exception) { 
                     android.util.Log.e("DrawRun", "ActivityDetail: HC sync failed", e)
                     e.printStackTrace() 
                 }
             } else {
                 // Strava Detail Sync
                 android.util.Log.d("DrawRun", "ActivityDetail: Using Strava sync for activity ${act.id}")
                 try {
                     syncManager.syncActivityDetail(act.id, act.type)
                     android.util.Log.d("DrawRun", "ActivityDetail: Strava sync completed")
                 } catch (e: Exception) {
                     android.util.Log.e("DrawRun", "ActivityDetail: Strava sync failed", e)
                     e.printStackTrace()
                 }
             }
             
             // Log result
             kotlinx.coroutines.delay(500) // Give time for state to update
             android.util.Log.d("DrawRun", "ActivityDetail: Streams = ${state.selectedActivityStreams != null}, Analysis = ${state.selectedActivityAnalysis != null}")
        } else {
            android.util.Log.d("DrawRun", "ActivityDetail: Using cached data for activity ${act.id}")
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
        ) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surfaceVariant)
                    .padding(horizontal = 24.dp, vertical = 24.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    IconButton(onClick = { state.selectedActivity = null }) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = null, tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                    }
                    Column {
                        Text(text = act.title.uppercase(), style = MaterialTheme.typography.titleLarge, fontStyle = FontStyle.Italic, fontWeight = FontWeight.Black)
                        Text(text = act.type.uppercase(), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                    }
                }
                Icon(imageVector = Icons.Default.Share, contentDescription = null, tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f), modifier = Modifier.size(20.dp))
            }

            Column(modifier = Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(24.dp)) {
                // Map Placeholder
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .aspectRatio(1.6f)
                        .clip(RoundedCornerShape(48.dp))
                        .background(if (state.appTheme == com.drawrun.app.ui.theme.AppTheme.LIGHT) Color(0xFFE2E8F0) else Color(0xFF1C1C1E)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (act.type == "swim") Icons.Default.Pool else if (act.type == "bike") Icons.Default.DirectionsBike else Icons.Default.Map,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(48.dp)
                    )
                    
                    // Stats overlay
                    Box(
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .padding(16.dp)
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(28.dp))
                            .background(if (state.appTheme == com.drawrun.app.ui.theme.AppTheme.LIGHT) Color.White.copy(alpha = 0.95f) else Color.Black.copy(alpha = 0.9f))
                            .border(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), RoundedCornerShape(28.dp))
                            .padding(16.dp)
                    ) {
                        val analysis = state.selectedActivityAnalysis
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceAround) {
                            DetailHeaderStat(if (act.type == "bike") "POWER" else "PACE", if (act.type == "bike") (act.pace.ifBlank { "--W" }) else act.pace)
                            DetailHeaderStat("IF", analysis?.intensityFactor?.let { "%.2f".format(it) } ?: "--")
                            DetailHeaderStat("TSS", analysis?.tss?.let { "%.0f".format(it) } ?: "--")
                        }
                    }
                }

                // Dynamic Correlation (Chart)
                AnalysisChartSection(state)

                // Analysis Cards
                state.selectedActivityAnalysis?.let { analysis ->
                    Text(text = "SCORES DE PERFORMANCE", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), letterSpacing = 2.sp, modifier = Modifier.padding(start = 8.dp))
                    
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        StatCard("IF", "%.2f".format(analysis.intensityFactor ?: 0.0), "pts", modifier = Modifier.weight(1f))
                        StatCard("VI (Variabilité)", "%.2f".format(analysis.variabilityIndex ?: 1.0), "index", modifier = Modifier.weight(1f))
                    }
                    
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        StatCard("EF (Efficacité)", "%.2f".format(analysis.efficiencyFactor ?: 0.0), "pts", modifier = Modifier.weight(1f))
                        StatCard("Découplage", "%.1f%%".format((analysis.aerobicDecoupling ?: 0.0) * 100), "drift", modifier = Modifier.weight(1f))
                    }

                    // Coach Analysis [NEW]
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(32.dp))
                            .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.05f))
                            .border(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.1f), RoundedCornerShape(32.dp))
                            .padding(24.dp)
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Icon(Icons.Default.Bolt, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(16.dp))
                                Text("ANALYSE DU COACH", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                            }
                            
                            val insight = when {
                                (analysis.intensityFactor ?: 0.0) > 1.05 -> "Séance très intense (PMA/VMA). Excellente sollicitation de votre puissance aérobie."
                                (analysis.intensityFactor ?: 0.0) > 0.90 -> "Séance de seuil solide. Idéal pour repousser votre limite de fatigue."
                                (analysis.intensityFactor ?: 0.0) > 0.75 -> "Endurance active. Bon équilibre entre volume et intensité."
                                else -> "Récupération ou endurance fondamentale. Parfait pour assimiler la charge."
                            }
                            
                            Text(text = insight, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium)
                            
                            if ((analysis.aerobicDecoupling ?: 0.0) > 0.05) {
                                Text(
                                    text = "Note: Découplage de ${(analysis.aerobicDecoupling!! * 100).toInt()}%. Signe d'une fatigue cardiaque en fin de séance ou manque d'hydratation.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                                )
                            }
                        }
                    }
                }

                // Zones
                val zones = state.zones
                if (zones != null) {
                    ZoneBar("Distribution Cardio (Charge Interne)", listOf(
                        Zone("Z1 Récup", "05:00", 0.1f, Color(0xFF94A3B8)),
                        Zone("Z2 Endurance", "32:15", 0.5f, Color(0xFF3B82F6)),
                        Zone("Z3 Tempo", "10:00", 0.2f, Color(0xFF22C55E)),
                        Zone("Z4 Seuil", "08:45", 0.15f, Color(0xFFF97316)),
                        Zone("Z5 VMA", "02:00", 0.05f, Color(0xFFEF4444))
                    ))
                }

                // Kilometer Table
                state.selectedActivityAnalysis?.let { analysis ->
                    if (analysis.lapData.isNotEmpty()) {
                        Text(text = "DÉTAILS PAR KILOMÈTRE", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), letterSpacing = 2.sp, modifier = Modifier.padding(start = 8.dp))
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(32.dp))
                                .background(MaterialTheme.colorScheme.surface)
                                .border(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), RoundedCornerShape(32.dp))
                        ) {
                            // Header
                            Row(
                                modifier = Modifier.fillMaxWidth().background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f)).padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("KM", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, modifier = Modifier.weight(0.5f))
                                Text("ALLURE", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, modifier = Modifier.weight(1f))
                                Text("FC", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, modifier = Modifier.weight(1f))
                                Text("D+", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, modifier = Modifier.weight(0.5f))
                            }
                            analysis.lapData.take(20).forEach { lap -> // Limit to 20 for scrolling stability in this view
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text("${lap.lapNumber}", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, modifier = Modifier.weight(0.5f))
                                    Text(lap.avgPace, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
                                    Text("${lap.avgHr} bpm", style = MaterialTheme.typography.bodyMedium, color = Color(0xFFFF3B30), modifier = Modifier.weight(1f))
                                    Text("+${lap.elevationGain.toInt()}m", style = MaterialTheme.typography.bodyMedium, color = Color(0xFF22C55E), modifier = Modifier.weight(0.5f))
                                }
                                Divider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(100.dp))
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AnalysisChartSection(state: AppState) {
    val streams = state.selectedActivityStreams ?: return
    
    var selectedMetrics by remember { mutableStateOf(setOf("FC", "ALLURE")) }
    var scrubX by remember { mutableStateOf<Float?>(null) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(32.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), RoundedCornerShape(32.dp))
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text(text = "CORRÉLATION DYNAMIQUE", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), letterSpacing = 2.sp)
            Icon(imageVector = Icons.Default.Timeline, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(14.dp))
        }

        // Metric Selectors
        FlowRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            val available = listOf(
                "FC" to Color(0xFFFF3B30),
                "ALLURE" to Color(0xFF007AFF),
                "ALT" to Color(0xFF8E8E93),
                "VAM" to Color(0xFF22C55E),
                "PUISSANCE" to Color(0xFFF59E0B),
                "GAP" to Color(0xFF8B5CF6),
                "CADENCE" to Color(0xFFEC4899),
                "DÉRIVÉE" to Color(0xFF14B8A6)
            ).filter { (name, _) ->
                when(name) {
                    "FC" -> streams.heartRate != null
                    "ALLURE" -> streams.pace != null
                    "ALT" -> streams.altitude != null
                    "VAM" -> streams.vam != null
                    "PUISSANCE" -> streams.power != null
                    "GAP" -> streams.gradAdjustedPace != null
                    "CADENCE" -> streams.cadence != null
                    "DÉRIVÉE" -> streams.hrDerivative != null
                    else -> false
                }
            }

            available.forEach { (name, color) ->
                val selected = selectedMetrics.contains(name)
                Surface(
                    onClick = {
                        selectedMetrics = if (selected) selectedMetrics - name else selectedMetrics + name
                    },
                    shape = RoundedCornerShape(12.dp),
                    color = if (selected) color.copy(alpha = 0.1f) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                    border = BorderStroke(1.dp, if (selected) color else Color.Transparent)
                ) {
                    Text(
                        text = name,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = if (selected) color else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                        fontWeight = FontWeight.Black
                    )
                }
            }
        }

        // Chart Canvas
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
                .background(Color.Black.copy(alpha = 0.05f), RoundedCornerShape(24.dp))
                .pointerInput(Unit) {
                    detectDragGestures(
                        onDragStart = { offset -> scrubX = offset.x },
                        onDrag = { change, _ -> scrubX = change.position.x },
                        onDragEnd = { scrubX = null },
                        onDragCancel = { scrubX = null }
                    )
                }
                .pointerInput(Unit) {
                    detectTapGestures { offset -> scrubX = offset.x }
                }
        ) {
            Canvas(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                val w = size.width
                val h = size.height
                
                selectedMetrics.forEach { metricName ->
                    val color = when(metricName) {
                        "FC" -> Color(0xFFFF3B30)
                        "ALLURE" -> Color(0xFF007AFF)
                        "ALT" -> Color(0xFF8E8E93)
                        "VAM" -> Color(0xFF22C55E)
                        "PUISSANCE" -> Color(0xFFF59E0B)
                        "GAP" -> Color(0xFF8B5CF6)
                        "CADENCE" -> Color(0xFFEC4899)
                        "DÉRIVÉE" -> Color(0xFF14B8A6)
                        else -> Color.Gray
                    }
                    
                    val data = when(metricName) {
                        "FC" -> streams.heartRate?.map { it.toDouble() }
                        "ALLURE" -> streams.pace // Actually speed m/s
                        "ALT" -> streams.altitude
                        "VAM" -> streams.vam
                        "PUISSANCE" -> streams.power?.map { it.toDouble() }
                        "GAP" -> streams.gradAdjustedPace
                        "CADENCE" -> streams.cadence?.map { it.toDouble() }
                        "DÉRIVÉE" -> streams.hrDerivative
                        else -> null
                    } ?: return@forEach

                    if (data.isEmpty()) return@forEach
                    
                    val min = data.minOrNull() ?: 0.0
                    val max = data.maxOrNull() ?: 1.0
                    val range = (max - min).coerceAtLeast(0.1)
                    
                    val path = Path()
                    data.forEachIndexed { index, value ->
                        val x = (index.toFloat() / (data.size - 1)) * w
                        val y = h - (((value - min) / range).toFloat() * h)
                        if (index == 0) path.moveTo(x, y) else path.lineTo(x, y)
                    }
                    drawPath(path, color, style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round))
                }

                // Scrubber line
                scrubX?.let { x ->
                    drawLine(
                        color = Color.White.copy(alpha = 0.5f),
                        start = Offset(x.coerceIn(0f, w), 0f),
                        end = Offset(x.coerceIn(0f, w), h),
                        strokeWidth = 1.dp.toPx()
                    )
                }
            }
        }
    }
}

@Composable
fun DetailHeaderStat(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontSize = 8.sp)
        Text(text = value, style = MaterialTheme.typography.titleLarge, fontStyle = FontStyle.Italic, fontWeight = FontWeight.Black)
    }
}
