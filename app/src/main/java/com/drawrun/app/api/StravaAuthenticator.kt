package com.drawrun.app.api

import android.util.Log
import okhttp3.Authenticator
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route
import com.drawrun.app.data.TokenStorage

/**
 * OkHttp Authenticator that automatically refreshes expired Strava tokens
 */
class StravaAuthenticator(
    private val clientId: Int,
    private val clientSecret: String,
    private val tokenStorage: TokenStorage,
    private val apiService: StravaApiService
) : Authenticator {
    
    companion object {
        private const val TAG = "StravaAuthenticator"
        private const val MAX_RETRIES = 2
    }
    
    override fun authenticate(route: Route?, response: Response): Request? {
        // Avoid infinite loops if refresh also fails
        if (response.count401() > MAX_RETRIES) {
            Log.e(TAG, "Max retries exceeded, clearing tokens")
            return null
        }
        
        synchronized(this) {
            val currentRefreshToken = tokenStorage.getRefreshTokenSync()
            if (currentRefreshToken == null) {
                Log.e(TAG, "No refresh token available")
                return null
            }
            
            try {
                // Call refresh endpoint synchronously
                val tokenResponse = apiService.refreshAccessToken(
                    clientId = clientId,
                    clientSecret = clientSecret,
                    refreshToken = currentRefreshToken
                ).execute()
                
                if (tokenResponse.isSuccessful && tokenResponse.body() != null) {
                    val newTokens = tokenResponse.body()!!
                    
                    // Save new tokens
                    tokenStorage.saveTokensSync(
                        accessToken = newTokens.accessToken,
                        refreshToken = newTokens.refreshToken,
                        expiresAt = newTokens.expiresAt,
                        athleteId = newTokens.athlete?.id
                    )
                    
                    Log.d(TAG, "Token refreshed successfully")
                    
                    // Retry original request with new token
                    return response.request.newBuilder()
                        .header("Authorization", "Bearer ${newTokens.accessToken}")
                        .build()
                } else {
                    Log.e(TAG, "Token refresh failed: ${tokenResponse.code()}")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error refreshing token", e)
            }
        }
        
        return null
    }
    
    /**
     * Count the number of 401 responses in the chain
     */
    private fun Response.count401(): Int {
        var result = 1
        var r = priorResponse
        while (r != null) {
            result++
            r = r.priorResponse
        }
        return result
    }
}
