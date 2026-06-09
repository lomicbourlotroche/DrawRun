/* eslint-disable unused-imports/no-unused-vars, security/detect-non-literal-fs-filename */

/**
 * Decathlon Sync Module
 * =====================
 * Synchronise les activites et metriques Decathlon Sports Tracking Data vers DrawRun.
 * Utilise OAuth2 PKCE + Playwright pour contourner l'absence de client_secret.
 */

'use strict';

const { logger } = require('../../utils/logger');
const { dbGetMain, dbRunMain, dbGetUser, dbRunUser, dbAllUser, getUserDb } = require('../../database');
const { decrypt, encrypt } = require('../../utils/crypto');
const { sleep } = require('../../utils/helpers');
const { calculateAndStoreMetrics } = require('../metricsCalculator.service');
const { processActivityList } = require('./utils');

const fetch = global.fetch || require('node-fetch');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DECATHLON_CLIENT_ID = process.env.DECATHLON_CLIENT_ID || 'cb8a7ef8-9c6d-47f6-9a61-50f67b421e10';
const DECATHLON_REDIRECT_URI = process.env.DECATHLON_REDIRECT_URI || 'https://www.decathloncoach.com';
const DECATHLON_AUTHORIZE_URL = 'https://api-global.decathlon.net/connect/oauth/authorize';
const DECATHLON_TOKEN_URL = 'https://api-global.decathlon.net/connect/oauth/token';
const DECATHLON_API_BASE = 'https://api.decathlon.net/sportstrackingdata/v2';
const DECATHLON_SCOPES = 'profile openid email sports_tracking_data';

// ---------------------------------------------------------------------------
// Playwright (lazy-loaded, only when needed)
// ---------------------------------------------------------------------------

let _chromium = null;
async function getChromium() {
    if (!_chromium) {
        const pw = require('playwright');
        _chromium = pw.chromium;
    }
    return _chromium;
}

// ---------------------------------------------------------------------------
// Datatype Mappings
// ---------------------------------------------------------------------------

// Decathlon datatype IDs to DrawRun fields
const DATATYPE_MAP = {
    // Distance
    5: { field: 'distance', unit: 'm' },
    // Duration
    24: { field: 'duration', unit: 's' },
    // Calories
    23: { field: 'calories', unit: 'kcal' },
    // Speed
    9: { field: 'average_speed', unit: 'm/h' },
    7: { field: 'max_speed', unit: 'm/h' },
    6: { field: '_current_speed', unit: 'm/h' },
    // Heart Rate
    4: { field: 'average_heartrate', unit: 'bpm' },
    3: { field: 'max_heartrate', unit: 'bpm' },
    1: { field: '_current_heartrate', unit: 'bpm' },
    // Elevation
    15: { field: 'elev_high', unit: 'm' },
    16: { field: 'elev_low', unit: 'm' },
    18: { field: 'total_elevation_gain', unit: 'm' },
    19: { field: 'total_elevation_loss', unit: 'm' },
    14: { field: '_current_elevation', unit: 'm' },
    17: { field: 'elevation_avg', unit: 'm' },
    // Cadence
    10: { field: 'average_cadence', unit: 'steps/min' },
    100: { field: '_current_cadence', unit: 'rpm' },
    101: { field: 'cadence_max', unit: 'rpm' },
    103: { field: 'cadence_avg', unit: 'rpm' },
    // Power (if available)
    200: { field: 'average_power', unit: 'watts' },
    201: { field: 'max_power', unit: 'watts' },
};

// Sport ID to DrawRun type mapping
const SPORT_MAP = {
    121: 'running',
    113: 'walking',
    381: 'biking',
    385: 'biking',
    388: 'biking',
    110: 'indoor_biking',
    274: 'swimming',
    77: 'triathlon',
    91: 'fitness',
    18: 'handball',
    10: 'basketball',
    13: 'football',
    7: 'paragliding',
    20: 'hockey',
    32: 'volleyball',
    161: 'climbing',
    168: 'hiking',
    176: 'alpine_skiing',
    174: 'skiing',
    185: 'snowboarding',
    264: 'bodyboarding',
    265: 'canoeing',
    280: 'underwater_diving',
    284: 'kite_surfing',
    273: 'surfing',
    296: 'sailing',
    301: 'wind_surfing',
    320: 'golf',
    326: 'archery',
    354: 'squash',
    357: 'tennis',
    358: 'table_tennis',
    360: 'bmx',
    367: 'inline_skating',
    374: 'skateboarding',
    380: 'scooter',
    395: 'treadmill',
    397: 'cross_trainer',
    398: 'rowing_machine',
    399: 'run_bike',
    400: 'stand_up_paddle',
    401: 'home_trainer',
    402: 'daily_activity',
    404: 'cross_training',
    405: 'jump_rope',
    // Running subtypes
    126: 'trail',
};

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function log(userId, message, ...args) {
    logger.info(`[Decathlon][User ${userId}] ${message}`, ...args);
}

