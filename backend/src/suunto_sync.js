/* eslint-disable security/detect-non-literal-fs-filename, unused-imports/no-unused-vars, no-constant-condition */
/**
 * Suunto Sync Module (Unofficial - cloud.suunto.com Reverse-Engineered API)
 * =========================================================================
 * Synchronise les activités Suunto SANS API officielle.
 * Utilise l'API reverse-engineérée de cloud.suunto.com avec email/password.
 * Pas besoin d'inscription développeur.
 *
 * Flux:
 * 1. Login via OAuth2 Suunto (client_id hardcodé de l'app mobile)
 * 2. Sauvegarde du token d'accès
 * 3. Récupération des activités via l'API cloud
 * 4. Extraction des détails et métriques
 */

'use strict';

const axios = require('axios');
const { getUserDb, dbGetMain, dbRunMain, dbGetUser, dbRunUser } = require('./database');
const { decrypt } = require('./crypto_utils');
const { calculateAndStoreMetrics } = require('./metrics_calculator');
const path = require('path');
const fs = require('fs');
const { logger } = require('./logger');

// ---------------------------------------------------------------------------
// Configuration (Suunto mobile app client credentials)
// ---------------------------------------------------------------------------

const SUUNTO_TOKEN_DIR = path.join(__dirname, '..', 'data', 'suunto_tokens');
const SUUNTO_AUTH_URL = 'https://cloudapi.suunto.com/oauth/token';
const SUUNTO_API_BASE = 'https://cloud.suunto.com/api/v2';

// Suunto mobile app OAuth client (reverse-engineered)
const SUUNTO_CLIENT_ID = 'suunto-mobile-app';
const SUUNTO_SCOPE = 'workout:read workout:write user:read';

function log(userId, message, ...args) {
    logger.info(`[Suunto][User ${userId}] ${message}`, ...args);
}

// ---------------------------------------------------------------------------
// Token Management
// ---------------------------------------------------------------------------

const ALLOWED_TOKEN_DIR = path.resolve(SUUNTO_TOKEN_DIR);

function getTokenPath(userId) {
    const tokenPath = path.resolve(ALLOWED_TOKEN_DIR, `${String(userId).replace(/[^0-9]/g, '')}.json`);
    if (!tokenPath.startsWith(ALLOWED_TOKEN_DIR)) {
        throw new Error('Invalid token path');
    }
    return tokenPath;
}

async function loadToken(userId) {
    const tokenPath = getTokenPath(userId);
    if (!fs.existsSync(tokenPath)) return null;

    try {
        return JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
    } catch (e) {
        return null;
    }
}

async function saveToken(userId, tokenData) {
    fs.mkdirSync(SUUNTO_TOKEN_DIR, { recursive: true });
    fs.writeFileSync(getTokenPath(userId), JSON.stringify({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
    }));
    log(userId, 'Saved token');
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

async function loginToSuunto(email, password) {
    const response = await axios.post(SUUNTO_AUTH_URL, new URLSearchParams({
        grant_type: 'password',
        username: email,
        password: password,
        client_id: SUUNTO_CLIENT_ID,
        scope: SUUNTO_SCOPE,
    }), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Suunto/5.25.0 (iPhone; iOS 17.0)',
        },
        timeout: 15000,
    });

    return response.data;
}

async function refreshToken(refreshToken) {
    const response = await axios.post(SUUNTO_AUTH_URL, new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: SUUNTO_CLIENT_ID,
    }), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Suunto/5.25.0 (iPhone; iOS 17.0)',
        },
        timeout: 15000,
    });

    return response.data;
}

