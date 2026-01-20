package com.drawrun.app.logic

import com.drawrun.app.AppState
import com.drawrun.app.logic.TrainingPlanGenerator
import java.time.LocalDate
import java.time.format.TextStyle
import java.util.Locale

object CoachAI {

    data class TrainingRecommendation(
        val title: String,
        val type: String, // "E", "M", "T", "I", "R", "REST"
        val subtitle: String,
        val description: String,
        val advice: String,
        val isFromPlan: Boolean
    )

    fun getDailyTraining(state: AppState): TrainingRecommendation {
        val today = LocalDate.now()
        
        // 1. Check if there's a training plan
        val planWorkout = findWorkoutInPlan(state, today)
        if (planWorkout != null) {
            return TrainingRecommendation(
                title = planWorkout.title,
                type = planWorkout.type,
                subtitle = "${planWorkout.dist}km - ${planWorkout.target}",
                description = planWorkout.details.find { it.label == "Cœur" || it.label == "Objectif" }?.content ?: "",
                advice = "Séance prévue dans votre plan de 12 semaines. Restez régulier !",
                isFromPlan = true
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
        val readinessValue = state.readiness.toIntOrNull() ?: 50
        
        // Logical decision based on readiness and day of week
        return when {
            readinessValue < 40 -> TrainingRecommendation(
                title = "Repos Récupérateur",
                type = "REST",
                subtitle = "Récupération nécessaire",
                description = "Votre score de disponibilité est bas ($readinessValue/100).",
                advice = "Le repos fait partie de l'entraînement. Laissez votre corps assimiler la charge passée.",
                isFromPlan = false
            )
            
            date.dayOfWeek.value == 7 -> { // Sunday
                val dist = if (readinessValue > 70) 12 else 8
                TrainingRecommendation(
                    title = "Sortie Longue (E)",
                    type = "E",
                    subtitle = "${dist}km en endurance",
                    description = "Course lente à allure très facile pour construire la base aérobie.",
                    advice = "Dimanche est idéal pour le volume. Maintenez une allure où vous pouvez parler.",
                    isFromPlan = false
                )
            }
            
            date.dayOfWeek.value == 2 || date.dayOfWeek.value == 4 -> { // Tue or Thu - Quality days
                TrainingRecommendation(
                    title = "Fartlek Ludique",
                    type = "I",
                    subtitle = "30-45 min avec accélérations",
                    description = "6-8 sprints courts (30s) pendant votre footing habituel.",
                    advice = "Votre forme est bonne ($readinessValue/100). Un peu d'intensité réveillera vos fibres rapides.",
                    isFromPlan = false
                )
            }
            
            else -> TrainingRecommendation(
                title = "Footing de Base",
                type = "E",
                subtitle = "6-8km allure facile",
                description = "Maintien de la condition physique sans fatigue excessive.",
                advice = "Une séance simple pour garder la régularité sans stresser le système nerveux.",
                isFromPlan = false
            )
        }
    }
}
