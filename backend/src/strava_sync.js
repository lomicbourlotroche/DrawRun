/* eslint-disable unused-imports/no-unused-vars, security/detect-non-literal-fs-filename, no-empty, security/detect-object-injection, no-constant-condition */
/**
 * Strava Sync Module (Unofficial - Playwright Web Scraping)
 * =========================================================
 * Synchronise les activités Strava SANS API officielle.
 * Utilise Playwright pour scraper le site web Strava avec email/password.
 * Pas besoin d'inscription développeur ni de client_id/secret.
 *
 * Flux:
 * 1. Login via formulaire web Strava (email/password)
 * 2. Sauvegarde des cookies pour sessions futures
 * 3. Intercepte les appels API internes du site web
 * 4. Extrait activités, stats, zones, streams
 */

'use strict';

const { getUserDb, dbGetMain, dbRunMain, dbGetUser, dbRunUser, dbAllUser } = require('./database');

// Playwright est optionnel — non disponible en production sans installation séparée
let chromium;
try {
    // eslint-disable-next-line node/no-extraneous-require, import/no-extraneous-dependencies
    chromium = require('playwright').chromium;
} catch (_) {
    chromium = null;
}
const { decrypt } = require('./crypto_utils');
const { calculateAndStoreMetrics } = require('./metrics_calculator');
const path = require('path');
const fs = require('fs');
const { logger } = require('./logger');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const STRAVA_COOKIE_DIR = path.join(__dirname, '..', 'data', 'strava_cookies');
const STRAVA_LOGIN_URL = 'https://www.strava.com/login';
const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

function log(userId, message, ...args) {
    logger.info(`[Strava][User ${userId}] ${message}`, ...args);
}

// ---------------------------------------------------------------------------
// Cookie Management
// ---------------------------------------------------------------------------

function getCookiePath(userId) {
    return path.join(STRAVA_COOKIE_DIR, `${userId}.json`);
}

async function loadCookies(context, userId) {
    const cookiePath = getCookiePath(userId);
    if (!fs.existsSync(cookiePath)) return false;

    try {
        const cookies = JSON.parse(fs.readFileSync(cookiePath, 'utf-8'));
        await context.addCookies(cookies);
        log(userId, 'Loaded saved cookies');
        return true;
    } catch (e) {
        return false;
    }
}

async function saveCookies(context, userId) {
    const cookies = await context.cookies();
    fs.mkdirSync(STRAVA_COOKIE_DIR, { recursive: true });
    fs.writeFileSync(getCookiePath(userId), JSON.stringify(cookies));
    log(userId, 'Saved cookies');
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

async function loginToStrava(page, email, password) {
    await page.goto(STRAVA_LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Accept cookies if present
    try {
        const acceptBtn = await page.$('button[aria-label*="Accept"], button:has-text("Accept"), button:has-text("Accepter")');
        if (acceptBtn) await acceptBtn.click({ timeout: 3000 }).catch(() => { });
    } catch (e) { }

    // Fill login form
    await page.fill('input[id="email"]', email, { timeout: 10000 });
    await page.fill('input[id="password"]', password, { timeout: 5000 });

    // Submit
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => { }),
        page.click('button[type="submit"], input[type="submit"]', { timeout: 5000 }).catch(() => { }),
    ]);

    await page.waitForTimeout(2000);

    // Check if login succeeded
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/password')) {
        throw new Error('Strava login failed. Check email/password.');
    }

    // Check for 2FA
    if (currentUrl.includes('/two_factor')) {
        throw new Error('Strava 2FA enabled. Please disable 2FA or use official OAuth.');
    }

    log(null, 'Login successful');
}

async function isLoggedIn(page) {
    await page.goto('https://www.strava.com/dashboard', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1500);
    return !page.url().includes('/login');
}

// ---------------------------------------------------------------------------
// API Interception
// ---------------------------------------------------------------------------

