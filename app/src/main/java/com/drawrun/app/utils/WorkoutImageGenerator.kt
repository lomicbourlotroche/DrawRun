package com.drawrun.app.utils

import android.graphics.*
import com.drawrun.app.CustomRunWorkout
import com.drawrun.app.logic.TrainingPlanGenerator

object WorkoutImageGenerator {
    private const val WIDTH = 1080
    private const val HEADER_HEIGHT = 200
    private const val PADDING = 60f

    fun generateRunWorkoutImage(workout: CustomRunWorkout): Bitmap {
        val height = 1200 + (workout.steps.size * 120)
        val bitmap = Bitmap.createBitmap(WIDTH, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        
        // Background Gradient
        val bgPaint = Paint().apply {
            shader = LinearGradient(0f, 0f, 0f, height.toFloat(),
                Color.parseColor("#1C1C1E"), Color.parseColor("#000000"), Shader.TileMode.CLAMP)
        }
        canvas.drawRect(0f, 0f, WIDTH.toFloat(), height.toFloat(), bgPaint)

        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        
        // Header (DrawRun)
        paint.color = Color.parseColor("#EF4444")
        paint.textSize = 80f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD_ITALIC)
        canvas.drawText("DRAWRUN", PADDING, 120f, paint)

        paint.color = Color.WHITE
        paint.textSize = 40f
        paint.typeface = Typeface.DEFAULT
        canvas.drawText("COACH IA", WIDTH - 250f, 110f, paint)

        // Title
        paint.textSize = 70f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText(workout.name.uppercase(), PADDING, 300f, paint)

        // Metadata
        paint.textSize = 40f
        paint.color = Color.LTGRAY
        paint.typeface = Typeface.DEFAULT
        canvas.drawText("${(workout.totalDistance / 1000).toInt()}km • ${formatDuration(workout.totalDuration)}", PADDING, 380f, paint)

        // Steps
        var currentY = 500f
        paint.textSize = 45f
        paint.color = Color.WHITE
        
        workout.steps.forEach { step ->
            val color = Color.parseColor(when(step.type) {
                "WARMUP" -> "#3B82F6"
                "RUN" -> "#EF4444"
                "REST" -> "#F59E0B"
                else -> "#22C55E"
            })
            
            val stepPaint = Paint(paint).apply { this.color = color; typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD) }
            canvas.drawCircle(PADDING + 20, currentY - 15, 10f, stepPaint)
            
            val label = when(step.type) {
                "WARMUP" -> "Échauffement"
                "RUN" -> "Travail"
                "REST" -> "Récupération"
                "COOL" -> "Retour au calme"
                else -> step.type
            }
            
            canvas.drawText("$label - ${formatStepDuration(step)} @ ${step.targetValue}", PADDING + 60, currentY, paint)
            currentY += 100f
        }

