package com.drawrun.app.api

import okhttp3.Interceptor
import okhttp3.Response
import com.drawrun.app.data.TokenStorage

/**
 * Interceptor that adds Authorization header to all Strava API requests
 */
class AuthInterceptor(private val tokenStorage: TokenStorage) : Interceptor {
    
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val token = tokenStorage.getAccessTokenSync()
        
        // Don't add header for OAuth endpoints or if no token exists
        if (originalRequest.url.encodedPath.contains("oauth/token") || token == null) {
            return chain.proceed(originalRequest)
        }
        
        // Add Authorization header
        val authenticatedRequest = originalRequest.newBuilder()
            .header("Authorization", "Bearer $token")
            .build()
        
        return chain.proceed(authenticatedRequest)
    }
}
