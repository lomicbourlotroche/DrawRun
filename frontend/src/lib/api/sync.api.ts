/**
 * ============================================================
 * SYNC API - Endpoints de synchronisation
 * ============================================================
 * 
 * Ce fichier contient tous les endpoints liés à la synchro :
 * - Sync Strava/Garmin/Suunto
 * - Status de sync
 * - Health Connect
 * 
 * @module lib/api/sync.api
 */

import { client } from './client';
import type { SyncResult, SyncStatus } from './types';

export const syncApi = {
  /**
   * Déclenche la synchronisation
   */
  sync(): Promise<SyncResult> {
    return client.request('/api/sync', { method: 'POST' });
  },

  /**
   * Récupère le statut de synchronisation
   */
  getSyncStatus(): Promise<SyncStatus> {
    return client.request('/api/sync/status');
  },

  /**
   * Récupère l'URL d'autorisation Strava
   */
  getStravaUrl(): Promise<{ url: string }> {
    return client.request('/api/strava/url');
  },

  /**
   * Upload d'activités Health Connect
   */
  uploadHealthConnectActivities(activities: unknown[]): Promise<{ success: boolean; imported: number }> {
    return client.request('/api/sync/healthconnect', {
      method: 'POST',
      body: JSON.stringify(activities),
    });
  },
};
