'use strict';

/**
 * Sync Utilities - Batch operations for activity sync
 * Uses sql.js API via dbAllUser / dbRunUser helpers from database.js
 */

const { logger } = require('../../utils/logger');
const { dbAllUser, dbRunUser } = require('../../database');

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
 * Insert a list of new activities with ALL available fields.
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
                (source, source_id, name, type, start_date, timezone, distance, moving_time, elapsed_time,
                 average_speed, max_speed, average_heartrate, max_heartrate, average_cadence, average_power,
                 calories, elev_high, elev_low, total_elevation_gain, map_polyline, map_summary_polyline,
                 intensity_factor, tss, trimp, normalized_power, variability_index, normalized_speed,
                 running_index, hrv_rmssd, hrv_samples, raw_data_key, external_id, upload_id,
                 device_name, description, notes, is_race, is_commute, is_manual, gear_id, efficiency_factor)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                act.source || 'unknown',
                String(act.source_id || ''),
                act.name || 'Activity',
                (act.type || 'run').toLowerCase(),
                act.start_date || new Date().toISOString(),
                act.timezone || null,
                act.distance || 0,
                act.moving_time || act.duration || 0,
                act.elapsed_time || act.moving_time || act.duration || 0,
                act.average_speed || null,
                act.max_speed || null,
                act.average_heartrate || null,
                act.max_heartrate || null,
                act.average_cadence || null,
                act.average_power || null,
                act.calories || null,
                act.elev_high || null,
                act.elev_low || null,
                act.total_elevation_gain || null,
                act.map_polyline || null,
                act.map_summary_polyline || null,
                act.intensity_factor || null,
                act.tss || null,
                act.trimp || null,
                act.normalized_power || null,
                act.variability_index || null,
                act.normalized_speed || null,
                act.running_index || null,
                act.hrv_rmssd || null,
                act.hrv_samples || null,
                act.raw_data_key || null,
                act.external_id || null,
                act.upload_id || null,
                act.device_name || null,
                act.description || null,
                act.notes || null,
                act.is_race || 0,
                act.is_commute || 0,
                act.is_manual || 0,
                act.gear_id || null,
                act.efficiency_factor || null,
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
 * 2. Fetch details for ALL new ones (GPS, streams, splits, cadence, power…)
 * 3. Batch insert new ones with full data
 * 4. Store GPS streams in activity_streams table
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

    // Step 2: filter to new only, preserve all fields from the source
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
            timezone: a.timezone || null,
            distance: a.distance || 0,
            moving_time: a.moving_time || a.duration || 0,
            elapsed_time: a.elapsed_time || a.moving_time || a.duration || 0,
            average_speed: a.average_speed || null,
            max_speed: a.max_speed || null,
            average_heartrate: a.average_heartrate || null,
            max_heartrate: a.max_heartrate || null,
            average_cadence: a.average_cadence || null,
            average_power: a.average_power || null,
            calories: a.calories || null,
            elev_high: a.elev_high || null,
            elev_low: a.elev_low || null,
            total_elevation_gain: a.total_elevation_gain || null,
            map_polyline: a.map_polyline || null,
            map_summary_polyline: a.map_summary_polyline || null,
            intensity_factor: a.intensity_factor || null,
            tss: a.tss || null,
            trimp: a.trimp || null,
            normalized_power: a.normalized_power || null,
            variability_index: a.variability_index || null,
            normalized_speed: a.normalized_speed || null,
            running_index: a.running_index || null,
            hrv_rmssd: a.hrv_rmssd || null,
            hrv_samples: a.hrv_samples || null,
            raw_data_key: a.raw_data_key || null,
            external_id: a.external_id || null,
            upload_id: a.upload_id || null,
            device_name: a.device_name || null,
            description: a.description || null,
            notes: a.notes || null,
            is_race: a.is_race || 0,
            is_commute: a.is_commute || 0,
            is_manual: a.is_manual || 0,
            gear_id: a.gear_id || null,
            efficiency_factor: a.efficiency_factor || null,
            // Streams (GPS, HR, cadence, power, altitude) — stored separately
            _streams: a._streams || null,
            // Splits — stored separately
            _splits: a._splits || null,
        }));

    logger.info(`[SyncUtils] ${newActivities.length} new activities to import from ${source}`);

    // Step 3: fetch details for ALL new activities (no arbitrary cap)
    if (detailFetcher && newActivities.length > 0) {
        logger.info(`[SyncUtils] Fetching details for ${newActivities.length} activities from ${source}`);
        for (let i = 0; i < newActivities.length; i++) {
            try {
                const details = await detailFetcher(newActivities[i].source_id);
                if (details && typeof details === 'object') {
                    mergeDetails(newActivities[i], details, source);
                    results.details++;
                }
            } catch (err) {
                logger.warn(`[SyncUtils] Detail fetch failed for ${newActivities[i].source_id}`, { error: err.message });
            }
        }
        logger.info(`[SyncUtils] Got details for ${results.details}/${newActivities.length} activities`);
    }

    // Step 4: insert activities
    results.imported = await batchInsertActivities(userDb, newActivities);
    logger.info(`[SyncUtils] Imported ${results.imported}/${newActivities.length} activities from ${source}`);

    // Step 5: store streams (GPS, HR, cadence, power, altitude) for activities that have them
    let streamsStored = 0;
    for (const act of newActivities) {
        if (!act._streams) continue;
        try {
            // Get the DB id of the just-inserted activity
            const row = await dbAllUser(userDb,
                'SELECT id FROM activities WHERE source = ? AND source_id = ? LIMIT 1',
                [source, act.source_id]
            );
            if (!row || row.length === 0) continue;
            const activityDbId = row[0].id;

            for (const [streamType, streamData] of Object.entries(act._streams)) {
                if (!streamData) continue;
                try {
                    await dbRunUser(userDb, `
                        INSERT OR REPLACE INTO activity_streams (activity_id, stream_type, data)
                        VALUES (?, ?, ?)
                    `, [activityDbId, streamType, JSON.stringify(streamData)]);
                    streamsStored++;
                } catch (e) {
                    logger.warn(`[SyncUtils] Stream insert failed`, { activityId: activityDbId, streamType, error: e.message });
                }
            }
        } catch (e) {
            logger.warn(`[SyncUtils] Streams storage failed for ${act.source_id}`, { error: e.message });
        }
    }
    if (streamsStored > 0) {
        logger.info(`[SyncUtils] Stored ${streamsStored} streams for ${source} activities`);
    }

    // Step 6: store splits
    let splitsStored = 0;
    for (const act of newActivities) {
        if (!act._splits || !Array.isArray(act._splits) || act._splits.length === 0) continue;
        try {
            const row = await dbAllUser(userDb,
                'SELECT id FROM activities WHERE source = ? AND source_id = ? LIMIT 1',
                [source, act.source_id]
            );
            if (!row || row.length === 0) continue;
            const activityDbId = row[0].id;

            for (const split of act._splits) {
                try {
                    await dbRunUser(userDb, `
                        INSERT OR IGNORE INTO activity_splits
                        (activity_id, split_number, distance, elapsed_time, moving_time,
                         average_speed, average_heartrate, max_heartrate, elevation_difference, pace_zone)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        activityDbId,
                        split.split_number || split.splitNumber || split.number || 0,
                        split.distance || 0,
                        split.elapsed_time || split.elapsedTime || 0,
                        split.moving_time || split.movingTime || split.elapsed_time || 0,
                        split.average_speed || split.averageSpeed || null,
                        split.average_heartrate || split.averageHR || null,
                        split.max_heartrate || split.maxHR || null,
                        split.elevation_difference || split.elevationDifference || null,
                        split.pace_zone || split.paceZone || null,
                    ]);
                    splitsStored++;
                } catch (e) {
                    logger.warn(`[SyncUtils] Split insert failed`, { activityId: activityDbId, error: e.message });
                }
            }
        } catch (e) {
            logger.warn(`[SyncUtils] Splits storage failed for ${act.source_id}`, { error: e.message });
        }
    }
    if (splitsStored > 0) {
        logger.info(`[SyncUtils] Stored ${splitsStored} splits for ${source} activities`);
    }

    return results;
}

/**
 * Merge detail data into an activity object, handling source-specific field names.
 * @param {object} activity - Activity to enrich (mutated in place)
 * @param {object} details - Raw detail response from the source API
 * @param {string} source - 'garmin' | 'strava' | 'suunto' | 'decathlon'
 */
function mergeDetails(activity, details, source) {
    if (source === 'garmin') {
        mergeGarminDetails(activity, details);
    } else if (source === 'strava') {
        mergeStravaDetails(activity, details);
    } else if (source === 'suunto') {
        mergeSuuntoDetails(activity, details);
    } else if (source === 'decathlon') {
        mergeDecathlonDetails(activity, details);
    }
}

function mergeGarminDetails(act, d) {
    // Garmin get_activity_details returns a complex nested object
    const summary = d.summaryDTO || d;
    const _metrics = d.connectIQMeasurements || [];

    if (summary.averageHR)          act.average_heartrate = summary.averageHR;
    if (summary.maxHR)              act.max_heartrate = summary.maxHR;
    if (summary.averageSpeed)       act.average_speed = summary.averageSpeed;
    if (summary.maxSpeed)           act.max_speed = summary.maxSpeed;
    if (summary.calories)           act.calories = summary.calories;
    if (summary.averageRunCadence)  act.average_cadence = summary.averageRunCadence;
    if (summary.averageBikeCadence) act.average_cadence = act.average_cadence || summary.averageBikeCadence;
    if (summary.averagePower)       act.average_power = summary.averagePower;
    if (summary.normPower)          act.normalized_power = summary.normPower;
    if (summary.maxElevation)       act.elev_high = summary.maxElevation;
    if (summary.minElevation)       act.elev_low = summary.minElevation;
    if (summary.elevationGain)      act.total_elevation_gain = summary.elevationGain;
    if (summary.deviceId)           act.device_name = String(summary.deviceId);
    if (summary.trainingEffect)     act.intensity_factor = summary.trainingEffect;
    if (summary.hrv)                act.hrv_rmssd = summary.hrv;
    if (summary.runningIndex)       act.running_index = summary.runningIndex;
    if (summary.vO2MaxValue)        act.running_index = act.running_index || summary.vO2MaxValue;

    // GPS polyline from measurementSummary or geoPolylineDTO
    const geo = d.geoPolylineDTO;
    if (geo?.polyline) {
        act.map_polyline = JSON.stringify(geo.polyline);
    }

    // Streams: GPS track points
    const measurementSets = d.activityDetailMetrics || d.metricDescriptors;
    if (measurementSets && d.activityDetailMetrics) {
        const streams = extractGarminStreams(d);
        if (streams) act._streams = streams;
    }

    // Splits / laps
    if (Array.isArray(d.splitSummaries) && d.splitSummaries.length > 0) {
        act._splits = d.splitSummaries.map((s, i) => ({
            split_number: i + 1,
            distance: s.distance || 0,
            elapsed_time: s.duration || 0,
            moving_time: s.movingDuration || s.duration || 0,
            average_speed: s.averageSpeed || null,
            average_heartrate: s.averageHR || null,
            max_heartrate: s.maxHR || null,
            elevation_difference: s.elevationGain || null,
            pace_zone: s.paceZone || null,
        }));
    }
}

function extractGarminStreams(d) {
    const descriptors = d.metricDescriptors;
    const metrics = d.activityDetailMetrics;
    if (!descriptors || !metrics) return null;

    // Build column index map
    const colMap = {};
    descriptors.forEach((desc, i) => {
        colMap[desc.key] = i;
    });

    const streams = {};
    const streamKeys = {
        'directLatitude': 'latlng_lat',
        'directLongitude': 'latlng_lng',
        'directHeartRate': 'heartrate',
        'directSpeed': 'velocity_smooth',
        'directCadence': 'cadence',
        'directAltitude': 'altitude',
        'directPower': 'watts',
        'directTimestamp': 'time',
        'directDistance': 'distance',
    };

    for (const [garminKey, streamName] of Object.entries(streamKeys)) {
        const colIdx = colMap[garminKey];
        if (colIdx === undefined) continue;
        const values = metrics.map(m => m.metrics?.[colIdx] ?? null).filter(v => v !== null);
        if (values.length > 0) streams[streamName] = values;
    }

    // Combine lat/lng into latlng pairs
    if (streams.latlng_lat && streams.latlng_lng) {
        streams.latlng = streams.latlng_lat.map((lat, i) => [lat, streams.latlng_lng[i]]);
        delete streams.latlng_lat;
        delete streams.latlng_lng;
    }

    return Object.keys(streams).length > 0 ? streams : null;
}

function mergeStravaDetails(act, d) {
    if (d.average_heartrate)    act.average_heartrate = d.average_heartrate;
    if (d.max_heartrate)        act.max_heartrate = d.max_heartrate;
    if (d.average_speed)        act.average_speed = d.average_speed;
    if (d.max_speed)            act.max_speed = d.max_speed;
    if (d.calories)             act.calories = d.calories;
    if (d.average_cadence)      act.average_cadence = d.average_cadence;
    if (d.average_watts)        act.average_power = d.average_watts;
    if (d.weighted_average_watts) act.normalized_power = d.weighted_average_watts;
    if (d.elev_high)            act.elev_high = d.elev_high;
    if (d.elev_low)             act.elev_low = d.elev_low;
    if (d.total_elevation_gain) act.total_elevation_gain = d.total_elevation_gain;
    if (d.device_name)          act.device_name = d.device_name;
    if (d.description)          act.description = d.description;
    if (d.gear_id)              act.gear_id = d.gear_id;
    if (d.commute)              act.is_commute = d.commute ? 1 : 0;
    if (d.workout_type === 1)   act.is_race = 1;
    if (d.upload_id)            act.upload_id = String(d.upload_id);
    if (d.external_id)          act.external_id = d.external_id;
    if (d.timezone)             act.timezone = d.timezone;

    // GPS polyline
    if (d.map?.polyline)         act.map_polyline = d.map.polyline;
    if (d.map?.summary_polyline) act.map_summary_polyline = d.map.summary_polyline;

    // Streams (GPS, HR, cadence, power, altitude) — passed as _streams from the caller
    if (d._streams) act._streams = d._streams;

    // Splits
    if (Array.isArray(d.splits_metric) && d.splits_metric.length > 0) {
        act._splits = d.splits_metric.map((s, i) => ({
            split_number: s.split || i + 1,
            distance: s.distance || 0,
            elapsed_time: s.elapsed_time || 0,
            moving_time: s.moving_time || 0,
            average_speed: s.average_speed || null,
            average_heartrate: s.average_heartrate || null,
            max_heartrate: s.max_heartrate || null,
            elevation_difference: s.elevation_difference || null,
            pace_zone: s.pace_zone ? String(s.pace_zone) : null,
        }));
    }
}

function mergeSuuntoDetails(act, d) {
    // Suunto samples response
    if (!d) return;
    const samples = Array.isArray(d) ? d : (d.samples || d.data || []);

    if (samples.length === 0) return;

    // Extract streams from samples
    const streams = {};
    const lats = [], lngs = [], hrs = [], alts = [], speeds = [], cadences = [], times = [];

    for (const sample of samples) {
        if (sample.latitude !== undefined && sample.longitude !== undefined) {
            lats.push(sample.latitude);
            lngs.push(sample.longitude);
        }
        if (sample.hr !== undefined)       hrs.push(sample.hr);
        if (sample.altitude !== undefined) alts.push(sample.altitude);
        if (sample.speed !== undefined)    speeds.push(sample.speed);
        if (sample.cadence !== undefined)  cadences.push(sample.cadence);
        if (sample.time !== undefined)     times.push(sample.time);
    }

    if (lats.length > 0) streams.latlng = lats.map((lat, i) => [lat, lngs[i]]);
    if (hrs.length > 0)      streams.heartrate = hrs;
    if (alts.length > 0)     streams.altitude = alts;
    if (speeds.length > 0)   streams.velocity_smooth = speeds;
    if (cadences.length > 0) streams.cadence = cadences;
    if (times.length > 0)    streams.time = times;

    if (Object.keys(streams).length > 0) act._streams = streams;

    // Build GPS polyline from lat/lng points
    if (lats.length > 0) {
        act.map_polyline = JSON.stringify(lats.map((lat, i) => [lat, lngs[i]]));
    }
}

function mergeDecathlonDetails(_act, _d) {
    // Decathlon detail response — placeholder for future enhancement
}

module.exports = {
    batchCheckExisting,
    batchInsertActivities,
    processActivityList,
    mergeDetails,
};
