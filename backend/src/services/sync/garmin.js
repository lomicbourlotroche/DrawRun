/* eslint-disable unused-imports/no-unused-vars, security/detect-non-literal-fs-filename */
/**
 * Garmin Sync Module
 * ==================
 * Synchronise les activités et métriques Garmin Connect vers la base de données DrawRun.
 * Appelle le script Python garmin_api.py via child_process avec persistance des tokens.
 */

'use strict';
const { logger } = require('../../utils/logger');

const { spawn } = require('child_process');
const { getUserDb, dbGetMain, dbRunMain, dbGetUser, dbRunUser, dbAllUser } = require('../../database');
const { decrypt } = require('../../utils/crypto');
const { sleep } = require('../../utils/helpers');
const { calculateAndStoreMetrics } = require('../metricsCalculator.service');
const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const GARMIN_TOKEN_DIR = path.join(__dirname, '..', '..', '..', 'data', 'garmin_tokens');
const PYTHON_SCRIPT = path.join(__dirname, '..', '..', '..', 'scripts', 'garmin_api.py');

function log(userId, message, ...args) {
    logger.info(`[Garmin][User ${userId}] ${message}`, ...args);
}

// ---------------------------------------------------------------------------
// Python Script Bridge
// ---------------------------------------------------------------------------

/**
 * Appelle le script Python garmin_api.py.
 * Utilise un tokenstore par utilisateur pour persister les tokens OAuth (garth).
 * Les credentials sont passés via stdin (jamais en argument de ligne de commande).
 */
async function callGarminApi(userId, options = {}) {

    let creds = await dbGetMain(
        'SELECT username, password FROM user_credentials WHERE user_id = ? AND provider = ? AND enabled = 1',
        [userId, 'garmin']
    );

    if (!creds || !creds.username) {
        // Fallback: read from legacy users.garmin_username / garmin_password columns
        const user = await dbGetMain(
            'SELECT garmin_username, garmin_password FROM users WHERE id = ? AND garmin_username IS NOT NULL',
            [userId]
        );
        if (user?.garmin_username) {
            creds = { username: user.garmin_username, password: user.garmin_password };
            // Migrate to user_credentials for next time
            try {
                await dbRunMain(
                    `INSERT OR REPLACE INTO user_credentials (user_id, provider, username, password, enabled, updated_at)
                     VALUES (?, 'garmin', ?, ?, 1, CURRENT_TIMESTAMP)`,
                    [userId, user.garmin_username, user.garmin_password]
                );
            } catch (_) { /* non-critical */ }
        }
    }

    if (!creds || !creds.username) {
        throw new Error('Garmin credentials not configured');
    }

    const password = decrypt(creds.password) || creds.password;
    const tokenstore = path.join(GARMIN_TOKEN_DIR, String(userId));

    fs.mkdirSync(tokenstore, { recursive: true });

    return new Promise((resolve, reject) => {
        const args = [
            PYTHON_SCRIPT,
            '--creds', '-',
            '--tokenstore', tokenstore,
            '--mode', options.mode || 'activities'
        ];

        if (options.id)         args.push('--id',         String(options.id));
        if (options.format)     args.push('--format',     options.format);
        if (options.days)       args.push('--days',       String(options.days));
        if (options.start)      args.push('--start',      String(options.start));
        if (options.limit)      args.push('--limit',      String(options.limit));
        if (options.start_date) args.push('--start_date', options.start_date);

        // Try python3 first, then python (for Windows compatibility)
        const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
        const pythonProcess = spawn(pythonCmd, args);

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => { output += data.toString(); });
        pythonProcess.stderr.on('data', (data) => { errorOutput += data.toString(); });

        pythonProcess.stdin.write(JSON.stringify({
            username: creds.username,
            password: password
        }));
        pythonProcess.stdin.end();

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    resolve(JSON.parse(output));
                } catch (parseError) {
                    log(userId, `Parse error: ${parseError.message}, raw: ${output.slice(0, 300)}`);
                    reject(new Error('Failed to parse Garmin data'));
                }
            } else {
                let errorMessage = errorOutput || output;
                try {
                    const errJson = JSON.parse(errorOutput || output);
                    errorMessage = errJson.error || errorMessage;
                    if (errJson.rate_limited || errorMessage.includes('429')) {
                        errorMessage = 'Garmin temporairement indisponible (IP rate-limitée). Les tokens seront réutilisés au prochain sync.';
                    } else if (errJson.blocked) {
                        errorMessage = 'Garmin bloque cette IP (Cloudflare 403). Réessayez dans quelques heures.';
                    } else if (errJson.auth_failed) {
                        errorMessage = 'Identifiants Garmin incorrects.';
                    }
                } catch (e) { /* ignore JSON parse error on error output */ }
                log(userId, `Python error (code ${code}): ${(errorOutput || output).slice(0, 300)}`);
                reject(new Error(errorMessage));
            }
        });

        pythonProcess.on('error', (error) => {
            reject(new Error(`Failed to run Python: ${error.message}`));
        });
    });
}

