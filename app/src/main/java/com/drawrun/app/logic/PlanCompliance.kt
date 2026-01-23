package com.drawrun.app.logic

import com.drawrun.app.ActivityItem
import com.drawrun.app.CustomRunWorkout
import com.drawrun.app.ActivityAnalysis
import com.drawrun.app.WorkoutStep
import com.drawrun.app.ui.components.calculateStepDist
import com.drawrun.app.ui.components.calculateStepDuration
import kotlin.math.abs

object PlanCompliance {

    fun calculateCompliance(
        activity: ActivityItem, 
        analysis: ActivityAnalysis?, 
        workout: CustomRunWorkout
    ): Int {
        var score = 100
        
        // 1. Basic Checks (Total Volume)
        val actDist = activity.dist.replace("km", "").toDoubleOrNull()?.times(1000) ?: 0.0
        val actDuration = ScienceEngine.parseDurationSeconds(activity.duration)
        
        val planDist = workout.totalDistance
        val planDuration = workout.totalDuration
        
        if (planDist > 0 && actDist > 0) {
            val ratio = actDist / planDist
            if (ratio < 0.8 || ratio > 1.2) score -= 20
            if (ratio < 0.5 || ratio > 1.5) score -= 30
        }
        
        if (planDuration > 0 && actDuration > 0) {
            val ratio = actDuration.toDouble() / planDuration
             if (ratio < 0.8 || ratio > 1.2) score -= 10
        }
        
        // 2. Lap Analysis (Advanced)
        // If workout has structure (more than 1 step) and we have lap data
        if (workout.steps.size > 1 && analysis != null && analysis.lapData.isNotEmpty()) {
            // Flatten steps (expand blocks)
            val flatSteps = flattenSteps(workout.steps)
            val laps = analysis.lapData
            
            // Allow some fuzzy matching (e.g. warmup might be 1 lap or manual)
            // If lap count differs significantly, penalize
            if (abs(laps.size - flatSteps.size) > 2) {
                score -= 15
            }
            
            // Check intensity of main work intervals
            // Find "RUN" steps
            var matchCount = 0
            var validCount = 0
            
            val minSize = minOf(laps.size, flatSteps.size)
            for (i in 0 until minSize) {
                val step = flatSteps[i]
                val lap = laps[i]
                
                if (step.type == "RUN") {
                    validCount++
                    // Check if pace/power matches target if set
                    // Fallback: Check if speed is higher than warmup/rest
                    // Simple heuristic for now: Run steps should be faster than Rest steps
                    // Implementation of detailed target matching is complex without structured pace targets parsing
                }
            }
        } else {
             // If no detailed analysis available but workout has structure, penalize slightly as we can't verify
             // score -= 10
        }
        
        return score.coerceIn(0, 100)
    }
    
    private fun flattenSteps(steps: List<WorkoutStep>): List<WorkoutStep> {
        val flat = mutableListOf<WorkoutStep>()
        steps.forEach { step ->
            if (step.type == "INTERVAL_BLOCK") {
                repeat(step.repeatCount) {
                    flat.addAll(flattenSteps(step.steps))
                }
            } else {
                flat.add(step)
            }
        }
        return flat
    }
}
