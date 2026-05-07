/**
 * ============================================================
 * COACH API - Endpoints coaching et plans d'entraînement
 * ============================================================
 * 
 * Ce fichier contient tous les endpoints liés au coaching :
 * - Génération et gestion de plans
 * - Feedback et sessions
 * - Tests VMA/VDOT
 * 
 * @module lib/api/coach.api
 */

import { client } from './client';
import type {
  AdaptivePlanResult,
  PlanFeedbackResult,
  PlanDetail,
  MissedSessionResult,
  SubmitTestResult,
  PendingSessions,
} from '@/types';
import type {
  StartAdaptivePlanParams,
  SubmitPlanFeedbackParams,
  ReportMissedSessionParams,
  ScheduleTestParams,
  SubmitTestResultsParams,
  AddExternalEventParams,
  MatchActivityToSessionParams,
} from './types';

export const coachApi = {
  /**
   * Récupère le plan actif de l'utilisateur
   */
  getActivePlan(): Promise<Record<string, unknown> | null> {
    return client.request('/api/coach/plan').catch(() => null) as Promise<Record<string, unknown> | null>;
  },

  /**
   * Récupère le profil coach
   */
  getCoachProfile(): Promise<Record<string, unknown>> {
    return client.request('/api/coach/profile');
  },

  /**
   * Génère un plan d'entraînement
   */
  generatePlan(params: { target: string; vdot: number; weeklyKm: number; includePPG?: boolean }): Promise<Record<string, unknown>> {
    return client.request('/api/coach/generate-plan', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Démarre un plan adaptatif
   */
  startAdaptivePlan(params: StartAdaptivePlanParams): Promise<AdaptivePlanResult> {
    return client.request('/api/coach/start-plan', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Soumet un feedback de session
   */
  submitPlanFeedback(params: SubmitPlanFeedbackParams): Promise<PlanFeedbackResult> {
    return client.request('/api/coach/plan-feedback', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Récupère un plan par ID
   */
  getPlan(planId: number): Promise<PlanDetail> {
    return client.request(`/api/coach/plan/${planId}`);
  },

  /**
   * Signale une session manquée
   */
  reportMissedSession(params: ReportMissedSessionParams): Promise<MissedSessionResult> {
    return client.request('/api/coach/session-missed', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Récupère la progression d'un plan
   */
  getPlanProgress(planId: number): Promise<{
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
  }> {
    return client.request(`/api/coach/progress/${planId}`);
  },

  /**
   * Programme un test
   */
  scheduleTest(params: ScheduleTestParams): Promise<{
    success: boolean;
    testId: number;
    message: string;
    testProtocol: { name: string; description: string; steps: string[] };
  }> {
    return client.request('/api/coach/schedule-test', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Soumet les résultats d'un test
   */
  submitTestResults(params: SubmitTestResultsParams): Promise<SubmitTestResult> {
    return client.request('/api/coach/submit-test-results', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Ajoute un événement externe
   */
  addExternalEvent(params: AddExternalEventParams): Promise<{
    success: boolean;
    message: string;
    affectedSessions: number[];
    planAdjustments: string[];
  }> {
    return client.request('/api/coach/external-event', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Récupère les données de gamification
   */
  getGamification(planId: number): Promise<{
    planId: number;
    badges: Array<{ id: string; name: string; description: string; icon: string; earnedAt?: string }>;
    streaks: { current: number; longest: number; lastActiveDate: string };
    achievements: Array<{ id: string; name: string; progress: number; target: number; unlocked: boolean }>;
    level: { current: number; xp: number; xpToNext: number; title: string };
    stats: { totalKm: number; totalHours: number; totalSessions: number };
  }> {
    return client.request(`/api/coach/gamification/${planId}`);
  },

  /**
   * Associe une activité à une session
   */
  matchActivityToSession(params: MatchActivityToSessionParams): Promise<{
    success: boolean;
    message: string;
    integrated: boolean;
    session?: { id: number; title: string; type: string; week: number; day: number };
    estimatedRpe?: number;
  }> {
    return client.request('/api/coach/match-activity', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Récupère les sessions en attente
   */
  getPendingSessions(): Promise<PendingSessions> {
    return client.request('/api/coach/pending-sessions');
  },

  /**
   * Calcule les valeurs par défaut du wizard depuis les activités passées
   */
  getWizardDefaults(): Promise<{
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
  }> {
    return client.request('/api/coach/wizard-defaults');
  },
};
