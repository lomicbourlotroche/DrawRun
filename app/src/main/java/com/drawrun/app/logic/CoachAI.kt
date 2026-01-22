package com.drawrun.app.logic

import com.drawrun.app.AppState
import com.drawrun.app.ActivityItem
import com.drawrun.app.logic.TrainingPlanGenerator
import java.time.LocalDate
import java.time.format.TextStyle
import java.util.Locale
import kotlin.math.roundToInt
import kotlin.math.max

/**
 * COACH AI (ELITE VERSION)
 * 
 * Moteur de coaching intelligent basé sur la méthode Jack Daniels.
 * Analyse :
 * 1. Charge (TSS, CTL, ATL, TSB)
 * 2. Habitudes (Jour de sortie longue, jours de qualité)
 * 3. Phasiologie (Base -> Seuil -> VMA -> Affûtage)
 * 4. État de forme journalier (HRV, Sommeil)
 */
object CoachAI {

    data class ReadinessFactors(
        val hrv: Int,           // Variabilité cardiaque en ms (base: 60ms)
        val sleepQuality: Int,  // 1-10
        val muscleSoreness: Int // 1-10 (10 = très douloureux)
    )

    data class TrainingRecommendation(
        val title: String,
        val type: String,              // "E", "M", "T", "I", "R", "REST", "L", "X"
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
        val intensityColor: String = "green"   // "green", "orange", "purple", "red", "blue"
    )

    // ============================================================================================
    // 1. ANALYSE AVANCÉE (DATA MINING)
    // ============================================================================================

    private fun calculateTSS(activity: ActivityItem): Int {
        // Extraction robuste du TSS
        return activity.load.replace("TSS", "").trim().toIntOrNull() ?: 0
    }

    private fun getHabitualLongRunDay(activities: List<ActivityItem>): java.time.DayOfWeek {
        // Trouve le jour où l'utilisateur fait généralement ses sorties les plus longues
        if (activities.isEmpty()) return java.time.DayOfWeek.SUNDAY

        val dayDistances = mutableMapOf<java.time.DayOfWeek, Double>()
        val dayCounts = mutableMapOf<java.time.DayOfWeek, Int>()

        activities.take(20).forEach { 
            try {
                val date = LocalDate.parse(it.date) // Format doit être ISO YYYY-MM-DD
                val dist = it.dist.replace("km", "").replace(",", ".").toDoubleOrNull() ?: 0.0
                val day = date.dayOfWeek
                dayDistances[day] = (dayDistances[day] ?: 0.0) + dist
                dayCounts[day] = (dayCounts[day] ?: 0) + 1
            } catch (e: Exception) { }
        }

        return dayDistances.maxByOrNull { it.value / (dayCounts[it.key] ?: 1) }?.key ?: java.time.DayOfWeek.SUNDAY
    }

    private fun calculateWeeklyVolume(activities: List<ActivityItem>): Double {
        val oneWeekAgo = LocalDate.now().minusDays(7).toString()
        return activities.filter { it.date >= oneWeekAgo }
            .sumOf { it.dist.replace("km", "").replace(",", ".").toDoubleOrNull() ?: 0.0 }
    }

    // ============================================================================================
    // 2. MOTEUR DE DÉCISION
    // ============================================================================================

    fun getDailyTraining(state: AppState): TrainingRecommendation {
        val today = LocalDate.now()
        
        // 1. Check activité du jour même (doublon ?)
        val todayStr = today.toString()
        val todayActivity = state.activities.find { it.date == todayStr }
        if (todayActivity != null) {
            val tss = calculateTSS(todayActivity)
            // Si activité significative déjà faite
            if (tss > 30) {
                 return TrainingRecommendation(
                    title = "Entraînement Terminé",
                    type = "REST",
                    subtitle = "Récupération",
                    description = "Excellent travail aujourd'hui. Profitez du reste de la journée pour récupérer.",
                    advice = "Hydratez-vous bien et visez 8h de sommeil. Regardez ci-dessous pour demain !",
                    isFromPlan = false,
                    duration = 0,
                    intensityColor = "green"
                )
            }
        }

        // 2. Si pas d'activité faite, on prédit la séance du jour
        return predictWorkoutForDate(state, today)
    }

    fun getTomorrowTraining(state: AppState): TrainingRecommendation {
        val tomorrow = LocalDate.now().plusDays(1)
        return predictWorkoutForDate(state, tomorrow)
    }

