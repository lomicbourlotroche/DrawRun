import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '@/lib/api';
import type { SyncResult } from '@/lib/api';
import { useSyncStore } from '@/stores';

// Mock the lib/api module
vi.mock('@/lib/api', () => ({
  api: {
    sync: vi.fn(),
    getSyncStatus: vi.fn(),
    isAuthenticated: vi.fn(),
    setToken: vi.fn(),
    setRefreshToken: vi.fn(),
    getRefreshToken: vi.fn(),
    getToken: vi.fn(),
    clearToken: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
      this.name = 'ApiError';
    }
  },
}));

describe('Sync Store — Garmin-only', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset store
    useSyncStore.setState({
      status: null,
      isSyncing: false,
      lastError: null,
      needsSync: true,
    });

    // Mock isAuthenticated to return true by default
    vi.mocked(api.isAuthenticated).mockReturnValue(true);
  });

  describe('fetchStatus', () => {
    it('computes needsSync from garmin_last_sync only', async () => {
      const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
      vi.mocked(api.getSyncStatus).mockResolvedValue({
        garmin: {
          source: 'garmin',
          status: 'idle',
          last_sync: yesterday,
          configured: true,
        },
        garmin_status: 'idle',
        garmin_last_sync: yesterday,
      });

      await useSyncStore.getState().fetchStatus();

      const state = useSyncStore.getState();
      expect(state.status?.garmin?.configured).toBe(true);
      expect(state.needsSync).toBe(true); // > 24h
    });

    it('sets needsSync = false when garmin synced recently', async () => {
      const now = new Date().toISOString();
      vi.mocked(api.getSyncStatus).mockResolvedValue({
        garmin: {
          source: 'garmin',
          status: 'idle',
          last_sync: now,
          configured: true,
        },
        garmin_status: 'idle',
        garmin_last_sync: now,
      });

      await useSyncStore.getState().fetchStatus();

      expect(useSyncStore.getState().needsSync).toBe(false);
    });

    it('sets needsSync = true when garmin status is error', async () => {
      vi.mocked(api.getSyncStatus).mockResolvedValue({
        garmin: {
          source: 'garmin',
          status: 'error',
          last_sync: new Date().toISOString(),
          configured: true,
        },
        garmin_status: 'error',
        garmin_last_sync: new Date().toISOString(),
      });

      await useSyncStore.getState().fetchStatus();

      expect(useSyncStore.getState().needsSync).toBe(true);
    });

    it('does not reference strava or suunto fields', async () => {
      const statusResponse: import('@/lib/api').SyncStatus = {
        garmin: {
          source: 'garmin',
          status: 'idle',
          last_sync: null,
          configured: false,
        },
        garmin_status: 'idle',
        garmin_last_sync: null,
      };

      // These fields should be absent — verify our type doesn't include them
      vi.mocked(api.getSyncStatus).mockResolvedValue(statusResponse);

      await useSyncStore.getState().fetchStatus();

      const state = useSyncStore.getState();
      const status = state.status as Record<string, unknown>;
      expect(status.strava).toBeUndefined();
      expect(status.suunto).toBeUndefined();
      expect(status.decathlon).toBeUndefined();
    });
  });

  describe('sync', () => {
    it('calls api.sync without source parameter', async () => {
      vi.mocked(api.sync).mockResolvedValue({
        garmin: { imported: 5 },
      });

      await useSyncStore.getState().sync();

      expect(api.sync).toHaveBeenCalledOnce();
      // Should NOT pass source parameter
      const callArgs = vi.mocked(api.sync).mock.calls[0];
      expect(callArgs).toHaveLength(1); // only onProgress callback
    });

    it('handles garmin result correctly', async () => {
      vi.mocked(api.sync).mockResolvedValue({
        garmin: { imported: 3 },
      });

      const result = await useSyncStore.getState().sync();

      expect(result.success).toBe(true);
      expect(result.message).toContain('Garmin');
      expect(result.message).toContain('3');
    });

    it('handles garmin error correctly', async () => {
      vi.mocked(api.sync).mockResolvedValue({
        garmin: { error: 'Garmin rate limited' },
      });

      const result = await useSyncStore.getState().sync();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Garmin');
      expect(useSyncStore.getState().lastError).toBe('Garmin rate limited');
    });

    it('shows disconnected message when no garmin result', async () => {
      vi.mocked(api.sync).mockResolvedValue({});

      const result = await useSyncStore.getState().sync();

      expect(result.message).toContain('Aucun service connecté');
    });

    it('sets isSyncing state during sync', async () => {
      let resolvePromise!: (_value: SyncResult | PromiseLike<SyncResult>) => void;
      vi.mocked(api.sync).mockReturnValue(
        new Promise<SyncResult>((resolve) => {
          resolvePromise = resolve;
        }),
      );

      const syncPromise = useSyncStore.getState().sync();

      expect(useSyncStore.getState().isSyncing).toBe(true);

      resolvePromise({ garmin: { imported: 1 } });
      await syncPromise;

      expect(useSyncStore.getState().isSyncing).toBe(false);
    });
  });
});
