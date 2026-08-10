/**
 * ============================================================
 * ALGO API - Endpoints algorithmes scientifiques
 * ============================================================
 *
 * Ce fichier contient tous les endpoints d'algorithmes :
 * - Zones d'entraînement
 * - VDOT, PMC, TSS
 * - Recommandations
 * - Readiness
 *
 * @module lib/api/algo.api
 */

import { client } from './client';
import type { Recommendation, HRZone } from '@/types';
import type {
  AlgoZonesParams,
  AlgoZonesResponse,
  AlgoVdotParams,
  AlgoVdotResponse,
  AlgoPmcParams,
  AlgoPmcResponse,
  AlgoRecommendationsParams,
  AlgoReadinessParams,
  AlgoReadinessResponse,
  AlgoTaperParams,
  AlgoOvertrainingParams,
  AlgoCriticalPowerParams,
  AlgoTSSParams,
  AlgoHealthParams,
} from './types';

export const algoApi = {
  /**
   * Calcule les zones d'entraînement
   */
  getZones(params?: AlgoZonesParams): Promise<AlgoZonesResponse> {
    const query = new URLSearchParams();
    if (params?.age) query.set('age', String(params.age));
    if (params?.fcm) query.set('fcm', String(params.fcm));
    if (params?.restingHR) query.set('restingHR', String(params.restingHR));
    if (params?.vma) query.set('vma', String(params.vma));
    if (params?.vdot) query.set('vdot', String(params.vdot));
    if (params?.sex) query.set('sex', params.sex);
    return client.request(`/api/algo/zones?${query.toString()}`);
  },

  /**
   * Calcule le VDOT
   */
  getVdot(params: AlgoVdotParams): Promise<AlgoVdotResponse> {
    const query = new URLSearchParams();
    if (params.distance) query.set('distance', String(params.distance));
    if (params.time) query.set('time', String(params.time));
    if (params.vdot) query.set('vdot', String(params.vdot));
    return client.request(`/api/algo/vdot?${query.toString()}`);
  },

  /**
   * Calcule le PMC (Performance Management Chart)
   */
  getPmc(activities: AlgoPmcParams['activities'], weeks = 12): Promise<AlgoPmcResponse> {
    const query = new URLSearchParams();
    query.set('activities', JSON.stringify(activities));
    query.set('weeks', String(weeks));
    return client.request(`/api/algo/pmc?${query.toString()}`);
  },

  /**
   * Récupère les recommandations d'entraînement
   */
  getRecommendations(params?: AlgoRecommendationsParams): Promise<Recommendation> {
    const query = new URLSearchParams();
    if (params?.profile) query.set('profile', JSON.stringify(params.profile));
    if (params?.history) query.set('history', JSON.stringify(params.history));
    if (params?.dayOfWeek !== undefined) query.set('dayOfWeek', String(params.dayOfWeek));
    return client.request(`/api/algo/recommendations?${query.toString()}`);
  },

  /**
   * Calcule le readiness score
   */
  getReadiness(params: AlgoReadinessParams): Promise<AlgoReadinessResponse> {
    const query = new URLSearchParams();
    if (params.pmc) query.set('pmc', JSON.stringify(params.pmc));
    if (params.hrv) query.set('hrv', String(params.hrv));
    if (params.sleep) query.set('sleep', String(params.sleep));
    return client.request(`/api/algo/readiness?${query.toString()}`);
  },

  /**
   * Calcule la polarisation
   */
  getPolarization(
    activities: Array<{ zonePercent?: { 1?: number; 2?: number; 3?: number; 4?: number; 5?: number } }>,
  ): Promise<{
    index: number;
    distribution: { low: number; moderate: number; high: number };
    classification: { type: string; label: string; optimal: boolean };
    recommendation: { type: string; message: string };
    target: { low: number; moderate: number; high: number };
  }> {
    return client.request(`/api/algo/polarization?activities=${encodeURIComponent(JSON.stringify(activities))}`);
  },

  /**
   * Analyse HRV
   */
  getHRV(params: { rmssd: number; baseline?: number; restingHR?: number }): Promise<{
    status: string;
    score: number;
    message: string;
    rmssd: number;
    baselineRmssd?: number;
    ratio: number;
    readiness: number;
    stressScore?: number;
  }> {
    const query = new URLSearchParams();
    query.set('rmssd', String(params.rmssd));
    if (params.baseline) query.set('baseline', String(params.baseline));
    if (params.restingHR) query.set('restingHR', String(params.restingHR));
    return client.request(`/api/algo/hrv?${query.toString()}`);
  },

  /**
   * Plan de taper
   */
  getTaper(params: AlgoTaperParams): Promise<{
    style: string;
    currentLoad: number;
    daysToCompetition: number;
    plan: Array<{
      daysOut: number;
      loadPercent: number;
      targetLoad: number;
      intensity: number;
      isCompetition: boolean;
    }>;
    summary: { startLoad: number; competitionLoad: number; reduction: string };
  }> {
    const query = new URLSearchParams();
    query.set('currentLoad', String(params.currentLoad));
    query.set('daysToCompetition', String(params.daysToCompetition));
    if (params.style) query.set('style', params.style);
    return client.request(`/api/algo/taper?${query.toString()}`);
  },

  /**
   * Détection surmenage
   */
  getOvertraining(indicators: AlgoOvertrainingParams): Promise<{
    status: string;
    riskScore: number;
    recommendation: string;
    factors: Array<{ factor: string; impact: number }>;
    scientificBasis: string;
  }> {
    return client.request(`/api/algo/overtraining?indicators=${encodeURIComponent(JSON.stringify(indicators))}`);
  },

  /**
   * Calcule Critical Power
   */
  getCriticalPower(efforts: AlgoCriticalPowerParams['efforts']): Promise<{
    CP: number;
    W_prime: number;
    CP_unit: string;
    W_prime_unit: string;
    ftp: { ftp: number; note: string };
  }> {
    return client.request(`/api/algo/critical-power?efforts=${encodeURIComponent(JSON.stringify(efforts))}`);
  },

  /**
   * Calcule TSS
   */
  getTSS(params: AlgoTSSParams): Promise<{
    tss: number | null;
    trimp: number | null;
    method: string | null;
    notes: { tss: string; trimp: string };
  }> {
    const query = new URLSearchParams();
    if (params.duration) query.set('duration', String(params.duration));
    if (params.intensityFactor) query.set('intensityFactor', String(params.intensityFactor));
    if (params.avgHR) query.set('avgHR', String(params.avgHR));
    if (params.maxHR) query.set('maxHR', String(params.maxHR));
    if (params.durationMin) query.set('durationMin', String(params.durationMin));
    if (params.sex) query.set('sex', params.sex);
    return client.request(`/api/algo/tss?${query.toString()}`);
  },

  /**
   * Health check complet
   */
  getHealth(params: AlgoHealthParams): Promise<{
    readiness: number;
    acwr: number;
    acwrStatus: { status: string; color: string; label: string; message: string; risk: string };
    pmc: { ctl: number; atl: number; tsb: number };
    hrv: { status: string; score: number; message: string } | null;
    zones: HRZone[];
    profile: { fcm: number; vma?: number; vdot?: number };
    recommendations: { trainingLoad: string; intensity: string };
  }> {
    const query = new URLSearchParams();
    if (params.profile) query.set('profile', JSON.stringify(params.profile));
    if (params.pmc) query.set('pmc', JSON.stringify(params.pmc));
    if (params.hrv) query.set('hrv', JSON.stringify(params.hrv));
    return client.request(`/api/algo/health?${query.toString()}`);
  },

  /**
   * Récupère les constantes algorithmiques
   */
  getConstants(): Promise<{
    zones: {
      heartRate: Array<{
        zone: number;
        name: string;
        minHR: number;
        maxHR: number;
        min: number;
        max: number;
      }>;
      speed: Array<{
        zone: number;
        name: string;
        minPace: string;
        maxPace: string;
        min: number;
        max: number;
      }>;
      power?: Array<{
        zone: number;
        name: string;
        minWatts: number;
        maxWatts: number;
        min: number;
        max: number;
      }>;
    };
    defaults: {
      fcm: number;
      restingHR: number;
      vma: number;
      vdot: number;
      sex: string;
      age: number;
    };
    trainingPaces: {
      E: { min: string; max: string };
      M: string;
      T: string;
      I: string;
      R: string;
    };
    version: string;
    lastUpdated: string;
  }> {
    return client.request('/api/algo/constants');
  },
};
