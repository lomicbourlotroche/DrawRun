@file:OptIn(ExperimentalLayoutApi::class)
package com.drawrun.app.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.graphics.vector.ImageVector
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
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.Brush
import kotlinx.coroutines.delay
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow

@Composable
fun ActivityDetailScreen(state: AppState, syncManager: com.drawrun.app.logic.DataSyncManager) {
    val act = state.selectedActivity ?: return
    val analysis = state.selectedActivityAnalysis
    val streams = state.selectedActivityStreams
    val scope = rememberCoroutineScope()

    // --- REPLAY & LIVE STATE ---
    var isLiveMode by remember { mutableStateOf(false) }
    var isPlaying by remember { mutableStateOf(false) }
    var currentIndex by remember { mutableStateOf(0) }
    var playbackSpeed by remember { mutableStateOf(1) }

    LaunchedEffect(act) {
        if (state.selectedActivityStreams == null || (state.selectedActivity?.id != act.id)) {
             state.selectedActivityStreams = null
             state.selectedActivityAnalysis = null
             if (act.load == "HC" && act.startTime != null && act.endTime != null) {
                 syncManager.syncHealthConnectDetail(java.time.Instant.parse(act.startTime), java.time.Instant.parse(act.endTime), act.type)
             } else {
                 syncManager.syncActivityDetail(act.id, act.type)
             }
        }
    }

    // Playback Loop
    LaunchedEffect(isPlaying, playbackSpeed, isLiveMode) {
        if (isPlaying && isLiveMode && streams != null) {
            while (currentIndex < (streams.time.size - 1)) {
                delay((100 / playbackSpeed).toLong())
                currentIndex++
            }
            isPlaying = false
        }
    }

    val currentPoint = streams?.let { 
        val idx = currentIndex.coerceIn(it.time.indices)
        object {
            val hr = it.heartRate?.get(idx)
            val power = it.power?.get(idx)
            val pace = it.pace?.get(idx)
            val alt = it.altitude?.get(idx)
            val vam = it.vam?.get(idx)
            val cadence = it.cadence?.get(idx)
            val dist = it.distance?.get(idx)
            val timeStr = "%02d:%02d:%02d".format(it.time[idx] / 3600, (it.time[idx] % 3600) / 60, it.time[idx] % 60)
        }
    }

    Box(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
            // 1. Header & Quick Actions
            ActivityDetailHeader(
                act = act,
                isLiveMode = isLiveMode,
                onBack = { state.selectedActivity = null },
                onToggleLive = { 
                    isLiveMode = !isLiveMode
                    if (!isLiveMode) isPlaying = false
                }
            )

            if (analysis == null) {
                Box(modifier = Modifier.fillMaxWidth().height(400.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                }
            } else {
                Column(modifier = Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(24.dp)) {
                
                // 2. Map & Replay Controls
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(32.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                ) {
                    Column {
                        // Map Surface
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .aspectRatio(1.6f)
                                .background(if (state.appTheme == com.drawrun.app.ui.theme.AppTheme.LIGHT) Color(0xFFF1F5F9) else Color(0xFF1C1C1E)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (act.type == "swim") Icons.Default.Pool else if (act.type == "bike") Icons.Default.DirectionsBike else Icons.Default.Map,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.2f),
                                modifier = Modifier.size(64.dp)
                            )
                            
                            // Live Replay Overlay
                            if (isLiveMode && currentPoint != null) {
                                Text(
                                    text = currentPoint.timeStr,
                                    modifier = Modifier.align(Alignment.TopStart).padding(16.dp),
                                    style = MaterialTheme.typography.labelMedium,
                                    fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }

                        // Replay Controls
                        if (isLiveMode && streams != null) {
                            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                                Slider(
                                    value = currentIndex.toFloat(),
                                    onValueChange = { currentIndex = it.toInt(); isPlaying = false },
                                    valueRange = 0f..(streams.time.size - 1).toFloat(),
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = SliderDefaults.colors(thumbColor = Color(0xFFEF4444), activeTrackColor = Color(0xFFEF4444))
                                )
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    IconButton(onClick = { currentIndex = 0; isPlaying = false }) {
                                        Icon(Icons.Default.Refresh, null, tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                                    }
                                    
                                    Box(
                                        modifier = Modifier
                                            .size(48.dp)
                                            .clip(CircleShape)
                                            .background(Color(0xFFEF4444))
                                            .clickable { isPlaying = !isPlaying },
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                                            contentDescription = null,
                                            tint = Color.White
                                        )
                                    }

                                    Surface(
                                        onClick = { playbackSpeed = if (playbackSpeed == 1) 2 else if (playbackSpeed == 2) 5 else 1 },
                                        shape = CircleShape,
                                        color = MaterialTheme.colorScheme.surfaceVariant
                                    ) {
                                        Text(
                                            text = "${playbackSpeed}x",
                                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }
                        } else {
                            // Summary Stats bar
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceAround
                            ) {
                                DetailHeaderStat("DURÉE", act.duration)
                                DetailHeaderStat("DISTANCE", act.dist)
                                DetailHeaderStat(if (act.type == "bike") "NP" else "NGP", 
                                    if (act.type == "bike") "${analysis?.normalizedPower?.toInt() ?: "--"}W" 
                                    else analysis?.normalizedSpeed?.let { spd ->
                                        val p = 60.0 / (spd * 3.6 / 60.0)
                                        "%d:%02d".format((p/60).toInt(), (p%60).toInt()) 
                                    } ?: "--:--"
                                )
                            }
                        }
                    }
                }

                // 3. Telemetry Grid
                Text(text = "TÉLÉMÉTRIE EN DIRECT", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), letterSpacing = 2.sp)
                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    val cardModifier = Modifier.weight(1f).widthIn(min = 150.dp)
                    
                    TelemetryCard(
                        title = "Cardio",
                        value = if (isLiveMode) "${currentPoint?.hr ?: "--"}" else "${act.avgHr.replace(" bpm", "")}",
                        unit = "bpm",
                        icon = Icons.Default.Favorite,
                        color = Color(0xFFEF4444),
                        stream = streams?.heartRate?.map { it.toDouble() },
                        isLive = isLiveMode,
                        currentIndex = currentIndex,
                        modifier = cardModifier
                    )

                    TelemetryCard(
                        title = if (act.type == "bike") "Vitesse" else "Allure",
                        value = if (isLiveMode) {
                            if (act.type == "bike") "%.1f".format((currentPoint?.pace ?: 0.0) * 3.6)
                            else {
                                val spd = currentPoint?.pace ?: 0.0
                                if (spd > 0) {
                                    val p = 60.0 / (spd * 3.6 / 60.0)
                                    "%d:%02d".format((p/60).toInt(), (p%60).toInt())
                                } else "--:--"
                            }
                        } else act.pace.replace(" /km", "").replace(" km/h", ""),
                        unit = if (act.type == "bike") "km/h" else "/km",
                        icon = Icons.Default.Timer,
                        color = Color(0xFF3B82F6),
                        stream = streams?.pace,
                        isLive = isLiveMode,
                        currentIndex = currentIndex,
                        modifier = cardModifier
                    )

                    if (act.type != "swim") {
                        TelemetryCard(
                            title = "Altitude",
                            value = if (isLiveMode) "${currentPoint?.alt?.toInt() ?: "--"}" else "${analysis?.lapData?.sumOf { it.elevationGain }?.toInt() ?: "--"}",
                            unit = "m",
                            icon = Icons.Default.Terrain,
                            color = Color(0xFF64748B),
                            stream = streams?.altitude,
                            isLive = isLiveMode,
                            currentIndex = currentIndex,
                            modifier = cardModifier
                        )
                    }

                    TelemetryCard(
                        title = "Puissance",
                        value = if (isLiveMode) "${currentPoint?.power ?: "--"}" else "${analysis?.normalizedPower?.toInt() ?: "--"}",
                        unit = "W",
                        icon = Icons.Default.Bolt,
                        color = Color(0xFFF59E0B),
                        stream = streams?.power?.map { it.toDouble() },
                        isLive = isLiveMode,
                        currentIndex = currentIndex,
                        modifier = cardModifier
                    )

                    TelemetryCard(
                        title = "VAM",
                        value = if (isLiveMode) "${currentPoint?.vam?.toInt() ?: "--"}" else "${analysis?.vam?.toInt() ?: "--"}",
                        unit = "m/h",
                        icon = Icons.Default.TrendingUp,
                        color = Color(0xFF8B5CF6),
                        stream = streams?.vam,
                        isLive = isLiveMode,
                        currentIndex = currentIndex,
                        modifier = cardModifier
                    )

                    TelemetryCard(
                        title = "Dérive",
                        value = "%.1f".format((analysis?.aerobicDecoupling ?: 0.0) * 100),
                        unit = "%",
                        icon = Icons.Default.Height,
                        color = Color(0xFFF97316),
                        stream = null,
                        isLive = false,
                        currentIndex = 0,
                        modifier = cardModifier
                    )
                }

                // 4. Intensity Distributions
                if (!isLiveMode && analysis != null) {
                    Text(text = "DISTRIBUTION DE L'INTENSITÉ", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), letterSpacing = 2.sp)
                    FlowRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        analysis.hrZoneDistribution?.let { 
                            ZoneDistributionCard("ZONES CARDIO", it, Color(0xFFEF4444), Modifier.weight(1f).widthIn(min = 280.dp))
                        }
                        analysis.powerZoneDistribution?.let { 
                            ZoneDistributionCard("ZONES PUISSANCE", it, Color(0xFFF59E0B), Modifier.weight(1f).widthIn(min = 280.dp))
                        }
                        analysis.paceZoneDistribution?.let { 
                            ZoneDistributionCard("ZONES D'ALLURE", it, Color(0xFF3B82F6), Modifier.weight(1f).widthIn(min = 280.dp))
                        }
                    }
                }

                // 5. Technical Details Sections
                if (analysis != null) {
                    Text(text = "DÉTAILS TECHNIQUES & BIOMÉCANIQUE", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), letterSpacing = 2.sp)
                    FlowRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        TechnicalSection("Charge & Intensité", listOf(
                            TechItem("Normalized Power", "${analysis.normalizedPower?.toInt() ?: "--"}", "W", Icons.Default.Bolt),
                            TechItem("TSS (Stress Score)", "${analysis.tss?.toInt() ?: "--"}", "pts", Icons.Default.History),
                            TechItem("IF (Intensité)", "%.2f".format(analysis.intensityFactor ?: 0.0), "", Icons.Default.TrendingUp),
                            TechItem("TRIMP", "${analysis.trimp?.toInt() ?: "--"}", "pts", Icons.Default.Favorite)
                        ), Modifier.weight(1f).widthIn(min = 300.dp))

                        TechnicalSection("Efficacité & Stabilité", listOf(
                            TechItem("EF (Efficacité)", "%.2f".format(analysis.efficiencyFactor ?: 0.0), "pts", Icons.Default.Speed),
                            TechItem("Découplage Pw:Hr", "%.1f".format((analysis.aerobicDecoupling ?: 0.0) * 100), "%", Icons.Default.Height),
                            TechItem("Variabilité (VI)", "%.2f".format(analysis.variabilityIndex ?: 1.0), "idx", Icons.Default.Timeline),
                            TechItem("VAM Ascension", "${analysis.vam?.toInt() ?: "--"}", "m/h", Icons.Default.Terrain)
                        ), Modifier.weight(1f).widthIn(min = 300.dp))

                        TechnicalSection("Dynamique & Technique", listOf(
                            TechItem("SWOLF (Bassin)", "${analysis.swolf ?: "--"}", "", Icons.Default.Waves),
                            TechItem("Stroke Rate", "${analysis.strokeRate ?: "--"}", "spm", Icons.Default.Timer),
                            TechItem("Cadence Moyenne", "${analysis.lapData.mapNotNull { it.avgPower }.average().toInt()}", "rpm", Icons.Default.DirectionsBike),
                            TechItem("Équilibre G/D", "--/--", "%", Icons.Default.Transform)
                        ), Modifier.weight(1f).widthIn(min = 300.dp))
                    }
                }

                // 6. Correlation Dynamique (Chart) - Keep existing but style it better
                AnalysisChartSection(state)

                // 7. Laps Table
                if (analysis != null && analysis.lapData.isNotEmpty()) {
                    Text(text = "DÉTAIL DES TOURS", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), letterSpacing = 2.sp)
                    LapsTable(analysis.lapData)
                }

                Spacer(modifier = Modifier.height(100.dp))
            }
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
                        "ALLURE" -> streams.pace 
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
                        val y = h - (((value - min) / range).toFloat() * h).coerceIn(0f, h)
                        if (index == 0) path.moveTo(x, y) else path.lineTo(x, y)
                    }
                    drawPath(path, color, style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round))
                }

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

