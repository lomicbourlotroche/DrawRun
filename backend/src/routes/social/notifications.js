'use strict';
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../auth');
const { dbRunMain, dbAllMain, dbGetMain } = require('../../database');
const { logger } = require('../../utils/logger');

const dbRun = (q, p) => dbRunMain(q, p);
const dbAll = (q, p) => dbAllMain(q, p);
const dbGet = (q, p) => dbGetMain(q, p);

router.get('/notifications', verifyToken, async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        try {
            const notifications = await dbAll(`
                SELECT * FROM notifications
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `, [req.user.id, parseInt(limit), parseInt(offset)]);
            const unreadRow = await dbGet(`
                SELECT COUNT(*) as count FROM notifications
                WHERE user_id = ? AND read_at IS NULL
            `, [req.user.id]);
            res.json({
                success: true,
                notifications: notifications.map(n => ({
                    ...n,
                    data: n.data ? (() => { try { return JSON.parse(n.data); } catch (_) { return {}; } })() : {}
                })),
                unread_count: unreadRow ? unreadRow.count : 0
            });
        } catch (_) {
            res.json({ success: true, notifications: [], unread_count: 0 });
        }
    } catch (error) {
        logger.error('Get notifications error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get notifications' });
    }
});

router.put('/notifications/read-all', verifyToken, async (req, res) => {
    try {
        try {
            await dbRun(`
                UPDATE notifications SET read_at = CURRENT_TIMESTAMP
                WHERE user_id = ? AND read_at IS NULL
            `, [req.user.id]);
        } catch (_) { /* table may not exist */ }
        res.json({ success: true });
    } catch (error) {
        logger.error('Mark all notifications read error:', { error: error.message });
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
});

router.put('/notifications/:id/read', verifyToken, async (req, res) => {
    try {
        const notifId = parseInt(req.params.id);
        if (!notifId || notifId <= 0) {
            return res.status(400).json({ error: 'Invalid notification ID' });
        }
        try {
            await dbRun(`
                UPDATE notifications SET read_at = CURRENT_TIMESTAMP
                WHERE id = ? AND user_id = ?
            `, [notifId, req.user.id]);
        } catch (_) { /* table may not exist */ }
        res.json({ success: true });
    } catch (error) {
        logger.error('Mark notification read error:', { error: error.message });
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

router.delete('/notifications/:id', verifyToken, async (req, res) => {
    try {
        const notifId = parseInt(req.params.id);
        if (!notifId || notifId <= 0) {
            return res.status(400).json({ error: 'Invalid notification ID' });
        }
        try {
            await dbRun(`
                DELETE FROM notifications WHERE id = ? AND user_id = ?
            `, [notifId, req.user.id]);
        } catch (_) { /* table may not exist */ }
        res.json({ success: true });
    } catch (error) {
        logger.error('Delete notification error:', { error: error.message });
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

module.exports = router;