    private fun predictWorkoutForDate(state: AppState, date: LocalDate): TrainingRecommendation {
        // 1. Priorité au PLAN D'ENTRAÎNEMENT
        val planWorkout = findWorkoutInPlan(state, date)
        if (planWorkout != null) {
            return buildPlanRecommendation(state, planWorkout)
        }

        // 2. DATA MINING & PHYSIO
        val readinessValue = state.readiness.toIntOrNull() ?: calculateFallbackReadiness(state)
        val ctl = state.ctl.toDoubleOrNull() ?: 40.0
        val tsb = state.tsb.toDoubleOrNull() ?: 0.0
        
        // Estimation état pour DEMAIN (si date != today)
        // Simplification : On suppose que le repos d'aujourd'hui (si repos) augmente le TSB
        val isTomorrow = date.isAfter(LocalDate.now())
        val effReadiness = if (isTomorrow) (readinessValue + 10).coerceAtMost(100) else readinessValue
        val effTsb = if (isTomorrow) tsb + 5.0 else tsb // On récupère un peu
        
        // 3. ANALYSE HABITUDES
        val weeklyVol = calculateWeeklyVolume(state.activities)
        val longRunDay = getHabitualLongRunDay(state.activities)
        
        // MOTEUR DE DÉCISION (ARBRE DANIELS)
        
        // Cas : Sortie Longue le bon jour
        if (date.dayOfWeek == longRunDay) {
            val targetDist = (weeklyVol * 0.30).coerceIn(8.0, 32.0)
            return longRunRecommendation(state, targetDist)
        }

        // Cas : Qualité (Mardi / Vendredi ou jours frais)
        // Pour éviter trop de qualité, on check si hier (relativement à date) était dur.
        // Ici on simplifie en checkant le jour de la semaine pour structurer.
        // MARDIS et VENDREDIS sont souvent des jours de qualité classiques.
        val dayOfWeek = date.dayOfWeek
        val isQualityDay = (dayOfWeek == java.time.DayOfWeek.TUESDAY || dayOfWeek == java.time.DayOfWeek.FRIDAY)
        
        if (isQualityDay && effReadiness > 60) {
             val weekNum = java.time.temporal.ChronoField.ALIGNED_WEEK_OF_YEAR.getFrom(date)
             return if (weekNum % 2 == 0L) {
                intervalRecommendation(state)
            } else {
                thresholdRecommendation(state)
            }
        }

        // PAR DÉFAUT : Endurance
        return enduranceRecommendation(state, weeklyVol)
    }

    // ============================================================================================
    // 3. GÉNÉRATEURS DE SÉANCES SPÉCIFIQUES
    // ============================================================================================

    private fun restRecommendation(reason: String): TrainingRecommendation {
        return TrainingRecommendation(
            title = "Repos Biologique",
            type = "REST",
            subtitle = "Journée Off",
            description = reason,
            advice = "Sommeil, Hydratation, Nutrition de qualité.",
            isFromPlan = false,
            duration = 0,
            physiologicalGain = "Restauration Système Nerveux",
            intensityColor = "red"
        )
    }

    private fun recoveryRecommendation(state: AppState, reason: String): TrainingRecommendation {
        val v = state.vdot
        val p = if (v > 0) ScienceEngine.formatPace(ScienceEngine.getPaceSeconds(v, 0.65)) else "--" // 65% is super easy
        
        return TrainingRecommendation(
            title = "Récupération Active",
            type = "E",
            subtitle = "30-40 min très cool",
            description = reason,
            advice = "Ne regardez pas votre montre. Courez aux sensations, très lentement.",
            isFromPlan = false,
            duration = 35,
            structure = listOf("35' Footing (Zone 1)"),
            targetPace = p,
            hrZone = "< 70% FCM",
            physiologicalGain = "Flush Lactate",
            intensityColor = "blue"
        )
    }

    private fun longRunRecommendation(state: AppState, distanceKm: Double): TrainingRecommendation {
        val v = state.vdot
        val p = if (v > 0) ScienceEngine.formatPace(ScienceEngine.getPaceSeconds(v, ScienceEngine.VdotZones.E_LOW)) else "--"
        
        return TrainingRecommendation(
            title = "Sortie Longue",
            type = "L",
            subtitle = "${distanceKm.toInt()} km Endurance",
            description = "Pilier de la construction aérobie. Développe la résistance mentale et musculaire.",
            advice = "Hydratation toutes les 20 min. Finir les 2 derniers km un peu plus vite si bonne forme.",
            isFromPlan = false,
            duration = (distanceKm * 6).toInt(), // Approx 6min/km
            structure = listOf(
                "15' Échauffement",
                "${(distanceKm - 5).toInt()}km Endurance Stricte",
                "2km Allure Marathon (Optionnel)",
                "Retour au calme"
            ),
            targetPace = p,
            hrZone = "70-80% FCM",
            physiologicalGain = "Biogenèse Mitochondriale",
            intensityColor = "green"
        )
    }

