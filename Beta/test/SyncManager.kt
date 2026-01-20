package com.orbital.run.api

import android.content.Context
import com.orbital.run.logic.Persistence
import kotlinx.coroutines.*

/**
 * Strava-only sync manager.
 * All activity data comes exclusively from Strava API.
 */
object SyncManager {
    
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    /**
     * Main entry point for synchronization.
     * Strava-only sync.
     */
    suspend fun syncAll(context: Context, onProgress: ((Int, Int) -> Unit)? = null): Int {
        android.util.Log.d("SYNC", "=== Début syncAll (Strava Only) ===")
        
        var totalNew = 0
        
        // Strava Sync (Unique Source)
        if (com.orbital.run.api.StravaManager.isConnected(context)) {
            val daysBack = com.orbital.run.logic.SyncPreferences.getDaysBack(context)
            val stravaCount = com.orbital.run.api.StravaManager.syncActivities(context, daysBack)
            totalNew += stravaCount
            android.util.Log.d("SYNC", "Strava: $stravaCount activités récupérées")
        }
        
        android.util.Log.d("SYNC", "=== FIN SYNC: $totalNew activités traitées ===")
        return totalNew
    }

    // syncHealthConnect removed - Strava Only
    
    // Core of "The Cake": Merging Data
    private fun saveActivitiesIfNew(context: Context, activities: List<Persistence.CompletedActivity>, source: String): Int {
        val history = Persistence.loadHistory(context).toMutableList()
        var newCount = 0
        var mergedCount = 0
        
        activities.forEach { act ->
            if (Persistence.isBlacklisted(context, act.id)) return@forEach
            
            // Deduplication Logic: Find existing matching activity
            // REFINED MATCHING (V3):
            // 1. Strong Match: Within 5 minutes -> ALWAYS MATCH (ignore distance/duration diffs caused by GPS/Sensor errors)
            // 2. Weak Match: Within 30 minutes -> Check distance/duration to avoid merging sequential activities
            val index = history.indexOfFirst { 
                if (it.externalId == act.externalId || it.id == act.id) return@indexOfFirst true
                
                val timeDiff = kotlin.math.abs(it.date - act.date)
                
                // Case 1: Strong Time Match (< 15 mins now, to be safe against timezone/sync delays)
                if (timeDiff < 15 * 60 * 1000) return@indexOfFirst true
                
                // Case 2: Weak Match (15-60 mins) or Just Duplicate detection
                // If it's the SAME DAY and SIMILAR DISTANCE/DURATION, it's likely a duplicate
                if (timeDiff < 60 * 60 * 1000) {
                     val distDiff = kotlin.math.abs(it.distanceKm - act.distanceKm)
                     val isDistClose = distDiff < 0.5 || (act.distanceKm > 0 && distDiff / act.distanceKm < 0.1) // 10% diff
                     return@indexOfFirst isDistClose
                }
                
                false
            }
            
            if (index == -1) {
                // New Activity
                history.add(0, act)
                newCount++
                android.util.Log.d("SYNC", "  → Nouvelle ($source): ${act.title}")
            } else {
                // Merge Data (The Cake)
                // Existing activity + New Data -> Richer Activity
                val existing = history[index]
                val merged = Persistence.mergeActivities(existing, act)
                
                if (merged != existing) {
                    history[index] = merged
                    mergedCount++
                    android.util.Log.d("SYNC", "  ⊕ Fusion ($source): ${act.title}")
                }
            }
        }
        
        if (newCount > 0 || mergedCount > 0) {
            // Sort by date descending
            history.sortByDescending { it.date }
            Persistence.saveHistoryList(context, history) // Assuming this is public or we use saveHistoryBatch
        }
        return newCount // Return new count for UI notification
    }

    /**
     * EXPORT: Push an activity to Strava
     */
    suspend fun syncToAll(context: Context, activity: Persistence.CompletedActivity) {
        withContext(Dispatchers.IO) {
            // Strava Export (if upload feature is implemented)
            if (com.orbital.run.api.StravaManager.isConnected(context)) {
                // StravaManager.upload(context, activity) // Future feature
            }
        }
    }
    
    /**
     * Trigger manual sync with UI feedback.
     */
    suspend fun manualSync(context: Context): SyncResult = withContext(Dispatchers.IO) {
        try {
            val count = syncAll(context)
            if (count > 0) {
                Persistence.recalculateRecords(context)
                SyncResult.Success(count)
            } else {
                SyncResult.NoNewData
            }
        } catch (e: Exception) {
            android.util.Log.e("SYNC", "Erreur sync manuel: ${e.message}", e)
            SyncResult.Error(e.message ?: "Erreur inconnue")
        }
    }
    
    sealed class SyncResult {
        data class Success(val count: Int) : SyncResult()
        object NoNewData : SyncResult()
        data class Error(val message: String) : SyncResult()
    }
}
