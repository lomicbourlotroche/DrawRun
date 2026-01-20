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
        val fcm = calculateFCM(state.age.toIntOrNull() ?: 30, state.sex, state.weight.toDoubleOrNull() ?: 70.0)
        val rHR = state.restingHR.toIntOrNull() ?: 50
        val vma = calculateVMA(state.age.toIntOrNull() ?: 30, state.sex, state.weight.toDoubleOrNull() ?: 70.0, rHR)
        val vdot = 50.0 // Default or from PRs if implemented
        
        // 1. Run Zones
        val stravaHR = state.athleteZones?.heartRate
        val runFC = if (stravaHR != null && stravaHR.zones.size >= 5) {
            stravaHR.zones.map { it.min to it.max }
        } else {
            calculateKarvonenZones(fcm, rHR)
        }
        
        val runZones = RunZones(
            fc = runFC,
            pace = calculatePaceZones(vma),
            vma = vma
        )

        // 2. Bike Zones
        val stravaPower = state.athleteZones?.power
        val ftp = if (stravaPower != null && stravaPower.zones.size >= 4) {
             stravaPower.zones[3].max // Common proxy for threshold
        } else 250
        
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
    fun calculateFCM(age: Int, sex: String, weight: Double): Int {
        return if (sex == "H") {
            ((-0.007 * age.toDouble().pow(2.0) - 2.819 * age - 0.11 * weight + 1043.554) / 5.0).roundToInt()
        } else {
            ((-0.007 * age.toDouble().pow(2.0) - 2.819 * age - 0.11 * weight + 1042.554) / 5.0).roundToInt()
        }
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

    /**
     * Calcul des zones de vitesse fondées sur la méthode VDOT (Daniels)
     * Pourcentages de VMA approximés pour les zones E, M, T, I, R.
     */
    fun calculateSpeedZones(vma: Double): List<Pair<Double, Double>> {
        return listOf(
            (vma * 0.60) to (vma * 0.70), // Z1: Récupération
            (vma * 0.70) to (vma * 0.82), // Z2: Easy (Daniels E)
            (vma * 0.82) to (vma * 0.88), // Z3: Marathon / Tempo (Daniels M/T)
            (vma * 0.88) to (vma * 0.95), // Z4: Seuil (Daniels T)
            (vma * 0.95) to vma          // Z5: Intervalle (Daniels I / VMA)
        )
    }

    /**
     * Conversion vitesse (km/h) en allure (min/km)
     */
    fun speedToPace(speedKmH: Double): Double {
        if (speedKmH <= 0) return 0.0
        return 60.0 / speedKmH
    }

    fun calculatePaceZones(vma: Double): List<Pair<Double, Double>> {
        val speeds = calculateSpeedZones(vma)
        return speeds.map { speedToPace(it.second) to speedToPace(it.first) } // Allure min/km (rapide to lent)
    }

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

    /**
     * Calcul du VDOT (Jack Daniels)
     * Utilise une approximation de la formule de régression pour la course à pied.
     * VDOT est estimé à partir de la vitesse moyenne sur une distance donnée.
     * VDOT ~ Speed (m/min) -> Lookup Table or Formula.
     * Formule simplifiée de Daniels:
     * VO2Cost = 0.182258 * v + 0.000104 * v^2 - 4.60
     * %VO2Max = 0.8 + 0.1894393 * exp(-0.012778 * t) + 0.2989558 * exp(-0.1932605 * t)
     * VDOT = VO2Cost / %VO2Max
     */
    fun calculateVDOT(distanceMeters: Double, timeMinutes: Double): Double {
        if (timeMinutes <= 0) return 0.0
        val v = distanceMeters / timeMinutes // m/min
        
        // 1. Oxygen Cost (ml/kg/min)
        val vo2Cost = 0.182258 * v + 0.000104 * v.pow(2) - 4.60
        
        // 2. % VO2Max sustained for time t (minutes)
        val t = timeMinutes
        val percentMax = 0.8 + 0.1894393 * kotlin.math.exp(-0.012778 * t) + 0.2989558 * kotlin.math.exp(-0.1932605 * t)
        
        // 3. VDOT
        return vo2Cost / percentMax
    }

    /**
     * Zones d'allure Jack Daniels (Basées sur VDOT)
     */
    fun calculateJackDanielsPaces(vdot: Double): List<Pair<String, String>> {
        if (vdot <= 0) return emptyList()
        
        // Inverse Formula: Find Velocity (m/min) for a given VO2
        // VO2 = 0.182258 * v + 0.000104 * v^2 - 4.60
        // Rearrange quadratic: 0.000104*v^2 + 0.182258*v - (VO2 + 4.60) = 0
        fun solveVelocity(targetVO2: Double): Double {
            val a = 0.000104
            val b = 0.182258
            val c = -(targetVO2 + 4.60)
            val delta = b*b - 4*a*c
            return if (delta >= 0) (-b + kotlin.math.sqrt(delta)) / (2*a) else 0.0
        }

        fun fmt(speedMMin: Double): String {
            val pace = 1000.0 / speedMMin // min/km
            val m = pace.toInt()
            val s = ((pace - m) * 60).roundToInt()
            return "%d:%02d".format(m, s)
        }

        // Zones defined by % VO2Max (approximate for Pacing)
        // E (Easy): 59-74% VO2max -> Use ~70% center
        // M (Marathon): ~80-85% VO2max -> Use ~83%
        // T (Threshold): ~88-92% VO2max -> Use ~90%
        // I (Interval): ~98-100% VO2max -> Use ~99%
        // R (Repetition): >100% -> Use ~108% (Approx based on Mile pace)

        val vE1 = solveVelocity(vdot * 0.65)
        val vE2 = solveVelocity(vdot * 0.79)
        val vM = solveVelocity(vdot * 0.84) // Center of M zone
        val vT = solveVelocity(vdot * 0.90) // Threshold
        val vI = solveVelocity(vdot * 0.98) // VO2Max pace
        val vR = solveVelocity(vdot * 1.08) // Repetition pace (approx)

        return listOf(
            "Easy (E)" to "${fmt(vE1)}-${fmt(vE2)}",
            "Marathon (M)" to fmt(vM),
            "Seuil (T)" to fmt(vT),
            "Interval (I)" to fmt(vI),
            "Répétition (R)" to fmt(vR)
        )
    }

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
     * Analyse complète d'une séance (Court Terme)
     */
    fun analyzeActivity(type: String, streams: ActivityStreams, zones: TrainingZones? = null): ActivityAnalysis {
        val time = streams.time
        val hr = streams.heartRate
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
        val ef1 = if (type == "run") (pace?.subList(0, splitIndex)?.average() ?: 0.0) * 60.0 / hrHalf1 else (power?.subList(0, splitIndex)?.average() ?: 0.0) / hrHalf1
        val ef2 = if (type == "run") (pace?.subList(splitIndex, time.size)?.average() ?: 0.0) * 60.0 / hrHalf2 else (power?.subList(splitIndex, time.size)?.average() ?: 0.0) / hrHalf2
        
        val decoupling = if (ef1 > 0) (ef1 - ef2) / ef1 else 0.0

        // 3. Normalized Power / Pace & IF/TSS
        val avgSpeed = pace?.average() ?: 0.0 // m/s
        val thresholdSpeed = zones?.runZones?.vma?.let { it / 3.6 } ?: 4.0 // Default or VMA/3.6 to get m/s
        
        // Intensity Factor (IF)
        val intensityFactor = if (type == "run") {
            // Simplified Run IF: Avg Pace / Threshold Pace (or Velocity / Threshold Velocity)
            avgSpeed / thresholdSpeed
        } else {
            // Bike IF: Normalized Power / FTP (Simplified using average if NP logic not fully here)
            (power?.average() ?: 0.0) / (zones?.bikeZones?.ftp?.toDouble() ?: 250.0)
        }.coerceIn(0.5, 1.5)

        // Training Stress Score (TSS)
        // RSS (Running) or TSS (Bike) = (sec * IF^2) / 36
        val durationSec = time.lastOrNull() ?: 0
        val tss = (durationSec * intensityFactor * intensityFactor) / 36.0

        // Variability Index (VI)
        // Bike: NP / Avg Power. Run: GAP Avg / Pace Avg (approximation)
        val gapAvg = streams.gradAdjustedPace?.average() ?: avgSpeed
        val variabilityIndex = if (avgSpeed > 0) gapAvg / avgSpeed else 1.0

        // 4. Lap Data (per km)
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
                    
                    laps.add(LapInfo(
                        lapNumber = currentLap,
                        distance = lapDist,
                        duration = lapDur,
                        avgPace = lapPace,
                        avgHr = hr?.subList(distance.indexOfFirst { it >= lapStartDist }.coerceAtLeast(0), i + 1)?.average()?.toInt() ?: 0,
                        avgPower = power?.subList(distance.indexOfFirst { it >= lapStartDist }.coerceAtLeast(0), i + 1)?.average()?.toInt(),
                        elevationGain = (streams.altitude?.get(i) ?: 0.0) - (streams.altitude?.get(distance.indexOfFirst { it >= lapStartDist }.coerceAtLeast(0)) ?: 0.0)
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
            lapData = laps
        )
    }

    /**
     * Calcule le volume hebdomadaire maximum des 4 dernières semaines.
     */
    fun calculatePeakWeeklyVolume(activities: List<com.drawrun.app.ActivityItem>): Double {
        if (activities.isEmpty()) return 30.0 // Default baseline
        
        val now = LocalDate.now()
        val fourWeeksAgo = now.minusWeeks(4)
        
        val weeklyVolumes = mutableMapOf<Int, Double>()
        
        activities.filter { it.type == "run" }.forEach { act ->
            try {
                val date = LocalDate.parse(act.date)
                if (date.isAfter(fourWeeksAgo)) {
                    val weekOfYear = (ChronoUnit.DAYS.between(LocalDate.of(now.year, 1, 1), date) / 7).toInt()
                    val distVal = act.dist.replace("km", "").toDoubleOrNull() ?: 0.0
                    weeklyVolumes[weekOfYear] = (weeklyVolumes[weekOfYear] ?: 0.0) + distVal
                }
            } catch (e: Exception) { }
        }
        
        return (weeklyVolumes.values.maxOrNull() ?: 30.0).coerceAtLeast(20.0)
    }
}
