package com.drawrun.app.data

import com.google.gson.annotations.SerializedName

/**
 * Response from OAuth token exchange or refresh
 */
data class StravaTokenResponse(
    @SerializedName("token_type")
    val tokenType: String,
    @SerializedName("access_token")
    val accessToken: String,
    @SerializedName("expires_at")
    val expiresAt: Long,
    @SerializedName("expires_in")
    val expiresIn: Int,
    @SerializedName("refresh_token")
    val refreshToken: String,
    @SerializedName("athlete")
    val athlete: AthleteProfile?
)

/**
 * Complete athlete profile from Strava
 */
data class AthleteProfile(
    @SerializedName("id")
    val id: Long,
    @SerializedName("username")
    val username: String?,
    @SerializedName("firstname")
    val firstname: String?,
    @SerializedName("lastname")
    val lastname: String?,
    @SerializedName("city")
    val city: String?,
    @SerializedName("state")
    val state: String?,
    @SerializedName("country")
    val country: String?,
    @SerializedName("sex")
    val sex: String?,
    @SerializedName("weight")
    val weight: Float?,
    @SerializedName("bio")
    val bio: String?,
    @SerializedName("follower_count")
    val followerCount: Int?,
    @SerializedName("friend_count")
    val friendCount: Int?,
    @SerializedName("ftp")
    val ftp: Int?,
    @SerializedName("shoes")
    val shoes: List<Gear>?,
    @SerializedName("bikes")
    val bikes: List<Gear>?
)

/**
 * Athlete gear (shoes or bikes)
 */
data class Gear(
    @SerializedName("id")
    val id: String,
    @SerializedName("name")
    val name: String,
    @SerializedName("distance")
    val distance: Float,
    @SerializedName("primary")
    val primary: Boolean
)

/**
 * Detailed activity from Strava
 */
data class ActivityDetailed(
    @SerializedName("id")
    val id: Long,
    @SerializedName("name")
    val name: String,
    @SerializedName("distance")
    val distance: Float,
    @SerializedName("moving_time")
    val movingTime: Int,
    @SerializedName("elapsed_time")
    val elapsedTime: Int,
    @SerializedName("total_elevation_gain")
    val totalElevationGain: Float,
    @SerializedName("type")
    val type: String,
    @SerializedName("start_date")
    val startDate: String,
    @SerializedName("start_date_local")
    val startDateLocal: String,
    @SerializedName("average_speed")
    val averageSpeed: Float,
    @SerializedName("max_speed")
    val maxSpeed: Float,
    @SerializedName("average_heartrate")
    val averageHeartrate: Float?,
    @SerializedName("max_heartrate")
    val maxHeartrate: Float?,
    @SerializedName("device_name")
    val deviceName: String?,
    @SerializedName("calories")
    val calories: Float?,
    @SerializedName("suffer_score")
    val sufferScore: Int?,
    @SerializedName("map")
    val map: ActivityMap?
)

/**
 * Activity map with polyline
 */
data class ActivityMap(
    @SerializedName("id")
    val id: String?,
    @SerializedName("summary_polyline")
    val summaryPolyline: String?,
    @SerializedName("polyline")
    val polyline: String?
)

/**
 * Activity stream data (HR, speed, power, etc.)
 */
data class ActivityStream(
    @SerializedName("type")
    val type: String,
    @SerializedName("data")
    val data: List<Any>,
    @SerializedName("series_type")
    val seriesType: String,
    @SerializedName("original_size")
    val originalSize: Int,
    @SerializedName("resolution")
    val resolution: String
)

/**
 * Athlete zones (heart rate and power)
 */
data class AthleteZonesResponse(
    @SerializedName("heart_rate")
    val heartRate: HeartRateZones?,
    @SerializedName("power")
    val power: PowerZones?
)

/**
 * Heart rate zones
 */
data class HeartRateZones(
    @SerializedName("custom_zones")
    val customZones: Boolean,
    @SerializedName("zones")
    val zones: List<Zone>
)

/**
 * Power zones
 */
data class PowerZones(
    @SerializedName("zones")
    val zones: List<Zone>
)

/**
 * Individual zone definition
 */
data class Zone(
    @SerializedName("min")
    val min: Int,
    @SerializedName("max")
    val max: Int
)

/**
 * Athlete stats response
 */
data class AthleteStatsResponse(
    @SerializedName("biggest_ride_distance")
    val biggestRideDistance: Float?,
    @SerializedName("biggest_climb_elevation_gain")
    val biggestClimbElevationGain: Float?,
    @SerializedName("recent_ride_totals")
    val recentRideTotals: ActivityTotals?,
    @SerializedName("recent_run_totals")
    val recentRunTotals: ActivityTotals?,
    @SerializedName("recent_swim_totals")
    val recentSwimTotals: ActivityTotals?,
    @SerializedName("ytd_ride_totals")
    val ytdRideTotals: ActivityTotals?,
    @SerializedName("ytd_run_totals")
    val ytdRunTotals: ActivityTotals?,
    @SerializedName("ytd_swim_totals")
    val ytdSwimTotals: ActivityTotals?,
    @SerializedName("all_ride_totals")
    val allRideTotals: ActivityTotals?,
    @SerializedName("all_run_totals")
    val allRunTotals: ActivityTotals?,
    @SerializedName("all_swim_totals")
    val allSwimTotals: ActivityTotals?
)

/**
 * Activity totals for a specific sport
 */
data class ActivityTotals(
    @SerializedName("count")
    val count: Int,
    @SerializedName("distance")
    val distance: Float,
    @SerializedName("moving_time")
    val movingTime: Int,
    @SerializedName("elapsed_time")
    val elapsedTime: Int,
    @SerializedName("elevation_gain")
    val elevationGain: Float,
    @SerializedName("achievement_count")
    val achievementCount: Int?
)
