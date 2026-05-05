/**
 * ============================================================
 * ONBOARDING ROUTES
 * ============================================================
 * Statut de configuration initiale utilisateur
 */

'use strict';

const express = require('express');
const { verifyToken } = require('../auth');
const { getUserDb, dbGetUser, dbGetMain } = require('../database');

const router = express.Router();

// GET /api/onboarding/status
router.get('/status', verifyToken, async (req, res) => {
    try {
        const userDb = await getUserDb(req.user.id);
        const profile = await dbGetMain('SELECT fcm, vma, vdot FROM users WHERE id = ?', [req.user.id]);
        const plan = await dbGetUser(userDb, 'SELECT id FROM training_plans WHERE user_id = ? AND is_active = 1', [req.user.id]);
        const activity = await dbGetUser(userDb, 'SELECT id FROM activities LIMIT 1');
        
        res.json({
            completed: !!(profile?.fcm && plan && activity),
            steps: {
                profile: !!profile?.fcm,
                vma: !!profile?.vma,
                plan: !!plan,
                first_activity: !!activity
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get onboarding status' });
    }
});

module.exports = router;
