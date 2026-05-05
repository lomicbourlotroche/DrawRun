/**
 * ============================================================
 * DRAWRUN BACKEND v4.1 - Point d'entrée principal (Refactorisé)
 * ============================================================
 * 
 * Architecture modulaire avec routes séparées
 * - Per-User Database
 * - Modular routes structure
 * 
 * @module index
 */

'use strict';

// ============================================================================
// CONFIGURATION
// ============================================================================
require('dotenv').config();

// ============================================================================
// STARTUP VALIDATION - Fail fast on missing critical config
// ============================================================================
if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is required');
    // eslint-disable-next-line no-process-exit
    process.exit(1);
}

const config = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET,
    CORS_ORIGINS: process.env.CORS_ORIGINS || (process.env.NODE_ENV === 'production' ? null : 'http://localhost:3001')
};

if (process.env.NODE_ENV === 'production' && !config.CORS_ORIGINS) {
    console.error('FATAL: CORS_ORIGINS must be set in production');
    // eslint-disable-next-line no-process-exit
    process.exit(1);
}

// ============================================================================
// STARTUP TESTS — run Jest suite before accepting traffic
// Only in development/test; skipped in production for fast boot.
// ============================================================================
if (process.env.NODE_ENV !== 'production') {
    const { execSync } = require('child_process');
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║         🧪  Running startup test suite…          ║');
    console.log('╚══════════════════════════════════════════════════╝\n');
    try {
        execSync('npm test -- --passWithNoTests --forceExit', {
            cwd: __dirname,
            stdio: 'inherit',
            timeout: 120000
        });
        console.log('\n╔══════════════════════════════════════════════════╗');
        console.log('║         ✅  All tests passed — starting server   ║');
        console.log('╚══════════════════════════════════════════════════╝\n');
    } catch (err) {
        console.error('\n╔══════════════════════════════════════════════════╗');
        console.error('║   ❌  Tests FAILED — server will NOT start       ║');
        console.error('╚══════════════════════════════════════════════════╝\n');
        // eslint-disable-next-line no-process-exit
        process.exit(1);
    }
}

// ============================================================================
// CHARGEMENT MODULES
// ============================================================================
const { logger } = require('./src/logger');
logger.info('Loading database...');
const database = require('./src/database');