@Composable
fun ActivityDetailHeader(act: com.drawrun.app.ActivityItem, isLiveMode: Boolean, onBack: () -> Unit, onToggleLive: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .padding(horizontal = 24.dp, vertical = 24.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowBack, null, tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
            }
            Column {
                val title = act.title.ifBlank { "ACTIVITÉ SANS NOM" }
                Text(title.uppercase(), style = MaterialTheme.typography.titleLarge, fontStyle = FontStyle.Italic, fontWeight = FontWeight.Black)
                Text(act.date, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
            }
        }
        
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            if (act.type != "swim") {
                Surface(
                    onClick = onToggleLive,
                    shape = CircleShape,
                    color = if (isLiveMode) Color(0xFFEF4444) else MaterialTheme.colorScheme.surface,
                    border = if (isLiveMode) null else BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f))
                ) {
                    Row(modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(imageVector = if (isLiveMode) Icons.Default.PauseCircle else Icons.Default.PlayCircle, contentDescription = null, tint = if (isLiveMode) Color.White else MaterialTheme.colorScheme.primary, modifier = Modifier.size(16.dp))
                        Text(if (isLiveMode) "LIVE" else "REPLAY", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = if (isLiveMode) Color.White else MaterialTheme.colorScheme.onSurface)
                    }
                }
            }
            Icon(Icons.Default.Share, null, tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f), modifier = Modifier.size(20.dp))
        }
    }
}

