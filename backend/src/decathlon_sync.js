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
const DECATHLON_AUTH_URL = 'https://api.decathlon.net/connect/oauth/authorize';
const DECATHLON_TOKEN_URL = 'https://api.decathlon.net/connect/oauth/token';

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
        // Retourner même si expiré — le refresh se fera dans getValidToken
        return data;
    } catch (e) {
        return null;
    }
}

// ---------------------------------------------------------------------------
// Token Refresh
// ---------------------------------------------------------------------------

async function refreshDecathlonToken(userId) {
    // Chercher le refresh token dans le fichier local d'abord, puis en DB
    const saved = await loadToken(userId);
    const refreshToken = saved?.refreshToken || (await dbGetMain(
        'SELECT decathlon_refresh_token FROM users WHERE id = ?', [userId]
    ))?.decathlon_refresh_token;

    if (!refreshToken) {
        throw new Error('No refresh token available. Please re-authenticate Decathlon.');
    }

    const response = await axios.post(DECATHLON_TOKEN_URL,
        new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: process.env.DECATHLON_CLIENT_ID || '',
            client_secret: process.env.DECATHLON_CLIENT_SECRET || '',
        }),
        {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 15000,
        }
    );

    const tokenData = response.data;
    await saveToken(userId, tokenData);
    await dbRunMain(
        `UPDATE users SET
            decathlon_access_token = ?,
            decathlon_refresh_token = ?,
            decathlon_expires_at = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [tokenData.access_token, tokenData.refresh_token || refreshToken,
         Date.now() + (tokenData.expires_in * 1000), userId]
    );

    log(userId, 'Token refreshed');
    return tokenData.access_token;
}

/**
 * Retourne un access token valide — refresh automatique si expiré.
 */
async function getValidToken(userId) {
    const saved = await loadToken(userId);

    // Token valide (5 min de marge)
    if (saved?.accessToken && saved.expiresAt && Date.now() < saved.expiresAt - 300000) {
        return saved.accessToken;
    }

    // Token expiré mais refresh token disponible
    if (saved?.refreshToken) {
        try {
            return await refreshDecathlonToken(userId);
        } catch (e) {
            log(userId, `Refresh failed: ${e.message}`);
        }
    }

    // Fallback: token en DB (peut être expiré)
    const user = await dbGetMain('SELECT decathlon_access_token FROM users WHERE id = ?', [userId]);
    if (!user?.decathlon_access_token) {
        throw new Error('Decathlon not configured. Please connect your account.');
    }
    return user.decathlon_access_token;
}

// ---------------------------------------------------------------------------
// API Calls
// ---------------------------------------------------------------------------

async function decathlonRequest(userId, endpoint, options = {}) {
    const accessToken = await getValidToken(userId);

    const url = new URL(`${DECATHLON_API_BASE}${endpoint}`);
    if (options.params) {
        Object.entries(options.params).forEach(([k, v]) => {
            if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
        });
    }

    try {
        const response = await axios.get(url.toString(), {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'x-api-key': process.env.DECATHLON_API_KEY || '',
                'Accept': 'application/json',
            },
            timeout: 30000,
        });
        return response.data;
    } catch (error) {
        if (error.response?.status === 401) {
            // Token expiré → forcer le refresh et réessayer une fois
            log(userId, 'Token expired (401), refreshing...');
            const newToken = await refreshDecathlonToken(userId);
            const retryResponse = await axios.get(url.toString(), {
                headers: {
                    'Authorization': `Bearer ${newToken}`,
                    'x-api-key': process.env.DECATHLON_API_KEY || '',
                    'Accept': 'application/json',
                },
                timeout: 30000,
            });
            return retryResponse.data;
        }
        throw error;
    }
}

/**
 * Récupère toutes les activités avec pagination automatique.
 * L'API Decathlon retourne les activités avec un lien "next" en JSON-LD.
 */
async function fetchAllActivities(userId) {
    const allActivities = [];
    let endpoint = '/activities';
    let page = 0;
    const maxPages = 20; // sécurité anti-boucle infinie

    while (endpoint && page < maxPages) {
        const response = await decathlonRequest(userId, endpoint);

        // L'API peut retourner un tableau direct ou un objet JSON-LD
        let items = [];
        if (Array.isArray(response)) {
            items = response;
            endpoint = null; // pas de pagination
        } else if (response && typeof response === 'object') {
            // JSON-LD: { "member": [...], "view": { "next": "/v2/activities?page=2" } }
            items = response.member || response.activities || response['hydra:member'] || [];
            const next = response.view?.next || response['hydra:view']?.['hydra:next'];
            if (next) {
                // Extraire juste le path depuis l'URL complète si nécessaire
                endpoint = next.startsWith('http') ? new URL(next).pathname + new URL(next).search : next;
                // Enlever le préfixe /v2 si présent (déjà dans DECATHLON_API_BASE)
                endpoint = endpoint.replace(/^\/v2/, '');
            } else {
                endpoint = null;
            }
        }

        allActivities.push(...items);
        page++;

        if (items.length === 0) break;
    }

    return allActivities;
}

// ---------------------------------------------------------------------------
// Sport Type Mapping
// ---------------------------------------------------------------------------

function mapDecathlonSport(sportUrl) {
    if (!sportUrl) return 'workout';

    // L'URL peut être "/v2/sports/121" ou juste "121"
    const sportId = String(sportUrl).split('/').pop();
    const sportMap = {
        // Running
        '121': 'run', '122': 'run', '175': 'run', '176': 'run',
        // Cycling
        '381': 'ride', '382': 'ride', '383': 'ride',
        // Swimming
        '123': 'swim', '124': 'swim',
        // Walking / Hiking
        '113': 'walk', '114': 'walk',
        // Fitness
        '91': 'workout', '92': 'workout',
    };

    return sportMap[sportId] || 'workout';
}

/**
 * Extrait la distance depuis dataSummaries Decathlon.
 * La clé '5' correspond à la distance en mètres dans l'API Decathlon.
 */
function extractDistance(dataSummaries) {
    if (!dataSummaries) return 0;
    // Clé '5' = distance (m), clé '18' = distance aussi selon la version de l'API
    return dataSummaries['5'] || dataSummaries['18'] || dataSummaries.distance || 0;
}

/**
 * Extrait la durée depuis dataSummaries ou le champ duration.
 * La clé '69' correspond à la durée en secondes.
 */
function extractDuration(activity) {
    if (activity.duration) return activity.duration;
    if (activity.dataSummaries) {
        return activity.dataSummaries['69'] || activity.dataSummaries['68'] || 0;
    }
    return 0;
}

/**
 * Extrait l'ID unique d'une activité Decathlon (JSON-LD ou champ id).
 */
function extractActivityId(activity) {
    if (activity.id) return String(activity.id);
    if (activity['@id']) {
        // "/v2/activities/12345" → "12345"
        return activity['@id'].split('/').pop();
    }
    return null;
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
            return { success: false, error: 'Decathlon not configured. Please connect your account via the Profile page.' };
        }

        const userDb = await getUserDb(userId);

        // Récupérer toutes les activités avec pagination
        let activities = [];
        try {
            activities = await fetchAllActivities(userId);
            log(userId, `Found ${activities.length} activities`);
        } catch (e) {
            log(userId, `Activities fetch failed: ${e.message}`);
            return { success: false, error: e.message };
        }

        // Normaliser les activités
        const activitiesToProcess = activities
            .map(activity => {
                const sourceId = extractActivityId(activity);
                if (!sourceId) return null;
                return {
                    source_id: sourceId,
                    name: activity.name || activity.title || 'Decathlon Activity',
                    type: mapDecathlonSport(activity.sport),
                    start_date: activity.startdate || activity.startDate || new Date().toISOString(),
                    distance: extractDistance(activity.dataSummaries),
                    moving_time: extractDuration(activity),
                    elapsed_time: extractDuration(activity),
                    average_heartrate: activity.dataSummaries?.['19'] || null, // clé HR moyen
                    max_heartrate: activity.dataSummaries?.['20'] || null,     // clé HR max
                    calories: activity.dataSummaries?.['28'] || null,          // clé calories
                };
            })
            .filter(Boolean);

        log(userId, `Normalized ${activitiesToProcess.length} activities`);

        // Batch insert via sync_utils
        const { processActivityList } = require('./sync_utils');
        const result = await processActivityList(userDb, 'decathlon', activitiesToProcess);

        log(userId, `Activities: ${result.imported} new`);

        // Calculer les métriques post-sync
        try {
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
            imported: result.imported,
            total: activitiesToProcess.length,
            message: `Sync complete: ${result.imported} new activities in ${elapsed}s`,
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

    const tempPath = path.join(DECATHLON_TOKEN_DIR, `${userId}_pkce.json`);
    fs.mkdirSync(DECATHLON_TOKEN_DIR, { recursive: true });
    fs.writeFileSync(tempPath, JSON.stringify({ codeVerifier, createdAt: Date.now() }));

    // URI de callback — doit correspondre exactement à ce qui est enregistré dans l'app Decathlon
    const redirectUri = process.env.DECATHLON_REDIRECT_URI || 'https://drawrun.fr/api/sync/decathlon/callback';

    const params = new URLSearchParams({
        client_id: process.env.DECATHLON_CLIENT_ID || '',
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'profile openid email sports_tracking_data',
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
