package com.drawrun.app.logic

import java.time.LocalDate
import java.time.temporal.ChronoUnit
import kotlin.math.*

/**
 * PLANIFICATEUR JACK DANIELS (ÉDITION ELITE)
 * 
 * Implémente la périodisation en 4 phases du Running Formula :
 * Phase I : Fondation (Easy + Strides)
 * Phase II : Qualité Précoce (Répetitions + Seuil)
 * Phase III : Qualité Dur (Intervalle + Seuil)
 * Phase IV : Affûtage (Taper)
 */
object TrainingPlanGenerator {

    data class PlanConfig(
        val method: String = "vdot",
        val raceDistance: Double = 10000.0, // 5k, 10k, 21k, 42k
        val minutes: Int = 45,
        val seconds: Int = 0,
        val peakWeeklyKm: Double = 50.0,
        val programWeeks: Int = 16, // Idéalement 16-24 semaines. Min 12.
        val daysPerWeek: Int = 4,   // 3 à 7
        val startDate: LocalDate = LocalDate.now(),
        val currentVdot: Double = 30.0
    )

    data class Workout(
        val main: String,
        val rec: String = "",
        val type: String = "E"
    )

    data class DayPlan(
        val date: LocalDate,
        val name: String,
        val type: String, // E, M, T, I, R, L, REST
        val title: String,
        val dist: Double,
        val target: String,
        val isQuality: Boolean = false,
        val details: List<Detail> = emptyList()
    )

    data class Detail(
        val label: String,
        val content: String,
        val highlight: Boolean = false
    )

    data class WeekPlan(
        val weekNum: Int,
        val phase: Int, // 1=Base, 2=Rep, 3=Int, 4=Final
        val km: Double,
        val days: List<DayPlan>,
        val isDecharge: Boolean
    )

    // ============================================================================================
    // 1. GÉNÉRATEUR PRINCIPAL
    // ============================================================================================

    fun generatePlan(config: PlanConfig, forcedVdot: Double? = null): List<WeekPlan> {
        val weeks = mutableListOf<WeekPlan>()
        val startVdot = if (forcedVdot != null && forcedVdot > 10.0) forcedVdot 
                       else ScienceEngine.calculateVDOT(config.raceDistance, config.minutes + config.seconds / 60.0)
        
        // Périodisation Dynamique
        // Phase I (Base) : 25% du temps (ou min 4 sem)
        // Phase II (R) : 25%
        // Phase III (I) : 35%
        // Phase IV (M/T + Taper) : 15%
        
        val totalWeeks = config.programWeeks
        val p1Weeks = (totalWeeks * 0.25).toInt().coerceAtLeast(3)
        val p2Weeks = (totalWeeks * 0.25).toInt()
        val p3Weeks = (totalWeeks * 0.35).toInt()
        val p4Weeks = totalWeeks - p1Weeks - p2Weeks - p3Weeks
        
        var currentWeek = 1
        var currentVolume = config.peakWeeklyKm * 0.7 // Commence à 70% du pic
        
        // Boucle de génération
        for (w in 1..totalWeeks) {
            val phase = when {
                w <= p1Weeks -> 1
                w <= p1Weeks + p2Weeks -> 2
                w <= p1Weeks + p2Weeks + p3Weeks -> 3
                else -> 4
            }
            
            // Gestion du Volume (Step Loading: Up, Up, Down)
            val isRecoveryWeek = (w % 4 == 0) && (w < totalWeeks - 1)
            val weekVol = if (isRecoveryWeek) currentVolume * 0.75 else currentVolume
            
            // Progression Volume Base
            if (!isRecoveryWeek && w < totalWeeks * 0.7) {
                currentVolume = min(config.peakWeeklyKm, currentVolume * 1.05) // +5%/sem max
            } else if (w >= totalWeeks - 2) {
                // Taper final
                currentVolume *= 0.7
            }
            
            val weekPlan = buildWeek(w, phase, weekVol, startVdot, config, isRecoveryWeek)
            weeks.add(weekPlan)
        }
        
        return weeks
    }

