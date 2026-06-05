/* eslint-disable unused-imports/no-unused-vars, security/detect-non-literal-fs-filename */
/**
 * Suunto Sync Module
 * ==================
 * Synchronise les activités et métriques Suunto (via API reverse-engineered) vers DrawRun.
 * Utilise une authentification par credentials (email/mot de passe) avec cookies de session.
 * 
 * Note: Cette implémentation utilise l'API REST non officielle de Suunto App
 * qui est accessible via les endpoints utilisés par leur application mobile.
 */

'use strict';

const { logger } = require('../../utils/logger');
const { dbGetMain, dbRunMain, dbGetUser, dbRunUser, dbAllUser, getUserDb } = require('../../database');
const { decrypt, encrypt } = require('../../utils/crypto');
const { sleep } = require('../../utils/helpers');
const { calculateAndStoreMetrics } = require('../metricsCalculator.service');
const { processActivityList } = require('./utils');

// Use native fetch (Node.js 18+)
const fetch = global.fetch || require('node-fetch');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SUUNTO_API_BASE = 'https://cloudapi.suunto.com';
const SUUNTO_AUTH_URL = 'https://cloudapi.suunto.com/v1/auth';
const SUUNTO_MOVESS_URL = 'https://cloudapi.suunto.com/v2/moves';

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(userId, message, ...args) {
    logger.info(`[Suunto][User ${userId}] ${message}`, ...args);
}

function logError(userId, message, ...args) {
    logger.error(`[Suunto][User ${userId}] ${message}`, ...args);
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

/**
 * Get Suunto credentials from database
 */
async function getSuuntoCredentials(userId) {
    const creds = await dbGetMain(
        'SELECT username, password FROM user_credentials WHERE user_id = ? AND provider = ? AND enabled = 1',
        [userId, 'suunto']
    );

    if (!creds || !creds.username) {
        throw new Error('Suunto credentials not configured');
    }

    return {
        username: decrypt(creds.username),
        password: creds.password ? decrypt(creds.password) : null
    };
}

/**
 * Save Suunto credentials in database
 */
async function saveSuuntoCredentials(userId, username, password) {
    await dbRunMain(
        `INSERT OR REPLACE INTO user_credentials 
         (user_id, provider, username, password, enabled, updated_at)
         VALUES (?, 'suunto', ?, ?, 1, CURRENT_TIMESTAMP)`,
        [userId, encrypt(username), encrypt(password)]
    );
    log(userId, 'Credentials saved successfully');
}

/**
 * Clear Suunto credentials for a user
 */
async function clearSuuntoTokens(userId) {
    try {
        await dbRunMain(
            'UPDATE user_credentials SET enabled = 0, username = NULL, password = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND provider = ?',
            [userId, 'suunto']
        );
        log(userId, 'Suunto credentials cleared');
        return { success: true };
    } catch (error) {
        logError(userId, `Token clear failed: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Login to Suunto and get session cookies
 * Suunto uses cookie-based auth with CSRF protection
 */
async function suuntoLogin(email, password) {
    const loginUrl = `${SUUNTO_AUTH_URL}/login`;
    
    // First, get CSRF token from the login page
    const csrfResponse = await fetch(`${SUUNTO_AUTH_URL}/login`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
    });

    if (!csrfResponse.ok) {
        throw new Error(`Failed to get CSRF token: ${csrfResponse.status}`);
    }

    // Suunto login typically requires email, password, and CSRF token
    // The API expects form data
    const formData = new URLSearchParams();
    formData.append('email', email);
    formData.append('password', password);

    const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
        },
        body: formData.toString(),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Login failed: ${response.status} - ${errorText}`);
    }

    // Extract cookies from response
    const cookies = [];
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
        cookies.push(setCookieHeader);
    }

    const responseData = await response.json();

    return {
        cookies,
        userData: responseData,
    };
}

// ---------------------------------------------------------------------------
// API Client
// ---------------------------------------------------------------------------

/**
 * Generic Suunto API call with authentication
 */
