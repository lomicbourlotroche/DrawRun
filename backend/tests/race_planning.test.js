'use strict';

const request = require('supertest');
const express = require('express');
const racePlanningRouter = require('../src/routes/race_planning');

// Mock database
jest.mock('../src/database', () => ({
    getUserDb: jest.fn(),
    dbGetUser: jest.fn(),
    dbAllUser: jest.fn(),
    dbRunUser: jest.fn(),
    dbGetMain: jest.fn(),
    dbAllMain: jest.fn(),
}));

// Mock auth middleware
jest.mock('../src/routes/auth', () => ({
    verifyToken: (req, res, next) => {
        req.user = { id: 1, email: 'test@example.com' };
        next();
    },
}));

// Mock logger
jest.mock('../src/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

// Mock user constants service
const mockConstants = {
    fcm: 180, vdot: null, weight: 70, restingHR: 60, age: 30, sex: 'M',
    fcmSource: 'default', vdotSource: 'default', restingHRSource: 'default',
    vo2max: null, vo2maxSource: 'default', vma: null, vmaSource: 'default',
};
jest.mock('../src/services/userConstants.service', () => ({
    resolveUserConstants: jest.fn(() => Promise.resolve(mockConstants)),
}));

const { getUserDb, dbAllUser, dbRunUser, dbGetMain, dbGetUser } = require('../src/database');
const { resolveUserConstants } = require('../src/services/userConstants.service');

const app = express();
app.use(express.json());
app.use('/api/race-planning', racePlanningRouter);

describe('Race Planning Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        resolveUserConstants.mockResolvedValue(mockConstants);
    });

    describe('POST /api/race-planning/calculate', () => {
        test('should return 400 for missing distance', async () => {
            const res = await request(app)
                .post('/api/race-planning/calculate')
                .send({});
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Paramètres invalides');
        });

        test('should return 400 for distance > 200', async () => {
            const res = await request(app)
                .post('/api/race-planning/calculate')
                .send({ distance: 500 });
            expect(res.status).toBe(400);
        });

        test('should return 400 for invalid fatigue', async () => {
            const res = await request(app)
                .post('/api/race-planning/calculate')
                .send({ distance: 10, fatigue: 15 });
            expect(res.status).toBe(400);
        });

        test('should return 400 for invalid strategyBias', async () => {
            const res = await request(app)
                .post('/api/race-planning/calculate')
                .send({ distance: 10, strategyBias: 2 });
            expect(res.status).toBe(400);
        });

        test('should return 400 for invalid elevationProfile', async () => {
            const res = await request(app)
                .post('/api/race-planning/calculate')
                .send({ distance: 10, elevationProfile: 'extreme' });
            expect(res.status).toBe(400);
        });

        test('should calculate race plan with minimal params', async () => {
            dbGetMain.mockResolvedValue(null);
            const res = await request(app)
                .post('/api/race-planning/calculate')
                .send({ distance: 10 });
            expect(res.status).toBe(200);
            expect(res.body.splits).toBeDefined();
            expect(res.body.summary).toBeDefined();
            expect(res.body.summary.distance).toBe(10);
            expect(Array.isArray(res.body.splits)).toBe(true);
            expect(res.body.splits.length).toBe(10);
        });

        test('should calculate race plan with targetTime', async () => {
            dbGetMain.mockResolvedValue(null);
            const res = await request(app)
                .post('/api/race-planning/calculate')
                .send({ distance: 10, targetTime: '00:45:00' });
            expect(res.status).toBe(200);
            expect(res.body.splits.length).toBe(10);
        });

        test('should calculate race plan with targetPace', async () => {
            dbGetMain.mockResolvedValue(null);
            const res = await request(app)
                .post('/api/race-planning/calculate')
                .send({ distance: 10, targetPace: 270 });
            expect(res.status).toBe(200);
            expect(res.body.splits.length).toBe(10);
        });

        test('should handle 5K distance correctly', async () => {
            dbGetMain.mockResolvedValue(null);
            const res = await request(app)
                .post('/api/race-planning/calculate')
                .send({ distance: 5 });
            expect(res.status).toBe(200);
            expect(res.body.splits.length).toBe(5);
            expect(res.body.pacingStrategy).toBeDefined();
            expect(res.body.pacingStrategy.type).toBe('even');
        });

        test('should handle marathon distance', async () => {
            dbGetMain.mockResolvedValue(null);
            const res = await request(app)
                .post('/api/race-planning/calculate')
                .send({ distance: 42.195, targetTime: '03:30:00' });
            expect(res.status).toBe(200);
            expect(res.body.splits.length).toBeGreaterThanOrEqual(42);
            expect(res.body.nutritionStrategy).toBeDefined();
            expect(res.body.nutritionStrategy.totalWater).toBeGreaterThan(0);
        });

        test('should apply strategyBias correctly', async () => {
            dbGetMain.mockResolvedValue(null);
            const res = await request(app)
                .post('/api/race-planning/calculate')
                .send({ distance: 10, targetTime: '00:45:00', strategyBias: -1 });
            expect(res.status).toBe(200);
            expect(res.body.summary.strategyBias).toBe(-1);
        });

        test('should return nutrition strategy for long races', async () => {
            dbGetMain.mockResolvedValue(null);
            const res = await request(app)
                .post('/api/race-planning/calculate')
                .send({ distance: 21.0975, targetTime: '01:45:00' });
            expect(res.status).toBe(200);
            expect(res.body.nutritionStrategy).toBeDefined();
            expect(res.body.splits[0].nutrition).toBeDefined();
        });

        test('should fetch user profile for VDOT', async () => {
            resolveUserConstants.mockResolvedValue({
                fcm: 185, vdot: 45, weight: 75, restingHR: 55, age: 35, sex: 'M',
                fcmSource: 'manual', vdotSource: 'computed', restingHRSource: 'manual',
                vo2max: 50, vo2maxSource: 'computed', vma: 16, vmaSource: 'computed',
            });
            const res = await request(app)
                .post('/api/race-planning/calculate')
                .send({ distance: 10 });
            expect(res.status).toBe(200);
            expect(res.body.summary.fcm).toBe(185);
            expect(res.body.summary.vdot).toBe(45);
        });

        test('should handle GPX data', async () => {
            dbGetMain.mockResolvedValue(null);
            const gpxSample = `<?xml version="1.0"?>
                <gpx version="1.1">
                    <trk><trkseg>
                        <trkpt lat="48.8566" lon="2.3522"><ele>100</ele></trkpt>
                        <trkpt lat="48.8666" lon="2.3622"><ele>110</ele></trkpt>
                    </trkseg></trk>
                </gpx>`;
            const res = await request(app)
                .post('/api/race-planning/calculate')
                .send({ gpxData: gpxSample, targetTime: '00:30:00' });
            expect(res.status).toBe(200);
        });
    });

    describe('POST /api/race-planning/save', () => {
        test('should return 400 when required fields missing', async () => {
            const res = await request(app)
                .post('/api/race-planning/save')
                .send({});
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Validation failed');
        });

        test('should return 400 when distance is invalid', async () => {
            const res = await request(app)
                .post('/api/race-planning/save')
                .send({ distance: 0, targetPace: 270, splits: [] });
            expect(res.status).toBe(400);
            expect(res.body.details).toContain('Distance must be between 0.1 and 200 km');
        });

        test('should return 400 when splits are invalid', async () => {
            const res = await request(app)
                .post('/api/race-planning/save')
                .send({ distance: 10, targetPace: 270, splits: [] });
            expect(res.status).toBe(400);
            expect(res.body.details).toContain('Splits must be a non-empty array');
        });

        test('should save a race plan', async () => {
            getUserDb.mockResolvedValue({});
            dbRunUser.mockResolvedValue({});
            const res = await request(app)
                .post('/api/race-planning/save')
                .send({
                    distance: 10,
                    targetPace: 270,
                    splits: [{ km: 1, splitTime: 270, pace: 270 }],
                });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('GET /api/race-planning/list', () => {
        test('should list saved race plans with pagination', async () => {
            getUserDb.mockResolvedValue({});
            dbGetUser.mockResolvedValue({ total: 1 });
            dbAllUser.mockResolvedValue([
                { id: 1, user_id: 1, name: 'Plan 10km', distance: 10, target_pace: 270, total_time: 2700, elevation_profile: 'flat', fatigue: 0, splits: JSON.stringify([{ km: 1 }]), nutrition_strategy: null, created_at: '2026-01-01' },
            ]);
            const res = await request(app)
                .get('/api/race-planning/list');
            expect(res.status).toBe(200);
            expect(res.body.plans).toBeDefined();
            expect(Array.isArray(res.body.plans)).toBe(true);
            expect(res.body.plans.length).toBe(1);
            expect(res.body.plans[0].splits).toBeDefined();
            expect(res.body.pagination).toBeDefined();
            expect(res.body.pagination.page).toBe(1);
            expect(res.body.pagination.limit).toBe(20);
            expect(res.body.pagination.total).toBe(1);
        });

        test('should list saved race plans with custom pagination', async () => {
            getUserDb.mockResolvedValue({});
            dbGetUser.mockResolvedValue({ total: 25 });
            dbAllUser.mockResolvedValue([
                { id: 1, user_id: 1, name: 'Plan 1', distance: 10, target_pace: 270, total_time: 2700, elevation_profile: 'flat', fatigue: 0, splits: JSON.stringify([{ km: 1 }]), nutrition_strategy: null, created_at: '2026-01-01' },
                { id: 2, user_id: 1, name: 'Plan 2', distance: 21, target_pace: 300, total_time: 4200, elevation_profile: 'rolling', fatigue: 2, splits: JSON.stringify([{ km: 1 }]), nutrition_strategy: null, created_at: '2026-01-02' },
            ]);
            const res = await request(app)
                .get('/api/race-planning/list?page=1&limit=10');
            expect(res.status).toBe(200);
            expect(res.body.pagination.page).toBe(1);
            expect(res.body.pagination.limit).toBe(10);
            expect(res.body.pagination.pages).toBe(3);
            expect(res.body.pagination.hasNext).toBe(true);
        });
    });

    describe('DELETE /api/race-planning/:id', () => {
        test('should delete a race plan', async () => {
            getUserDb.mockResolvedValue({});
            dbRunUser.mockResolvedValue({});
            const res = await request(app)
                .delete('/api/race-planning/1');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('POST /api/race-planning/race-strategy', () => {
        test('should return 400 for missing points/gpxData', async () => {
            const res = await request(app)
                .post('/api/race-planning/race-strategy')
                .send({});
            expect(res.status).toBe(400);
            expect(res.body.error).toContain('parcours');
        });

        test('should generate strategy with valid points', async () => {
            dbGetMain.mockResolvedValue({
                profile_data: JSON.stringify({ vdot: 45, weight: 70 }),
            });
            const res = await request(app)
                .post('/api/race-planning/race-strategy')
                .send({
                    points: [
                        { dist: 0, ele: 100, lat: 48.8566, lon: 2.3522 },
                        { dist: 1000, ele: 115, lat: 48.8666, lon: 2.3622 },
                    ],
                });
            expect(res.status).toBe(200);
            expect(res.body.segments).toBeDefined();
            expect(res.body.summary).toBeDefined();
        });
    });
});
