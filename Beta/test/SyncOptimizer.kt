package com.orbital.run.api

import android.content.Context
import com.orbital.run.logic.Persistence
import kotlinx.coroutines.*
import okhttp3.Request
import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap

/**
 * Performance Optimizations for Strava/Garmin Integration
 */
object SyncOptimizer {
    
    // ===== INTELLIGENT CACHE =====
    
    private data class CachedActivity(
        val activity: Persistence.CompletedActivity,
        val timestamp: Long
    )
    
    private val activityCache = ConcurrentHashMap<String, CachedActivity>()
    private const val CACHE_DURATION_MS = 24 * 60 * 60 * 1000L // 24 hours
    
    /**
     * Get activity from cache if valid
     */
    fun getCached(activityId: String): Persistence.CompletedActivity? {
        val cached = activityCache[activityId]
        return if (cached != null && System.currentTimeMillis() - cached.timestamp < CACHE_DURATION_MS) {
            cached.activity
        } else {
            activityCache.remove(activityId)
            null
        }
    }
    
    /**
     * Put activity in cache
     */
    fun putCache(activityId: String, activity: Persistence.CompletedActivity) {
        activityCache[activityId] = CachedActivity(activity, System.currentTimeMillis())
    }
    
    /**
     * Clear cache
     */
    fun clearCache() {
        activityCache.clear()
    }
    
    // ===== INCREMENTAL SYNC =====
    
    /**
     * Get last sync timestamp from preferences
     */
    fun getLastSyncTimestamp(context: Context): Long {
        val prefs = context.getSharedPreferences("sync_prefs", Context.MODE_PRIVATE)
        return prefs.getLong("last_sync", 0L)
    }
    
    /**
     * Save last sync timestamp
     */
    fun saveLastSyncTimestamp(context: Context, timestamp: Long) {
        val prefs = context.getSharedPreferences("sync_prefs", Context.MODE_PRIVATE)
        prefs.edit().putLong("last_sync", timestamp).apply()
    }
    
    /**
     * Sync only new activities (incremental) - Health Connect only
     * Note: This function is deprecated as Health Connect handles incremental sync automatically
     */
    suspend fun syncIncrementalHealthConnect(context: Context): List<Persistence.CompletedActivity> = withContext(Dispatchers.IO) {
        // Health Connect automatically handles incremental sync
        // This is just a placeholder for compatibility
        emptyList()
    }
    
    // ===== DATA COMPRESSION =====
    
    /**
     * Compress HR samples (reduce storage by ~80%)
     * Keep 1 sample every 5 seconds instead of every second
     */
    fun compressHRSamples(samples: List<Persistence.HeartRateSample>): List<Persistence.HeartRateSample> {
        if (samples.size < 100) return samples
        
        // Keep every 5th sample
        return samples.filterIndexed { index, _ -> index % 5 == 0 }
    }
    
    /**
     * Decompress HR samples (interpolate)
     */
    fun decompressHRSamples(compressed: List<Persistence.HeartRateSample>): List<Persistence.HeartRateSample> {
        if (compressed.size < 2) return compressed
        
        val decompressed = mutableListOf<Persistence.HeartRateSample>()
        
        compressed.zipWithNext().forEach { (a, b) ->
            decompressed.add(a)
            
            // Interpolate 4 points between a and b
            val step = (b.bpm - a.bpm) / 5.0
            for (i in 1..4) {
                decompressed.add(Persistence.HeartRateSample(
                    timeOffset = a.timeOffset + i,
                    bpm = (a.bpm + step * i).toInt()
                ))
            }
        }
        
        // Add last sample
        decompressed.add(compressed.last())
        
        return decompressed
    }
    
    /**
     * Fetch streams for multiple activities in parallel
     * Note: Deprecated - Health Connect provides data directly
     */
    suspend fun batchFetchStreams(
        activityIds: List<String>
    ): Map<String, List<Persistence.HeartRateSample>> = coroutineScope {
        // Health Connect provides data directly, no need for batch fetching
        emptyMap()
    }
    
    /**
     * Smart sync: Check cache first, then fetch only missing
     */
    suspend fun smartSync(
        context: Context,
        activityIds: List<String>
    ): List<Persistence.CompletedActivity> {
        val cached = mutableListOf<Persistence.CompletedActivity>()
        val toFetch = mutableListOf<String>()
        
        // Check cache
        activityIds.forEach { id ->
            val cachedActivity = getCached(id)
            if (cachedActivity != null) {
                cached.add(cachedActivity)
            } else {
                toFetch.add(id)
            }
        }
        
        // Fetch missing (batch)
        val fetched: List<Persistence.CompletedActivity> = if (toFetch.isNotEmpty()) {
            // Would fetch from API here
            emptyList()
        } else emptyList()
        
        return cached + fetched
    }
    
    // ===== PERFORMANCE METRICS =====
    
    private var syncStartTime = 0L
    private var activitiesSynced = 0
    private var bytesTransferred = 0L
    
    /**
     * Start performance tracking
     */
    fun startPerformanceTracking() {
        syncStartTime = System.currentTimeMillis()
        activitiesSynced = 0
        bytesTransferred = 0L
    }
    
    /**
     * Record activity synced
     */
    fun recordActivitySynced(bytes: Long = 0L) {
        activitiesSynced++
        bytesTransferred += bytes
    }
    
    /**
     * Get performance stats
     */
    fun getPerformanceStats(): String {
        val duration = (System.currentTimeMillis() - syncStartTime) / 1000.0
        val avgTime = if (activitiesSynced > 0) duration / activitiesSynced else 0.0
        val kbTransferred = bytesTransferred / 1024.0
        
        return """
            Sync Performance:
            - Duration: ${duration.toInt()}s
            - Activities: $activitiesSynced
            - Avg time/activity: ${String.format("%.1f", avgTime)}s
            - Data transferred: ${String.format("%.1f", kbTransferred)} KB
        """.trimIndent()
    }
}
