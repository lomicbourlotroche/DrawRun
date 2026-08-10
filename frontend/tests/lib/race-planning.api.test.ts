import { describe, it, expect, vi, beforeEach } from 'vitest';
import { racePlanningApi } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import type { RaceSplit, NutritionStrategy } from '@/lib/api/race-planning.api';

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

  const mockFetchError = (status = 400, error = { error: 'Bad request' }) => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status,
      json: () => Promise.resolve(error),
    });
  };

  describe('calculateRacePlan', () => {
    it('should call POST /api/race-planning/calculate with params', async () => {
      const mockResponse = {
        splits: [
          {
            km: 1,
            distance: 1000,
            splitTime: 270,
            cumulativeTime: 270,
            pace: 270,
            hrZone: 3,
            hrRange: '140-150',
            elevationGain: 0,
            elevationLoss: 0,
            nutrition: [],
          },
        ],
        racePrediction: null,
        nutritionStrategy: {
          totalCalories: 0,
          totalCarbs: 0,
          totalLiquids: 0,
          perHour: { calories: 0, carbs: 0, liquids: 0 },
          schedule: [],
          duringRace: [],
        },
        warnings: [],
        summary: { distance: 10, targetPace: 270, totalTime: 2700, fcm: 180 },
      };
      mockFetchSuccess(mockResponse);
      const result = await racePlanningApi.calculateRacePlan({ distance: 10 });
      expect(result.splits).toHaveLength(1);
      expect(result.summary.distance).toBe(10);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining(API_ENDPOINTS.racePlanning.calculate),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should handle GPX data', async () => {
      mockFetchSuccess({ splits: [], summary: { distance: 5.5 } });
      const gpxData =
        '<?xml version="1.0"?><gpx><trk><trkseg><trkpt lat="48" lon="2"><ele>100</ele></trkpt></trkseg></trk></gpx>';
      const result = await racePlanningApi.calculateRacePlan({ distance: 5.5, gpxData });
      expect(result.summary.distance).toBe(5.5);
    });

    it('should handle targetTime parameter', async () => {
      mockFetchSuccess({ splits: [], summary: { distance: 10, totalTime: 3600 } });
      const result = await racePlanningApi.calculateRacePlan({ distance: 10, targetTime: '01:00:00' });
      expect(result.summary.totalTime).toBe(3600);
    });

    it('should handle targetPace parameter', async () => {
      mockFetchSuccess({ splits: [], summary: { distance: 10, targetPace: 300 } });
      const result = await racePlanningApi.calculateRacePlan({ distance: 10, targetPace: 300 });
      expect(result.summary.targetPace).toBe(300);
    });

    it('should handle environmental parameters', async () => {
      mockFetchSuccess({ splits: [], summary: {} });
      await racePlanningApi.calculateRacePlan({
        distance: 10,
        temperature: 25,
        humidity: 60,
        altitude: 500,
        windSpeed: 5,
      });
      const call = (globalThis.fetch as vi.Mock).mock.calls[0];
      const body = JSON.parse(call[1]?.body as string);
      expect(body.temperature).toBe(25);
      expect(body.humidity).toBe(60);
      expect(body.altitude).toBe(500);
      expect(body.windSpeed).toBe(5);
    });

    it('should throw error on failed request', async () => {
      mockFetchError();
      await expect(racePlanningApi.calculateRacePlan({ distance: 10 })).rejects.toThrow();
    });
  });

  describe('saveRacePlan', () => {
    it('should call POST /api/race-planning/save with required fields', async () => {
      const mockNutrition: NutritionStrategy = {
        totalCalories: 200,
        totalCarbs: 50,
        totalLiquids: 500,
        perHour: { calories: 100, carbs: 25, liquids: 250 },
        schedule: [],
        duringRace: [],
      };
      const mockSplit: RaceSplit = {
        km: 1,
        distance: 1000,
        splitTime: 270,
        cumulativeTime: 270,
        pace: 270,
        hrZone: 3,
        hrRange: '140-150',
        elevationGain: 0,
        elevationLoss: 0,
        nutrition: [],
      };
      mockFetchSuccess({ success: true, message: 'Race plan saved' });
      const result = await racePlanningApi.saveRacePlan({
        name: 'My 10K Plan',
        distance: 10,
        targetPace: 270,
        totalTime: 2700,
        elevationProfile: 'flat',
        fatigue: 2,
        splits: [mockSplit],
        nutritionStrategy: mockNutrition,
      });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Race plan saved');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining(API_ENDPOINTS.racePlanning.save),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should save with minimal required fields only', async () => {
      mockFetchSuccess({ success: true, message: 'Saved' });
      const result = await racePlanningApi.saveRacePlan({
        distance: 10,
        targetPace: 270,
        splits: [],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('listRacePlans', () => {
    it('should call GET /api/race-planning/list', async () => {
      const mockPlans = [
        {
          id: 1,
          userId: '1',
          name: 'Plan 1',
          distance: 10,
          targetPace: 270,
          totalTime: 2700,
          elevationProfile: 'flat',
          fatigue: 0,
          splits: JSON.stringify([]),
          nutritionStrategy: null,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        {
          id: 2,
          userId: '1',
          name: 'Plan 2',
          distance: 21.1,
          targetPace: 330,
          totalTime: 4200,
          elevationProfile: 'rolling',
          fatigue: 3,
          splits: JSON.stringify([]),
          nutritionStrategy: null,
          createdAt: '2026-01-02',
          updatedAt: '2026-01-02',
        },
      ];
      mockFetchSuccess(mockPlans);
      const result = await racePlanningApi.listRacePlans();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Plan 1');
      expect(result[1].name).toBe('Plan 2');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining(API_ENDPOINTS.racePlanning.list),
        expect.any(Object),
      );
    });

    it('should return empty array when no plans', async () => {
      mockFetchSuccess([]);
      const result = await racePlanningApi.listRacePlans();
      expect(result).toEqual([]);
    });
  });

  describe('deleteRacePlan', () => {
    it('should call DELETE /api/race-planning/:id', async () => {
      mockFetchSuccess({ success: true, message: 'Race plan deleted' });
      const result = await racePlanningApi.deleteRacePlan(5);
      expect(result.success).toBe(true);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining(API_ENDPOINTS.racePlanning.delete(5)),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('should handle delete error', async () => {
      mockFetchError(404, { error: 'Not found' });
      await expect(racePlanningApi.deleteRacePlan(999)).rejects.toThrow();
    });
  });

  describe('calculateRaceStrategy', () => {
    it('should call POST /api/race-planning/race-strategy with points', async () => {
      const mockStrategy = {
        success: true,
        strategy: {
          name: 'Test Strategy',
          description: 'Optimal pacing for hilly course',
          splits: [],
          pacingAdvice: 'Start conservative on uphills',
          nutritionRecommendations: {
            totalCalories: 0,
            totalCarbs: 0,
            totalLiquids: 0,
            perHour: { calories: 0, carbs: 0, liquids: 0 },
            schedule: [],
          },
          elevationAnalysis: { totalGain: 100, totalLoss: 50, difficultyScore: 5 },
          weatherImpact: { temperatureEffect: 0, humidityEffect: 0, adjustedPace: 270 },
        },
      };
      mockFetchSuccess(mockStrategy);
      const result = await racePlanningApi.calculateRaceStrategy({
        points: [
          { dist: 0, ele: 100, lat: 48.8566, lon: 2.3522 },
          { dist: 1000, ele: 115, lat: 48.8666, lon: 2.3622 },
        ],
        params: { temp: 15, humidity: 50 },
      });
      expect(result.success).toBe(true);
      expect(result.strategy.name).toBe('Test Strategy');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining(API_ENDPOINTS.racePlanning.strategy),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should accept GPX data instead of points', async () => {
      mockFetchSuccess({ success: true, strategy: { splits: [] } });
      const gpxData =
        '<?xml version="1.0"?><gpx><trk><trkseg><trkpt lat="48" lon="2"><ele>100</ele></trkpt></trkseg></trk></gpx>';
      await racePlanningApi.calculateRaceStrategy({ gpxData, params: { temp: 20 } });
      const call = (globalThis.fetch as vi.Mock).mock.calls[0];
      const body = JSON.parse(call[1]?.body as string);
      expect(body.gpxData).toBe(gpxData);
      expect(body.params.temp).toBe(20);
    });
  });

  describe('formatTime', () => {
    it('should format seconds < 60 correctly', () => {
      expect(racePlanningApi.formatTime(0)).toBe('0:00');
      expect(racePlanningApi.formatTime(30)).toBe('0:30');
      expect(racePlanningApi.formatTime(45)).toBe('0:45');
      expect(racePlanningApi.formatTime(59)).toBe('0:59');
    });

    it('should format minutes correctly', () => {
      expect(racePlanningApi.formatTime(60)).toBe('1:00');
      expect(racePlanningApi.formatTime(90)).toBe('1:30');
      expect(racePlanningApi.formatTime(120)).toBe('2:00');
      expect(racePlanningApi.formatTime(125)).toBe('2:05');
    });

    it('should format hours correctly', () => {
      expect(racePlanningApi.formatTime(3600)).toBe('1:00:00');
      expect(racePlanningApi.formatTime(3661)).toBe('1:01:01');
      expect(racePlanningApi.formatTime(3665)).toBe('1:01:05');
      expect(racePlanningApi.formatTime(7322)).toBe('2:02:02');
    });

    it('should format marathon time', () => {
      // 3 hours 30 minutes = 12600 seconds
      expect(racePlanningApi.formatTime(12600)).toBe('3:30:00');
      // 4 hours 15 minutes 30 seconds = 15330 seconds
      expect(racePlanningApi.formatTime(15330)).toBe('4:15:30');
    });
  });

  describe('formatPace', () => {
    it('should format pace < 60 sec/km', () => {
      expect(racePlanningApi.formatPace(240)).toBe('4:00/km');
      expect(racePlanningApi.formatPace(245)).toBe('4:05/km');
      expect(racePlanningApi.formatPace(299)).toBe('4:59/km');
    });

    it('should format pace >= 60 sec/km', () => {
      expect(racePlanningApi.formatPace(300)).toBe('5:00/km');
      expect(racePlanningApi.formatPace(360)).toBe('6:00/km');
      expect(racePlanningApi.formatPace(420)).toBe('7:00/km');
    });

    it('should handle zero or invalid pace', () => {
      expect(racePlanningApi.formatPace(0)).toBe('--:--');
      expect(racePlanningApi.formatPace(-1)).toBe('--:--');
      expect(racePlanningApi.formatPace(null as unknown as number)).toBe('--:--');
    });

    it('should format elite pace', () => {
      expect(racePlanningApi.formatPace(180)).toBe('3:00/km');
      expect(racePlanningApi.formatPace(195)).toBe('3:15/km');
    });
  });

  describe('exportToCsv', () => {
    const mockSplits: RaceSplit[] = [
      {
        km: 1,
        distance: 1000,
        splitTime: 270,
        cumulativeTime: 270,
        pace: 270,
        hrZone: 3,
        hrRange: '140-150 bpm',
        elevationGain: 10,
        elevationLoss: 0,
        nutrition: [{ type: 'gel', label: 'Gel énergétique', quantity: '1 gel', timing: 'during' }],
      },
      {
        km: 2,
        distance: 1000,
        splitTime: 270,
        cumulativeTime: 540,
        pace: 270,
        hrZone: 3,
        hrRange: '140-150 bpm',
        elevationGain: 5,
        elevationLoss: 2,
        nutrition: [],
      },
    ];

    it('should export splits to CSV with headers', () => {
      const csv = racePlanningApi.exportToCsv(mockSplits);
      const lines = csv.split('\n');

      expect(lines[0]).toBe(
        'KM,Distance (km),Temps (sec),Temps cumulé (sec),Allure (sec/km),Zone FC,FC (bpm),Nutrition',
      );
      expect(lines.length).toBe(3); // header + 2 splits
    });

    it('should format split data correctly', () => {
      const csv = racePlanningApi.exportToCsv(mockSplits);
      const lines = csv.split('\n');

      // Check first data line
      expect(lines[1]).toContain('1'); // km
      expect(lines[1]).toContain('1'); // distance (appears again)
      expect(lines[1]).toContain('270'); // splitTime
      expect(lines[1]).toContain('270'); // cumulativeTime
      expect(lines[1]).toContain('270'); // pace
      expect(lines[1]).toContain('3'); // hrZone
      expect(lines[1]).toContain('140-150 bpm'); // hrRange
      expect(lines[1]).toContain('Gel énergétique (1 gel)'); // nutrition
    });

    it('should handle empty splits', () => {
      const csv = racePlanningApi.exportToCsv([]);
      const lines = csv.split('\n');
      expect(lines[0]).toContain('KM');
      expect(lines.length).toBe(1); // only header
    });

    it('should handle empty nutrition', () => {
      const splitsWithoutNutrition: RaceSplit[] = [
        {
          km: 1,
          distance: 1000,
          splitTime: 270,
          cumulativeTime: 270,
          pace: 270,
          hrZone: 3,
          hrRange: '140-150 bpm',
          elevationGain: 0,
          elevationLoss: 0,
          nutrition: [],
        },
      ];
      const csv = racePlanningApi.exportToCsv(splitsWithoutNutrition);
      expect(csv).toContain('-'); // nutrition column shows '-'
    });

    it('should handle multiple nutrition items', () => {
      const splits: RaceSplit[] = [
        {
          km: 1,
          distance: 1000,
          splitTime: 270,
          cumulativeTime: 270,
          pace: 270,
          hrZone: 3,
          hrRange: '140-150 bpm',
          elevationGain: 0,
          elevationLoss: 0,
          nutrition: [
            { type: 'gel', label: 'Gel', quantity: '1', timing: 'during' },
            { type: 'drink', label: 'Eau', quantity: '200ml', timing: 'during' },
          ],
        },
      ];
      const csv = racePlanningApi.exportToCsv(splits);
      expect(csv).toContain('Gel (1)');
      expect(csv).toContain('Eau (200ml)');
    });
  });

  describe('downloadCsv', () => {
    it('should create blob and trigger download', () => {
      const mockSplits: RaceSplit[] = [
        {
          km: 1,
          distance: 1000,
          splitTime: 270,
          cumulativeTime: 270,
          pace: 270,
          hrZone: 3,
          hrRange: '140-150 bpm',
          elevationGain: 0,
          elevationLoss: 0,
          nutrition: [],
        },
      ];

      // Mock URL.createObjectURL and click
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      const mockRevokeObjectURL = vi.fn();
      const mockClick = vi.fn();
      const mockRemoveChild = vi.fn();
      const mockAppendChild = vi.fn();

      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      const mockLink = {
        href: '',
        download: '',
        click: mockClick,
      };

      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
      vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
      vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);

      racePlanningApi.downloadCsv(mockSplits, 'test-race-plan.csv');

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
    });

    it('should use default filename when not provided', () => {
      const mockSplits: RaceSplit[] = [
        {
          km: 1,
          distance: 1000,
          splitTime: 270,
          cumulativeTime: 270,
          pace: 270,
          hrZone: 3,
          hrRange: '140-150',
          elevationGain: 0,
          elevationLoss: 0,
          nutrition: [],
        },
      ];

      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test');
      const mockClick = vi.fn();
      const mockLink = { href: '', download: '', click: mockClick };

      global.URL.createObjectURL = mockCreateObjectURL;
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as HTMLAnchorElement);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as Node);

      racePlanningApi.downloadCsv(mockSplits);

      expect(mockLink.download).toBe('race-plan.csv');
    });

    it('should use custom filename when provided', () => {
      const mockSplits: RaceSplit[] = [
        {
          km: 1,
          distance: 1000,
          splitTime: 270,
          cumulativeTime: 270,
          pace: 270,
          hrZone: 3,
          hrRange: '140-150',
          elevationGain: 0,
          elevationLoss: 0,
          nutrition: [],
        },
      ];

      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:test');
      const mockClick = vi.fn();
      const mockLink = { href: '', download: '', click: mockClick };

      global.URL.createObjectURL = mockCreateObjectURL;
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as unknown as HTMLAnchorElement);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as unknown as Node);

      racePlanningApi.downloadCsv(mockSplits, 'my-custom-race.csv');

      expect(mockLink.download).toBe('my-custom-race.csv');
    });
  });
});
