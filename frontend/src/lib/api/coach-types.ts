/**
 * ============================================================
 * COACH API TYPES - Types pour l'API Coach de DrawRun
 * ============================================================
 * 
 * Ce fichier contient les types spécifiques au module Coach
 * (plans d'entraînement, sessions, tests, etc.)
 * 
 * @module lib/api/coach-types
 */

// Coach - Active Plan Response
// ============================================================================

/**
 * Response from getActivePlan endpoint
 */
export interface ActivePlanResponse {
  plan?: PlanDetail | null;
  sessions?: TrainingSession[] | null;
  planId?: number;
  fullPlan?: PlanDetail | null;
}
// Coach - Plan Types
// ============================================================================

/**
 * Represents a training session in a plan
 */
export interface TrainingSession {
  id: number;
  planId: number;
  week: number;
  day: number;
  title: string;
  description?: string;
  type: 'endurance' | 'interval' | 'tempo' | 'recovery' | 'long_run' | 'test' | 'rest' | 'cross_training';
  intensity: 'low' | 'moderate' | 'high' | 'very_high';
  duration: number; // in minutes
  distance?: number; // in km
  targetPace?: { min: string; max: string };
  targetHR?: { min: number; max: number };
  targetPower?: { min: number; max: number };
  warmup?: { duration: number; description: string };
  cooldown?: { duration: number; description: string };
  intervals?: Array<{
    duration: number;
    distance?: number;
    pace?: string;
    hr?: { min: number; max: number };
    power?: { min: number; max: number };
    rest: number;
    repeat: number;
  }>;
  rpe?: number;
  notes?: string;
  completed: boolean;
  completedAt?: string;
  actualDuration?: number;
  actualDistance?: number;
  actualRpe?: number;
  feedback?: {
    difficulty: 'easy' | 'normal' | 'hard';
    rpe: number;
    pain?: boolean;
    notes?: string;
  };
}

/**
 * Represents a training plan
 */
export interface TrainingPlan {
  id: number;
  userId: number;
  name: string;
  description?: string;
  target: string;
  targetDistance?: number;
  targetDate?: string;
  weeks: number;
  sessionsPerWeek: number;
  trainingDays: number[];
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'abandoned' | 'paused';
  type: 'adaptive' | 'static' | 'custom';
  experienceLevel?: string;
  currentWeeklyKm?: number;
  vmaValue?: number;
  vdotValue?: number;
  createdAt: string;
  updatedAt: string;
  sessions: TrainingSession[];
}

/**
 * Simplified plan for list views
 */
export interface PlanSummary {
  id: number;
  name: string;
  target: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'abandoned' | 'paused';
  progress: number; // percentage
  totalSessions: number;
  completedSessions: number;
}

/**
 * Detailed plan with full information
 */
export interface PlanDetail extends TrainingPlan {
  phases: Array<{
    name: string;
    description: string;
    weekRange: [number, number];
    focus: string;
    volume: { min: number; max: number };
    intensity: { min: number; max: number };
  }>;
  weeklyVolume: number[];
  intensityDistribution: { low: number; moderate: number; high: number };
  equipment?: string[];
  notes?: string;
}

/**
 * Result from starting an adaptive plan
 */
export interface AdaptivePlanResult {
  success: boolean;
  planId: number;
  message: string;
  plan?: PlanDetail;
  sessions?: TrainingSession[];
}

/**
 * Result from submitting plan feedback
 */
export interface PlanFeedbackResult {
  success: boolean;
  message: string;
  adaptation?: {
    adjustedSessions: number;
    reason: string;
    changes: Array<{
      sessionId: number;
      field: string;
      oldValue: unknown;
      newValue: unknown;
    }>;
  };
}

/**
 * Result from reporting a missed session
 */
export interface MissedSessionResult {
  success: boolean;
  message: string;
  sessionId: number;
  rescheduled?: boolean;
  newDate?: string;
}

/**
 * Result from submitting test results
 */
export interface SubmitTestResult {
  success: boolean;
  message: string;
  testId: number;
  results: {
    vma?: number;
    vdot?: number;
    cooperDistance?: number;
    fitnessScore?: number;
  };
  updatedZones?: boolean;
}

/**
 * Pending sessions that need to be matched to activities
 */
export interface PendingSessions {
  sessions: Array<{
    id: number;
    planId: number;
    week: number;
    day: number;
    title: string;
    type: string;
    date: string;
    matched: boolean;
    activityId?: number;
  }>;
}

/**
 * Upcoming session information
 */
export interface UpcomingSession {
  id: number;
  planId: number;
  week: number;
  day: number;
  title: string;
  type: string;
  intensity: string;
  date: string;
  duration: number;
  distance?: number;
  completed: boolean;
  overdue: boolean;
}

/**
 * Weekly plan summary
 */
export interface WeeklyPlanSummary {
  weekNumber: number;
  sessionCount: number;
  totalTSS: number;
  totalDistance: number;
  totalTimeHours: number;
  intensityDistribution: { low: number; moderate: number; high: number };
  sessions: Array<{
    id: number;
    day: number;
    type: string;
    title: string;
    intensity: string;
    completed: boolean;
  }>;
}

/**
 * Plan progress information
 */
