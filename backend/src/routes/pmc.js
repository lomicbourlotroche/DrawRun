/**
 * ============================================================
 * PMC ROUTES
 * ============================================================
 * Performance Management Chart et recommandations
 */

'use strict';

const express = require('express');
const { verifyToken } = require('./auth');
const { getUserDb, dbGetUser, dbAllUser } = require('../database');
const { Recommendations } = require('../algorithms');
const { resolveUserConstants } = require('../services/userConstants.service');
const { cacheRoute } = require('../middleware/performance');

const router = express.Router();

// GET /api/pmc — cached for 15 minutes
router.get('/', verifyToken, cacheRoute('pmc', 15 * 60 * 1000), async (req, res) => {
    try {
        const userDb = await getUserDb(req.user.id);
        const pmcData = await dbAllUser(userDb, `
            SELECT date, ctl, atl, tsb, acwr FROM pmc_history 
            ORDER BY date DESC LIMIT 90
        `);
        
        res.json([...pmcData].reverse());
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch PMC' });
    }
});

// GET /api/pmc/recommendations (also mounted at /api/recommendations/recommendations for legacy compat)
router.get('/recommendations', verifyToken, async (req, res) => {
    try {
        const constants = await resolveUserConstants(req.user.id);
        
        if (!constants.fcm || !constants.age) {
            return res.json({
                type: 'Endurance',
                intensity: 'moderate',
                title: 'Séance d\'endurance',
                advice: 'Complétez votre profil pour bénéficier de recommandations personnalisées.'
            });
        }
        
        const userDb = await getUserDb(req.user.id);
        const pmc = await dbGetUser(userDb, `SELECT ctl, atl, tsb FROM pmc_history ORDER BY date DESC LIMIT 1`);
        const weekly = await dbGetUser(userDb, `SELECT value FROM performance_metrics WHERE metric_type = 'weekly_distance' ORDER BY date DESC LIMIT 1`);
        
        const recommendation = Recommendations.generate(
            { fcm: constants.fcm, vma: constants.vma, age: constants.age, sex: constants.sex },
            { weeklyLoad: weekly?.value || 0, chronicLoad: pmc?.ctl || 0, acwr: pmc?.atl ? (pmc.atl / pmc.ctl).toFixed(2) : 1 },
            {}
        );
        
        res.json(recommendation);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get recommendations' });
    }
});

module.exports = router;
