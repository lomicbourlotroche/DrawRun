package com.drawrun.app.logic

import com.drawrun.app.AppState
import com.drawrun.app.ActivityItem
import com.drawrun.app.WorkoutCompletion
import com.drawrun.app.CompletionStatus
import kotlin.math.abs

object WorkoutMatcher {
    
    /**
     * Matches completed activities to planned workouts and updates completion status.
     * Called after sync to automatically track plan progress.
     */
    fun updateWorkoutCompletions(state: AppState) {
        if (state.generatedRunPlan.isEmpty()) return
        
        val completions = mutableMapOf<String, WorkoutCompletion>()
        
        state.generatedRunPlan.forEachIndexed { weekIndex, week ->
            week.days.forEachIndexed { dayIndex, day ->
                val key = "week${weekIndex}_day${dayIndex}"
                val plannedDate = day.date.toString()
                
                // Find matching activity
                val matchingActivity = findMatchingActivity(state.activities, day, plannedDate)
                
                // Calculate completion score
                val score = if (matchingActivity != null) {
                    calculateCompletionScore(day, matchingActivity, plannedDate)
                } else 0
                
                val status = when {
                    matchingActivity != null && score >= 85 -> CompletionStatus.COMPLETED
                    matchingActivity != null && score >= 50 -> CompletionStatus.PARTIAL
                    matchingActivity != null -> CompletionStatus.PARTIAL
                    day.date.isBefore(java.time.LocalDate.now()) -> CompletionStatus.SKIPPED
                    else -> CompletionStatus.PENDING
                }
                
                completions[key] = WorkoutCompletion(
                    planWeek = weekIndex,
                    planDay = dayIndex,
                    plannedDate = plannedDate,
                    completedDate = matchingActivity?.date,
                    actualActivity = matchingActivity,
                    status = status,
                    completionScore = score
                )
            }
        }
        
        state.workoutCompletions = completions
    }
    
    private fun calculateCompletionScore(
        plannedDay: TrainingPlanGenerator.DayPlan,
        actualActivity: ActivityItem,
        plannedDate: String
    ): Int {
        var score = 0
        
        // Distance match (60% weight)
        val plannedDist = plannedDay.dist
        val actualDist = actualActivity.dist.replace("km", "").toDoubleOrNull() ?: 0.0
        
        if (plannedDist > 0 && actualDist > 0) {
            val distDiff = abs(actualDist - plannedDist) / plannedDist
            val distScore = (1.0 - distDiff).coerceIn(0.0, 1.0)
            score += (distScore * 60).toInt()
        }
        
        // Date proximity (40% weight)
        val targetDate = java.time.LocalDate.parse(plannedDate)
        val actualDate = try {
            java.time.LocalDate.parse(actualActivity.date)
        } catch (e: Exception) {
            targetDate
        }
        
        val daysDiff = abs(java.time.temporal.ChronoUnit.DAYS.between(targetDate, actualDate))
        val dateScore = when (daysDiff) {
            0L -> 1.0  // Same day = perfect
            1L -> 0.8  // 1 day off = 80%
            2L -> 0.5  // 2 days off = 50%
            else -> 0.2 // 3+ days = 20%
        }
        score += (dateScore * 40).toInt()
        
        return score.coerceIn(0, 100)
    }
    
    private fun findMatchingActivity(
        activities: List<ActivityItem>,
        plannedDay: TrainingPlanGenerator.DayPlan,
        plannedDate: String
    ): ActivityItem? {
        // Look for activities on the same date (or +/- 2 days flexibility)
        val targetDate = java.time.LocalDate.parse(plannedDate)
        val twoDaysBefore = targetDate.minusDays(2).toString()
        val twoDaysAfter = targetDate.plusDays(2).toString()
        
        return activities.firstOrNull { activity ->
            // Must be a run (plan is for running)
            activity.type == "run" &&
            // Date match (same day or +/- 2 days)
            (activity.date >= twoDaysBefore && activity.date <= twoDaysAfter) &&
            // Distance roughly matches (within 50% for flexible matching)
            distanceMatches(activity.dist, plannedDay.dist, tolerance = 0.5)
        }
    }
    
    private fun distanceMatches(actualDist: String, plannedDist: Double, tolerance: Double = 0.3): Boolean {
        // Parse actual distance (e.g. "10.2km" -> 10.2)
        val actual = actualDist.replace("km", "").toDoubleOrNull() ?: return false
        
        // Allow tolerance variance
        val diff = abs(actual - plannedDist)
        val maxDiff = plannedDist * tolerance
        
        return diff <= maxDiff
    }
}
