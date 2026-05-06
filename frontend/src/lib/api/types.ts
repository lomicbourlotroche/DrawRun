/* eslint-disable no-redeclare */
/**
 * ============================================================
 * API TYPES - Types partagés pour le client API DrawRun
 * ============================================================
 * 
 * Ce fichier contient tous les types et interfaces partagés
 * utilisés par les différents modules de l'API client.
 * 
 * @module lib/api/types
 */

// ============================================================================
// Types de base
// ============================================================================

export interface SyncResult {
  strava?: { imported?: number; updated?: number; error?: string };
  garmin?: { imported?: number; updated?: number; error?: string };
  suunto?: { imported?: number; updated?: number; error?: string };
}

export interface SyncStatus {
  garmin_status: 'idle' | 'syncing' | 'error';
  garmin_last_sync: string | null;
  strava_status: 'idle' | 'syncing' | 'error';
  strava_last_sync: string | null;
  suunto_status: 'idle' | 'syncing' | 'error';
  suunto_last_sync: string | null;
  decathlon_status: 'idle' | 'syncing' | 'error';
  decathlon_last_sync: string | null;
}

// ============================================================================
// Gestion des erreurs
// ============================================================================

export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// ============================================================================
// Algorithmes - Paramètres et Réponses
// ============================================================================

export interface AlgoZonesParams {
  age?: number;
  fcm?: number;
  restingHR?: number;
  vma?: number;
  vdot?: number;
  sex?: 'M' | 'F';
}

export interface AlgoZonesResponse {
  age: number;
  fcm: number;
  restingHR: number;
  sex: string;
  hrZones: Array<{
    zone: number;
    name: string;
    minHR: number;
    maxHR: number;
    min: number;
    max: number;
  }>;
  hrPercentZones: Array<{
    zone: number;
    name: string;
    minHR: number;
    maxHR: number;
    min: number;
    max: number;
  }>;
  speedZones?: Array<{
    zone: number;
    name: string;
    minPace: string;
    maxPace: string;
    min: number;
    max: number;
  }>;
  trainingPaces?: {
    E: { min: string; max: string };
    M: string;
    T: string;
    I: string;
    R: string;
  };
  vdot?: number;
  vma?: number;
}

export interface AlgoVdotParams {
  distance?: number;
  time?: number;
  vdot?: number;
}

export interface AlgoVdotResponse {
  vdot: number;
  vma: number;
  level: { level: string; color: string; percent: number };
  predictions: {
    marathon: { time: string; pace: string };
    halfMarathon: { time: string; pace: string };
    classicRaces: Array<{ distance: string; time: string; pace: string }>;
  };
}

export interface AlgoPmcParams {
  activities: Array<{ date: string; tss: number }>;
  weeks?: number;
}

export interface AlgoPmcResponse {
  data: Array<{
    date: string;
    ctl: number;
    atl: number;
    tsb: number;
    sb?: number;
    monotony?: number;
    strain?: number;
    acwr?: number;
    acwrStatus?: {
      status: string;
      color: string;
      message: string;
    };
  }>;
  summary: {
    ctl: number;
    atl: number;
    tsb: number;
    sb?: number;
    acwr: number;
    acwrStatus: { status: string; color: string; label: string; message: string; risk: string };
    monotony: number;
    strain: number;
    strainStatus: { status: string; color: string; label: string };
    weeklyLoad: number;
    chronicLoad: number;
  };
}

export interface AlgoRecommendationsParams {
  profile?: { vma?: number; fcm?: number; vdot?: number; restingHR?: number; age?: number; sex?: string };
  history?: {
    weeklyLoad?: number;
    chronicLoad?: number;
    acwr?: number;
    readiness?: number;
    daysSinceLongRun?: number;
    daysSinceInterval?: number;
    currentStreak?: number;
    polarizationIndex?: number;
  };
  dayOfWeek?: number;
}

export interface AlgoReadinessParams {
  pmc?: Array<{ date: string; ctl: number; atl: number; tsb: number }>;
  hrv?: number;
  sleep?: number;
}

