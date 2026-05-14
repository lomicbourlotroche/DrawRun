/**
 * ============================================================
 * SYNC ROUTES TESTS — Garmin-only
 * ============================================================
 * Vérifie que :
 * - POST /api/sync crée un job et répond immédiatement
 * - GET /api/sync/job/:id retourne le statut du job
 * - GET /api/sync/status ne retourne QUE garmin (pas strava/suunto/decathlon)
 * - POST /api/sync/garmin/clear-tokens fonctionne
 * - Les anciens endpoints strava/suunto/decathlon sont 404
 * - POST /healthconnect fonctionne
 */

jest.mock('../../src/services/sync/garmin', () => ({
    performGarminSync: jest.fn().mockResolvedValue({ success: true, imported: 5 }),
    getGarminSyncStatus: jest.fn().mockResolvedValue({
        source: 'garmin',
        last_sync: '2026-05-13T10:00:00.000Z',
        status: 'idle',
        configured: true,
        has_tokens: true,
    }),
    clearGarminTokens: jest.fn().mockResolvedValue({ success: true }),
    callGarminApi: jest.fn(),
    triggerManualSync: jest.fn(),
}));

jest.mock('../../src/database', () => ({
    dbGetMain: jest.fn().mockResolvedValue({ garmin_username: 'test@test.com' }),
    dbRunMain: jest.fn().mockResolvedValue({ lastID: 1, changes: 1 }),
    dbAllMain: jest.fn().mockResolvedValue([]),
    getUserDb: jest.fn().mockResolvedValue({
        run: jest.fn(),
        exec: jest.fn(),
        prepare: jest.fn(),
    }),
    getUserDbByEmail: jest.fn(),
    sanitizeEmail: jest.fn((email) => email.replace(/[@.]/g, '_')),
    dbGetUser: jest.fn().mockResolvedValue(null),
    dbRunUser: jest.fn().mockResolvedValue({ lastID: 1, changes: 1 }),
    dbAllUser: jest.fn().mockResolvedValue([]),
    initMainDb: jest.fn().mockResolvedValue(undefined),
    isInitialized: jest.fn().mockReturnValue(true),
}));

