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
                
                val status = when {
                    matchingActivity != null -> {
                        // Check if it's a good match or partial
                        if (isGoodMatch(matchingActivity, day)) {
                            CompletionStatus.COMPLETED
                        } else {
                            CompletionStatus.PARTIAL
                        }
                    }
                    day.date.isBefore(java.time.LocalDate.now()) -> {
                        // Past date, no activity = skipped
                        CompletionStatus.SKIPPED
                    }
                    else -> {
                        // Future date = pending
                        CompletionStatus.PENDING
                    }
                }
                
                completions[key] = WorkoutCompletion(
                    planWeek = weekIndex,
                    planDay = dayIndex,
                    plannedDate = plannedDate,
                    completedDate = matchingActivity?.date,
                    actualActivity = matchingActivity,
                    status = status
                )
            }
        }
        
        state.workoutCompletions = completions
    }
    
    private fun findMatchingActivity(
        activities: List<ActivityItem>,
        plannedDay: TrainingPlanGenerator.DayPlan,
        plannedDate: String
    ): ActivityItem? {
        // Look for activities on the same date (or +/- 1 day flexibility)
        val targetDate = java.time.LocalDate.parse(plannedDate)
        val dayBefore = targetDate.minusDays(1).toString()
        val dayAfter = targetDate.plusDays(1).toString()
        
        return activities.firstOrNull { activity ->
            // Must be a run (plan is for running)
            activity.type == "run" &&
            // Date match (same day or +/- 1 day)
            (activity.date == plannedDate || activity.date == dayBefore || activity.date == dayAfter) &&
            // Distance roughly matches (within 30%)
            distanceMatches(activity.dist, plannedDay.dist)
        }
    }
    
    private fun distanceMatches(actualDist: String, plannedDist: Double): Boolean {
        // Parse actual distance (e.g. "10.2km" -> 10.2)
        val actual = actualDist.replace("km", "").toDoubleOrNull() ?: return false
        
        // Allow 30% variance
        val diff = abs(actual - plannedDist)
        val tolerance = plannedDist * 0.3
        
        return diff <= tolerance
    }
    
    private fun isGoodMatch(activity: ActivityItem, plannedDay: TrainingPlanGenerator.DayPlan): Boolean {
        // Parse distance
        val actualDist = activity.dist.replace("km", "").toDoubleOrNull() ?: return false
        
        // Good match if within 15% of planned distance
        val diff = abs(actualDist - plannedDay.dist)
        val tolerance = plannedDay.dist * 0.15
        
        return diff <= tolerance
    }
}
