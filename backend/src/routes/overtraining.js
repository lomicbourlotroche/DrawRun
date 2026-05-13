/**
 * ============================================================
 * OVERTRAINING ROUTES
 * ============================================================
 * Detection sur-entraînement via ACWR - utilise algorithms/index.js
 */

'use strict';

const express = require('express');
const { verifyToken } = require('./auth');
const { getUserDb, dbGetUser, dbGetMain } = require('../database');
const { PMC } = require('../algorithms/index');

const router = express.Router();

// GET /api/overtraining/check
router.get('/check', verifyToken, async (req, res) => {
    try {
        const userDb = await getUserDb(req.user.id);
        const profile = await dbGetMain('SELECT * FROM users WHERE id = ?', [req.user.id]);

        if (!profile) {
            return res.json({ risk: 'low', score: 0 });
        }

        const pmc = await dbGetUser(userDb, `SELECT ctl, atl FROM pmc_history ORDER BY date DESC LIMIT 1`);

        if (!pmc || !pmc.atl || !pmc.ctl || pmc.ctl === 0) {
            return res.json({ risk: 'low', score: 0, message: 'Pas assez de données' });
        }

        const acwr = PMC.calculateACWR(pmc.atl, pmc.ctl);
        let risk = 'low';

        if (acwr > 1.5) risk = 'high';
        else if (acwr > 1.3) risk = 'moderate';

        res.json({
            risk,
            score: Math.round(acwr * 100),
            ctl: pmc.ctl,
            atl: pmc.atl,
            tsb: pmc.ctl - pmc.atl,
            acwr: acwr.toFixed(2)
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to check overtraining' });
    }
});

module.exports = router;
