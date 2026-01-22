package com.drawrun.app.logic
import com.drawrun.app.AppState
import com.drawrun.app.ActivityStreams
import com.drawrun.app.ActivityAnalysis
import com.drawrun.app.LapInfo
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import kotlin.math.pow
import kotlin.math.roundToInt

data class TrainingZones(
    val runZones: RunZones,
    val bikeZones: BikeZones,
    val swimZones: SwimZones
)

data class RunZones(
    val fc: List<Pair<Int, Int>>, // Karvonen
    val pace: List<Pair<Double, Double>>, // VDOT based (min/km)
    val vma: Double
)

data class BikeZones(
    val power: List<Pair<Int, Int>>, // Coggan (Watts)
    val hr: List<Pair<Int, Int>>, // FTHR based (approx)
    val ftp: Int
)

data class SwimZones(
    val css: Double, // Critical Swim Speed (m/min)
    val pace: List<Pair<String, String>> // min/100m
)

object PerformanceAnalyzer {

    /**
     * Retourne les zones personnalisées basées sur Strava ou les calculs par défaut.
     */
    fun getPersonalizedZones(state: AppState): TrainingZones {
        val fcm = state.fcm // Use state derived
        val rHR = state.restingHR.toIntOrNull() ?: 50
        val vma = state.vma // Use state derived
        val vdot = state.vdot // Use state derived (ScienceEngine based)
        
        // 1. Run Zones
        val stravaHR = state.athleteZones?.heartRate
        val runFC = if (stravaHR != null && stravaHR.zones.size >= 5) {
            stravaHR.zones.map { it.min to it.max }
        } else {
            calculateKarvonenZones(fcm, rHR)
        }
        
        // Use VDOT for pace zones if available, improving consistency with Coach/Plan
        val paceZones = if (vdot > 0) {
            // Z1: Easy (Low to High)
            // Z2: Marathon (+/- 3%)
            // Z3: Threshold (+/- 3%)
            // Z4: Interval (+/- 2%)
            // Z5: Repetition (+/- 2%)
            
            // Helper: get min/km from intensity
            fun p(i: Double) = com.drawrun.app.logic.ScienceEngine.getPaceSeconds(vdot, i) / 60.0
            
            listOf(
                p(com.drawrun.app.logic.ScienceEngine.VdotZones.E_LOW) to p(com.drawrun.app.logic.ScienceEngine.VdotZones.E_HIGH),
                p(com.drawrun.app.logic.ScienceEngine.VdotZones.M * 0.97) to p(com.drawrun.app.logic.ScienceEngine.VdotZones.M * 1.03),
                p(com.drawrun.app.logic.ScienceEngine.VdotZones.T * 0.97) to p(com.drawrun.app.logic.ScienceEngine.VdotZones.T * 1.03),
                p(com.drawrun.app.logic.ScienceEngine.VdotZones.I * 0.98) to p(com.drawrun.app.logic.ScienceEngine.VdotZones.I * 1.02),
                p(com.drawrun.app.logic.ScienceEngine.VdotZones.R * 0.98) to p(com.drawrun.app.logic.ScienceEngine.VdotZones.R * 1.02)
            )
        } else {
             // Fallback VMA
             // Reuse deprecated logic if needed or reimplement simply
             val speeds = listOf(
                (vma * 0.60) to (vma * 0.75),
                (vma * 0.75) to (vma * 0.85),
                (vma * 0.85) to (vma * 0.92),
                (vma * 0.92) to (vma * 0.98),
                (vma * 0.98) to vma 
            )
            speeds.map { (60.0/it.second) to (60.0/it.first) }
        }
        
        val runZones = RunZones(
            fc = runFC,
            pace = paceZones,
            vma = vma
        )

        // 2. Bike Zones
        val stravaPower = state.athleteZones?.power
        val ftp = if (stravaPower != null && stravaPower.zones.size >= 4) {
             stravaPower.zones[3].max // Common proxy for threshold
        } else state.ftp.toIntOrNull() ?: 250
        
        val bikeZones = BikeZones(
            power = if (stravaPower != null) stravaPower.zones.map { it.min to it.max } else calculateCogganPowerZones(ftp),
            hr = runFC, // Strava doesn't always separate Run/Bike HR zones in this endpoint unless specific
            ftp = ftp
        )

        // 3. Swim Zones
        val swimZones = SwimZones(
            css = 1.6, // Default 1:40/100m
            pace = calculateSwimZones(1.6)
        )

        return TrainingZones(runZones, bikeZones, swimZones)
    }

