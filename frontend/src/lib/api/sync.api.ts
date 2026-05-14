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
  startSync(): Promise<{ jobId: string; status: string; message: string }> {
    return client.request('/api/sync', { method: 'POST' });
  },

  getSyncJob(jobId: string): Promise<SyncJob> {
    return client.request(`/api/sync/job/${jobId}`);
  },

  async sync(
    onProgress?: (_job: SyncJob) => void,
    intervalMs = 5000,
    timeoutMs = 5 * 60 * 1000
  ): Promise<SyncResult> {
    const { jobId } = await syncApi.startSync();

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

  getSyncStatus(): Promise<SyncStatus> {
    return client.request('/api/sync/status');
  },


};
