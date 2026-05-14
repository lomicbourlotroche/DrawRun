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
import type { RacePlanningRequest, RacePlanningResponse } from '@/types';

/**
 * Calculate race plan with splits, HR zones and nutrition strategy
 */
async function calculateRacePlan(params: RacePlanningRequest): Promise<RacePlanningResponse> {
  return client.post<RacePlanningResponse>('/api/race-planning/calculate', params as unknown as Record<string, unknown>);
}

/**
 * Save a race plan to the user's database
 */
async function saveRacePlan(data: {
  name?: string;
  distance: number;
  targetPace: number;
  totalTime?: number;
  elevationProfile?: string;
  fatigue?: number;
  splits: unknown[];
  nutritionStrategy?: unknown;
}): Promise<{ success: boolean; message: string }> {
  return client.post('/api/race-planning/save', data as unknown as Record<string, unknown>);
}

/**
 * List all saved race plans
 */
async function listRacePlans(): Promise<Array<Record<string, unknown>>> {
  return client.get('/api/race-planning/list');
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
async function calculateRaceStrategy(params: {
  points?: Array<{ dist: number; elev: number }>;
  gpxData?: string;
  params: { temp?: number; humidity?: number; goalTime?: number };
}): Promise<Record<string, unknown>> {
  return client.post('/api/race-planning/race-strategy', params as unknown as Record<string, unknown>);
}

/**
 * Export race plan splits to CSV format
 * @param splits Array of splits from race plan
 * @returns CSV content string
 */
function exportToCsv(splits: RacePlanningResponse['splits']): string {
  const headers = ['KM', 'Distance (km)', 'Temps (sec)', 'Temps cumulé (sec)', 'Allure (sec/km)', 'Zone FC', 'FC (bpm)', 'Nutrition'];
  
  const rows = splits.map(split => [
    split.km,
    split.distance,
    split.splitTime,
    split.cumulativeTime,
    split.pace,
    split.hrZone,
    split.hrRange,
    split.nutrition.map(n => `${n.label} (${n.quantity})`).join(', ') || '-'
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Download race plan as CSV file
 * @param splits Array of splits
 * @param filename Optional filename (default: race-plan.csv)
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
 * @param seconds Time in seconds
 * @returns Formatted time string
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
 * @param pace Pace in seconds per km
 * @returns Formatted pace string
 */
function formatPace(pace: number): string {
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
