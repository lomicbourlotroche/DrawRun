package com.drawrun.app.logic

import com.drawrun.app.ActivityItem
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import kotlin.math.abs

object ActivityAnalyzer {
    
    data class ActivityInsights(
        val bestTimes: Map<Double, BestPerformance>, // distance (meters) -> performance
        val longestRun: Double, // km
        val weeklyAverage: Double, // km/week over last 12 weeks
        val totalRuns: Int,
        val estimatedVDOT: Double?
    )
    
    data class BestPerformance(
        val timeSeconds: Double,
        val date: String,
        val pace: String, // min/km format
        val distance: Double // km
    )
    
    /**
     * Analyzes running activity history to extract training insights
     */
    fun analyzeActivities(activities: List<ActivityItem>): ActivityInsights {
        val runs = activities.filter { it.type == "run" }
        
        if (runs.isEmpty()) {
            return ActivityInsights(
                bestTimes = emptyMap(),
                longestRun = 0.0,
                weeklyAverage = 0.0,
                totalRuns = 0,
                estimatedVDOT = null
            )
        }
        
        // Find best times for standard distances
        val bestTimes = findBestTimes(runs)
        
        // Calculate weekly average (last 12 weeks)
        val weeklyAvg = calculateWeeklyAverage(runs)
        
        // Find longest run
        val longest = runs.maxOfOrNull { ScienceEngine.parseDistanceToMeters(it.dist) / 1000.0 } ?: 0.0
        
        // Estimate VDOT from best 10km or 5km
        val vdot = estimateVDOT(bestTimes)
        
        return ActivityInsights(
            bestTimes = bestTimes,
            longestRun = longest,
            weeklyAverage = weeklyAvg,
            totalRuns = runs.size,
            estimatedVDOT = vdot
        )
    }
    
    private fun findBestTimes(runs: List<ActivityItem>): Map<Double, BestPerformance> {
        val standardDistances = listOf(
            5000.0,   // 5km
            10000.0,  // 10km
            21097.0,  // Half marathon
            42195.0   // Marathon
        )
        
        val bestTimes = mutableMapOf<Double, BestPerformance>()
        
        for (targetDist in standardDistances) {
            // Find runs within ±5% of target distance
            val tolerance = targetDist * 0.05
            val candidates = runs.filter { run ->
                val dist = ScienceEngine.parseDistanceToMeters(run.dist)
                abs(dist - targetDist) <= tolerance
            }
            
            if (candidates.isEmpty()) continue
            
            // Find fastest (best pace)
            val best = candidates.minByOrNull { ScienceEngine.parsePaceToSeconds(it.pace) }
            
            best?.let { run ->
                val distKm = ScienceEngine.parseDistanceToMeters(run.dist) / 1000.0
                val durationSec = ScienceEngine.parseDurationSeconds(run.duration)
                
                if (durationSec > 0) {
                    bestTimes[targetDist] = BestPerformance(
                        timeSeconds = durationSec,
                        date = run.date,
                        pace = run.pace,
                        distance = distKm
                    )
                }
            }
        }
        
        return bestTimes
    }
    
    private fun calculateWeeklyAverage(runs: List<ActivityItem>): Double {
        val today = LocalDate.now()
        val twelveWeeksAgo = today.minusWeeks(12)
        
        val recentRuns = runs.filter { run ->
            try {
                val runDate = safeDateParse(run.date)
                if (runDate != null) {
                    runDate.isAfter(twelveWeeksAgo) && runDate.isBefore(today.plusDays(1))
                } else false
            } catch (e: Exception) {
                false
            }
        }
        
        if (recentRuns.isEmpty()) return 0.0
        
        val totalKm = recentRuns.sumOf { ScienceEngine.parseDistanceToMeters(it.dist) / 1000.0 }
        val weeks = ChronoUnit.WEEKS.between(twelveWeeksAgo, today).coerceAtLeast(1)
        
        return totalKm / weeks
    }
    
    private fun estimateVDOT(bestTimes: Map<Double, BestPerformance>): Double? {
        // Calculate VDOT for each best time and find the maximum (Global Best VDOT)
        if (bestTimes.isEmpty()) return null
        
        var maxVdot = 0.0
        
        bestTimes.values.forEach { performance ->
            val vdot = ScienceEngine.calculateVDOT(
                performance.distance * 1000, // convert to meters
                performance.timeSeconds / 60.0 // convert to minutes
            )
            if (vdot > maxVdot) {
                maxVdot = vdot
            }
        }
        
        return if (maxVdot > 0) maxVdot else null
    }
    
    // Helpers removed (parseDistance, parsePaceToSeconds, parseDuration) -> Use ScienceEngine
    
    private fun safeDateParse(dateStr: String): LocalDate? {
        // Handle "2024-01-20" or "2024-01-20T10:00:00Z"
        try {
            if (dateStr.isBlank()) return null
            val cleanDate = dateStr.substringBefore("T").trim()
            return LocalDate.parse(cleanDate)
        } catch (e: Exception) {
            return null
    }
}
}
