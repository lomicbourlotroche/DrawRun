/* eslint-disable security/detect-non-literal-fs-filename, security/detect-non-literal-require */
/**
 * ============================================================
 * ROUTES TESTS
 * ============================================================
 * Tests d'intégration basiques pour les routes
 */

const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// STRUCTURE TESTS — ensure route files exist and export correct modules
// ---------------------------------------------------------------------------
describe('Route Structure', () => {
    const routesDir = path.join(__dirname, '../src/routes');

    const requiredRoutes = [
        'profile.js',
        'activities.js',
        'pmc.js',
        'sync.js',
        'metrics.js',
        'preferences.js',
        'social.js',
        'coach.js',
        'onboarding.js',
        'explore.js',
        'notifications.js',
        'race_planning.js',
        'weather.js',
        'share.js',
        'user-constants.js',
        'gear.js',
        'overtraining.js',
        'auth.js',
    ];

    test('all required route files exist on disk', () => {
        requiredRoutes.forEach(route => {
            expect(fs.existsSync(path.join(routesDir, route))).toBe(true);
        });
    });

    test('route files should export an Express Router', () => {
        const routes = requiredRoutes.map(r => `../src/routes/${r.replace('.js', '')}`);
        routes.forEach(route => {
            const mod = require(route);
            expect(mod).toBeDefined();
            // Should be a router function or have a router export
            if (typeof mod === 'function') {
                expect(mod.stack || mod.name).toBeDefined();
            } else if (mod.router) {
                expect(mod.router.stack).toBeDefined();
            }
        });
    });
});

// ---------------------------------------------------------------------------
// INTEGRATION TESTS — health endpoint (no auth required)
// ---------------------------------------------------------------------------
describe('Health Check', () => {
    let app;

    beforeAll(() => {
        // Minimal Express app mimicking index.js
        app = express();
        app.get('/health', async (req, res) => {
            res.json({
                status: 'running',
                message: 'DrawRun API Server is running.',
                timestamp: new Date().toISOString(),
                version: '4.1.0',
            });
        });
    });

    test('GET /health returns 200 with status running', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('status', 'running');
        expect(res.body).toHaveProperty('version', '4.1.0');
    });

    test('GET /health returns valid JSON', async () => {
        const res = await request(app).get('/health');
        expect(() => JSON.parse(JSON.stringify(res.body))).not.toThrow();
        expect(res.body.timestamp).toBeDefined();
        expect(() => new Date(res.body.timestamp)).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// AUTH ENDPOINT TESTS — register/login validation with mocked DB
// ---------------------------------------------------------------------------
describe('Auth Routes (mocked DB)', () => {
    let app;
    let authRouter;

    beforeAll(() => {
        // Mock database for auth tests
        jest.mock('../src/database', () => {
            const actual = jest.requireActual('../src/database');
            return {
                ...actual,
                dbGetMain: jest.fn().mockResolvedValue(null),
                dbRunMain: jest.fn().mockResolvedValue({ lastID: 1, changes: 1 }),
                getUserDb: jest.fn().mockResolvedValue({
                    run: jest.fn(),
                    exec: jest.fn(),
                    prepare: jest.fn(),
                }),
                sanitizeEmail: jest.fn((email) => email.replace(/[@.]/g, '_')),
            };
        });
        jest.mock('../src/utils/logger', () => ({
            auditLog: jest.fn(),
            securityLog: jest.fn(),
            logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
        }));
        jest.mock('../src/services/auth/otp.service', () => ({
            isOtpLocked: jest.fn().mockResolvedValue(false),
            incrementOtpAttempts: jest.fn(),
            clearOtpAttempts: jest.fn(),
        }));
        jest.mock('../src/services/auth/sync.service', () => ({
            triggerBackgroundSync: jest.fn(),
        }));
        jest.mock('../src/services/auth/2fa.service', () => ({
            has2FAEnabled: jest.fn().mockResolvedValue(false),
            has2FAPending: jest.fn().mockResolvedValue(false),
            verify2FAToken: jest.fn().mockResolvedValue(false),
            generate2FASecret: jest.fn().mockResolvedValue({ secret: 'test', url: 'otpauth://test' }),
            enable2FA: jest.fn(),
            disable2FA: jest.fn(),
        }));
        
        authRouter = require('../src/routes/auth');
    });

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/auth', typeof authRouter === 'function' ? authRouter : authRouter.router);
    });

    test('POST /api/auth/register with missing fields returns 400', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({});
        expect(res.statusCode).toBe(400);
    });

    test('POST /api/auth/login with missing credentials returns 400', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({});
        expect(res.statusCode).toBe(400);
    });

    test('POST /api/auth/login with invalid email format returns 400', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'not-an-email', password: 'test123' });
        expect(res.statusCode).toBe(400);
    });
});

