/**
 * ============================================================
 * Metrics Calculator Service Tests
 * ============================================================
 */

const { calculateAndStoreMetrics, getUserProfile, updateUserProfile } = require('../../src/services/metricsCalculator.service');

jest.mock('../../src/database', () => ({
  dbGetMain: jest.fn(),
  dbGetUser: jest.fn(),
  dbRunUser: jest.fn(),
  dbAllUser: jest.fn(),
  getUserDb: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const { dbGetMain, dbGetUser, dbRunUser, dbAllUser, getUserDb } = require('../../src/database');

describe('MetricsCalculator Service', () => {
  const userId = 1;
  const userDb = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateAndStoreMetrics', () => {
    it('should return early when no activities exist', async () => {
      dbGetMain.mockResolvedValue({ profile_data: '{}' });
      dbGetUser.mockResolvedValue(null);
      dbAllUser.mockResolvedValue([]);

      const result = await calculateAndStoreMetrics(userId, userDb);

      expect(result).toEqual({ success: true, calculated: 0 });
      expect(dbGetMain).toHaveBeenCalledWith('SELECT profile_data FROM users WHERE id = ?', [userId]);
    });

    it('should calculate TSS/TRIMP for activities', async () => {
      const mockProfile = { fcm: 180, vma: 14, vdot: 40, resting_hr: 60, age: 30, sex: 'M', weight: 70 };
      const mockActivities = [
        { id: 1, type: 'Run', distance: 5000, moving_time: 1800, average_speed: 2.78, average_heartrate: 150, max_heartrate: 180, start_date: '2026-01-01T10:00:00Z' },
        { id: 2, type: 'Run', distance: 10000, moving_time: 3600, average_speed: 2.78, average_heartrate: 155, max_heartrate: 185, start_date: '2026-01-02T10:00:00Z' },
      ];
      const mockActivitiesWithTSS = [
        { start_date: '2026-01-01T10:00:00Z', tss: 50, trimp: 60 },
        { start_date: '2026-01-02T10:00:00Z', tss: 70, trimp: 80 },
      ];

      dbGetMain.mockResolvedValue({ profile_data: '{}' });
      dbAllUser.mockResolvedValue(mockActivities);
      dbGetUser.mockResolvedValue(mockProfile);

      const result = await calculateAndStoreMetrics(userId, userDb);

      expect(result.success).toBe(true);
      expect(result.calculated).toBeGreaterThan(0);
      expect(dbRunUser).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      dbGetMain.mockRejectedValue(new Error('DB error'));

      const result = await calculateAndStoreMetrics(userId, userDb);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should process auto_update flag from profile_data', async () => {
      dbGetMain.mockResolvedValue({ profile_data: JSON.stringify({ auto_update: false }) });
      dbGetUser.mockResolvedValueOnce({ fcm: 180, vma: 14, vdot: 40, resting_hr: 60, age: 30, sex: 'M', weight: 70 });
      dbAllUser.mockResolvedValueOnce([]);

      const result = await calculateAndStoreMetrics(userId, userDb);

      expect(result).toEqual({ success: true, calculated: 0 });
    });
  });

  describe('getUserProfile', () => {
    it('should return merged profile from DB and profile_data', async () => {
      dbGetMain.mockResolvedValue({ profile_data: JSON.stringify({ age: 35, weight: 75 }) });
      dbGetUser.mockResolvedValue({ fcm: 185, vma: 15, vdot: 45, resting_hr: 55, age: null, sex: 'M', weight: null });

      const profile = await getUserProfile(1, {});

      expect(profile.fcm).toBe(185);
      expect(profile.age).toBe(35);
      expect(profile.weight).toBe(75);
      expect(profile.vma).toBe(15);
    });

    it('should use defaults when no data available', async () => {
      dbGetMain.mockResolvedValue({ profile_data: '{}' });
      dbGetUser.mockResolvedValue(null);

      const profile = await getUserProfile(1, {});

      expect(profile.age).toBe(30);
      expect(profile.sex).toBe('M');
      expect(profile.weight).toBe(70);
      expect(profile.resting_hr).toBe(60);
    });
  });

  describe('updateUserProfile', () => {
    it('should update existing profile', async () => {
      dbGetUser.mockResolvedValue({ id: 1 });
      dbRunUser.mockResolvedValue({});

      await updateUserProfile(1, {}, { vdot: 45, fcm: 185 });

      expect(dbRunUser).toHaveBeenCalledWith(
        expect.any(Object),
        expect.stringContaining('UPDATE user_profiles'),
        expect.arrayContaining([45, 185, 1])
      );
    });

    it('should insert new profile if not exists', async () => {
      dbGetUser.mockRejectedValue(new Error('Not found'));
      dbRunUser.mockResolvedValue({});

      await updateUserProfile(1, {}, { vdot: 45 });

      expect(dbRunUser).toHaveBeenCalledWith(
        expect.any(Object),
        expect.stringContaining('INSERT INTO user_profiles'),
        expect.any(Array)
      );
    });
  });
});
