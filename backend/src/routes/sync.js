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

// GET /api/strava/url - OAuth authorization URL
router.get('/strava/url', verifyToken, async (req, res) => {
    try {
        const { getStravaAuthUrl } = require('../strava_sync');
        const url = await getStravaAuthUrl(req.user.id);
        res.json({ url });
    } catch (error) {
        logger.error('Get Strava URL error:', error);
        res.status(500).json({ error: 'Failed to get Strava auth URL' });
    }
});

// POST /api/sync/healthconnect - Import Health Connect activities
router.post('/healthconnect', verifyToken, async (req, res) => {
    try {
        const activities = req.body;
        if (!Array.isArray(activities)) {
            return res.status(400).json({ error: 'Expected array of activities' });
        }
        
        const { getUserDb, dbRunUser } = require('../database');
        const userDb = await getUserDb(req.user.id);
        
        let imported = 0;
        for (const activity of activities) {
            if (!activity.type || !activity.start_time) continue;
            
            await dbRunUser(userDb, `
                INSERT OR IGNORE INTO activities 
                (source, source_id, name, type, start_date, distance, moving_time, calories, is_manual)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
            `, [
                'healthconnect',
                activity.id || `hc-${Date.now()}-${imported}`,
                activity.name || 'Health Connect Activity',
                activity.type,
                activity.start_time,
                activity.distance || 0,
                activity.duration || 0,
                activity.calories || 0
            ]);
            imported++;
        }
        
        res.json({ success: true, imported });
    } catch (error) {
        logger.error('Health Connect sync error:', error);
        res.status(500).json({ error: 'Failed to import Health Connect activities' });
    }
});

module.exports = router;
