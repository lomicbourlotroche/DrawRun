'use strict';

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../auth');
const { sendPushNotification, subscribeUser, unsubscribeUser, getVapidPublicKey } = require('../services/push.service');
const { logger } = require('../logger');

/**
 * GET /api/notifications/vapid-key
 * Get VAPID public key for push subscription
 * @route GET /api/notifications/vapid-key
 * @returns {object} 200 - { publicKey: string }
 */
router.get('/vapid-key', verifyToken, (req, res) => {
    try {
        const publicKey = getVapidPublicKey();
        
        if (!publicKey) {
            return res.status(503).json({ 
                error: 'Push notifications not configured',
                message: 'VAPID keys not initialized' 
            });
        }

        res.json({ publicKey });
    } catch (error) {
        logger.error('[Notifications] Error getting VAPID key', { error: error.message });
        res.status(500).json({ error: 'Failed to get VAPID key' });
    }
});

/**
 * POST /api/notifications/subscribe
 * Subscribe to push notifications
 * @route POST /api/notifications/subscribe
 * @body {object} subscription - Push subscription object
 * @returns {object} 200 - Success message
 * @returns {object} 409 - Already subscribed
 */
router.post('/subscribe', verifyToken, async (req, res) => {
    try {
        const { subscription } = req.body;
        const userId = req.user.id;
        const userAgent = req.headers['user-agent'] || 'Unknown';

        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ 
                error: 'Invalid subscription',
                message: 'Subscription object with endpoint is required' 
            });
        }

        const result = await subscribeUser(userId, subscription, userAgent);

        if (result.conflict) {
            return res.status(409).json({ 
                error: 'Already subscribed',
                message: 'This endpoint is already registered' 
            });
        }

        if (!result.success) {
            return res.status(500).json({ 
                error: 'Subscription failed',
                message: result.message 
            });
        }

        res.json({ 
            success: true,
            message: result.message 
        });

    } catch (error) {
        logger.error('[Notifications] Error subscribing', { error: error.message });
        res.status(500).json({ error: 'Failed to subscribe to notifications' });
    }
});

/**
 * DELETE /api/notifications/unsubscribe
 * Unsubscribe from push notifications
 * @route DELETE /api/notifications/unsubscribe
 * @body {string} endpoint - Subscription endpoint
 * @returns {object} 200 - Success message
 */
router.delete('/unsubscribe', verifyToken, async (req, res) => {
    try {
        const { endpoint } = req.body;
        const userId = req.user.id;

        if (!endpoint) {
            return res.status(400).json({ 
                error: 'Invalid request',
                message: 'Endpoint is required' 
            });
        }

        const result = await unsubscribeUser(userId, endpoint);

        if (!result.success) {
            return res.status(500).json({ 
                error: 'Unsubscription failed',
                message: result.message 
            });
        }

        res.json({ 
            success: true,
            message: result.message 
        });

    } catch (error) {
        logger.error('[Notifications] Error unsubscribing', { error: error.message });
        res.status(500).json({ error: 'Failed to unsubscribe from notifications' });
    }
});

/**
 * POST /api/notifications/test
 * Send a test notification (for debugging)
 * @route POST /api/notifications/test
 * @body {string} title - Notification title
 * @body {string} body - Notification body
 * @returns {object} 200 - Test notification sent
 */
router.post('/test', verifyToken, async (req, res) => {
    try {
        const { title = 'Test', body = 'This is a test notification' } = req.body;
        const userId = req.user.id;

        const result = await sendPushNotification(userId, title, body, { type: 'test' });

        res.json({
            success: result.success,
            sent: result.sent,
            failed: result.failed,
            message: `Test notification sent: ${result.sent} delivered, ${result.failed} failed`
        });

    } catch (error) {
        logger.error('[Notifications] Error sending test notification', { error: error.message });
        res.status(500).json({ error: 'Failed to send test notification' });
    }
});

module.exports = router;