export interface AlgoReadinessResponse {
  readiness: number;
  status: string;
  color: string;
  label: string;
  advice: string;
  factors: { pmc: boolean; hrv: boolean; sleep: number | null };
}

export interface AlgoTaperParams {
  currentLoad: number;
  daysToCompetition: number;
  style?: 'classic' | 'linear' | 'exponential' | 'step';
}

export interface AlgoOvertrainingParams {
  performanceTrend?: number;
  rpeChange?: number;
  hrvRatio?: number;
  sleepQuality?: number;
  restingHRChange?: number;
  moodScore?: number;
  illnessCount?: number;
}

export interface AlgoCriticalPowerParams {
  efforts: Array<{ duration: number; value: number }>;
}

export interface AlgoTSSParams {
  duration?: number;
  intensityFactor?: number;
  avgHR?: number;
  maxHR?: number;
  durationMin?: number;
  sex?: 'M' | 'F';
}

export interface AlgoHealthParams {
  profile?: { age?: number; vma?: number; fcm?: number; restingHR?: number; sex?: string; vdot?: number };
  pmc?: Array<{ date: string; ctl: number; atl: number; tsb: number }>;
  hrv?: { rmssd: number; baseline?: number };
}

// ============================================================================
// Coach - Plan et Sessions
// ============================================================================

export interface StartAdaptivePlanParams {
  targetDistance: number;
  weeks: number;
  sessionsPerWeek: number;
  trainingDays: number[];
  hasVMA?: boolean;
  vmaValue?: number | null;
  vdotValue?: number | null;
  experienceLevel?: string;
  currentWeeklyKm?: number;
  goals?: string;
  availableTimePerSession?: number;
  equipment?: string;
  motivation?: string;
  injuries?: string;
  notes?: string;
  questionnaire?: Record<string, unknown>;
}

export interface SubmitPlanFeedbackParams {
  planId: number;
  sessionNumber: number;
  feedback: {
    difficulty: 'easy' | 'normal' | 'hard';
    rpe: number;
    pain?: boolean;
    notes?: string;
  };
}

export interface ReportMissedSessionParams {
  planId: number;
  sessionId: number;
  reason: 'injury' | 'illness' | 'work' | 'travel' | 'fatigue' | 'motivation' | 'other';
  notes?: string;
}

export interface ScheduleTestParams {
  planId: number;
  testType: 'vma' | 'cooper' | 'vdot' | 'fitness';
  scheduledDate: string;
}

export interface SubmitTestResultsParams {
  planId: number;
  testId: number;
  testType: 'vma' | 'cooper' | 'vdot' | 'fitness';
  results: {
    distance?: number;
    time?: number;
    vma?: number;
    vdot?: number;
  };
}

export interface AddExternalEventParams {
  planId: number;
  eventType: 'competition' | 'vacation' | 'illness' | 'work_trip' | 'other';
  startDate: string;
  endDate?: string;
  name: string;
  notes?: string;
}

export interface MatchActivityToSessionParams {
  activityId: number;
  sessionId: number;
}

// ============================================================================
// Social - Core
// ============================================================================

export interface CreateGroupParams {
  name: string;
  description?: string;
  isPrivate?: boolean;
}

export interface GroupUpdateParams {
  name?: string;
  description?: string;
  isPrivate?: boolean;
  regenerateInvite?: boolean;
}

export interface CreateEventParams {
  title: string;
  description?: string;
  location?: string;
  eventDate: string;
  endDate?: string;
  isOnline?: boolean;
  maxAttendees?: number;
}

export interface ShareStatsParams {
  statType: string;
  statValue: number;
  statUnit: string;
  period?: string;
  anonymous?: boolean;
}

export interface LeaderboardParams {
  groupId?: number;
  category?: string;
  period?: string;
}

// ============================================================================
// Social - Chat & Messaging
// ============================================================================

export interface CreateConversationParams {
  otherUserId?: number;
  groupId?: number;
}

export interface SendMessageParams {
  conversationId: number;
  content: string;
  messageType?: string;
  attachmentUrl?: string;
}

// ============================================================================
// Social - Challenges
// ============================================================================

