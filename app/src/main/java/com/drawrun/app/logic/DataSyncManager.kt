package com.drawrun.app.logic

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.RestingHeartRateRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.records.SpeedRecord
import androidx.health.connect.client.records.PowerRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.HeartRateVariabilityRmssdRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.drawrun.app.ActivityItem
import com.drawrun.app.AppState
import com.drawrun.app.ui.theme.AppTheme
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import androidx.compose.ui.graphics.Color
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DirectionsBike
import androidx.compose.material.icons.filled.DirectionsRun
import androidx.compose.material.icons.filled.Pool

import okhttp3.FormBody
import org.json.JSONObject

// New Strava API imports
import com.drawrun.app.api.StravaClient
import com.drawrun.app.data.ActivityDetailed
import com.drawrun.app.data.StravaTokenResponse
import android.util.Log

class DataSyncManager(val context: Context, val state: AppState) {

    // OAuth Configuration
    private val STRAVA_CLIENT_ID = 190602
    private val STRAVA_CLIENT_SECRET = "1909300e2dfb5301fab8b6e9bf9635206c983308"
    private val REDIRECT_URI = "http://localhost/strava_callback"
    
    // New Strava Client with automatic token management
    private val stravaClient = StravaClient(context, STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET)
    
    // Legacy OkHttp client for Health Connect and other non-Strava calls
    private val client = OkHttpClient()
    
    // Make public for ProfileScreen usage
    val healthConnectClient by lazy { HealthConnectClient.getOrCreate(context) }

    /**
     * Health Connect permissions required for the app.
     */
    val permissions = setOf(
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(RestingHeartRateRecord::class),
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(ExerciseSessionRecord::class),
        HealthPermission.getReadPermission(DistanceRecord::class),
        HealthPermission.getReadPermission(TotalCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(SpeedRecord::class),
        HealthPermission.getReadPermission(PowerRecord::class),
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(HeartRateVariabilityRmssdRecord::class),
        "android.permission.health.READ_EXERCISE_ROUTE"
    )

    suspend fun restoreConnections() = withContext(Dispatchers.IO) {
        // Check if we have valid tokens in the new TokenStorage
        if (stravaClient.tokenStorage.hasTokens()) {
            withContext(Dispatchers.Main) {
                state.stravaConnected = true
            }
            // Sync activities on restore
            syncStravaActivities()
        }
        val prefs = context.getSharedPreferences("drawrun_prefs", Context.MODE_PRIVATE)
        val healthConnected = prefs.getBoolean("health_connected", false)

        withContext(Dispatchers.Main) {
            state.healthConnectConnected = healthConnected
        }
        
        if (healthConnected) {
            syncHealthData()
        }
    }

    suspend fun checkHealthConnectAvailability(): Boolean {
        return try {
            HealthConnectClient.getOrCreate(context)
            true
        } catch (e: Exception) {
            false
        }
    }
    
    /**
     * Step 1: Start OAuth - Launches Browser or Strava App
     */
    fun startStravaAuth() {
        val authUrl = stravaClient.getMobileAuthorizationUrl(REDIRECT_URI)
        val intentUri = android.net.Uri.parse(authUrl)
            
        val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, intentUri)
        
        try {
            context.packageManager.getPackageInfo("com.strava", 0)
            intent.setPackage("com.strava")
        } catch (e: Exception) {
            // Fallback to browser
        }
        
        intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }

