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
const { performDecathlonSync } = require('../decathlon_sync');

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
        if (!source || source === 'decathlon') {
            result.decathlon = await performDecathlonSync(req.user.id);
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

        const { getDecathlonSyncStatus } = require('../decathlon_sync');

        const [strava, garmin, suunto, decathlon] = await Promise.all([
            getStravaSyncStatus(req.user.id),
            getGarminSyncStatus(req.user.id),
            getSuuntoSyncStatus(req.user.id),
            getDecathlonSyncStatus(req.user.id),
        ]);

        res.json({ strava, garmin, suunto, decathlon });
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

// GET /api/sync/decathlon/url - OAuth authorization URL
router.get('/decathlon/url', verifyToken, async (req, res) => {
    try {
        const { getDecathlonAuthUrl } = require('../decathlon_sync');
        const url = await getDecathlonAuthUrl(req.user.id);
        res.json({ url });
    } catch (error) {
        logger.error('Get Decathlon URL error:', error);
        res.status(500).json({ error: 'Failed to get Decathlon auth URL' });
    }
});

// GET /api/sync/decathlon/callback - OAuth callback (GET with query params)
router.get('/decathlon/callback', verifyToken, async (req, res) => {
    try {
        const { code, state } = req.query;
        if (!code) {
            return res.status(400).json({ error: 'Authorization code required' });
        }

        // Read code_verifier from temporary file
        const fs = require('fs');
        const path = require('path');
        const { getTokenPath } = require('../decathlon_sync');
        const tempPath = path.join(getTokenPath(req.user.id).replace('.json', '_pkce.json'));
        
        let codeVerifier;
        try {
            const tempData = JSON.parse(fs.readFileSync(tempPath, 'utf8'));
            codeVerifier = tempData.codeVerifier;
            // Clean up temp file
            fs.unlinkSync(tempPath);
        } catch (e) {
            return res.status(400).json({ error: 'PKCE verifier not found. Restart the flow.' });
        }

        // Exchange code for tokens
        const tokenResponse = await axios.post(
            'https://api-eu.decathlon.net/connect/oauth/token',
            new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                code_verifier,
                client_id: process.env.DECATHLON_CLIENT_ID,
                redirect_uri: process.env.DECATHLON_REDIRECT_URI,
            }),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 15000,
            }
        );

        const { access_token, refresh_token, expires_in } = tokenResponse.data;

        // Save tokens to user record
        const { dbRunMain } = require('../database');
        await dbRunMain(
            `UPDATE users SET
                decathlon_access_token = ?,
                decathlon_refresh_token = ?,
                decathlon_expires_at = ?,
                decathlon_enabled = 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [access_token, refresh_token, Date.now() + (expires_in * 1000), req.user.id]
        );

        // Redirect to frontend with success
        res.redirect(process.env.FRONTEND_URL || 'http://localhost:3001/profile?decathlon=connected');
    } catch (error) {
        logger.error('Decathlon callback error:', error);
        res.redirect(process.env.FRONTEND_URL || 'http://localhost:3001/profile?decathlon=error');
    }
});

// POST /api/sync/decathlon/clear-token
router.post('/decathlon/clear-token', verifyToken, async (req, res) => {
    try {
        const { clearDecathlonToken } = require('../decathlon_sync');
        const result = await clearDecathlonToken(req.user.id);
        res.json(result);
    } catch (error) {
        logger.error('Clear Decathlon token error:', error);
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
