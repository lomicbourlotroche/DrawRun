/**
 * Decathlon Sync Module (Official API)
 * ======================================
 * OAuth2 PKCE Flow + Sports Tracking Data API
 * Docs: https://github.com/Decathlon/sports-docs
 * API: https://api.decathlon.net/sportstrackingdata/v2
 */

'use strict';

const axios = require('axios');
const crypto = require('crypto');
const { getUserDb, dbGetMain, dbRunMain, dbGetUser, dbRunUser } = require('./database');
const { decrypt } = require('./crypto_utils');
const { calculateAndStoreMetrics } = require('./metrics_calculator');
const path = require('path');
const fs = require('fs');
const { logger } = require('./logger');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DECATHLON_TOKEN_DIR = path.join(__dirname, '..', 'data', 'decathlon_tokens');
const DECATHLON_API_BASE = 'https://api.decathlon.net/sportstrackingdata/v2';
const DECATHLON_AUTH_URL = 'https://api-eu.decathlon.net/connect/oauth/authorize';

function log(userId, message, ...args) {
    logger.info(`[Decathlon][User ${userId}] ${message}`, ...args);
}

// ---------------------------------------------------------------------------
// Token Management (PKCE Flow)
// ---------------------------------------------------------------------------

const ALLOWED_TOKEN_DIR = path.resolve(DECATHLON_TOKEN_DIR);

function getTokenPath(userId) {
    const tokenPath = path.resolve(ALLOWED_TOKEN_DIR, `${String(userId).replace(/[^0-9]/g, '')}.json`);
    if (!tokenPath.startsWith(ALLOWED_TOKEN_DIR)) {
        throw new Error('Invalid token path');
    }
    return tokenPath;
}

async function saveToken(userId, tokenData) {
    const tokenPath = getTokenPath(userId);
    fs.mkdirSync(ALLOWED_TOKEN_DIR, { recursive: true });
    fs.writeFileSync(tokenPath, JSON.stringify({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
    }));
    log(userId, 'Token saved');
}

async function loadToken(userId) {
    const tokenPath = getTokenPath(userId);
    if (!fs.existsSync(tokenPath)) return null;

    try {
        const data = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
        if (data.expiresAt && Date.now() < data.expiresAt - 300000) {
            return data;
        }
        return null;
    } catch (e) {
        return null;
    }
}

// ---------------------------------------------------------------------------
// API Calls
// ---------------------------------------------------------------------------

async function decathlonRequest(userId, endpoint, options = {}) {
    const user = await dbGetMain(
        'SELECT decathlon_access_token FROM users WHERE id = ?',
        [userId]
    );

    if (!user?.decathlon_access_token) {
        throw new Error('Decathlon not configured');
    }

    const url = new URL(`${DECATHLON_API_BASE}${endpoint}`);
    if (options.params) {
        Object.entries(options.params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
        });
    }

    const response = await axios.get(url.toString(), {
        headers: {
            'Authorization': `Bearer ${user.decathlon_access_token}`,
            'x-api-key': process.env.DECATHLON_API_KEY || '',
            'Accept': 'application/json',
        },
        timeout: 30000,
    });

    return response.data;
}

// ---------------------------------------------------------------------------
// Sport Type Mapping
// ---------------------------------------------------------------------------

function mapDecathlonSport(sportUrl) {
    if (!sportUrl) return 'workout';

    const sportId = sportUrl.split('/').pop();
    const sportMap = {
        '121': 'run',
        '122': 'run',
        '123': 'swim',
        '381': 'ride',
        '382': 'ride',
    };

    return sportMap[sportId] || 'workout';
}

// ---------------------------------------------------------------------------
// Sync Logic
// ---------------------------------------------------------------------------

