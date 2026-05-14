import { describe, it, expect, vi, beforeEach } from 'vitest';
import { racePlanningApi } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';

vi.mock('@/stores', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({ logout: vi.fn() })),
  },
}));

describe('racePlanningApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn();
  });

  const mockFetchSuccess = (data: unknown) => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
    });
  };

  describe('calculateRacePlan', () => {
    it('should call POST /api/race-planning/calculate with params', async () => {
      mockFetchSuccess({ splits: [{ km: 1 }], summary: { distance: 10 } });
      const result = await racePlanningApi.calculateRacePlan({ distance: 10 });
      expect(result.splits).toHaveLength(1);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining(API_ENDPOINTS.racePlanning.calculate),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('saveRacePlan', () => {
    it('should call POST /api/race-planning/save', async () => {
      mockFetchSuccess({ success: true, message: 'Saved' });
      const result = await racePlanningApi.saveRacePlan({
        distance: 10,
        targetPace: 270,
        splits: [{ km: 1 }],
      });
      expect(result.success).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining(API_ENDPOINTS.racePlanning.save),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('listRacePlans', () => {
    it('should call GET /api/race-planning/list', async () => {
      mockFetchSuccess([{ id: 1, distance: 10 }]);
      const result = await racePlanningApi.listRacePlans();
      expect(result).toHaveLength(1);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining(API_ENDPOINTS.racePlanning.list),
        expect.any(Object),
      );
    });
  });

  describe('deleteRacePlan', () => {
    it('should call DELETE /api/race-planning/:id', async () => {
      mockFetchSuccess({ success: true });
      const result = await racePlanningApi.deleteRacePlan(5);
      expect(result.success).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining(API_ENDPOINTS.racePlanning.delete(5)),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('calculateRaceStrategy', () => {
    it('should call POST /api/race-planning/race-strategy', async () => {
      mockFetchSuccess({ segments: [], summary: {} });
      const result = await racePlanningApi.calculateRaceStrategy({
        gpxData: '<gpx>...</gpx>',
        params: { temp: 15, humidity: 50 },
      });
      expect(result.segments).toBeDefined();
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining(API_ENDPOINTS.racePlanning.strategy),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('format helpers', () => {
    it('should format time with hours', () => {
      expect(racePlanningApi.formatTime(3661)).toBe('1:01:01');
    });
    it('should format time without hours', () => {
      expect(racePlanningApi.formatTime(125)).toBe('2:05');
    });
    it('should format pace', () => {
      expect(racePlanningApi.formatPace(270)).toBe('4:30/km');
    });
    it('should export to CSV and download', () => {
      const splits = [
        { km: 1, distance: 1, splitTime: 270, cumulativeTime: 270, pace: 270, hrZone: 'Z3', hrRange: '140-150', nutrition: [] },
      ];
      const csv = racePlanningApi.exportToCsv(splits);
      expect(csv).toContain('KM');
      expect(csv).toContain('1');
    });
  });
});