async function getValidToken(userId, email, password) {
    // Try saved token first
    const saved = await loadToken(userId);
    if (saved) {
        // Check if token is about to expire (5 min buffer)
        if (saved.expiresAt - Date.now() > 5 * 60 * 1000) {
            return saved.accessToken;
        }

        // Try refresh
        if (saved.refreshToken) {
            try {
                const newTokens = await refreshToken(saved.refreshToken);
                await saveToken(userId, newTokens);
                return newTokens.access_token;
            } catch (e) {
                log(userId, `Token refresh failed: ${e.message}`);
            }
        }
    }

    // Login with credentials
    const tokens = await loginToSuunto(email, password);
    await saveToken(userId, tokens);
    return tokens.access_token;
}

// ---------------------------------------------------------------------------
// API Calls
// ---------------------------------------------------------------------------

async function suuntoGet(accessToken, endpoint, params = {}) {
    const url = new URL(`${SUUNTO_API_BASE}${endpoint}`);
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });

    const response = await axios.get(url.toString(), {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'User-Agent': 'Suunto/5.25.0 (iPhone; iOS 17.0)',
        },
        timeout: 30000,
    });

    return response.data;
}

async function getUserProfile(accessToken) {
    return suuntoGet(accessToken, '/profile');
}

async function getActivities(accessToken, options = {}) {
    const { from, to, limit = 100, offset = 0 } = options;
    return suuntoGet(accessToken, '/workout', {
        from,
        to,
        limit,
        offset,
    });
}

async function getActivityDetail(accessToken, activityId) {
    return suuntoGet(accessToken, `/workout/${activityId}`);
}

async function getActivitySamples(accessToken, activityId) {
    return suuntoGet(accessToken, `/workout/${activityId}/samples`);
}

async function getUserSummary(accessToken) {
    return suuntoGet(accessToken, '/summary');
}

// ---------------------------------------------------------------------------
// Type Mapping
// ---------------------------------------------------------------------------

function mapSuuntoType(sportName) {
    if (!sportName) return 'workout';

    const name = sportName.toLowerCase();
    const typeMap = {
        'running': 'run',
        'trail running': 'run',
        'treadmill running': 'run',
        'track running': 'run',
        'cycling': 'ride',
        'mountain biking': 'ride',
        'gravel cycling': 'ride',
        'indoor cycling': 'ride',
        'swimming': 'swim',
        'pool swimming': 'swim',
        'open water swimming': 'swim',
        'walking': 'walk',
        'hiking': 'walk',
        'strength training': 'workout',
        'cross training': 'workout',
        'yoga': 'workout',
        'skiing': 'workout',
        'snowboarding': 'workout',
    };

    for (const [key, value] of Object.entries(typeMap)) {
        if (name.includes(key)) return value;
    }

    return 'workout';
}

// ---------------------------------------------------------------------------
// Sync Logic
// ---------------------------------------------------------------------------

