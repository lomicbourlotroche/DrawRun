package com.drawrun.app.logic

import kotlin.math.pow
import kotlin.math.roundToInt
import kotlin.math.exp
import kotlin.math.sqrt

/**
 * ScienceEngine: Single Source of Truth for all scientific calculations in DrawRun.
 * Centralizes VDOT, VO2Max, Pacing, and Heart Rate Logic.
 */
object ScienceEngine {

    // ============================================================================================
    // 1. DATA STRUCTURES & CONSTANTS
    // ============================================================================================

    // VDOT Intensity Zones (% of VDOT Velocity)
    object VdotZones {
        const val E_LOW = 0.65
        const val E_HIGH = 0.79
        const val M = 0.84
        const val T = 0.90
        const val I = 0.98
        const val R = 1.08 // Repetition speed commonly ~105-110% of VO2Max speed
    }

    data class ZoneRange(val min: Double, val max: Double, val label: String)

    // ============================================================================================
    // 2. PARSING & FORMATTING (Standardized)
    // ============================================================================================

    /**
     * Parses "5:30", "5:30 /km", "12.5 km/h" into Seconds per Km (Pace).
     * Returns 0.0 if invalid.
     */
    fun parsePaceToSeconds(input: String): Double {
        val clean = input.replace("/km", "").replace("min/km", "").trim()
        
        // Case: "12.5 km/h" -> Convert speed to pace
        if (input.contains("km/h")) {
            val speed = input.replace("km/h", "").trim().replace(",", ".").toDoubleOrNull() ?: 0.0
            return if (speed > 0) 3600.0 / speed else 0.0
        }

        // Case: "5:30" (min:sec)
        if (clean.contains(":")) {
            val parts = clean.split(":")
            if (parts.size == 2) {
                val m = parts[0].toIntOrNull() ?: 0
                val s = parts[1].toIntOrNull() ?: 0
                return (m * 60 + s).toDouble()
            }
        }
        
        // Case: Raw double (rare, but maybe minutes)
        return (clean.toDoubleOrNull() ?: 0.0) * 60.0
    }

    /**
     * Parsing distance string "10km", "42.2", "5,200m" -> Meters
     */
    fun parseDistanceToMeters(input: String): Double {
        var s = input.lowercase().trim()
        val isKm = s.contains("km") || (!s.contains("m") && s.replace(",", ".").toDoubleOrNull() ?: 0.0 < 1000.0)
        
        s = s.replace("km", "").replace("m", "").replace(",", ".")
        val valDouble = s.toDoubleOrNull() ?: 0.0
        
        return if (isKm) valDouble * 1000.0 else valDouble
    }

    /**
     * Formats seconds per km into "MM:SS"
     */
    fun formatPace(secondsPerKm: Double): String {
        if (secondsPerKm <= 0 || secondsPerKm > 3600) return "--:--"
        val m = secondsPerKm.toInt() / 60
        val s = secondsPerKm.toInt() % 60
        return "%d:%02d".format(m, s)
    }

    /**
     * Parse duration string "1h20", "45:30" -> Seconds
     */
    fun parseDurationSeconds(input: String): Double {
        try {
            if (input.contains("h")) {
                val parts = input.split("h")
                val hours = parts[0].trim().toIntOrNull() ?: 0
                val mins = parts.getOrNull(1)?.trim()?.toIntOrNull() ?: 0
                return (hours * 3600 + mins * 60).toDouble()
            } else if (input.contains(":")) {
                val parts = input.split(":")
                if (parts.size == 2) {
                    val m = parts[0].trim().toIntOrNull() ?: 0
                    val s = parts[1].trim().toIntOrNull() ?: 0
                    return (m * 60 + s).toDouble()
                } else if (parts.size == 3) {
                    val h = parts[0].trim().toIntOrNull() ?: 0
                    val m = parts[1].trim().toIntOrNull() ?: 0
                    val s = parts[2].trim().toIntOrNull() ?: 0
                    return (h * 3600 + m * 60 + s).toDouble()
                }
            }
        } catch (e: Exception) {}
        return 0.0
    }

    // ============================================================================================
    // 3. PHYSIOLOGY (VO2, VDOT, HR)
    // ============================================================================================