    /**
     * Step 2: Exchange Code for Token
     */
    suspend fun exchangeToken(code: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = stravaClient.api.exchangeToken(
                clientId = STRAVA_CLIENT_ID,
                clientSecret = STRAVA_CLIENT_SECRET,
                code = code
            ).execute()

            if (response.isSuccessful && response.body() != null) {
                val tokenResponse = response.body()!!
                
                // Save tokens securely
                stravaClient.tokenStorage.saveTokens(
                    accessToken = tokenResponse.accessToken,
                    refreshToken = tokenResponse.refreshToken,
                    expiresAt = tokenResponse.expiresAt,
                    athleteId = tokenResponse.athlete?.id
                )
                
                // Also save to legacy prefs for backward compatibility
                context.getSharedPreferences("drawrun_prefs", Context.MODE_PRIVATE).edit()
                    .putBoolean("strava_connected", true)
                    .apply()
                    
                withContext(Dispatchers.Main) {
                    state.stravaConnected = true
                }
                
                // Sync activities after successful connection
                syncStravaActivities()
                true
            } else {
                Log.e("DataSyncManager", "Token exchange failed: ${response.code()}")
                false
            }
        } catch (e: Exception) {
            Log.e("DataSyncManager", "Error exchanging token", e)
            false
        }
    }

    /**
     * Fetches real Heart Rate data AND Activities from Health Connect.
     */
    suspend fun syncHealthData() = withContext(Dispatchers.IO) {
        try {
            val granted = healthConnectClient.permissionController.getGrantedPermissions()
            if (!granted.containsAll(permissions)) {
                 android.util.Log.w("DrawRun", "Health Connect: Missing permissions")
                 return@withContext
            }

            val endTime = Instant.now()
            val startTime = endTime.minus(30, ChronoUnit.DAYS)
            
            // 1. Sync Resting HR & Readiness
            try {
                val response = healthConnectClient.readRecords(
                    ReadRecordsRequest(
                        recordType = RestingHeartRateRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
                    )
                )
                val latestResting = response.records.lastOrNull()
                if (latestResting != null) {
                    withContext(Dispatchers.Main) {
                        state.restingHR = latestResting.beatsPerMinute.toString()
                    }
                    android.util.Log.d("DrawRun", "Health Connect: Synced RHR = ${latestResting.beatsPerMinute}")
                } else {
                    android.util.Log.w("DrawRun", "Health Connect: No RHR data found")
                }
            } catch (e: Exception) { 
                android.util.Log.e("DrawRun", "Health Connect: RHR sync failed", e)
            }

            try {
                val sleepResponse = healthConnectClient.readRecords(
                    ReadRecordsRequest(
                        recordType = SleepSessionRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(endTime.minus(24, ChronoUnit.HOURS), endTime)
                    )
                )
                val totalSleepMinutes = sleepResponse.records.sumOf { 
                    ChronoUnit.MINUTES.between(it.startTime, it.endTime)
                }
                withContext(Dispatchers.Main) {
                    if (totalSleepMinutes > 0) {
                        state.sleepDuration = "%dh%02d".format(totalSleepMinutes / 60, totalSleepMinutes % 60)
                        state.sleepScore = (totalSleepMinutes.toFloat() / 480f * 100).coerceAtMost(100f).toInt().toString()
                        android.util.Log.d("DrawRun", "Health Connect: Synced Sleep = ${totalSleepMinutes}min")
                    }
                }
            } catch (e: Exception) { 
                android.util.Log.e("DrawRun", "Health Connect: Sleep sync failed", e)
            }

            try {
                val hrvResponse = healthConnectClient.readRecords(
                    ReadRecordsRequest(
                        recordType = HeartRateVariabilityRmssdRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(endTime.minus(7, ChronoUnit.DAYS), endTime)
                    )
                )
                val latestHRV = hrvResponse.records.lastOrNull()
                if (latestHRV != null) {
                    withContext(Dispatchers.Main) {
                        state.hrv = "%.0f".format(latestHRV.heartRateVariabilityMillis)
                    }
                    android.util.Log.d("DrawRun", "Health Connect: Synced HRV = ${latestHRV.heartRateVariabilityMillis}")
                }
            } catch (e: Exception) { 
                android.util.Log.e("DrawRun", "Health Connect: HRV sync failed", e)
            }

            // 1.5 Calculate Advanced Readiness
            withContext(Dispatchers.Main) {
                val sScore = state.sleepScore.toIntOrNull() ?: 70
                val hScore = (state.hrv.toIntOrNull() ?: 40).let { (it.toFloat() / 60f * 100f).coerceIn(40f, 100f).toInt() }
                val rScore = (state.restingHR.toIntOrNull() ?: 60).let { (100 - (it - 40) * 2).coerceIn(40, 100) }
                
                // Final Readiness calculation
                val finalReadiness = (sScore * 0.4 + hScore * 0.4 + rScore * 0.2).toInt().coerceIn(10, 100)
                state.readiness = finalReadiness.toString()
                
                // If we don't have RHR or HRV, use a neutral baseline for CTL/TSB
                if (state.ctl == "0") {
                    state.ctl = "30"
                }
            }

            // 2. Sync Activities
            if (!state.stravaConnected || state.activities.isEmpty()) {
                val sessionResponse = healthConnectClient.readRecords(
                    ReadRecordsRequest(
                        recordType = ExerciseSessionRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
                    )
                )
                
                android.util.Log.d("DrawRun", "Health Connect: Found ${sessionResponse.records.size} exercise sessions")
                
                val hcActivities = sessionResponse.records.map { session ->
                    val typeStr = when(session.exerciseType) {
                        ExerciseSessionRecord.EXERCISE_TYPE_RUNNING,
                        ExerciseSessionRecord.EXERCISE_TYPE_RUNNING_TREADMILL -> "run"
                        ExerciseSessionRecord.EXERCISE_TYPE_BIKING,
                        ExerciseSessionRecord.EXERCISE_TYPE_BIKING_STATIONARY -> "bike"
                        ExerciseSessionRecord.EXERCISE_TYPE_SWIMMING_POOL,
                        ExerciseSessionRecord.EXERCISE_TYPE_SWIMMING_OPEN_WATER -> "swim"
                        else -> "workout"
                    }

                    val durationSeconds = ChronoUnit.SECONDS.between(session.startTime, session.endTime)
                    val durationStr = if (durationSeconds > 3600) {
                        "%dh%02d".format(durationSeconds / 3600, (durationSeconds % 3600) / 60)
                    } else {
                        "%02d:%02d".format(durationSeconds / 60, durationSeconds % 60)
                    }

                    // Route fetching removed for stability if property not available in this version
                    val routePolyline: String? = null // getRouteSchematic(session)
                    
                    ActivityItem(
                        id = session.hashCode(),
                        type = typeStr,
                        title = session.title ?: "Activité Health Connect",
                        date = session.startTime.atZone(ZoneId.systemDefault()).toLocalDate().toString(),
                        dist = "--",
                        load = "HC",
                        duration = durationStr,
                        pace = "--", 
                        avgHr = "--", 
                        mapPolyline = routePolyline,
                        color = when(typeStr) {
                            "run" -> Color(0xFFFF3B30)
                            "swim" -> Color(0xFF007AFF)
                            else -> Color(0xFFF59E0B)
                        },
                        icon = when(typeStr) {
                            "run" -> Icons.Default.DirectionsRun
                            "swim" -> Icons.Default.Pool
                            else -> Icons.Default.DirectionsBike
                        },
                        startTime = session.startTime.toString(),
                        endTime = session.endTime.toString()
                    )
                }
                
                val currentList = state.activities.toMutableList()
                currentList.addAll(hcActivities)
                withContext(Dispatchers.Main) {
                    state.activities = currentList.distinctBy { it.id }
                }
            }
            
            android.util.Log.i("DrawRun", "Health Connect: Sync completed successfully")

        } catch (e: Exception) {
            android.util.Log.e("DrawRun", "Health Connect: Sync failed", e)
            e.printStackTrace()
        }
    }


    /**
     * Fetches real activities from Strava with unlimited pagination.
     * Token refresh is handled automatically by StravaAuthenticator.
     */
    suspend fun syncStravaActivities() = withContext(Dispatchers.IO) {
        withContext(Dispatchers.Main) { state.isSyncing = true }
        
        try {
            val allActivities = mutableListOf<ActivityItem>()
            var page = 1
            var totalLoadWeek = 0
            
            // Pagination loop to fetch ALL activities
            while (true) {
                val activities = stravaClient.api.getActivities(page = page, perPage = 200)
                
                if (activities.isEmpty()) break // No more activities
                
                // Convert ActivityDetailed to ActivityItem
                for (activity in activities) {
                    val type = activity.type.lowercase()
                    val dist = (activity.distance / 1000.0).let { "%.1fkm".format(it) }
                    
                    val duration = if (activity.movingTime > 3600) {
                        "%dh%02d".format(activity.movingTime / 3600, (activity.movingTime % 3600) / 60)
                    } else {
                        "%02d:%02d".format(activity.movingTime / 60, activity.movingTime % 60)
                    }
                    
                    val pace = if (activity.averageSpeed > 0) {
                        val paceSeconds = (1000 / activity.averageSpeed).toInt()
                        "%d:%02d /km".format(paceSeconds / 60, paceSeconds % 60)
                    } else "--"
                    
                    val hrStr = activity.averageHeartrate?.let { "%.0f bpm".format(it) } ?: "--"
                    
                    val sufferScore = activity.sufferScore ?: 0
                    // Only count first 7 activities for weekly load (most recent)
                    if (allActivities.size < 7) totalLoadWeek += sufferScore
                    
                    allActivities.add(ActivityItem(
                        id = activity.id.toInt(),
                        type = type,
                        title = activity.name,
                        date = activity.startDateLocal.take(10),
                        dist = dist,
                        load = "TSS $sufferScore",
                        duration = duration,
                        pace = pace,
                        avgHr = hrStr,
                        mapPolyline = activity.map?.summaryPolyline,
                        color = when(type) {
                            "run" -> Color(0xFFFF3B30)
                            "swim" -> Color(0xFF007AFF)
                            else -> Color(0xFFF59E0B)
                        },
                        icon = when(type) {
                            "run" -> Icons.Default.DirectionsRun
                            "swim" -> Icons.Default.Pool
                            else -> Icons.Default.DirectionsBike
                        }
                    ))
                }
                
                page++
            }
            
            withContext(Dispatchers.Main) {
                state.activities = allActivities
                state.stravaConnected = true
                
                if (state.readiness == "--" || state.readiness.isBlank()) {
                    val proxyReadiness = (100 - (totalLoadWeek / 20)).coerceIn(10, 100)
                    state.readiness = proxyReadiness.toString()
                    state.ctl = (totalLoadWeek / 7).toString()
                    state.tsb = "0"
                }
            }
            
            // Sync additional data
            syncStravaProfile()
            syncStravaZones()
        } catch (e: Exception) {
            Log.e("DataSyncManager", "Error syncing activities", e)
        } finally {
            withContext(Dispatchers.Main) { state.isSyncing = false }
        }
    }

    suspend fun syncStravaProfile() = withContext(Dispatchers.IO) {
        try {
            val athlete = stravaClient.api.getAuthenticatedAthlete()
            
            withContext(Dispatchers.Main) {
                // TODO: Add these properties to AppState if needed
                // state.athleteName = "${athlete.firstname ?: ""} ${athlete.lastname ?: ""}".trim()
                // state.athleteCity = athlete.city ?: ""
                // state.athleteCountry = athlete.country ?: ""
                // state.athleteFtp = athlete.ftp ?: 0
                
                if (athlete.firstname?.isNotBlank() == true) {
                    state.firstName = athlete.firstname
                }
                if (athlete.weight != null && athlete.weight > 0) {
                    state.weight = "%.1f".format(athlete.weight)
                }
            }
            
            // Sync stats if we have athlete ID
            val athleteId = athlete.id
            if (athleteId != null && athleteId > 0) {
                state.stravaAthleteId = athleteId.toInt()
                syncStravaStats(athleteId)
            }
        } catch (e: Exception) {
            Log.e("DataSyncManager", "Error syncing profile", e)
        }
    }

    /**
     * Fetches detailed streams and analyzes an activity
     */
    suspend fun syncActivityDetail(activityId: Int, type: String) = withContext(Dispatchers.IO) {
        android.util.Log.d("DrawRun", "syncActivityDetail: Starting for activity $activityId")
        
        try {
            val streams = stravaClient.api.getActivityStreams(activityId.toLong())
            android.util.Log.d("DrawRun", "syncActivityDetail: Received streams data")
            
            // Extract stream data
            val timeStream = (streams["time"]?.data as? List<*>)?.mapNotNull { (it as? Number)?.toInt() } ?: emptyList()
            val distStream = (streams["distance"]?.data as? List<*>)?.mapNotNull { (it as? Number)?.toDouble() }
            val altStream = (streams["altitude"]?.data as? List<*>)?.mapNotNull { (it as? Number)?.toDouble() }
            val hrStream = (streams["heartrate"]?.data as? List<*>)?.mapNotNull { (it as? Number)?.toInt() }
            val cadStream = (streams["cadence"]?.data as? List<*>)?.mapNotNull { (it as? Number)?.toInt() }
            val pwrStream = (streams["watts"]?.data as? List<*>)?.mapNotNull { (it as? Number)?.toInt() }
            val velStream = (streams["velocity_smooth"]?.data as? List<*>)?.mapNotNull { (it as? Number)?.toDouble() }
            
            android.util.Log.d("DrawRun", "syncActivityDetail: Streams fetched - time:${timeStream.size}, hr:${hrStream?.size}, vel:${velStream?.size}")
            
            val activityStreams = com.drawrun.app.ActivityStreams(
                time = timeStream,
                distance = distStream,
                heartRate = hrStream,
                pace = velStream, // velocity_smooth is m/s
                altitude = altStream,
                cadence = cadStream,
                power = pwrStream,
                vam = if (altStream != null) PerformanceAnalyzer.calculateVAM(altStream, timeStream) else null,
                hrDerivative = if (hrStream != null) PerformanceAnalyzer.calculateHRDerivative(hrStream, timeStream) else null,
                gradAdjustedPace = if (velStream != null && altStream != null && distStream != null) {
                    PerformanceAnalyzer.calculateGAP(velStream, altStream, distStream)
                } else null
            )
            
            android.util.Log.d("DrawRun", "syncActivityDetail: Running analysis with zones = ${state.zones != null}")
            val analysis = PerformanceAnalyzer.analyzeActivity(type, activityStreams, state.zones)
            android.util.Log.d("DrawRun", "syncActivityDetail: Analysis complete - IF=${analysis.intensityFactor}, TSS=${analysis.tss}")
            
            withContext(Dispatchers.Main) {
                state.selectedActivityStreams = activityStreams
                state.selectedActivityAnalysis = analysis
                android.util.Log.d("DrawRun", "syncActivityDetail: State updated successfully")
            }
        } catch (e: Exception) {
            android.util.Log.e("DrawRun", "syncActivityDetail: Exception occurred", e)
        }
    }


    suspend fun syncStravaStats(athleteId: Long) = withContext(Dispatchers.IO) {
        try {
            val statsResponse = stravaClient.api.getAthleteStats(athleteId)
            
            val stats = com.drawrun.app.AthleteStats(
                allRunTotals = statsResponse.allRunTotals?.let {
                    com.drawrun.app.Totals(
                        count = it.count,
                        distance = it.distance.toDouble(),
                        movingTime = it.movingTime,
                        elapsedTime = it.elapsedTime,
                        elevationGain = it.elevationGain.toDouble()
                    )
                } ?: com.drawrun.app.Totals(0, 0.0, 0, 0, 0.0),
                allBikeTotals = statsResponse.allRideTotals?.let {
                    com.drawrun.app.Totals(
                        count = it.count,
                        distance = it.distance.toDouble(),
                        movingTime = it.movingTime,
                        elapsedTime = it.elapsedTime,
                        elevationGain = it.elevationGain.toDouble()
                    )
                } ?: com.drawrun.app.Totals(0, 0.0, 0, 0, 0.0),
                allSwimTotals = statsResponse.allSwimTotals?.let {
                    com.drawrun.app.Totals(
                        count = it.count,
                        distance = it.distance.toDouble(),
                        movingTime = it.movingTime,
                        elapsedTime = it.elapsedTime,
                        elevationGain = it.elevationGain.toDouble()
                    )
                } ?: com.drawrun.app.Totals(0, 0.0, 0, 0, 0.0)
            )
            
            withContext(Dispatchers.Main) {
                state.athleteStats = stats
            }
        } catch (e: Exception) {
            Log.e("DataSyncManager", "Error syncing stats", e)
        }
    }

    suspend fun syncStravaZones() = withContext(Dispatchers.IO) {
        try {
            val zonesResponse = stravaClient.api.getAthleteZones()
            
            val hrZones = zonesResponse.heartRate?.let {
                com.drawrun.app.HRZones(
                    customZones = it.customZones,
                    zones = it.zones.map { zone ->
                        com.drawrun.app.HRZone(zone.min, zone.max)
                    }
                )
            }

            val pwrZones = zonesResponse.power?.let {
                com.drawrun.app.PowerZones(
                    zones = it.zones.map { zone ->
                        com.drawrun.app.PowerZone(zone.min, zone.max)
                    }
                )
            }

            withContext(Dispatchers.Main) {
                state.athleteZones = com.drawrun.app.AthleteZones(hrZones, pwrZones)
            }
        } catch (e: Exception) {
            Log.e("DataSyncManager", "Error syncing zones", e)
        }
    }
    /**
     * Fetches detailed streams (HR, Speed) from Health Connect for a specific time range.
     */
    suspend fun syncHealthConnectDetail(startTime: Instant, endTime: Instant, type: String) = withContext(Dispatchers.IO) {
        try {
             // 1. Fetch Heart Rate Series
            val hrResponse = healthConnectClient.readRecords(
                ReadRecordsRequest(
                    recordType = HeartRateRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
                )
            )
            // Flatten HR samples. Each record has multiple samples.
            val hrSamples = hrResponse.records.flatMap { it.samples }
            
            // 2. Fetch Speed Series (if running)
            val speedSamples = if (type == "run") {
                val speedResponse = healthConnectClient.readRecords(
                    ReadRecordsRequest(
                        recordType = SpeedRecord::class,
                        timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
                    )
                )
                speedResponse.records.flatMap { it.samples }
            } else emptyList()

            // 3. Construct Streams
            // We need to align them to a common time axis (e.g. seconds from start) if possible, 
            // or just provide raw lists. For analysis, let's normalize to 1-second ticks ideally, 
            // but for now, we'll just extract values in order.
            
            // Simplified: Just take values. Analysis might need timestamps for proper correlation, 
            // but ActivityStreams structure expects List<Int/Double>.
            
            // Create a rough time stream based on HR samples (assuming they are frequent)
            // or generate one 0..duration
            val durationSec = ChronoUnit.SECONDS.between(startTime, endTime).toInt()
            val timeStream = if (hrSamples.isNotEmpty()) {
                hrSamples.map { ChronoUnit.SECONDS.between(startTime, it.time).toInt() }
            } else {
                List(durationSec) { it }
            }

            val streams = com.drawrun.app.ActivityStreams(
                time = timeStream,
                distance = null, // HC distance is often total, not time-series unless using DistanceRecord per segment
                heartRate = hrSamples.map { it.beatsPerMinute.toInt() },
                pace = speedSamples.map { it.speed.inMetersPerSecond },
                altitude = null,
                cadence = null,
                power = null, 
                vam = null,
                hrDerivative = null,
                gradAdjustedPace = null
            )

            val analysis = PerformanceAnalyzer.analyzeActivity(type, streams, state.zones)

            withContext(Dispatchers.Main) {
                state.selectedActivityStreams = streams
                state.selectedActivityAnalysis = analysis
            }

        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}


