'use strict';
const { logger } = require('../utils/logger');

const express = require('express');
const crypto = require('crypto');
const { verifyToken } = require('./auth');
const { performGarminSync } = require('../services/sync/garmin');

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
    const jobId = createJob(userId, 'garmin');

    res.json({ jobId, status: 'running', message: 'Sync started' });

    runSync(userId, jobId).catch((err) => {
        logger.error('Sync background error:', { error: err.message, userId });
        failJob(jobId, err.message);
    });
});

async function runSync(userId, jobId) {
    try {
        logger.info(`[Sync][Job ${jobId}] Starting Garmin sync for user ${userId}`);
        const result = { garmin: await performGarminSync(userId) };
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
// GET /api/sync/status — statut de l'intégration Garmin
// ---------------------------------------------------------------------------

router.get('/status', verifyToken, async (req, res) => {
    try {
        const { getGarminSyncStatus } = require('../services/sync/garmin');

        const garmin = await getGarminSyncStatus(req.user.id);

        res.json({
            garmin,
            available: { garmin: true },
        });
    } catch (error) {
        logger.error('Sync status error:', error);
        res.status(500).json({ error: 'Failed to get sync status' });
    }
});

// ---------------------------------------------------------------------------
// Gestion des tokens Garmin
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

module.exports = router;
