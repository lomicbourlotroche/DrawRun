/**
 * ============================================================
 * PREFERENCES ROUTES
 * ============================================================
 * Préférences utilisateur (thème, unités, widgets)
 */

'use strict';

const express = require('express');
const { verifyToken } = require('../auth');
const { getUserDb, dbGetUser, dbRunUser } = require('../database');

const router = express.Router();

// GET /api/preferences
router.get('/', verifyToken, async (req, res) => {
    try {
        const userDb = await getUserDb(req.user.id);
        const prefs = await dbGetUser(userDb, 'SELECT * FROM user_preferences WHERE user_id = ?', [req.user.id]);
        res.json(prefs || {});
    } catch (error) {
        res.status(500).json({ error: 'Failed to get preferences' });
    }
});

// PUT /api/preferences
router.put('/', verifyToken, async (req, res) => {
    try {
        const userDb = await getUserDb(req.user.id);
        const { theme, units, dashboard_widgets, notification_settings } = req.body;
        
        await dbRunUser(userDb, `
            INSERT INTO user_preferences (user_id, theme, units, dashboard_widgets, notification_settings)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET 
                theme = COALESCE(?, theme),
                units = COALESCE(?, units),
                dashboard_widgets = COALESCE(?, dashboard_widgets),
                notification_settings = COALESCE(?, notification_settings)
        `, [req.user.id, theme, units, dashboard_widgets, notification_settings, theme, units, dashboard_widgets, notification_settings]);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

module.exports = router;
