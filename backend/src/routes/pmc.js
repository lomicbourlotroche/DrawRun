/**
 * ============================================================
 * PMC ROUTES
 * ============================================================
 * Performance Management Chart et recommandations
 */

'use strict';

const express = require('express');
const { verifyToken } = require('../auth');
const { getUserDb, dbGetUser, dbAllUser, dbGetMain } = require('../database');
const { Recommendations } = require('../algorithms');

const router = express.Router();

// GET /api/pmc
router.get('/', verifyToken, async (req, res) => {
    try {
        const userDb = await getUserDb(req.user.id);
        const pmcData = await dbAllUser(userDb, `
            SELECT date, ctl, atl, tsb, acwr FROM pmc_history 
            ORDER BY date DESC LIMIT 90
        `);
        
        res.json(pmcData.reverse());
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch PMC' });
    }
});

// GET /api/recommendations
router.get('/recommendations', verifyToken, async (req, res) => {
    try {
        const userDb = await getUserDb(req.user.id);
        const profile = await dbGetMain('SELECT * FROM users WHERE id = ?', [req.user.id]);
        
        if (!profile || !profile.fcm || !profile.age) {
            return res.json({
                type: 'Endurance',
                intensity: 'moderate',
                title: 'Séance d\'endurance',
                advice: 'Complétez votre profil pour bénéficier de recommandations personnalisées.'
            });
        }
        
        // Obtenir les métriques
        const pmc = await dbGetUser(userDb, `SELECT ctl, atl, tsb FROM pmc_history ORDER BY date DESC LIMIT 1`);
        const weekly = await dbGetUser(userDb, `SELECT value FROM performance_metrics WHERE metric_type = 'weekly_distance' ORDER BY date DESC LIMIT 1`);
        
        const recommendation = Recommendations.generate(
            { fcm: profile.fcm, vma: profile.vma, age: profile.age, sex: profile.sex },
            { weeklyLoad: weekly?.value || 0, chronicLoad: pmc?.ctl || 0, acwr: pmc?.atl ? (pmc.atl / pmc.ctl).toFixed(2) : 1 },
            {}
        );
        
        res.json(recommendation);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get recommendations' });
    }
});

module.exports = router;