    /**
     * Calculates VDOT from a race result (Jack Daniels).
     * Uses iterative approximation or formula.
     */
    fun calculateVDOT(distanceMeters: Double, timeMinutes: Double): Double {
        if (timeMinutes <= 0 || distanceMeters <= 0) return 0.0
        
        val v = distanceMeters / timeMinutes // meters/min
        
        // 1. Oxygen Cost (ml/kg/min)
        // VO2 = 0.182258 * v + 0.000104 * v^2 - 4.60
        val vo2Cost = 0.182258 * v + 0.000104 * v.pow(2) - 4.60
        
        // 2. % VO2Max sustained for time t (minutes)
        // %Max = 0.8 + 0.1894393 * e^(-0.012778*t) + 0.2989558 * e^(-0.1932605*t)
        val t = timeMinutes
        val percentMax = 0.8 + 0.1894393 * exp(-0.012778 * t) + 0.2989558 * exp(-0.1932605 * t)
        
        // 3. VDOT
        return vo2Cost / percentMax
    }

    /**
     * Inverse VDOT: Find Velocity (m/min) for a given Activity Intensity (% of VDOT).
     * Solves quadratic equation: 0.000104*v^2 + 0.182258*v - (VO2_Target + 4.60) = 0
     */
    fun getVelocityFromVDOT(vdot: Double, intensityFactor: Double): Double {
        // Target VO2 for this intensity
        val targetVO2 = vdot * intensityFactor
        
        val a = 0.000104
        val b = 0.182258
        val c = -(targetVO2 + 4.60)
        
        val delta = b*b - 4*a*c
        if (delta < 0) return 0.0
        
        return (-b + sqrt(delta)) / (2*a) // m/min
    }

    /**
     * Returns pace (sec/km) for a given VDOT and intensity.
     */
    fun getPaceSeconds(vdot: Double, intensity: Double): Double {
        val vMetersPerMin = getVelocityFromVDOT(vdot, intensity)
        if (vMetersPerMin <= 0) return 0.0
        return 1000.0 / vMetersPerMin * 60.0 // sec/km
    }

    // ============================================================================================
    // 4. GENERATORS
    // ============================================================================================

    /**
     * Generates standard training zones based on VDOT.
     * Returns Map<ZoneName, PaceRangeString>
     */
    fun getTrainingPaces(vdot: Double): Map<String, String> {
        if (vdot <= 10.0) return emptyMap()

        val pE = getPaceSeconds(vdot, 0.70) // ~70% as avg E
        val pM = getPaceSeconds(vdot, VdotZones.M)
        val pT = getPaceSeconds(vdot, VdotZones.T)
        val pI = getPaceSeconds(vdot, VdotZones.I)
        val pR = getPaceSeconds(vdot, VdotZones.R)

        // For Easy zone, we usually give a range (65-79%)
        val pE_slow = getPaceSeconds(vdot, VdotZones.E_LOW)
        val pE_fast = getPaceSeconds(vdot, VdotZones.E_HIGH)

        return mapOf(
            "E" to "${formatPace(pE_fast)} - ${formatPace(pE_slow)}", // Fast to Slow (lower value first) ?? Usually people want min/km.. lower is faster. 
            // formatPace(300) = 5:00. formatPace(360) = 6:00. So pE_fast is smaller number.
            "M" to formatPace(pM),
            "T" to formatPace(pT),
            "I" to formatPace(pI),
            "R" to formatPace(pR)
        )
    }

    /**
     * Standard MAX Heart Rate Formula (Tanaka/Gellish/etc)
     * We stick to the one used in PerformanceAnalyzer for consistency but cleaner.
     */
    fun calculateMaxHR(age: Int): Int {
        // Simple Tanaka: 208 - 0.7 * age
        return (208 - 0.7 * age).roundToInt()
    }

    /**
     * Advanced FCM Calculation (Polynomial)
     * Copied from PerformanceAnalyzer to centralize logic.
     */
    fun calculateFCM(age: Int, sex: String, weight: Double): Int {
        return if (sex == "H") {
            ((-0.007 * age.toDouble().pow(2.0) - 2.819 * age - 0.11 * weight + 1043.554) / 5.0).roundToInt()
        } else {
            ((-0.007 * age.toDouble().pow(2.0) - 2.819 * age - 0.11 * weight + 1042.554) / 5.0).roundToInt()
        }
    }

