/**
 * ============================================================
 * RACE PLANNING API
 * ============================================================
 *
 * Outil de stratégie de course avec calcul des splits,
 * zones de fréquence cardiaque et stratégie de nutrition.
 *
 * @module lib/api/race-planning.api
 */

import { client } from './client';
import type { RacePlanningRequest, RacePlanningResponse, Split } from '@/types';

/**
 * Saved race plan data (as stored in DB and returned by list endpoint)
 */
export interface SavedRacePlan {
  id: number;
  user_id: number;
  name: string;
  distance: number;
  target_pace: number;
  total_time: number;
  elevation_profile?: string;
  fatigue: number;
  splits: Split[];
  nutrition_strategy: Record<string, unknown> | null;
  created_at: string;
}

/**
 * List race plans response from backend (paginated)
 */
export interface ListRacePlansResponse {
  plans: SavedRacePlan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Race strategy parameters
 */
export interface RaceStrategyParams {
  points?: Array<{ dist: number; elev: number; lat?: number; lon?: number }>;
  gpxData?: string;
  temp?: number;
  humidity?: number;
  goalTime?: number;
}

/**
 * Race strategy result
 */
export interface RaceStrategyResult {
  segments: Array<{
    km: number;
    distance: number;
    elevGain: number;
    elevLoss: number;
    grade: number;
    targetPaceSec: number;
    targetPace: string;
    cumulativeTime: number;
  }>;
  summary: {
    totalDistance: number;
    totalElevationGain: number;
    totalTimeSec: number;
    averagePace: string;
  };
  nutrition: Record<string, unknown>;
  taper: Record<string, unknown> | null;
}

/**
 * Save race plan payload
 */
export interface SaveRacePlanPayload {
  name?: string;
  distance: number;
  targetPace: number;
  totalTime?: number;
  elevationProfile?: string;
  fatigue?: number;
  splits: Split[];
  nutritionStrategy?: Record<string, unknown>;
}

/**
 * Calculate race plan with splits, HR zones and nutrition strategy
 */
async function calculateRacePlan(params: RacePlanningRequest): Promise<RacePlanningResponse> {
  return client.post<RacePlanningResponse>('/api/race-planning/calculate', params);
}

/**
 * Save a race plan to the user's database
 */
async function saveRacePlan(data: SaveRacePlanPayload): Promise<{ success: boolean; message: string }> {
  return client.post('/api/race-planning/save', data);
}

/**
 * List all saved race plans
 * Unwraps the paginated response to return the plans array.
 */
async function listRacePlans(page = 1, limit = 20): Promise<ListRacePlansResponse> {
  return client.get(`/api/race-planning/list?page=${page}&limit=${limit}`);
}

/**
 * Delete a saved race plan by id
 */
async function deleteRacePlan(id: number): Promise<{ success: boolean; message: string }> {
  return client.request(`/api/race-planning/${id}`, { method: 'DELETE' });
}

/**
 * Generate a pacing strategy from GPX points
 */
async function calculateRaceStrategy(params: RaceStrategyParams): Promise<RaceStrategyResult> {
  return client.post('/api/race-planning/race-strategy', params);
}

/**
 * Export race plan splits to CSV format
 */
function exportToCsv(splits: RacePlanningResponse['splits']): string {
  const headers = [
    'KM',
    'Distance (km)',
    'Temps (sec)',
    'Temps cumulé (sec)',
    'Allure (sec/km)',
    'Zone FC',
    'FC (bpm)',
    'Nutrition',
  ];

  const rows = splits.map((split) => [
    split.km,
    split.distance,
    split.splitTime,
    split.cumulativeTime,
    split.pace,
    split.hrZone,
    split.hrRange,
    (split.nutrition || []).map((n) => `${n.label} (${n.quantity})`).join(', ') || '-',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Download race plan as CSV file
 */
function downloadCsv(splits: RacePlanningResponse['splits'], filename = 'race-plan.csv'): void {
  const csv = exportToCsv(splits);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Format time in seconds to MM:SS or HH:MM:SS
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format pace in sec/km to MM:SS/km
 */
function formatPace(pace: number): string {
  if (!pace || pace <= 0) return '--:--';
  const mins = Math.floor(pace / 60);
  const secs = Math.round(pace % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}/km`;
}

export const racePlanningApi = {
  calculateRacePlan,
  saveRacePlan,
  listRacePlans,
  deleteRacePlan,
  calculateRaceStrategy,
  exportToCsv,
  downloadCsv,
  formatTime,
  formatPace,
};