function logError(userId, message, ...args) {
    logger.error(`[Decathlon][User ${userId}] ${message}`, ...args);
}

// ---------------------------------------------------------------------------
// OAuth2 Token Management
// ---------------------------------------------------------------------------

/**
 * Get Decathlon OAuth2 tokens from database
 */
async function getDecathlonCredentials(userId) {
    const creds = await dbGetMain(
        'SELECT access_token, refresh_token, expires_at, api_key FROM user_credentials WHERE user_id = ? AND provider = ? AND enabled = 1',
        [userId, 'decathlon']
    );
    if (!creds || !creds.access_token) return null;
    return {
        accessToken: decrypt(creds.access_token),
        refreshToken: creds.refresh_token ? decrypt(creds.refresh_token) : null,
        expiresAt: creds.expires_at,
        apiKey: creds.api_key ? decrypt(creds.api_key) : null
    };
}

/**
 * Save/Update OAuth2 tokens in database
 */
async function saveDecathlonTokens(userId, tokens) {
    await dbRunMain(
        `INSERT OR REPLACE INTO user_credentials 
         (user_id, provider, access_token, refresh_token, expires_at, api_key, enabled, updated_at)
         VALUES (?, 'decathlon', ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
        [
            userId,
            encrypt(tokens.access_token),
            tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
            tokens.expires_at,
            tokens.api_key ? encrypt(tokens.api_key) : null
        ]
    );
    log(userId, 'Tokens saved successfully');
}

/**
 * Get Decathlon login credentials (email/password) from database
 */
async function getDecathlonLoginCredentials(userId) {
    const creds = await dbGetMain(
        'SELECT username, password FROM user_credentials WHERE user_id = ? AND provider = ? AND enabled = 1',
        [userId, 'decathlon_login']
    );
    if (!creds || !creds.password) return null;
    return { email: creds.username, password: decrypt(creds.password) };
}

/**
 * Check if token is expired (5 min buffer)
 */
function isTokenExpired(expiresAt) {
    if (!expiresAt) return true;
    return Date.now() / 1000 >= (expiresAt - 300);
}

/**
 * Refresh access token using refresh_token
 */
async function refreshAccessToken(userId, refreshToken) {
    log(userId, 'Refreshing Decathlon access token...');
    const params = new URLSearchParams();
    params.set('grant_type', 'refresh_token');
    params.set('refresh_token', refreshToken);
    params.set('client_id', DECATHLON_CLIENT_ID);

    const response = await fetch(DECATHLON_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
    }
    const tokenData = await response.json();
    const expiresAt = Math.floor(Date.now() / 1000) + (tokenData.expires_in || 3600);
    return {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || refreshToken,
        expires_at: expiresAt,
        api_key: tokenData.api_key || null
    };
}

/**
 * Get a valid access token, refreshing or re-authenticating if needed
 */
async function getValidAccessToken(userId) {
    // Try existing tokens first
    const creds = await getDecathlonCredentials(userId);
    if (creds) {
        if (!isTokenExpired(creds.expiresAt)) return creds.accessToken;
        if (creds.refreshToken) {
            try {
                const newTokens = await refreshAccessToken(userId, creds.refreshToken);
                await saveDecathlonTokens(userId, newTokens);
                return newTokens.access_token;
            } catch (refreshErr) {
                log(userId, `Token refresh failed, re-authenticating: ${refreshErr.message}`);
            }
        }
    }

    // No valid tokens — authenticate via Playwright
    const tokens = await authenticateViaPlaywright(userId);
    await saveDecathlonTokens(userId, tokens);
    return tokens.access_token;
}

/**
 * Authenticate via Playwright: logs into login.decathlon.net with PKCE,
 * intercepts the auth code redirect, and exchanges for tokens.
 */
async function authenticateViaPlaywright(userId) {
    const loginCreds = await getDecathlonLoginCredentials(userId);
    if (!loginCreds) throw new Error('Decathlon credentials not configured. Save your email/password first.');

    const chromium = await getChromium();
    const browser = await chromium.launch({ headless: true });
    let code = null;

    try {
        const context = await browser.newContext();
        const page = await context.newPage();

        // Intercept redirect to decathloncoach.com with auth code
        page.on('request', (request) => {
            const url = request.url();
            if (url.startsWith('https://www.decathloncoach.com/') && url.includes('code=')) {
                const parsed = new URL(url);
                code = parsed.searchParams.get('code');
            }
        });

        // Navigate to authorize endpoint — it will redirect to login.decathlon.net
        const authUrl = `${DECATHLON_AUTHORIZE_URL}?client_id=${DECATHLON_CLIENT_ID}&redirect_uri=${encodeURIComponent(DECATHLON_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(DECATHLON_SCOPES)}`;
        await page.goto(authUrl, { waitUntil: 'networkidle', timeout: 30000 });

        // Fill login form (common selectors for Decathlon login page)
        try {
            await page.waitForSelector('input[type="email"], input[name="email"], input[id*="email"]', { timeout: 10000 });
        } catch {
            await page.waitForTimeout(2000);
        }

        // Try multiple common selectors for email
        const emailInput = await page.$('input[type="email"], input[name="email"], input[id*="email"], input[autocomplete="email"]');
        if (emailInput) {
            await emailInput.fill(loginCreds.email);
        } else {
            // Fallback: find any visible text input
            const inputs = await page.$$('input:not([type="hidden"])');
            for (const input of inputs) {
                const type = await input.getAttribute('type');
                if (!type || type === 'text' || type === 'email') {
                    await input.fill(loginCreds.email);
                    break;
                }
            }
        }

        // Fill password
        const pwdInput = await page.$('input[type="password"], input[name="password"]');
        if (pwdInput) await pwdInput.fill(loginCreds.password);

        // Click submit button
        const submitBtn = await page.$('button[type="submit"], input[type="submit"], button:has-text("Connexion"), button:has-text("Se connecter"), button:has-text("Login"), button:has-text("Sign in")');
        if (submitBtn) {
            await submitBtn.click();
        } else {
            await page.keyboard.press('Enter');
        }

        // Wait for the redirect to decathloncoach.com with the code
        await page.waitForTimeout(5000);
        for (let i = 0; i < 20 && !code; i++) {
            await page.waitForTimeout(1000);
            const currentUrl = page.url();
            if (currentUrl.includes('code=')) {
                const parsed = new URL(currentUrl);
                code = parsed.searchParams.get('code');
            }
        }

        if (!code) throw new Error('Failed to obtain authorization code from Decathlon login');

        // Exchange code for tokens (PKCE not needed since web app flow doesn't use it)
        const params = new URLSearchParams();
        params.set('grant_type', 'authorization_code');
        params.set('code', code);
        params.set('redirect_uri', DECATHLON_REDIRECT_URI);
        params.set('client_id', DECATHLON_CLIENT_ID);
        // Try without client_secret first (public client PKCE-compatible flow)
        let tokenResponse = await fetch(DECATHLON_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });

        if (!tokenResponse.ok) {
            // Some servers need the redirect_uri repeated in the body for exchange
            const bodyStr = params.toString() + '&redirect_uri=' + encodeURIComponent(DECATHLON_REDIRECT_URI);
            tokenResponse = await fetch(DECATHLON_TOKEN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: bodyStr
            });
        }

        if (!tokenResponse.ok) {
            const errText = await tokenResponse.text();
            throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errText}`);
        }

        const tokenData = await tokenResponse.json();
        const expiresAt = Math.floor(Date.now() / 1000) + (tokenData.expires_in || 3600);

        log(userId, 'OAuth2 token obtained via Playwright');

        return {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: expiresAt,
            api_key: tokenData.api_key || null
        };
    } finally {
        await browser.close();
    }
}

