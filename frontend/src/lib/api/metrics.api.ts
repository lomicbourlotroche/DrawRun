/**
 * ============================================================
 * METRICS API - Endpoints métriques et performances
 * ============================================================
 *
 * Ce fichier contient tous les endpoints de métriques :
 * - Recalcul des métriques
 * - Récupération des métriques
 * - Overtraining check
 * - TSS
 *
 * @module lib/api/metrics.api
 */

import { client } from './client';
import type { PmcDataPoint } from '@/types';
import type { CalculateTSSParams } from './types';

export const metricsApi = {
  /**
   * Recalcule toutes les métriques
   */
  recalculateMetrics(): Promise<{
    success: boolean;
    calculated: number;
    vdot?: number;
    message?: string
  }> {
    return client.request('/api/metrics/recalculate', { method: 'POST' });
  },

  /**
   * Récupère les métriques actuelles
   */
  getMetrics(): Promise<{
    ctl: number | null;
    atl: number | null;
    tsb: number | null;
    acwr: number | null;
    vdot: number | null;
    hrZones: unknown[] | null;
    weeklyDistance: number | null;
    weeklyTime: number | null;
    weeklyActivities: number | null;
    pmcData: unknown[] | null;
  }> {
    return client.request('/api/metrics');
  },

  /**
   * Récupère les données PMC
   */
  getPmc(): Promise<PmcDataPoint[]> {
    return client.request('/api/pmc');
  },

  /**
   * Vérifie le risque de surmenage
   */
  checkOvertraining(): Promise<{
    risk: string;
    acwr: number | null;
    ctl: number;
    atl: number;
    tsb: number;
    message: string;
    recommendation?: string;
  }> {
    return client.request('/api/algo/overtraining');
  },

  /**
   * Calcule le TSS (Training Stress Score)
   */
  calculateTSS(params: CalculateTSSParams): Promise<{
    tss: number | null;
    trimp: number | null;
    durationHours: number;
    intensityFactor: number | null;
  }> {
    const query = new URLSearchParams();
    query.set('duration', String(params.durationSeconds / 60)); // Convert to minutes
    if (params.avgHR) query.set('avgHR', String(params.avgHR));
    if (params.thresholdHR) query.set('thresholdHR', String(params.thresholdHR));
    if (params.maxHR) query.set('maxHR', String(params.maxHR));
    return client.request(`/api/algo/tss?${query.toString()}`);
  },

  /**
   * Enregistre le HRV
   */
  logHrv(value: number, date?: string): Promise<{ success: boolean; message: string }> {
    return client.post('/api/metrics/hrv', { value, date });
  },

  /**
   * Enregistre le sommeil
   */
  logSleep(value: number, date?: string): Promise<{ success: boolean; message: string }> {
    return client.post('/api/metrics/sleep', { value, date });
  },
};