    /**
     * Calcul de la FCM (Fréquence Cardiaque Maximale)
     * Formule hybride basée sur l'algorithme Python fourni.
     */
     // Keep for now or delegate to ScienceEngine.calculateFCM? 
     // PerformanceAnalyzer is the original source. ScienceEngine copied it.
     // AppState uses ScienceEngine now. So this is likely unused by App.
     // But for safety, let's keep it or delegate to ScienceEngine.
    fun calculateFCM(age: Int, sex: String, weight: Double): Int {
        return com.drawrun.app.logic.ScienceEngine.calculateFCM(age, sex, weight)
    }

    /**
     * Calcul du K dynamique pour VO2max (Ari Voutilainen)
     */
    fun calculateKDynamic(age: Int, sex: String, weight: Double, restingHR: Int): Double {
        val safeRestingHR = restingHR.coerceAtLeast(30) // Safety for impossible values
        val fcm = calculateFCM(age, sex, weight)
        return 9.2 + (1.9 * (fcm.toDouble() / safeRestingHR.toDouble()))
    }

    /**
     * Calcul du VO2max (Niels Uth)
     */
    fun calculateVO2Max(age: Int, sex: String, weight: Double, restingHR: Int): Double {
        val safeRestingHR = restingHR.coerceAtLeast(30)
        val fcm = calculateFCM(age, sex, weight)
        val k = calculateKDynamic(age, sex, weight, safeRestingHR)
        return k * (fcm.toDouble() / safeRestingHR.toDouble())
    }

    /**
     * Calcul de la VMA (Leger et Mercier)
     */
    fun calculateVMA(age: Int, sex: String, weight: Double, restingHR: Int): Double {
        val vo2Max = calculateVO2Max(age, sex, weight, restingHR)
        return (vo2Max - 2.209) / 3.163
    }

    /**
     * Calcul des zones de Karvonen (FC)
     */
    fun calculateKarvonenZones(fcm: Int, restingHR: Int): List<Pair<Int, Int>> {
        val hrReserve = fcm - restingHR
        return listOf(
            (restingHR + hrReserve * 0.50).roundToInt() to (restingHR + hrReserve * 0.60).roundToInt(),
            (restingHR + hrReserve * 0.60).roundToInt() to (restingHR + hrReserve * 0.70).roundToInt(),
            (restingHR + hrReserve * 0.70).roundToInt() to (restingHR + hrReserve * 0.80).roundToInt(),
            (restingHR + hrReserve * 0.80).roundToInt() to (restingHR + hrReserve * 0.90).roundToInt(),
            (restingHR + hrReserve * 0.90).roundToInt() to fcm
        )
    }

    // Removed calculateSpeedZones, speedToPace, calculatePaceZones -> Logic inlined/replaced
    
    /**
     * Calcul de la durée des phases (Modèle interne)
     */
    fun calculatePhaseDurations(goalDistance: Double, programDuration: Int): Triple<Int, Int, Int> {
        val kBase = 10.0
        val k = kBase + (goalDistance * 0.5)
        val sd = goalDistance / (21.0 + k)
        val general = ((40.0 + (30.0 * sd)) / 100.0 * programDuration).roundToInt()
        val tapering = (0.1 * programDuration).roundToInt()
        val specific = programDuration - general - tapering
        return Triple(general, specific, tapering)
    }

