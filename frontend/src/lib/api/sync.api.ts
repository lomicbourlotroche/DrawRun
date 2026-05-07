/**
 * ============================================================
 * SYNC API - Endpoints de synchronisation
 * ============================================================
 *
 * Le sync est ASYNCHRONE côté backend :
 * - POST /api/sync → répond immédiatement avec { jobId }
 * - GET /api/sync/job/:id → polling jusqu'à status 'done' | 'error'
 *
 * @module lib/api/sync.api
 */

import { client } from './client';
import type { SyncResult, SyncStatus } from './types';

export interface SyncJob {
  jobId: string;
  status: 'running' | 'done' | 'error';
  source: string;
  result: SyncResult | null;
  error: string | null;
  startedAt: number;
  finishedAt: number | null;
  elapsedMs: number;
}

export const syncApi = {
  /**
   * Déclenche la synchronisation (retourne immédiatement un jobId).
   */
  startSync(source?: string): Promise<{ jobId: string; status: string; message: string }> {
    return client.request('/api/sync', {
      method: 'POST',
      body: JSON.stringify(source ? { source } : {}),
    });
  },

  /**
   * Récupère le statut d'un job de sync.
   */
  getSyncJob(jobId: string): Promise<SyncJob> {
    return client.request(`/api/sync/job/${jobId}`);
  },

  /**
   * Lance un sync et attend la fin via polling.
   * @param source - source à synchroniser ('garmin' | 'strava' | 'suunto' | 'decathlon' | undefined = all)
   * @param onProgress - callback appelé à chaque poll avec le job courant
   * @param intervalMs - intervalle de polling (défaut 3s)
   * @param timeoutMs - timeout total (défaut 5 min)
   */
  async sync(
    source?: string,
    onProgress?: (job: SyncJob) => void,
    intervalMs = 5000,
    timeoutMs = 5 * 60 * 1000
  ): Promise<SyncResult> {
    const { jobId } = await syncApi.startSync(source);

    const deadline = Date.now() + timeoutMs;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        if (Date.now() > deadline) {
          reject(new Error('Sync timeout — le sync tourne toujours en arrière-plan'));
          return;
        }

        try {
          const job = await syncApi.getSyncJob(jobId);
          onProgress?.(job);

          if (job.status === 'done') {
            resolve(job.result ?? {});
          } else if (job.status === 'error') {
            reject(new Error(job.error ?? 'Sync failed'));
          } else {
            setTimeout(poll, intervalMs);
          }
        } catch (err) {
          reject(err);
        }
      };

      setTimeout(poll, intervalMs);
    });
  },

  /**
   * Récupère le statut des intégrations configurées.
   */
  getSyncStatus(): Promise<SyncStatus> {
    return client.request('/api/sync/status');
  },

  /**
   * Récupère l'URL d'autorisation Strava.
   */
  getStravaUrl(): Promise<{ url: string }> {
    return client.request('/api/strava/url');
  },

  /**
   * Récupère l'URL d'autorisation Decathlon.
   */
  getDecathlonUrl(): Promise<{ url: string }> {
    return client.request('/api/sync/decathlon/url');
  },

  /**
   * Déconnecte Decathlon.
   */
  disconnectDecathlon(): Promise<{ success: boolean }> {
    return client.request('/api/sync/decathlon/disconnect', { method: 'POST' });
  },

  /**
   * Upload d'activités Health Connect.
   */
  uploadHealthConnectActivities(
    activities: unknown[]
  ): Promise<{ success: boolean; imported: number }> {
    return client.request('/api/sync/healthconnect', {
      method: 'POST',
      body: JSON.stringify(activities),
    });
  },
};
