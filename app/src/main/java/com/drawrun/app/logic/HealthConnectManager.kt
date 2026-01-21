package com.drawrun.app.logic

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.*
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Instant
import java.time.ZonedDateTime
import android.util.Log

/**
 * Manager for Health Connect operations.
 * Handles permissions and fetching health data records.
 */
class HealthConnectManager(private val context: Context) {

    val healthConnectClient by lazy { HealthConnectClient.getOrCreate(context) }

    /**
     * Comprehensive list of permissions for health data.
     */
    val allPermissions = setOf(
        // Activity
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(DistanceRecord::class),
        HealthPermission.getReadPermission(TotalCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(ExerciseSessionRecord::class),
        HealthPermission.getReadPermission(SpeedRecord::class),
        HealthPermission.getReadPermission(PowerRecord::class),
        // Vitals
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(RestingHeartRateRecord::class),
        HealthPermission.getReadPermission(OxygenSaturationRecord::class),
        HealthPermission.getReadPermission(BloodPressureRecord::class),
        HealthPermission.getReadPermission(BodyTemperatureRecord::class),
        HealthPermission.getReadPermission(HeartRateVariabilityRmssdRecord::class),
        // Sleep and Nutrition
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(HydrationRecord::class),
        HealthPermission.getReadPermission(NutritionRecord::class),
        // Measurements
        HealthPermission.getReadPermission(WeightRecord::class),
        HealthPermission.getReadPermission(BodyFatRecord::class),
        HealthPermission.getReadPermission(HeightRecord::class),
        // Route (Special permission)
        "android.permission.health.READ_EXERCISE_ROUTE"
    )

    /**
     * Checks if Health Connect is available on the device.
     */
    fun checkAvailability(): Int {
        return HealthConnectClient.getSdkStatus(context)
    }

    /**
     * Checks if all required permissions are granted.
     */
    suspend fun hasAllPermissions(): Boolean {
        val granted = healthConnectClient.permissionController.getGrantedPermissions()
        return granted.containsAll(allPermissions)
    }
    
    /**
     * Simplified permission check for the main set of permissions.
     */
    suspend fun hasPermissions(permissionsToCheck: Set<String>): Boolean {
        val granted = healthConnectClient.permissionController.getGrantedPermissions()
        return granted.containsAll(permissionsToCheck)
    }

    /**
     * Generic method to read any record type.
     */
    suspend fun <T : Record> readData(
        recordType: kotlin.reflect.KClass<T>,
        startTime: Instant,
        endTime: Instant
    ): List<T> {
        return try {
            val response = healthConnectClient.readRecords(
                ReadRecordsRequest(
                    recordType = recordType,
                    timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
                )
            )
            response.records
        } catch (e: Exception) {
            Log.e("HealthConnectManager", "Error reading ${recordType.simpleName}", e)
            emptyList()
        }
    }

    // Specific helper methods for common data types

    suspend fun readSteps(startTime: Instant, endTime: Instant) = readData(StepsRecord::class, startTime, endTime)
    
    suspend fun readHeartRate(startTime: Instant, endTime: Instant) = readData(HeartRateRecord::class, startTime, endTime)
    
    suspend fun readRestingHeartRate(startTime: Instant, endTime: Instant) = readData(RestingHeartRateRecord::class, startTime, endTime)
    
    suspend fun readSleepSessions(startTime: Instant, endTime: Instant) = readData(SleepSessionRecord::class, startTime, endTime)
    
    suspend fun readHRV(startTime: Instant, endTime: Instant) = readData(HeartRateVariabilityRmssdRecord::class, startTime, endTime)
    
    suspend fun readWeight(startTime: Instant, endTime: Instant) = readData(WeightRecord::class, startTime, endTime)
}