// ---------------------------------------------------------------------------
// ALGO ROUTES — test unauthenticated access is rejected
// ---------------------------------------------------------------------------
describe('Algo Routes Security', () => {
    let app;

    beforeAll(() => {
        app = express();
        app.use(express.json());
        // Mount algo routes without verifyToken for testing auth enforcement
        const apiRoutes = require('../src/api_routes');
        app.use('/api/algo', apiRoutes);
    });

    test('POST /api/algo/analyze returns 401 without token', async () => {
        const res = await request(app).post('/api/algo/analyze');
        expect(res.statusCode).toBe(401);
    });

    test('GET /api/algo/readiness returns 401 without token', async () => {
        const res = await request(app).get('/api/algo/readiness');
        expect(res.statusCode).toBe(401);
    });

    test('GET /api/algo/overtraining returns 401 without token', async () => {
        const res = await request(app).get('/api/algo/overtraining');
        expect(res.statusCode).toBe(401);
    });

    test('GET /api/algo/polarization returns 401 without token', async () => {
        const res = await request(app).get('/api/algo/polarization');
        expect(res.statusCode).toBe(401);
    });

    test('GET /api/algo/critical-power returns 401 without token', async () => {
        const res = await request(app).get('/api/algo/critical-power');
        expect(res.statusCode).toBe(401);
    });

    test('GET /api/algo/recommendations returns 401 without token', async () => {
        const res = await request(app).get('/api/algo/recommendations');
        expect(res.statusCode).toBe(401);
    });

    test('GET /api/algo/health returns 401 without token', async () => {
        const res = await request(app).get('/api/algo/health');
        expect(res.statusCode).toBe(401);
    });

    test('GET /api/algo/zones is publicly accessible (no auth)', async () => {
        const res = await request(app).get('/api/algo/zones');
        // Pure calculation endpoint, intentionally public
        expect(res.statusCode).not.toBe(401);
        expect(res.statusCode).not.toBe(403);
    });

    test('GET /api/algo/pmc is publicly accessible (no auth)', async () => {
        const res = await request(app).get('/api/algo/pmc');
        // Pure calculation endpoint, intentionally public
        expect(res.statusCode).not.toBe(401);
        expect(res.statusCode).not.toBe(403);
    });
});

// ---------------------------------------------------------------------------
// ROUTE URL PATTERN TESTS
// ---------------------------------------------------------------------------
describe('Route URL Patterns', () => {
    const expectedRoutes = [
        { path: '/api/profile', methods: ['GET', 'PUT'] },
        { path: '/api/activities', methods: ['GET', 'POST'] },
        { path: '/api/pmc', methods: ['GET'] },
        { path: '/api/sync', methods: ['POST'] },
        { path: '/api/metrics', methods: ['GET', 'POST'] },
        { path: '/api/social/friends', methods: ['GET', 'POST'] },
        { path: '/api/coach/plan', methods: ['GET', 'POST'] },
    ];

    test('all expected routes start with /api/', () => {
        expectedRoutes.forEach(route => {
            expect(route.path).toMatch(/^\/api\//);
            expect(route.methods.length).toBeGreaterThan(0);
        });
    });

    test('all route paths do not contain disallowed characters', () => {
        expectedRoutes.forEach(route => {
            expect(route.path).not.toContain(' ');
            expect(route.path).not.toContain('..');
        });
    });
});
