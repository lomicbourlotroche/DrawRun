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
import androidx.compose.ui.graphics.toArgb
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
    
    // Make public for Screen usage
    val healthConnectManager = HealthConnectManager(context)
    val healthConnectClient get() = healthConnectManager.healthConnectClient
    val permissions get() = healthConnectManager.allPermissions

    suspend fun restoreConnections() = withContext(Dispatchers.IO) {
        val prefs = context.getSharedPreferences("drawrun_prefs", Context.MODE_PRIVATE)
        
        // Collect all data in IO context first
        val hasStravaTokens = stravaClient.tokenStorage.hasTokens()
        val cachedActivities = mutableListOf<ActivityItem>()
        
        // 1. Load cached activities if Strava connected
        if (hasStravaTokens) {
            val cachedJson = prefs.getString("cached_activities", null)
            if (cachedJson != null) {
                try {
                    val array = JSONArray(cachedJson)
                    for (i in 0 until array.length()) {
                        val obj = array.getJSONObject(i)
                        cachedActivities.add(ActivityItem(
                            id = obj.getLong("id"),
                            type = obj.getString("type"),
                            title = obj.getString("title"),
                            date = obj.getString("date"),
                            dist = obj.getString("dist"),
                            load = obj.getString("load"),
                            duration = obj.getString("duration"),
                            pace = obj.getString("pace"),
                            avgHr = obj.getString("avgHr"),
                            mapPolyline = if (obj.has("map")) obj.getString("map") else null,
                            color = Color(obj.getInt("color")),
                            icon = Icons.Default.DirectionsRun,
                            startTime = if (obj.has("start")) obj.getString("start") else null,
                            endTime = if (obj.has("end")) obj.getString("end") else null
                        ))
                    }
                } catch (e: Exception) { 
                    Log.e("DrawRun", "Cache Load Failed", e) 
                }
            }
        }
        
        // 2. Check Health Connect status
        val healthConnected = prefs.getBoolean("health_connected", false)
        val corePermissions = setOf(
            HealthPermission.getReadPermission(HeartRateRecord::class),
            HealthPermission.getReadPermission(ExerciseSessionRecord::class)
        )
        val allGranted = if (healthConnected) healthConnectManager.hasPermissions(corePermissions) else false
        
        // BATCH UPDATE: Apply all state changes atomically on Main thread
        withContext(Dispatchers.Main) {
            state.stravaConnected = hasStravaTokens
            if (cachedActivities.isNotEmpty()) {
                state.activities = cachedActivities
            }
            state.healthConnectConnected = healthConnected
            state.healthConnectPermissionsGranted = allGranted
        }
        
        // Trigger background syncs after state is restored
        if (hasStravaTokens) {
            syncStravaActivities()
        }
        if (healthConnected && allGranted) {
            syncHealthData()
        }
    }


    suspend fun checkHealthConnectAvailability(): Boolean {
        val status = healthConnectManager.checkAvailability()
        return status == HealthConnectClient.SDK_AVAILABLE
    }
    
    /**
     * Step 1: Start OAuth - Launches Browser or Strava App
     */
    fun startStravaAuth() {
        val authUrl = stravaClient.getMobileAuthorizationUrl(REDIRECT_URI)
        android.util.Log.d("DrawRun", "Strava: Starting auth with URL: $authUrl")
        val intentUri = android.net.Uri.parse(authUrl)
            
        val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, intentUri)
        
        try {
            context.packageManager.getPackageInfo("com.strava", 0)
            android.util.Log.d("DrawRun", "Strava: Strava app found, forcing package")
            intent.setPackage("com.strava")
        } catch (e: Exception) {
            android.util.Log.d("DrawRun", "Strava: Strava app not found, using default browser")
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
                val errorBody = response.errorBody()?.string()
                android.util.Log.e("DrawRun", "Strava: Token exchange failed | Code: ${response.code()} | Error: $errorBody")
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
            val allGranted = healthConnectManager.hasPermissions(permissions as Set<String>)
            withContext(Dispatchers.Main) {
                state.healthConnectPermissionsGranted = allGranted
            }
            
            if (!allGranted) {
                 android.util.Log.w("DrawRun", "Health Connect: Missing permissions")
                 return@withContext
            }

            val endTime = Instant.now()
            val startTime = endTime.minus(30, ChronoUnit.DAYS)
            
            // 1. Sync Resting HR & Readiness
            try {
                val latestResting = healthConnectManager.readRestingHeartRate(startTime, endTime).lastOrNull()
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
                // Look back 48 hours to ensure we catch the last sleep session even if synced late
                val recentSleep = healthConnectManager.readSleepSessions(endTime.minus(48, ChronoUnit.HOURS), endTime)
                    .sortedByDescending { it.endTime }
                    .firstOrNull() // Take the most recent sleep session

                if (recentSleep != null) {
                    val totalSleepMinutes = ChronoUnit.MINUTES.between(recentSleep.startTime, recentSleep.endTime)
                    withContext(Dispatchers.Main) {
                        state.sleepDuration = "%dh%02d".format(totalSleepMinutes / 60, totalSleepMinutes % 60)
                        state.sleepScore = (totalSleepMinutes.toFloat() / 480f * 100).coerceAtMost(100f).toInt().toString()
                    }
                    android.util.Log.d("DrawRun", "Health Connect: Synced Sleep = ${totalSleepMinutes}min from ${recentSleep.startTime}")
                }
            } catch (e: Exception) { 
                android.util.Log.e("DrawRun", "Health Connect: Sleep sync failed", e)
            }

            try {
                val latestHRV = healthConnectManager.readHRV(endTime.minus(7, ChronoUnit.DAYS), endTime).lastOrNull()
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
                        id = session.hashCode().toLong(),
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
            
            // Pagination loop to fetch ALL activities
            while (true) {
                android.util.Log.d("DrawRun", "Strava: Fetching page $page...")
                val activities = try {
                    stravaClient.api.getActivities(page = page, perPage = 200)
                } catch (e: Exception) {
                    android.util.Log.e("DrawRun", "Strava: Network error on page $page", e)
                    break
                }
                
                android.util.Log.d("DrawRun", "Strava: Received ${activities.size} activities on page $page")
                if (activities.isEmpty()) break
                
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
                    
                    allActivities.add(ActivityItem(
                        id = activity.id,
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
            
            // Perform all heavy computations in IO context
            val pmcData = PerformanceAnalyzer.calculatePMC(allActivities)
            val latestPmc = pmcData.lastOrNull()
            
            // Prepare cache data
            val prefs = context.getSharedPreferences("drawrun_prefs", Context.MODE_PRIVATE)
            val cacheArray = JSONArray()
            allActivities.take(50).forEach { item ->
                val obj = JSONObject()
                obj.put("id", item.id)
                obj.put("type", item.type)
                obj.put("title", item.title)
                obj.put("date", item.date)
                obj.put("dist", item.dist)
                obj.put("load", item.load)
                obj.put("duration", item.duration)
                obj.put("pace", item.pace)
                obj.put("avgHr", item.avgHr)
                obj.put("map", item.mapPolyline)
                obj.put("color", item.color.toArgb())
                obj.put("start", item.startTime)
                obj.put("end", item.endTime)
                cacheArray.put(obj)
            }
            
            // Save cache in IO context
            prefs.edit().putString("cached_activities", cacheArray.toString()).apply()
            
            // BATCH UPDATE: Apply all state changes atomically
            withContext(Dispatchers.Main) {
                state.activities = allActivities
                state.stravaConnected = true
                state.banisterPmcData = pmcData
                
                // Update dashboard metrics
                latestPmc?.let { latest ->
                    state.ctl = "%.0f".format(latest.ctl)
                    state.tsb = "%.0f".format(latest.tsb)
                    state.fatigueATL = latest.atl.toInt()
                    state.formTSB = latest.tsb.toInt()
                    state.readiness = (100 - latest.atl).coerceIn(10.0, 100.0).toInt().toString()
                }
            }
            
            // Sync additional data in background
            syncStravaProfile()
            syncStravaZones()
        } catch (e: Exception) {
            Log.e("DataSyncManager", "Error syncing activities", e)
        } finally {
            withContext(Dispatchers.Main) { state.isSyncing = false }
        }
    }

    suspend fun syncStravaProfile() {
        withContext(Dispatchers.IO) {
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
                Unit
            } catch (e: Exception) {
                Log.e("DataSyncManager", "Error syncing profile", e)
                Unit
            }
        }
    }

    /**
     * Fetches detailed streams and analyzes an activity
     */
    suspend fun syncActivityDetail(activityId: Long, type: String) = withContext(Dispatchers.IO) {
        android.util.Log.d("DrawRun", "syncActivityDetail: Starting for activity $activityId")
        
        try {
            val streams = stravaClient.api.getActivityStreams(activityId)
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
            
            android.util.Log.d("DrawRun", "syncActivityDetail: Running analysis. Zones available: ${state.zones != null}")
            if (state.zones == null) {
                android.util.Log.w("DrawRun", "syncActivityDetail: TrainingZones are MISSING. Analysis might be inaccurate or incomplete.")
            }
            
            val analysis = PerformanceAnalyzer.analyzeActivity(type, activityStreams, state.zones)
            android.util.Log.d("DrawRun", "syncActivityDetail: Analysis complete - IF=${analysis.intensityFactor}, TSS=${analysis.tss}, HR Dist=${analysis.hrZoneDistribution != null}")
            
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
            // 1. Fetch HR Series
            val hrRecords = healthConnectManager.readHeartRate(startTime, endTime)
            // Flatten HR samples. Each record has multiple samples.
            val hrSamples = hrRecords.flatMap { it.samples }
            
            // 2. Fetch Speed Series (if running)
            val speedSamples = if (type == "run") {
                val speedRecords = healthConnectManager.readData(SpeedRecord::class, startTime, endTime)
                speedRecords.flatMap { it.samples }
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

    /**
     * Updates the AppState with current real-time permission status.
     * Useful for UI feedback when returning from system settings.
     */
    suspend fun refreshHealthConnectStatus() {
        val allGranted = healthConnectManager.hasPermissions(permissions as Set<String>)
        withContext(Dispatchers.Main) {
            state.healthConnectPermissionsGranted = allGranted
        }
    }
}


