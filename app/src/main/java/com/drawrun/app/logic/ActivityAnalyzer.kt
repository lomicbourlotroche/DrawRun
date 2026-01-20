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
        val longest = runs.maxOfOrNull { parseDistance(it.dist) } ?: 0.0
        
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
                val dist = parseDistance(run.dist) * 1000 // convert to meters
                abs(dist - targetDist) <= tolerance
            }
            
            if (candidates.isEmpty()) continue
            
            // Find fastest (best pace)
            val best = candidates.minByOrNull { parsePaceToSeconds(it.pace) }
            
            best?.let { run ->
                val distKm = parseDistance(run.dist)
                val durationSec = parseDuration(run.duration)
                
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
                val runDate = LocalDate.parse(run.date)
                runDate.isAfter(twelveWeeksAgo) && runDate.isBefore(today.plusDays(1))
            } catch (e: Exception) {
                false
            }
        }
        
        if (recentRuns.isEmpty()) return 0.0
        
        val totalKm = recentRuns.sumOf { parseDistance(it.dist) }
        val weeks = ChronoUnit.WEEKS.between(twelveWeeksAgo, today).coerceAtLeast(1)
        
        return totalKm / weeks
    }
    
    private fun estimateVDOT(bestTimes: Map<Double, BestPerformance>): Double? {
        // Prefer 10km, fallback to 5km
        val performance = bestTimes[10000.0] ?: bestTimes[5000.0] ?: return null
        
        return PerformanceAnalyzer.calculateVDOT(
            performance.distance * 1000, // convert to meters
            performance.timeSeconds / 60.0 // convert to minutes
        )
    }
    
    // Helper functions
    private fun parseDistance(distStr: String): Double {
        return distStr.replace("km", "").trim().toDoubleOrNull() ?: 0.0
    }
    
    private fun parsePaceToSeconds(paceStr: String): Double {
        // Format: "5:30 /km" -> 330 seconds
        try {
            val parts = paceStr.replace("/km", "").trim().split(":")
            if (parts.size == 2) {
                val min = parts[0].toIntOrNull() ?: 0
                val sec = parts[1].toIntOrNull() ?: 0
                return (min * 60 + sec).toDouble()
            }
        } catch (e: Exception) {}
        return Double.MAX_VALUE // Worst pace if parsing fails
    }
    
    private fun parseDuration(durationStr: String): Double {
        // Format: "45:30" or "1h23" -> seconds
        try {
            if (durationStr.contains("h")) {
                val parts = durationStr.split("h")
                val hours = parts[0].toIntOrNull() ?: 0
                val mins = parts.getOrNull(1)?.toIntOrNull() ?: 0
                return (hours * 3600 + mins * 60).toDouble()
            } else {
                val parts = durationStr.split(":")
                if (parts.size == 2) {
                    val min = parts[0].toIntOrNull() ?: 0
                    val sec = parts[1].toIntOrNull() ?: 0
                    return (min * 60 + sec).toDouble()
                }
            }
        } catch (e: Exception) {}
        return 0.0
    }
}
