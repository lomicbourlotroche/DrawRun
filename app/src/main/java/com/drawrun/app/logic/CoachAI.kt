package com.drawrun.app.logic

import com.drawrun.app.AppState
import com.drawrun.app.logic.TrainingPlanGenerator
import java.time.LocalDate
import java.time.format.TextStyle
import java.util.Locale

object CoachAI {

    // Training zones removed -> Use ScienceEngine.VdotZones

    data class ReadinessFactors(
        val hrv: Int,           // Variabilité cardiaque en ms (base: 60ms)
        val sleepQuality: Int,  // 1-10
        val muscleSoreness: Int // 1-10 (10 = très douloureux)
    )

    data class TrainingRecommendation(
        val title: String,
        val type: String,              // "E", "M", "T", "I", "R", "REST"
        val subtitle: String,
        val description: String,
        val advice: String,
        val isFromPlan: Boolean,
        val duration: Int = 0,             // Durée totale en minutes
        val structure: List<String> = emptyList(),   // Étapes de la séance
        val targetPace: String? = null,       // Allure cible (ex: "4:30")
        val hrZone: String? = null,           // Zone FC (ex: "165-175 bpm")
        val physiologicalGain: String = "", // Gain attendu
        val weatherWarning: String? = null,   // Alerte météo si nécessaire
        val intensityColor: String = "green"     // "green", "orange", "purple", "red", "blue"
    )

    /**
     * Calculate readiness score based on HRV, sleep quality, and muscle soreness
     */
    fun calculateReadiness(factors: ReadinessFactors): Int {
        // HRV based on 60ms baseline for 100%
        val hrvScore = minOf(100, ((factors.hrv.toDouble() / 60.0) * 100).toInt())
        
        // Sommeil (1-10) -> 0-100
        val sleepScore = factors.sleepQuality * 10
        
        // Douleurs inversées (10 douloureux -> 0 points)
        val sorenessScore = (10 - factors.muscleSoreness) * 10
        
        // Pondération : HRV est roi (50%), sommeil (30%), douleurs (20%)
        return ((hrvScore * 0.5) + (sleepScore * 0.3) + (sorenessScore * 0.2)).toInt()
    }

    /**
     * Calculate Training Stress Score (TSS)
     */
    fun calculateTSS(
        durationMin: Int,
        avgHR: Int,
        maxHR: Int,
        restingHR: Int
    ): Int {
        val hrReserve = maxHR - restingHR
        if (hrReserve <= 0) return 0
        
        val hrZone = (avgHR - restingHR).toDouble() / hrReserve
        
        // Facteur de pondération exponentiel pour l'intensité
        val intensityFactor = 0.64 * Math.exp(1.92 * hrZone)
        
        return (durationMin * intensityFactor).toInt()
    }

    // getPaceFromVDOT Removed -> Use ScienceEngine methods

    fun getDailyTraining(state: AppState): TrainingRecommendation {
        val today = LocalDate.now()
        
        // 1. Check if there's a training plan
        val planWorkout = findWorkoutInPlan(state, today)
        if (planWorkout != null) {
            // Enrich plan workout with pace calculation
            val vdotValue = state.vdot
            val pace = if (vdotValue > 0) {
                // Formatting helper
                fun p(intensity: Double) = ScienceEngine.formatPace(ScienceEngine.getPaceSeconds(vdotValue, intensity))
                
                when (planWorkout.type) {
                    "E" -> p(ScienceEngine.VdotZones.E_LOW)
                    "M" -> p(ScienceEngine.VdotZones.M)
                    "T" -> p(ScienceEngine.VdotZones.T)
                    "I" -> p(ScienceEngine.VdotZones.I)
                    "R" -> p(ScienceEngine.VdotZones.R)
                    else -> null
                }
            } else null
            
            return TrainingRecommendation(
                title = planWorkout.title,
                type = planWorkout.type,
                subtitle = "${planWorkout.dist}km - ${planWorkout.target}",
                description = planWorkout.details.find { it.label == "Cœur" || it.label == "Objectif" }?.content ?: "",
                advice = "Séance prévue dans votre plan de 12 semaines. Restez régulier !",
                isFromPlan = true,
                targetPace = pace,
                duration = planWorkout.details.find { it.label == "Durée" }?.content?.filter { it.isDigit() }?.toIntOrNull() ?: 60
            )
        }

        // 2. No plan: Dynamic intelligence
        return getDynamicSuggestion(state, today)
    }

