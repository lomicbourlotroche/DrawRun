package com.drawrun.app.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.drawrun.app.ui.components.AppCarousel
import com.drawrun.app.ui.components.StatCard
import com.drawrun.app.ui.components.Zone
import com.drawrun.app.ui.components.ZoneBar
import com.drawrun.app.ui.components.MetricData
import com.drawrun.app.AppState
import com.drawrun.app.logic.PerformanceAnalyzer
import androidx.compose.ui.draw.drawBehind

fun formatPace(paceDecimal: Double): String {
    val minutes = paceDecimal.toInt()
    val seconds = ((paceDecimal - minutes) * 60).toInt()
    return String.format("%d:%02d", minutes, seconds)
}

fun lerp(start: Float, stop: Float, fraction: Float): Float {
    return (1 - fraction) * start + fraction * stop
}

fun getColorForZone(index: Int): Color = when(index) {
    0 -> Color(0xFF94A3B8)
    1 -> Color(0xFF3B82F6)
    2 -> Color(0xFF22C55E)
    3 -> Color(0xFFF97316)
    else -> Color(0xFFEF4444)
}

@Composable
fun PerformanceScreen(state: AppState) {
    var selectedSport by remember { mutableStateOf("run") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        // Sport Selector
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(MaterialTheme.colorScheme.surface)
                .border(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), RoundedCornerShape(20.dp))
                .padding(4.dp)
        ) {
            listOf("run", "swim", "bike").forEach { sport ->
                val selected = selectedSport == sport
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(if (selected) MaterialTheme.colorScheme.primary else Color.Transparent)
                        .clickable { selectedSport = sport },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = sport.uppercase(),
                        style = MaterialTheme.typography.labelSmall,
                        color = if (selected) Color.White else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                        fontWeight = FontWeight.Black
                    )
                }
            }
        }
        // Level & Potential Flashcards
        val metrics = remember(state, selectedSport) {
            val list = mutableListOf<MetricData>()
            
            // 1. VMA / FTP / CSS
            if (selectedSport == "run") {
                val vmaLevel = PerformanceAnalyzer.getPerformanceLevel("VO2MAX", state.vma * 3.5) // Approx VO2 match
                list.add(MetricData(
                    id = "vma",
                    title = "VMA",
                    value = if (state.vma > 0) "%.1f".format(state.vma) else "--",
                    unit = "km/h",
                    category = vmaLevel.first,
                    color = Color(vmaLevel.second),
                    icon = Icons.Default.Bolt,
                    percentage = (state.vma.toFloat() / 25f).coerceIn(0f, 1f),
                    trend = listOf(14f, 14.2f, 14.5f, 14.8f, 15f, 15.2f)
                ))
            } else if (selectedSport == "swim") {
                // Determine CSS level (from State)
                val cssVal = state.css ?: 0.0
                val cssLevel = PerformanceAnalyzer.getPerformanceLevel("CSS", cssVal)
                val cssDisplay = if (cssVal > 0) String.format("%.2f", cssVal).replace(".", ":") else "--"
                
                list.add(MetricData(
                    id = "css",
                    title = "CSS (PROJ.)",
                    value = cssDisplay,
                    unit = "min/100m",
                    category = cssLevel.first,
                    color = Color(cssLevel.second), // Dynamic color
                    icon = Icons.Default.Timer,
                    percentage = 0.6f,
                    trend = emptyList()
                ))
                
                // VO2 MAX Aqua (from State)
                val vo2AquaVal = state.swimVo2 ?: 0.0
                val vo2AquaLevel = PerformanceAnalyzer.getPerformanceLevel("VO2MAX", vo2AquaVal)
                val vo2Display = if (vo2AquaVal > 0) "%.0f".format(vo2AquaVal) else "--"
                
                list.add(MetricData("vo2_swim", "VO2 MAX AQUA", vo2Display, "ml/kg/min", vo2AquaLevel.first, Color(vo2AquaLevel.second), Icons.Default.Air, 0.0f, emptyList()))
                val swimCp = state.swimCp?.toString() ?: "--"
                val swimRiegel = state.swimRiegel // String already
                val swimIe = state.swimIe?.let { "%.1f".format(it) } ?: "--"
                val swimWPrime = state.swimWPrime?.toString() ?: "--"
                val swimPyne = state.swimPyne // String
                val swimFina = state.swimFinaPoints?.toString() ?: "--"

                list.add(MetricData("cp_swim", "PUISSANCE CRIT", swimCp, "Watts", "NIVEAU", Color(0xFF10B981), Icons.Default.Bolt, 0.0f, emptyList()))
                list.add(MetricData("riegel_swim", "RIEGEL (1500m)", swimRiegel, "h:mm:ss", "PRÉDICTION", Color(0xFF3B82F6), Icons.Default.Timeline, 0.0f, emptyList()))
                list.add(MetricData("ie_swim", "INDICE ENDURANCE", swimIe, "% Vmax", "PROFIL", Color(0xFF3B82F6), Icons.Default.TrendingDown, 0.0f, emptyList()))
                list.add(MetricData("w_prime_swim", "RÉSERVOIR W'", swimWPrime, "Joules", "PROFIL", Color(0xFF3B82F6), Icons.Default.BatteryChargingFull, 0.0f, emptyList()))
                list.add(MetricData("pyne", "MODÈLE PYNE", swimPyne, "% Dérive", "PROFIL", Color(0xFF3B82F6), Icons.Default.Analytics, 0.0f, emptyList()))
                list.add(MetricData("fina", "POINTS FINA", swimFina, "pts", "ÉQUITÉ", Color(0xFF8B5CF6), Icons.Default.EmojiEvents, 0.0f, emptyList()))
                val agVal = state.ageGradingScore?.let { "%.1f".format(it) } ?: "--"
                val fmtMax = state.fatMax?.toString() ?: "--"
                val crossHr = state.crossoverHr?.toString() ?: "--"

                list.add(MetricData("masters", "AGE GRADING", agVal, "Coeff", "ÉQUITÉ", Color(0xFF8B5CF6), Icons.Default.Elderly, 0.0f, emptyList()))
                list.add(MetricData("fatmax_swim", "FAT MAX", fmtMax, "bpm", "MÉTABO", Color(0xFFF59E0B), Icons.Default.LocalFireDepartment, 0.0f, emptyList()))
                list.add(MetricData("crossover_swim", "CROSSOVER PT", crossHr, "bpm", "MÉTABO", Color(0xFFF59E0B), Icons.Default.SwapHoriz, 0.0f, emptyList()))
                
                // Advanced Health
                val acwr = state.acwr?.let { "%.1f".format(it) } ?: "--"
                val mono = state.monotony?.let { "%.1f".format(it) } ?: "--"
                
                list.add(MetricData("acwr_swim", "ACWR (ÉPAULE)", acwr, "Ratio", "SANTÉ", Color(0xFFEF4444), Icons.Default.MonitorHeart, 0.0f, emptyList()))
                list.add(MetricData("monotony_swim", "MONOTONIE", mono, "Foster", "SANTÉ", Color(0xFFEF4444), Icons.Default.HorizontalRule, 0.0f, emptyList()))
                list.add(MetricData("ctl_swim", "CTL (FITNESS)", state.ctl, "TSS/j", "CHARGE", Color(0xFFEF4444), Icons.Default.FitnessCenter, 0.0f, emptyList()))
            } else {
                val ftpVal = state.ftp.toDoubleOrNull() ?: 0.0
                val weight = state.weight.toDoubleOrNull() ?: 70.0
                val wkg = state.bikeWKg ?: if (weight > 0) ftpVal / weight else 0.0
                val ftpLevel = PerformanceAnalyzer.getPerformanceLevel("W/KG", wkg)
                val vo2Val = state.bikeVo2
                
                // Bike Calculated
                val fatMaxWatts = (ftpVal * 0.65).toInt()
                val crossoverWatts = (ftpVal * 0.88).toInt() 
                val acwr = state.acwr?.let { "%.1f".format(it) } ?: "--"
                
                list.add(MetricData(
                    id = "ftp",
                    title = "FTP",
                    value = state.ftp,
                    unit = "Watts",
                    category = ftpLevel.first,
                    color = Color(ftpLevel.second),
                    icon = Icons.Default.Bolt,
                    percentage = ((state.ftp.toFloatOrNull() ?: 0f) / 400f).coerceIn(0f, 1f),
                    trend = listOf(200f, 210f, 220f, 225f, 230f, 240f)
                ))
                list.add(MetricData("w_kg", "RAPPORT W/KG", if (wkg > 0) "%.1f".format(wkg) else "--", "W/kg", "NIVEAU", Color(0xFF10B981), Icons.Default.Scale, 0.0f, emptyList()))
                val bikeCp = state.bikeCp?.toString() ?: "--"
                val bikePheno = state.bikePhenotype // String
                val bikeFrc = state.bikeFrc?.toString() ?: "--"
                val bikePmax = state.bikePmax?.toString() ?: "--"
                val bikePd = state.bikePdCurve // String
                val bikeCoggan = state.bikeCogganLevel // String
                val bikeVla = state.bikeVlamax?.let { "%.1f".format(it) } ?: "--"

                list.add(MetricData("cp_bike", "PUISSANCE CRIT", bikeCp, "Watts", "NIVEAU", Color(0xFF10B981), Icons.Default.Bolt, 0.0f, emptyList()))
                list.add(MetricData("vo2_bike", "VO2 MAX CYCLO", if (vo2Val != null) "%.0f".format(vo2Val) else "--", "ml/kg/min", "NIVEAU", Color(0xFF007AFF), Icons.Default.Air, 0.0f, emptyList()))
                list.add(MetricData("phenotype", "PROFIL PUISSANCE", bikePheno, "Start", "PROFIL", Color(0xFF3B82F6), Icons.Default.Person, 0.0f, emptyList()))
                list.add(MetricData("frc", "FRC (RÉSERVE)", bikeFrc, "Joules", "PROFIL", Color(0xFF3B82F6), Icons.Default.BatteryChargingFull, 0.0f, emptyList()))
                list.add(MetricData("pmax", "PMAX (SPRINT)", bikePmax, "Watts", "PROFIL", Color(0xFF3B82F6), Icons.Default.Speed, 0.0f, emptyList()))
                list.add(MetricData("pd_curve", "COURBE P-D", bikePd, "Skiba", "PROFIL", Color(0xFF3B82F6), Icons.Default.ShowChart, 0.0f, emptyList()))
                list.add(MetricData("coggan_level", "NIVEAU COGGAN", bikeCoggan, "Cat.", "ÉQUITÉ", Color(0xFF8B5CF6), Icons.Default.Star, 0.0f, emptyList()))
                list.add(MetricData("age_grading_bike", "AGE GRADING", "--", "Coeff", "ÉQUITÉ", Color(0xFF8B5CF6), Icons.Default.Elderly, 0.0f, emptyList()))
                list.add(MetricData("vlamax", "VLaMAX", bikeVla, "mmol/L/s", "MÉTABO", Color(0xFFF59E0B), Icons.Default.Science, 0.0f, emptyList()))
                list.add(MetricData("fatmax_bike", "FAT MAX", "$fatMaxWatts", "Watts", "MÉTABO", Color(0xFFF59E0B), Icons.Default.LocalFireDepartment, 0.0f, emptyList()))
                list.add(MetricData("crossover_bike", "CROSSOVER PT", "$crossoverWatts", "Watts", "MÉTABO", Color(0xFFF59E0B), Icons.Default.SwapHoriz, 0.0f, emptyList()))
                list.add(MetricData("ctl_bike", "CTL (FORME)", state.ctl, "TSS/j", "CHARGE", Color(0xFFEF4444), Icons.Default.FitnessCenter, (state.ctl.toFloatOrNull() ?: 0f / 100f).coerceIn(0f, 1f), emptyList()))
                list.add(MetricData("atl_bike", "ATL (FATIGUE)", state.fatigueATL?.toString() ?: "--", "TSS/j", "CHARGE", Color(0xFFEF4444), Icons.Default.BatteryAlert, (state.fatigueATL?.toFloat() ?: 0f / 100f).coerceIn(0f, 1f), emptyList()))
                list.add(MetricData("tsb_bike", "TSB (FRAÎCHEUR)", state.formTSB?.toString() ?: "--", "TSS", "CHARGE", Color(0xFFEF4444), Icons.Default.Balance, 0.5f, emptyList()))
                list.add(MetricData("acwr_bike", "ACWR", acwr, "Ratio", "SANTÉ", Color(0xFFEF4444), Icons.Default.MonitorHeart, 0.0f, emptyList()))
            }

            // 2. VO2 Max
            val vo2Level = PerformanceAnalyzer.getPerformanceLevel("VO2MAX", state.vo2Max)
            list.add(MetricData(
                id = "vo2max",
                title = "VO2 MAX",
                value = "%.0f".format(state.vo2Max),
                unit = "ml/kg/min",
                category = vo2Level.first,
                color = Color(vo2Level.second), // Blue
                icon = Icons.Default.Air,
                percentage = (state.vo2Max.toFloat() / 85f).coerceIn(0f, 1f),
                trend = listOf(50f, 52f, 53f, 55f, 56f, 58f)
            ))

            // 3. VDOT / RAI
            if (selectedSport == "run") {
                 list.add(MetricData(
                    id = "vdot",
                    title = "VDOT",
                    value = if (state.vdot > 0) "%.1f".format(state.vdot) else "--",
                    unit = "Jack Daniels",
                    category = "NIVEAU",
                    color = Color(0xFF8B5CF6), // Purple
                    icon = Icons.Default.TrendingUp,
                    percentage = (state.vdot.toFloat() / 80f).coerceIn(0f, 1f),
                    trend = listOf(45f, 46f, 48f, 49f, 51f, 52f)
                ))
                list.add(MetricData(
                    id = "rai",
                    title = "RAI SCORE",
                    value = "%.1f".format(state.calculatedRai ?: state.vdot), // Fallback to VDOT if RAI null
                    unit = "Huawei",
                    category = "NIVEAU",
                    color = Color(0xFFEC4899), // Pink
                    icon = Icons.Default.TrendingUp,
                    percentage = (state.calculatedRai?.toFloat() ?: state.vdot.toFloat() / 80f).coerceIn(0f, 1f),
                    trend = listOf(48f, 49f, 50f, 51f, 52f, 53f)
                ))
                
                val ieVal = state.enduranceIndex?.let { "%.1f".format(it) } ?: "--"
                val agVal = state.ageGradingScore?.let { "%.1f".format(it) } ?: "--"
                val fmtMax = state.fatMax?.toString() ?: "--"
                val crossHr = state.crossoverHr?.toString() ?: "--"
                val acwr = state.acwr?.let { "%.1f".format(it) } ?: "--"
                val mono = state.monotony?.let { "%.1f".format(it) } ?: "--"
                
                val rCp = state.runCp?.let { "%.1f".format(it) } ?: "--"
                val dura = state.runDurability?.let { "%.1f".format(it) } ?: "--"
                val merc = state.runMercierScore?.toString() ?: "--"
                val iaaf = state.runIaafScore?.toString() ?: "--"
                val wPrime = state.wPrimeBalance?.let { "%.0f".format(it) } ?: "--"

                list.add(MetricData("cs", "VITESSE CRITIQUE", "%.1f".format(state.vma * 0.92), "km/h", "NIVEAU", Color(0xFF10B981), Icons.Default.Speed, 0.7f, emptyList()))
                list.add(MetricData("cp", "PUISSANCE CRIT.", rCp, "Watts/kg", "NIVEAU", Color(0xFF10B981), Icons.Default.Bolt, 0.6f, emptyList())) 
                list.add(MetricData("tanda", "TANDA (MARATHON)", state.riegelPrediction, "h:mm:ss", "PRÉDICTION", Color(0xFF3B82F6), Icons.Default.Timer, 0.0f, emptyList()))
                list.add(MetricData("riegel", "RIEGEL (ENDURANCE)", state.riegelPrediction, "Coeff", "PRÉDICTION", Color(0xFF3B82F6), Icons.Default.Timeline, 0.0f, emptyList()))
                list.add(MetricData("ie", "INDICE ENDURANCE", ieVal, "% Vmax", "PROFIL", Color(0xFF3B82F6), Icons.Default.TrendingDown, 0.0f, emptyList()))
                list.add(MetricData("durability", "DURABILITÉ", dura, "% Dérive", "PROFIL", Color(0xFF3B82F6), Icons.Default.BatteryStd, 0.0f, emptyList()))
                list.add(MetricData("w_prime", "RÉSERVOIR W'", wPrime, "Joules", "PROFIL", Color(0xFF3B82F6), Icons.Default.BatteryChargingFull, 0.0f, emptyList()))
                list.add(MetricData("age_grading", "AGE GRADING", agVal, "% WMA", "ÉQUITÉ", Color(0xFF8B5CF6), Icons.Default.Elderly, 0.0f, emptyList()))
                list.add(MetricData("mercier", "SCORE MERCIER", merc, "pts", "ÉQUITÉ", Color(0xFF8B5CF6), Icons.Default.Star, 0.0f, emptyList()))
                list.add(MetricData("iaaf", "POINTS IAAF", iaaf, "pts", "ÉQUITÉ", Color(0xFF8B5CF6), Icons.Default.EmojiEvents, 0.0f, emptyList()))
                list.add(MetricData("fatmax", "FAT MAX", fmtMax, "bpm", "MÉTABO", Color(0xFFF59E0B), Icons.Default.LocalFireDepartment, 0.4f, emptyList()))
                list.add(MetricData("crossover", "CROSSOVER PT", crossHr, "bpm", "MÉTABO", Color(0xFFF59E0B), Icons.Default.SwapHoriz, 0.5f, emptyList()))
                list.add(MetricData("acwr", "ACWR", acwr, "Ratio", "SANTÉ", Color(0xFFEF4444), Icons.Default.MonitorHeart, 0.4f, listOf(0.8f, 0.9f, 1.1f, 1.2f, 1.0f)))
                list.add(MetricData("monotony", "MONOTONIE", mono, "Foster", "SANTÉ", Color(0xFFEF4444), Icons.Default.HorizontalRule, 0.3f, emptyList()))
                list.add(MetricData("ctl", "CTL (FITNESS)", state.ctl, "TSS/j", "CHARGE", Color(0xFFEF4444), Icons.Default.FitnessCenter, (state.ctl.toFloatOrNull() ?: 0f / 100f).coerceIn(0f, 1f), emptyList()))
                list.add(MetricData("atl", "ATL (FATIGUE)", state.fatigueATL?.toString() ?: "--", "TSS/j", "CHARGE", Color(0xFFEF4444), Icons.Default.BatteryAlert, (state.fatigueATL?.toFloat() ?: 0f / 120f).coerceIn(0f, 1f), emptyList()))
                list.add(MetricData("tsb", "TSB (FORM)", state.formTSB?.toString() ?: "--", "TSS", "CHARGE", Color(0xFFEF4444), Icons.Default.Balance, 0.5f, emptyList()))
            }
            
            // 4. FCM
            list.add(MetricData(
                id = "fcm",
                title = "FCM MAX",
                value = state.fcm.toString(),
                unit = "bpm",
                category = "PHYSIO",
                color = Color(0xFFEF4444), // Red
                icon = Icons.Default.Favorite,
                percentage = (state.fcm.toFloat() / 220f).coerceIn(0f, 1f),
                trend = listOf(190f, 190f, 189f, 189f, 188f, 188f)
            ))
            
            list
        }


        
        val (levelMetrics, otherMetrics) = remember(metrics) {
            val carouselIds = setOf("vma", "vo2max", "fcm", "ftp", "w_kg", "css", "vo2_swim", "vdot", "rai")
            metrics.partition { metric ->
                carouselIds.contains(metric.id) || metric.category == "NIVEAU"
            }
        }

        Column(modifier = Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "INDICES DE PERFORMANCE",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                letterSpacing = 2.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 16.dp)
            )
            AppCarousel(
                items = levelMetrics,
                modifier = Modifier.height(420.dp)
            ) { metric, _ ->
                MetricCard(metric = metric)
            }
        }

        // Bento Grid for Other Metrics
        if (otherMetrics.isNotEmpty()) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "ANALYSE APPROFONDIE",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                    letterSpacing = 2.sp,
                    fontWeight = FontWeight.Bold
                )

                // Bento Layout
                val chunks = otherMetrics.chunked(2)
                chunks.forEachIndexed { index, pair ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        pair.forEachIndexed { pairIndex, metric ->
                            // Vary the weight for a "bento" feel
                            val weight = if (index % 2 == 0) {
                                if (pairIndex == 0) 1.2f else 0.8f
                            } else {
                                if (pairIndex == 0) 0.8f else 1.2f
                            }
                            
                            BentoMetricCard(
                                metric = metric,
                                modifier = Modifier.weight(weight)
                            )
                        }
                    }
                }
            }
        }


        // Training Zones
        // Training Zones
        val zones = when(selectedSport) {
            "run" -> {
                val runZones = state.zones?.runZones
                if (runZones != null) {
                    runZones.pace.mapIndexed { index, pair ->
                        val label = when(index) {
                            0 -> "Z1 Récup"
                            1 -> "Z2 Easy"
                            2 -> "Z3 Tempo"
                            3 -> "Z4 Seuil"
                            else -> "Z5 Interval"
                        }
                        Zone(label, "${formatPace(pair.first)}-${formatPace(pair.second)}", (index + 1) * 0.2f, getColorForZone(index))
                    }
                } else {
                    listOf(
                        Zone("Z2 Endurance", "5:15-5:45", 0.6f, Color(0xFF3B82F6)),
                        Zone("Z4 Seuil", "4:12-4:25", 0.2f, Color(0xFFF97316))
                    )
                }
            }
            "swim" -> {
                val swimZones = state.zones?.swimZones
                if (swimZones != null) {
                     swimZones.pace.mapIndexed { index, pair ->
                        val label = when(index) {
                            0 -> "Z1 Recup"
                            1 -> "Z2 Endur"
                            2 -> "Z3 Seuil"
                            else -> "Z4 Vitesse"
                        }
                        Zone(label, "${pair.first}-${pair.second}", 0.2f, getColorForZone(index))
                     }
                } else {
                     listOf(
                        Zone("Endurance", "1:45/100M", 0.6f, Color(0xFF3B82F6)),
                        Zone("CSS Seuil", "1:22/100M", 0.2f, Color(0xFFF97316))
                    )
                }
            }
            else -> {
                 val bikeZones = state.zones?.bikeZones
                 if (bikeZones != null) {
                     bikeZones.power.mapIndexed { index, pair -> 
                        Zone("Z${index+1}", "${pair.first}-${pair.second}W", 0.15f, getColorForZone(index))
                     }
                 } else {
                     listOf(
                        Zone("Z4 FTP", "280-310W", 0.15f, Color(0xFFF97316)),
                        Zone("Z2 Endurance", "180-220W", 0.5f, Color(0xFF3B82F6))
                    )
                 }
            }
        }
        ZoneBar(title = "Zones d'Allure (Pace)", zones = zones)

        // Heart Rate Zones
        // Heart Rate Zones
        if (selectedSport == "run" || selectedSport == "bike") {
            val fcZonesRaw = if (selectedSport == "run") state.zones?.runZones?.fc else state.zones?.bikeZones?.hr
            val fcZones = if (fcZonesRaw != null) {
                fcZonesRaw.mapIndexed { index, pair ->
                    Zone("Z${index+1}", "${pair.first}-${pair.second}", 0.2f, getColorForZone(index))
                }
            } else {
                // Default placeholders if data missing
                listOf(
                    Zone("Z1", "100-120", 0.2f, getColorForZone(0)),
                    Zone("Z2", "120-140", 0.2f, getColorForZone(1)),
                    Zone("Z3", "140-160", 0.2f, getColorForZone(2)),
                    Zone("Z4", "160-175", 0.2f, getColorForZone(3)),
                    Zone("Z5", "175-190", 0.2f, getColorForZone(4))
                )
            }
            ZoneBar(title = "Zones Cardiaques (FC)", zones = fcZones)

            // Power Zones (Watts) - Only for Bike or if we had Stryd for Run (but here defaulting to Bike logic for simplicity or if Bike selected)
            if (selectedSport == "bike") {
                val powerZonesRaw = state.zones?.bikeZones?.power
                val powerZones = if (powerZonesRaw != null) {
                    powerZonesRaw.mapIndexed { index, pair ->
                        // Dynamic weights based on Coggan zones width
                        val weight = when(index) {
                            0 -> 0.55f // Z1
                            1 -> 0.20f // Z2
                            2 -> 0.15f // Z3
                            3 -> 0.15f // Z4
                            4 -> 0.15f // Z5
                            else -> 0.20f // Z6
                        }
                        Zone("Z${index+1}", "${pair.first}-${pair.second}W", weight, getColorForZone(index))
                    }
                } else {
                     listOf(
                        Zone("Z1 Recup", "<150W", 0.5f, getColorForZone(0)),
                        Zone("Z2 Endur", "150-200W", 0.2f, getColorForZone(1)),
                        Zone("Z3 Tempo", "200-240W", 0.15f, getColorForZone(2))
                    )
                }
                ZoneBar(title = "Zones de Puissance (Watts)", zones = powerZones)
            }
        }

        // Training Zones
        
        Spacer(modifier = Modifier.height(32.dp))

        // HEATMAP / ROUTES SECTION [NEW]
        Text(
            text = "CARTE DE CHALEUR & ITINÉRAIRES",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
            letterSpacing = 2.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(240.dp)
                .clip(RoundedCornerShape(32.dp))
                .background(Color(0xFF1C1C1E))
                .border(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), RoundedCornerShape(32.dp))
        ) {
            // Placeholder Map
            Icon(
                Icons.Default.Map,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                modifier = Modifier.fillMaxSize().padding(48.dp)
            )
            
            Column(
                modifier = Modifier.align(Alignment.BottomStart).padding(24.dp)
            ) {
                Text("VOS PARCOURS FAVORIS", style = MaterialTheme.typography.titleMedium, color = Color.White, fontWeight = FontWeight.Bold)
                Text("${state.activities.size} activités analysées géographiquement", style = MaterialTheme.typography.labelSmall, color = Color.White.copy(alpha = 0.5f))
            }
        }

        Spacer(modifier = Modifier.height(48.dp))
    }
}