    // Removed calculateVDOT, calculateJackDanielsPaces

    /**
     * Calcul des zones de puissance (Coggan)
     * Basé sur la FTP (Functional Threshold Power)
     */
    fun calculateCogganPowerZones(ftp: Int): List<Pair<Int, Int>> {
        return listOf(
            0 to (ftp * 0.55).roundToInt(),
            (ftp * 0.56).roundToInt() to (ftp * 0.75).roundToInt(),
            (ftp * 0.76).roundToInt() to (ftp * 0.90).roundToInt(),
            (ftp * 0.91).roundToInt() to (ftp * 1.05).roundToInt(),
            (ftp * 1.06).roundToInt() to (ftp * 1.20).roundToInt(),
            (ftp * 1.21).roundToInt() to (ftp * 1.50).roundToInt()
        )
    }

    /**
     * Calcul des zones de natation (CSS)
     * Basé sur une allure CSS (m/min) ou temps/100m
     * Zones: Easy, Steady, Threshold, Sprint
     */
    fun calculateSwimZones(cssPaceMinPer100m: Double): List<Pair<String, String>> {
        // CSS Pace in seconds per 100m
        val cssSec = cssPaceMinPer100m * 60
        
        // Zones based on deviation from CSS (Maglischo)
        // Z1 (Recup): CSS + 10s+
        // Z2 (Endurance): CSS + 5-8s
        // Z3 (Seuil): CSS +/- 2s
        // Z4 (Vitesse): CSS - 4s+
        
        fun fmt(s: Double): String {
            val m = (s / 60).toInt()
            val sec = (s % 60).toInt()
            return "%d:%02d".format(m, sec)
        }

        return listOf(
            fmt(cssSec + 15.0) to fmt(cssSec + 10.0), // Z1: Easy
            fmt(cssSec + 10.0) to fmt(cssSec + 4.0), // Z2: Aerobic
            fmt(cssSec + 4.0) to fmt(cssSec - 2.0),  // Z3: Threshold (CSS)
            fmt(cssSec - 2.0) to fmt(cssSec - 10.0)  // Z4: Sprint/Anaerobic
        )
    }

    /**
     * Calcule la Vitesse Ascensionnelle Moyenne (VAM) en m/h
     */
    fun calculateVAM(altitudeStream: List<Double>, timeStream: List<Int>, windowSeconds: Int = 30): List<Double> {
        val vamStream = mutableListOf<Double>()
        for (i in timeStream.indices) {
            val startTime = timeStream[i] - windowSeconds
            val startIndex = timeStream.indexOfFirst { it >= startTime }.coerceAtLeast(0)
            
            val deltaZ = altitudeStream[i] - altitudeStream[startIndex]
            val deltaT = timeStream[i] - timeStream[startIndex]
            
            if (deltaT > 0) {
                vamStream.add((deltaZ / deltaT) * 3600.0)
            } else {
                vamStream.add(0.0)
            }
        }
        return vamStream
    }

    /**
     * Calcule la Dérivée Cardiaque (dHR/dt)
     */
    fun calculateHRDerivative(hrStream: List<Int>, timeStream: List<Int>, windowSeconds: Int = 10): List<Double> {
        val derivative = mutableListOf<Double>()
        for (i in timeStream.indices) {
            val startTime = timeStream[i] - windowSeconds
            val startIndex = timeStream.indexOfFirst { it >= startTime }.coerceAtLeast(0)
            
            val deltaHR = hrStream[i] - hrStream[startIndex]
            val deltaT = timeStream[i] - timeStream[startIndex]
            
            if (deltaT > 0) {
                derivative.add(deltaHR.toDouble() / deltaT.toDouble())
            } else {
                derivative.add(0.0)
            }
        }
        return derivative
    }

