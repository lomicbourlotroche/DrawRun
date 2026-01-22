package com.drawrun.app

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.runtime.derivedStateOf
import com.drawrun.app.ui.theme.AppTheme
import com.drawrun.app.logic.TrainingPlanGenerator
import com.drawrun.app.logic.TrainingZones
import com.drawrun.app.logic.RunZones
import com.drawrun.app.logic.BikeZones
import com.drawrun.app.logic.SwimZones
import com.drawrun.app.logic.PerformanceAnalyzer

enum class Screen {
    OnboardingProfile,
    OnboardingSync,
    WelcomeSplash,
    MainApp
}

class AppState {
    var currentScreen by mutableStateOf(Screen.WelcomeSplash)
    var appTheme by mutableStateOf(AppTheme.ONYX)
    var activeTab by mutableStateOf("home")
    
    // User Data
    var firstName by mutableStateOf("")
    var age by mutableStateOf("")
    var sex by mutableStateOf("")
    var weight by mutableStateOf("")
    var restingHR by mutableStateOf("")
    var ftp by mutableStateOf("250") // Default FTP
    var avatarUrl by mutableStateOf<String?>(null)
    
    // Connections
    var stravaConnected by mutableStateOf(false)
    var healthConnectConnected by mutableStateOf(false)
    var healthConnectPermissionsGranted by mutableStateOf(false)
    var stravaAthleteId by mutableStateOf<Int?>(null)
    var athleteStats by mutableStateOf<AthleteStats?>(null)
    var athleteZones by mutableStateOf<AthleteZones?>(null)
    
    // Activity Detail
    var selectedActivity by mutableStateOf<ActivityItem?>(null)
    var selectedActivityStreams by mutableStateOf<ActivityStreams?>(null)
    var selectedActivityAnalysis by mutableStateOf<ActivityAnalysis?>(null)
    
    // Explanations
    var showExplanation by mutableStateOf(false)
    var explanationTitle by mutableStateOf("")
    var explanationContent by mutableStateOf("")

    // Sync State
    var isSyncing by mutableStateOf(false)

    // Generated Content
    // Generated Content - Run
    var runPlanObjective by mutableStateOf("")
    var runPlanFreq by mutableStateOf(4f)
    var generatedRunPlan by mutableStateOf<List<TrainingPlanGenerator.WeekPlan>>(emptyList()) // List of weeks

    // Generated Content - Swim
    var swimDistInput by mutableStateOf(2000f) // Slider 500-5000
    var swimDurationInput by mutableStateOf(60f) // Slider 15-120 min (optional)
    var generatedSwimSession by mutableStateOf<TrainingPlanGenerator.SwimSessionData?>(null)
    
    // Saved Swim Sessions
    var savedSwimSessions by mutableStateOf<List<SwimSession>>(emptyList())

    // Real Data Metrics
    var activities by mutableStateOf<List<ActivityItem>>(emptyList())
    var hrv by mutableStateOf("--")
    var readiness by mutableStateOf("--")
    var ctl by mutableStateOf("--")
    var tsb by mutableStateOf("--")
    var sleepScore by mutableStateOf("--")
    var sleepDuration by mutableStateOf("--")
    
    // Training Plan Completion Tracking
    var workoutCompletions by mutableStateOf<Map<String, WorkoutCompletion>>(emptyMap())

    // PMC (Performance Management Chart) / Banister Data
    var banisterPmcData by mutableStateOf<List<PmcDataPoint>>(emptyList())

    // Derived Scientific Metrics
    val userProfileComplete by derivedStateOf {
        age.isNotBlank() && sex.isNotBlank() && weight.isNotBlank() && restingHR.isNotBlank()
    }
    
    // Beta PDF - Advanced Metrics
    var fatigueATL by mutableStateOf<Int?>(null)
    var formTSB by mutableStateOf<Int?>(null)
    var wPrime by mutableStateOf<String?>(null)
    var ageGrading by mutableStateOf<Double?>(null)
    var pointsScore by mutableStateOf<Int?>(null)
    var marathonPrediction by mutableStateOf<String?>(null)
    var swimmingProfile by mutableStateOf<String?>(null)
    var cyclingProfile by mutableStateOf<String?>(null)
    var rai by mutableStateOf<Double?>(null) // Run Activity Index

    val fcm by derivedStateOf {
        if (userProfileComplete) PerformanceAnalyzer.calculateFCM(age.toIntOrNull() ?: 30, sex, weight.toDoubleOrNull() ?: 70.0) else 0
    }

    val vo2Max by derivedStateOf {
        if (userProfileComplete) {
            PerformanceAnalyzer.calculateVO2Max(
                age.toIntOrNull() ?: 30, 
                sex, 
                weight.toDoubleOrNull() ?: 70.0, 
                restingHR.toIntOrNull() ?: 60
            ) 
        } else 0.0
    }