// --- Flashcard Components ---

@Composable
fun BentoMetricCard(metric: MetricData, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(32.dp))
            .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.4f)) // Glass
            .border(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), RoundedCornerShape(32.dp))
            .padding(20.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(metric.icon, contentDescription = null, tint = metric.color, modifier = Modifier.size(16.dp))
                Box(
                    modifier = Modifier
                        .background(metric.color.copy(alpha = 0.1f), RoundedCornerShape(50))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(text = metric.category.uppercase(), style = MaterialTheme.typography.labelSmall, color = metric.color, fontSize = 8.sp, fontWeight = FontWeight.Black)
                }
            }
            Column {
                Text(text = metric.title.uppercase(), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = metric.value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.onSurface)
                Text(text = metric.unit.uppercase(), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f), fontSize = 10.sp)
            }
        }
    }
}

@Composable
fun MetricCard(metric: MetricData) {
    Card(
        modifier = Modifier.fillMaxSize(),
        shape = RoundedCornerShape(40.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.4f)),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f)),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 24.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                     Box(
                         modifier = Modifier.size(36.dp).clip(RoundedCornerShape(12.dp)).background(metric.color.copy(alpha = 0.1f)),
                         contentAlignment = Alignment.Center
                     ) {
                         Icon(imageVector = metric.icon, contentDescription = null, tint = metric.color, modifier = Modifier.size(18.dp))
                     }
                     Text(text = metric.title.uppercase(), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f), letterSpacing = 1.sp)
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            // Gauge & Value
            Box(contentAlignment = Alignment.Center) {
                CircularGauge(percentage = metric.percentage, color = metric.color)
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = metric.value,
                        style = MaterialTheme.typography.displayMedium,
                        fontWeight = FontWeight.Black,
                        color = MaterialTheme.colorScheme.onSurface,
                        fontSize = 38.sp
                    )
                    Text(text = metric.unit.uppercase(), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f), fontSize = 9.sp)
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Surface(
                color = metric.color.copy(alpha = 0.1f), 
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(
                    text = metric.category.uppercase(), 
                    style = MaterialTheme.typography.labelSmall, 
                    color = metric.color, 
                    fontWeight = FontWeight.Black,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                )
            }

            Spacer(modifier = Modifier.weight(1.2f))

            // Bottom Sparkline Section
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Sparkline(data = metric.trend, color = metric.color)
            }
        }
    }
}

