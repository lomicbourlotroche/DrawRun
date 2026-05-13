'use strict';

const { logger } = require('../../utils/logger');

function triggerBackgroundSync(userId, hasStrava, hasGarmin, hasSuunto, hasDecathlon) {
    if (!hasStrava && !hasGarmin && !hasSuunto && !hasDecathlon) return;

    const { performSync } = require('../sync/strava');
    const { performGarminSync } = require('../sync/garmin');
    const { performSuuntoSync } = require('../sync/suunto');
    const { performDecathlonSync } = require('../sync/decathlon');
    const { calculateAndStoreMetrics } = require('../metricsCalculator.service');
    const { getUserDb } = require('../../database');

    setImmediate(async () => {
        try {
            logger.info(`[AutoSync][User ${userId}] Starting background sync...`);
            const userDb = await getUserDb(userId);

            if (hasStrava) {
                try { await performSync(userId); logger.info(`[AutoSync][User ${userId}] Strava sync complete`); }
                catch (err) { logger.error(`[AutoSync][User ${userId}] Strava sync error: ${err.message}`); }
            }
            if (hasGarmin) {
                try { await performGarminSync(userId); logger.info(`[AutoSync][User ${userId}] Garmin sync complete`); }
                catch (err) { logger.error(`[AutoSync][User ${userId}] Garmin sync error: ${err.message}`); }
            }
            if (hasSuunto) {
                try { await performSuuntoSync(userId); logger.info(`[AutoSync][User ${userId}] Suunto sync complete`); }
                catch (err) { logger.error(`[AutoSync][User ${userId}] Suunto sync error: ${err.message}`); }
            }
            if (hasDecathlon) {
                try { await performDecathlonSync(userId); logger.info(`[AutoSync][User ${userId}] Decathlon sync complete`); }
                catch (err) { logger.error(`[AutoSync][User ${userId}] Decathlon sync error: ${err.message}`); }
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
