package com.drawrun.app.api

import com.drawrun.app.data.*
import retrofit2.Call
import retrofit2.http.*

/**
 * Strava API service interface using Retrofit
 */
interface StravaApiService {
    
    /**
     * Exchange authorization code for access token
     */
    @POST("https://www.strava.com/oauth/token")
    @FormUrlEncoded
    fun exchangeToken(
        @Field("client_id") clientId: Int,
        @Field("client_secret") clientSecret: String,
        @Field("code") code: String,
        @Field("grant_type") grantType: String = "authorization_code"
    ): Call<StravaTokenResponse>
    
    /**
     * Refresh access token using refresh token
     */
    @POST("https://www.strava.com/oauth/token")
    @FormUrlEncoded
    fun refreshAccessToken(
        @Field("client_id") clientId: Int,
        @Field("client_secret") clientSecret: String,
        @Field("refresh_token") refreshToken: String,
        @Field("grant_type") grantType: String = "refresh_token"
    ): Call<StravaTokenResponse>
    
    /**
     * Get authenticated athlete profile
     */
    @GET("athlete")
    suspend fun getAuthenticatedAthlete(): AthleteProfile
    
    /**
     * Get athlete activities with pagination
     */
    @GET("athlete/activities")
    suspend fun getActivities(
        @Query("before") before: Long? = null,
        @Query("after") after: Long? = null,
        @Query("page") page: Int = 1,
        @Query("per_page") perPage: Int = 200
    ): List<ActivityDetailed>
    
    /**
     * Get detailed activity by ID
     */
    @GET("activities/{id}")
    suspend fun getActivity(@Path("id") id: Long): ActivityDetailed
    
    /**
     * Get activity streams (HR, speed, power, etc.)
     */
    @GET("activities/{id}/streams")
    suspend fun getActivityStreams(
        @Path("id") id: Long,
        @Query("keys") keys: String = "time,heartrate,watts,cadence,velocity_smooth,altitude",
        @Query("key_by_type") keyByType: Boolean = true
    ): Map<String, ActivityStream>
    
    /**
     * Get athlete zones (heart rate and power)
     */
    @GET("athlete/zones")
    suspend fun getAthleteZones(): AthleteZonesResponse
    
    /**
     * Get athlete stats
     */
    @GET("athletes/{id}/stats")
    suspend fun getAthleteStats(@Path("id") id: Long): AthleteStatsResponse
    
    /**
     * Get gear details
     */
    @GET("gear/{id}")
    suspend fun getGear(@Path("id") gearId: String): Gear
}