@Composable
fun CircularGauge(percentage: Float, color: Color) {
    androidx.compose.foundation.Canvas(modifier = Modifier.size(140.dp)) {
        val strokeWidth = 8.dp.toPx()
        val radius = size.minDimension / 2 - strokeWidth
        
        // Background Arc
        drawCircle(
            color = Color.LightGray.copy(alpha = 0.2f),
            radius = radius,
            style = androidx.compose.ui.graphics.drawscope.Stroke(width = strokeWidth)
        )
        
        // Foreground Arc
        drawArc(
            color = color,
            startAngle = -90f,
            sweepAngle = 360 * percentage,
            useCenter = false,
            style = androidx.compose.ui.graphics.drawscope.Stroke(width = strokeWidth, cap = androidx.compose.ui.graphics.StrokeCap.Round)
        )
    }
}

@Composable
fun Sparkline(data: List<Float>, color: Color) {
    if (data.isEmpty()) return
    androidx.compose.foundation.Canvas(modifier = Modifier.width(100.dp).height(25.dp)) {
        val path = androidx.compose.ui.graphics.Path()
        val min = data.minOrNull() ?: 0f
        val max = data.maxOrNull() ?: 1f
        val range = if (max - min == 0f) 1f else max - min
        val stepX = size.width / (data.size - 1)
        
        data.forEachIndexed { index, value ->
            val x = index * stepX
            val y = size.height - ((value - min) / range) * size.height
            if (index == 0) path.moveTo(x, y) else path.lineTo(x, y)
        }
        
        drawPath(
            path = path,
            color = color,
            style = androidx.compose.ui.graphics.drawscope.Stroke(width = 2.dp.toPx(), cap = androidx.compose.ui.graphics.StrokeCap.Round, join = androidx.compose.ui.graphics.StrokeJoin.Round)
        )
    }
}
