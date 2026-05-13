'use strict';

const webpush = require('web-push');
const { logger } = require('../../utils/logger');
const { dbGetMain, dbRunMain } = require('../../database');

/**
 * Initialize VAPID keys from environment or generate new ones
 * @returns {{ publicKey: string, privateKey: string }}
 */
function initializeVapidKeys() {
    let publicKey = process.env.VAPID_PUBLIC_KEY;
    let privateKey = process.env.VAPID_PRIVATE_KEY;

    // Generate keys if not provided
    if (!publicKey || !privateKey) {
        const vapidKeys = webpush.generateVAPIDKeys();
        publicKey = vapidKeys.publicKey;
        privateKey = vapidKeys.privateKey;

        logger.info('[VAPID] Generated new VAPID keys - save these to .env for production');
        logger.info(`[VAPID] Public Key: ${publicKey}`);
    }

    // Configure web-push
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@drawrun.fr',
        publicKey,
        privateKey
    );

    return { publicKey, privateKey };
}

/**
 * Send push notification to a user
 * @param {number} userId - User ID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload
 * @returns {Promise<{ success: boolean, sent: number, failed: number }>}
 */
async function sendPushNotification(userId, title, body, data = {}) {
    try {
        // Get all subscriptions for this user
        const subscriptions = await dbGetMain(
            'SELECT * FROM push_subscriptions WHERE user_id = ?',
            [userId]
        );

        if (!subscriptions || subscriptions.length === 0) {
            return { success: true, sent: 0, failed: 0 };
        }

        const payload = JSON.stringify({
            title,
            body,
            data: {
                ...data,
                timestamp: Date.now(),
            },
            tag: `drawrun-${data.type || 'notification'}`,
        });

        let sent = 0;
        let failed = 0;

        // Send to all subscriptions
        const results = await Promise.allSettled(
            subscriptions.map(async (sub) => {
                try {
                    const pushSubscription = {
                        endpoint: sub.endpoint,
                        keys: {
                            p256dh: sub.p256dh,
                            auth: sub.auth,
                        },
                    };

                    await webpush.sendNotification(pushSubscription, payload);
                    return { success: true, endpoint: sub.endpoint };
                } catch (error) {
                    // Remove expired subscriptions (410 Gone, 404 Not Found)
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        logger.warn('[Push] Removing expired subscription', { 
                            userId, 
                            endpoint: sub.endpoint.substring(0, 50) + '...' 
                        });
                        await dbRunMain(
                            'DELETE FROM push_subscriptions WHERE endpoint = ?',
                            [sub.endpoint]
                        );
                    } else {
                        logger.error('[Push] Failed to send notification', { 
                            userId, 
                            error: error.message,
                            statusCode: error.statusCode 
                        });
                    }
                    return { success: false, endpoint: sub.endpoint, error: error.message };
                }
            })
        );

        // Count results
        results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value.success) {
                sent++;
            } else {
                failed++;
            }
        });

        logger.info('[Push] Notification sent', { userId, sent, failed, title });
        return { success: true, sent, failed };

    } catch (error) {
        logger.error('[Push] Error in sendPushNotification', { userId, error: error.message });
        return { success: false, sent: 0, failed: 0 };
    }
}

/**
 * Subscribe a user to push notifications
 * @param {number} userId - User ID
 * @param {object} subscription - Push subscription object
 * @param {string} userAgent - User agent string
 * @returns {Promise<{ success: boolean, message: string }>}
 */
async function subscribeUser(userId, subscription, userAgent) {
    try {
        const { endpoint, keys } = subscription;
        
        if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
            return { success: false, message: 'Invalid subscription data' };
        }

        // Check if already subscribed
        const existing = await dbGetMain(
            'SELECT id, user_id FROM push_subscriptions WHERE endpoint = ?',
            [endpoint]
        );
        
        if (existing && existing.length > 0 && existing[0].user_id !== userId) {
            return { success: false, message: 'Subscription belongs to another user' };
        }

        if (existing && existing.length > 0) {
            return { success: false, message: 'Already subscribed', conflict: true };
        }

        // Insert new subscription
        await dbRunMain(
            `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent) 
             VALUES (?, ?, ?, ?, ?)`,
            [userId, endpoint, keys.p256dh, keys.auth, userAgent]
        );

        logger.info('[Push] New subscription', { userId, endpoint: endpoint.substring(0, 50) + '...' });
        return { success: true, message: 'Subscribed successfully' };

    } catch (error) {
        logger.error('[Push] Error subscribing user', { userId, error: error.message });
        return { success: false, message: 'Subscription failed' };
    }
}

/**
 * Unsubscribe a user from push notifications
 * @param {number} userId - User ID
 * @param {string} endpoint - Subscription endpoint
 * @returns {Promise<{ success: boolean, message: string }>}
 */
async function unsubscribeUser(userId, endpoint) {
    try {
        await dbRunMain(
            'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
            [userId, endpoint]
        );

        logger.info('[Push] Unsubscribed user', { userId, endpoint: endpoint.substring(0, 50) + '...' });
        return { success: true, message: 'Unsubscribed successfully' };

    } catch (error) {
        logger.error('[Push] Error unsubscribing user', { userId, error: error.message });
        return { success: false, message: 'Unsubscription failed' };
    }
}

/**
 * Get VAPID public key
 * @returns {string}
 */
function getVapidPublicKey() {
    return process.env.VAPID_PUBLIC_KEY;
}

module.exports = {
    initializeVapidKeys,
    sendPushNotification,
    subscribeUser,
    unsubscribeUser,
    getVapidPublicKey,
};
