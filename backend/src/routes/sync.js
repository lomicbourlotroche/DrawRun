/**
 * ============================================================
 * SYNC ROUTES
 * ============================================================
 * Synchronisation multi-plateformes (unofficial)
 * - Strava: Playwright web scraping (email/password)
 * - Garmin: Python garminconnect library (email/password)
 * - Suunto: cloud.suunto.com reverse-engineered API (email/password)
 * - Decathlon: Official OAuth2 PKCE API
 *
 * Le sync est ASYNCHRONE : POST /api/sync répond immédiatement avec un jobId,
 * le client poll GET /api/sync/job/:id pour suivre la progression.
 */

'use strict';
const { logger } = require('../utils/logger');

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const { verifyToken } = require('./auth');
const { performSync: performStravaSync } = require('../services/sync/strava');
const { performGarminSync } = require('../services/sync/garmin');
const { performSuuntoSync } = require('../services/sync/suunto');
const { performDecathlonSync } = require('../services/sync/decathlon');

const router = express.Router();

// ---------------------------------------------------------------------------
// In-memory job store (TTL 30 min)
// ---------------------------------------------------------------------------

const JOB_TTL_MS = 30 * 60 * 1000;

/** @type {Map<string, {userId: number, source: string, status: string, result: any, error: string|null, startedAt: number, finishedAt: number|null}>} */
const jobs = new Map();

// Cleanup expired jobs every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [id, job] of jobs.entries()) {
        if (now - job.startedAt > JOB_TTL_MS) {
            jobs.delete(id);
        }
    }
}, 10 * 60 * 1000);

function createJob(userId, source) {
    const id = crypto.randomBytes(12).toString('hex');
    jobs.set(id, {
        userId,
        source,
        status: 'running',
        result: null,
        error: null,
        startedAt: Date.now(),
        finishedAt: null,
    });
    return id;
}

function finishJob(id, result) {
    const job = jobs.get(id);
    if (job) {
        job.status = 'done';
        job.result = result;
        job.finishedAt = Date.now();
    }
}

function failJob(id, error) {
    const job = jobs.get(id);
    if (job) {
        job.status = 'error';
        job.error = error;
        job.finishedAt = Date.now();
    }
}

// ---------------------------------------------------------------------------
// POST /api/sync — lance le sync en arrière-plan, répond immédiatement
// ---------------------------------------------------------------------------

router.post('/', verifyToken, async (req, res) => {
    const { source } = req.body;
    const userId = req.user.id;

    const jobId = createJob(userId, source || 'all');

    // Répondre immédiatement — le client poll /api/sync/job/:id
    res.json({ jobId, status: 'running', message: 'Sync started' });

    // Exécuter le sync en arrière-plan (sans await)
    runSync(userId, source, jobId).catch((err) => {
        logger.error('Sync background error:', { error: err.message, userId, source });
        failJob(jobId, err.message);
    });
});

async function runSync(userId, source, jobId) {
    try {
        const result = {};

        if (!source || source === 'garmin') {
            logger.info(`[Sync][Job ${jobId}] Starting Garmin sync for user ${userId}`);
            result.garmin = await performGarminSync(userId);
        }
        if (!source || source === 'strava') {
            logger.info(`[Sync][Job ${jobId}] Starting Strava sync for user ${userId}`);
            result.strava = await performStravaSync(userId);
        }
        if (!source || source === 'suunto') {
            logger.info(`[Sync][Job ${jobId}] Starting Suunto sync for user ${userId}`);
            result.suunto = await performSuuntoSync(userId);
        }
        if (!source || source === 'decathlon') {
            logger.info(`[Sync][Job ${jobId}] Starting Decathlon sync for user ${userId}`);
            result.decathlon = await performDecathlonSync(userId);
        }

        finishJob(jobId, result);
        logger.info(`[Sync][Job ${jobId}] All syncs complete for user ${userId}`);
    } catch (error) {
        failJob(jobId, error.message);
        logger.error(`[Sync][Job ${jobId}] Failed for user ${userId}:`, { error: error.message });
    }
}

// ---------------------------------------------------------------------------
// GET /api/sync/job/:id — polling du statut d'un job
// ---------------------------------------------------------------------------