jest.mock('../../src/utils/logger', () => ({
    auditLog: jest.fn(),
    securityLog: jest.fn(),
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

// Mock verifyToken pour qu'il set req.user et passe au handler
jest.mock('../../src/routes/auth', () => {
    const actual = jest.requireActual('../../src/routes/auth');
    return {
        ...actual,
        verifyToken: (req, res, next) => {
            req.user = { id: 1, email: 'test@test.com' };
            next();
        },
    };
});

const request = require('supertest');
const express = require('express');

describe('Sync Routes — Garmin-only', () => {
    let app;

    beforeEach(() => {
        jest.clearAllMocks();
        app = express();
        app.use(express.json());
        app.use('/api/sync', require('../../src/routes/sync'));
    });

    // ====================================================================
    // POST /api/sync
    // ====================================================================

    describe('POST /api/sync', () => {
        test('returns a jobId immediately', async () => {
            const res = await request(app)
                .post('/api/sync')
                .send({});

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('jobId');
            expect(res.body.status).toBe('running');
            expect(typeof res.body.jobId).toBe('string');
        });

        test('creates unique jobId for each call', async () => {
            const [res1, res2] = await Promise.all([
                request(app).post('/api/sync').send({}),
                request(app).post('/api/sync').send({}),
            ]);

            expect(res1.body.jobId).not.toBe(res2.body.jobId);
        });
    });

    // ====================================================================
    // GET /api/sync/job/:id
    // ====================================================================

    describe('GET /api/sync/job/:id', () => {
        test('returns 404 for unknown job', async () => {
            const res = await request(app)
                .get('/api/sync/job/unknown-job-id');

            expect(res.status).toBe(404);
            expect(res.body.error).toBe('Job not found or expired');
        });

        test('returns job status for valid job', async () => {
            const createRes = await request(app).post('/api/sync').send({});
            const jobId = createRes.body.jobId;

            const res = await request(app)
                .get(`/api/sync/job/${jobId}`);

            expect(res.status).toBe(200);
            expect(res.body.jobId).toBe(jobId);
            expect(res.body.status).toMatch(/^(running|done|error)$/);
            expect(res.body).toHaveProperty('startedAt');
            expect(res.body).toHaveProperty('source');
        });
    });

    // ====================================================================
    // GET /api/sync/status
    // ====================================================================

    describe('GET /api/sync/status', () => {
        test('returns only garmin status (no strava/suunto/decathlon)', async () => {
            const res = await request(app).get('/api/sync/status');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('garmin');
            expect(res.body.garmin).toHaveProperty('source', 'garmin');
            expect(res.body.garmin).toHaveProperty('configured');
            expect(res.body.garmin).toHaveProperty('last_sync');
            expect(res.body).toHaveProperty('available');
            expect(res.body.available).toEqual({ garmin: true });

            // Vérifier l'absence des anciens providers
            expect(res.body).not.toHaveProperty('strava');
            expect(res.body).not.toHaveProperty('suunto');
            expect(res.body).not.toHaveProperty('decathlon');
            expect(res.body.available).not.toHaveProperty('strava');
            expect(res.body.available).not.toHaveProperty('suunto');
            expect(res.body.available).not.toHaveProperty('decathlon');
        });

        test('garmin status includes all required fields', async () => {
            const res = await request(app).get('/api/sync/status');

            expect(res.body.garmin).toMatchObject({
                source: 'garmin',
                status: expect.stringMatching(/^(idle|syncing|error)$/),
                configured: expect.any(Boolean),
            });
            // has_tokens is optional (depends on fs)
            if (res.body.garmin.has_tokens !== undefined) {
                expect(typeof res.body.garmin.has_tokens).toBe('boolean');
            }
        });
    });

    // ====================================================================
    // POST /api/sync/garmin/clear-tokens
    // ====================================================================

    describe('POST /api/sync/garmin/clear-tokens', () => {
        test('clears Garmin tokens successfully', async () => {
            const res = await request(app)
                .post('/api/sync/garmin/clear-tokens');

            expect(res.status).toBe(200);
            expect(res.body).toEqual({ success: true });
        });

        test('calls clearGarminTokens from garmin service', async () => {
            const { clearGarminTokens } = require('../../src/services/sync/garmin');
            await request(app).post('/api/sync/garmin/clear-tokens');
            expect(clearGarminTokens).toHaveBeenCalledWith(1);
        });
    });

    // ====================================================================
    // Removed endpoints — doivent être 404
    // ====================================================================

    describe('Removed provider endpoints return 404', () => {
        test('POST /api/sync/strava/clear-session returns 404', async () => {
            const res = await request(app)
                .post('/api/sync/strava/clear-session');
            expect(res.status).toBe(404);
        });

        test('POST /api/sync/suunto/clear-token returns 404', async () => {
            const res = await request(app)
                .post('/api/sync/suunto/clear-token');
            expect(res.status).toBe(404);
        });

        test('GET /api/sync/strava/url returns 404', async () => {
            const res = await request(app)
                .get('/api/sync/strava/url');
            expect(res.status).toBe(404);
        });

        test('GET /api/sync/decathlon/url returns 404', async () => {
            const res = await request(app)
                .get('/api/sync/decathlon/url');
            expect(res.status).toBe(404);
        });

        test('POST /api/sync/decathlon/clear-token returns 404', async () => {
            const res = await request(app)
                .post('/api/sync/decathlon/clear-token');
            expect(res.status).toBe(404);
        });

        test('GET /api/sync/decathlon/callback returns 404', async () => {
            const res = await request(app)
                .get('/api/sync/decathlon/callback');
            expect(res.status).toBe(404);
        });

        test('POST /api/sync/healthconnect returns 404', async () => {
            const res = await request(app)
                .post('/api/sync/healthconnect')
                .send([{ type: 'running', start_time: '2026-01-01' }]);
            expect(res.status).toBe(404);
        });
    });
});