// ---------------------------------------------------------------------------
// API Client
// ---------------------------------------------------------------------------

/**
 * Generic Decathlon API call
 */
async function callDecathlonApi(userId, endpoint, options = {}) {
    const accessToken = await getValidAccessToken(userId);
    const creds = await getDecathlonCredentials(userId);
    
    const url = `${DECATHLON_API_BASE}${endpoint}`;
    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    // Add API key if available
    if (creds.apiKey) {
        headers['x-api-key'] = creds.apiKey;
    } else if (process.env.DECATHLON_API_KEY) {
        headers['x-api-key'] = process.env.DECATHLON_API_KEY;
    }

    const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : null,
        ...options
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
            log(userId, `Token expired or invalid: ${errorMessage}`);
            // Clear tokens to force re-authentication
            await clearDecathlonTokens(userId);
            throw new Error('Session expired - please reconnect to Decathlon');
        }
        
        if (response.status === 429) {
            throw new Error('Rate limited - please try again later');
        }
        
        throw new Error(`Decathlon API error: ${errorMessage}`);
    }

    return response.json();
}

// ---------------------------------------------------------------------------
// Sync status helpers
// ---------------------------------------------------------------------------

/**
 * Get Decathlon sync status for a user
 */
async function getDecathlonSyncStatus(userId) {
    try {
        const userDb = await getUserDb(userId);
        const lastSync = await dbGetUser(userDb,
            'SELECT MAX(created_at) as last_sync FROM activities WHERE source = "decathlon"'
        );
        const creds = await dbGetMain(
            'SELECT id FROM user_credentials WHERE user_id = ? AND provider = ? AND enabled = 1',
            [userId, 'decathlon_login']
        );
        return {
            source: 'decathlon',
            last_sync: lastSync?.last_sync || null,
            status: 'idle',
            configured: !!creds
        };
    } catch (error) {
        logError(userId, `Status error: ${error.message}`);
        return { source: 'decathlon', last_sync: null, status: 'error', configured: false };
    }
}