router.get('/job/:id', verifyToken, (req, res) => {
    const job = jobs.get(req.params.id);

    if (!job) {
        return res.status(404).json({ error: 'Job not found or expired' });
    }

    // Sécurité : un utilisateur ne peut voir que ses propres jobs
    if (job.userId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({
        jobId: req.params.id,
        status: job.status,       // 'running' | 'done' | 'error'
        source: job.source,
        result: job.result,
        error: job.error,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        elapsedMs: job.finishedAt ? job.finishedAt - job.startedAt : Date.now() - job.startedAt,
    });
});

// ---------------------------------------------------------------------------
// GET /api/sync/status — statut des intégrations configurées
// ---------------------------------------------------------------------------

router.get('/status', verifyToken, async (req, res) => {
    try {
        const { getStravaSyncStatus } = require('../services/sync/strava');
        const { getGarminSyncStatus } = require('../services/sync/garmin');
        const { getSuuntoSyncStatus } = require('../services/sync/suunto');
        const { getDecathlonSyncStatus } = require('../services/sync/decathlon');

        const [strava, garmin, suunto, decathlon] = await Promise.all([
            getStravaSyncStatus(req.user.id),
            getGarminSyncStatus(req.user.id),
            getSuuntoSyncStatus(req.user.id),
            getDecathlonSyncStatus(req.user.id),
        ]);

        res.json({
            strava,
            garmin,
            suunto,
            decathlon,
            available: {
                strava: true,
                garmin: true,
                suunto: true,
                decathlon: !!process.env.DECATHLON_CLIENT_ID,
            },
        });
    } catch (error) {
        logger.error('Sync status error:', error);
        res.status(500).json({ error: 'Failed to get sync status' });
    }
});

// ---------------------------------------------------------------------------
// Endpoints de gestion des sessions/tokens
// ---------------------------------------------------------------------------

router.post('/strava/clear-session', verifyToken, async (req, res) => {
    try {
        const { clearStravaSession } = require('../services/sync/strava');
        const result = await clearStravaSession(req.user.id);
        res.json(result);
    } catch (error) {
        logger.error('Clear Strava session error:', error);
        res.status(500).json({ error: 'Failed to clear session' });
    }
});

router.post('/garmin/clear-tokens', verifyToken, async (req, res) => {
    try {
        const { clearGarminTokens } = require('../services/sync/garmin');
        const result = await clearGarminTokens(req.user.id);
        res.json(result);
    } catch (error) {
        logger.error('Clear Garmin tokens error:', error);
        res.status(500).json({ error: 'Failed to clear tokens' });
    }
});

router.post('/suunto/clear-token', verifyToken, async (req, res) => {
    try {
        const { clearSuuntoToken } = require('../services/sync/suunto');
        const result = await clearSuuntoToken(req.user.id);
        res.json(result);
    } catch (error) {
        logger.error('Clear Suunto token error:', error);
        res.status(500).json({ error: 'Failed to clear token' });
    }
});

router.get('/decathlon/url', verifyToken, async (req, res) => {
    if (!process.env.DECATHLON_CLIENT_ID) {
        return res.status(503).json({ error: 'Decathlon integration not configured on this server' });
    }
    try {
        const { getDecathlonAuthUrl } = require('../services/sync/decathlon');
        const url = await getDecathlonAuthUrl(req.user.id);
        res.json({ url });
    } catch (error) {
        logger.error('Get Decathlon URL error:', error);
        res.status(500).json({ error: 'Failed to get Decathlon auth URL' });
    }
});

router.get('/decathlon/callback', async (req, res) => {
    // ⚠️ PAS de verifyToken ici — Decathlon redirige le navigateur sans JWT
    // On identifie l'utilisateur via le paramètre `state` (userId) passé lors de la génération de l'URL
    try {
        const { code, state } = req.query;
        if (!code) {
            return res.redirect('https://drawrun.fr/profile?decathlon=error&reason=no_code');
        }
        if (!state) {
            return res.redirect('https://drawrun.fr/profile?decathlon=error&reason=no_state');
        }

        const userId = parseInt(String(state), 10);
        if (!userId || isNaN(userId)) {
            return res.redirect('https://drawrun.fr/profile?decathlon=error&reason=invalid_state');
        }

        const fs = require('fs');
        const path = require('path');
        const tempPath = path.join(
            __dirname, '..', 'data', 'decathlon_tokens',
            `${userId}_pkce.json`
        );

        let codeVerifier;
        try {
            // eslint-disable-next-line security/detect-non-literal-fs-filename
            const tempData = JSON.parse(fs.readFileSync(tempPath, 'utf8'));
             // Vérifier que le verifier n'est pas trop vieux (10 min max)
             if (Date.now() - tempData.createdAt > 10 * 60 * 1000) {
                 // eslint-disable-next-line security/detect-non-literal-fs-filename
                 fs.unlinkSync(tempPath);
                 return res.redirect('https://drawrun.fr/profile?decathlon=error&reason=expired');
             }
            codeVerifier = tempData.codeVerifier;
            // eslint-disable-next-line security/detect-non-literal-fs-filename
            fs.unlinkSync(tempPath);
        } catch (e) {
            return res.redirect('https://drawrun.fr/profile?decathlon=error&reason=no_verifier');
        }

        const tokenResponse = await axios.post(
            'https://api.decathlon.net/connect/oauth/token',
            new URLSearchParams({
                grant_type: 'authorization_code',
                code: String(code),
                code_verifier: codeVerifier,
                client_id: process.env.DECATHLON_CLIENT_ID || '',
                client_secret: process.env.DECATHLON_CLIENT_SECRET || '',
                redirect_uri: process.env.DECATHLON_REDIRECT_URI || 'https://drawrun.fr/api/sync/decathlon/callback',
            }),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 15000,
            }
        );

        const { access_token, refresh_token, expires_in } = tokenResponse.data;

        const { dbRunMain } = require('../database');
        await dbRunMain(
            `UPDATE users SET
                decathlon_access_token = ?,
                decathlon_refresh_token = ?,
                decathlon_expires_at = ?,
                decathlon_enabled = 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [access_token, refresh_token, Date.now() + (expires_in * 1000), userId]
        );

        logger.info(`[Decathlon] OAuth callback success for user ${userId}`);
        res.redirect('https://drawrun.fr/app/profile?decathlon=connected&tab=sync');
    } catch (error) {
        logger.error('Decathlon callback error:', { error: error.message });
        res.redirect('https://drawrun.fr/app/profile?decathlon=error');
    }
});

router.post('/decathlon/clear-token', verifyToken, async (req, res) => {
    try {
        const { clearDecathlonToken } = require('../services/sync/decathlon');
        const result = await clearDecathlonToken(req.user.id);
        res.json(result);
    } catch (error) {
        logger.error('Clear Decathlon token error:', error);
        res.status(500).json({ error: 'Failed to clear token' });
    }
});

router.get('/strava/url', verifyToken, async (req, res) => {
    try {
        const { getStravaAuthUrl } = require('../services/sync/strava');
        const url = await getStravaAuthUrl(req.user.id);
        res.json({ url });
    } catch (error) {
        logger.error('Get Strava URL error:', error);
        res.status(500).json({ error: 'Failed to get Strava auth URL' });
    }
});

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
                activity.calories || 0,
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
