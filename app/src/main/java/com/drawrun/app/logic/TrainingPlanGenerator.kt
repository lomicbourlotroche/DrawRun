package com.drawrun.app.logic

import java.time.LocalDate
import java.time.temporal.ChronoUnit
import kotlin.math.*

/**
 * MOTEUR VDOT COACH ELITE (V6.4)
 * - Moteur VDOT Jack Daniels complet
 * - Double Méthode : Allure (Pace) & Cardio (FC)
 * - Périodisation 3:1 (Step-Loading)
 */
object TrainingPlanGenerator {

    data class PlanConfig(
        val method: String = "vdot", // "vdot" or "hr"
        val raceDistance: Double = 10000.0,
        val minutes: Int = 45,
        val seconds: Int = 0,
        val peakWeeklyKm: Double = 50.0,
        val programWeeks: Int = 12,
        val maxHR: Int = 185,
        val restHR: Int = 55,
        val startDate: LocalDate = LocalDate.now()
    )

    data class Workout(
        val main: String,
        val rec: String = "",
        val type: String = "E"
    )

    data class DayPlan(
        val date: LocalDate,
        val name: String,
        val type: String,
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
        val phase: Int,
        val km: Double,
        val days: List<DayPlan>,
        val isDecharge: Boolean
    )

    /**
     * Calcul du VDOT selon Jack Daniels
     */
    fun calculateVDOT(distance: Double, totalMinutes: Double): Double {
        if (totalMinutes <= 0.0) return 0.0
        val velocity = distance / totalMinutes
        val vo2 = -4.60 + 0.182258 * velocity + 0.000104 * velocity.pow(2)
        val dropOff = 0.8 + 0.189439 * exp(-0.012778 * totalMinutes) + 0.298956 * exp(-0.193261 * totalMinutes)
        return (vo2 / dropOff)
    }

    /**
     * Résolution de la vitesse pour une cible VO2 (Formule inverse Daniels)
     */
    private fun solveVelocity(vdot: Double, targetVO2Pct: Double): Double {
        val targetVO2 = vdot * targetVO2Pct
        val a = 0.000104
        val b = 0.182258
        val c = -(4.60 + targetVO2)
        val velocity = (-b + sqrt(b * b - 4 * a * c)) / (2 * a)
        return velocity
    }

    private fun formatPace(velocity: Double): String {
        if (velocity <= 0) return "--:--"
        val paceMinPerKm = 1000.0 / velocity
        val mins = paceMinPerKm.toInt()
        val secs = ((paceMinPerKm - mins) * 60).roundToInt()
        return "%d:%02d".format(mins, if (secs == 60) 0 else secs)
    }

    private fun formatHR(minPct: Double, maxPct: Double, maxHR: Int, restHR: Int): String {
        val reserve = maxHR - restHR
        val minBPM = (reserve * minPct + restHR).roundToInt()
        val maxBPM = (reserve * maxPct + restHR).roundToInt()
        return "$minBPM-$maxBPM bpm"
    }

