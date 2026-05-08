/**
 * ============================================================
 * ACTIVITIES API - Endpoints activités sportives
 * ============================================================
 * 
 * Ce fichier contient tous les endpoints liés aux activités :
 * - CRUD activités
 * - Streams et splits
   * - Import GPX
 * - Analyses
 * 
 * @module lib/api/activities.api
 */

import { client } from './client';
import type { Activity, ActivityDetail, ActivityStreams, SplitData, SplitSummary } from '@/types';
import type { AddManualActivityParams } from './types';

export const activitiesApi = {
  /**
   * Liste toutes les activités
   */
  async   getActivities(page = 1, perPage = 20): Promise<{ data: Activity[]; pagination: { page: number; per_page: number; total: number; total_pages: number; has_next: boolean; has_prev: boolean } }> {
    return client.request<{ data: Activity[]; pagination: { page: number; per_page: number; total: number; total_pages: number; has_next: boolean; has_prev: boolean } }>(`/api/activities?page=${page}&per_page=${perPage}`);
  },

  /**
   * Récupère le détail d'une activité
   */
  getActivity(id: number): Promise<ActivityDetail> {
    return client.request(`/api/activities/${id}`);
  },

  /**
   * Récupère les streams (données temps réel) d'une activité
   */
  getActivityStreams(id: number): Promise<ActivityStreams> {
    return client.request(`/api/activities/${id}/streams`);
  },

  /**
   * Récupère les splits d'une activité
   */
  getActivitySplits(id: number, unit: 'km' | 'mi' = 'km'): Promise<{ splits: SplitData[]; summary: SplitSummary }> {
    return client.request(`/api/activities/${id}/splits?unit=${unit}`);
  },

  /**
   * Récupère l'analyse d'une activité
   */
  getActivityAnalysis(id: number): Promise<Record<string, number | null>> {
    return client.request(`/api/activities/${id}/analysis`);
  },

  /**
   * Crée une nouvelle activité
   */
  createActivity(activity: Partial<Activity>): Promise<Activity> {
    return client.request('/api/activities/create', {
      method: 'POST',
      body: JSON.stringify(activity),
    });
  },

  /**
   * Ajoute une activité manuelle
   */
  addManualActivity(data: AddManualActivityParams): Promise<{ success: boolean; id: number }> {
    return client.request('/api/activities/create', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        type: data.type,
        start_date: data.date,
        distance: data.distance,
        moving_time: data.duration,
        avg_hr: data.avg_hr,
        max_hr: data.max_hr,
        total_elevation_gain: data.elevation,
        calories: data.calories,
      }),
    });
  },

  /**
   * Importe un fichier GPX
   */
  importGpx(name: string, gpxData: string, type = 'run'): Promise<{ 
    success: boolean; 
    id: number; 
    distance: number; 
    duration: number; 
    trackpoints: number 
  }> {
    return client.request('/api/activities/import/gpx', {
      method: 'POST',
      body: JSON.stringify({ name, gpxData, type }),
    });
  },
};