    /**
     * Calcule la GAP (Grade Adjusted Pace) simplifiée
     * Basée sur une approximation Strava/Minetti
     */
    fun calculateGAP(paceStream: List<Double>, altitudeStream: List<Double>, distanceStream: List<Double>): List<Double> {
        val gapStream = mutableListOf<Double>()
        for (i in paceStream.indices) {
            if (i == 0) {
                gapStream.add(paceStream[i])
                continue
            }
            
            val deltaZ = altitudeStream[i] - altitudeStream[i-1]
            val deltaD = distanceStream[i] - distanceStream[i-1]
            val grade = if (deltaD > 0) deltaZ / deltaD else 0.0
            
            // Approximation: Factor = 1 + 9 * grade (simplified)
            // Real GAP is more non-linear (more cost uphill, less cost downhill up to a point)
            val factor = 1.0 + (9.0 * grade)
            gapStream.add(paceStream[i] * factor.coerceAtLeast(0.5))
        }
        return gapStream
    }

    /**
     * Calcule la Puissance Normalisée (NP) - Modèle Coggan
     * Delegates to ScienceEngine for consistency
     */
    fun calculateNP(powerStream: List<Int>?): Double? {
        return com.drawrun.app.logic.ScienceEngine.calculateNormalizedPower(powerStream ?: return null)
    }

    /**
     * Calcule la distribution du temps passé dans chaque zone (en pourcentage)
     */
    fun calculateZoneDistribution(dataStream: List<Double>?, zones: List<Pair<Double, Double>>): List<Double> {
        if (dataStream == null || dataStream.isEmpty() || zones.isEmpty()) return emptyList()
        val counts = DoubleArray(zones.size)
        
        dataStream.forEach { value ->
            for (i in zones.indices) {
                if (value >= zones[i].first && value <= zones[i].second) {
                    counts[i]++
                    break
                }
            }
        }
        
        val total = counts.sum()
        if (total == 0.0) return List(zones.size) { 0.0 }
        return counts.map { (it / total) * 100.0 }
    }

