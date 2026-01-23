package com.drawrun.app.logic

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import android.util.Log

data class VersionInfo(
    val version: String,
    val versionCode: Int,
    val downloadUrl: String,
    val releaseNotes: String
)

object UpdateChecker {
    private const val VERSION_URL = "https://lomicbourlotroche.github.io/DrawRun/version.json"
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
        .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
        .writeTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()
    
    suspend fun checkForUpdate(currentVersionCode: Int): VersionInfo? = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url(VERSION_URL)
                .build()
                
            val response = client.newCall(request).execute()
            
            if (response.isSuccessful) {
                val body = response.body?.string()
                if (body != null) {
                    val json = JSONObject(body)
                    val latestVersionCode = json.getInt("versionCode")
                    
                    if (latestVersionCode > currentVersionCode) {
                        return@withContext VersionInfo(
                            version = json.getString("version"),
                            versionCode = latestVersionCode,
                            downloadUrl = json.getString("downloadUrl"),
                            releaseNotes = json.getString("releaseNotes")
                        )
                    }
                }
            }
            null
        } catch (e: Exception) {
            Log.e("UpdateChecker", "Failed to check for updates", e)
            null
        }
    }
}