    fun generatePlan(config: PlanConfig): List<WeekPlan> {
        val vdot = calculateVDOT(config.raceDistance, config.minutes + config.seconds / 60.0)
        
        val zones = if (config.method == "vdot") {
            mapOf(
                "E" to formatPace(solveVelocity(vdot, 0.70)),
                "M" to formatPace(solveVelocity(vdot, 0.80)),
                "T" to formatPace(solveVelocity(vdot, 0.88)),
                "I" to formatPace(solveVelocity(vdot, 0.98)),
                "R" to formatPace(solveVelocity(vdot, 1.10)),
                "unit" to "/km"
            )
        } else {
            mapOf(
                "E" to formatHR(0.59, 0.74, config.maxHR, config.restHR),
                "M" to formatHR(0.75, 0.84, config.maxHR, config.restHR),
                "T" to formatHR(0.83, 0.88, config.maxHR, config.restHR),
                "I" to formatHR(0.95, 1.00, config.maxHR, config.restHR),
                "R" to "Effort Max",
                "unit" to "BPM"
            )
        }

        val workoutsLib = mapOf(
            "R" to listOf(Workout("20 x 200m R", "Repos 200m trot", "R"), Workout("10 x 400m R", "Repos 400m trot", "R")),
            "I" to listOf(Workout("6 x 800m I", "Repos 3' statique", "I"), Workout("5 x 1000m I", "Repos 3'30 statique", "I")),
            "T" to listOf(Workout("3 x 2km T", "Repos 2' trot", "T"), Workout("Tempo 20 min T", "N/A", "T"))
        )

        val weeks = mutableListOf<WeekPlan>()
        val dayNames = listOf("Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim")

        for (w in 1..config.programWeeks) {
            val phaseIdx = min(3, (w - 1) / (config.programWeeks / 4))
            val isDecharge = w % 4 == 0 && w < config.programWeeks - 1
            
            val volMult = when {
                w == 1 -> 0.6
                w == 2 -> 0.8
                isDecharge -> 0.8
                w == config.programWeeks -> 0.5
                else -> 1.0
            }

            val weeklyKm = config.peakWeeklyKm * volMult
            val limitQ = min(weeklyKm * 0.1, 12.0)

            fun generateDetails(type: String, dist: Double, workout: Workout? = null): List<Detail> {
                val targetValue = zones[type] ?: "--"
                return if (workout != null) {
                    listOf(
                        Detail("Préparation", "15 min progressif + gammes"),
                        Detail("Cœur", "${workout.main} @ $targetValue ${zones["unit"]}", true),
                        Detail("Récupération", workout.rec),
                        Detail("Cooldown", "10 min retour calme")
                    )
                } else {
                    listOf(
                        Detail("Objectif", "%.1fkm en endurance @ $targetValue %s".format(dist, zones["unit"]), true),
                        Detail("Note Coach", "Maintenir une posture droite et des bras relâchés.")
                    )
                }
            }

            val days = mutableListOf<DayPlan>()
            val weekStartDate = config.startDate.plusWeeks((w-1).toLong())

            for (d in 0..6) {
                val currentDate = weekStartDate.plusDays(d.toLong())
                val dayName = dayNames[d]
                
                val dayPlan = when(d) {
                    0 -> DayPlan(currentDate, dayName, "E", "Récupération", weeklyKm * 0.12, zones["E"]!!, false, generateDetails("E", weeklyKm * 0.12))
                    1 -> {
                        val type = if (phaseIdx <= 1) "R" else "I"
                        val workout = workoutsLib[type]!![w % 2]
                        DayPlan(currentDate, dayName, "Q1", "Qualité (${if (phaseIdx <= 1) "Vitesse" else "Puissance"})", limitQ, zones[type]!!, true, generateDetails(type, limitQ, workout))
                    }
                    2 -> DayPlan(currentDate, dayName, "E", "Endurance", weeklyKm * 0.15, zones["E"]!!, false, generateDetails("E", weeklyKm * 0.15))
                    3 -> DayPlan(currentDate, dayName, "E", "Maintien", weeklyKm * 0.12, zones["E"]!!, false, generateDetails("E", weeklyKm * 0.12))
                    4 -> {
                        val workout = workoutsLib["T"]!![w % 2]
                        DayPlan(currentDate, dayName, "Q2", "Seuil (T)", limitQ, zones["T"]!!, true, generateDetails("T", limitQ, workout))
                    }
                    5 -> DayPlan(currentDate, dayName, "R", "Repos", 0.0, "-", false, listOf(Detail("Repos", "Assimilation physiologique.")))
                    6 -> DayPlan(currentDate, dayName, "L", "Sortie Longue", weeklyKm * 0.25, zones["E"]!!, false, generateDetails("E", weeklyKm * 0.25))
                    else -> throw IllegalStateException()
                }
                days.add(dayPlan)
            }

            weeks.add(WeekPlan(w, phaseIdx + 1, weeklyKm, days, isDecharge))
        }

        return weeks
    }
    data class SwimExercise(
        val type: String,           // "Échauffement", "Éducatifs", "Série Principale", etc.
        val distance: Int,          // Distance en mètres
        val description: String,    // Description détaillée
        val intensity: String,      // "Facile", "Modérée", "Intense"
        val restTime: String?       // Temps de récupération
    )

    data class SwimSessionData(
        val totalDistance: Int,
        val estimatedDuration: Int,
        val exercises: List<SwimExercise>,
        val focus: String,
        val level: String
    )

