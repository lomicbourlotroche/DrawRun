/**
 * ============================================================
 * TYPES TYPESCRIPT - Définitions de types pour DrawRun
 * ============================================================
 * 
 * Ce fichier contient toutes les définitions de types
 * TypeScript utilisées par l'application frontend.
 * 
 * === TYPES DÉFINIS ===
 * - User              : Utilisateur (id, email, name, fcm, vma, vdot...)
 * - Activity          : Activité sportive (id, name, distance, durée...)
 * - ActivityDetail    : Détail d'une activité avec toutes les métriques
 * - ActivityStreams  : Données temps réel (GPS, FC, vitesse...)
 * - Zones            : Zones d'entraînement (FC, allure)
 * - PmcDataPoint     : Point de données PMC (ctl, atl, tsb)
 * - Recommendation     : Recommandation d'entraînement
 * - AthleteStats    : Statistiques de l'athlète
 * 
 * @module types/index
 */

import type { SportType } from './sports';

export type { SportType } from './sports';
export { SPORTS, getSportCategory, isEnduranceSport, isCyclingSport, isRunningSport, isSwimmingSport, isWinterSport } from './sports';

export interface User {
  id: number | string;
  email: string;
  name: string;
  fcm?: number | null;
  vma?: number | null;
  vdot?: number | null;
  ftp?: number | null;
  weight?: number | null;
  has_strava?: number | boolean;
  has_garmin?: number | boolean;
  has_suunto?: number | boolean;
  twofa_enabled?: number | boolean;
  createdAt?: string;
  dateOfBirth?: string;
  sex?: 'M' | 'F';
  restingHR?: number | null;
}

export interface Activity {
  id: number;
  title: string;
  type: SportType;
  date: string;
  dist: string;
  pace: string;
  duration: string;
  distance: number;
  avgSpeed: number;
  avgHR: number;
  moving_time?: number;
  elapsed_time?: number;
  total_elevation_gain?: number;
  description?: string;
  start_date?: string;
  tss?: number;
  user_id?: number;
  draw_count?: number;
  has_drawn?: boolean;
}

export interface ActivityDetail extends Omit<Activity, 'type'> {
  name: string;
  type: string;
  source?: string;
  start_date: string;
  start_date_local: string;
  timezone: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_speed: number;
  max_speed: number;
  average_heartrate: number;
  max_heartrate: number;
  start_latlng?: [number, number];
  map_polyline?: string | null;
  average_cadence?: number;
  average_watts?: number;
  weighted_average_watts?: number;
  max_watts?: number;
  average_temp?: number;
  description?: string;
  tss?: number;
  calories?: number;
  intensity?: number;
  ifFactor?: number;
  ef?: number;
  vi?: number;
  ie?: number;
  trimp?: number;
  pwHr?: number;
  np?: number;
  ngp?: number;
  vam?: number;
  cadence?: number;
  strideLength?: number;
  groundContact?: number;
  verticalOsc?: number;
  swolf?: number;
  strokeRate?: number;
  dps?: number;
}

export interface ActivityStreams {
  time?: number[] | { data: number[] };
  distance?: number[] | { data: number[] };
  altitude?: number[] | { data: number[] };
  heartrate?: number[] | { data: number[] };
  velocity_smooth?: number[] | { data: number[] };
  cadence?: number[] | { data: number[] };
  watts?: number[] | { data: number[] };
  latlng?: [number, number][] | { data: [number, number][] };
}

export interface SplitData {
  split: number;
  distance: number;
  duration: number;
  pace: number | null;
  speed: number;
  avgHR: number | null;
  maxHR: number | null;
  elevationChange: number;
  gradient: number;
  avgCadence: number | null;
  avgWatts: number | null;
  cumulativeTime: number;
  isPartial?: boolean;
}

export interface SplitSummary {
  totalDistance: number;
  totalTime: number;
  averagePace: number | null;
  averageSpeed: number | null;
  totalElevation: number;
  elevationGain: number;
  elevationLoss: number;
  averageHR: number | null;
  maxHR: number | null;
  averageCadence: number | null;
  averageWatts: number | null;
  unit: string;
}

export interface Zone {
  zone: number;
  name: string;
  min: number;
  max: number;
  description?: string;
  intensity?: string;
}

export interface HRZone extends Zone {
  minHR: number;
  maxHR: number;
}

export interface SpeedZone extends Zone {
  minPace: string;
  maxPace: string;
  description?: string;
}

export interface TrainingPace {
  E: { min: string; max: string };
  M: string;
  T: string;
  I: string;
  R: string;
}

export interface Zones {
  hrZones: HRZone[];
  speedZones: SpeedZone[];
  trainingPaces?: TrainingPace;
  fcm: number;
  vma: number;
  vdot: number;
  age?: number;
  sex?: string;
  method?: string;
}