@Composable
fun TelemetryCard(
    title: String,
    value: String,
    unit: String,
    icon: ImageVector,
    color: Color,
    stream: List<Double>?,
    isLive: Boolean,
    currentIndex: Int,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(24.dp))
            .background(if (isLive) color.copy(alpha = 0.05f) else MaterialTheme.colorScheme.surface)
            .border(1.dp, if (isLive) color.copy(alpha = 0.2f) else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), RoundedCornerShape(24.dp))
            .padding(16.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(icon, null, tint = color.copy(alpha = 0.6f), modifier = Modifier.size(14.dp))
                    Text(title.uppercase(), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontWeight = FontWeight.Bold)
                }
                if (isLive) Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(color))
            }
            Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black, fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace)
                Text(unit, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f))
            }
            
            if (stream != null && stream.isNotEmpty()) {
                Canvas(modifier = Modifier.fillMaxWidth().height(30.dp)) {
                    val w = size.width
                    val h = size.height
                    val min = stream.minOrNull() ?: 0.0
                    val max = stream.maxOrNull() ?: 1.0
                    val range = (max - min).coerceAtLeast(1.0)
                    
                    val path = Path()
                    stream.forEachIndexed { idx, v ->
                        val x = (idx.toFloat() / (stream.size - 1)) * w
                        val y = h - (((v - min) / range).toFloat() * h).coerceIn(0f, h)
                        if (idx == 0) path.moveTo(x, y) else path.lineTo(x, y)
                    }
                    drawPath(path, color, style = Stroke(width = 1.dp.toPx(), cap = StrokeCap.Round))
                    
                    if (isLive) {
                        val lx = (currentIndex.toFloat() / (stream.size - 1)) * w
                        drawLine(color, Offset(lx, 0f), Offset(lx, h), strokeWidth = 1.dp.toPx())
                    }
                }
            }
        }
    }
}

