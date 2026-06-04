'use strict';
const { logger } = require('../utils/logger');

const express = require('express');
const crypto = require('crypto');
const { verifyToken } = require('../middleware/auth');
const { performGarminSync } = require('../services/sync/garmin');
const { performDecathlonSync, getDecathlonSyncStatus, clearDecathlonTokens } = require('../services/sync/decathlon');
const { performSuuntoSync, getSuuntoSyncStatus, clearSuuntoTokens } = require('../services/sync/suunto');

const router = express.Router();

// ---------------------------------------------------------------------------
// In-memory job store (TTL 30 min)
// ---------------------------------------------------------------------------

const JOB_TTL_MS = 30 * 60 * 1000;

/** @type {Map<string, {userId: number, source: string, status: string, result: any, error: string|null, startedAt: number, finishedAt: number|null}>} */
const jobs = new Map();

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
// POST /api/sync — lance le sync Garmin en arrière-plan
// ---------------------------------------------------------------------------

router.post('/', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const jobId = createJob(userId, 'all');

    const days = req.body?.days ? parseInt(req.body.days, 10) : null;
    const source = req.body?.source; // Optional: sync specific source

    res.json({ jobId, status: 'running', message: 'Sync started' });

    runSync(userId, jobId, { days, source }).catch((err) => {
        logger.error('Sync background error:', { error: err.message, userId });
        failJob(jobId, err.message);
    });
});

async function runSync(userId, jobId, options = {}) {
    try {
        logger.info(`[Sync][Job ${jobId}] Starting sync for user ${userId}`, options);
        
        const result = {};
        
        // Sync Garmin if configured or requested
        if (!options.source || options.source === 'garmin') {
            try {
                result.garmin = await performGarminSync(userId, options);
            } catch (err) {
                result.garmin = { success: false, message: err.message };
            }
        }
        
        // Sync Decathlon if configured or requested
        if (!options.source || options.source === 'decathlon') {
            try {
                result.decathlon = await performDecathlonSync(userId, options);
            } catch (err) {
                result.decathlon = { success: false, message: err.message };
            }
        }
        
        // Sync Suunto if configured or requested
        if (!options.source || options.source === 'suunto') {
            try {
                result.suunto = await performSuuntoSync(userId, options);
            } catch (err) {
                result.suunto = { success: false, message: err.message };
            }
        }
        
        finishJob(jobId, result);
        logger.info(`[Sync][Job ${jobId}] Sync complete for user ${userId}`);
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

    if (job.userId !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({
        jobId: req.params.id,
        status: job.status,
        source: job.source,
        result: job.result,
        error: job.error,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        elapsedMs: job.finishedAt ? job.finishedAt - job.startedAt : Date.now() - job.startedAt,
    });
});

// ---------------------------------------------------------------------------
// GET /api/sync/status — statut des intégrations
// ---------------------------------------------------------------------------

router.get('/status', verifyToken, async (req, res) => {
    try {
        const { getGarminSyncStatus } = require('../services/sync/garmin');
        const garmin = await getGarminSyncStatus(req.user.id);
        const decathlon = await getDecathlonSyncStatus(req.user.id);
        const suunto = await getSuuntoSyncStatus(req.user.id);

        res.json({
            garmin,
            decathlon,
            suunto,
            available: { garmin: true, decathlon: true, suunto: true },
        });
    } catch (error) {
        logger.error('Sync status error:', error);
        res.status(500).json({ error: 'Failed to get sync status' });
    }
});

// ---------------------------------------------------------------------------
// Gestion des tokens
// ---------------------------------------------------------------------------

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

router.post('/decathlon/clear-tokens', verifyToken, async (req, res) => {
    try {
        const result = await clearDecathlonTokens(req.user.id);
        res.json(result);
    } catch (error) {
        logger.error('Clear Decathlon tokens error:', error);
        res.status(500).json({ error: 'Failed to clear tokens' });
    }
});

router.post('/suunto/clear-tokens', verifyToken, async (req, res) => {
    try {
        const result = await clearSuuntoTokens(req.user.id);
        res.json(result);
    } catch (error) {
        logger.error('Clear Suunto tokens error:', error);
        res.status(500).json({ error: 'Failed to clear tokens' });
    }
});

module.exports = router;