async function performDecathlonSync(userId) {
    const startTime = Date.now();
    log(userId, 'Starting Decathlon sync...');

    try {
        const user = await dbGetMain(
            'SELECT decathlon_access_token, decathlon_refresh_token FROM users WHERE id = ?',
            [userId]
        );

        if (!user?.decathlon_access_token) {
            throw new Error('Decathlon not configured. Please connect your account.');
        }

        const userDb = await getUserDb(userId);

        // Get activities
        let activities = [];
        try {
            const response = await decathlonRequest(userId, '/activities');
            activities = Array.isArray(response) ? response : (response.activities || []);
            log(userId, `Found ${activities.length} activities`);
        } catch (e) {
            log(userId, `Activities fetch failed: ${e.message}`);
            activities = [];
        }

        let imported = 0;
        let updated = 0;

        // Prepare activities for batch processing
        const activitiesToProcess = activities
            .filter(activity => activity.id || activity['@id'])
            .map(activity => ({
                source_id: activity.id || activity['@id']?.split('/').pop(),
                name: activity.name || 'Decathlon Activity',
                type: mapDecathlonSport(activity.sport),
                start_date: activity.startdate || new Date().toISOString(),
                distance: activity.dataSummaries?.['5'] || 0,
                moving_time: activity.duration || 0,
                elapsed_time: activity.duration || 0,
            }));

        // Batch process using sync_utils
        const { processActivityList } = require('./sync_utils');
        const result = await processActivityList(userDb, 'decathlon', activitiesToProcess);

        imported += result.imported;

        log(userId, `Activities: ${imported} new, ${updated} updated`);

        // Calculate metrics
        try {
            log(userId, 'Calculating post-sync metrics...');
            const metricsResult = await calculateAndStoreMetrics(userId, userDb);
            if (metricsResult.success) {
                log(userId, `Metrics calculated: count=${metricsResult.calculated}`);
            }
        } catch (e) {
            log(userId, `Metrics calculation failed: ${e.message}`);
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        log(userId, `Sync complete in ${elapsed}s`);

        return {
            success: true,
            imported,
            updated,
            message: `Sync complete: ${imported} new, ${updated} updated in ${elapsed}s`,
        };

    } catch (error) {
        log(userId, `Sync failed: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// ---------------------------------------------------------------------------
// Status & Disconnect
// ---------------------------------------------------------------------------

async function getDecathlonSyncStatus(userId) {
    try {
        const user = await dbGetMain(
            'SELECT decathlon_access_token FROM users WHERE id = ?',
            [userId]
        );
        const userDb = await getUserDb(userId);

        const lastSync = await dbGetUser(userDb,
            'SELECT MAX(created_at) as last_sync FROM activities WHERE source = "decathlon"'
        );

        const hasToken = fs.existsSync(getTokenPath(userId));

        return {
            source: 'decathlon',
            last_sync: lastSync?.last_sync || null,
            status: 'idle',
            configured: !!(user?.decathlon_access_token),
            has_token: hasToken,
        };
    } catch (error) {
        log(userId, `Status error: ${error.message}`);
        return { source: 'decathlon', last_sync: null, status: 'error', configured: false };
    }
}

async function disconnectDecathlon(userId) {
    try {
        await dbRunMain(`
            UPDATE users SET
                decathlon_access_token = NULL,
                decathlon_refresh_token = NULL,
                decathlon_expires_at = NULL,
                decathlon_enabled = 0,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [userId]);

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

async function clearDecathlonToken(userId) {
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

// ---------------------------------------------------------------------------
// OAuth PKCE Helpers
// ---------------------------------------------------------------------------

function generateCodeVerifier() {
    return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
}

async function getDecathlonAuthUrl(userId) {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    // Store verifier temporarily (in real app, use session or cache)
    const tempPath = path.join(DECATHLON_TOKEN_DIR, `${userId}_pkce.json`);
    fs.mkdirSync(DECATHLON_TOKEN_DIR, { recursive: true });
    fs.writeFileSync(tempPath, JSON.stringify({ codeVerifier, createdAt: Date.now() }));

    const params = new URLSearchParams({
        client_id: process.env.DECATHLON_CLIENT_ID || '',
        redirect_uri: process.env.DECATHLON_REDIRECT_URI || 'http://localhost:3001/auth/decathlon/callback',
        response_type: 'code',
        scope: 'profile sports openid',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state: String(userId),
    });

    return `${DECATHLON_AUTH_URL}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
    performDecathlonSync,
    getDecathlonSyncStatus,
    disconnectDecathlon,
    clearDecathlonToken,
    getDecathlonAuthUrl,
};