export interface CreateChallengeParams {
  title: string;
  description?: string;
  type: string;
  target_value: number;
  target_unit?: string;
  duration_days: number;
  is_public?: boolean;
  max_participants?: number;
  is_team?: boolean;
  team_size?: number;
  sport_type?: string;
  goal_type?: string;
}

export interface UpdateChallengeProgressParams {
  challengeId: number;
  progress: number;
}

// ============================================================================
// Social - Events
// ============================================================================

export interface CreateEventParams {
  group_id?: number;
  title: string;
  description?: string;
  location?: string;
  event_date: string;
  end_date?: string;
  is_online?: boolean;
  max_attendees?: number;
}

// ============================================================================
// Social - Badges & XP
// ============================================================================

export interface CreateBadgeParams {
  name: string;
  description: string;
  icon?: string;
  xp_reward?: number;
  criteria?: string;
}

// ============================================================================
// Explore - Segments
// ============================================================================

export interface CreateSegmentParams {
  name: string;
  description?: string;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  distance: number;
  elevation_gain?: number;
  elevation_loss?: number;
  avg_grade?: number;
  max_grade?: number;
  polyline?: string;
  activity_type?: string;
}

export interface GetNearbySegmentsParams {
  lat: number;
  lng: number;
  radius?: number;
  type?: string;
}

export interface CreateSegmentEffortParams {
  segmentId: number;
  data: {
    activity_id: number;
    elapsed_time: number;
    moving_time?: number;
    start_date: string;
    avg_watts?: number;
    max_watts?: number;
    avg_heartrate?: number;
    max_heartrate?: number;
  };
}

// ============================================================================
// Explore - Routes
// ============================================================================

export interface CreateRouteParams {
  name: string;
  description?: string;
  distance: number;
  elevation_gain?: number;
  elevation_loss?: number;
  polyline: string;
  activity_type?: string;
  estimated_duration?: number;
  difficulty?: string;
  tags?: string[];
  is_public?: boolean;
}

export interface GetPublicRoutesParams {
  type?: string;
  difficulty?: string;
}

// ============================================================================
// Explore - Heatmap
// ============================================================================

export interface GetHeatmapParams {
  lat: number;
  lng: number;
  radius?: number;
  type?: string;
}

export interface GetPopularLocationsParams {
  type?: string;
  limit?: number;
}

// ============================================================================
// Activity Photos
// ============================================================================

export interface AddActivityPhotoParams {
  activityId: number;
  data: {
    url: string;
    caption?: string;
    lat?: number;
    lng?: number;
  };
}

// ============================================================================
// TSS / Overtraining
// ============================================================================

export interface CalculateTSSParams {
  durationSeconds: number;
  avgHR: number;
  thresholdHR: number;
  maxHR?: number;
  restingHR?: number;
  sex?: 'M' | 'F';
}

// ============================================================================
// Preferences & Onboarding
// ============================================================================

export interface UpdatePreferencesParams {
  dashboard_widgets?: unknown[];
  notification_settings?: Record<string, unknown>;
  theme?: string;
  units?: string;
  density?: 'compact' | 'normal' | 'comfortable';
  language?: string;
}

export interface CompleteOnboardingStepParams {
  step: string;
}

// ============================================================================
// Manual Activity
// ============================================================================

export interface AddManualActivityParams {
  name: string;
  type: string;
  date: string;
  distance: number;
  duration: number;
  avg_hr?: number;
  max_hr?: number;
  elevation?: number;
  calories?: number;
}

// ============================================================================
// Connection Services
// ============================================================================

export interface ConnectServiceParams {
  email: string;
  password: string;
}

// ============================================================================
// Comments & Reactions
// ============================================================================

export interface AddCommentParams {
  activityId: number;
  content: string;
}

export interface AddReactionParams {
  activityId: number;
  reactionType: string;
}

export interface RemoveReactionParams {
  activityId: number;
  reactionType: string;
}

// ============================================================================
// Notifications Pagination
// ============================================================================

export interface PaginationParams {
  limit?: number;
  offset?: number;
}