async function callSuuntoApi(userId, endpoint, options = {}) {
    const creds = await getSuuntoCredentials(userId);
    
    // Login to get cookies
    const { cookies } = await suuntoLogin(creds.username, creds.password);
    
    const url = `${SUUNTO_API_BASE}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': cookies.join('; '),
        ...options.headers,
    };

    const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : null,
        ...options,
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${errorText}`;

        try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
            // Keep text error
        }

        if (response.status === 401) {
            // Token expired or invalid - clear credentials
            await clearSuuntoTokens(userId);
            throw new Error('Session expired - please reconnect to Suunto');
        }

        if (response.status === 429) {
            throw new Error('Rate limited - please try again later');
        }

        throw new Error(`Suunto API error: ${errorMessage}`);
    }

    return response.json();
}

// ---------------------------------------------------------------------------
// Sport Type Mappings
// ---------------------------------------------------------------------------

const SUUNTO_SPORT_MAP = {
    // Running
    'running': 'running',
    'trail_running': 'trail',
    'treadmill_running': 'indoor_running',
    
    // Cycling
    'cycling': 'biking',
    'road_cycling': 'biking',
    'mountain_biking': 'biking',
    'indoor_cycling': 'indoor_biking',
    
    // Swimming
    'swimming': 'swimming',
    'pool_swimming': 'swimming',
    'open_water_swimming': 'swimming',
    
    // Other
    'walking': 'walking',
    'hiking': 'hiking',
    'skiing': 'skiing',
    'gym': 'fitness',
    'rowing': 'rowing',
    'cross_training': 'cross_training',
    'triathlon': 'triathlon',
    'other': 'workout',
};

function getSportType(suuntoSport) {
    return SUUNTO_SPORT_MAP[suuntoSport?.toLowerCase()] || 'workout';
}

// ---------------------------------------------------------------------------
// Activity Normalization
// ---------------------------------------------------------------------------

/**
 * Normalize Suunto activity to DrawRun format
 */
function normalizeSuuntoActivity(suuntoMove, userId) {
    const sportType = getSportType(suuntoMove.sport);
    const startDate = suuntoMove.startTime || suuntoMove.date;
    
    // Calculate timezone offset from ISO string if available
    let timezone = null;
    if (startDate && typeof startDate === 'string') {
        const dateMatch = startDate.match(/([+-]\d{2}:\d{2})$/);
        if (dateMatch) {
            timezone = dateMatch[1];
        }
    }

    return {
        source_id: suuntoMove.moveId || suuntoMove.id,
        name: suuntoMove.name || `${sportType} activity`,
        type: sportType,
        start_date: startDate,
        timezone: timezone,
        distance: suuntoMove.distance || 0,
        moving_time: suuntoMove.duration || suuntoMove.movingTime || 0,
        elapsed_time: suuntoMove.duration || suuntoMove.elapsedTime || 0,
        average_speed: suuntoMove.avgSpeed || null,
        max_speed: suuntoMove.maxSpeed || null,
        average_heartrate: suuntoMove.avgHR || suuntoMove.averageHeartRate || null,
        max_heartrate: suuntoMove.maxHR || suuntoMove.maximumHeartRate || null,
        average_cadence: suuntoMove.avgCadence || suuntoMove.averageCadence || null,
        calories: suuntoMove.calories || suuntoMove.energy || null,
        total_elevation_gain: suuntoMove.ascent || suuntoMove.elevationGain || null,
        total_elevation_loss: suuntoMove.descent || suuntoMove.elevationLoss || null,
        elev_high: suuntoMove.maxAltitude || null,
        elev_low: suuntoMove.minAltitude || null,
        device_name: suuntoMove.device || suuntoMove.deviceName || null,
        description: suuntoMove.notes || suuntoMove.description || null,
        is_manual: suuntoMove.manual ? 1 : 0,
        // Metadata for debugging
        _suunto_sport: suuntoMove.sport,
        _suunto_data: null,
    };
}

// ---------------------------------------------------------------------------
// Activity Fetching
// ---------------------------------------------------------------------------

