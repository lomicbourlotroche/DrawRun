'use strict';

/**
 * ============================================================================
 * ROUTING SERVICE — OSRM Integration
 * ============================================================================
 *
 * Uses the free OSRM demo API (router.project-osrm.org) to generate
 * road-following routes with turn-by-turn directions.
 *
 * OSRM API: https://router.project-osrm.org/route/v1/{profile}/{coordinates}
 *
 * @module services/explore/routing.service
 */

const https = require('https');
const { logger } = require('../../utils/logger');

// OSRM demo endpoint — free, no API key required
const OSRM_BASE_URL = 'router.project-osrm.org';
const OSRM_PATH = '/route/v1';

/**
 * Map activity types to OSRM profiles
 */
const PROFILE_MAP = {
    Run: 'foot',
    Trail: 'foot',
    Hike: 'foot',
    Walk: 'foot',
    Bike: 'cycling',
    Mountain: 'cycling',
    Ride: 'cycling',
    Swim: 'driving',
    default: 'driving',
};

/**
 * Get OSRM profile from activity type
 */
function getOSRMProfile(activityType) {
    return PROFILE_MAP[activityType] || PROFILE_MAP.default;
}

/**
 * French direction labels for OSRM maneuver types
 */
const FRENCH_MANEUVERS = {
    'turn': 'Tournez',
    'new name': 'Continuez',
    'depart': 'Départ',
    'arrive': 'Arrivée',
    'merge': 'Insérez-vous',
    'ramp': 'Prenez la rampe',
    'fork': 'Restez à',
    'end of road': 'Au bout de la route',
    'continue': 'Continuez tout droit',
    'roundabout': 'Prenez le rond-point',
    'rotary': 'Prenez le rond-point',
    'roundabout turn': 'Prenez la sortie',
    'notification': 'Notification',
    'exit roundabout': 'Prenez la sortie',
    'exit rotary': 'Prenez la sortie',
};

const FRENCH_MODIFIERS = {
    'left': 'à gauche',
    'right': 'à droite',
    'slight left': 'légèrement à gauche',
    'slight right': 'légèrement à droite',
    'sharp left': 'franchement à gauche',
    'sharp right': 'franchement à droite',
    'straight': 'tout droit',
    'uturn': 'faites demi-tour',
};

/**
 * Build a human-readable direction instruction in French
 */
function buildInstruction(step) {
    const maneuver = step.maneuver || {};
    const type = maneuver.type || 'continue';
    const modifier = maneuver.modifier || 'straight';
    const name = step.name || '';

    const base = FRENCH_MANEUVERS[type] || 'Continuez';
    const direction = FRENCH_MODIFIERS[modifier] || '';

    if (type === 'continue') {
        return name ? `Continuez sur ${name}` : 'Continuez tout droit';
    }

    if (type === 'depart') {
        return name ? `Départ sur ${name}` : `Départ vers le ${direction}`;
    }

    if (type === 'arrive') {
        return 'Vous êtes arrivé(e)';
    }

    if (type === 'roundabout' || type === 'rotary') {
        const exit = maneuver.exit || 1;
        return `Prenez le rond-point, ${exit}e sortie${name ? ` vers ${name}` : ''}`;
    }

    if (type === 'fork') {
        return `Restez ${direction}${name ? ` sur ${name}` : ''}`;
    }

    if (type === 'end of road') {
        return `Au bout de la route, tournez ${direction}`;
    }

    // Generic turn instruction
    let instruction = `${base} ${direction}`;
    if (name) {
        instruction += ` sur ${name}`;
    }
    return instruction.trim();
}

/**
 * Format distance in a human-readable way (meters or kilometers)
 */
function formatDistance(meters) {
    if (typeof meters !== 'number') return '';
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Parse OSRM steps into our direction format
 */
function parseSteps(steps) {
    if (!steps || !Array.isArray(steps)) return [];

    const directions = [];
    let totalDistance = 0;
    let totalDuration = 0;

    steps.forEach((step, index) => {
        const maneuver = step.maneuver || {};
        const instruction = buildInstruction(step);

        totalDistance += step.distance || 0;
        totalDuration += step.duration || 0;

        directions.push({
            index: index + 1,
            instruction,
            distance: step.distance || 0,
            distance_formatted: formatDistance(step.distance),
            duration: step.duration || 0,
            street: step.name || '',
            type: maneuver.type || 'continue',
            modifier: maneuver.modifier || '',
            location: maneuver.location || null, // [lng, lat]
            way_points: step.intersections
                ? step.intersections.map(i => i.location).filter(Boolean)
                : [],
            cumulative_distance: totalDistance,
            cumulative_duration: totalDuration,
        });
    });

    return directions;
}

/**
 * Make an HTTPS request to the OSRM API
 */
function osrmRequest(urlPath) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: OSRM_BASE_URL,
            path: urlPath,
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            timeout: 15000,
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch (err) {
                    reject(new Error(`OSRM response parse error: ${err.message}`));
                }
            });
        });

        req.on('error', (err) => {
            reject(new Error(`OSRM request failed: ${err.message}`));
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('OSRM request timed out'));
        });

        req.end();
    });
}

/**
 * Encode waypoints for OSRM URL format: {lon},{lat};{lon},{lat};...
 * OSRM expects lng,lat order
 */
function encodeWaypoints(waypoints) {
    if (!waypoints || waypoints.length < 2) {
        throw new Error('At least 2 waypoints are required');
    }

    return waypoints
        .map(wp => {
            const lat = typeof wp === 'object' ? (wp.lat || wp.latitude) : null;
            const lng = typeof wp === 'object' ? (wp.lng || wp.longitude || wp.lon) : null;
            if (lat == null || lng == null) {
                throw new Error('Each waypoint must have lat and lng');
            }
            return `${lng},${lat}`;
        })
        .join(';');
}