    /**
     * Analyse complète d'une séance (Court Terme)
     */
    fun analyzeActivity(type: String, streams: ActivityStreams, zones: TrainingZones? = null): ActivityAnalysis {
        val time = streams.time
        val hr = streams.heartRate?.map { it.toDouble() }
        val pace = streams.pace
        val power = streams.power
        val distance = streams.distance ?: emptyList()

        // 1. Efficiency Factor (EF)
        val avgHR = hr?.average() ?: 1.0
        val ef = when(type) {
            "run" -> (pace?.average() ?: 0.0) * 60.0 / avgHR // EF in m/min / HR
            "bike" -> (power?.average() ?: 0.0) / avgHR // Power / HR
            else -> null
        }

        // 2. Aerobic Decoupling (Comparison 1st half vs 2nd half)
        val splitIndex = time.size / 2
        val hrHalf1 = hr?.subList(0, splitIndex)?.average() ?: 1.0
        val hrHalf2 = hr?.subList(splitIndex, time.size)?.average() ?: 1.0
        val ef1 = if (type == "run") (pace?.subList(0, splitIndex)?.average() ?: 0.0) * 60.0 / hrHalf1 else (power?.subList(0, splitIndex)?.average()?.toDouble() ?: 0.0) / hrHalf1
        val ef2 = if (type == "run") (pace?.subList(splitIndex, time.size)?.average() ?: 0.0) * 60.0 / hrHalf2 else (power?.subList(splitIndex, time.size)?.average()?.toDouble() ?: 0.0) / hrHalf2
        
        val decoupling = if (ef1 > 0) (ef1 - ef2) / ef1 else 0.0

        // 3. NP/IF/TSS logic
        val normalizedPower = if (type == "bike") calculateNP(power) else null
        val normalizedSpeed = if (type == "run") streams.gradAdjustedPace?.average() else null
        
        val thresholdBike = zones?.bikeZones?.ftp?.toDouble() ?: 250.0
        val thresholdRun = zones?.runZones?.vma?.let { (it * 0.9) / 3.6 } ?: 4.0 // Threshold in m/s
        
        val intensityFactor = if (type == "bike") {
            (normalizedPower ?: (power?.average()?.toDouble() ?: 0.0)) / thresholdBike
        } else {
            (normalizedSpeed ?: (pace?.average() ?: 0.0)) / thresholdRun
        }.coerceIn(0.4, 1.4)

        val durationSec = time.lastOrNull() ?: 0
        val tss = (durationSec * intensityFactor * intensityFactor * 100.0) / 3600.0

        // 4. Distributions
        val hrDist = hr?.let { calculateZoneDistribution(it, zones?.runZones?.fc?.map { it.first.toDouble() to it.second.toDouble() } ?: emptyList()) }
        val pwrDist = power?.let { calculateZoneDistribution(it.map { it.toDouble() }, zones?.bikeZones?.power?.map { it.first.toDouble() to it.second.toDouble() } ?: emptyList()) }
        val paceDist = pace?.let { calculateZoneDistribution(it, zones?.runZones?.pace ?: emptyList()) }

        val gapAvg = streams.gradAdjustedPace?.average() ?: (pace?.average() ?: 0.0)
        val variabilityIndex = if (type == "bike") {
            val avgP = power?.average()?.toDouble() ?: 1.0
            (normalizedPower ?: avgP) / avgP
        } else {
            gapAvg / (pace?.average() ?: 1.0)
        }

        // 5. Lap Data (per km)
        val laps = mutableListOf<LapInfo>()
        if (distance.isNotEmpty()) {
            var currentLap = 1
            var lapStartTime = 0
            var lapStartDist = 0.0
            
            for (i in distance.indices) {
                if (distance[i] >= currentLap * 1000.0 || i == distance.size - 1) {
                    val lapDist = distance[i] - lapStartDist
                    val lapDur = time[i] - lapStartTime
                    val lapPace = if (lapDur > 0) {
                        val p = lapDur.toDouble() / (lapDist / 1000.0)
                        "%d:%02d".format((p / 60).toInt(), (p % 60).toInt())
                    } else "--:--"
                    
                    val startIndex = distance.indexOfFirst { it >= lapStartDist }.coerceAtLeast(0)
                    laps.add(LapInfo(
                        lapNumber = currentLap,
                        distance = lapDist,
                        duration = lapDur,
                        avgPace = lapPace,
                        avgHr = streams.heartRate?.subList(startIndex, i + 1)?.average()?.toInt() ?: 0,
                        avgPower = streams.power?.subList(startIndex, i + 1)?.average()?.toInt(),
                        elevationGain = (streams.altitude?.get(i) ?: 0.0) - (streams.altitude?.get(startIndex) ?: 0.0)
                    ))
                    
                    lapStartDist = distance[i]
                    lapStartTime = time[i]
                    currentLap++
                }
            }
        }

        return ActivityAnalysis(
            efficiencyFactor = ef,
            aerobicDecoupling = decoupling,
            intensityFactor = intensityFactor,
            tss = tss,
            variabilityIndex = variabilityIndex,
            lapData = laps,
            normalizedPower = normalizedPower,
            normalizedSpeed = normalizedSpeed,
            trimp = calculateEdwardsTRIMP(durationSec, avgHR.toInt(), calculateFCM(30, "H", 70.0)), // Use FCM logic
            vam = streams.vam?.average(),
            hrZoneDistribution = hrDist,
            powerZoneDistribution = pwrDist,
            paceZoneDistribution = paceDist,
            swolf = if (type == "swim") (60 / (pace?.average() ?: 1.0)).toInt() + 20 else null, // Placeholder Swolf
            strokeRate = if (type == "swim") 32 else null
        )
    }