    private fun buildWeek(
        weekNum: Int, 
        phase: Int, 
        volume: Double, 
        vdot: Double, 
        config: PlanConfig,
        isRec: Boolean
    ): WeekPlan {
        val days = mutableListOf<DayPlan>()
        val weekStart = config.startDate.plusWeeks((weekNum - 1).toLong())
        val dayNames = listOf("Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim")
        
        // Distribution du volume
        val longRunDist = volume * 0.25
        val remainingVol = volume - longRunDist
        val easyDist = remainingVol / (config.daysPerWeek - 1) // Simplifié
        
        // Qualité Sessions (2 max par semaine)
        val q1Day = 1 // Mardi (si Lun=0, Mar=1...)
        val q2Day = 4 // Vendredi
        val longDay = 6 // Dimanche
        
        for (d in 0..6) {
            val date = weekStart.plusDays(d.toLong())
            val dayName = dayNames[d]
            
            // Jours de Repos (si config demande < 7 jours)
            if (config.daysPerWeek < 7 && (d == 0 || d == 3 || d == 5)) { // Repos Lun, Jeu, Sam par ex (simplifié)
                 // Ajuster selon daysPerWeek. Ici on hardcode un pattern simple 4 jours: Mar, Mer, Ven, Dim
                 val isTrainingDay = when(config.daysPerWeek) {
                     3 -> d == 1 || d == 4 || d == 6
                     4 -> d == 1 || d == 2 || d == 4 || d == 6
                     5 -> d != 0 && d != 5
                     else -> true
                 }
                 
                 if (!isTrainingDay) {
                     days.add(DayPlan(date, dayName, "REST", "Repos", 0.0, "-", false))
                     continue
                 }
            }

            // Génération Séance
            val dayPlan = if (d == longDay) {
                // SORTIE LONGUE
                val type = if (phase >= 3) "M" else "L" // En phase 3/4, SL devient spé Marathon ou juste Long
                val title = if (phase >= 3 && config.raceDistance >= 21000) "Sortie Longue Spécifique" else "Sortie Longue"
                
                buildSession(date, dayName, type, title, longRunDist, vdot, phase)
            } else if (d == q1Day && !isRec && phase > 1) {
                // QUALITÉ 1 (R ou I)
                val type = if (phase == 2) "R" else "I"
                buildQualitySession(date, dayName, type, vdot, phase, volume)
            } else if (d == q2Day && !isRec && phase > 1) {
                // QUALITÉ 2 (T)
                buildQualitySession(date, dayName, "T", vdot, phase, volume)
            } else {
                // ENDURANCE FONDAMENTALE
                buildSession(date, dayName, "E", "Endurance & Strides", easyDist, vdot, phase)
            }
            
            days.add(dayPlan)
        }
        
        return WeekPlan(weekNum, phase, volume, days, isRec)
    }

    private fun buildQualitySession(
        date: LocalDate, 
        dayName: String, 
        type: String, 
        vdot: Double, 
        phase: Int,
        weeklyVol: Double
    ): DayPlan {
        val p = { i: Double -> ScienceEngine.formatPace(ScienceEngine.getPaceSeconds(vdot, i)) }
        val unit = "/km"
        
        val (title, dist, target, details) = when (type) {
            "R" -> {
                // Repetitions : 200m, 400m fast with full recovery
                val reps = min(12, (weeklyVol * 0.05 / 0.2).toInt()) // Max 5% vol as R
                val sesh = "${reps}x200m"
                val rPace = p(ScienceEngine.VdotZones.R)
                DayPlanDetails(
                    "Vitesse Pure (R)", 
                    reps * 0.2 + 5.0, // + chauff
                    "R @ $rPace",
                    listOf(
                        Detail("Échauffement", "20' footing + Gammes"),
                        Detail("Corps", "$reps x 200m R (Récup 200m trot)", true),
                        Detail("Cool Down", "10' souple")
                    )
                )
            }
            "I" -> {
                // Intervals : 3-5 mins at VO2Max (Hard)
                val iDist = min(8.0, weeklyVol * 0.08) // Max 8% vol or 8km (limit 10k pace work)
                val reps = (iDist / 1.0).toInt().coerceIn(3, 6)
                val iPace = p(ScienceEngine.VdotZones.I)
                DayPlanDetails(
                    "VO2Max (I)",
                    reps + 6.0,
                    "I @ $iPace",
                    listOf(
                        Detail("Échauffement", "20' progressif"),
                        Detail("Corps", "$reps x 1000m I (Récup 3' statique)", true),
                        Detail("Cool Down", "10' souple")
                    )
                )
            }
            "T" -> {
                // Threshold : Comfortably Hard
                val tDist = min(weeklyVol * 0.10, 10.0) // 10% vol
                val tPace = p(ScienceEngine.VdotZones.T)
                DayPlanDetails(
                    "Seuil (Tempo)",
                    tDist + 5.0,
                    "T @ $tPace",
                    listOf(
                        Detail("Échauffement", "15' footing"),
                        Detail("Corps", "3 x ${(tDist/3).toInt()}km T (Récup 1')", true),
                        Detail("Cool Down", "10' souple")
                    )
                )
            }
            else -> DayPlanDetails("N/A", 0.0, "", emptyList())
        }

        return DayPlan(date, dayName, type, title, dist, target, true, details)
    }

