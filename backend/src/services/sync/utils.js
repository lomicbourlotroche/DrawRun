/* eslint-disable unused-imports/no-unused-vars */
'use strict';

/**
 * Sync Utilities - Batch operations for activity sync
 * Uses sql.js API via dbAllUser / dbRunUser helpers from database.js
 */

const { logger } = require('../../utils/logger');
const { dbAllUser, dbRunUser } = require('../../database');
const { parseActivityFile } = require('../activityParser.service');

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
 * Merge detail data into an activity object.
 * @param {object} activity - Activity to enrich (mutated in place)
 * @param {object} details - Raw detail response from the source API
 * @param {string} source - Source name ('garmin' or 'decathlon' supported)
 */
function mergeDetails(activity, details, source) {
    if (source === 'garmin') {
        mergeGarminDetails(activity, details);
    } else if (source === 'decathlon') {
        mergeDecathlonDetails(activity, details);
    }
}

function mergeDecathlonDetails(act, d) {
    const summaries = d.dataSummaries || {};
    const locations = d.locations || {};
    const datastream = d.datastream || {};

    // Update fields from dataSummaries
    if (summaries[5]) act.distance = summaries[5]; // metres
    if (summaries[24]) {
        act.moving_time = summaries[24];
        act.elapsed_time = summaries[24];
    }
    if (summaries[23]) act.calories = summaries[23];
    if (summaries[9]) act.average_speed = summaries[9] / 3600; // m/h to m/s
    if (summaries[7]) act.max_speed = summaries[7] / 3600; // m/h to m/s
    if (summaries[4]) act.average_heartrate = summaries[4];
    if (summaries[3]) act.max_heartrate = summaries[3];
    if (summaries[10] || summaries[103]) act.average_cadence = summaries[10] || summaries[103];
    if (summaries[15]) act.elev_high = summaries[15];
    if (summaries[16]) act.elev_low = summaries[16];
    if (summaries[18]) act.total_elevation_gain = summaries[18];
    if (summaries[19]) act.total_elevation_loss = summaries[19];
    
    // Device info
    if (d.userDevice) {
        const deviceId = extractIdFromDecathlonUrl(d.userDevice);
        if (deviceId) act.device_name = String(deviceId);
    }
    
    // GPS polyline from locations
    if (locations && Object.keys(locations).length > 0) {
        const coords = Object.values(locations)
            .filter(loc => loc && loc.latitude !== undefined && loc.longitude !== undefined)
            .map(loc => [loc.longitude, loc.latitude]); // GPX format: [lng, lat]
        
        if (coords.length > 0) {
            act.map_polyline = JSON.stringify(coords);
        }
    }
    
    // Streams from datastream
    if (datastream && Object.keys(datastream).length > 0) {
        const streams = extractDecathlonStreams(datastream, d.locations);
        if (streams) act._streams = streams;
    }
    
    // Splits from datastream
    if (datastream && Object.keys(datastream).length > 0) {
        const splits = extractDecathlonSplits(datastream);
        if (splits) act._splits = splits;
    }
    
    // Fallback to name from activity if not set
    if (!act.name && d.name) {
        act.name = d.name;
    }
    
    // Fallback to start_date
    if (!act.start_date && d.startdate) {
        act.start_date = d.startdate;
    }
    
    // Manual flag
    if (d.manual !== undefined) {
        act.is_manual = d.manual ? 1 : 0;
    }
}

/**
 * Extract ID from Decathlon URL (e.g., "/v2/sports/121" -> 121)
 */
function extractIdFromDecathlonUrl(url) {
    if (!url) return null;
    const match = url.match(/\/v2\/(\w+)\/(\d+)$/);
    return match ? parseInt(match[2], 10) : null;
}

/**
 * Extract streams from Decathlon datastream
 */
function extractDecathlonStreams(datastream, locations) {
    const timestamps = Object.keys(datastream).map(Number).sort((a, b) => a - b);
    
    if (timestamps.length === 0) {
        return null;
    }
    
    const streams = {};
    
    // Decathlon datatype IDs
    const DATATYPE_MAP = {
        1: 'heartrate',       // HR current (bpm)
        3: 'max_heartrate',   // HR max
        4: 'average_heartrate', // HR avg
        5: 'distance',        // Distance (m)
        6: 'velocity_smooth', // Speed current (m/h)
        7: 'max_speed',       // Speed max (m/h)
        9: 'average_speed',   // Speed avg (m/h)
        10: 'cadence',        // Cadence current (steps/min)
        14: 'altitude',       // Elevation current (m)
        15: 'elev_high',      // Elevation max
        16: 'elev_low',       // Elevation min
        18: 'total_elevation_gain',
        19: 'total_elevation_loss',
        20: 'lap',            // Lap marker (bool)
        100: 'watts',         // Power current
        101: 'max_power',     // Power max
        103: 'average_power'  // Power avg
    };
    
    // Extract each datatype
    for (const [dtId, streamName] of Object.entries(DATATYPE_MAP)) {
        const id = parseInt(dtId, 10);
        
        // Skip if not a standard stream field
        if (streamName.startsWith('elev_') || streamName === 'distance' || streamName === 'lap') {
            continue;
        }
        
        const values = timestamps.map(t => {
            const data = datastream[t];
            if (data && data[id] !== undefined && data[id] !== null) {
                // Convert speed from m/h to m/s
                if ((id === 6 || id === 7 || id === 9) && data[id] !== 0) {
                    return data[id] / 3600;
                }
                return data[id];
            }
            return null;
        }).filter(v => v !== null);
        
        if (values.length > 0) {
            streams[streamName] = values;
        }
    }
    
    // Extract GPS from locations
    if (locations && Object.keys(locations).length > 0) {
        const gpsTimestamps = Object.keys(locations).map(Number).sort((a, b) => a - b);
        const lats = [];
        const lngs = [];
        const alts = [];
        
        for (const t of gpsTimestamps) {
            const loc = locations[t];
            if (loc && loc.latitude !== undefined && loc.longitude !== undefined) {
                lats.push(loc.latitude);
                lngs.push(loc.longitude);
                alts.push(loc.elevation || 0);
            }
        }
        
        if (lats.length > 0) {
            streams.latlng = lats.map((lat, i) => [lat, lngs[i]]);
            streams.altitude = alts;
        }
    }
    
    return Object.keys(streams).length > 0 ? streams : null;
}