    // ============================================================================================
    // 5. ADVANCED METRICS (TSS, TRIMP, NP, IF)
    // ============================================================================================

    /**
     * TSS (Training Stress Score) - Coggan
     * Based on Intensity Factor and duration
     */
    fun calculateTSS(durationSeconds: Int, intensityFactor: Double): Double {
        // TSS = (duration_hours * IF^2 * 100)
        val durationHours = durationSeconds / 3600.0
        return durationHours * intensityFactor.pow(2) * 100.0
    }

    /**
     * TRIMP (Training Impulse) - Edwards Method
     * Based on HR zones and duration
     */
    fun calculateEdwardsTRIMP(durationSeconds: Int, avgHR: Int, maxHR: Int): Double {
        if (maxHR <= 0) return 0.0
        val intensity = avgHR.toDouble() / maxHR.toDouble()
        
        val zoneFactor = when {
            intensity >= 0.9 -> 5.0
            intensity >= 0.8 -> 4.0
            intensity >= 0.7 -> 3.0
            intensity >= 0.6 -> 2.0
            else -> 1.0
        }
        
        return (durationSeconds / 60.0) * zoneFactor
    }

    /**
     * Normalized Power (NP) - Coggan Model for Cycling
     * 30s rolling average, then 4th power, then 4th root
     */
    fun calculateNormalizedPower(powerStream: List<Int>): Double? {
        if (powerStream.isEmpty()) return null
        
        // 1. 30s rolling average
        val rollingAvg = mutableListOf<Double>()
        for (i in powerStream.indices) {
            val window = powerStream.subList(kotlin.math.max(0, i - 29), i + 1)
            rollingAvg.add(window.average())
        }
        
        // 2. Raise to 4th power, average, then 4th root
        val avgFourth = rollingAvg.map { it.pow(4.0) }.average()
        return avgFourth.pow(0.25)
    }

    /**
     * Intensity Factor (IF)
     * IF = NP / FTP (cycling) or NGP / Threshold Pace (running)
     */
    fun calculateIntensityFactor(normalizedValue: Double, thresholdValue: Double): Double {
        if (thresholdValue <= 0) return 0.0
        return (normalizedValue / thresholdValue).coerceIn(0.0, 2.0)
    }

    // ============================================================================================
    // 6. PERFORMANCE PREDICTIONS & PROFILES
    // ============================================================================================

    /**
     * Age Grading (WMA Standards)
     * Adjusts performance based on age and sex
     * Returns percentage of world record for age/sex
     */
    fun calculateAgeGrading(
        distanceMeters: Double,
        timeSeconds: Double,
        age: Int,
        sex: String
    ): Double {
        // WMA Age Grading factors (simplified - full table would be extensive)
        // Factor represents % of peak performance
        val ageFactor = when {
            age < 30 -> 1.0
            age < 35 -> if (sex == "H") 0.98 else 0.97
            age < 40 -> if (sex == "H") 0.95 else 0.94
            age < 45 -> if (sex == "H") 0.92 else 0.90
            age < 50 -> if (sex == "H") 0.88 else 0.86
            age < 55 -> if (sex == "H") 0.84 else 0.81
            age < 60 -> if (sex == "H") 0.79 else 0.76
            age < 65 -> if (sex == "H") 0.74 else 0.70
            age < 70 -> if (sex == "H") 0.68 else 0.64
            else -> if (sex == "H") 0.60 else 0.55
        }
        
        // World record times (approximate for common distances)
        val worldRecordSeconds = when (distanceMeters) {
            5000.0 -> if (sex == "H") 757.0 else 851.0    // 12:37 vs 14:11
            10000.0 -> if (sex == "H") 1577.0 else 1751.0  // 26:17 vs 29:11
            21097.0 -> if (sex == "H") 3474.0 else 3866.0  // 57:54 vs 1:04:26
            42195.0 -> if (sex == "H") 7260.0 else 8070.0  // 2:01:00 vs 2:14:30
            else -> return 0.0
        }
        
        // Age graded time = actual time / age factor
        val ageGradedTime = timeSeconds / ageFactor
        
        // Percentage = (world record / age graded time) * 100
        return (worldRecordSeconds / ageGradedTime) * 100.0
    }

