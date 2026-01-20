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
    data class SwimSessionData(
        val dist: Int,
        val duration: Int,
        val warmup: String,
        val mainSet: List<String>,
        val cooldown: String,
        val focus: String
    )

    fun generateSwimSession(mode: String, target: Int, cssPace: String = "1:45"): SwimSessionData {
        return if (mode == "distance") {
            val dist = target
            val mainDist = (dist * 0.6).toInt()
            val warmupDist = (dist * 0.25).toInt().coerceAtLeast(200)
            val cooldownDist = dist - mainDist - warmupDist
            
            SwimSessionData(
                dist = dist,
                duration = (dist / 1.5).toInt(), // Approximation
                warmup = "$warmupDist m (100m Libre / 50m Jambes / 50m Éducatifs)",
                mainSet = listOf(
                    "${mainDist / 200} x 200m @ Allure CSS (r=20s)",
                    "Focus: Maintien de la propulsion en fatigue"
                ),
                focus = "Endurance Aérobie",
                cooldown = "$cooldownDist m Souple (Dos/Brasse)"
            )
        } else {
            val duration = target
            val mainDur = (duration * 0.6).toInt()
            SwimSessionData(
                dist = (duration * 40), // Approximation 2km/h
                duration = duration,
                warmup = "10 min Progressif (Varier les nages)",
                mainSet = listOf(
                    "$mainDur min Fartlek (30s Accéléré / 30s Lent)",
                    "Maintenir une fréquence de bras constante"
                ),
                focus = "Vitesse & Fréquence",
                cooldown = "5 min Récupération Active"
            )
        }
    }
}
