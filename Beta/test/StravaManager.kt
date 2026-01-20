package com.orbital.run.api

import android.content.Context
import android.content.Intent
import android.net.Uri
import com.orbital.run.logic.Persistence
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext


object StravaManager {
    // Client ID/Secret are injected via BuildConfig from local.properties
    
    fun connect(context: Context) {
        val clientId = com.orbital.run.BuildConfig.STRAVA_CLIENT_ID
        // Use localhost as recommended for mobile apps to pass Strava's domain validation
        val redirectUri = "http://localhost/strava_callback" 
        val scope = "activity:read_all,activity:write"
        
        val url = "https://www.strava.com/oauth/mobile/authorize" +
                "?client_id=$clientId" +
                "&redirect_uri=$redirectUri" +
                "&response_type=code" +
                "&approval_prompt=auto" +
                "&scope=$scope"

        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        
        // Try to force opening in the Strava app if installed
        val stravaPackage = "com.strava"
        val pm = context.packageManager
        try {
            pm.getPackageInfo(stravaPackage, 0) // Check if installed
            intent.setPackage(stravaPackage)
        } catch (e: Exception) {
            // Strava not installed, fallback to browser (default behavior)
        }

        context.startActivity(intent)
    }

    /**
     * Handle the redirect from Strava.
     * URI format: http://localhost/strava_callback?state=&code=AUTHORIZATION_CODE&scope=...
     * OR drawrun://strava_callback (legacy)
     */
    fun handleAuthCallback(context: Context, uri: Uri) {
        // Accept both localhost (standard) and custom scheme (backup)
        val isStravaCallback = (uri.scheme == "http" && uri.host == "localhost" && uri.path?.startsWith("/strava_callback") == true) ||
                               (uri.toString().startsWith("drawrun://strava_callback"))

        if (isStravaCallback) {
            val code = uri.getQueryParameter("code")
            val error = uri.getQueryParameter("error")
            
            if (code != null) {
                // Perform Immediate Token Exchange
                kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.IO).launch {
                     val token = exchangeToken(context, code)
                     withContext(kotlinx.coroutines.Dispatchers.Main) {
                         if (token != null) {
                             Persistence.saveStravaEnabled(context, true)
                             Persistence.saveStravaAuthCode(context, code)
                             android.widget.Toast.makeText(context, "Strava lié avec succès !", android.widget.Toast.LENGTH_LONG).show()
                         } else {
                             Persistence.saveStravaEnabled(context, false)
                             android.widget.Toast.makeText(context, "Échec connexion Strava (Token)", android.widget.Toast.LENGTH_LONG).show()
                         }
                     }
                }
            } else if (error != null) {
                android.widget.Toast.makeText(context, "Erreur Strava: $error", android.widget.Toast.LENGTH_LONG).show()
            }
        }
    }

    fun disconnect(context: Context) {
        Persistence.saveStravaEnabled(context, false)
    }

    fun isConnected(context: Context): Boolean {
        // Must be enabled AND have tokens (or at least an auth code to exchange)
        val enabled = Persistence.loadStravaEnabled(context)
        val (access, refresh) = Persistence.loadStravaTokens(context)
        return enabled && (access != null || refresh != null || Persistence.loadStravaAuthCode(context) != null)
    }

    // --- Token Management ---
    private fun exchangeToken(context: Context, code: String): String? {
        val clientId = com.orbital.run.BuildConfig.STRAVA_CLIENT_ID
        val clientSecret = com.orbital.run.BuildConfig.STRAVA_CLIENT_SECRET
        
        return try {
            val url = java.net.URL("https://www.strava.com/oauth/token")
            val conn = url.openConnection() as java.net.HttpURLConnection
            conn.requestMethod = "POST"
            conn.doOutput = true
            
            val params = "client_id=$clientId&client_secret=$clientSecret&code=$code&grant_type=authorization_code"
            conn.outputStream.write(params.toByteArray())
            
            if (conn.responseCode == 200) {
                val response = conn.inputStream.bufferedReader().readText()
                val json = org.json.JSONObject(response)
                val access = json.getString("access_token")
                val refresh = json.getString("refresh_token")
                Persistence.saveStravaTokens(context, access, refresh)
                access
            } else {
                null
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
    
    private fun refreshToken(context: Context): String? {
        val (_, refreshToken) = Persistence.loadStravaTokens(context)
        if (refreshToken == null) return null
        
        val clientId = com.orbital.run.BuildConfig.STRAVA_CLIENT_ID
        val clientSecret = com.orbital.run.BuildConfig.STRAVA_CLIENT_SECRET
        
        return try {
            val url = java.net.URL("https://www.strava.com/oauth/token")
            val conn = url.openConnection() as java.net.HttpURLConnection
            conn.requestMethod = "POST"
            conn.doOutput = true
            
            val params = "client_id=$clientId&client_secret=$clientSecret&refresh_token=$refreshToken&grant_type=refresh_token"
            conn.outputStream.write(params.toByteArray())
            
            if (conn.responseCode == 200) {
                val response = conn.inputStream.bufferedReader().readText()
                val json = org.json.JSONObject(response)
                val access = json.getString("access_token")
                val refresh = json.getString("refresh_token") // Strava might rotate refresh tokens
                Persistence.saveStravaTokens(context, access, refresh)
                access
            } else {
                null
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    // --- Sync Logic ---
    fun syncActivities(context: Context, daysBack: Int = 30): Int {
        if (!isConnected(context)) return 0
        
        // 1. Get Valid Token
        var (accessToken, _) = Persistence.loadStravaTokens(context)
        
        // Initial Exchange (if no token but we have a code)
        if (accessToken == null) {
            val code = Persistence.loadStravaAuthCode(context) ?: return 0
            accessToken = exchangeToken(context, code)
        }
        
        if (accessToken == null) return 0
        
        val afterTime = (System.currentTimeMillis() - (daysBack * 24L * 60 * 60 * 1000)) / 1000
        var page = 1
        var totalFetched = 0
        val maxPages = 50 // Safety limit (10,000 activities)
        
        fun doFetch(token: String, p: Int): Int {
            try {
                // Fetch 200 activities per page
                // FILTER: after=TIMESTAMP to only get relevant history
                val urlStr = "https://www.strava.com/api/v3/athlete/activities?per_page=200&page=$p&after=$afterTime"
                android.util.Log.d("STRAVA_SYNC", "Fetching page $p... (After: $afterTime)")
                
                val url = java.net.URL(urlStr)
                val conn = url.openConnection() as java.net.HttpURLConnection
                conn.setRequestProperty("Authorization", "Bearer $token")
                
                if (conn.responseCode == 401) {
                    return -1 // Signal to refresh
                }
                
                if (conn.responseCode == 200) {
                    val response = conn.inputStream.bufferedReader().readText()
                    val jsonArray = org.json.JSONArray(response)
                    
                    if (jsonArray.length() == 0) return 0 // End of list
                    
                    val activities = mutableListOf<Persistence.CompletedActivity>()
                    
                for (i in 0 until jsonArray.length()) {
                        val item = jsonArray.getJSONObject(i)
                        var activity = mapStravaActivity(item)
                        
                        // ENRICH: Fetch Streams for detailed charts & splits
                        // Only fetch if we suspect missing data (or always for quality?)
                        // To avoid rate limits, maybe only if we are on the first page?
                        // User complained about defaults, so let's fetch for ALL.
                        try {
                            activity = enrichWithStreams(activity, token)
                        } catch (e: Exception) {
                            android.util.Log.e("STRAVA_STREAMS", "Failed to enrich ${activity.id}", e)
                        }
                        
                        activities.add(activity)
                    }
                    
                    Persistence.saveHistoryBatch(context, activities)
                    return activities.size
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
            return 0
        }

        // 2. Loop Pages
        while (page <= maxPages) {
            var count = doFetch(accessToken!!, page)
            
            // 3. Handle Expiration (401)
            if (count == -1) {
                val newToken = refreshToken(context)
                if (newToken != null) {
                    accessToken = newToken
                    count = doFetch(newToken, page)
                } else {
                    break // Failed to refresh
                }
            }
            
            if (count <= 0) break // No more activities or error
            
            totalFetched += count
            if (count < 200) break // Last page was partial
            
            page++
        }
        
        return totalFetched
    }

    private fun mapStravaActivity(json: org.json.JSONObject): Persistence.CompletedActivity {
        val id = json.getLong("id").toString()
        val name = json.optString("name", "Activité Strava")
        val distance = json.optDouble("distance", 0.0) / 1000.0
        val movingTime = json.optInt("moving_time", 0) / 60
        val typeStr = json.optString("type", "Run")
        
        // Date parsing (ISO 8601)
        val dateStr = json.optString("start_date")
        // Simple approximation or verify needed format
        val date = try {
            java.time.Instant.parse(dateStr).toEpochMilli()
        } catch (e: Exception) { System.currentTimeMillis() }

        val type = when {
            typeStr.contains("Swim", true) -> com.orbital.run.logic.WorkoutType.SWIMMING
            typeStr.contains("Ride", true) || typeStr.contains("Cycle", true) -> com.orbital.run.logic.WorkoutType.CYCLING
            else -> com.orbital.run.logic.WorkoutType.RUNNING
        }
        
        val map = json.optJSONObject("map")
        val polyline = map?.optString("summary_polyline")

        return Persistence.CompletedActivity(
            id = "strava_$id", // Prefix to avoid collision unless we merge by externalId
            date = date,
            durationMin = movingTime,
            distanceKm = distance,
            type = type,
            title = name,
            source = "Strava",
            externalId = id,
            summaryPolyline = polyline,
            // Additional Metrics
            avgHeartRate = json.optDouble("average_heartrate").takeIf { !it.isNaN() }?.toInt(),
            maxHeartRate = json.optDouble("max_heartrate").takeIf { !it.isNaN() }?.toInt(),
            elevationGain = json.optDouble("total_elevation_gain").toInt(),
            avgWatts = json.optDouble("average_watts").takeIf { !it.isNaN() }?.toInt()
        )
    }

    private fun enrichWithStreams(activity: Persistence.CompletedActivity, token: String): Persistence.CompletedActivity {
        // Fetch streams: time, heartrate, watts, velocity_smooth, cadence, altitude
        val streamUrl = "https://www.strava.com/api/v3/activities/${activity.externalId}/streams?keys=time,heartrate,watts,velocity_smooth,cadence,altitude,temp&key_by_type=true"
        
        val url = java.net.URL(streamUrl)
        val conn = url.openConnection() as java.net.HttpURLConnection
        conn.setRequestProperty("Authorization", "Bearer $token")
        
        if (conn.responseCode == 200) {
            val response = conn.inputStream.bufferedReader().readText()
            val json = org.json.JSONObject(response)
            
            // Helpers to safely get int/float arrays
            fun getIntList(key: String): List<Int> {
                 val arr = json.optJSONObject(key)?.optJSONArray("data") ?: return emptyList()
                 val list = mutableListOf<Int>()
                 for (i in 0 until arr.length()) list.add(arr.optInt(i))
                 return list
            }
            fun getDoubleList(key: String): List<Double> {
                 val arr = json.optJSONObject(key)?.optJSONArray("data") ?: return emptyList()
                 val list = mutableListOf<Double>()
                 for (i in 0 until arr.length()) list.add(arr.optDouble(i))
                 return list
            }
            
            val time = getIntList("time")
            if (time.isEmpty()) return activity // No data to map
            
            // Map Streams to Samples
            val hrData = getIntList("heartrate")
            val wattsData = getIntList("watts") // Note: Strava 'watts' can be missing if estimate=false? No, if present it is here
            val velocityData = getDoubleList("velocity_smooth")
            val cadenceData = getIntList("cadence")
            val altitudeData = getDoubleList("altitude")
            
            // Create Sample Lists
            val hrSamples = mutableListOf<Persistence.HeartRateSample>()
            val powerSamples = mutableListOf<Persistence.PowerSample>()
            val speedSamples = mutableListOf<Persistence.SpeedSample>()
            val cadenceSamples = mutableListOf<Persistence.CadenceSample>()
            val elevationSamples = mutableListOf<Persistence.ElevationSample>()
            
            // Iterate and sync by index (assuming aligned arrays)
            // Time is the master index
            for (i in time.indices) {
                val t = time[i] // seconds from start
                
                if (i < hrData.size) hrSamples.add(Persistence.HeartRateSample(t, hrData[i]))
                if (i < wattsData.size) powerSamples.add(Persistence.PowerSample(t, wattsData[i].toDouble()))
                if (i < velocityData.size) speedSamples.add(Persistence.SpeedSample(t, velocityData[i])) // m/s
                if (i < cadenceData.size) cadenceSamples.add(Persistence.CadenceSample(t, cadenceData[i].toDouble())) // rpm
                if (i < altitudeData.size) elevationSamples.add(Persistence.ElevationSample(t, altitudeData[i]))
            }
            
            // Update Activity
            return activity.copy(
                heartRateSamples = hrSamples,
                powerSamples = powerSamples,
                speedSamples = speedSamples,
                cadenceSamples = cadenceSamples,
                elevationSamples = elevationSamples,
                
                // If summary data was missing, maybe update it?
                avgWatts = activity.avgWatts ?: if(powerSamples.isNotEmpty()) powerSamples.map { it.watts }.average().toInt() else null,
                avgCadence = activity.avgCadence ?: if(cadenceSamples.isNotEmpty()) cadenceSamples.map { it.rpm }.average().toInt() else null
            )
        }
        return activity
    }
}