    private fun intervalRecommendation(state: AppState): TrainingRecommendation {
        val v = state.vdot
        val pI = if (v > 0) ScienceEngine.formatPace(ScienceEngine.getPaceSeconds(v, ScienceEngine.VdotZones.I)) else "--"
        val pE = if (v > 0) ScienceEngine.formatPace(ScienceEngine.getPaceSeconds(v, ScienceEngine.VdotZones.E_LOW)) else "--"

        return TrainingRecommendation(
            title = "Puissance Aérobie (VMA)",
            type = "I",
            subtitle = "5 x 1000m",
            description = "Développement maximal du VO2Max. Séance clé pour la vitesse.",
            advice = "Régularité indispensable. La dernière fraction doit être aussi rapide que la première.",
            isFromPlan = false,
            duration = 60,
            structure = listOf(
                "20' Échauffement progressif @ $pE",
                "5 x 1000m @ $pI (Récup 3')",
                "10' Retour au calme très lent"
            ),
            targetPace = pI,
            hrZone = "95-98% FCM",
            physiologicalGain = "+VO2Max, Économie de course",
            intensityColor = "purple",
            weatherWarning = if (22 > 20) null else "Attention chaleur" // Mock weather
        )
    }

    private fun thresholdRecommendation(state: AppState): TrainingRecommendation {
        val v = state.vdot
        val pT = if (v > 0) ScienceEngine.formatPace(ScienceEngine.getPaceSeconds(v, ScienceEngine.VdotZones.T)) else "--"
        val pE = if (v > 0) ScienceEngine.formatPace(ScienceEngine.getPaceSeconds(v, ScienceEngine.VdotZones.E_LOW)) else "--"

        return TrainingRecommendation(
            title = "Seuil Anaérobie (Tempo)",
            type = "T",
            subtitle = "2 x 15 min au Seuil",
            description = "Amélioration de l'endurance à haute intensité. Repousse l'accumulation de lactates.",
            advice = "Confortablement difficile. Vous devez pouvoir dire quelques mots, pas des phrases.",
            isFromPlan = false,
            duration = 55,
            structure = listOf(
                "15' Échauffement @ $pE",
                "2 x 15' @ $pT (Récup 2' trot)",
                "10' Retour au calme"
            ),
            targetPace = pT,
            hrZone = "88-92% FCM",
            physiologicalGain = "Seuil Lactique, Mental",
            intensityColor = "orange"
        )
    }

    private fun enduranceRecommendation(state: AppState, weeklyVol: Double): TrainingRecommendation {
        val v = state.vdot
        val p = if (v > 0) ScienceEngine.formatPace(ScienceEngine.getPaceSeconds(v, ScienceEngine.VdotZones.E_LOW)) else "--"
        val dur = if (weeklyVol > 50) 60 else 45
        
        return TrainingRecommendation(
            title = "Endurance Fondamentale",
            type = "E",
            subtitle = "$dur min Aérobie",
            description = "Base du volume d'entraînement. Sans stress excessif.",
            advice = "Inclure 6 x 100m (Lignes droites) à la fin pour la technique.",
            isFromPlan = false,
            duration = dur,
            structure = listOf(
                "${dur - 5} min Endurance @ $p",
                "6 x 100m Rapide/Souple (Diagonales)",
                "5 min retour au calme"
            ),
            targetPace = p,
            hrZone = "70-79% FCM",
            physiologicalGain = "Capillarisation",
            intensityColor = "green"
        )
    }

    // ============================================================================================
    // 4. LOGIQUE PLAN D'ENTRAÎNEMENT
    // ============================================================================================

    private fun findWorkoutInPlan(state: AppState, date: LocalDate): TrainingPlanGenerator.DayPlan? {
        if (state.generatedRunPlan.isEmpty()) return null
        
        // Supposons que le plan commence le lundi de la première semaine générée
        // Simplification pour trouver le workout du jour
        val planStart = state.generatedRunPlan.firstOrNull()?.days?.firstOrNull()?.date ?: return null
        
        for (week in state.generatedRunPlan) {
            for (day in week.days) {
                if (day.date.isEqual(date)) return day
            }
        }
        return null
    }