    fun generateSwimSession(
        mode: String,           // "distance" ou "duration"
        target: Int,            // Distance en m ou durée en min
        level: String = "Intermédiaire",  // "Débutant", "Intermédiaire", "Avancé"
        focus: String = "Endurance"       // "Endurance", "Technique", "Vitesse"
    ): SwimSessionData {
        val targetDistance = if (mode == "distance") target else (target * 35) // ~35m/min
        val exercises = mutableListOf<SwimExercise>()
        var totalDistance = 0
        
        // 1. ÉCHAUFFEMENT (15-20% de la distance totale)
        val warmupDistance = (targetDistance * 0.175).toInt()
        exercises.add(SwimExercise(
            type = "Échauffement",
            distance = warmupDistance,
            description = buildString {
                append("${warmupDistance}m nage libre facile\n")
                append("• ${warmupDistance / 4}m crawl souple\n")
                append("• ${warmupDistance / 4}m dos\n")
                append("• ${warmupDistance / 4}m crawl avec pull-buoy\n")
                append("• ${warmupDistance / 4}m crawl respiration 3 temps")
            },
            intensity = "Facile",
            restTime = "30s après chaque 100m"
        ))
        totalDistance += warmupDistance
        
        // 2. ÉDUCATIFS TECHNIQUES (10% de la distance)
        val drillsDistance = (targetDistance * 0.10).toInt()
        val drillReps = drillsDistance / 25
        exercises.add(SwimExercise(
            type = "Éducatifs Techniques",
            distance = drillsDistance,
            description = buildString {
                append("${drillsDistance}m exercices techniques\n")
                append("• ${drillReps / 3} x 25m rattrapé (récup 15s)\n")
                append("• ${drillReps / 3} x 25m point mort (récup 15s)\n")
                append("• ${drillReps / 3} x 25m respiration alternée")
            },
            intensity = "Technique",
            restTime = "15s entre séries"
        ))
        totalDistance += drillsDistance
        
        // 3. SÉRIE PRINCIPALE (60% de la distance)
        val mainSetDistance = (targetDistance * 0.60).toInt()
        val mainSetExercise = when (focus) {
            "Endurance" -> {
                val reps = mainSetDistance / 100
                SwimExercise(
                    type = "Série Principale - Endurance",
                    distance = mainSetDistance,
                    description = buildString {
                        append("${reps} x 100m crawl (récup 20s)\n")
                        append("• Allure régulière et constante\n")
                        append("• Respiration bilatérale (3 temps)\n")
                        append("• Focus sur la glisse et l'amplitude\n")
                        append("• Maintenir 16-18 coups de bras par 25m")
                    },
                    intensity = "Modérée",
                    restTime = "20s entre chaque 100m"
                )
            }
            
            "Vitesse" -> {
                SwimExercise(
                    type = "Série Principale - Vitesse",
                    distance = mainSetDistance,
                    description = buildString {
                        append("Pyramide de vitesse:\n")
                        append("• 4 x 50m rapide (récup 30s)\n")
                        append("• 3 x 100m tempo (récup 45s)\n")
                        append("• 2 x 200m seuil (récup 60s)\n")
                        append("• 3 x 100m tempo (récup 45s)\n")
                        append("• 4 x 50m sprint (récup 30s)\n")
                        append("Focus: Accélération progressive et fréquence élevée")
                    },
                    intensity = "Intense",
                    restTime = "Variable selon distance"
                )
            }
            
            else -> { // Technique
                SwimExercise(
                    type = "Série Principale - Technique",
                    distance = mainSetDistance,
                    description = buildString {
                        append("Série mixte technique/vitesse:\n")
                        append("• 4 x 100m (25m éducatif + 75m crawl)\n")
                        append("• 4 x 75m crawl tempo\n")
                        append("• 4 x 50m avec palmes (travail jambes)\n")
                        append("• 4 x 25m sprint départ plongé\n")
                        append("Focus: Qualité technique avant vitesse")
                    },
                    intensity = "Modérée à Intense",
                    restTime = "30s entre séries"
                )
            }
        }
        exercises.add(mainSetExercise)
        totalDistance += mainSetDistance
        
        // 4. SÉRIE JAMBES (10% de la distance)
        val legsDistance = (targetDistance * 0.10).toInt()
        exercises.add(SwimExercise(
            type = "Travail de Jambes",
            distance = legsDistance,
            description = buildString {
                append("${legsDistance}m travail spécifique jambes\n")
                append("• ${legsDistance / 2}m planche (4 x 50m, récup 20s)\n")
                append("• ${legsDistance / 4}m ondulations (2 x 50m, récup 30s)\n")
                append("• ${legsDistance / 4}m jambes sur le dos\n")
                append("Focus: Battements souples et réguliers")
            },
            intensity = "Modérée",
            restTime = "20-30s entre séries"
        ))
        totalDistance += legsDistance
        
        // 5. RETOUR AU CALME (5% de la distance)
        val cooldownDistance = targetDistance - totalDistance
        exercises.add(SwimExercise(
            type = "Retour au Calme",
            distance = cooldownDistance,
            description = buildString {
                append("${cooldownDistance}m nage libre très facile\n")
                append("• Respiration ample et détendue\n")
                append("• Relâchement musculaire progressif\n")
                append("• Varier les nages (crawl, dos, brasse)\n")
                append("• Étirements dans l'eau (5 min)")
            },
            intensity = "Très facile",
            restTime = null
        ))
        
        val estimatedDuration = when (level) {
            "Débutant" -> (targetDistance / 25).toInt()      // ~25m/min
            "Avancé" -> (targetDistance / 45).toInt()        // ~45m/min
            else -> (targetDistance / 35).toInt()            // ~35m/min
        }
        
        return SwimSessionData(
            totalDistance = targetDistance,
            estimatedDuration = estimatedDuration,
            exercises = exercises,
            focus = focus,
            level = level
        )
    }
}
