/* eslint-disable unused-imports/no-unused-vars, security/detect-non-literal-fs-filename */
/**
 * Garmin Sync Module
 * ==================
 * Synchronise les activités et métriques Garmin Connect vers la base de données DrawRun.
 * Appelle le script Python garmin_api.py via child_process avec persistance des tokens.
 */

'use strict';
const { logger } = require('./logger');

const { spawn } = require('child_process');
const { getUserDb, dbGetMain, dbRunMain, dbGetUser, dbRunUser, dbAllUser } = require('./database');
const { decrypt } = require('./crypto_utils');
const { sleep } = require('./db_helpers');
const { calculateAndStoreMetrics } = require('./metrics_calculator');
const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const GARMIN_TOKEN_DIR = path.join(__dirname, '..', 'data', 'garmin_tokens');
const PYTHON_SCRIPT = path.join(__dirname, '..', 'scripts', 'garmin_api.py');

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
    const user = await dbGetMain(
        'SELECT garmin_username, garmin_password FROM users WHERE id = ?',
        [userId]
    );

    if (!user || !user.garmin_username) {
        throw new Error('Garmin credentials not configured');
    }

    const password = decrypt(user.garmin_password) || user.garmin_password;
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
            username: user.garmin_username,
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
                let errorMessage = errorOutput;
                try {
                    const errJson = JSON.parse(errorOutput);
                    errorMessage = errJson.error || errorOutput;
                    if (errJson.rate_limited || errorMessage.includes('429')) {
                        errorMessage = 'Garmin temporairement indisponible (trop de tentatives). Réessayez dans 15-30 minutes.';
                    } else if (errJson.auth_failed) {
                        errorMessage = 'Identifiants Garmin incorrects.';
                    }
                } catch (e) { /* ignore JSON parse error on error output */ }
                log(userId, `Python error (code ${code}): ${errorOutput.slice(0, 200)}`);
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
async function performGarminSync(userId) {
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
        const startDate = lastActivity?.last_date || null;
        if (startDate) {
            log(userId, `Incremental sync from ${startDate}`);
        } else {
            log(userId, 'Full initial sync (no previous Garmin activities)');
        }

        // === Phase 1: Activities List ===
        const activities = await callGarminApi(userId, {
            mode: 'activities',
            start_date: startDate,
            limit: 50
        });

        const activityList = Array.isArray(activities) ? activities : [];
        let importedCount = 0;
        let detailCount = 0;

        for (const activity of activityList) {
            const sourceId = activity.activityId ? String(activity.activityId) : null;
            if (!sourceId) continue;

            let rawData = JSON.stringify(activity);

            // === Phase 2: Activity Details (si pas déjà haute résolution) ===
            const existing = await dbGetUser(userDb,
                'SELECT id FROM activities WHERE source = "garmin" AND source_id = ?',
                [sourceId]
            );

            if (!existing) {
                try {
                    const details = await callGarminApi(userId, { mode: 'details', id: sourceId });
                    if (details) {
                        rawData = JSON.stringify({ ...activity, details });
                        detailCount++;
                    }
                } catch (detailErr) {
                    log(userId, `Details failed for ${sourceId}: ${detailErr.message}`);
                }
                await sleep(200);
            }

            try {
                await dbRunUser(userDb, `
                    INSERT OR REPLACE INTO activities
                    (source, source_id, name, type, start_date, distance, moving_time,
                     average_heartrate, max_heartrate, average_speed, max_speed, calories)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    'garmin', sourceId,
                    activity.activityName || 'Garmin Activity',
                    activity.activityType?.typeKey || 'workout',
                    activity.startTimeLocal || new Date().toISOString(),
                    activity.distance || 0,
                    activity.duration || 0,
                    activity.averageHR || null,
                    activity.maxHR || null,
                    activity.averageSpeed || null,
                    activity.maxSpeed || null,
                    activity.calories || null
                ]);
                importedCount++;
                if (importedCount % 10 === 0) {
                    log(userId, `Processed ${importedCount} activities...`);
                }
            } catch (dbErr) {
                log(userId, `DB insert failed for ${sourceId}: ${dbErr.message}`);
            }
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