/**
 * Generate a route using OSRM with turn-by-turn directions
 *
 * @param {Array<{lat: number, lng: number}>} waypoints - At least 2 waypoints
 * @param {string} activityType - 'Run', 'Bike', 'Hike', etc.
 * @param {Object} [options] - Additional options
 * @param {boolean} [options.alternatives=false] - Request alternative routes
 * @returns {Promise<Object>} Route data with geometry, directions, stats
 */
async function generateRoute(waypoints, activityType = 'Run', options = {}) {
    const profile = getOSRMProfile(activityType);

    try {
        const encoded = encodeWaypoints(waypoints);
        const alternatives = options.alternatives ? 'true' : 'false';

        // OSRM API: /route/v1/{profile}/{coordinates}?steps=true&overview=full&geometries=geojson&language=fr&alternatives={alternatives}
        const urlPath = `${OSRM_PATH}/${profile}/${encoded}` +
            `?steps=true&overview=full&geometries=geojson&language=fr&alternatives=${alternatives}`;

        logger.info('[Routing] Calling OSRM API', {
            profile,
            waypoints: waypoints.length,
            url: `${OSRM_BASE_URL}${urlPath}`,
        });

        const response = await osrmRequest(urlPath);

        if (!response || response.code !== 'Ok' || !response.routes || response.routes.length === 0) {
            logger.error('[Routing] OSRM returned no routes', { code: response?.code, message: response?.message });
            throw new Error(`OSRM routing failed: ${response?.message || 'No routes found'}`);
        }

        // Parse the primary route (first alternative)
        const osrmRoute = response.routes[0];

        // Extract geometry as GeoJSON LineString → convert to lat/lng array
        const geometry = osrmRoute.geometry || {};
        const coordinates = geometry.coordinates || [];
        const polylinePoints = coordinates.map(c => ({
            lat: c[1],
            lng: c[0],
        }));

        // Collect all steps from all legs
        const allSteps = [];
        const legDetails = [];
        (osrmRoute.legs || []).forEach((leg, legIndex) => {
            allSteps.push(...(leg.steps || []));
            legDetails.push({
                index: legIndex,
                distance: leg.distance || 0,
                duration: leg.duration || 0,
                summary: leg.summary || '',
                steps: (leg.steps || []).map(s => ({
                    index: s.maneuver?.type || 'unknown',
                    instruction: buildInstruction(s),
                })),
            });
        });

        // Parse turn-by-turn directions
        const directions = parseSteps(allSteps);

        // Build result
        const result = {
            success: true,
            route: {
                distance: osrmRoute.distance || 0,
                distance_formatted: formatDistance(osrmRoute.distance),
                duration: Math.round(osrmRoute.duration || 0),
                duration_formatted: formatDuration(osrmRoute.duration),
                polyline_points: polylinePoints,
                polyline: encodePolyline(polylinePoints),
                elevation_gain: computeElevationGain(polylinePoints),
                directions,
                directions_count: directions.length,
                waypoints_used: waypoints.length,
                legs: legDetails,
            },
            alternatives: [],
        };

        // Parse alternative routes if requested
        if (options.alternatives && response.routes.length > 1) {
            for (let i = 1; i < response.routes.length; i++) {
                const alt = response.routes[i];
                const altCoords = (alt.geometry?.coordinates || []).map(c => ({
                    lat: c[1],
                    lng: c[0],
                }));
                const altSteps = [];
                (alt.legs || []).forEach(leg => altSteps.push(...(leg.steps || [])));

                result.alternatives.push({
                    distance: alt.distance || 0,
                    duration: Math.round(alt.duration || 0),
                    polyline: encodePolyline(altCoords),
                    polyline_points: altCoords,
                    directions_count: altSteps.length,
                });
            }
        }

        return result;
    } catch (error) {
        logger.error('[Routing] Route generation error:', { error: error.message });
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Format duration in human-readable format
 */
function formatDuration(seconds) {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
}

/**
 * Compute approximate elevation gain from polyline points
 * (when OSRM doesn't provide it)
 */
function computeElevationGain(points) {
    if (!points || points.length < 2) return 0;
    let gain = 0;
    for (let i = 1; i < points.length; i++) {
        const diff = (points[i].elevation || 0) - (points[i - 1].elevation || 0);
        if (diff > 0) gain += diff;
    }
    return gain;
}

/**
 * Simplified polyline encoder (Google Polyline format)
 * Used for encoding the route polyline for storage
 */
function encodePolyline(points) {
    if (!points || points.length === 0) return '';

    let result = '';
    let prevLat = 0;
    let prevLng = 0;

    for (const point of points) {
        const lat = Math.round(point.lat * 1e5);
        const lng = Math.round(point.lng * 1e5);

        let dLat = lat - prevLat;
        let dLng = lng - prevLng;

        prevLat = lat;
        prevLng = lng;

        result += encodeSignedValue(dLat);
        result += encodeSignedValue(dLng);
    }

    return result;
}

function encodeSignedValue(value) {
    let s = value < 0 ? ~(value << 1) : (value << 1);
    let result = '';
    while (s >= 0x20) {
        result += String.fromCharCode((0x20 | (s & 0x1f)) + 63);
        s >>= 5;
    }
    result += String.fromCharCode(s + 63);
    return result;
}

module.exports = {
    generateRoute,
    getOSRMProfile,
    FRENCH_MANEUVERS,
    FRENCH_MODIFIERS,
    buildInstruction,
    formatDistance,
    formatDuration,
    parseSteps,
};