/**
 * Fetch list of Suunto activities (moves)
 */
async function fetchSuuntoActivities(userId, options = {}) {
    const { startDate, limit = 100, page = 1 } = options;
    
    let endpoint = `/v2/moves?limit=${limit}&offset=${(page - 1) * limit}`;
    
    if (startDate) {
        endpoint += `&startDate=${encodeURIComponent(startDate)}`;
    }

    try {
        const response = await callSuuntoApi(userId, endpoint);
        
        // Handle different response formats
        if (response && response.data) {
            return response.data;
        }
        if (Array.isArray(response)) {
            return response;
        }
        if (response.moves) {
            return response.moves;
        }
        
        return response ? [response] : [];
    } catch (error) {
        logError(userId, `Failed to fetch activities: ${error.message}`);
        throw error;
    }
}

/**
 * Fetch details for a single Suunto activity
 */
async function fetchSuuntoActivityDetails(userId, moveId) {
    try {
        const response = await callSuuntoApi(userId, `/v2/moves/${moveId}`);
        return response;
    } catch (error) {
        logError(userId, `Failed to fetch activity ${moveId}: ${error.message}`);
        throw error;
    }
}

/**
 * Extract GPS track from Suunto activity
 */
async function fetchSuuntoActivityTrack(userId, moveId) {
    try {
        // Suunto stores GPS data separately
        const response = await callSuuntoApi(userId, `/v2/moves/${moveId}/track`);
        return response;
    } catch (error) {
        logError(userId, `Failed to fetch track for ${moveId}: ${error.message}`);
        return null;
    }
}

/**
 * Extract streams from Suunto activity data
 */
function extractSuuntoStreams(activity, track) {
    const streams = {};
    
    // Speed data
    if (activity.avgSpeed) {
        // Suunto speed is typically in m/s or km/h - convert to m/s for DrawRun
        const speed = typeof activity.avgSpeed === 'number' ? activity.avgSpeed : null;
        if (speed) {
            streams.average_speed = speed;
        }
    }
    
    // Heart rate
    if (activity.samples && activity.samples.heartRate) {
        const hrSamples = activity.samples.heartRate;
        if (Array.isArray(hrSamples)) {
            streams.heartrate = hrSamples.map(h => h != null ? h : null).filter(h => h !== null);
        }
    }
    
    // GPS from track
    if (track && track.points) {
        const lats = [];
        const lngs = [];
        const alts = [];
        
        track.points.forEach(point => {
            if (point.latitude !== undefined && point.longitude !== undefined) {
                lats.push(point.latitude);
                lngs.push(point.longitude);
                alts.push(point.altitude || 0);
            }
        });
        
        if (lats.length > 0) {
            streams.latlng = lats.map((lat, i) => [lat, lngs[i]]);
            streams.altitude = alts;
        }
    }
    
    // Cadence
    if (activity.avgCadence) {
        streams.average_cadence = activity.avgCadence;
    }
    
    return Object.keys(streams).length > 0 ? streams : null;
}

// ---------------------------------------------------------------------------
// Main Sync Functions
// ---------------------------------------------------------------------------

/**
 * Perform full Suunto sync for a user
 */
