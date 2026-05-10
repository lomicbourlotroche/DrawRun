'use strict';

const { dbRunMain } = require('../database');
const { logger } = require('../logger');

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

module.exports = {
    updateHeatmap
};
