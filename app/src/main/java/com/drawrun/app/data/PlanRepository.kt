package com.drawrun.app.data

import android.content.Context
import com.drawrun.app.logic.TrainingPlanGenerator
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.TypeAdapter
import com.google.gson.stream.JsonReader
import com.google.gson.stream.JsonWriter
import java.io.File
import java.time.LocalDate

data class SavedTrainingPlan(
    val objective: String,
    val weeks: List<TrainingPlanGenerator.WeekPlan>,
    val createdAt: String = LocalDate.now().toString()
)

object PlanRepository {
    private const val FILE_NAME = "training_plan.json"

    private class LocalDateAdapter : TypeAdapter<LocalDate>() {
        override fun write(out: JsonWriter, value: LocalDate?) {
            out.value(value?.toString())
        }

        override fun read(input: JsonReader): LocalDate {
            return LocalDate.parse(input.nextString())
        }
    }

    private fun getGson(): Gson {
        return GsonBuilder()
            .registerTypeAdapter(LocalDate::class.java, LocalDateAdapter())
            .create()
    }

    fun savePlan(context: Context, plan: List<TrainingPlanGenerator.WeekPlan>, objective: String) {
        try {
            val savedPlan = SavedTrainingPlan(objective, plan)
            val json = getGson().toJson(savedPlan)
            val file = File(context.filesDir, FILE_NAME)
            file.writeText(json)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun loadPlan(context: Context): Pair<List<TrainingPlanGenerator.WeekPlan>, String>? {
        return try {
            val file = File(context.filesDir, FILE_NAME)
            if (!file.exists()) return null

            val json = file.readText()
            val savedPlan = getGson().fromJson(json, SavedTrainingPlan::class.java)
            
            Pair(savedPlan.weeks, savedPlan.objective)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    fun deletePlan(context: Context) {
        try {
            val file = File(context.filesDir, FILE_NAME)
            if (file.exists()) {
                file.delete()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