    // Helper class for destructuring
    data class DayPlanDetails(val title: String, val dist: Double, val target: String, val list: List<Detail>)

    private fun buildSession(
        date: LocalDate, 
        dayName: String, 
        type: String, 
        title: String, 
        dist: Double, 
        vdot: Double,
        phase: Int
    ): DayPlan {
        val pE = ScienceEngine.formatPace(ScienceEngine.getPaceSeconds(vdot, ScienceEngine.VdotZones.E_LOW))
        val pM = ScienceEngine.formatPace(ScienceEngine.getPaceSeconds(vdot, ScienceEngine.VdotZones.M))
        
        val details = when(type) {
            "L" -> {
                listOf(
                    Detail("Objectif", "${dist.toInt()}km continu", true),
                    Detail("Allure", "E-Pace ($pE /km)"),
                    Detail("Conseil", "Hydratation toutes les 20 min.")
                )
            }
            "E" -> {
                val strides = if (phase == 1) "\n+ 6 lignes droites (Strides) à la fin." else ""
                listOf(
                    Detail("Objectif", "${dist.toInt()}km souple", true),
                    Detail("Allure", "E-Pace ($pE /km)"),
                    Detail("Note", "Conversation possible tout le long.$strides")
                )
            }
            "M" -> { // Marathon Pace work
                listOf(
                    Detail("Échauffement", "3km E-Pace"),
                    Detail("Bloc M", "${(dist-5).toInt()}km à $pM /km", true),
                    Detail("Cool Down", "2km cool")
                )
            }
            else -> emptyList()
        }

        return DayPlan(date, dayName, type, title, dist, if (type == "M") "@ $pM" else "@ $pE", false, details)
    }

    // ============================================================================================
    // 2. SWIM GENERATOR (Conservé et optimisé)
    // ============================================================================================

    data class SwimExercise(
        val type: String,
        val distance: Int,
        val description: String,
        val intensity: String,
        val restTime: String?
    )

    data class SwimSessionData(
        val totalDistance: Int,
        val estimatedDuration: Int,
        val exercises: List<SwimExercise>,
        val focus: String,
        val level: String
    )

    fun generateSwimSession(
        mode: String, // "distance" or "duration"
        target: Int,
        level: String = "Intermédiaire",
        focus: String = "Endurance"
    ): SwimSessionData {
        // Logic kept from original file as it handles swim sessions well
        // Replicating basic structure for completeness
        val targetDistance = if (mode == "distance") target else (target * 35)
        val exercises = mutableListOf<SwimExercise>()
        
        // Warmup (20%)
        val w = (targetDistance * 0.2).toInt()
        exercises.add(SwimExercise("Échauffement", w, "Nage libre souple + 4x50m progressif", "Facile", "10s"))
        
        // Main (60%)
        val m = (targetDistance * 0.6).toInt()
        val mainDesc = when(focus) {
            "Vitesse" -> "10 x 50m Départ tous les 1' (Sprint)"
            "Technique" -> "Educatifs: Rattrapé, Poings fermés, 3 temps"
            else -> "Séries: 3 x ${(m/3)}m allure régulière"
        }
        exercises.add(SwimExercise("Corps de séance", m, mainDesc, "Modéré/Fort", "Variable"))
        
        // Cool (20%)
        val c = targetDistance - w - m
        exercises.add(SwimExercise("Retour au calme", c, "Nage libre ou Dos double bras", "Très facile", null))

        return SwimSessionData(targetDistance, targetDistance/30, exercises, focus, level)
    }
}
