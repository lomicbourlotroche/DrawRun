'use strict';

/**
 * Sync Utilities - Batch operations for activity sync
 * Uses sql.js API via dbAllUser / dbRunUser helpers from database.js
 */

const { logger } = require('./logger');
const { dbAllUser, dbRunUser } = require('./database');

/**
 * Check which source_ids already exist in the activities table.
 * @param {object} userDb - sql.js DB instance
 * @param {string} source - 'garmin' | 'strava' | 'suunto' | 'decathlon'
 * @param {string[]} sourceIds
 * @returns {Promise<Set<string>>}
 */
async function batchCheckExisting(userDb, source, sourceIds) {
    if (!sourceIds || sourceIds.length === 0) return new Set();

    try {
        // sql.js doesn't support IN (?) with array binding — query one by one in a transaction
        // or use a single query with explicit placeholders
        const placeholders = sourceIds.map(() => '?').join(',');
        const rows = await dbAllUser(
            userDb,
            `SELECT source_id FROM activities WHERE source = ? AND source_id IN (${placeholders})`,
            [source, ...sourceIds]
        );
        return new Set(rows.map(r => String(r.source_id)));
    } catch (error) {
        logger.error('[SyncUtils] batchCheckExisting failed', { error: error.message, source });
        return new Set();
    }
}

/**
 * Insert a list of new activities one by one using dbRunUser (sql.js compatible).
 * @param {object} userDb - sql.js DB instance
 * @param {object[]} activities - Normalized activity objects with `source` field set
 * @returns {Promise<number>} Number inserted
 */
async function batchInsertActivities(userDb, activities) {
    if (!activities || activities.length === 0) return 0;

    let count = 0;
    for (const act of activities) {
        try {
            // Check if it already exists before inserting (to count accurately)
            const existing = await dbAllUser(userDb,
                'SELECT id FROM activities WHERE source = ? AND source_id = ? LIMIT 1',
                [act.source || 'unknown', String(act.source_id || '')]
            );
            if (existing && existing.length > 0) continue; // already there

            await dbRunUser(userDb, `
                INSERT OR IGNORE INTO activities
                (source, source_id, name, type, start_date, distance, moving_time,
                 average_heartrate, max_heartrate, average_speed, max_speed, calories)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                act.source || 'unknown',
                String(act.source_id || ''),
                act.name || 'Activity',
                (act.type || 'run').toLowerCase(),
                act.start_date || new Date().toISOString(),
                act.distance || 0,
                act.moving_time || act.duration || 0,
                act.average_heartrate || null,
                act.max_heartrate || null,
                act.average_speed || null,
                act.max_speed || null,
                act.calories || null,
            ]);
            count++;
        } catch (err) {
            logger.warn('[SyncUtils] Insert failed for activity', {
                source_id: act.source_id,
                error: err.message,
            });
        }
    }
    return count;
}

/**
 * Process a list of activities from a sync source:
 * 1. Check which ones already exist
 * 2. Optionally fetch details for new ones
 * 3. Batch insert new ones
 *
 * @param {object} userDb - sql.js DB instance
 * @param {string} source - Source name
 * @param {object[]} activityList - Normalized activities (must have source_id)
 * @param {function|null} detailFetcher - Optional async (sourceId) => detailObject
 * @returns {Promise<{imported: number, details: number}>}
 */
async function processActivityList(userDb, source, activityList, detailFetcher = null) {
    const results = { imported: 0, details: 0 };

    if (!activityList || activityList.length === 0) {
        logger.info(`[SyncUtils] No activities to process from ${source}`);
        return results;
    }

    logger.info(`[SyncUtils] Processing ${activityList.length} activities from ${source}`);

    // Step 1: find which source_ids already exist
    const sourceIds = activityList.map(a => String(a.source_id || '')).filter(Boolean);
    const existingIds = await batchCheckExisting(userDb, source, sourceIds);
    logger.info(`[SyncUtils] ${existingIds.size} already exist, ${activityList.length - existingIds.size} new`);

    // Step 2: filter to new only
    const newActivities = activityList
        .filter(a => {
            const id = String(a.source_id || '');
            return id && !existingIds.has(id);
        })
        .map(a => ({
            source,
            source_id: String(a.source_id),
            name: a.name || `${source} Activity`,
            type: (a.type || 'run').toLowerCase(),
            start_date: a.start_date || new Date().toISOString(),
            distance: a.distance || 0,
            moving_time: a.moving_time || a.duration || 0,
            average_heartrate: a.average_heartrate || null,
            max_heartrate: a.max_heartrate || null,
            average_speed: a.average_speed || null,
            max_speed: a.max_speed || null,
            calories: a.calories || null,
        }));

    logger.info(`[SyncUtils] ${newActivities.length} new activities to import from ${source}`);

    // Step 3: optionally enrich with details (max 10 to avoid rate limits)
    if (detailFetcher && newActivities.length > 0) {
        const maxDetails = Math.min(newActivities.length, 10);
        for (let i = 0; i < maxDetails; i++) {
            try {
                const details = await detailFetcher(newActivities[i].source_id);
                if (details && typeof details === 'object') {
                    if (details.average_heartrate) newActivities[i].average_heartrate = details.average_heartrate;
                    if (details.max_heartrate)     newActivities[i].max_heartrate     = details.max_heartrate;
                    if (details.average_speed)     newActivities[i].average_speed     = details.average_speed;
                    if (details.max_speed)         newActivities[i].max_speed         = details.max_speed;
                    if (details.calories)          newActivities[i].calories          = details.calories;
                    results.details++;
                }
            } catch (err) {
                logger.warn(`[SyncUtils] Detail fetch failed for ${newActivities[i].source_id}`, { error: err.message });
            }
        }
    }

    // Step 4: insert
    results.imported = await batchInsertActivities(userDb, newActivities);
    logger.info(`[SyncUtils] Imported ${results.imported}/${newActivities.length} activities from ${source}`);

    return results;
}

module.exports = {
    batchCheckExisting,
    batchInsertActivities,
    processActivityList,
};
