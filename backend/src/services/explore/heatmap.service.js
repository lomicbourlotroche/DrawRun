'use strict';

const { dbRunMain, dbGetMain, dbAllMain } = require('../../database');
const { logger } = require('../../utils/logger');

/**
 * Update heatmap data based on activity points.
 * Rounds coordinates to ~10m precision (4 decimal places).
 */
async function updateHeatmap(points, activityType = 'Run') {
    if (!points || points.length < 2) return;

    try {
        // Sample points to avoid overwhelming the DB (every 10th point)
        const sampleSize = Math.max(1, Math.floor(points.length / 100));
        const heatmapPoints = new Map();

        for (let i = 0; i < points.length; i += sampleSize) {
            const p = points[i];
            const lat = Math.round(p[0] * 1000) / 1000; // ~110m precision is enough for city-scale heatmap
            const lng = Math.round(p[1] * 1000) / 1000;
            const key = `${lat},${lng}`;
            heatmapPoints.set(key, (heatmapPoints.get(key) || 0) + 1);
        }

        // Batch update in a transaction
        for (const [key, intensity] of heatmapPoints.entries()) {
            const [lat, lng] = key.split(',').map(Number);
            await dbRunMain(`
                INSERT INTO heatmap_data (lat, lng, intensity, activity_type)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(lat, lng, activity_type) DO UPDATE SET
                    intensity = intensity + ?,
                    last_updated = CURRENT_TIMESTAMP
            `, [lat, lng, intensity, activityType, intensity]);
        }
    } catch (error) {
        logger.error('Heatmap update error:', error);
    }
}

/**
 * Get heatmap data for a specific area and activity type
 */
async function getHeatmap(lat, lng, radius = 5000, type = 'Run') {
    try {
        // Calculate bounding box
        const latDelta = parseFloat(radius) / 111000;
        const lngDelta = parseFloat(radius) / (111000 * Math.cos(parseFloat(lat) * Math.PI / 180));

        const heatmapData = await dbAllMain(`
            SELECT lat, lng, SUM(intensity) as intensity
            FROM heatmap_data
            WHERE lat BETWEEN ? AND ?
              AND lng BETWEEN ? AND ?
              AND activity_type = ?
            GROUP BY lat, lng
            ORDER BY intensity DESC
            LIMIT 1000
        `, [
            parseFloat(lat) - latDelta,
            parseFloat(lat) + latDelta,
            parseFloat(lng) - lngDelta,
            parseFloat(lng) + lngDelta,
            type
        ]);

        return heatmapData || [];
    } catch (error) {
        logger.error('Get heatmap error:', error);
        return [];
    }
}

/**
 * Get most popular locations for a specific activity type
 */
async function getPopularLocations(type = 'Run', limit = 50) {
    try {
        const popularLocations = await dbAllMain(`
            SELECT lat, lng, intensity, activity_type
            FROM heatmap_data
            WHERE activity_type = ?
            ORDER BY intensity DESC
            LIMIT ?
        `, [type, parseInt(limit)]);

        return popularLocations || [];
    } catch (error) {
        logger.error('Get popular locations error:', error);
        return [];
    }
}

module.exports = {
    updateHeatmap,
    getHeatmap,
    getPopularLocations
};