async function performSuuntoSync(userId, options = {}) {
    const startTime = Date.now();
    
    try {
        const userDb = await getUserDb(userId);
        log(userId, 'Starting Suunto sync...');
        
        // Get last sync date for incremental sync
        const lastActivity = await dbGetUser(userDb,
            'SELECT MAX(start_date) as last_date FROM activities WHERE source = "suunto"'
        );
        
        let startDate = null;
        if (lastActivity?.last_date) {
            const lastDate = new Date(lastActivity.last_date);
            // Subtract 1 hour to catch any activities that might have been missed
            lastDate.setHours(lastDate.getHours() - 1);
            startDate = lastDate.toISOString();
        }
        
        if (startDate) {
            log(userId, `Incremental sync from ${startDate}`);
        } else {
            log(userId, 'Full sync (no previous Suunto activities)');
        }
        
        // Fetch activities
        const activities = await fetchSuuntoActivities(userId, {
            startDate,
            limit: options.limit || (startDate ? 100 : 50),
        });
        
        log(userId, `Fetched ${activities.length} activities from Suunto`);
        
        if (activities.length === 0) {
            log(userId, 'No new activities found');
            return {
                success: true,
                imported: 0,
                total: 0,
                message: 'No new Suunto activities',
            };
        }
        
        // Normalize activities
        const normalizedActivities = [];
        for (const act of activities) {
            try {
                const normalized = normalizeSuuntoActivity(act, userId);
                if (normalized.source_id) {
                    normalizedActivities.push(normalized);
                }
            } catch (err) {
                logError(userId, `Failed to normalize activity ${act.moveId || act.id}: ${err.message}`);
            }
        }
        
        log(userId, `Normalized ${normalizedActivities.length} activities`);
        
        // Process activities with details
        const result = await processActivityList(
            userDb,
            'suunto',
            normalizedActivities,
            async (sourceId) => {
                try {
                    const details = await fetchSuuntoActivityDetails(userId, sourceId);
                    const track = await fetchSuuntoActivityTrack(userId, sourceId);
                    return {
                        ...details,
                        _streams: extractSuuntoStreams(details, track),
                        _splits: null, // Suunto doesn't provide split data in basic API
                        _gpx: null, // GPS extracted separately
                    };
                } catch (err) {
                    logError(userId, `Failed to fetch details for ${sourceId}: ${err.message}`);
                    return null;
                }
            }
        );
        
        log(userId, `Imported ${result.imported}/${normalizedActivities.length} activities, ${result.details} with details`);
        
        // Calculate post-sync metrics
        try {
            const metricsResult = await calculateAndStoreMetrics(userId, userDb);
            if (metricsResult.success) {
                log(userId, `Metrics calculated: VDOT=${metricsResult.vdot || 'N/A'}`);
            }
        } catch (e) {
            log(userId, `Metrics calculation failed: ${e.message}`);
        }
        
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        log(userId, `Sync complete in ${elapsed}s`);
        
        return {
            success: true,
            imported: result.imported,
            total: normalizedActivities.length,
            message: `Suunto sync: ${result.imported} activities in ${elapsed}s`,
        };
        
    } catch (error) {
        logError(userId, `Sync error: ${error.message}`);
        return { success: false, message: error.message };
    }
}

/**
 * Get Suunto sync status for a user
 */
async function getSuuntoSyncStatus(userId) {
    try {
        const userDb = await getUserDb(userId);
        
        const lastSync = await dbGetUser(userDb,
            'SELECT MAX(created_at) as last_sync FROM activities WHERE source = "suunto"'
        );
        
        const creds = await dbGetMain(
            'SELECT id FROM user_credentials WHERE user_id = ? AND provider = ? AND enabled = 1',
            [userId, 'suunto']
        );
        
        return {
            source: 'suunto',
            last_sync: lastSync?.last_sync || null,
            status: 'idle',
            configured: !!creds,
            app_configured: true,
        };
    } catch (error) {
        logError(userId, `Status error: ${error.message}`);
        return { source: 'suunto', last_sync: null, status: 'error', configured: false, app_configured: true };
    }
}

/**
 * Disconnect Suunto (alias for clearSuuntoTokens)
 */
async function disconnectSuunto(userId) {
    return clearSuuntoTokens(userId);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
    // Main functions
    performSuuntoSync,
    getSuuntoSyncStatus,
    clearSuuntoTokens,
    disconnectSuunto,
    
    // Credential functions
    getSuuntoCredentials,
    saveSuuntoCredentials,
    
    // API functions
    callSuuntoApi,
    fetchSuuntoActivities,
    fetchSuuntoActivityDetails,
    fetchSuuntoActivityTrack,
    
    // Utility functions
    normalizeSuuntoActivity,
    extractSuuntoStreams,
    getSportType,
    
    // Constants
    SUUNTO_API_BASE,
    SUUNTO_AUTH_URL,
    SUUNTO_SPORT_MAP,
};
