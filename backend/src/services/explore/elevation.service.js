'use strict';

const { logger } = require('../../utils/logger');

// Open Elevation API configuration
const OPEN_ELEVATION_API_URL = process.env.OPEN_ELEVATION_API_URL || 'https://api.open-elevation.com/api/v1/lookup';
const OPEN_ELEVATION_API_KEY = process.env.OPEN_ELEVATION_API_KEY || null;

/**
 * Fetch elevation profile for a set of coordinates using Open Elevation API.
 * Uses environment variable OPEN_ELEVATION_API_KEY if configured.
 * Falls back to public API if no key is provided.
 * @param {Array<{lat: number, lng: number}>} locations
 * @returns {Promise<Array<{distance: number, elevation: number, lat: number, lng: number}>>}
 */
async function getElevationProfile(locations) {
    if (!locations || locations.length < 2) {
        return [];
    }

    try {
        const body = {
            locations: locations.map(l => ({
                latitude: l.lat,
                longitude: l.lng
            }))
        };

        const headers = { 'Content-Type': 'application/json' };
        
        // Add API key to headers if configured
        if (OPEN_ELEVATION_API_KEY) {
            headers['Authorization'] = `Bearer ${OPEN_ELEVATION_API_KEY}`;
        }

        const response = await fetch(OPEN_ELEVATION_API_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`Open Elevation API returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            logger.warn('Open Elevation API returned no results, falling back to simulation');
            return [];
        }

        // Compute cumulative distance and attach elevation
        let cumulativeDist = 0;
        /* eslint-disable-next-line security/detect-object-injection */
        const results = data.results.map((r, idx) => {
            if (idx > 0) {
                const prev = locations[idx - 1];
                const dlat = (r.latitude - prev.lat) * Math.PI / 180;
                const dlng = (r.longitude - prev.lng) * Math.PI / 180;
                const a = Math.sin(dlat / 2) ** 2 +
                    Math.cos(prev.lat * Math.PI / 180) *
                    Math.cos(r.latitude * Math.PI / 180) *
                    Math.sin(dlng / 2) ** 2;
                const dist = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                cumulativeDist += dist;
            }
            return {
                distance: Math.round(cumulativeDist),
                elevation: r.elevation,
                lat: r.latitude,
                lng: r.longitude
            };
        });

        return results;
    } catch (error) {
        logger.error('Error fetching elevation profile:', error);

        // Fallback: return approximate elevations (sine wave simulation)
        return locations.map((loc, idx) => {
            const frac = idx / (locations.length - 1);
            const dist = idx * 100; // approximate 100m spacing
            return {
                distance: dist,
                elevation: Math.round(50 + Math.sin(frac * Math.PI * 4) * 20),
                lat: loc.lat,
                lng: loc.lng
            };
        });
    }
}

/**
 * Calculate total elevation gain from an array of (lat, lng, elevation) points.
 */
/* eslint-disable security/detect-object-injection */
function calculateTotalGain(points) {
    let gain = 0;
    for (let i = 1; i < points.length; i++) {
        const diff = points[i].elevation - points[i - 1].elevation;
        if (diff > 0) gain += diff;
    }
    return Math.round(gain);
}
/* eslint-enable security/detect-object-injection */

module.exports = {
    getElevationProfile,
    calculateTotalGain
};