async function fetchStravaAPI(page, endpoint, params = {}) {
    const url = new URL(`${STRAVA_API_BASE}${endpoint}`);
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });

    const response = await page.evaluate(async (fullUrl) => {
        const res = await fetch(fullUrl, {
            credentials: 'include',
            headers: { 'Accept': 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        return res.json();
    }, url.toString());

    return response;
}

// ---------------------------------------------------------------------------
// Data Extraction
// ---------------------------------------------------------------------------

async function getAthleteProfile(page) {
    return fetchStravaAPI(page, '/athlete');
}

async function getAthleteStats(page, athleteId) {
    return fetchStravaAPI(page, `/athletes/${athleteId}/stats`);
}

async function getActivities(page, options = {}) {
    const { after, before, page: pageNum = 1, perPage = 200 } = options;
    return fetchStravaAPI(page, '/athlete/activities', {
        after,
        before,
        page: pageNum,
        per_page: perPage,
    });
}

async function getActivityDetail(page, activityId) {
    return fetchStravaAPI(page, `/activities/${activityId}`);
}

async function getActivityStreams(page, activityId) {
    return fetchStravaAPI(page, `/activities/${activityId}/streams`, {
        keys: 'time,distance,latlng,heartrate,cadence,altitude,velocity_smooth,watts,temp',
        key_by_type: true,
    });
}

// ---------------------------------------------------------------------------
// Type Mapping
// ---------------------------------------------------------------------------

function mapStravaType(stravaType) {
    const typeMap = {
        'Run': 'run',
        'TrailRun': 'run',
        'VirtualRun': 'run',
        'Ride': 'ride',
        'MountainBikeRide': 'ride',
        'GravelRide': 'ride',
        'EBikeRide': 'ride',
        'Swim': 'swim',
        'Walk': 'walk',
        'Hike': 'walk',
        'Workout': 'workout',
        'WeightTraining': 'workout',
        'Yoga': 'workout',
        'Crossfit': 'workout',
    };
    return typeMap[stravaType] || 'workout';
}

// ---------------------------------------------------------------------------
// Sync Logic
// ---------------------------------------------------------------------------

async function performSync(userId) {
    const startTime = Date.now();
    log(userId, 'Starting Strava sync (unofficial)...');

    let browser;
    try {
        // Get credentials
        const user = await dbGetMain(
            'SELECT strava_client_id, strava_client_secret FROM users WHERE id = ?',
            [userId]
        );

        if (!user?.strava_client_id || !user?.strava_client_secret) {
            throw new Error('Strava credentials not configured. Enter your Strava email/password.');
        }

        const email = user.strava_client_id;
        const password = decrypt(user.strava_client_secret) || user.strava_client_secret;

        // Launch browser
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 720 },
        });

        // Try to load saved cookies
        const hasCookies = await loadCookies(context, userId);
        const page = await context.newPage();

        // Verify session or login
        if (hasCookies) {
            const valid = await isLoggedIn(page);
            if (!valid) {
                log(userId, 'Session expired, re-login...');
                await loginToStrava(page, email, password);
                await saveCookies(context, userId);
            }
        } else {
            await loginToStrava(page, email, password);
            await saveCookies(context, userId);
        }

        // Get user DB
        const userDb = await getUserDb(userId);

        // === Phase 1: Athlete Profile ===
        let athleteId = null;
        try {
            const athlete = await getAthleteProfile(page);
            if (athlete?.id) {
                athleteId = athlete.id;
                await dbRunMain('UPDATE users SET strava_athlete_id = ? WHERE id = ?',
                    [athleteId, userId]);
                log(userId, `Athlete: ${athlete.firstname} ${athlete.lastname} (ID: ${athleteId})`);
            }
        } catch (e) {
            log(userId, `Athlete profile failed: ${e.message}`);
        }

        // === Phase 2: Athlete Stats ===
        if (athleteId) {
            try {
                const stats = await getAthleteStats(page, athleteId);
                if (stats) {
                    const today = new Date().toISOString().split('T')[0];
                    const metricsMap = {
                        'recent_run_totals.distance': { type: 'strava_recent_run_distance', unit: 'm' },
                        'recent_run_totals.moving_time': { type: 'strava_recent_run_time', unit: 's' },
                        'recent_run_totals.elevation_gain': { type: 'strava_recent_run_elevation', unit: 'm' },
                        'recent_run_totals.count': { type: 'strava_recent_run_count', unit: 'activities' },
                        'ytd_run_totals.distance': { type: 'strava_ytd_run_distance', unit: 'm' },
                        'ytd_run_totals.moving_time': { type: 'strava_ytd_run_time', unit: 's' },
                        'ytd_run_totals.elevation_gain': { type: 'strava_ytd_run_elevation', unit: 'm' },
                        'ytd_run_totals.count': { type: 'strava_ytd_run_count', unit: 'activities' },
                        'all_run_totals.distance': { type: 'strava_all_run_distance', unit: 'm' },
                        'all_run_totals.count': { type: 'strava_all_run_count', unit: 'activities' },
                        'recent_ride_totals.distance': { type: 'strava_recent_ride_distance', unit: 'm' },
                        'ytd_ride_totals.distance': { type: 'strava_ytd_ride_distance', unit: 'm' },
                        'biggest_ride_distance': { type: 'strava_biggest_ride', unit: 'm' },
                        'biggest_climb_elevation_gain': { type: 'strava_biggest_climb', unit: 'm' },
                    };

                    for (const [metricPath, config] of Object.entries(metricsMap)) {
                        const parts = metricPath.split('.');
                        let value = stats;
                        for (const part of parts) {
                            value = value?.[part];
                        }
                        if (value !== undefined && value !== null) {
                            await dbRunUser(userDb, `
                                INSERT OR REPLACE INTO performance_metrics
                                (user_id, metric_type, metric_value, metric_unit, recorded_at, source)
                                VALUES (?, ?, ?, ?, ?, ?)
                            `, [userId, config.type, value, config.unit, today, 'strava']);
                        }
                    }
                    log(userId, 'Stats synced');
                }
            } catch (e) {
                log(userId, `Stats sync failed: ${e.message}`);
            }
        }

        // === Phase 3: Activities ===
        let totalImported = 0;
        let totalUpdated = 0;
        let totalStreams = 0;

        try {
            // Get last sync date
            const lastActivity = await dbGetUser(userDb,
                'SELECT MAX(start_date) as last_date FROM activities WHERE source = "strava"'
            );
            const startDate = lastActivity?.last_date || null;

            // Convert to unix timestamp for Strava API
            let afterTs = null;
            if (startDate) {
                afterTs = Math.floor(new Date(startDate).getTime() / 1000);
                log(userId, `Incremental sync from ${startDate}`);
            } else {
                log(userId, 'Full initial sync');
            }

            // Fetch all activities (paginate)
            let allActivities = [];
            let pageNum = 1;
            const perPage = 200;

            while (true) {
                const batch = await getActivities(page, { after: afterTs, page: pageNum, perPage });
                if (!Array.isArray(batch) || batch.length === 0) break;

                allActivities = allActivities.concat(batch);
                if (batch.length < perPage) break;
                pageNum++;

                // Use batch processing - no per-activity sleep
            }

            log(userId, `Found ${allActivities.length} activities`);

        const activitiesToProcess = allActivities
            .filter(activity => activity.id)
            .map(activity => ({
                source_id: String(activity.id),
                name: activity.name || 'Strava Activity',
                type: mapStravaType(activity.type),
                start_date: activity.start_date,
                distance: activity.distance || 0,
                moving_time: activity.moving_time || activity.elapsed_time || 0,
                average_heartrate: activity.average_heartrate || null,
                max_heartrate: activity.max_heartrate || null,
                average_speed: activity.average_speed || null,
                max_speed: activity.max_speed || null,
                calories: activity.calories || null,
            }));

        // Batch process
        const { processActivityList } = require('./sync_utils');
        const result = await processActivityList(userDb, 'strava', activitiesToProcess,
            (sourceId) => callStravaApi(userId, { mode: 'activity', id: sourceId })
        );

        importedCount += result.imported;
                    } catch (streamErr) {
                        // Streams may not exist for all activities
                    }
                } else {
                    totalUpdated++;
                }
            }

            log(userId, `Activities: ${totalImported} new, ${totalUpdated} updated, ${totalStreams} with streams`);
        } catch (e) {
            log(userId, `Activities sync failed: ${e.message}`);
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
            streams: totalStreams,
            message: `Sync complete: ${totalImported} new, ${totalUpdated} updated in ${elapsed}s`
        };

    } catch (error) {
        log(userId, `Sync failed: ${error.message}`);
        return { success: false, error: error.message };
    } finally {
        if (browser) {
            await browser.close().catch(() => { });
        }
    }
}

