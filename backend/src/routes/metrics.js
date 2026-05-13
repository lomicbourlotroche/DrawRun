/**
 * ============================================================
 * METRICS ROUTES
 * ============================================================
 * Métriques de performance et recalcul
 */

'use strict';

const express = require('express');
const { verifyToken } = require('./auth');
const { getUserDb, dbGetUser } = require('../database');
const metrics = require('../services/metricsCalculator.service');

const router = express.Router();

// GET /api/metrics
router.get('/', verifyToken, async (req, res) => {
    try {
        const userDb = await getUserDb(req.user.id);
        
        const ctl = await dbGetUser(userDb, `SELECT value FROM performance_metrics WHERE metric_type = 'ctl' ORDER BY date DESC LIMIT 1`);
        const atl = await dbGetUser(userDb, `SELECT value FROM performance_metrics WHERE metric_type = 'atl' ORDER BY date DESC LIMIT 1`);
        const weekly = await dbGetUser(userDb, `SELECT value FROM performance_metrics WHERE metric_type = 'weekly_distance' ORDER BY date DESC LIMIT 1`);
        
        res.json({
            ctl: ctl?.value || 0,
            atl: atl?.value || 0,
            tsb: (ctl?.value || 0) - (atl?.value || 0),
            weeklyDistance: weekly?.value || 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});

// POST /api/metrics/recalculate
router.post('/recalculate', verifyToken, async (req, res) => {
    try {
        const userDb = await getUserDb(req.user.id);
        const result = await metrics.calculateAndStoreMetrics(req.user.id, userDb);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to recalculate metrics' });
    }
});

// POST /api/metrics/hrv
router.post('/hrv', verifyToken, async (req, res) => {
    try {
        const { value, date = new Date().toISOString().split('T')[0] } = req.body;
        const userDb = await getUserDb(req.user.id);
        
        const { dbRunUser } = require('../database');
        await dbRunUser(userDb, `
            INSERT OR REPLACE INTO performance_metrics (user_id, metric_type, metric_value, recorded_at, source)
            VALUES (?, 'hrv', ?, ?, 'manual')
        `, [req.user.id, value, date]);
        
        await metrics.calculateAndStoreMetrics(req.user.id, userDb);
        res.json({ success: true, message: 'HRV enregistré' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to store HRV' });
    }
});

// POST /api/metrics/sleep
router.post('/sleep', verifyToken, async (req, res) => {
    try {
        const { value, date = new Date().toISOString().split('T')[0] } = req.body;
        const userDb = await getUserDb(req.user.id);
        
        const { dbRunUser } = require('../database');
        await dbRunUser(userDb, `
            INSERT OR REPLACE INTO performance_metrics (user_id, metric_type, metric_value, recorded_at, source)
            VALUES (?, 'sleep', ?, ?, 'manual')
        `, [req.user.id, value, date]);
        
        await metrics.calculateAndStoreMetrics(req.user.id, userDb);
        res.json({ success: true, message: 'Sommeil enregistré' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to store sleep' });
    }
});

module.exports = router;