/**
 * Extract splits/laps from Decathlon datastream
 */
function extractDecathlonSplits(datastream) {
    const timestamps = Object.keys(datastream).map(Number).sort((a, b) => a - b);
    
    if (timestamps.length === 0) {
        return null;
    }
    
    const splits = [];
    let currentLapStart = 0;
    // eslint-disable-next-line unused-imports/no-unused-vars
    let currentLapDist = 0;
    let currentLapStartAlt = 0;
    
    for (let i = 0; i < timestamps.length; i++) {
        const t = timestamps[i];
        const data = datastream[t];
        
        // Lap detected (datatype 20 = bool Lap)
        if (data && data[20] === 1) {
            if (i > 0) {
                const endTime = t;
                const lapDuration = endTime - currentLapStart;
                
                // Get lap distance
                let lapDistance = 0;
                const startData = datastream[currentLapStart];
                const endData = data;
                
                if (startData && startData[5] !== undefined && endData && endData[5] !== undefined) {
                    lapDistance = endData[5] - startData[5];
                }
                
                // Get lap elevation
                let lapElevation = 0;
                if (startData && startData[14] !== undefined && endData && endData[14] !== undefined) {
                    lapElevation = endData[14] - startData[14];
                }
                
                splits.push({
                    split_number: splits.length + 1,
                    distance: lapDistance || 0,
                    elapsed_time: lapDuration,
                    moving_time: lapDuration,
                    average_speed: null,
                    average_heartrate: null,
                    max_heartrate: null,
                    elevation_difference: lapElevation || null,
                    pace_zone: null
                });
            }
            
            // Start new lap
            currentLapStart = t;
            currentLapDist = datastream[t] && datastream[t][5] ? datastream[t][5] : 0;
            currentLapStartAlt = datastream[t] && datastream[t][14] ? datastream[t][14] : 0;
        }
    }
    
    return splits.length > 0 ? splits : null;
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

/**
 * Parse an uploaded activity file (GPX, TCX, or FIT) and return normalized activity data
 * @param {string} filename - Original filename
 * @param {Buffer} fileBuffer - File content as Buffer
 * @returns {Promise<Object|null>} Parsed activity data or null if unparseable
 */
async function parseUploadedActivityFile(filename, fileBuffer) {
    try {
        const activity = await parseActivityFile(filename, fileBuffer);
        
        if (!activity) {
            logger.warn('[SyncUtils] Failed to parse uploaded file', { filename });
            return null;
        }

        // Ensure required fields for processActivityList
        activity.source = 'file_upload';
        if (!activity.source_id) {
            activity.source_id = `${filename}_${Date.now()}`;
        }
        if (!activity.name) {
            activity.name = filename.split('.')[0] || 'Imported Activity';
        }
        if (!activity.type) {
            activity.type = 'run';
        }
        if (!activity.start_date) {
            activity.start_date = new Date().toISOString();
        }

        logger.info('[SyncUtils] Successfully parsed uploaded file', {
            filename,
            format: activity.source,
            source_id: activity.source_id,
            distance: activity.distance,
            duration: activity.moving_time
        });

        return activity;
    } catch (error) {
        logger.error('[SyncUtils] Error parsing uploaded file', {
            filename,
            error: error.message,
            stack: error.stack
        });
        return null;
    }
}

/**
 * Process an uploaded activity file and insert into database
 * @param {object} userDb - sql.js DB instance
 * @param {string} filename - Original filename
 * @param {Buffer} fileBuffer - File content as Buffer
 * @returns {Promise<{success: boolean, activity?: object, error?: string}>}
 */
async function processUploadedActivityFile(userDb, filename, fileBuffer) {
    // Parse the file
    const activity = await parseUploadedActivityFile(filename, fileBuffer);
    
    if (!activity) {
        return { success: false, error: 'Failed to parse activity file' };
    }

    // Process as a single-activity list
    const result = await processActivityList(userDb, 'file_upload', [activity]);

    if (result.imported > 0) {
        logger.info('[SyncUtils] Imported uploaded activity', {
            source_id: activity.source_id,
            filename
        });
        return { success: true, activity };
    }

    return { success: false, error: 'Activity already exists or import failed' };
}

module.exports = {
    batchCheckExisting,
    batchInsertActivities,
    processActivityList,
    mergeDetails,
    mergeGarminDetails,
    mergeDecathlonDetails,
    extractIdFromDecathlonUrl,
    extractDecathlonStreams,
    extractDecathlonSplits,
    parseUploadedActivityFile,
    processUploadedActivityFile
};