// ---------------------------------------------------------------------------
// Sync Logic
// ---------------------------------------------------------------------------

/**
 * Synchronisation complète Garmin pour un utilisateur.
 * Phases :
 *   1. Liste des activités (avec sync incrémentale)
 *   2. Détails de chaque activité (si manquants ou incomplets)
 *   3. Métriques de santé (FC, sommeil, stress, HRV, SpO2, steps)
 *   4. Composition corporelle (poids, masse grasse)
 *   5. Métriques avancées (VO2max, training status)
 */
async function performGarminSync(userId, options = {}) {
    const startTime = Date.now();

    try {
        const user = await dbGetMain(
            'SELECT garmin_username, garmin_password FROM users WHERE id = ?',
            [userId]
        );

        if (!user?.garmin_username) {
            throw new Error('Garmin not configured for user');
        }

        // getUserDb est async — await obligatoire
        const userDb = await getUserDb(userId);

        log(userId, 'Starting Garmin sync...');

        // Date de dernière sync pour récupération incrémentale
        const lastActivity = await dbGetUser(userDb,
            'SELECT MAX(start_date) as last_date FROM activities WHERE source = "garmin"'
        );
        const rawDate = lastActivity?.last_date || null;
        // Extract YYYY-MM-DD from various timestamp formats (ISO: '2026-05-30T14:30:00.000Z' or SQL: '2026-05-30 14:30:00')
        const startDate = rawDate ? rawDate.split(/[T ]/)[0] : null;
        const isFirstSync = !startDate;

        // Allow forced full resync via options.days (overrides incremental logic)
        const forceDays = options?.days;
        const useStartDate = forceDays ? null : startDate;

        if (forceDays) {
            log(userId, `Forced full resync: fetching ${forceDays} days of history`);
        } else if (startDate) {
            log(userId, `Incremental sync from ${startDate}`);
        } else {
            log(userId, 'Full initial sync (no previous Garmin activities) — fetching all history');
        }

        // === Phase 1: Activities List ===
        // Premier sync : pas de limite pour récupérer tout l'historique
        // Sync incrémental : limite à 100 pour les nouvelles activités récentes

        const activitiesResponse = await callGarminApi(userId, {
            mode: 'activities',
            start_date: useStartDate,
            ...(forceDays ? { days: forceDays } : (isFirstSync ? { days: 730 } : { limit: 100 }))
        });

        // Le script Python retourne { activities: [...] } pour le mode 'activities'
        const activityList = Array.isArray(activitiesResponse)
            ? activitiesResponse
            : (Array.isArray(activitiesResponse?.activities) ? activitiesResponse.activities : []);
        let importedCount = 0;
        let detailCount = 0;

        // Use batch operations from sync_utils
        const { processActivityList } = require('./utils');

        // Filter and prepare activities with ALL available fields
        const activitiesToProcess = [];
        for (const activity of activityList) {
            const sourceId = activity.activityId ? String(activity.activityId) : null;
            if (!sourceId) continue;
            activitiesToProcess.push({
                source_id: sourceId,
                name: activity.activityName || 'Garmin Activity',
                type: activity.activityType?.typeKey || 'workout',
                start_date: activity.startTimeLocal || activity.startTimeGMT,
                timezone: activity.timeZoneUnitDTO?.timeZone || null,
                distance: activity.distance || 0,
                moving_time: activity.duration || activity.movingDuration || 0,
                elapsed_time: activity.duration || 0,
                average_speed: activity.averageSpeed || null,
                max_speed: activity.maxSpeed || null,
                average_heartrate: activity.averageHR || null,
                max_heartrate: activity.maxHR || null,
                average_cadence: activity.averageRunningCadenceInStepsPerMinute || activity.averageBikingCadenceInRevPerMinute || null,
                average_power: activity.avgPower || null,
                calories: activity.calories || null,
                elev_high: activity.maxElevation || null,
                elev_low: activity.minElevation || null,
                total_elevation_gain: activity.elevationGain || null,
                device_name: activity.deviceId ? String(activity.deviceId) : null,
                description: activity.description || null,
            });
        }

        // Batch process (check existing + insert new + fetch details with GPS streams)

        const result = await processActivityList(userDb, 'garmin', activitiesToProcess, 

            (sourceId) => callGarminApi(userId, { mode: 'streams', id: sourceId })

        );



        importedCount = result.imported;

        detailCount = result.details;



        // On forced full resync: re-fetch details and streams for ALL Garmin activities from DB
        if (forceDays) {
            const allGarminActivities = await dbAllUser(userDb,
                'SELECT id, source_id FROM activities WHERE source = ? ORDER BY start_date DESC',
                ['garmin']
            );
            log(userId, `Full resync: fetching/updating details for all ${allGarminActivities.length} activities from DB...`);
            for (const act of allGarminActivities) {
                const sourceId = act.source_id;
                if (!sourceId) continue;
                try {
                    const details = await callGarminApi(userId, { mode: 'streams', id: sourceId });
                    if (details && typeof details === 'object') {
                        const activityId = act.id;
                        // Store GPS polyline
                        const geo = details.geoPolylineDTO;
                        if (geo?.polyline) {
                            await dbRunUser(userDb,
                                'UPDATE activities SET map_polyline = ? WHERE id = ?',
                                [JSON.stringify(geo.polyline), activityId]
                            );
                        }
                        // Store streams
                        if (details.activityDetailMetrics && details.metricDescriptors) {
                            const { extractGarminStreams } = require('./utils');
                            const streams = extractGarminStreams(details);
                            if (streams) {
                                for (const [streamType, streamData] of Object.entries(streams)) {
                                    if (!streamData) continue;
                                    try {
                                        await dbRunUser(userDb, `
                                            INSERT OR REPLACE INTO activity_streams (activity_id, stream_type, data)
                                            VALUES (?, ?, ?)
                                        `, [activityId, streamType, JSON.stringify(streamData)]);
                                    } catch (e) { /* skip */ }
                                }
                            }
                        }
                        // Store splits
                        if (Array.isArray(details.splitSummaries) && details.splitSummaries.length > 0) {
                            for (const [i, s] of details.splitSummaries.entries()) {
                                try {
                                    await dbRunUser(userDb, `
                                        INSERT OR IGNORE INTO activity_splits
                                        (activity_id, split_number, distance, elapsed_time, moving_time,
                                         average_speed, average_heartrate, max_heartrate, elevation_difference, pace_zone)
                                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                    `, [
                                        activityId, i + 1, s.distance || 0, s.duration || 0,
                                        s.movingDuration || s.duration || 0, s.averageSpeed || null,
                                        s.averageHR || null, s.maxHR || null,
                                        s.elevationGain || null, s.paceZone || null,
                                    ]);
                                } catch (e) { /* skip */ }
                            }
                        }
                        detailCount++;
                        log(userId, `  OK source_id=${sourceId} (${detailCount}/${allGarminActivities.length})`);
                    }
                } catch (err) {
                    log(userId, `  FAIL source_id=${sourceId}: ${err.message}`);
                    // If rate limited, wait before retrying
                    if (err.message.includes('429') || err.message.includes('rate')) {
                        log(userId, 'Rate limited by Garmin — waiting 60s before next attempt...');
                        await sleep(60000);
                    }
                }
                // Delay between API calls to prevent rate limiting
                if (detailCount < allGarminActivities.length) {
                    await sleep(2000);
                }
            }
            log(userId, `Details updated for ${detailCount}/${allGarminActivities.length} activities`);
        }

        log(userId, `Imported ${importedCount} activities (${detailCount} with details)`);

        // === Phase 3: Health Metrics ===
        try {
            log(userId, 'Syncing health metrics...');
            const healthData = await callGarminApi(userId, { mode: 'health', days: 30 });

            if (healthData && typeof healthData === 'object') {
                for (const [date, entry] of Object.entries(healthData)) {
                    if (entry.heart_rate?.resting) {
                        await dbRunUser(userDb, `
                            INSERT OR REPLACE INTO performance_metrics
                            (user_id, metric_type, metric_value, metric_unit, recorded_at, source)
                            VALUES (?, 'resting_hr', ?, 'bpm', ?, 'garmin')
                        `, [userId, entry.heart_rate.resting, date]);
                    }
                    if (entry.sleep?.duration_seconds) {
                        const hours = Math.round(entry.sleep.duration_seconds / 3600 * 10) / 10;
                        await dbRunUser(userDb, `
                            INSERT OR REPLACE INTO performance_metrics
                            (user_id, metric_type, metric_value, metric_unit, recorded_at, source)
                            VALUES (?, 'sleep_hours', ?, 'hours', ?, 'garmin')
                        `, [userId, hours, date]);
                    }
                    if (entry.sleep?.score) {
                        await dbRunUser(userDb, `
                            INSERT OR REPLACE INTO performance_metrics
                            (user_id, metric_type, metric_value, metric_unit, recorded_at, source)
                            VALUES (?, 'sleep_score', ?, 'score', ?, 'garmin')
                        `, [userId, entry.sleep.score, date]);
                    }
                    if (entry.stress?.avg) {
                        await dbRunUser(userDb, `
                            INSERT OR REPLACE INTO performance_metrics
                            (user_id, metric_type, metric_value, metric_unit, recorded_at, source)
                            VALUES (?, 'stress_avg', ?, 'level', ?, 'garmin')
                        `, [userId, entry.stress.avg, date]);
                    }
                    if (entry.hrv?.last_night_avg) {
                        await dbRunUser(userDb, `
                            INSERT OR REPLACE INTO performance_metrics
                            (user_id, metric_type, metric_value, metric_unit, recorded_at, source)
                            VALUES (?, 'hrv_avg', ?, 'ms', ?, 'garmin')
                        `, [userId, entry.hrv.last_night_avg, date]);
                    }
                    if (entry.spo2?.avg) {
                        await dbRunUser(userDb, `
                            INSERT OR REPLACE INTO performance_metrics
                            (user_id, metric_type, metric_value, metric_unit, recorded_at, source)
                            VALUES (?, 'spo2_avg', ?, '%', ?, 'garmin')
                        `, [userId, entry.spo2.avg, date]);
                    }
                    if (entry.steps?.total) {
                        await dbRunUser(userDb, `
                            INSERT OR REPLACE INTO performance_metrics
                            (user_id, metric_type, metric_value, metric_unit, recorded_at, source)
                            VALUES (?, 'steps', ?, 'steps', ?, 'garmin')
                        `, [userId, entry.steps.total, date]);
                    }
                }
                log(userId, 'Health metrics synced');
            }
        } catch (healthErr) {
            log(userId, `Health metrics error: ${healthErr.message}`);
        }

        // === Phase 4: Body Composition ===
        try {
            log(userId, 'Syncing body composition...');
            const bodyData = await callGarminApi(userId, { mode: 'body', days: 30 });

            if (bodyData && typeof bodyData === 'object') {
                for (const [date, entry] of Object.entries(bodyData)) {
                    if (entry.weight) {
                        const weightKg = entry.weight > 1000 ? entry.weight / 1000 : entry.weight;
                        await dbRunUser(userDb, `
                            INSERT OR REPLACE INTO performance_metrics
                            (user_id, metric_type, metric_value, metric_unit, recorded_at, source)
                            VALUES (?, 'weight', ?, 'kg', ?, 'garmin')
                        `, [userId, weightKg, date]);
                    }
                    if (entry.body_fat) {
                        await dbRunUser(userDb, `
                            INSERT OR REPLACE INTO performance_metrics
                            (user_id, metric_type, metric_value, metric_unit, recorded_at, source)
                            VALUES (?, 'body_fat', ?, '%', ?, 'garmin')
                        `, [userId, entry.body_fat, date]);
                    }
                }
                log(userId, 'Body composition synced');
            }
        } catch (bodyErr) {
            log(userId, `Body composition error: ${bodyErr.message}`);
        }

        // === Phase 5: Advanced Metrics (VO2max, training status) ===
        try {
            log(userId, 'Syncing advanced metrics...');
            const metricsData = await callGarminApi(userId, { mode: 'metrics' });

            if (metricsData) {
                const vo2max = metricsData.max_metrics?.vo2Max
                    || metricsData.max_metrics?.vo2max
                    || (typeof metricsData.max_metrics === 'number' ? metricsData.max_metrics : null);
                if (vo2max) {
                    await dbRunUser(userDb, `
                        INSERT OR REPLACE INTO performance_metrics
                        (user_id, metric_type, metric_value, metric_unit, recorded_at, source)
                        VALUES (?, 'vo2max', ?, 'ml/kg/min', ?, 'garmin')
                    `, [userId, vo2max, new Date().toISOString().split('T')[0]]);
                    log(userId, `VO2max: ${vo2max}`);
                }

                // Stocker les métriques complètes dans le profil utilisateur
                try {
                    await dbRunMain(
                        `UPDATE users SET profile_data = json_set(COALESCE(profile_data, '{}'), '$.garmin_metrics', ?) WHERE id = ?`,
                        [JSON.stringify(metricsData), userId]
                    );
                } catch (e) {
                    log(userId, `Profile update failed: ${e.message}`);
                }
            }
        } catch (metricsErr) {
            log(userId, `Advanced metrics error: ${metricsErr.message}`);
        }

        // === Phase 6: Calculate post-sync metrics (TSS, VDOT, PMC) ===
        try {
            log(userId, 'Calculating post-sync metrics...');
            const metricsResult = await calculateAndStoreMetrics(userId, userDb);
            if (metricsResult.success) {
                log(userId, `Metrics calculated: count=${metricsResult.calculated}, VDOT=${metricsResult.vdot || 'N/A'}`);
            }
        } catch (e) {
            log(userId, `Metrics calculation failed: ${e.message}`);
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        log(userId, `Sync complete in ${elapsed}s: ${importedCount}/${activityList.length} activities`);

        return {
            success: true,
            imported: importedCount,
            total: activityList.length,
            message: `Sync complete: ${importedCount} activities in ${elapsed}s`
        };

    } catch (error) {
        log(userId, `Sync error: ${error.message}`);
        return { success: false, message: error.message };
    }
}

// ---------------------------------------------------------------------------
// Manual Sync & Status
// ---------------------------------------------------------------------------

async function triggerManualSync(userId, options = {}) {
    log(userId, 'Manual sync triggered', options);
    return performGarminSync(userId);
}

async function getGarminSyncStatus(userId) {
    try {
        const userDb = await getUserDb(userId);

        const lastSync = await dbGetUser(userDb,
            'SELECT MAX(created_at) as last_sync FROM activities WHERE source = "garmin"'
        );

        const user = await dbGetMain(
            'SELECT garmin_username FROM users WHERE id = ?', [userId]
        );

        const hasTokens = fs.existsSync(path.join(GARMIN_TOKEN_DIR, String(userId)));

        return {
            source: 'garmin',
            last_sync: lastSync?.last_sync || null,
            status: 'idle',
            configured: !!(user?.garmin_username),
            has_tokens: hasTokens
        };
    } catch (error) {
        log(userId, `Status error: ${error.message}`);
        return { source: 'garmin', last_sync: null, status: 'error', configured: false, has_tokens: false };
    }
}

/**
 * Invalide les tokens Garmin stockés (force le re-login au prochain sync).
 */
async function clearGarminTokens(userId) {
    const tokenDir = path.join(GARMIN_TOKEN_DIR, String(userId));
    try {
        if (fs.existsSync(tokenDir)) {
            fs.rmSync(tokenDir, { recursive: true, force: true });
            log(userId, 'Tokens cleared');
        }
        return { success: true };
    } catch (error) {
        log(userId, `Token clear failed: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
    performGarminSync,
    triggerManualSync,
    getGarminSyncStatus,
    clearGarminTokens,
    callGarminApi,
};