// Wait for database initialization
(async () => {
    try {
        // Wait for main database to be ready
        await database.initMainDb();
        
        logger.info('Loading modules...');
        const { router: authRouter, verifyToken } = require('./src/auth');
        const apiRoutes = require('./src/api_routes');
        
        // ============================================================================
        // CACHE SERVICE INITIALIZATION
        // ============================================================================
        logger.info('Initializing cache service...');
        const cacheService = require('./src/services/cache');
        await cacheService.init();
        
        // ============================================================================
        // PUSH NOTIFICATION SERVICE INITIALIZATION
        // ============================================================================
        logger.info('Initializing push notification service...');
        const { initializeVapidKeys } = require('./src/services/push.service');
        initializeVapidKeys();
        
        // ============================================================================
        // ROUTES MODULAIRES
        // ============================================================================
        logger.info('Loading modular routes...');
        const profileRoutes = require('./src/routes/profile');
        const activitiesRoutes = require('./src/routes/activities');
        const pmcRoutes = require('./src/routes/pmc');
        const syncRoutes = require('./src/routes/sync');
        const metricsRoutes = require('./src/routes/metrics');
        const preferencesRoutes = require('./src/routes/preferences');
        const onboardingRoutes = require('./src/routes/onboarding');
        const overtrainingRoutes = require('./src/routes/overtraining');
        const tssRoutes = require('./src/routes/tss');
        const socialRoutes = require('./src/routes/social');
        const coachRoutes = require('./src/routes/coach');
        const exploreRoutes = require('./src/routes/explore');
        const notificationsRoutes = require('./src/routes/notifications');
        const racePlanningRoutes = require('./src/routes/race_planning');
        const weatherRoutes = require('./src/routes/weather');
        const shareRoutes = require('./src/routes/share');
        
        // ============================================================================
        // EXPRESS SERVER
        // ============================================================================
        const express = require('express');
        const cors = require('cors');
        const { configureHelmet, cspReportHandler, authLimiter, syncLimiter, userBasedLimiter, sensitiveUserLimiter, sanitizeInputs, securityHeaders, validateCorsOrigin } = require('./src/middleware/security');
        const { cacheMiddleware, noCacheMiddleware } = require('./src/middleware/cache');
        const { compressionMiddleware, performanceMetrics } = require('./src/performance');
        
        const app = express();
        const PORT = config.PORT;
        
        // Trust first proxy (nginx) for accurate client IP detection
        app.set('trust proxy', 1);
        
        // ============================================================================
        // MIDDLEWARE
        // ============================================================================
        // Security headers (Helmet CSP, HSTS, etc.)
        app.use(configureHelmet());
        app.use(securityHeaders);
        
        // Response compression (gzip/brotli for responses > 1KB)
        app.use(compressionMiddleware);
        
        // Track request metrics
        app.use((req, res, next) => {
            performanceMetrics.requests++;
            const start = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - start;
                logger.debug(`[PerfMetrics] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
            });
            next();
        });
        
        // ============================================================================
        // MIDDLEWARE
        // ============================================================================
        // Security headers (Helmet CSP, HSTS, etc.)
        app.use(configureHelmet());
        app.use(securityHeaders);
        
        // CORS — utilise validateCorsOrigin (fail-closed en production)
        app.use(cors({ origin: validateCorsOrigin, credentials: true }));
        
        app.use(express.json({ limit: '10mb' }));
        app.use(express.urlencoded({ extended: true }));
        
        // Serve uploaded avatars
        const path = require('path');
        app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
        
        // Sanitize all string inputs (trim + 10k char limit)
        app.use(sanitizeInputs);
        
        // Rate limiting
        app.use('/api/auth', authLimiter);
        app.use('/api/sync', syncLimiter);
        // Use user-based limiter for authenticated routes (applied after verifyToken)
        app.use('/api', userBasedLimiter);
        
        // ============================================================================
        // METRICS SERVICE
        // ============================================================================
        const metricsService = require('./src/services/metrics');
        app.use(metricsService.middleware());
        
        // ============================================================================
        // SWAGGER DOCUMENTATION
        // ============================================================================
        const { setupSwagger } = require('./src/swagger');
        setupSwagger(app);
        
        // ============================================================================
        // PROMETHEUS METRICS ENDPOINT
        // ============================================================================
        app.get('/metrics', async (req, res) => {
            try {
                res.set('Content-Type', metricsService.getContentType());
                res.end(await metricsService.getMetrics());
            } catch (ex) {
                logger.error('Prometheus metrics error:', ex.message);
                res.status(500).end('Metrics unavailable');
            }
        });
        
        // ============================================================================
        // HEALTH CHECK
        // ============================================================================
        app.get('/health', async (req, res) => {
            const cacheHealth = await cacheService.healthCheck();
            
            res.json({ 
                status: 'running', 
                message: 'DrawRun API Server is running. 🚀',
                timestamp: new Date().toISOString(),
                version: '4.1.0',
                cache: cacheHealth
            });
        });
        
        // ============================================================================
        // CSP VIOLATION REPORTING
        // ============================================================================
        app.post('/api/csp-report', express.json({ type: ['application/json', 'application/csp-report'] }), cspReportHandler);
        
        // ============================================================================
        // CACHE API
        // ============================================================================
        app.get('/api/cache/stats', verifyToken, async (req, res) => {
            const stats = await cacheService.healthCheck();
            res.json(stats);
        });
        
        app.post('/api/cache/clear', verifyToken, async (req, res) => {
            await cacheService.clear();
            res.json({ success: true, message: 'Cache cleared' });
        });
        
        // Performance metrics endpoint
        app.get('/api/performance/stats', verifyToken, async (req, res) => {
            res.json(performanceMetrics.toJSON());
        });
        
        // ============================================================================
        // ROUTES MODULAIRES
        // ============================================================================
        
        // Auth & API
        app.use('/api/auth', authRouter);
        app.use('/api', apiRoutes);
        
        // Feature routes - using user-based rate limiting + cache
        // Routes avec cache long (données qui changent peu)
        app.use('/api/profile', verifyToken, sensitiveUserLimiter, cacheMiddleware(600), profileRoutes);
        app.use('/api/activities', verifyToken, userBasedLimiter, cacheMiddleware(120), activitiesRoutes);
        app.use('/api/activities', verifyToken, userBasedLimiter, cacheMiddleware(3600), weatherRoutes);
        app.use('/api/activities', verifyToken, userBasedLimiter, noCacheMiddleware, shareRoutes);
        app.use('/api/pmc', verifyToken, userBasedLimiter, cacheMiddleware(300), pmcRoutes);
        app.use('/api/sync', verifyToken, syncLimiter, noCacheMiddleware, syncRoutes);
        app.use('/api/metrics', verifyToken, userBasedLimiter, cacheMiddleware(60), metricsRoutes);
        app.use('/api/preferences', verifyToken, sensitiveUserLimiter, cacheMiddleware(600), preferencesRoutes);
        app.use('/api/onboarding', verifyToken, userBasedLimiter, cacheMiddleware(3600), onboardingRoutes);
        app.use('/api/overtraining', verifyToken, userBasedLimiter, cacheMiddleware(300), overtrainingRoutes);
        app.use('/api/tss', verifyToken, userBasedLimiter, cacheMiddleware(300), tssRoutes);
        app.use('/api/social', verifyToken, userBasedLimiter, cacheMiddleware(60), socialRoutes);
        app.use('/api/coach', verifyToken, sensitiveUserLimiter, cacheMiddleware(300), coachRoutes);
        app.use('/api/explore', verifyToken, userBasedLimiter, cacheMiddleware(600), exploreRoutes);
        app.use('/api/notifications', verifyToken, userBasedLimiter, noCacheMiddleware, notificationsRoutes);
        app.use('/api/race-planning', verifyToken, userBasedLimiter, noCacheMiddleware, racePlanningRoutes);
        
        // Legacy route aliases (pour compatibilité)
        app.use('/api/recommendations', verifyToken, pmcRoutes);
        
        // ============================================================================
        // ERROR HANDLER
        // ============================================================================
        
        app.use((err, req, res, _next) => {
            logger.error('Unhandled error:', { message: err.message, stack: err.stack });
            const isProd = process.env.NODE_ENV === 'production';
            res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
        });
        
        // ============================================================================
        // START SERVER
        // ============================================================================
        
        app.listen(PORT, () => {
            logger.info(`DrawRun Backend v4.1.0 running on port ${PORT}`);
            logger.info(`Health check: http://localhost:${PORT}/health`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info('Modular routes loaded');
        });
        
    } catch (err) {
        logger.error(`Failed to start server: ${err.message}`);
        // eslint-disable-next-line no-process-exit
        process.exit(1);
    }
})();