// ---------------------------------------------------------------------------
// Status & Disconnect
// ---------------------------------------------------------------------------

async function getStravaSyncStatus(userId) {
    try {
        const user = await dbGetMain(
            'SELECT strava_client_id, strava_athlete_id FROM users WHERE id = ?',
            [userId]
        );
        const userDb = await getUserDb(userId);

        const lastSync = await dbGetUser(userDb,
            'SELECT MAX(created_at) as last_sync FROM activities WHERE source = "strava"'
        );

        const hasCookies = fs.existsSync(getCookiePath(userId));

        return {
            source: 'strava',
            last_sync: lastSync?.last_sync || null,
            status: 'idle',
            configured: !!(user?.strava_client_id),
            athlete_id: user?.strava_athlete_id || null,
            has_session: hasCookies
        };
    } catch (error) {
        log(userId, `Status error: ${error.message}`);
        return { source: 'strava', last_sync: null, status: 'error', configured: false };
    }
}

async function disconnectStrava(userId) {
    try {
        await dbRunMain(`
            UPDATE users SET
                strava_client_id = NULL,
                strava_client_secret = NULL,
                strava_access_token = NULL,
                strava_refresh_token = NULL,
                strava_expires_at = NULL,
                strava_athlete_id = NULL,
                strava_enabled = 0,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [userId]);

        // Clear session cookies
        const cookiePath = getCookiePath(userId);
        if (fs.existsSync(cookiePath)) {
            fs.rmSync(cookiePath, { force: true });
        }

        log(userId, 'Disconnected');
        return { success: true };
    } catch (error) {
        log(userId, `Disconnect failed: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function clearStravaSession(userId) {
    const cookiePath = getCookiePath(userId);
    try {
        if (fs.existsSync(cookiePath)) {
            fs.rmSync(cookiePath, { force: true });
            log(userId, 'Session cleared');
        }
        return { success: true };
    } catch (error) {
        log(userId, `Session clear failed: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// ---------------------------------------------------------------------------
// OAuth / Auth URL
// ---------------------------------------------------------------------------

async function getStravaAuthUrl(userId) {
    // This module uses Playwright-based scraping, not OAuth
    // Return the Strava login URL for web scraping authentication
    return `${STRAVA_LOGIN_URL}?redirect_to=/dashboard`;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
    performSync,
    getStravaSyncStatus,
    disconnectStrava,
    clearStravaSession,
    getStravaAuthUrl,
};
