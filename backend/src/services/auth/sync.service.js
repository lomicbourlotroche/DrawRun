'use strict';

const { logger } = require('../../utils/logger');
const { dbGetMain } = require('../../database');

/**
 * Trigger background sync for Garmin and/or Decathlon
 * @param {number} userId - User ID
 * @param {boolean} hasGarmin - Whether user has Garmin configured
 * @param {boolean} hasDecathlon - Whether user has Decathlon configured
 */
async function triggerBackgroundSync(userId, hasGarmin, hasDecathlon) {
    if (!hasGarmin && !hasDecathlon) return;

    const { performGarminSync } = require('../sync/garmin');
    const { performDecathlonSync } = require('../sync/decathlon');
    const { calculateAndStoreMetrics } = require('../metricsCalculator.service');
    const { getUserDb } = require('../../database');

    setImmediate(async () => {
        try {
            logger.info(`[AutoSync][User ${userId}] Starting background sync...`);
            const userDb = await getUserDb(userId);

            const results = {};
            
            // Sync Garmin if configured
            if (hasGarmin) {
                try {
                    results.garmin = await performGarminSync(userId);
                    logger.info(`[AutoSync][User ${userId}] Garmin sync complete`);
                } catch (err) {
                    logger.error(`[AutoSync][User ${userId}] Garmin sync error: ${err.message}`);
                    results.garmin = { success: false, message: err.message };
                }
            }
            
            // Sync Decathlon if configured
            if (hasDecathlon) {
                try {
                    results.decathlon = await performDecathlonSync(userId);
                    logger.info(`[AutoSync][User ${userId}] Decathlon sync complete`);
                } catch (err) {
                    logger.error(`[AutoSync][User ${userId}] Decathlon sync error: ${err.message}`);
                    results.decathlon = { success: false, message: err.message };
                }
            }

            // Calculate metrics after all syncs
            try {
                await calculateAndStoreMetrics(userId, userDb);
                logger.info(`[AutoSync][User ${userId}] Metrics calculated`);
            } catch (err) {
                logger.error(`[AutoSync][User ${userId}] Metrics error: ${err.message}`);
            }
        } catch (err) {
            logger.error(`[AutoSync][User ${userId}] Background sync failed: ${err.message}`);
        }
    });
}

/**
 * Check if user has specific provider configured
 * @param {number} userId - User ID
 * @param {string} provider - Provider name ('garmin', 'decathlon', etc.)
 * @returns {Promise<boolean>}
 */
async function hasProviderConfigured(userId, provider) {
    try {
        const creds = await dbGetMain(
            'SELECT id FROM user_credentials WHERE user_id = ? AND provider = ? AND enabled = 1',
            [userId, provider]
        );
        return !!creds;
    } catch (error) {
        logger.error(`[SyncService] Error checking provider ${provider}:`, error);
        return false;
    }
}

/**
 * Auto-detect which providers are configured and trigger sync
 * @param {number} userId - User ID
 */
async function triggerAutoSync(userId) {
    const hasGarmin = await hasProviderConfigured(userId, 'garmin');
    const hasDecathlon = await hasProviderConfigured(userId, 'decathlon');
    
    if (hasGarmin || hasDecathlon) {
        await triggerBackgroundSync(userId, hasGarmin, hasDecathlon);
    }
}

module.exports = { 
    triggerBackgroundSync,
    hasProviderConfigured,
    triggerAutoSync
};