@Composable
fun ZoneDistributionCard(title: String, distribution: List<Double>, color: Color, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(24.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), RoundedCornerShape(24.dp))
            .padding(20.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Text(title, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black)
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                distribution.forEachIndexed { idx, pct ->
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Z${idx + 1}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), modifier = Modifier.width(20.dp))
                        Box(modifier = Modifier.weight(1f).height(6.dp).clip(CircleShape).background(MaterialTheme.colorScheme.surfaceVariant)) {
                            Box(modifier = Modifier.fillMaxHeight().fillMaxWidth((pct.toFloat() / 100f).coerceIn(0f, 1f)).background(color.copy(alpha = 0.3f + (idx * 0.15f).coerceAtMost(0.7f))))
                        }
                        Text("%.0f%%".format(pct), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, modifier = Modifier.width(30.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun TechnicalSection(title: String, items: List<TechItem>, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(24.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), RoundedCornerShape(24.dp))
            .padding(16.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(title.uppercase(), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Black)
            items.forEach { item ->
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Icon(item.icon, null, tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.2f), modifier = Modifier.size(16.dp))
                        Text(item.label, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))
                    }
                    Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(item.value, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold)
                        Text(item.unit, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f))
                    }
                }
            }
        }
    }
}

data class TechItem(val label: String, val value: String, val unit: String, val icon: ImageVector)

@Composable
fun LapsTable(laps: List<com.drawrun.app.LapInfo>) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), RoundedCornerShape(24.dp))
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f)).padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("#", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, modifier = Modifier.weight(0.3f))
            Text("ALLURE", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, modifier = Modifier.weight(1f))
            Text("FC", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, modifier = Modifier.weight(1f))
            Text("PUISS.", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, modifier = Modifier.weight(1f))
        }
        laps.forEach { lap ->
            Row(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("${lap.lapNumber}", style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, modifier = Modifier.weight(0.3f))
                Text(lap.avgPace, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f), fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace)
                Text("${lap.avgHr}", style = MaterialTheme.typography.bodyMedium, color = Color(0xFFEF4444), modifier = Modifier.weight(1f), fontWeight = FontWeight.Bold)
                Text("${lap.avgPower ?: "--"}W", style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
            }
            Divider(thickness = 1.dp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
        }
    }
}
