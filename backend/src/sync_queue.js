/**
 * ============================================================
 * SYNC QUEUE - Retry mechanism for failed syncs
 * ============================================================
 * 
 * Uses database table to queue and retry failed syncs.
 * Exponential backoff with max 5 attempts.
 * 
 * @module sync_queue
 */

'use strict';

const { dbRun, dbGet, dbAll } = require('./database');
const { logInfo, logError } = require('./logger');

// Retry delays in milliseconds (exponential backoff)
const RETRY_DELAYS = [
    5 * 60 * 1000,      // 5 minutes
    15 * 60 * 1000,     // 15 minutes
    30 * 60 * 1000,     // 30 minutes
    60 * 60 * 1000,     // 1 hour
    4 * 60 * 60 * 1000, // 4 hours
];

class SyncQueue {
    /**
     * Add job to queue
     */
    static async enqueue(userId, service, priority = 0) {
        // Check if already queued
        const existing = await dbGet(`
            SELECT id FROM sync_queue 
            WHERE user_id = ? AND service = ? AND status IN ('pending', 'processing', 'retry')
        `, [userId, service]);
        
        if (existing) {
            return { queued: false, reason: 'already_queued' };
        }
        
        await dbRun(`
            INSERT INTO sync_queue (user_id, service, status, priority, created_at)
            VALUES (?, ?, 'pending', ?, CURRENT_TIMESTAMP)
        `, [userId, service, priority]);
        
        logInfo('Sync queued', { userId, service });
        
        return { queued: true };
    }
    
    /**
     * Mark job as processing
     */
    static async startProcessing(jobId) {
        await dbRun(`
            UPDATE sync_queue 
            SET status = 'processing', started_at = CURRENT_TIMESTAMP, attempts = attempts + 1
            WHERE id = ?
        `, [jobId]);
    }
    
    /**
     * Mark job as completed
     */
    static async complete(jobId) {
        await dbRun(`
            UPDATE sync_queue 
            SET status = 'completed', completed_at = CURRENT_TIMESTAMP, last_error = NULL
            WHERE id = ?
        `, [jobId]);
        
        logInfo('Sync completed', { jobId });
    }
    
    /**
     * Mark job as failed with retry
     */
    static async fail(jobId, error) {
        const job = await dbGet('SELECT * FROM sync_queue WHERE id = ?', [jobId]);
        
        if (!job) return;
        
        const nextDelay = RETRY_DELAYS[job.attempts] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        const nextRetry = new Date(Date.now() + nextDelay);
        
        if (job.attempts >= job.max_attempts) {
            await dbRun(`
                UPDATE sync_queue 
                SET status = 'failed', last_error = ?
                WHERE id = ?
            `, [error, jobId]);
            
            logError('Sync permanently failed', { jobId, attempts: job.attempts, error });
        } else {
            await dbRun(`
                UPDATE sync_queue 
                SET status = 'retry', last_error = ?, next_retry_at = ?
                WHERE id = ?
            `, [error, nextRetry.toISOString(), jobId]);
            
            logError('Sync failed, will retry', { jobId, attempts: job.attempts, nextRetry });
        }
    }
    
    /**
     * Get next pending job
     */
    static async getNext() {
        // Get oldest pending job, preferring higher priority
        const job = await dbGet(`
            SELECT * FROM sync_queue 
            WHERE status = 'pending' 
               OR (status = 'retry' AND next_retry_at <= datetime('now'))
            ORDER BY priority DESC, created_at ASC
            LIMIT 1
        `);
        
        return job;
    }
    
    /**
     * Get queue stats
     */
    static async getStats() {
        const stats = await dbGet(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
                SUM(CASE WHEN status = 'retry' THEN 1 ELSE 0 END) as retry,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
            FROM sync_queue
        `);
        
        return stats;
    }
    
    /**
     * Get user's queue status
     */
    static async getUserQueue(userId) {
        const jobs = await dbAll(`
            SELECT * FROM sync_queue 
            WHERE user_id = ? 
            ORDER BY created_at DESC
            LIMIT 10
        `, [userId]);
        
        return jobs;
    }
    
    /**
     * Clear old completed/failed jobs
     */
    static async cleanup(daysOld = 7) {
        const result = await dbRun(`
            DELETE FROM sync_queue 
            WHERE status IN ('completed', 'failed') 
            AND completed_at < datetime('now', '-' || ? || ' days')
        `, [daysOld]);
        
        return result;
    }
}

// Background worker
let isProcessing = false;
let processInterval = null;

async function processQueue(syncFn) {
    if (isProcessing) return;
    isProcessing = true;
    
    try {
        const job = await SyncQueue.getNext();
        
        if (!job) {
            isProcessing = false;
            return;
        }
        
        await SyncQueue.startProcessing(job.id);
        
        try {
            await syncFn(job.user_id, job.service);
            await SyncQueue.complete(job.id);
        } catch (e) {
            await SyncQueue.fail(job.id, e.message);
        }
    } catch (e) {
        logError('Queue processing error', { error: e.message });
    } finally {
        isProcessing = false;
    }
}

function startWorker(syncFn, intervalMs = 30000) {
    if (processInterval) {
        clearInterval(processInterval);
    }
    
    processInterval = setInterval(() => {
        processQueue(syncFn);
    }, intervalMs);
    
    // Process immediately
    processQueue(syncFn);
    
    logInfo('Sync queue worker started', { interval: intervalMs });
}

function stopWorker() {
    if (processInterval) {
        clearInterval(processInterval);
        processInterval = null;
    }
}

// Routes
const express = require('express');
const router = express.Router();

router.get('/stats', async (req, res) => {
    try {
        const stats = await SyncQueue.getStats();
        res.json(stats);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/user/:userId', async (req, res) => {
    try {
        const queue = await SyncQueue.getUserQueue(parseInt(req.params.userId));
        res.json(queue);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/enqueue/:service', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
        const result = await SyncQueue.enqueue(req.user.id, req.params.service, req.body.priority || 0);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = {
    SyncQueue,
    startWorker,
    stopWorker,
    router,
};