    private fun buildPlanRecommendation(state: AppState, w: TrainingPlanGenerator.DayPlan): TrainingRecommendation {
        val v = state.vdot
        // Formattage précis
        fun p(intensity: Double) = ScienceEngine.formatPace(ScienceEngine.getPaceSeconds(v, intensity))
        
        val paceTip = when (w.type) {
            "E", "L" -> p(ScienceEngine.VdotZones.E_LOW)
            "M" -> p(ScienceEngine.VdotZones.M)
            "T" -> p(ScienceEngine.VdotZones.T)
            "I" -> p(ScienceEngine.VdotZones.I)
            "R" -> p(ScienceEngine.VdotZones.R)
            else -> null
        }
        
        val hrTip = when (w.type) {
            "E", "L" -> "65-79% FCM"
            "M" -> "80-85% FCM"
            "T" -> "88-92% FCM"
            "I" -> "95-98% FCM"
            "R" -> "Max"
            else -> null
        }

        // Structure extraction from details
        val struct = w.details.map { "${it.label}: ${it.content}" }

        return TrainingRecommendation(
            title = w.title, // ex: "Seuil (T)"
            type = w.type,
            subtitle = w.target, // ex: "12km @ T-Pace"
            description = "Séance prévue de votre plan ${state.runPlanObjective}",
            advice = w.details.find { it.label == "Conseil Coach" }?.content ?: "Concentrez-vous sur la régularité.",
            isFromPlan = true,
            duration = 60, // Approximate
            structure = struct,
            targetPace = paceTip,
            hrZone = hrTip,
            physiologicalGain = "Progression Planifiée",
            intensityColor = when(w.type) {
                "I", "R" -> "purple"
                "T" -> "orange"
                "M" -> "blue"
                else -> "green"
            }
        )
    }

    // ============================================================================================
    // 5. UTILITAIRES DE CONFORMITÉ (FEEDBACK)
    // ============================================================================================

    data class ComplianceResult(
        val score: Int, // 0-100
        val feedback: String,
        val details: String,
        val color: String
    )

    fun calculateCompliance(rec: TrainingRecommendation, activities: List<ActivityItem>): ComplianceResult? {
        if (activities.isEmpty()) return null
        
        // Analyse fine de la conformité
        var totalDist = 0.0
        var totalTime = 0.0
        var avgPaceSec = 0.0
        
        activities.forEach { act ->
            totalDist += act.dist.replace("km", "").replace(",", ".").toDoubleOrNull() ?: 0.0
            totalTime += ScienceEngine.parseDurationSeconds(act.duration) / 60.0 // minutes
        }
        
        // Si plus d'une activité, moyenne pondérée pour l'allure ? On prend la plus longue.
        val mainAct = activities.maxByOrNull { ScienceEngine.parseDurationSeconds(it.duration) } ?: activities[0]
        avgPaceSec = ScienceEngine.parsePaceToSeconds(mainAct.pace)
        
        // 1. Durée Compliance
        val plannedDuration = rec.duration.toDouble()
        val durationScore = if (plannedDuration > 0) {
            val ratio = totalTime / plannedDuration
            if (ratio in 0.9..1.15) 100 else if (ratio < 0.9) (ratio * 100).toInt() else 100 - ((ratio - 1.15) * 100).toInt()
        } else 100
        
        // 2. Pace Compliance (si applicable)
        val plannedPaceSec = rec.targetPace?.let { ScienceEngine.parsePaceToSeconds(it) } ?: 0.0
        val paceScore = if (plannedPaceSec > 0 && avgPaceSec > 0) {
            val ratio = avgPaceSec / plannedPaceSec // < 1 = trop vite, > 1 = trop lent
            // Tolerance: +/- 5% = 100 points. 
            // +/- 10% = 80 points.
            val diff = kotlin.math.abs(1.0 - ratio)
            when {
                diff < 0.05 -> 100
                diff < 0.10 -> 80
                diff < 0.20 -> 50
                else -> 20
            }
        } else 100
        
        val finalScore = ((durationScore * 0.4) + (paceScore * 0.6)).toInt().coerceIn(0, 100)
        
        val (txt, col) = when {
            finalScore >= 90 -> "Parfait" to "green"
            finalScore >= 75 -> "Bien" to "blue"
            finalScore >= 50 -> "Moyen" to "orange"
            else -> "Non respecté" to "red"
        }
        
        return ComplianceResult(finalScore, txt.uppercase(), "Score global de respect de la séance", col)
    }

    private fun calculateFallbackReadiness(state: AppState): Int {
        val hrv = state.hrv.toIntOrNull() ?: 60
        val sleep = state.sleepScore.toIntOrNull() ?: 70
        return ((hrv * 0.6 + sleep * 0.4)).toInt().coerceIn(0, 100)
    }
}