    private fun findWorkoutInPlan(state: AppState, date: LocalDate): TrainingPlanGenerator.DayPlan? {
        if (state.generatedRunPlan.isEmpty()) return null
        
        // Find the week that contains the date
        // In this simplified model, we assume the plan starts from the first week's first day
        val planStart = state.generatedRunPlan.firstOrNull()?.days?.firstOrNull()?.date ?: return null
        
        for (week in state.generatedRunPlan) {
            for (day in week.days) {
                if (day.date.isEqual(date)) {
                    return day
                }
            }
        }
        return null
    }

    private fun getDynamicSuggestion(state: AppState, date: LocalDate): TrainingRecommendation {
        val dayOfWeek = date.dayOfWeek.getDisplayName(TextStyle.FULL, Locale.FRENCH)
        
        // Calculate readiness with real data
        val readinessValue = if (state.readiness != "--") {
            state.readiness.toIntOrNull() ?: 50
        } else {
            // Fallback calculation if pre-calculated readiness is missing
            calculateReadiness(
                ReadinessFactors(
                    hrv = state.hrv.toIntOrNull() ?: 60,
                    sleepQuality = (state.sleepScore.toIntOrNull() ?: 70) / 10,
                    muscleSoreness = 3 // Default, could be a user input later
                )
            )
        }
        
        // Check if user already trained today
        val today = date.toString()
        val todaysWorkouts = state.activities.filter { it.date == today }
        
        if (todaysWorkouts.isNotEmpty()) {
            val totalTSS = todaysWorkouts.mapNotNull { 
                it.load.removePrefix("TSS ").toIntOrNull() 
            }.sum()
            
            return when {
                totalTSS > 150 -> TrainingRecommendation(
                    title = "Séance Intense Effectuée ✓",
                    type = "REST",
                    subtitle = "Charge: $totalTSS TSS",
                    description = "Vous avez déjà effectué une séance intense aujourd'hui.",
                    advice = "Repos recommandé. Votre corps a besoin de récupérer pour progresser.",
                    isFromPlan = false,
                    duration = 0,
                    physiologicalGain = "Restauration et adaptation",
                    intensityColor = "red"
                )
                else -> TrainingRecommendation(
                    title = "Séance Effectuée ✓",
                    type = "E",
                    subtitle = "Charge: $totalTSS TSS",
                    description = "Séance effectuée aujourd'hui.",
                    advice = "Si vous vous sentez très bien, vous pouvez ajouter une courte récupération active.",
                    isFromPlan = false,
                    intensityColor = "green"
                )
            }
        }
        
        // Calculate recent load
        val sevenDaysAgo = date.minusDays(7).toString()
        val recentWorkouts = state.activities.filter { 
            it.date >= sevenDaysAgo && it.date < today
        }
        val weeklyTSS = recentWorkouts.mapNotNull { 
            it.load.removePrefix("TSS ").toIntOrNull() 
        }.sum()
        
        // Get previous session TSS and type
        val prevSession = state.activities.firstOrNull()
        val prevTSS = prevSession?.load?.removePrefix("TSS ")?.toIntOrNull() ?: 0
        val lastSessionType = prevSession?.type ?: "easy"
        
        // Weather factor (TODO: Get real temperature)
        val temperature = 20
        val heatStress = if (temperature > 22) (temperature - 20) * 1.5 else 0.0
        
        // CASE 1: Extreme Fatigue
        if (readinessValue < 35) {
            return TrainingRecommendation(
                title = "Repos Biologique Total",
                type = "REST",
                subtitle = "Récupération nécessaire",
                description = "Votre système nerveux sympathique est saturé.",
                advice = "S'entraîner aujourd'hui serait contre-productif et augmente le risque de blessure de 60%.",
                isFromPlan = false,
                duration = 0,
                structure = listOf(
                    "Repos complet",
                    "Hydratation + Électrolytes",
                    "Sommeil > 8h requis"
                ),
                physiologicalGain = "Restauration Homéostasie",
                intensityColor = "red"
            )
        }
        
        // CASE 2: Moderate Fatigue or Big Session Yesterday
        if (readinessValue < 60 || prevTSS > 120) {
            val vdotValue = state.vdot
            val pace = if (vdotValue > 0) ScienceEngine.formatPace(ScienceEngine.getPaceSeconds(vdotValue, ScienceEngine.VdotZones.E_LOW)) else null
            return TrainingRecommendation(
                title = "Footing de Régénération",
                type = "E",
                subtitle = "40 min en endurance fondamentale",
                description = "Flush du lactate résiduel. Ne dépassez pas 70% FCMax.",
                advice = "Votre corps a besoin de récupération active. Restez très facile.",
                isFromPlan = false,
                duration = 40,
                structure = listOf(
                    "10' Marche/Trot progressif",
                    "30' Endurance Fondamentale stricte (Zone 1)",
                    "Étirements passifs légers"
                ),
                targetPace = pace,
                hrZone = "135-150 bpm",
                physiologicalGain = "Flush lactate, capillarisation",
                weatherWarning = if (heatStress > 0) "Chaleur détectée (${temperature}°C). Ralentissez de ${(heatStress * 2).toInt()} sec/km" else null,
                intensityColor = "blue"
            )
        }
        
        // Helper to format pace
        fun fmtPace(type: String): String {
            val v = state.vdot
            if (v <= 0) return ""
            fun p(i: Double) = ScienceEngine.formatPace(ScienceEngine.getPaceSeconds(v, i))
            
            return when(type) {
                "E" -> "(${p(ScienceEngine.VdotZones.E_LOW)})"
                "M" -> "(${p(ScienceEngine.VdotZones.M)})"
                "T" -> "(${p(ScienceEngine.VdotZones.T)})"
                "I" -> "(${p(ScienceEngine.VdotZones.I)})"
                else -> ""
            }
        }
        
        // CASE 3: Optimal Form - Energy System Rotation
        if (lastSessionType == "interval" || lastSessionType == "tempo") {
            // After quality -> Volume
            val vdotValue = state.vdot
            val pace = if (vdotValue > 0) ScienceEngine.formatPace(ScienceEngine.getPaceSeconds(vdotValue, 0.70)) else null
            val duration = if (weeklyTSS < 300) 75 else 60
            
            return TrainingRecommendation(
                title = "Sortie Aérobie - Volume",
                type = "E",
                subtitle = "$duration min en endurance",
                description = "Développement des mitochondries et capillarisation. Restez fluide.",
                advice = "Après l'intensité, on construit la base. Allure conversationnelle.",
                isFromPlan = false,
                duration = duration,
                structure = listOf(
                    "15' Échauffement progressif ${fmtPace("E")}",
                    "${duration - 25}' Endurance Fondamentale ${fmtPace("E")}",
                    "6 x 100m Lignes droites (Vitesse technique)",
                    "10' Retour au calme ${fmtPace("E")}"
                ),
                targetPace = pace,
                hrZone = "145-160 bpm",
                physiologicalGain = "Densité mitochondriale, économie de course",
                weatherWarning = if (heatStress > 0) "Chaleur : ralentissez de ${(heatStress * 2).toInt()} sec/km" else null,
                intensityColor = "green"
            )
        } else {
            // Can do quality work
            if (readinessValue > 80 && weeklyTSS < 400) {
                // VO2Max
                val vdotValue = state.vdot
                val pace = if (vdotValue > 0) ScienceEngine.formatPace(ScienceEngine.getPaceSeconds(vdotValue, ScienceEngine.VdotZones.I)) else null
                return TrainingRecommendation(
                    title = "Puissance Aérobie (VMA)",
                    type = "I",
                    subtitle = "6 x 3' à VMA",
                    description = "Augmentation du VO2Max. Maintenir une cadence > 175 spm.",
                    advice = "Votre forme est excellente ($readinessValue/100). Profitez-en pour progresser !",
                    isFromPlan = false,
                    duration = 60,
                    structure = listOf(
                        "20' Échauffement + Gammes ${fmtPace("E")}",
                        "SÉRIE: 6 x 3' à VMA ${fmtPace("I")}",
                        "RÉCUP: 2' trot lent entre les fractions",
                        "10' Retour au calme ${fmtPace("E")}"
                    ),
                    targetPace = pace,
                    hrZone = "175-185 bpm",
                    physiologicalGain = "+0.2 VDOT estimé, puissance aérobie",
                    weatherWarning = if (temperature > 25) "Chaleur excessive. Reportez cette séance." else null,
                    intensityColor = "purple"
                )
            } else {
                // Threshold
                val vdotValue = state.vdot
                val pace = if (vdotValue > 0) ScienceEngine.formatPace(ScienceEngine.getPaceSeconds(vdotValue, ScienceEngine.VdotZones.T)) else null
                return TrainingRecommendation(
                    title = "Seuil Anaérobie (Tempo)",
                    type = "T",
                    subtitle = "2 x 15' au seuil",
                    description = "Repousser l'accumulation de lactates. Douleur contrôlée.",
                    advice = "Forme bonne mais pas exceptionnelle. Le seuil est parfait.",
                    isFromPlan = false,
                    duration = 55,
                    structure = listOf(
                        "15' Échauffement ${fmtPace("E")}",
                        "BLOC: 2 x 15' au Seuil ${fmtPace("T")}",
                        "RÉCUP: 3' trot entre les blocs",
                        "10' Retour au calme ${fmtPace("E")}"
                    ),
                    targetPace = pace,
                    hrZone = "165-175 bpm",
                    physiologicalGain = "Recul seuil lactique, endurance spécifique",
                    weatherWarning = if (heatStress > 0) "Chaleur : ralentissez de ${(heatStress * 2).toInt()} sec/km" else null,
                    intensityColor = "orange"
                )
            }
        }
    }
    data class ComplianceResult(
        val score: Int, // 0-100
        val feedback: String,
        val details: String,
        val color: String = "green"
    )

