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
  has_garmin?: number | boolean;
  has_decathlon?: number | boolean;
  has_suunto?: number | boolean;
  twofa_enabled?: number | boolean;
  createdAt?: string;
  dateOfBirth?: string;
  sex?: 'M' | 'F';
  restingHR?: number | null;
  weeklyKm?: number | null;
  goal?: string | null;
  profile_data?: Record<string, unknown>;
  auto_update?: boolean;
  avatar_url?: string;
}

export interface Activity {
  id: number;
  title: string;
  name?: string;
  type: SportType;
  date: string;
  dist: string;
  pace: string;
  duration: string;
  distance: number;
  avgSpeed: number;
  avgHR: number;
  average_heartrate?: number;
  moving_time?: number;
  elapsed_time?: number;
  total_elevation_gain?: number;
  description?: string;
  start_date?: string;
  tss?: number;
  gap?: string;
  efficiency_factor?: number;
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
  average_power?: number;
  weighted_average_watts?: number;
  max_watts?: number;
  average_temp?: number;
  description?: string;
  notes?: string;
  tss?: number;
  calories?: number;
  intensity?: number;
  ifFactor?: number;
  ef?: number;
  efficiency_factor?: number;
  gap?: string;
  vi?: number;
  ie?: number;
  trimp?: number;
  pwHr?: number;
  np?: number;
  normalized_power?: number;
  ngp?: number;
  normalized_speed?: number;
  variability_index?: number;
  vam?: number;
  cadence?: number;
  strideLength?: number;
  groundContact?: number;
  verticalOsc?: number;
  swolf?: number;
  strokeRate?: number;
  dps?: number;
  // Advanced metrics
  elev_high?: number | null;
  elev_low?: number | null;
  running_index?: number | null;
  hrv_rmssd?: number | null;
  is_race?: number | boolean;
  is_commute?: number | boolean;
  gear_id?: number | null;
  external_id?: string | null;
  device_name?: string | null;
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
  gap: number | null;
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

export interface SessionFeedback {
  rpe?: number;
  difficulty?: string;
  hasPain?: boolean;
  painLocation?: string;
  notes?: string;
}

export interface TrainingSession {
  id: string;
  day: number;
  type: string;
  title: string;
  description: string;
  completed: boolean;
  steps: WorkoutStep[];
  feedback?: SessionFeedback;
  result?: 'success' | 'failed' | 'partial' | 'skipped';
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

// ============================================================
// Sport-Specific Activity Analysis Types
// ============================================================

export interface HRZoneAnalysis {
  current: number;
  name: string;
  percent: number;
  avgHrPercent: number;
  maxHrPercent: number | null;
  hrReserve: number | null;
  fcm: number;
  restingHR: number;
}

export interface HRZoneDistribution {
  zone1Percent: number;
  zone2Percent: number;
  zone3Percent: number;
  zone4Percent: number;
  zone5Percent: number;
}

export interface PaceData {
  secPerKm: number;
  formatted: string;
  speedKmh: number;
}

export interface GapData {
  secPerKm: number;
  formatted: string;
}

export interface BiomechanicsMetrics {
  verticalOscillation: number;
  groundContactTime: number;
  stiffness: number;
  verticalRatio: number;
  stepLength: number;
  cadence: number;
  advice: Array<{ type: string; message: string; detail: string; priority: 'high' | 'moderate' | 'low' }>;
}

export interface TrainingPaces {
  E: { label: string; min: string; max: string; description: string };
  M: { label: string; pace: string; description: string };
  T: { label: string; pace: string; description: string };
  I: { label: string; pace: string; description: string };
  R: { label: string; pace: string; description: string };
}

export interface PerformanceLevel {
  level: string;
  color: string;
  percent: number;
  iaaPoints?: number;
}

export interface RacePredictions {
  '5k': number | null;
  '10k': number | null;
  half: { time: string } | null;
  marathon: { time: string } | null;
}

export interface PowerCurvePoint {
  duration: number;
  durationFormatted: string;
  power: number;
}

export interface SwimPace100m {
  seconds: number;
  formatted: string;
}

export interface CSSData {
  speedMs: number;
  pacePer100m: string;
  speedKmh: number;
}

export interface NutritionStrategy {
  hydration: { totalMl: number; perHourMl: number };
  carbs: { totalG: number; perHourG: number };
  sodium: { totalMg: number };
  recommendations: string[];
}

// ─── Sport-specific analysis responses ──────────────────────

export interface RunAnalysis {
  sportType: 'run';
  sportLabel: string;
  icon: string;
  analysisType: 'detailed';
  tss: number | null;
  trimp: number | null;
  intensityFactor: number | null;
  duration: number;
  durationFormatted: string;
  calories: number | null;

