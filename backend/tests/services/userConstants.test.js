'use strict';

/**
 * ============================================================
 * USER CONSTANTS SERVICE TESTS
 * ============================================================
 * Tests for resolveUserConstants, resolveFCM, resolveVDOT, etc.
 */

// Mock database
jest.mock('../../src/database', () => ({
    getUserDb: jest.fn(),
    dbGetUser: jest.fn(),
    dbAllUser: jest.fn(),
    dbGetMain: jest.fn(),
    dbRunUser: jest.fn(),
}));

// Mock algorithms
jest.mock('../../src/algorithms', () => ({
    Cardiovascular: {
        calculateMaxHR: jest.fn((age) => 220 - age),
    },
    RunningPerformance: {
        calculateVDOT: jest.fn((distance, timeMin) => {
            if (distance >= 1000 && timeMin >= 5) {
                return Math.round((distance / 1000) / (timeMin / 60) * 3.5 * 10) / 10;
            }
            return null;
        }),
        estimateVMA: jest.fn((vdot) => Math.round(vdot * 0.35 * 10) / 10),
        estimateVO2max: jest.fn((vma) => Math.round(vma * 3.5 * 10) / 10),
    },
}));

jest.mock('../../src/utils/logger', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const {
    resolveUserConstants,
    getManualConstants,
    updateUserProfileFromMain,
    RESOLUTION_SOURCES,
} = require('../../src/services/userConstants.service');

const { getUserDb, dbGetUser, dbAllUser, dbGetMain, dbRunUser } = require('../../src/database');

describe('userConstants service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('resolveUserConstants', () => {
        test('should return default values when no data available', async () => {
            getUserDb.mockResolvedValue({});
            dbGetUser.mockResolvedValue(null);
            dbAllUser.mockResolvedValue([]);
            dbGetMain.mockResolvedValue(null);

            const result = await resolveUserConstants(1);

            expect(result).toHaveProperty('fcm');
            expect(result).toHaveProperty('vdot');
            expect(result).toHaveProperty('vma');
            expect(result).toHaveProperty('vo2max');
            expect(result).toHaveProperty('restingHR');
            expect(result).toHaveProperty('age', 30);
            expect(result).toHaveProperty('sex', 'M');
            expect(result).toHaveProperty('weight', null);
            // FCM should be estimated from age
            expect(result.fcm).toBe(190); // 220 - 30
            expect(result.fcmSource).toBe('estimated');
            // Resting HR should default to 60
            expect(result.restingHR).toBe(60);
            expect(result.restingHRSource).toBe('estimated');
        });

        test('should use manual FCM when auto_update is false', async () => {
            getUserDb.mockResolvedValue({});
            dbGetUser.mockResolvedValue({
                fcm: 180, vma: null, vdot: null, weight: 70,
                height: null, resting_hr: 55, age: 35, sex: 'M',
            });
            dbAllUser.mockResolvedValue([]);
            dbGetMain.mockResolvedValue({
                profile_data: JSON.stringify({ auto_update: false }),
            });

            const result = await resolveUserConstants(1);

            expect(result.fcm).toBe(180);
            expect(result.fcmSource).toBe('manual');
            expect(result.restingHR).toBe(55);
            expect(result.restingHRSource).toBe('manual');
            expect(result.weight).toBe(70);
        });

        test('should compute FCM from observed max HR in activities', async () => {
            getUserDb.mockResolvedValue({});
            dbGetUser.mockResolvedValue({
                fcm: null, age: 30, sex: 'M',
            });
            dbAllUser.mockResolvedValue([
                { max_heartrate: 195, distance: 5000, moving_time: 1200, average_speed: 4.2, max_speed: 5, average_heartrate: 160, start_date: '2026-01-01', type: 'Run' },
                { max_heartrate: 188, distance: 10000, moving_time: 2400, average_speed: 4.1, max_speed: 4.8, average_heartrate: 155, start_date: '2026-01-02', type: 'Run' },
            ]);
            dbGetMain.mockResolvedValue(null);

            const result = await resolveUserConstants(1);

            // Max observed is 195, formula is 190 (220 - 30)
            // 195 >= 190 * 0.85 = 161.5, so use 195
            expect(result.fcm).toBe(195);
            expect(result.fcmSource).toBe('computed');
        });

        test('should use formula FCM when observed max is too low', async () => {
            getUserDb.mockResolvedValue({});
            dbGetUser.mockResolvedValue({
                fcm: null, age: 40, sex: 'M',
            });
            dbAllUser.mockResolvedValue([
                { max_heartrate: 140, distance: 5000, moving_time: 1200, average_speed: 4.2, max_speed: 5, average_heartrate: 130, start_date: '2026-01-01', type: 'Run' },
            ]);
            dbGetMain.mockResolvedValue(null);

            const result = await resolveUserConstants(1);

            // Formula: 220 - 40 = 180
            // Observed max is 140 < 180 * 0.85 (153)
            // So use Math.max(140, 180) = 180
            expect(result.fcm).toBe(180);
            expect(result.fcmSource).toBe('computed');
        });

        test('should compute VDOT from best run', async () => {
            getUserDb.mockResolvedValue({});
            dbGetUser.mockResolvedValue({
                fcm: null, age: 30, sex: 'M',
            });
            dbAllUser.mockResolvedValue([
                { type: 'Run', distance: 10000, moving_time: 2700, max_heartrate: null, average_speed: 3.7, max_speed: 4, average_heartrate: null, start_date: '2026-01-01' },
            ]);
            dbGetMain.mockResolvedValue(null);

            const result = await resolveUserConstants(1);

            // VDOT from 10K in 45 min should be calculated
            expect(result.vdot).toBeDefined();
            expect(result.vdot).toBeGreaterThan(20);
            expect(result.vdotSource).toBe('computed');
        });

        test('should use manually set VDOT', async () => {
            getUserDb.mockResolvedValue({});
            dbGetUser.mockResolvedValue({
                fcm: null, vdot: 45, age: 30, sex: 'M',
            });
            dbAllUser.mockResolvedValue([]);
            dbGetMain.mockResolvedValue({ profile_data: JSON.stringify({ auto_update: false }) });

            const result = await resolveUserConstants(1);

            expect(result.vdot).toBe(45);
            expect(result.vdotSource).toBe('manual');
        });

        test('should estimate VMA from VDOT', async () => {
            getUserDb.mockResolvedValue({});
            dbGetUser.mockResolvedValue({
                fcm: null, vdot: 50, vma: null, age: 30, sex: 'M',
            });
            dbAllUser.mockResolvedValue([]);
            dbGetMain.mockResolvedValue(null);

            const result = await resolveUserConstants(1);

            // VMA ~= 50 * 0.35 = 17.5
            expect(result.vma).toBeDefined();
            expect(result.vma).toBeGreaterThan(0);
        });
    });

    describe('getManualConstants', () => {
        test('should return manual constants from user_profiles table', async () => {
            getUserDb.mockResolvedValue({});
            dbGetUser.mockResolvedValue({
                fcm: 185, vma: 16, vdot: 48, weight: 72,
                height: 178, resting_hr: 58, age: 28, sex: 'M',
            });

            const result = await getManualConstants(1, {});

            expect(result.fcm).toBe(185);
            expect(result.vma).toBe(16);
            expect(result.vdot).toBe(48);
            expect(result.weight).toBe(72);
            expect(result.restingHR).toBe(58);
            expect(result.age).toBe(28);
            expect(result.sex).toBe('M');
        });

        test('should return empty values when no profile exists', async () => {
            getUserDb.mockResolvedValue({});
            dbGetUser.mockResolvedValue(null);
            dbGetMain.mockResolvedValue(null);

            const result = await getManualConstants(1, {});

            expect(result.fcm).toBeNull();
            expect(result.vma).toBeNull();
            expect(result.vdot).toBeNull();
            expect(result.weight).toBeNull();
            expect(result.sex).toBe('M');
        });

        test('should fall back to main DB profile_data when user_profiles is empty', async () => {
            getUserDb.mockResolvedValue({});
            dbGetUser.mockResolvedValue(null);
            dbGetMain.mockResolvedValue({
                profile_data: JSON.stringify({
                    fcm: 190, vma: 18, vdot: 52, weight: 75,
                    restingHR: 55, age: 32, sex: 'M',
                }),
            });

            const result = await getManualConstants(1, {});

            expect(result.fcm).toBe(190);
            expect(result.weight).toBe(75);
            expect(result.age).toBe(32);
        });

        test('should handle malformed profile_data gracefully', async () => {
            getUserDb.mockResolvedValue({});
            dbGetUser.mockResolvedValue(null);
            dbGetMain.mockResolvedValue({
                profile_data: 'not-valid-json{{',
            });

            const result = await getManualConstants(1, {});

            expect(result.fcm).toBeNull();
            expect(result.sex).toBe('M');
        });
    });

    describe('updateUserProfileFromMain', () => {
        test('should insert new user profile when no existing', async () => {
            getUserDb.mockResolvedValue({});
            dbGetUser.mockResolvedValue(null);
            dbRunUser.mockResolvedValue({});

            await updateUserProfileFromMain(1, {
                fcm: 185, vma: 16, vdot: 48, weight: 72,
                height: 178, restingHR: 58, age: 28, sex: 'M',
            });

            expect(dbRunUser).toHaveBeenCalledWith(
                {},
                expect.stringContaining('INSERT INTO user_profiles'),
                expect.arrayContaining([1, 185, 16, 48, 72, 178, 58, 28, 'M'])
            );
        });

        test('should update existing user profile', async () => {
            getUserDb.mockResolvedValue({});
            dbGetUser.mockResolvedValue({ id: 1 });
            dbRunUser.mockResolvedValue({});

            await updateUserProfileFromMain(1, { weight: 75 });

            expect(dbRunUser).toHaveBeenCalledWith(
                {},
                expect.stringContaining('UPDATE user_profiles'),
                expect.arrayContaining([75, 1])
            );
        });
    });

    describe('RESOLUTION_SOURCES', () => {
        test('should have correct source constants', () => {
            expect(RESOLUTION_SOURCES.MANUAL).toBe('manual');
            expect(RESOLUTION_SOURCES.COMPUTED).toBe('computed');
            expect(RESOLUTION_SOURCES.ESTIMATED).toBe('estimated');
        });
    });
});