export interface PlanProgress {
  planId: number;
  totalSessions: number;
  completedSessions: number;
  missedSessions: number;
  currentStreak: number;
  longestStreak: number;
  weeklyVolume: Array<{ week: number; volume: number }>;
  intensityDistribution: { low: number; moderate: number; high: number };
  averageRpe: number;
  completionRate: number;
  phaseProgress: Array<{ phase: string; progress: number }>;
}

// ============================================================================
// Coach - Test Types
// ============================================================================

/**
 * Test protocol information
 */
export interface TestProtocol {
  name: string;
  description: string;
  steps: string[];
  estimatedDuration: number; // in minutes
  equipmentNeeded?: string[];
}

/**
 * Scheduled test information
 */
export interface ScheduledTest {
  id: number;
  planId: number;
  testType: 'vma' | 'cooper' | 'vdot' | 'fitness';
  scheduledDate: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  protocol: TestProtocol;
  results?: TestResults;
}

/**
 * Test results
 */
export interface TestResults {
  vma?: number;
  vdot?: number;
  cooperDistance?: number;
  fitnessScore?: number;
  time?: number; // in seconds
  distance?: number; // in meters
  submittedAt: string;
}

// ============================================================================
// Coach - Gamification Types
// ============================================================================

/**
 * Badge information
 */
export interface CoachBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: string;
  progress?: number;
  target?: number;
}

/**
 * Achievement information
 */
export interface Achievement {
  id: string;
  name: string;
  progress: number;
  target: number;
  unlocked: boolean;
  unlockedAt?: string;
}

/**
 * Level information
 */
export interface CoachLevel {
  current: number;
  xp: number;
  xpToNext: number;
  title: string;
}

/**
 * Gamification data for a plan
 */
export interface GamificationData {
  planId: number;
  badges: CoachBadge[];
  achievements: Achievement[];
  level: CoachLevel;
  stats: {
    totalKm: number;
    totalHours: number;
    totalSessions: number;
  };
  streaks: {
    current: number;
    longest: number;
    lastActiveDate: string;
  };
}

// ============================================================================
// Coach - Race Strategy Types
// ============================================================================

/**
 * Point for race strategy calculation
 */
export interface RaceStrategyPoint {
  dist: number; // distance in meters
  elev: number; // elevation in meters
}

/**
 * Parameters for race strategy calculation
 */
export interface RaceStrategyParams {
  points?: RaceStrategyPoint[];
  gpxData?: string;
  params: {
    temp?: number;
    humidity?: number;
    goalTime?: number; // in seconds
  };
}

/**
 * Result from race strategy calculation
 */
export interface RaceStrategyResult {
  success: boolean;
  message?: string;
  strategy: {
    targetTime: number; // in seconds
    targetPace: string;
    segments: Array<{
      km: number;
      distance: number; // in meters
      time: number; // in seconds
      pace: string;
      targetPace: string;
      targetPaceSec: number; // in seconds
      cumulativeTime: number; // in seconds
      elevationGain: number;
      elevationLoss: number;
      elevGain: number;
      elevLoss: number;
      grade: number; // percentage
      recommendedPace: string;
      notes?: string;
    }>;
    pacingAdvice: string;
    elevationProfile: Array<{ distance: number; elevation: number }>;
    difficultyScore: number;
  };
}

// ============================================================================
// Coach - External Events Types
// ============================================================================

/**
 * External event that affects the plan
 */
export interface ExternalEvent {
  id: number;
  planId: number;
  eventType: 'competition' | 'vacation' | 'illness' | 'work_trip' | 'other';
  startDate: string;
  endDate?: string;
  name: string;
  notes?: string;
  affectedSessions: number[];
}

// ============================================================================
// Coach - Wizard Types
// ============================================================================

/**
 * Default values for the plan wizard
 */
// ============================================================================
// Coach - Missing exports used by coach.api.ts
// ============================================================================

export interface CoachProfile {
  user: { id: number; email: string; name: string };
  profile: {
    vdot?: number; vma?: number; fcm?: number; resting_hr?: number;
    age?: number; sex?: string; weight?: number; weeklyKm?: number | null; pace?: string | null;
  };
  activePlan: { plan: Record<string, unknown>; sessions: Record<string, unknown>[]; planId: number } | null;
  hasActivePlan: boolean;
}

export interface GeneratePlanParams {
  planName?: string;
  targetDistance?: number;
  weeks?: number;
  sessionsPerWeek?: number;
  [key: string]: unknown;
}

export interface GeneratePlanResult {
  success: boolean;
  planId?: number;
  message?: string;
  [key: string]: unknown;
}

export interface PlanFeedback {
  sessionId: number;
  difficulty?: 'easy' | 'normal' | 'hard';
  rpe?: number;
  pain?: boolean;
  notes?: string;
  [key: string]: unknown;
}

export interface WizardDefaults {
  defaults: {
    currentWeeklyKm?: number;
    experienceLevel?: string;
    fcm?: number;
    vdot?: number;
    vdotValue?: number;
    hasVDOT?: boolean;
    vmaValue?: number;
    hasVMA?: boolean;
    trainingDays?: string[];
    sessionsPerWeek?: string;
    availableTimePerSession?: string;
    equipment?: string;
  };
  activitiesAnalyzed: number;
}