    fun calculateCompliance(
        recommendation: TrainingRecommendation,
        activities: List<com.drawrun.app.ActivityItem>
    ): ComplianceResult? {
        if (activities.isEmpty()) return null
        
        // Summing up activities for the day if split
        val totalDist = activities.sumOf { 
            it.dist.replace("km", "").replace(",", ".").toDoubleOrNull() ?: 0.0 
        }
        
        // Extracting Duration from subtitle "50 min" or similar if possible, else approximation
        // Recommendation has duration input
        val plannedDuration = recommendation.duration.toDouble()
        val plannedDist = recommendation.subtitle.substringBefore("km").replace(",", ".").toDoubleOrNull() ?: (plannedDuration / 6.0) // fallback 10km/h
        
        // Logic: Compare Distance or Duration
        val actualDurationMin = activities.sumOf { 
            // ActivityItem.duration format "45 min" or "1:05:00" or raw string? 
            // Looking at ActivityAnalyzer.parseDuration, it handles multiple formats.
            // But here let's assume it's the formatted string.
            val dur = it.duration
            val parts = dur.replace("h", ":").split(":")
            if(parts.size == 3) parts[0].toInt() * 60 + parts[1].toInt() + parts[2].toInt()/60.0
            else if(parts.size == 2) (parts[0].toInt() * 60 + parts[1].toInt()).toDouble()
            else dur.replace(Regex("[^0-9]"), "").toDoubleOrNull() ?: 0.0 // Raw minutes or empty
        }

        // Compliance Factors: Distance & Pace
        // 1. Volume Compliance
        val volumeScore = if (plannedDist > 0) {
            val ratio = totalDist / plannedDist
            // Optimal: 0.9 to 1.1 => 100%
            // Penalize under or over
            when {
                ratio in 0.9..1.1 -> 100
                ratio < 0.9 -> (ratio * 100).toInt()
                else -> maxOf(0, (100 - (ratio - 1.1) * 100).toInt())
            }
        } else {
             // Use duration if distance unknown
             val ratio = actualDurationMin / plannedDuration
             when {
                 ratio in 0.9..1.1 -> 100
                 ratio < 0.9 -> (ratio * 100).toInt()
                 else -> maxOf(0, (100 - (ratio - 1.1) * 100).toInt())
             }
        }

        // 2. Pace/Intensity Compliance (Only if pace target exists)
        var paceScore = 100
        val targetPaceStr = recommendation.targetPace
        if (targetPaceStr != null && activities.isNotEmpty()) {
            val targetSec = ScienceEngine.parsePaceToSeconds(targetPaceStr)
            val actualPaceStr = activities[0].pace // Take main activity
            val actualSec = ScienceEngine.parsePaceToSeconds(actualPaceStr)
            
            if (targetSec > 0 && actualSec > 0) {
                // Determine if faster or slower
                // Lower sec/km = faster
                val diffPct = (actualSec - targetSec) / targetSec.toDouble() // + slower, - faster
                
                paceScore = if (Math.abs(diffPct) < 0.05) 100 // +/- 5% ok
                else maxOf(0, (100 - (Math.abs(diffPct) - 0.05) * 500).toInt())
            }
        }

        val totalScore = (volumeScore * 0.6 + paceScore * 0.4).toInt()

        val (feedback, color) = when {
            totalScore >= 90 -> "Excellent !" to "green"
            totalScore >= 70 -> "Bien respecté" to "blue"
            totalScore >= 50 -> "Partiellement suivi" to "orange"
            else -> "Non respecté" to "red"
        }
        
        val details = if (volumeScore < 70) "Volume ajusté par rapport au plan."
                     else if (paceScore < 70) "Allure différente de la cible."
                     else "Objectifs de séance atteints."

        return ComplianceResult(totalScore, feedback, details, color)
    }

    // parsePace removed -> Use ScienceEngine.parsePaceToSeconds
}