    val vma by derivedStateOf {
        if (userProfileComplete) {
            PerformanceAnalyzer.calculateVMA(
                age.toIntOrNull() ?: 30, 
                sex, 
                weight.toDoubleOrNull() ?: 70.0, 
                restingHR.toIntOrNull() ?: 60
            )
        } else 0.0
    }

    // Derived RAI - Placeholder logic: RAI is roughly VDOT + 2 for simplicity if not set
    val calculatedRai by derivedStateOf {
        rai ?: (vdot * 1.05)
    }

    // Cached analysis of all activities
    val activityInsights by derivedStateOf {
        com.drawrun.app.logic.ActivityAnalyzer.analyzeActivities(activities)
    }

    val vdot by derivedStateOf {
        // Use the best VDOT found in history (Global VDOT)
        activityInsights.estimatedVDOT ?: run {
            // Fallback: Estimate VDOT from VMA if available
            if (vma > 0) {
                 // Rough estimation: Run 5km at 90% VMA
                 val speed5k = vma * 0.90 // km/h
                 val timeMin = (5.0 / speed5k) * 60.0
                 PerformanceAnalyzer.calculateVDOT(5000.0, timeMin)
            } else {
                30.0 // Default baseline
            }
        }
    }

    val zones by derivedStateOf {
        if (userProfileComplete) {
            PerformanceAnalyzer.getPersonalizedZones(this)
        } else null
    }
}

data class ActivityItem(
    val id: Long,
    val type: String,
    val title: String,
    val date: String,
    val dist: String,
    val load: String,
    val duration: String,
    val pace: String,
    val avgHr: String,
    val mapPolyline: String?,
    val color: Color,
    val icon: ImageVector,
    val startTime: String? = null, // ISO-8601 for Health Connect retrieval
    val endTime: String? = null
)

data class ActivityStreams(
    val time: List<Int>, // Seconds from start
    val distance: List<Double>? = null,
    val heartRate: List<Int>? = null,
    val pace: List<Double>? = null, // m/s
    val altitude: List<Double>? = null,
    val cadence: List<Int>? = null,
    val power: List<Int>? = null,
    val gradAdjustedPace: List<Double>? = null,
    val hrDerivative: List<Double>? = null,
    val vam: List<Double>? = null
)

data class ActivityAnalysis(
    val efficiencyFactor: Double?,
    val aerobicDecoupling: Double?,
    val intensityFactor: Double?,
    val tss: Double?,
    val variabilityIndex: Double?,
    val lapData: List<LapInfo>,
    // Advanced Metrics
    val normalizedPower: Double? = null,
    val normalizedSpeed: Double? = null, // NGP / GAP based
    val trimp: Double? = null,
    val vam: Double? = null,
    val hrZoneDistribution: List<Double>? = null, // Percentages per zone
    val powerZoneDistribution: List<Double>? = null,
    val paceZoneDistribution: List<Double>? = null,
    // Biomechanical (Sport Specific)
    val groundContactTime: Double? = null,
    val verticalOscillation: Double? = null,
    val swolf: Int? = null,
    val dps: Double? = null,
    val strokeRate: Int? = null
)

data class LapInfo(
    val lapNumber: Int,
    val distance: Double,
    val duration: Int,
    val avgPace: String,
    val avgHr: Int,
    val avgPower: Int?,
    val elevationGain: Double
)

data class AthleteStats(
    val allRunTotals: Totals,
    val allBikeTotals: Totals,
    val allSwimTotals: Totals
)

data class Totals(
    val count: Int,
    val distance: Double,
    val movingTime: Int,
    val elapsedTime: Int,
    val elevationGain: Double
)

data class AthleteZones(
    val heartRate: HRZones?,
    val power: PowerZones?
)

data class HRZones(
    val customZones: Boolean,
    val zones: List<HRZone>
)

data class HRZone(
    val min: Int,
    val max: Int
)

data class PowerZones(
    val zones: List<PowerZone>
)

data class PowerZone(
    val min: Int,
    val max: Int
)

data class SwimSession(
    val id: Long = System.currentTimeMillis(),
    val data: TrainingPlanGenerator.SwimSessionData,
    val date: String = java.time.LocalDate.now().toString()
)

data class PmcDataPoint(
    val date: String,
    val ctl: Double,
    val atl: Double,
    val tsb: Double
)

enum class CompletionStatus {
    PENDING,      // Not yet done
    COMPLETED,    // Done as planned
    PARTIAL,      // Done but not matching plan (wrong distance/intensity)
    SKIPPED       // Intentionally skipped or missed
}

data class WorkoutCompletion(
    val planWeek: Int,
    val planDay: Int,
    val plannedDate: String,
    val completedDate: String?,
    val actualActivity: ActivityItem?,
    val status: CompletionStatus,
    val completionScore: Int // 0-100% match quality
)