  hrZones: HRZoneAnalysis | null;
  hrDistribution: HRZoneDistribution | null;

  pace: PaceData | null;
  vdot: number | null;
  gap: GapData | null;
  efficiencyFactor: number | null;
  runningEconomy: number | null;

  biomechanics: BiomechanicsMetrics | null;
  trainingPaces: TrainingPaces | null;
  performanceLevel: PerformanceLevel | null;
  racePredictions: RacePredictions | null;

  estimatedGrade: number;
  nutrition: NutritionStrategy | null;

  // Backward compat
  avgHrPercent: number | null;
  profileFcm: number;
  estimatedVdot: number | null;
  paceFormatted: string | null;
  intensity_factor: number | null;
  efficiency_factor: number | null;
  gapFormatted: string | null;
}

export interface PowerZone {
  zone: number;
  name: string;
  percent: number;
}

export interface PowerEffort {
  duration: number;
  value: number;
}

export interface RideAnalysis {
  sportType: 'ride';
  sportLabel: string;
  icon: string;
  analysisType: 'detailed';
  tss: number | null;
  trimp: number | null;
  intensityFactor: number | null;
  duration: number;
  durationFormatted: string;
  calories: number | null;

  hrZones: HRZoneAnalysis | null;
  hrDistribution: HRZoneDistribution | null;

  speedKmh: number | null;
  pace: PaceData | null;

  normalizedPower: number | null;
  variabilityIndex: number | null;
  estimatedCP: number | null;
  estimatedWPrime: number | null;
  powerCurve: PowerCurvePoint[] | null;
  avgPower: number;
  maxPower: number | null;

  // Enhanced cycling metrics
  powerZoneDistribution: PowerZone[] | null;
  powerEfforts: PowerEffort[] | null;
  totalWorkKj: number | null;
  powerToWeight: number | null;
  tssPerHour: number | null;

  estimatedGrade: number;
  nutrition: NutritionStrategy | null;

  // Backward compat
  avgHrPercent: number | null;
  profileFcm: number;
  intensity_factor: number | null;
  paceFormatted: string | null;
}

export interface SwimAnalysis {
  sportType: 'swim';
  sportLabel: string;
  icon: string;
  analysisType: 'detailed';
  tss: number | null;
  trimp: number | null;
  intensityFactor: number | null;
  duration: number;
  durationFormatted: string;
  calories: number | null;

  hrZones: HRZoneAnalysis | null;
  hrDistribution: HRZoneDistribution | null;

  pacePer100m: SwimPace100m | null;
  swolf: number | null;
  strokeRate: number | null;
  dps: number | null;
  estimatedCSS: CSSData | null;

  estimatedGrade: number;
  nutrition: NutritionStrategy | null;

  // Backward compat
  avgHrPercent: number | null;
  profileFcm: number;
  intensity_factor: number | null;
  paceFormatted: string | null;
}

export interface TrailRunAnalysis extends Omit<RunAnalysis, 'sportType'> {
  sportType: 'trail';
  vam: number | null;
  technicalScore: string | null;
  elevationGain: number;
}

export interface SimpleAnalysis {
  sportType: 'walk' | 'hiit' | 'strength' | 'yoga' | 'general';
  sportLabel: string;
  icon: string;
  analysisType: 'simple';
  tss: number | null;
  trimp: number | null;
  intensityFactor: number | null;
  duration: number;
  durationFormatted: string;
  calories: number | null;
  hrZones: HRZoneAnalysis | null;
  pace: PaceData | null;
  estimatedGrade: number;
  nutrition: NutritionStrategy | null;

