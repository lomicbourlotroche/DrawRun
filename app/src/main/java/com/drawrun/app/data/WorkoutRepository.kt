package com.drawrun.app.data

import android.content.Context
import com.drawrun.app.CustomRunWorkout
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.io.File

object WorkoutRepository {
    private const val FILE_NAME = "custom_workouts.json"
    private val gson = Gson()

    fun saveWorkouts(context: Context, workouts: List<CustomRunWorkout>) {
        try {
            val json = gson.toJson(workouts)
            val file = File(context.filesDir, FILE_NAME)
            file.writeText(json)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun loadWorkouts(context: Context): List<CustomRunWorkout> {
        return try {
            val file = File(context.filesDir, FILE_NAME)
            if (!file.exists()) return emptyList()

            val json = file.readText()
            val type = object : TypeToken<List<CustomRunWorkout>>() {}.type
            gson.fromJson(json, type) ?: emptyList()
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
}