async function performSuuntoSync(userId) {
    const startTime = Date.now();
    log(userId, 'Starting Suunto sync (unofficial)...');

    try {
        // Get credentials
        const user = await dbGetMain(
            'SELECT suunto_username, suunto_password FROM users WHERE id = ?',
            [userId]
        );

        if (!user?.suunto_username || !user?.suunto_password) {
            throw new Error('Suunto credentials not configured.');
        }

        const email = user.suunto_username;
        const password = decrypt(user.suunto_password) || user.suunto_password;

        // Get valid token
        const accessToken = await getValidToken(userId, email, password);

        // Get user DB
        const userDb = await getUserDb(userId);

        // === Phase 1: User Profile ===
        try {
            const profile = await getUserProfile(accessToken);
            if (profile) {
                log(userId, `Connected as: ${profile.firstName || ''} ${profile.lastName || ''}`);
            }
        } catch (e) {
            log(userId, `Profile fetch failed: ${e.message}`);
        }

        // === Phase 2: Activities ===
        let totalImported = 0;
        let totalUpdated = 0;

        try {
            // Get last sync date
            const lastActivity = await dbGetUser(userDb,
                'SELECT MAX(start_date) as last_date FROM activities WHERE source = "suunto"'
            );

            // Date range for sync
            const to = new Date().toISOString();
            let from;
            const isFirstSync = !lastActivity?.last_date;
            if (lastActivity?.last_date) {
                from = new Date(lastActivity.last_date).toISOString();
                log(userId, `Incremental sync from ${from}`);
            } else {
                // Full sync: fetch all history from Suunto epoch (2010-01-01)
                from = new Date('2010-01-01T00:00:00.000Z').toISOString();
                log(userId, 'Full initial sync — fetching all history from 2010');
            }

            // Fetch activities with pagination
            let allActivities = [];
            let offset = 0;
            const limit = 100;

            while (true) {
                const batch = await getActivities(accessToken, { from, to, limit, offset });

                if (!Array.isArray(batch) || batch.length === 0) break;

                allActivities = allActivities.concat(batch);
                if (batch.length < limit) break;
                offset += limit;

                // Use batch processing - no per-activity sleep
            }

            log(userId, `Found ${allActivities.length} activities`);

            // Prepare activities for batch processing with ALL available fields
            const activitiesToProcess = allActivities
                .filter(activity => activity.id)
                .map(activity => ({
                    source_id: String(activity.id),
                    name: activity.title || activity.name || 'Suunto Activity',
                    type: mapSuuntoType(activity.sport || activity.sportName),
                    start_date: activity.startTime || activity.timestamp || new Date().toISOString(),
                    distance: activity.distance || 0,
                    moving_time: activity.duration || activity.durationInSeconds || 0,
                    elapsed_time: activity.duration || activity.durationInSeconds || 0,
                    total_elevation_gain: activity.elevationGain || activity.ascent || 0,
                    elev_high: activity.maxAltitude || null,
                    elev_low: activity.minAltitude || null,
                    average_heartrate: activity.avgHeartRate || activity.averageHeartRate || null,
                    max_heartrate: activity.maxHeartRate || activity.maximumHeartRate || null,
                    average_cadence: activity.avgCadence || activity.averageCadence || null,
                    average_power: activity.avgPower || activity.averagePower || null,
                    average_speed: activity.avgSpeed || activity.averageSpeed || null,
                    max_speed: activity.maxSpeed || null,
                    calories: activity.calories || activity.energy || null,
                    device_name: activity.deviceName || null,
                    description: activity.description || null,
                    running_index: activity.runningIndex || null,
                }));

            // Batch process using sync_utils — samples contain GPS track points
            const { processActivityList } = require('./sync_utils');
            const result = await processActivityList(userDb, 'suunto', activitiesToProcess,
                (sourceId) => getActivitySamples(accessToken, sourceId)
            );

            totalImported += result.imported;

            log(userId, `Activities: ${totalImported} new, ${totalUpdated} updated`);
        } catch (e) {
            log(userId, `Activities sync failed: ${e.message}`);
        }

        // === Phase 3: User Summary (fitness metrics) ===
        try {
            const summary = await getUserSummary(accessToken);
            if (summary) {
                const today = new Date().toISOString().split('T')[0];

                if (summary.vo2Max) {
                    await dbRunUser(userDb, `
                        INSERT OR REPLACE INTO performance_metrics
                        (user_id, metric_type, metric_value, metric_unit, recorded_at, source)
                        VALUES (?, 'vo2max', ?, 'ml/kg/min', ?, 'suunto')
                    `, [userId, summary.vo2Max, today]);
                }

                if (summary.fitnessLevel) {
                    await dbRunUser(userDb, `
                        INSERT OR REPLACE INTO performance_metrics
                        (user_id, metric_type, metric_value, metric_unit, recorded_at, source)
                        VALUES (?, 'fitness_level', ?, 'level', ?, 'suunto')
                    `, [userId, summary.fitnessLevel, today]);
                }

                if (summary.recoveryTime) {
                    await dbRunUser(userDb, `
                        INSERT OR REPLACE INTO performance_metrics
                        (user_id, metric_type, metric_value, metric_unit, recorded_at, source)
                        VALUES (?, 'recovery_time', ?, 'hours', ?, 'suunto')
                    `, [userId, summary.recoveryTime, today]);
                }

                log(userId, 'Summary metrics synced');
            }
        } catch (e) {
            log(userId, `Summary sync failed: ${e.message}`);
        }

        // === Phase 4: Calculate Metrics ===
        try {
            log(userId, 'Calculating post-sync metrics...');
            const metricsResult = await calculateAndStoreMetrics(userId, userDb);
            if (metricsResult.success) {
                log(userId, `Metrics calculated: TSS=${metricsResult.calculated}, VDOT=${metricsResult.vdot || 'N/A'}`);
            }
        } catch (e) {
            log(userId, `Metrics calculation failed: ${e.message}`);
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        log(userId, `Sync complete in ${elapsed}s`);

        return {
            success: true,
            imported: totalImported,
            updated: totalUpdated,
            message: `Sync complete: ${totalImported} new, ${totalUpdated} updated in ${elapsed}s`
        };

    } catch (error) {
        log(userId, `Sync failed: ${error.message}`);

        // Provide user-friendly error messages
        let friendlyMessage = error.message;
        if (error.response) {
            const status = error.response.status;
            if (status === 401) {
                friendlyMessage = 'Identifiants Suunto incorrects.';
            } else if (status === 429) {
                friendlyMessage = 'Suunto temporairement indisponible. Réessayez dans quelques minutes.';
            } else if (status === 403) {
                friendlyMessage = 'Accès Suunto refusé. Vérifiez vos identifiants.';
            }
        }

        return { success: false, error: friendlyMessage };
    }
}

// ---------------------------------------------------------------------------
// Status & Disconnect
// ---------------------------------------------------------------------------

async function getSuuntoSyncStatus(userId) {
    try {
        const user = await dbGetMain(
            'SELECT suunto_username FROM users WHERE id = ?',
            [userId]
        );
        const userDb = await getUserDb(userId);

        const lastSync = await dbGetUser(userDb,
            'SELECT MAX(created_at) as last_sync FROM activities WHERE source = "suunto"'
        );

        const hasToken = fs.existsSync(getTokenPath(userId));

        return {
            source: 'suunto',
            last_sync: lastSync?.last_sync || null,
            status: 'idle',
            configured: !!(user?.suunto_username),
            has_token: hasToken
        };
    } catch (error) {
        log(userId, `Status error: ${error.message}`);
        return { source: 'suunto', last_sync: null, status: 'error', configured: false };
    }
}

async function disconnectSuunto(userId) {
    try {
        await dbRunMain(`
            UPDATE users SET
                suunto_username = NULL,
                suunto_password = NULL,
                suunto_enabled = 0,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [userId]);

        // Clear tokens
        const tokenPath = getTokenPath(userId);
        if (fs.existsSync(tokenPath)) {
            fs.rmSync(tokenPath, { force: true });
        }

        log(userId, 'Disconnected');
        return { success: true };
    } catch (error) {
        log(userId, `Disconnect failed: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function clearSuuntoToken(userId) {
    const tokenPath = getTokenPath(userId);
    try {
        if (fs.existsSync(tokenPath)) {
            fs.rmSync(tokenPath, { force: true });
            log(userId, 'Token cleared');
        }
        return { success: true };
    } catch (error) {
        log(userId, `Token clear failed: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function testSuuntoCredentials(username, password) {
    try {
        const tokens = await loginToSuunto(username, password);
        return {
            success: true,
            hasToken: !!tokens.access_token,
        };
    } catch (error) {
        return {
            success: false,
            error: error.response?.status === 401
                ? 'Identifiants incorrects'
                : error.message,
        };
    }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
    performSuuntoSync,
    getSuuntoSyncStatus,
    disconnectSuunto,
    clearSuuntoToken,
    testSuuntoCredentials,
};
