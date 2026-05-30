/**
 * ============================================================
 * ONBOARDING ROUTES
 * ============================================================
 * Statut de configuration initiale utilisateur
 */

'use strict';

const express = require('express');
const { logger } = require('../utils/logger');
const { verifyToken } = require('./auth');
const { getUserDb, dbGetUser, dbGetMain, dbRunUser } = require('../database');

const router = express.Router();

// GET /api/onboarding/status
router.get('/status', verifyToken, async (req, res) => {
    try {
        const userDb = await getUserDb(req.user.id);
        const userRow = await dbGetMain('SELECT profile_data FROM users WHERE id = ?', [req.user.id]);
        let profileData = {};
        try {
            profileData = userRow?.profile_data ? JSON.parse(userRow.profile_data) : {};
        } catch {
            profileData = {};
        }

        // Ces tables peuvent ne pas exister si la DB utilisateur est neuve
        let plan = null;
        let activity = null;
        try {
            plan = await dbGetUser(userDb, 'SELECT id FROM training_plans WHERE user_id = ? AND is_active = 1 LIMIT 1', [req.user.id]);
        } catch (_) { logger?.warn?.('Training plans table not available'); }
        try {
            activity = await dbGetUser(userDb, 'SELECT id FROM activities LIMIT 1', []);
        } catch (_) { logger?.warn?.('Activities table not available'); }

        const hasFcm = !!(profileData.fcm || profileData.max_heart_rate);
        const hasVma = !!profileData.vma;

        res.json({
            completed: !!((hasFcm || hasVma) && activity),
            steps: {
                profile: { completed: hasFcm },
                vma: { completed: hasVma },
                plan: { completed: !!plan },
                first_activity: { completed: !!activity },
                sync: { completed: !!(profileData.has_strava || profileData.has_garmin) }
            }
        });
    } catch (error) {
        logger.error('Onboarding status error', { error: error.message, userId: req.user?.id });
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
