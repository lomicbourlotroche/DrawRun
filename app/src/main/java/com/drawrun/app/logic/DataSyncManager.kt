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

class DataSyncManager(val context: Context, val state: AppState) {

    // OAuth Configuration
    private val STRAVA_CLIENT_ID = "190602"
    private val STRAVA_CLIENT_SECRET = "1909300e2dfb5301fab8b6e9bf9635206c983308"
    private val REDIRECT_URI = "http://localhost/strava_callback"
    
    // Tokens (loaded from prefs in real app, here checking prefs)
    var stravaAccessToken: String? = null
    var stravaRefreshToken: String? = null

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
    
    init {
        // Load tokens from prefs
        val prefs = context.getSharedPreferences("drawrun_prefs", Context.MODE_PRIVATE)
        stravaAccessToken = prefs.getString("strava_access_token", null)
        stravaRefreshToken = prefs.getString("strava_refresh_token", null)
    }

    suspend fun restoreConnections() = withContext(Dispatchers.IO) {
        val prefs = context.getSharedPreferences("drawrun_prefs", Context.MODE_PRIVATE)
        val stravaConnected = prefs.getBoolean("strava_connected", false)
        val healthConnected = prefs.getBoolean("health_connected", false)

        withContext(Dispatchers.Main) {
            state.stravaConnected = stravaConnected
            state.healthConnectConnected = healthConnected
        }

        if (stravaConnected) {
            syncStravaActivities()
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
        val intentUri = android.net.Uri.parse("https://www.strava.com/oauth/mobile/authorize")
            .buildUpon()
            .appendQueryParameter("client_id", STRAVA_CLIENT_ID)
            .appendQueryParameter("redirect_uri", REDIRECT_URI)
            .appendQueryParameter("response_type", "code")
            .appendQueryParameter("approval_prompt", "auto")
            .appendQueryParameter("scope", "activity:read_all,profile:read_all")
            .build()
            
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
        val formBody = FormBody.Builder()
            .add("client_id", STRAVA_CLIENT_ID)
            .add("client_secret", STRAVA_CLIENT_SECRET)
            .add("code", code)
            .add("grant_type", "authorization_code")
            .build()

        val request = Request.Builder()
            .url("https://www.strava.com/oauth/token")
            .post(formBody)
            .build()

        try {
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val json = JSONObject(response.body?.string() ?: "{}")
                stravaAccessToken = json.getString("access_token")
                stravaRefreshToken = json.getString("refresh_token")
                
                context.getSharedPreferences("drawrun_prefs", Context.MODE_PRIVATE).edit()
                    .putString("strava_access_token", stravaAccessToken)
                    .putString("strava_refresh_token", stravaRefreshToken)
                    .putBoolean("strava_connected", true)
                    .apply()
                    
                withContext(Dispatchers.Main) {
                    state.stravaConnected = true
                }
                syncStravaActivities(stravaAccessToken)
                true
            } else {
                false
            }
        } catch (e: Exception) {
            e.printStackTrace()
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
     */
    suspend fun syncStravaActivities(token: String? = null) {
        withContext(Dispatchers.Main) { state.isSyncing = true }
        try {
            val currentToken = token ?: stravaAccessToken
            if (currentToken == null) {
                 withContext(Dispatchers.Main) { state.isSyncing = false }
                 return
            }

            val allActivities = mutableListOf<ActivityItem>()
            var page = 1
            var totalLoadWeek = 0
            
            // Pagination loop to fetch ALL activities
            while (true) {
                val request = Request.Builder()
                    .url("https://www.strava.com/api/v3/athlete/activities?per_page=200&page=$page")
                    .header("Authorization", "Bearer $currentToken")
                    .build()

                val response = client.newCall(request).execute()
                if (response.code == 401) {
                    if (refreshStravaToken()) {
                        syncStravaActivities(stravaAccessToken) // Retry once
                    }
                    return
                }

                if (!response.isSuccessful) break

                val json = JSONArray(response.body?.string() ?: "[]")
                if (json.length() == 0) break // No more activities
                
                for (i in 0 until json.length()) {
                    val obj = json.getJSONObject(i)
                    val type = obj.getString("type").lowercase()
                    val distVal = obj.getDouble("distance")
                    val dist = (distVal / 1000.0).let { "%.1fkm".format(it) }
                    
                    val movingTime = obj.optLong("moving_time", 0)
                    val duration = if (movingTime > 3600) {
                         "%dh%02d".format(movingTime / 3600, (movingTime % 3600) / 60)
                    } else {
                         "%02d:%02d".format(movingTime / 60, movingTime % 60)
                    }
                    
                    val avgSpeed = obj.optDouble("average_speed", 0.0)
                    val pace = if (avgSpeed > 0) {
                        val paceSeconds = (1000 / avgSpeed).toInt()
                         "%d:%02d /km".format(paceSeconds / 60, paceSeconds % 60)
                    } else "--"
                    
                    val avgHr = obj.optDouble("average_heartrate", 0.0)
                    val hrStr = if (avgHr > 0) "%.0f bpm".format(avgHr) else "--"
                    
                    val sufferScore = obj.optInt("suffer_score", 0)
                    // Only count first 7 activities for weekly load (most recent)
                    if (allActivities.size < 7) totalLoadWeek += sufferScore
                    
                    val mapObj = obj.optJSONObject("map")
                    val polyline = mapObj?.optString("summary_polyline")

                    allActivities.add(ActivityItem(
                        id = obj.getInt("id"),
                        type = type,
                        title = obj.getString("name"),
                        date = obj.getString("start_date_local").take(10),
                        dist = dist,
                        load = "TSS $sufferScore",
                        duration = duration,
                        pace = pace,
                        avgHr = hrStr,
                        mapPolyline = polyline,
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
            syncStravaProfile()
            syncStravaZones()
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            withContext(Dispatchers.Main) { state.isSyncing = false }
        }
    }

    suspend fun syncStravaProfile() = withContext(Dispatchers.IO) {
        val token = stravaAccessToken ?: return@withContext
        val request = Request.Builder()
            .url("https://www.strava.com/api/v3/athlete")
            .header("Authorization", "Bearer $token")
            .build()
            
        try {
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val json = JSONObject(response.body?.string() ?: "{}")
                val fName = json.optString("firstname", "")
                val lName = json.optString("lastname", "")
                val weightVal = json.optDouble("weight", 0.0)
                val profileUrl = json.optString("profile", "")
                
                withContext(Dispatchers.Main) {
                    if (fName.isNotBlank()) state.firstName = fName
                    if (weightVal > 0) state.weight = "%.1f".format(weightVal)
                    if (profileUrl.isNotBlank() && profileUrl != "avatar/athlete/large.png") {
                        state.avatarUrl = profileUrl
                    }
                    val athleteId = json.optInt("id", 0)
                    if (athleteId > 0) {
                         state.stravaAthleteId = athleteId
                         syncStravaStats(athleteId)
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Fetches detailed streams and analyzes an activity
     */
    suspend fun syncActivityDetail(activityId: Int, type: String) = withContext(Dispatchers.IO) {
        android.util.Log.d("DrawRun", "syncActivityDetail: Starting for activity $activityId")
        val token = stravaAccessToken ?: run {
            android.util.Log.w("DrawRun", "syncActivityDetail: No Strava token available")
            return@withContext
        }
        
        val request = Request.Builder()
            .url("https://www.strava.com/api/v3/activities/$activityId/streams?keys=time,distance,altitude,heartrate,cadence,watts,velocity_smooth,grade_smooth&key_by_type=true")
            .header("Authorization", "Bearer $token")
            .build()
            
        try {
            val response = client.newCall(request).execute()
            android.util.Log.d("DrawRun", "syncActivityDetail: API response code = ${response.code}")
            
            if (response.isSuccessful) {
                val json = JSONObject(response.body?.string() ?: "{}")
                
                val timeStream = json.optJSONObject("time")?.optJSONArray("data")?.let { arr -> List(arr.length()) { arr.getInt(it) } } ?: emptyList()
                val distStream = json.optJSONObject("distance")?.optJSONArray("data")?.let { arr -> List(arr.length()) { arr.getDouble(it) } }
                val altStream = json.optJSONObject("altitude")?.optJSONArray("data")?.let { arr -> List(arr.length()) { arr.getDouble(it) } }
                val hrStream = json.optJSONObject("heartrate")?.optJSONArray("data")?.let { arr -> List(arr.length()) { arr.getInt(it) } }
                val cadStream = json.optJSONObject("cadence")?.optJSONArray("data")?.let { arr -> List(arr.length()) { arr.getInt(it) } }
                val pwrStream = json.optJSONObject("watts")?.optJSONArray("data")?.let { arr -> List(arr.length()) { arr.getInt(it) } }
                val velStream = json.optJSONObject("velocity_smooth")?.optJSONArray("data")?.let { arr -> List(arr.length()) { arr.getDouble(it) } }
                
                android.util.Log.d("DrawRun", "syncActivityDetail: Streams fetched - time:${timeStream.size}, hr:${hrStream?.size}, vel:${velStream?.size}")
                
                val streams = com.drawrun.app.ActivityStreams(
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
                val analysis = PerformanceAnalyzer.analyzeActivity(type, streams, state.zones)
                android.util.Log.d("DrawRun", "syncActivityDetail: Analysis complete - IF=${analysis.intensityFactor}, TSS=${analysis.tss}")
                
                withContext(Dispatchers.Main) {
                    state.selectedActivityStreams = streams
                    state.selectedActivityAnalysis = analysis
                    android.util.Log.d("DrawRun", "syncActivityDetail: State updated successfully")
                }
            } else {
                android.util.Log.w("DrawRun", "syncActivityDetail: API call failed with code ${response.code}")
            }
        } catch (e: Exception) {
            android.util.Log.e("DrawRun", "syncActivityDetail: Exception occurred", e)
            e.printStackTrace()
        }
    }

    private fun refreshStravaToken(): Boolean {
        val rToken = stravaRefreshToken ?: return false
        
        val formBody = FormBody.Builder()
            .add("client_id", STRAVA_CLIENT_ID)
            .add("client_secret", STRAVA_CLIENT_SECRET)
            .add("grant_type", "refresh_token")
            .add("refresh_token", rToken)
            .build()

        val request = Request.Builder()
            .url("https://www.strava.com/api/v3/oauth/token")
            .post(formBody)
            .build()

        return try {
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val json = JSONObject(response.body?.string() ?: "{}")
                stravaAccessToken = json.getString("access_token")
                stravaRefreshToken = json.getString("refresh_token")
                
                context.getSharedPreferences("drawrun_prefs", Context.MODE_PRIVATE).edit()
                    .putString("strava_access_token", stravaAccessToken)
                    .putString("strava_refresh_token", stravaRefreshToken)
                    .apply()
                true
            } else {
                false
            }
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    suspend fun syncStravaStats(athleteId: Int) = withContext(Dispatchers.IO) {
        val token = stravaAccessToken ?: return@withContext
        val request = Request.Builder()
            .url("https://www.strava.com/api/v3/athletes/$athleteId/stats")
            .header("Authorization", "Bearer $token")
            .build()
            
        try {
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val json = JSONObject(response.body?.string() ?: "{}")
                
                fun parseTotals(objName: String): com.drawrun.app.Totals {
                    val obj = json.optJSONObject(objName) ?: JSONObject()
                    return com.drawrun.app.Totals(
                        count = obj.optInt("count", 0),
                        distance = obj.optDouble("distance", 0.0),
                        movingTime = obj.optInt("moving_time", 0),
                        elapsedTime = obj.optInt("elapsed_time", 0),
                        elevationGain = obj.optDouble("elevation_gain", 0.0)
                    )
                }

                val stats = com.drawrun.app.AthleteStats(
                    allRunTotals = parseTotals("all_run_totals"),
                    allBikeTotals = parseTotals("all_ride_totals"),
                    allSwimTotals = parseTotals("all_swim_totals")
                )
                
                withContext(Dispatchers.Main) {
                    state.athleteStats = stats
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    suspend fun syncStravaZones() = withContext(Dispatchers.IO) {
        val token = stravaAccessToken ?: return@withContext
        val request = Request.Builder()
            .url("https://www.strava.com/api/v3/athlete/zones")
            .header("Authorization", "Bearer $token")
            .build()
            
        try {
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val json = JSONObject(response.body?.string() ?: "{}")
                
                val hrObj = json.optJSONObject("heart_rate")
                val hrZones = if (hrObj != null) {
                    val zonesArr = hrObj.optJSONArray("zones") ?: JSONArray()
                    com.drawrun.app.HRZones(
                        customZones = hrObj.optBoolean("custom_zones", false),
                        zones = List(zonesArr.length()) { i ->
                            val z = zonesArr.getJSONObject(i)
                            com.drawrun.app.HRZone(z.getInt("min"), z.getInt("max"))
                        }
                    )
                } else null

                val pwrObj = json.optJSONObject("power")
                val pwrZones = if (pwrObj != null) {
                    val zonesArr = pwrObj.optJSONArray("zones") ?: JSONArray()
                    com.drawrun.app.PowerZones(
                        zones = List(zonesArr.length()) { i ->
                            val z = zonesArr.getJSONObject(i)
                            com.drawrun.app.PowerZone(z.getInt("min"), z.getInt("max"))
                        }
                    )
                } else null

                withContext(Dispatchers.Main) {
                    state.athleteZones = com.drawrun.app.AthleteZones(hrZones, pwrZones)
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
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


