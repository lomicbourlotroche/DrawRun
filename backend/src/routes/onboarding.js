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
        const activity = await dbGetUser(userDb, 'SELECT id FROM activities WHERE user_id = ? LIMIT 1', [req.user.id]);
        
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

// POST /api/onboarding/complete - Mark onboarding step as complete
router.post('/complete', verifyToken, async (req, res) => {
    try {
        const { step } = req.body;
        if (!step) {
            return res.status(400).json({ error: 'step is required' });
        }
        
        const { getUserDb, dbRunUser } = require('../database');
        const userDb = await getUserDb(req.user.id);
        
        // Store onboarding progress in user_preferences table
        await dbRunUser(userDb, `
            INSERT INTO user_preferences (user_id, onboarding_completed, onboarding_data)
            VALUES (?, 0, ?)
            ON CONFLICT(user_id) DO UPDATE SET 
                onboarding_data = json_patch(COALESCE(onboarding_data, '{}'), ?)
        `, [req.user.id, JSON.stringify({ [step]: true }), JSON.stringify({ [step]: true })]);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to complete onboarding step' });
    }
});

module.exports = router;
