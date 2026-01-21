package com.drawrun.app.data

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Secure storage for Strava OAuth tokens using EncryptedSharedPreferences
 */
class TokenStorage(context: Context) {
    
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()
    
    private val sharedPreferences = EncryptedSharedPreferences.create(
        context,
        "strava_tokens",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )
    
    companion object {
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_EXPIRES_AT = "expires_at"
        private const val KEY_ATHLETE_ID = "athlete_id"
    }
    
    /**
     * Save OAuth tokens securely
     */
    suspend fun saveTokens(
        accessToken: String,
        refreshToken: String,
        expiresAt: Long,
        athleteId: Long? = null
    ) = withContext(Dispatchers.IO) {
        sharedPreferences.edit().apply {
            putString(KEY_ACCESS_TOKEN, accessToken)
            putString(KEY_REFRESH_TOKEN, refreshToken)
            putLong(KEY_EXPIRES_AT, expiresAt)
            athleteId?.let { putLong(KEY_ATHLETE_ID, it) }
            apply()
        }
    }
    
    /**
     * Get the current access token
     */
    suspend fun getAccessToken(): String? = withContext(Dispatchers.IO) {
        sharedPreferences.getString(KEY_ACCESS_TOKEN, null)
    }
    
    /**
     * Get the current refresh token
     */
    suspend fun getRefreshToken(): String? = withContext(Dispatchers.IO) {
        sharedPreferences.getString(KEY_REFRESH_TOKEN, null)
    }
    
    /**
     * Get token expiration timestamp
     */
    suspend fun getExpiresAt(): Long = withContext(Dispatchers.IO) {
        sharedPreferences.getLong(KEY_EXPIRES_AT, 0L)
    }
    
    /**
     * Get athlete ID
     */
    suspend fun getAthleteId(): Long? = withContext(Dispatchers.IO) {
        val id = sharedPreferences.getLong(KEY_ATHLETE_ID, -1L)
        if (id == -1L) null else id
    }
    
    /**
     * Check if the current token is expired
     */
    suspend fun isTokenExpired(): Boolean = withContext(Dispatchers.IO) {
        val expiresAt = getExpiresAt()
        if (expiresAt == 0L) return@withContext true
        
        val currentTime = System.currentTimeMillis() / 1000
        currentTime >= expiresAt
    }
    
    /**
     * Check if tokens exist
     */
    suspend fun hasTokens(): Boolean = withContext(Dispatchers.IO) {
        getAccessToken() != null && getRefreshToken() != null
    }
    
    /**
     * Clear all stored tokens
     */
    suspend fun clearTokens() = withContext(Dispatchers.IO) {
        sharedPreferences.edit().clear().apply()
    }
    
    /**
     * Synchronous version for use in OkHttp Authenticator
     */
    fun getAccessTokenSync(): String? {
        return sharedPreferences.getString(KEY_ACCESS_TOKEN, null)
    }
    
    /**
     * Synchronous version for use in OkHttp Authenticator
     */
    fun getRefreshTokenSync(): String? {
        return sharedPreferences.getString(KEY_REFRESH_TOKEN, null)
    }
    
    /**
     * Synchronous version for use in OkHttp Authenticator
     */
    fun saveTokensSync(
        accessToken: String,
        refreshToken: String,
        expiresAt: Long,
        athleteId: Long? = null
    ) {
        sharedPreferences.edit().apply {
            putString(KEY_ACCESS_TOKEN, accessToken)
            putString(KEY_REFRESH_TOKEN, refreshToken)
            putLong(KEY_EXPIRES_AT, expiresAt)
            athleteId?.let { putLong(KEY_ATHLETE_ID, it) }
            apply()
        }
    }
}