export interface PmcDataPoint {
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
}

export interface RecommendationHistory {
  weeklyLoad: number;
  chronicLoad: number;
  acwr: number;
  readiness: number;
  daysSinceLongRun: number;
  daysSinceInterval: number;
  currentStreak: number;
  polarizationIndex: number;
}

export interface PerformancePredictions {
  marathon: string;
  halfMarathon: string;
  level: {
    level: string;
    color: string;
  };
}

export interface Recommendation {
  type: string;
  intensity: string;
  intensityColor: string;
  title: string;
  subtitle: string;
  description: string;
  advice: string;
  structure: string[];
  physiologicalGain?: string;
  metrics?: {
    readiness: number;
    acwr: number;
    polarizationIndex: number;
    monotony: number;
    weeklyKm?: number;
    vdot?: number;
    streak?: number;
    activitiesCount?: number;
  };
  history?: RecommendationHistory;
  performancePredictions?: PerformancePredictions;
  isFromPlan?: boolean;
  targetPace?: string;
  reasoning?: string;
}

export interface Readiness {
  score: number;
  factors: {
    hrv: number;
    sleep: number;
    restingHR: number;
    stress: number;
  };
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface TrainingPlan {
  id: string;
  name: string;
  target: string;
  durationWeeks: number;
  currentWeek: number;
  startDate: string;
  endDate: string;
  weeks: TrainingWeek[];
}

export interface TrainingWeek {
  week: number;
  phase: string;
  sessions: TrainingSession[];
}

export interface TrainingSession {
  id: string;
  day: number;
  type: string;
  title: string;
  description: string;
  completed: boolean;
  steps: WorkoutStep[];
}

export interface WorkoutStep {
  id: string;
  type: 'warmup' | 'work' | 'rest' | 'recovery' | 'cooldown' | 'interval';
  duration: string;
  targetType: 'pace' | 'hr' | 'power' | 'none';
  targetValue?: string;
  description: string;
}

export interface CustomWorkout {
  id: string;
  name: string;
  sport: 'run' | 'bike' | 'swim';
  steps: WorkoutStep[];
  createdAt: string;
}

export interface AthleteStats {
  runCount: number;
  runDistance: number;
  runElevation: number;
  bikeCount: number;
  bikeDistance: number;
  bikeElevation: number;
  swimCount: number;
  swimDistance: number;
}

export interface PerformanceMetrics {
  sport: 'run' | 'bike' | 'swim';
  vma?: number;
  vdot?: number;
  vo2max?: number;
  endurance?: number;
  ftp?: number;
  wkg?: number;
  css?: number;
  vo2aqua?: number;
  records?: {
    km1?: number;
    km5?: number;
    km10?: number;
    semi?: number;
    marathon?: number;
  };
}

// ============================================================
// Coach Interfaces
// ============================================================

export interface CoachProfile {
  [key: string]: unknown;
}

export interface AdaptivePlanResult {
  success: boolean;
  planId: number;
  message: string;
  initialSessions: TrainingSession[];
  scheduleVmaTest: boolean;
  vmaEstimate: number;
  paces: Record<string, string>;
  nextSteps: string[];
}

export interface PlanFeedbackResult {
  success: boolean;
  message: string;
  adjustedSessions: TrainingSession[];
  planProgress: {
    currentWeek: number;
    totalWeeks: number;
    currentSession: number;
    sessionsPerWeek: number;
  };
}

export interface PlanDetail {
  plan: TrainingPlan | null;
  planData: Record<string, unknown> | null;
  sessions: TrainingSession[];
  currentWeek: number;
  currentSession: number;
}

export interface MissedSessionResult {
  success: boolean;
  message: string;
  adjustedPlan: Record<string, unknown> | null;
  recommendation: string;
}

export interface PlanProgress {
  planId: number;
  totalSessions: number;
  completedSessions: number;
  missedSessions: number;
  currentStreak: number;
  longestStreak: number;
  weeklyVolume: { week: number; volume: number }[];
  intensityDistribution: { low: number; moderate: number; high: number };
  averageRpe: number;
  completionRate: number;
  phaseProgress: { phase: string; progress: number }[];
}

export interface ScheduleTestResult {
  success: boolean;
  testId: number;
  message: string;
  testProtocol: { name: string; description: string; steps: string[] };
}

export interface SubmitTestResult {
  success: boolean;
  message: string;
  newVma?: number;
  newVdot?: number;
  updatedPaces: Record<string, string>;
  progress: { previous: Record<string, unknown>; current: Record<string, unknown>; improvement: string };
}

export interface ExternalEventResult {
  success: boolean;
  message: string;
  affectedSessions: number[];
  planAdjustments: string[];
}

export interface GamificationData {
  planId: number;
  badges: { id: string; name: string; description: string; icon: string; earnedAt?: string }[];
  streaks: { current: number; longest: number; lastActiveDate: string };
  achievements: { id: string; name: string; progress: number; target: number; unlocked: boolean }[];
  level: { current: number; xp: number; xpToNext: number; title: string };
  stats: { totalKm: number; totalHours: number; totalSessions: number };
}

export interface MatchActivityResult {
  success: boolean;
  message: string;
  integrated: boolean;
  session?: { id: number; title: string; type: string; week: number; day: number };
  estimatedRpe?: number;
}

export interface PendingSessions {
  plan: { id: number; name: string; target_distance: number; weeks: number } | null;
  sessions: TrainingSession[];
  recentActivities: Activity[];
}

// ============================================================
// Social Interfaces
// ============================================================

export interface Friend {
  id: number;
  email: string;
  name: string;
  avatar_url?: string;
  status?: string;
  [key: string]: unknown;
}

export interface FriendRequest {
  id: number;
  userId: number;
  email: string;
  name: string;
  createdAt: string;
  [key: string]: unknown;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  isPrivate?: boolean;
  memberCount?: number;
  inviteCode?: string;
  [key: string]: unknown;
}

export interface GroupMember {
  id: number;
  userId: number;
  name: string;
  email: string;
  role?: string;
  joinedAt?: string;
  [key: string]: unknown;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  name: string;
  value: number;
  unit?: string;
  [key: string]: unknown;
}

export interface ActivityLike {
  id: number;
  userId: number;
  activityId: number;
  createdAt: string;
  [key: string]: unknown;
}

export interface SocialFeedItem {
  id: number;
  type?: string;
  userId?: number;
  user_id?: number;
  activityId?: number;
  activity_id?: number;
  content?: string;
  createdAt?: string;
  created_at?: string;
  // Activity feed fields
  name?: string;
  distance?: number;
  moving_time?: number;
  start_date_local?: string;
  owner_name?: string;
  owner_id?: number;
  like_count?: number;
  user_liked?: boolean;
  draw_count?: number;
  comment_count?: number;
  photo_count?: number;
  [key: string]: unknown;
}

export interface UserSearchResult {
  id: number;
  email: string;
  name: string;
  avatar_url?: string;
  [key: string]: unknown;
}

export interface PublicProfile {
  user: UserSearchResult;
  stats: Record<string, unknown>[];
}

export interface Comment {
  id: number;
  activityId?: number;
  activity_id?: number;
  userId?: number;
  user_id?: number;
  content: string;
  createdAt?: string;
  created_at?: string;
  name?: string;
  email?: string;
  [key: string]: unknown;
}

export interface Reaction {
  id?: number;
  activityId?: number;
  activity_id?: number;
  userId?: number;
  user_id?: number;
  reactionType?: string;
  reaction_type?: string;
  count?: number;
  users?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface SocialNotification {
  id: number;
  type: 'friend_request' | 'challenge' | 'like' | 'message' | 'comment' | 'group_invite' | 'achievement' | string;
  message: string;
  unread: boolean;
  created_at: string;
  actor_id?: number;
  actor_name?: string;
  reference_id?: number;
  reference_type?: string;
  [key: string]: unknown;
}

// ============================================================================
// RACE PLANNING TYPES
// ============================================================================

export interface Split {
  km: number;
  distance: number;
  splitTime: number;
  cumulativeTime: number;
  pace: number;
  hrZone: string;
  hrRange: string;
  nutrition: Array<{
    type: 'water' | 'gel';
    label: string;
    quantity: string;
  }>;
}

export interface RacePrediction {
  vdot: number;
  predictions: Record<string, {
    distance: number;
    estimatedTime: number;
  }>;
}

export interface NutritionStop {
  km: number;
  type: 'water' | 'gel';
  label: string;
  quantity: string;
}

export interface NutritionStrategy {
  totalWater: number;
  totalGels: number;
  preRace: string;
  duringRace: string;
  postRace: string;
}

export interface RacePlanningRequest {
  distance: number;
  targetTime?: string;
  targetPace?: number;
  elevationProfile: 'flat' | 'rolling' | 'mountainous';
  fatigue?: number;
}

export interface RacePlanningResponse {
  splits: Split[];
  racePrediction: RacePrediction | null;
  nutritionStrategy: NutritionStrategy;
  warnings: Array<{
    type: 'fatigue' | 'freshness';
    message: string;
  }>;
  summary: {
    distance: number;
    targetPace: number;
    totalTime: number;
    elevationProfile: string;
    fcm: number;
  };
}

// ============================================================================
// WEATHER TYPES
// ============================================================================

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  weatherLabel: string;
  paceImpact: number;
  cached: boolean;
}
