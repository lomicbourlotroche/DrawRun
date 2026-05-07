'use strict';

/**
 * Sync Utilities - Optimized batch operations for activity sync
 * Reduces N+1 query problems in Garmin/Strava/Suunto/Decathlon syncs
 */

const { logger } = require('./logger');

/**
 * Batch check existing activities by source_id
 * @param {object} userDb - User database instance
 * @param {string} source - Source name (garmin, strava, etc.)
 * @param {string[]} sourceIds - Array of source IDs to check
 * @returns {Promise<Set<string>>} Set of existing source IDs
 */
async function batchCheckExisting(userDb, source, sourceIds) {
    if (!sourceIds || sourceIds.length === 0) return new Set();

    try {
        const placeholders = sourceIds.map(() => '?').join(',');
        const query = `SELECT source_id FROM activities WHERE source = ? AND source_id IN (${placeholders})`;
        const params = [source, ...sourceIds];

        const results = userDb.prepare(query).all(params);
        return new Set(results.map(r => String(r.source_id)));
    } catch (error) {
        logger.error('[SyncUtils] Batch check failed', { error: error.message, source });
        return new Set(); // Return empty set on error, will re-import all
    }
}

/**
 * Batch insert activities using individual statements wrapped in a transaction.
 * Each activity is an object already normalized with a `source` field.
 * @param {object} userDb - User database instance
 * @param {object[]} activities - Array of normalized activity objects
 * @returns {number} Number of activities inserted
 */
function batchInsertActivities(userDb, activities) {
    if (!activities || activities.length === 0) return 0;

    try {
        const stmt = userDb.prepare(`
            INSERT OR IGNORE INTO activities
            (source, source_id, name, type, start_date, distance, moving_time,
             average_heartrate, max_heartrate, average_speed, max_speed, calories)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const insertMany = userDb.transaction((acts) => {
            let count = 0;
            for (const act of acts) {
                const info = stmt.run(
                    act.source || 'unknown',
                    String(act.source_id || ''),
                    act.name || 'Activity',
                    act.type || 'run',
                    act.start_date || new Date().toISOString(),
                    act.distance || 0,
                    act.moving_time || act.duration || 0,
                    act.average_heartrate || act.avg_hr || null,
                    act.max_heartrate || act.max_hr || null,
                    act.average_speed || null,
                    act.max_speed || null,
                    act.calories || null
                );
                count += info.changes;
            }
            return count;
        });

        return insertMany(activities);
    } catch (error) {
        logger.error('[SyncUtils] Batch insert failed', { error: error.message });
        return 0;
    }
}

/**
 * Process activity list with batch operations (replaces N+1 loops)
 * Activities passed in must already have a normalized `source_id` field.
 * @param {object} userDb - User database instance
 * @param {string} source - Source name
 * @param {object[]} activityList - List of normalized activities from API
 * @param {function} [detailFetcher] - Optional function to fetch details for new activities
 * @returns {Promise<{imported: number, details: number}>}
 */
async function processActivityList(userDb, source, activityList, detailFetcher = null) {
    const results = { imported: 0, details: 0 };

    if (!activityList || activityList.length === 0) {
        return results;
    }

    logger.info(`[SyncUtils] Processing ${activityList.length} activities from ${source}`);

    // Step 1: Batch check existing activities
    // Activities are already normalized — use `source_id` which is always set by callers.
    const sourceIds = activityList.map(a => String(a.source_id || ''));
    const existingIds = await batchCheckExisting(userDb, source, sourceIds);

    logger.info(`[SyncUtils] Found ${existingIds.size} existing activities`);

    // Step 2: Filter new activities
    const newActivities = [];
    for (const activity of activityList) {
        const sourceId = String(activity.source_id || '');
        if (sourceId && !existingIds.has(sourceId)) {
            newActivities.push({
                source,
                source_id: sourceId,
                name: activity.name || `${source} Activity`,
                type: (activity.type || 'run').toLowerCase(),
                start_date: activity.start_date || new Date().toISOString(),
                distance: activity.distance || 0,
                moving_time: activity.moving_time || activity.duration || 0,
                average_heartrate: activity.average_heartrate || null,
                max_heartrate: activity.max_heartrate || null,
                average_speed: activity.average_speed || null,
                max_speed: activity.max_speed || null,
                calories: activity.calories || null,
            });
        }
    }

    logger.info(`[SyncUtils] ${newActivities.length} new activities to import`);

    // Step 3: Optionally fetch details for new activities (if detailFetcher provided)
    if (detailFetcher && newActivities.length > 0) {
        const maxDetails = Math.min(newActivities.length, 10); // Limit to 10 detail fetches
        for (let i = 0; i < maxDetails; i++) {
            try {
                const details = await detailFetcher(newActivities[i].source_id);
                if (details) {
                    // Merge details into activity
                    Object.assign(newActivities[i], {
                        average_heartrate: details.average_heartrate || newActivities[i].average_heartrate,
                        max_heartrate: details.max_heartrate || newActivities[i].max_heartrate,
                        average_speed: details.average_speed || newActivities[i].average_speed,
                        max_speed: details.max_speed || newActivities[i].max_speed,
                        calories: details.calories || newActivities[i].calories,
                    });
                    results.details++;
                }
            } catch (err) {
                logger.warn(`[SyncUtils] Detail fetch failed for ${newActivities[i].source_id}`, { error: err.message });
            }
        }
    }

    // Step 4: Batch insert
    results.imported = batchInsertActivities(userDb, newActivities);

    logger.info(`[SyncUtils] Imported ${results.imported} activities from ${source}`);

    return results;
}

module.exports = {
    batchCheckExisting,
    batchInsertActivities,
    processActivityList,
};