    /**
     * W' (W Prime) - Anaerobic Capacity for Cycling
     * Estimated from Critical Power (CP) and FTP
     * W' = energy available above CP
     */
    fun calculateWPrime(ftp: Int, bestEfforts: Map<Int, Int>): Double {
        // Simplified model: W' from 1min and 5min power
        // W' ≈ (P1min - CP) * 60s where CP ≈ FTP
        val p1min = bestEfforts[60] ?: (ftp * 1.5).toInt()
        val p5min = bestEfforts[300] ?: (ftp * 1.15).toInt()
        
        // More accurate: use hyperbolic model
        // P = W'/t + CP
        // Solving for W' from two data points
        val t1 = 60.0
        val t2 = 300.0
        val p1 = p1min.toDouble()
        val p2 = p5min.toDouble()
        
        // W' = (p1 - p2) * (t1 * t2) / (t2 - t1)
        return ((p1 - p2) * (t1 * t2) / (t2 - t1)).coerceAtLeast(0.0)
    }

    /**
     * RAI (Run Activity Index)
     * Similar to VDOT but with different calibration
     * RAI = VDOT * adjustment factor based on training load
     */
    fun calculateRAI(vdot: Double, weeklyKm: Double, longestRun: Double): Double {
        // RAI adjusts VDOT based on training volume
        val volumeFactor = when {
            weeklyKm < 30 -> 0.95
            weeklyKm < 50 -> 1.0
            weeklyKm < 70 -> 1.03
            weeklyKm < 90 -> 1.05
            else -> 1.07
        }
        
        val longRunFactor = when {
            longestRun < 15 -> 0.97
            longestRun < 25 -> 1.0
            longestRun < 32 -> 1.02
            else -> 1.03
        }
        
        return vdot * volumeFactor * longRunFactor
    }

    /**
     * Marathon Time Prediction
     * Based on VDOT and Riegel formula
     */
    fun predictMarathonTime(vdot: Double): String {
        // Use VDOT to get marathon pace
        val marathonPaceSeconds = getPaceSeconds(vdot, VdotZones.M)
        val marathonTimeSeconds = marathonPaceSeconds * 42.195
        
        val hours = (marathonTimeSeconds / 3600).toInt()
        val minutes = ((marathonTimeSeconds % 3600) / 60).toInt()
        val seconds = (marathonTimeSeconds % 60).toInt()
        
        return "%d:%02d:%02d".format(hours, minutes, seconds)
    }

    /**
     * Riegel Formula for Race Prediction
     * T2 = T1 * (D2/D1)^1.06
     */
    fun predictRaceTime(
        knownDistanceMeters: Double,
        knownTimeSeconds: Double,
        targetDistanceMeters: Double
    ): Double {
        val ratio = targetDistanceMeters / knownDistanceMeters
        return knownTimeSeconds * ratio.pow(1.06)
    }

    /**
     * Cycling Profile Classification
     * Based on W'/kg, FTP/kg, and power curve
     */
    fun determineCyclingProfile(
        ftp: Int,
        weightKg: Double,
        wPrime: Double,
        p5s: Int?,
        p1min: Int?
    ): String {
        val ftpPerKg = ftp / weightKg
        val wPrimePerKg = wPrime / weightKg
        
        val sprintPower = p5s?.let { it / weightKg } ?: 0.0
        val anaerobicPower = p1min?.let { it / weightKg } ?: 0.0
        
        return when {
            sprintPower > 20.0 && anaerobicPower > 10.0 -> "Sprinter"
            ftpPerKg > 4.5 && wPrimePerKg < 200 -> "Grimpeur"
            ftpPerKg > 4.0 && wPrimePerKg in 200.0..300.0 -> "Puncheur"
            ftpPerKg > 3.5 -> "Rouleur"
            else -> "En développement"
        }
    }

    /**
     * Swimming Profile Classification
     * Based on best times ratio
     */
    fun determineSwimmingProfile(
        best50m: Double?,
        best200m: Double?,
        best800m: Double?,
        best1500m: Double?
    ): String {
        if (best200m == null || best800m == null) return "Données insuffisantes"
        
        // Compare pace degradation
        val pace200 = best200m / 2.0 // per 100m
        val pace800 = best800m / 8.0
        
        val degradation = (pace800 - pace200) / pace200
        
        return when {
            degradation < 0.10 -> "Distance (Endurance)"
            degradation < 0.15 -> "Middle Distance"
            else -> "Sprint"
        }
    }
}
