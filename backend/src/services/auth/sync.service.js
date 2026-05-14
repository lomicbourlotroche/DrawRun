'use strict';

const { logger } = require('../../utils/logger');

function triggerBackgroundSync(userId, hasGarmin) {
    if (!hasGarmin) return;

    const { performGarminSync } = require('../sync/garmin');
    const { calculateAndStoreMetrics } = require('../metricsCalculator.service');
    const { getUserDb } = require('../../database');

    setImmediate(async () => {
        try {
            logger.info(`[AutoSync][User ${userId}] Starting background Garmin sync...`);
            const userDb = await getUserDb(userId);

            try {
                await performGarminSync(userId);
                logger.info(`[AutoSync][User ${userId}] Garmin sync complete`);
            } catch (err) {
                logger.error(`[AutoSync][User ${userId}] Garmin sync error: ${err.message}`);
            }

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

module.exports = { triggerBackgroundSync };