    /**
     * Calcule le TRIMP (Training Impulse) basé sur les zones cardiaques.
     * Basé sur la méthode d'Edwards : Durée * Facteur de Zone.
     */
    fun calculateEdwardsTRIMP(durationSec: Int, avgHR: Int, fcm: Int): Double {
        if (fcm <= 0) return 0.0
        val intensity = avgHR.toDouble() / fcm.toDouble()
        val factor = when {
            intensity >= 0.9 -> 5.0
            intensity >= 0.8 -> 4.0
            intensity >= 0.7 -> 3.0
            intensity >= 0.6 -> 2.0
            else -> 1.0
        }
        return (durationSec / 60.0) * factor
    }

    /**
     * Calcule le PMC (Performance Management Chart) pour une liste d'activités.
     * Retoure une liste de PmcDataPoint (CTL, ATL, TSB).
     */
    fun calculatePMC(activities: List<com.drawrun.app.ActivityItem>): List<com.drawrun.app.PmcDataPoint> {
        if (activities.isEmpty()) return emptyList()

        // Filtrer les activités valides et trier par date
        val sorted = activities.filter { it.date.matches(Regex("\\d{4}-\\d{2}-\\d{2}")) }
            .sortedBy { it.date }
        
        if (sorted.isEmpty()) return emptyList()

        val startDate = java.time.LocalDate.parse(sorted.first().date)
        val endDate = java.time.LocalDate.now()
        val days = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate).toInt()

        val result = mutableListOf<com.drawrun.app.PmcDataPoint>()
        
        var currentCTL = 0.0
        var currentATL = 0.0
        
        val ctlAlpha = 1.0 - kotlin.math.exp(-1.0 / 42.0)
        val atlAlpha = 1.0 - kotlin.math.exp(-1.0 / 7.0)

        // Nous itérons jour par jour pour simuler la dégradation de la forme et de la fatigue
        for (i in 0..days) {
            val currentDate = startDate.plusDays(i.toLong())
            val dateStr = currentDate.toString()
            
            // Somme des TSS du jour (on extrait la valeur numérique de la chaîne "TSS 85")
            val dayTSS = sorted.filter { it.date == dateStr }.sumOf { 
                it.load.replace(Regex("[^0.9.-]"), "").toDoubleOrNull() ?: 0.0
            }

            // Application des formules de Banister (EMA)
            currentCTL = currentCTL * (1.0 - ctlAlpha) + dayTSS * ctlAlpha
            currentATL = currentATL * (1.0 - atlAlpha) + dayTSS * atlAlpha
            val tsb = currentCTL - currentATL

            result.add(com.drawrun.app.PmcDataPoint(dateStr, currentCTL, currentATL, tsb))
        }

        return result
    }

    /**
     * Calcule le volume hebdomadaire maximum des 4 dernières semaines.
     */
    fun calculatePeakWeeklyVolume(activities: List<com.drawrun.app.ActivityItem>): Double {
        if (activities.isEmpty()) return 30.0 // Default baseline
        
        val now = java.time.LocalDate.now()
        val fourWeeksAgo = now.minusWeeks(4)
        
        val weeklyVolumes = mutableMapOf<Int, Double>()
        
        activities.filter { it.type == "run" }.forEach { act ->
            try {
                val date = java.time.LocalDate.parse(act.date)
                if (date.isAfter(fourWeeksAgo)) {
                    val weekOfYear = (java.time.temporal.ChronoUnit.DAYS.between(java.time.LocalDate.of(now.year, 1, 1), date) / 7).toInt()
                    val distVal = act.dist.replace("km", "").toDoubleOrNull() ?: 0.0
                    weeklyVolumes[weekOfYear] = (weeklyVolumes[weekOfYear] ?: 0.0) + distVal
                }
            } catch (e: Exception) { }
        }
        
        return (weeklyVolumes.values.maxOrNull() ?: 30.0).coerceAtLeast(20.0)
    }
}
