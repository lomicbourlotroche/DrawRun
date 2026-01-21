package com.drawrun.app.api

import android.content.Context
import com.drawrun.app.data.TokenStorage
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Strava API client with automatic token refresh and authentication
 */
class StravaClient(
    context: Context,
    private val clientId: Int,
    private val clientSecret: String
) {
    
    companion object {
        private const val BASE_URL = "https://www.strava.com/api/v3/"
        private const val OAUTH_BASE_URL = "https://www.strava.com/"
    }
    
    val tokenStorage = TokenStorage(context)
    val api: StravaApiService
    
    init {
        // Logging interceptor for debugging
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
        
        // Create a temporary service for the authenticator
        // (needed because authenticator needs the service to refresh tokens)
        val tempRetrofit = Retrofit.Builder()
            .baseUrl(OAUTH_BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
        val tempService = tempRetrofit.create(StravaApiService::class.java)
        
        // Configure OkHttp client with interceptors and authenticator
        val okHttpClient = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor(tokenStorage))
            .addInterceptor(loggingInterceptor)
            .authenticator(StravaAuthenticator(clientId, clientSecret, tokenStorage, tempService))
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
        
        // Create final Retrofit instance
        val retrofit = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
        
        api = retrofit.create(StravaApiService::class.java)
    }
    
    /**
     * Generate OAuth authorization URL for user login
     */
    fun getAuthorizationUrl(redirectUri: String): String {
        val scopes = "read,read_all,profile:read_all,activity:read,activity:read_all"
        return android.net.Uri.parse("https://www.strava.com/oauth/authorize")
            .buildUpon()
            .appendQueryParameter("client_id", clientId.toString())
            .appendQueryParameter("redirect_uri", redirectUri)
            .appendQueryParameter("response_type", "code")
            .appendQueryParameter("approval_prompt", "auto")
            .appendQueryParameter("scope", scopes)
            .build()
            .toString()
    }
    
    /**
     * Generate mobile OAuth authorization URL (opens Strava app if installed)
     */
    fun getMobileAuthorizationUrl(redirectUri: String): String {
        val scopes = "read,read_all,profile:read_all,activity:read,activity:read_all"
        return android.net.Uri.parse("https://www.strava.com/oauth/mobile/authorize")
            .buildUpon()
            .appendQueryParameter("client_id", clientId.toString())
            .appendQueryParameter("redirect_uri", redirectUri)
            .appendQueryParameter("response_type", "code")
            .appendQueryParameter("approval_prompt", "auto")
            .appendQueryParameter("scope", scopes)
            .build()
            .toString()
    }
}