        return bitmap
    }

    fun generateSwimWorkoutImage(session: TrainingPlanGenerator.SwimSessionData): Bitmap {
        val height = 1000 + (session.exercises.size * 180)
        val bitmap = Bitmap.createBitmap(WIDTH, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        
        val bgPaint = Paint().apply {
            shader = LinearGradient(0f, 0f, 0f, height.toFloat(),
                Color.parseColor("#0F172A"), Color.parseColor("#0EA5E9"), Shader.TileMode.CLAMP)
        }
        canvas.drawRect(0f, 0f, WIDTH.toFloat(), height.toFloat(), bgPaint)

        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        
        paint.color = Color.WHITE
        paint.textSize = 80f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD_ITALIC)
        canvas.drawText("DRAWRUN SWIM", PADDING, 120f, paint)

        paint.textSize = 60f
        canvas.drawText(session.focus.uppercase(), PADDING, 250f, paint)
        
        paint.textSize = 40f
        paint.color = Color.parseColor("#E0F2FE")
        canvas.drawText("${session.totalDistance}m • ${session.estimatedDuration}min • ${session.level}", PADDING, 320f, paint)

        var currentY = 450f
        session.exercises.forEach { ex ->
            val boxPaint = Paint().apply { color = Color.BLACK; alpha = 50 }
            canvas.drawRoundRect(PADDING - 20, currentY - 60, WIDTH - PADDING + 20, currentY + 120, 20f, 20f, boxPaint)
            
            paint.color = Color.WHITE
            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            paint.textSize = 45f
            canvas.drawText("${ex.type} - ${ex.distance}m", PADDING, currentY, paint)
            
            paint.typeface = Typeface.DEFAULT
            paint.textSize = 35f
            canvas.drawText(ex.description, PADDING, currentY + 60, paint)
            
            currentY += 200f
        }

        return bitmap
    }

    fun generatePlanDayImage(day: TrainingPlanGenerator.DayPlan): Bitmap {
        val height = 1000 + (day.details.size * 120)
        val bitmap = Bitmap.createBitmap(WIDTH, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        
        val colorHex = when(day.type) {
            "E" -> "#10B981"
            "M" -> "#3B82F6"
            "T" -> "#F59E0B"
            "I", "R" -> "#A855F7"
            else -> "#64748B"
        }
        
        val bgPaint = Paint().apply {
            shader = LinearGradient(0f, 0f, 0f, height.toFloat(),
                Color.parseColor(colorHex), Color.BLACK, Shader.TileMode.CLAMP)
        }
        canvas.drawRect(0f, 0f, WIDTH.toFloat(), height.toFloat(), bgPaint)

        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        paint.color = Color.WHITE
        paint.textSize = 80f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD_ITALIC)
        canvas.drawText("DRAWRUN COACH", PADDING, 120f, paint)

        paint.textSize = 70f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        val safeTitle = if (day.title.length > 25) day.title.take(22) + "..." else day.title
        canvas.drawText(safeTitle.uppercase(), PADDING, 300f, paint)

        paint.textSize = 45f
        paint.typeface = Typeface.DEFAULT
        canvas.drawText("${day.name} • ${day.target}", PADDING, 380f, paint)

        var currentY = 550f
        day.details.forEach { detail ->
            paint.typeface = if (detail.highlight) Typeface.create(Typeface.DEFAULT, Typeface.BOLD) else Typeface.DEFAULT
            paint.textSize = 40f
            paint.color = if (detail.highlight) Color.WHITE else Color.parseColor("#CCCCCC")
            
            canvas.drawText(detail.label, PADDING, currentY, paint)
            paint.typeface = Typeface.DEFAULT
            paint.color = Color.WHITE
            canvas.drawText(detail.content, PADDING, currentY + 50, paint)
            
            currentY += 130f
        }

        return bitmap
    }

    fun generateRecommendationImage(rec: com.drawrun.app.logic.CoachAI.TrainingRecommendation): Bitmap {
        val height = 1100 + (rec.structure.size * 100)
        val bitmap = Bitmap.createBitmap(WIDTH, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        
        val colorHex = when(rec.intensityColor) {
            "purple" -> "#A855F7"
            "orange" -> "#F59E0B"
            "blue" -> "#3B82F6"
            "red" -> "#EF4444"
            else -> "#22C55E"
        }
        
        val bgPaint = Paint().apply {
            shader = LinearGradient(0f, 0f, 0f, height.toFloat(),
                Color.parseColor(colorHex), Color.BLACK, Shader.TileMode.CLAMP)
        }
        canvas.drawRect(0f, 0f, WIDTH.toFloat(), height.toFloat(), bgPaint)

        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        paint.color = Color.WHITE
        paint.textSize = 80f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD_ITALIC)
        canvas.drawText("DRAWRUN COACH IA", PADDING, 120f, paint)

        paint.textSize = 70f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        val safeTitle = if (rec.title.length > 25) rec.title.take(22) + "..." else rec.title
        canvas.drawText(safeTitle.uppercase(), PADDING, 300f, paint)

        paint.textSize = 45f
        paint.typeface = Typeface.DEFAULT
        canvas.drawText("${rec.subtitle} • ${rec.physiologicalGain}", PADDING, 380f, paint)

        paint.textSize = 35f
        paint.color = Color.parseColor("#CCCCCC")
        canvas.drawText(rec.advice, PADDING, 440f, paint)

        var currentY = 580f
        rec.structure.forEach { step ->
            paint.textSize = 42f
            paint.color = Color.WHITE
            canvas.drawCircle(PADDING + 15, currentY - 15, 8f, paint)
            canvas.drawText(step, PADDING + 50, currentY, paint)
            currentY += 90f
        }

        return bitmap
    }

    private fun formatDuration(seconds: Int): String {
        val h = seconds / 3600
        val m = (seconds % 3600) / 60
        return if (h > 0) "${h}h${m}" else "${m}min"
    }

    private fun formatStepDuration(step: com.drawrun.app.WorkoutStep): String {
        return when (step.durationType) {
            "DISTANCE" -> "${(step.durationValue / 1000).toInt()}km"
            "TIME" -> formatDuration(step.durationValue.toInt())
            else -> "Ouvert"
        }
    }
}
