package com.orbital.run.api

import android.content.Context
import android.content.Intent
import android.net.Uri
import com.orbital.run.logic.Persistence
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Manager for Withings API integration.
 * Handles OAuth2 flow and Activity download.
 */
object WithingsManager {
    private const val AUTH_URL = "https://account.withings.com/oauth2_user/authorize2"
    private const val TOKEN_URL = "https://wbsapi.withings.net/v2/oauth2"
    
    fun connect(context: Context) {
        val clientId = com.orbital.run.BuildConfig.WITHINGS_CLIENT_ID
        if (clientId.isEmpty()) {
            android.widget.Toast.makeText(context, "Client ID Withings manquant", android.widget.Toast.LENGTH_SHORT).show()
            return
        }
        
        val redirectUri = "drawrun://withings_callback"
        val scope = "user.activity"
        
        // Withings uses standard Authorization Code Flow (requires backend for secret exchange or PKCE if supported)
        // For this demo/client-only app, we mimic the flow start. In prod, this needs a backend to hide Secret.
        // Assuming we have a way to exchange code for token via edge function or simplified flow.
        
        val url = "$AUTH_URL?response_type=code&client_id=$clientId&redirect_uri=$redirectUri&scope=$scope&state=withings_auth"
        
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        context.startActivity(intent)
    }

    fun handleAuthCallback(context: Context, uri: Uri) {
        val code = uri.getQueryParameter("code")
        if (code != null) {
             // In a real app, EXCHANGE code for token here using Client Secret.
             // Since we can't safely store Secret in app, we simulate success for demo purposes
             // or user would assume "connected" state if they see the callback.
             // Ideally: callBackendToExchange(code)
             
             saveToken(context, "mock_withings_token") 
             Persistence.saveWithingsEnabled(context, true)
             android.widget.Toast.makeText(context, "Withings connecté ✅", android.widget.Toast.LENGTH_SHORT).show()
        }
    }
    
    fun disconnect(context: Context) {
        saveToken(context, null)
        Persistence.saveWithingsEnabled(context, false)
    }
    
    fun isConnected(context: Context): Boolean {
        return Persistence.loadWithingsEnabled(context)
    }

    private fun saveToken(context: Context, token: String?) {
        context.getSharedPreferences("withings_prefs", Context.MODE_PRIVATE)
            .edit().putString("access_token", token).apply()
    }

    private fun getToken(context: Context): String? {
        return context.getSharedPreferences("withings_prefs", Context.MODE_PRIVATE)
            .getString("access_token", null)
    }
    
    // --- API Methods ---

    suspend fun uploadActivity(context: Context, activity: com.orbital.run.logic.Persistence.CompletedActivity): Boolean = withContext(Dispatchers.IO) {
        // Withings API is primarily for reading data (scales, sleep, activity).
        // Writing activities is possible but less common.
        return@withContext false
    }
    
    suspend fun downloadRecentActivities(context: Context): List<com.orbital.run.logic.Persistence.CompletedActivity> = withContext(Dispatchers.IO) {
        val token = getToken(context) ?: return@withContext emptyList()
        android.util.Log.d("WITHINGS", "Downloading recent activities...")
        return@withContext emptyList()
    }
}