/**
 * Clear Decathlon tokens for a user
 */
async function clearDecathlonTokens(userId) {
    try {
        await dbRunMain(
            'UPDATE user_credentials SET enabled = 0, username = NULL, password = NULL, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND provider = ?',
            [userId, 'decathlon_login']
        );
        log(userId, 'Decathlon credentials cleared');
        return { success: true };
    } catch (error) {
        logError(userId, `Credential clear failed: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Disconnect Decathlon
 */
async function disconnectDecathlon(userId) {
    return clearDecathlonTokens(userId);
}

// ---------------------------------------------------------------------------
// Activity Fetching & Normalization
// ---------------------------------------------------------------------------

/**
 * Helper to extract ID from Decathlon URL (e.g., "/v2/sports/121" -> 121)
 */
function extractIdFromUrl(url) {
    if (!url) return null;
    const match = url.match(/\/v2\/(\w+)\/(\d+)$/);
    return match ? parseInt(match[2], 10) : null;
}

/**
 * Convert speed from m/h to m/s (DrawRun standard)
 */
function convertSpeedToMS(mph) {
    if (!mph || mph === 0) return null;
    return mph / 3600;
}

/**
 * Convert speed from m/h to km/h
 */
function convertSpeedToKmh(mph) {
    if (!mph || mph === 0) return null;
    return mph / 1000;
}

/**
 * Get sport type from Decathlon sport ID
 */
function getSportType(sportId) {
    return SPORT_MAP[sportId] || 'workout';
}

/**
 * Normalize Decathlon activity to DrawRun format
 */
function normalizeDecathlonActivity(decathlonActivity) {
    const sportId = extractIdFromUrl(decathlonActivity.sport);
    const sportType = getSportType(sportId);
    const summaries = decathlonActivity.dataSummaries || {};
    
    // Extract start date and handle timezone
    let startDate = decathlonActivity.startdate;
    let timezone = null;
    
    if (decathlonActivity.startdate) {
        // Try to extract timezone from ISO string
        const dateMatch = decathlonActivity.startdate.match(/([+-]\d{2}:\d{2})$/);
        if (dateMatch) {
            timezone = dateMatch[1];
        }
    }
    
    return {
        source_id: decathlonActivity.id,
        name: decathlonActivity.name || `${sportType} activity`,
        type: sportType,
        start_date: startDate,
        timezone: timezone,
        distance: summaries[5] || 0, // metres
        moving_time: decathlonActivity.duration || summaries[24] || 0, // seconds
        elapsed_time: decathlonActivity.duration || summaries[24] || 0,
        // Speed: Decathlon uses m/h, DrawRun uses m/s
        average_speed: convertSpeedToMS(summaries[9]),
        max_speed: convertSpeedToMS(summaries[7]),
        average_heartrate: summaries[4] || null,
        max_heartrate: summaries[3] || null,
        average_cadence: summaries[10] || summaries[103] || null,
        calories: summaries[23] || null,
        elev_high: summaries[15] || null,
        elev_low: summaries[16] || null,
        total_elevation_gain: summaries[18] || null,
        total_elevation_loss: summaries[19] || null,
        device_name: decathlonActivity.userDevice ? String(extractIdFromUrl(decathlonActivity.userDevice)) : null,
        description: decathlonActivity.comment || null,
        is_manual: decathlonActivity.manual ? 1 : 0,
        // Metadata for debugging
        _decathlon_sport_id: sportId,
        _decathlon_data: null
    };
}

/**
 * Extract GPS polyline from locations
 */
function extractGPXFromLocations(locations) {
    if (!locations || Object.keys(locations).length === 0) {
        return null;
    }
    
    const timestamps = Object.keys(locations).map(Number).sort((a, b) => a - b);
    const coords = [];
    
    for (const t of timestamps) {
        const loc = locations[t];
        if (loc && loc.latitude !== undefined && loc.longitude !== undefined) {
            coords.push([loc.longitude, loc.latitude]); // Note: GPX uses [lng, lat]
        }
    }
    
    return coords.length > 0 ? coords : null;
}

/**
 * Extract streams from datastream
 */
function extractDecathlonStreams(activity) {
    const datastream = activity.datastream || {};
    const timestamps = Object.keys(datastream).map(Number).sort((a, b) => a - b);
    
    if (timestamps.length === 0) {
        return null;
    }
    
    const streams = {};
    
    // Extract each datatype
    for (const [datatypeId, mapping] of Object.entries(DATATYPE_MAP)) {
        const id = parseInt(datatypeId, 10);
        const field = mapping.field;
        
        // Skip internal fields (start with _)
        if (field.startsWith('_')) continue;
        
        // Check if this datatype exists in any timestamp
        const hasData = timestamps.some(t => datastream[t] && datastream[t][id] !== undefined);
        if (!hasData) continue;
        
        // Extract values
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
            streams[field] = values;
        }
    }
    
    // Extract GPS from locations
    const locations = activity.locations || {};
    if (Object.keys(locations).length > 0) {
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
 * Extract splits/laps from datastream
 */
function extractDecathlonSplits(activity) {
    const datastream = activity.datastream || {};
    const timestamps = Object.keys(datastream).map(Number).sort((a, b) => a - b);
    
    if (timestamps.length === 0) {
        return null;
    }
    
    const splits = [];
    const lapTimes = [];
    let currentLapStart = 0;
    let currentLapStartDist = 0;
    
    for (let i = 0; i < timestamps.length; i++) {
        const t = timestamps[i];
        const data = datastream[t];
        
        // Lap detected (datatype 20 = bool Lap)
        if (data && data[20] === 1) {
            if (i > 0) {
                // End previous lap
                const endTime = t;
                const lapDuration = endTime - currentLapStart;
                
                // Calculate lap statistics
                let lapAvgSpeed = null;
                let lapAvgHR = null;
                let lapMaxHR = null;
                let lapDistance = 0;
                let lapElevation = 0;
                
                // Get start and end distances
                const startData = datastream[currentLapStart];
                const endData = data;
                
                if (startData && startData[5] !== undefined && endData && endData[5] !== undefined) {
                    lapDistance = endData[5] - startData[5];
                }
                
                if (startData && startData[14] !== undefined && endData && endData[14] !== undefined) {
                    lapElevation = endData[14] - startData[14];
                }
                
                splits.push({
                    split_number: splits.length + 1,
                    distance: lapDistance || 0,
                    elapsed_time: lapDuration,
                    moving_time: lapDuration,
                    average_speed: lapAvgSpeed,
                    average_heartrate: lapAvgHR,
                    max_heartrate: lapMaxHR,
                    elevation_difference: lapElevation || null,
                    pace_zone: null
                });
            }
            
            // Start new lap
            currentLapStart = t;
            currentLapStartDist = datastream[t] && datastream[t][5] ? datastream[t][5] : 0;
        }
    }
    
    return splits.length > 0 ? splits : null;
}

// ---------------------------------------------------------------------------
// Main Sync Functions
// ---------------------------------------------------------------------------

/**
 * Fetch list of Decathlon activities
 */
async function fetchDecathlonActivities(userId, options = {}) {
    const { startDate, limit = 100, page = 1 } = options;
    
    let endpoint = '/activities';
    const params = new URLSearchParams();
    
    // Add filters
    if (startDate) {
        params.set('startdate', startDate);
    }
    if (limit) {
        params.set('limit', limit);
    }
    if (page) {
        params.set('page', page);
    }
    
    if (params.toString()) {
        endpoint += `?${params.toString()}`;
    }
    
    try {
        const response = await callDecathlonApi(userId, endpoint);
        
        // Handle Hydra collection format
        if (response && response['hydra:member']) {
            return response['hydra:member'];
        }
        
        // Handle array format
        if (Array.isArray(response)) {
            return response;
        }
        
        // Handle single object (unlikely for list)
        return response ? [response] : [];
    } catch (error) {
        logError(userId, `Failed to fetch activities: ${error.message}`);
        throw error;
    }
}

/**
 * Fetch details for a single activity
 */
async function fetchActivityDetails(userId, activityId) {
    try {
        const response = await callDecathlonApi(userId, `/activities/${activityId}`);
        return response;
    } catch (error) {
        logError(userId, `Failed to fetch activity ${activityId}: ${error.message}`);
        throw error;
    }
}

/**
 * Perform full Decathlon sync for a user
 */
async function performDecathlonSync(userId, options = {}) {
    const startTime = Date.now();
    
    try {
        const userDb = await getUserDb(userId);
        log(userId, 'Starting Decathlon sync...');
        
        // Get last sync date for incremental sync
        const lastActivity = await dbGetUser(userDb,
            'SELECT MAX(start_date) as last_date FROM activities WHERE source = "decathlon"'
        );
        
        let startDate = null;
        if (lastActivity?.last_date) {
            const lastDate = new Date(lastActivity.last_date);
            // Subtract 1 hour to catch any activities that might have been missed
            lastDate.setHours(lastDate.getHours() - 1);
            startDate = lastDate.toISOString().replace(/\.\d{3}Z$/, '+00:00');
        }
        
        if (startDate) {
            log(userId, `Incremental sync from ${startDate}`);
        } else {
            log(userId, 'Full sync (no previous Decathlon activities)');
        }
        
        // Fetch activities
        const activities = await fetchDecathlonActivities(userId, {
            startDate,
            limit: options.limit || (startDate ? 100 : 50) // Smaller limit for incremental
        });
        
        log(userId, `Fetched ${activities.length} activities from Decathlon`);
        
        if (activities.length === 0) {
            log(userId, 'No new activities found');
            return {
                success: true,
                imported: 0,
                total: 0,
                message: 'No new Decathlon activities'
            };
        }
        
        // Normalize activities
        const normalizedActivities = [];
        for (const act of activities) {
            try {
                const normalized = normalizeDecathlonActivity(act);
                // Only include activities with valid source_id
                if (normalized.source_id) {
                    normalizedActivities.push(normalized);
                }
            } catch (err) {
                logError(userId, `Failed to normalize activity ${act.id}: ${err.message}`);
            }
        }
        
        log(userId, `Normalized ${normalizedActivities.length} activities`);
        
        // Process activities with details
        const result = await processActivityList(
            userDb,
            'decathlon',
            normalizedActivities,
            async (sourceId) => {
                try {
                    const details = await fetchActivityDetails(userId, sourceId);
                    return {
                        ...details,
                        _streams: extractDecathlonStreams(details),
                        _splits: extractDecathlonSplits(details),
                        _gpx: extractGPXFromLocations(details.locations)
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
            message: `Decathlon sync: ${result.imported} activities in ${elapsed}s`
        };
        
    } catch (error) {
        logError(userId, `Sync error: ${error.message}`);
        return { success: false, message: error.message };
    }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
    performDecathlonSync,
    getDecathlonSyncStatus,
    clearDecathlonTokens,
    disconnectDecathlon,
    getDecathlonLoginCredentials,
    authenticateViaPlaywright,
    callDecathlonApi,
    fetchDecathlonActivities,
    fetchActivityDetails,
    getDecathlonCredentials,
    saveDecathlonTokens,
    normalizeDecathlonActivity,
    extractDecathlonStreams,
    extractDecathlonSplits,
    extractGPXFromLocations,
    getSportType,
    convertSpeedToMS,
    convertSpeedToKmh,
    DECATHLON_API_BASE,
    DECATHLON_AUTHORIZE_URL,
    DECATHLON_TOKEN_URL,
    DECATHLON_SCOPES,
    DECATHLON_CLIENT_ID,
    DECATHLON_REDIRECT_URI,
    DATATYPE_MAP,
    SPORT_MAP
};