  // Backward compat
  avgHrPercent: number | null;
  profileFcm: number;
  intensity_factor: number | null;
  paceFormatted: string | null;
}

export type ActivityAnalysisResponse =
  | RunAnalysis
  | RideAnalysis
  | SwimAnalysis
  | TrailRunAnalysis
  | SimpleAnalysis;

export function isDetailedAnalysis(a: ActivityAnalysisResponse): a is RunAnalysis | RideAnalysis | SwimAnalysis | TrailRunAnalysis {
  return a.analysisType === 'detailed';
}

export function isRunAnalysis(a: ActivityAnalysisResponse): a is RunAnalysis {
  return a.sportType === 'run';
}

export function isRideAnalysis(a: ActivityAnalysisResponse): a is RideAnalysis {
  return a.sportType === 'ride';
}

export function isSwimAnalysis(a: ActivityAnalysisResponse): a is SwimAnalysis {
  return a.sportType === 'swim';
}

export function isTrailRunAnalysis(a: ActivityAnalysisResponse): a is TrailRunAnalysis {
  return a.sportType === 'trail';
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
  user: {
    id: number;
    email: string;
    name: string;
  };
  profile: {
    vdot?: number;
    vma?: number;
    fcm?: number;
    resting_hr?: number;
    age?: number;
    sex?: string;
    weight?: number;
    weeklyKm?: number | null;
    pace?: string | null;
  };
  activePlan: {
    plan: Record<string, unknown>;
    sessions: Record<string, unknown>[];
    planId: number;
  } | null;
  hasActivePlan: boolean;
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

export interface PendingSession {
  id: number;
  planId: number;
  weekNumber: number;
  dayNumber: number;
  title: string;
  type: string;
  scheduledDate: string | null;
}

export interface PendingSessions {
  plan: { id: number; name: string; target_distance: number; weeks: number } | null;
  sessions: PendingSession[];
  recentActivities: Activity[];
}

// ============================================================
// Social Interfaces
// ============================================================

export interface Friend {
  id: number;
  user_id?: number;
  friend_id?: number;
  email: string;
  name: string;
  avatar_url?: string;
  status?: string;
  created_at?: string;
  accepted_at?: string;
  [key: string]: unknown;
}

export interface FriendRequest {
  id: number;
  userId: number;
  user_id?: number;
  email: string;
  name: string;
  createdAt: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  isPrivate?: boolean;
  is_private?: boolean;
  memberCount?: number;
  member_count?: number;
  inviteCode?: string;
  invite_code?: string;
  creatorId?: number;
  creator_id?: number;
  creatorName?: string;
  creator_name?: string;
  role?: string;
  userRole?: string | null;
  user_role?: string | null;
  isMember?: boolean;
  is_member?: boolean;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface GroupDetail extends Group {
  memberCount: number;
  adminCount: number;
  userRole: string | null;
  isMember: boolean;
}

export interface GroupMember {
  id: number;
  userId: number;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
  joinedAt: string;
  groupId: number;
}

export interface GroupEvent {
  id: number;
  title: string;
  description?: string;
  location?: string;
  eventDate: string;
  endDate?: string;
  isOnline: boolean;
  maxAttendees?: number;
  groupId: number;
  createdBy: number;
  attendeeCount: number;
  userStatus?: string;
  createdAt: string;
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

export interface GroupUpdate {
  name?: string;
  description?: string;
  isPrivate?: boolean;
  regenerateInvite?: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  user_id?: number;
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
  memberSince?: string;
  member_since?: string;
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
  paceFactor?: number;
  hrZone: string;
  hrRange: string;
  cardiacDrift?: number;
  elevationFactor?: number;
  elevationGain?: number;
  elevationLoss?: number;
  grade?: number;
  nutrition: Array<{
    type: 'water' | 'gel' | 'sodium' | 'solid';
    label: string;
    quantity: string;
  }>;
}

export interface RacePrediction {
  vdot: number;
  dynamicVDOT?: number;
  models?: {
    riegelTime: number;
    mercierTime: number;
    cameronTime: number;
    weightedTime: number;
  };
  recommendedPace?: number;
  paceRange?: {
    optimistic: number;
    conservative: number;
  };
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

export interface NutritionMeal {
  timing: string;
  carbs: string;
  description: string;
}

export interface NutritionItem {
  timing: string;
  type: string;
  amount: string;
  description: string;
}

export interface PostRaceRecovery {
  carbs?: string;
  protein?: string;
  description: string;
}

export interface RaceNutritionStrategy {
  totalWater: number;
  totalGels: number;
  carbPerHour?: number;
  fluidMlPerHour?: number;
  sodiumPerHour?: number;
  totalCarbs?: number;
  totalFluid?: number;
  caffeineDose?: number;
  totalCalories?: number;
  totalLiquids?: number;
  perHour?: { calories: number; carbs: number; liquids: number };
  schedule?: Array<{ time: number; type: string; quantity: string; notes?: string }>;
  preRace: string | { meal: NutritionMeal; topUp: NutritionMeal };
  duringRace: string | NutritionItem[];
  postRace: string | { within30min: PostRaceRecovery; within2hours: PostRaceRecovery };
  references?: string[];
}

export interface RacePlanningRequest {
  distance?: number;       // Optionnel en mode GPX (auto-détecté)
  targetTime?: string;
  targetPace?: number;
  elevationProfile?: 'flat' | 'rolling' | 'mountainous'; // Auto-détecté en mode GPX
  fatigue?: number;        // Auto-détecté depuis TSB en mode GPX
  temperature?: number;
  humidity?: number;
  altitude?: number;
  windSpeed?: number;
  gpxData?: string;        // GPX XML brut pour auto-détection
  strategyBias?: number;   // -1 (negative split) to +1 (positive split)
}

export interface GpxProfile {
  elevGain: number;
  elevLoss: number;
  elevMin: number;
  elevMax: number;
  gainPerKm: number;
  terrainType: 'flat' | 'rolling' | 'mountainous';
  kmSegments: Array<{ km: number; distance: number; elevChange: number; grade: number; avgEle: number }>;
  totalDistM: number;
}

export interface RacePlanningResponse {
  splits: Split[];
  racePrediction: RacePrediction | null;
  nutritionStrategy: RaceNutritionStrategy;
  warnings: Array<{
    type: 'fatigue' | 'freshness' | 'injury_risk' | 'overtraining';
    severity: 'info' | 'moderate' | 'high' | 'critical';
    message: string;
  }>;
  taperRecommendation?: {
    plan: Array<{
      daysOut: number;
      volumePercent: number;
      targetLoad: number;
      intensity: number;
      frequency: number;
      sessionType: string;
      sessionDescription: string;
      isCompetition: boolean;
    }>;
    expectedGain: number;
    duration: number;
    volumeReduction: number;
    style: string;
    reference: string;
  };
  environmentalImpact?: {
    temperature: string;
    humidity: string;
    altitude: string;
    wind: string;
    overall: string;
  };
  pacingStrategy?: {
    type: string;
    name: string;
    description: string;
    phases?: Array<{ start: number; end: number; factor: number; label: string }>;
  };
  gpxProfile?: GpxProfile;  // NEW: auto-detected terrain info
  summary: {
    distance: number;
    targetPace: number;
    correctedPace?: number;
    totalTime: number;
    correctedTotalTime?: number;
    elevationProfile: string;
    elevationAutoDetected?: boolean;
    elevGain?: number | null;
    elevLoss?: number | null;
    gainPerKm?: number | null;
    fcm: number;
    vdot?: number;
    tsb?: number | null;
    ctl?: number | null;
    strategyBias?: number;
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
