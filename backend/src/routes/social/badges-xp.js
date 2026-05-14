'use strict';
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../auth');
const { dbGetMain, dbRunMain, dbAllMain } = require('../../database');
const { logger } = require('../../utils/logger');

const dbRun = (q, p) => dbRunMain(q, p);
const dbAll = (q, p) => dbAllMain(q, p);
const dbGet = (q, p) => dbGetMain(q, p);

router.post('/badges', verifyToken, async (req, res) => {
    try {
        const { name, description, icon, xpReward, criteria } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'name is required' });
        }
        try {
            const result = await dbRun(`
                INSERT INTO badges (name, description, icon, xp_reward, criteria)
                VALUES (?, ?, ?, ?, ?)
            `, [name, description || '', icon || '🏆', xpReward || 0, criteria || null]);
            const badge = await dbGet('SELECT * FROM badges WHERE id = ?', [result.lastID]);
            res.status(201).json({ success: true, badge });
        } catch (_) {
            res.status(500).json({ error: 'Failed to create badge' });
        }
    } catch (error) {
        logger.error('Create badge error:', { error: error.message });
        res.status(500).json({ error: 'Failed to create badge' });
    }
});

router.post('/badges/:id/award', verifyToken, async (req, res) => {
    try {
        const badgeId = parseInt(req.params.id);
        if (!badgeId || badgeId <= 0) {
            return res.status(400).json({ error: 'Invalid badge ID' });
        }
        try {
            const badge = await dbGet('SELECT * FROM badges WHERE id = ?', [badgeId]);
            if (!badge) {
                return res.status(404).json({ error: 'Badge not found' });
            }
            const existing = await dbGet(
                'SELECT * FROM user_badges WHERE user_id = ? AND badge_id = ?',
                [req.user.id, badgeId]
            );
            if (existing) {
                return res.json({ success: false, error: 'Badge already awarded' });
            }
            await dbRun('INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)', [req.user.id, badgeId]);
            // Award XP
            const userXP = await dbGet('SELECT * FROM user_xp WHERE user_id = ?', [req.user.id]);
            if (!userXP) {
                await dbRun('INSERT INTO user_xp (user_id, total_xp, level) VALUES (?, ?, ?)',
                    [req.user.id, badge.xp_reward, Math.floor(badge.xp_reward / 100) + 1]);
            } else {
                const newTotal = userXP.total_xp + badge.xp_reward;
                await dbRun('UPDATE user_xp SET total_xp = ?, level = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
                    [newTotal, Math.floor(newTotal / 100) + 1, req.user.id]);
            }
            res.json({ success: true, message: 'Badge awarded' });
        } catch (_) {
            res.status(500).json({ error: 'Failed to award badge' });
        }
    } catch (error) {
        logger.error('Award badge error:', { error: error.message });
        res.status(500).json({ error: 'Failed to award badge' });
    }
});

router.get('/badges/user', verifyToken, async (req, res) => {
    try {
        try {
            const badges = await dbAll(`
                SELECT b.*, ub.earned_at
                FROM user_badges ub
                JOIN badges b ON ub.badge_id = b.id
                WHERE ub.user_id = ?
                ORDER BY ub.earned_at DESC
            `, [req.user.id]);
            res.json(badges);
        } catch (_) {
            res.json([]);
        }
    } catch (error) {
        logger.error('Get user badges error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get badges' });
    }
});

router.get('/level', verifyToken, async (req, res) => {
    try {
        try {
            let userXP = await dbGet('SELECT * FROM user_xp WHERE user_id = ?', [req.user.id]);
            if (!userXP) {
                return res.json({ level: 1, total_xp: 0, xp_to_next_level: 100 });
            }
            const xpToNextLevel = Math.max(0, (userXP.level * 100) - userXP.total_xp);
            res.json({ level: userXP.level, total_xp: userXP.total_xp, xp_to_next_level: xpToNextLevel });
        } catch (_) {
            res.json({ level: 1, total_xp: 0, xp_to_next_level: 100 });
        }
    } catch (error) {
        logger.error('Get level error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get level' });
    }
});

router.post('/xp/add', verifyToken, async (req, res) => {
    try {
        const { xp } = req.body;
        if (!xp || xp <= 0) {
            return res.status(400).json({ error: 'Valid xp value is required' });
        }
        try {
            let userXP = await dbGet('SELECT * FROM user_xp WHERE user_id = ?', [req.user.id]);
            if (!userXP) {
                await dbRun('INSERT INTO user_xp (user_id, total_xp, level) VALUES (?, ?, ?)',
                    [req.user.id, xp, Math.floor(xp / 100) + 1]);
            } else {
                const newTotal = userXP.total_xp + xp;
                await dbRun('UPDATE user_xp SET total_xp = ?, level = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
                    [newTotal, Math.floor(newTotal / 100) + 1, req.user.id]);
            }
            res.json({ success: true });
        } catch (_) {
            res.status(500).json({ error: 'Failed to add XP' });
        }
    } catch (error) {
        logger.error('Add XP error:', { error: error.message });
        res.status(500).json({ error: 'Failed to add XP' });
    }
});

module.exports = router;
