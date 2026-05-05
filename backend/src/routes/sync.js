/**
 * ============================================================
 * SYNC ROUTES
 * ============================================================
 * Synchronisation multi-plateformes (unofficial)
 * - Strava: Playwright web scraping (email/password)
 * - Garmin: Python garminconnect library (email/password)
 * - Suunto: cloud.suunto.com reverse-engineered API (email/password)
 */

'use strict';
const { logger } = require('../logger');

const express = require('express');
const { verifyToken } = require('../auth');
const { performSync: performStravaSync } = require('../strava_sync');
const { performGarminSync } = require('../garmin_sync');
const { performSuuntoSync } = require('../suunto_sync');

const router = express.Router();

// POST /api/sync
router.post('/', verifyToken, async (req, res) => {
    try {
        const { source } = req.body;
        let result = {};

        if (!source || source === 'strava') {
            result.strava = await performStravaSync(req.user.id);
        }
        if (!source || source === 'garmin') {
            result.garmin = await performGarminSync(req.user.id);
        }
        if (!source || source === 'suunto') {
            result.suunto = await performSuuntoSync(req.user.id);
        }

        res.json(result);
    } catch (error) {
        logger.error('Sync error:', error);
        res.status(500).json({ error: 'Sync failed' });
    }
});

// GET /api/sync/status
router.get('/status', verifyToken, async (req, res) => {
    try {
        const { getStravaSyncStatus } = require('../strava_sync');
        const { getGarminSyncStatus } = require('../garmin_sync');
        const { getSuuntoSyncStatus } = require('../suunto_sync');

        const [strava, garmin, suunto] = await Promise.all([
            getStravaSyncStatus(req.user.id),
            getGarminSyncStatus(req.user.id),
            getSuuntoSyncStatus(req.user.id),
        ]);

        res.json({ strava, garmin, suunto });
    } catch (error) {
        logger.error('Sync status error:', error);
        res.status(500).json({ error: 'Failed to get sync status' });
    }
});

// POST /api/sync/strava/clear-session
router.post('/strava/clear-session', verifyToken, async (req, res) => {
    try {
        const { clearStravaSession } = require('../strava_sync');
        const result = await clearStravaSession(req.user.id);
        res.json(result);
    } catch (error) {
        logger.error('Clear Strava session error:', error);
        res.status(500).json({ error: 'Failed to clear session' });
    }
});

// POST /api/sync/garmin/clear-tokens
router.post('/garmin/clear-tokens', verifyToken, async (req, res) => {
    try {
        const { clearGarminTokens } = require('../garmin_sync');
        const result = await clearGarminTokens(req.user.id);
        res.json(result);
    } catch (error) {
        logger.error('Clear Garmin tokens error:', error);
        res.status(500).json({ error: 'Failed to clear tokens' });
    }
});

// POST /api/sync/suunto/clear-token
router.post('/suunto/clear-token', verifyToken, async (req, res) => {
    try {
        const { clearSuuntoToken } = require('../suunto_sync');
        const result = await clearSuuntoToken(req.user.id);
        res.json(result);
    } catch (error) {
        logger.error('Clear Suunto token error:', error);
        res.status(500).json({ error: 'Failed to clear token' });
    }
});

module.exports = router;
