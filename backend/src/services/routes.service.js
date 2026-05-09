const { dbGetMain, dbRunMain, dbAllMain } = require('../database');
const { logger } = require('../logger');

const dbGet = (q, p) => dbGetMain(q, p);
const dbRun = (q, p) => dbRunMain(q, p);
const dbAll = (q, p) => dbAllMain(q, p);

/**
 * Créer une nouvelle route
 */
async function createRoute(userId, data) {
    try {
        const result = await dbRun(`
            INSERT INTO routes (name, description, created_by, distance, elevation_gain, 
                              elevation_loss, polyline, activity_type, estimated_duration, 
                              difficulty, tags, is_public)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            data.name, data.description || '', userId, data.distance, 
            data.elevation_gain || 0, data.elevation_loss || 0, data.polyline,
            data.activity_type || 'Run', data.estimated_duration, data.difficulty,
            data.tags ? JSON.stringify(data.tags) : '[]', data.is_public !== false ? 1 : 0
        ]);
        
        return { success: true, route_id: result.lastID };
    } catch (error) {
        logger.error('Error creating route:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Récupérer une route par ID
 */
async function getRoute(routeId, userId = null) {
    const route = await dbGet(`
        SELECT r.*,
               json_extract(u.profile_data, '$.name') as creator_name,
               u.email as creator_email
        FROM routes r
        LEFT JOIN users u ON r.created_by = u.id
        WHERE r.id = ?
    `, [routeId]);
    
    if (!route) return null;
    
    // Check if favorited by user
    let isFavorited = false;
    if (userId) {
        const fav = await dbGet(`
            SELECT * FROM route_favorites WHERE route_id = ? AND user_id = ?
        `, [routeId, userId]);
        isFavorited = !!fav;
    }
    
    return {
        ...route,
        tags: route.tags ? JSON.parse(route.tags) : [],
        is_favorited: isFavorited
    };
}

/**
 * Récupérer les routes publiques
 */
async function getPublicRoutes(activityType = null, difficulty = null, limit = 50, offset = 0) {
    let query = `
        SELECT r.*,
               json_extract(u.profile_data, '$.name') as creator_name
        FROM routes r
        LEFT JOIN users u ON r.created_by = u.id
        WHERE r.is_public = 1
    `;
    const params = [];
    
    if (activityType) {
        query += ' AND r.activity_type = ?';
        params.push(activityType);
    }
    
    if (difficulty) {
        query += ' AND r.difficulty = ?';
        params.push(difficulty);
    }
    
    query += ' ORDER BY r.avg_rating DESC, r.usage_count DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const routes = await dbAll(query, params);
    
    return routes.map(r => ({
        ...r,
        tags: r.tags ? JSON.parse(r.tags) : []
    }));
}

/**
 * Récupérer les routes créées par un utilisateur
 */
async function getUserRoutes(userId) {
    const routes = await dbAll(`
        SELECT r.*
        FROM routes r
        WHERE r.created_by = ?
        ORDER BY r.created_at DESC
    `, [userId]);
    
    return routes.map(r => ({
        ...r,
        tags: r.tags ? JSON.parse(r.tags) : []
    }));
}

/**
 * Récupérer les routes favorites d'un utilisateur
 */
async function getFavoriteRoutes(userId) {
    const routes = await dbAll(`
        SELECT r.*,
               json_extract(u.profile_data, '$.name') as creator_name
        FROM route_favorites rf
        JOIN routes r ON rf.route_id = r.id
        LEFT JOIN users u ON r.created_by = u.id
        WHERE rf.user_id = ?
        ORDER BY rf.created_at DESC
    `, [userId]);
    
    return routes.map(r => ({
        ...r,
        tags: r.tags ? JSON.parse(r.tags) : [],
        is_favorited: true
    }));
}

/**
 * Ajouter une route aux favoris
 */
async function addToFavorites(userId, routeId) {
    try {
        await dbRun(`
            INSERT OR IGNORE INTO route_favorites (route_id, user_id)
            VALUES (?, ?)
        `, [routeId, userId]);
        
        return { success: true };
    } catch (error) {
        logger.error('Error adding to favorites:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Retirer une route des favoris
 */
async function removeFromFavorites(userId, routeId) {
    try {
        await dbRun(`
            DELETE FROM route_favorites WHERE route_id = ? AND user_id = ?
        `, [routeId, userId]);
        
        return { success: true };
    } catch (error) {
        logger.error('Error removing from favorites:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Incrémenter le compteur d'utilisation d'une route
 */
async function incrementRouteUsage(routeId) {
    try {
        await dbRun(`
            UPDATE routes SET usage_count = usage_count + 1 WHERE id = ?
        `, [routeId]);
        return { success: true };
    } catch (error) {
        logger.error('Error incrementing route usage:', error);
        return { success: false };
    }
}

/**
 * Noter une route
 */
async function rateRoute(userId, routeId, rating) {
    try {
        // Vérifier si l'utilisateur a déjà noté
        const existing = await dbGet(`
            SELECT * FROM route_ratings WHERE route_id = ? AND user_id = ?
        `, [routeId, userId]);
        
        if (existing) {
            await dbRun(`
                UPDATE route_ratings SET rating = ? WHERE id = ?
            `, [rating, existing.id]);
        } else {
            await dbRun(`
                INSERT INTO route_ratings (route_id, user_id, rating)
                VALUES (?, ?, ?)
            `, [routeId, userId, rating]);
        }
        
        // Recalculer la moyenne
        const avg = await dbGet(`
            SELECT AVG(rating) as avg_rating, COUNT(*) as count
            FROM route_ratings
            WHERE route_id = ?
        `, [routeId]);
        
        await dbRun(`
            UPDATE routes 
            SET avg_rating = ?, rating_count = ?
            WHERE id = ?
        `, [avg.avg_rating, avg.count, routeId]);
        
        return { success: true };
    } catch (error) {
        logger.error('Error rating route:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Supprimer une route
 */
async function deleteRoute(userId, routeId) {
    try {
        const route = await dbGet('SELECT * FROM routes WHERE id = ?', [routeId]);
        if (!route) {
            return { success: false, error: 'Route not found' };
        }
        if (route.created_by !== userId) {
            return { success: false, error: 'Not authorized' };
        }
        
        await dbRun('DELETE FROM route_favorites WHERE route_id = ?', [routeId]);
        await dbRun('DELETE FROM routes WHERE id = ?', [routeId]);
        
        return { success: true };
    } catch (error) {
        logger.error('Error deleting route:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Simplify an encoded polyline by reducing point count.
 * Uses a simple Douglas-Peucker-like approach: keeps the most significant points.
 */
function simplifyPolyline(encoded, maxPoints = 50) {
    if (!encoded) return null;
    
    // Decode
    let index = 0;
    let lat = 0;
    let lng = 0;
    const points = [];
    
    while (index < encoded.length) {
        let shift = 0;
        let result = 0;
        let byte;
        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);
        const dlat = (result & 1) ? ~(result >> 1) : result >> 1;
        lat += dlat;
        
        shift = 0;
        result = 0;
        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);
        const dlng = (result & 1) ? ~(result >> 1) : result >> 1;
        lng += dlng;
        
        points.push([lat / 1e5, lng / 1e5]);
    }
    
    if (points.length <= maxPoints) return encoded;
    
    // Sample evenly: keep first, last, and evenly spaced points in between
    const sampled = [];
    const step = (points.length - 1) / (maxPoints - 1);
    for (let i = 0; i < maxPoints; i++) {
        const idx = Math.min(Math.round(i * step), points.length - 1);
        sampled.push(points[idx]);
    }
    
    // Re-encode
    let result = '';
    let elat = 0;
    let elng = 0;
    for (const p of sampled) {
        const dLat = Math.round((p[0] - elat) * 1e5);
        const dLng = Math.round((p[1] - elng) * 1e5);
        elat += dLat / 1e5;
        elng += dLng / 1e5;
        
        const enc = (v) => {
            v = v < 0 ? ~(v << 1) : v << 1;
            let s = '';
            while (v >= 0x20) {
                s += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
                v >>= 5;
            }
            s += String.fromCharCode(v + 63);
            return s;
        };
        result += enc(dLat);
        result += enc(dLng);
    }
    return result;
}

/**
 * Récupérer les traces anonymisées de la communauté
 */
async function getCommunityTraces(bounds, activityType, limit = 200) {
    let query = `
        SELECT r.id, r.polyline, r.distance, r.activity_type,
               r.difficulty, r.elevation_gain
        FROM routes r
        WHERE r.is_public = 1
          AND r.polyline IS NOT NULL
          AND r.polyline != ''
    `;
    const params = [];

    if (activityType) {
        query += ' AND r.activity_type = ?';
        params.push(activityType);
    }

    query += ' ORDER BY r.usage_count DESC, r.avg_rating DESC LIMIT ?';
    params.push(limit);

    try {
        const rows = await dbAll(query, params);
        return rows.map(r => ({
            id: r.id,
            polyline: simplifyPolyline(r.polyline, 30),
            distance: r.distance,
            activity_type: r.activity_type,
            difficulty: r.difficulty,
            elevation_gain: r.elevation_gain,
        })).filter(r => r.polyline !== null);
    } catch (error) {
        logger.error('Error fetching community traces:', error);
        return [];
    }
}

module.exports = {
    createRoute,
    getRoute,
    getPublicRoutes,
    getUserRoutes,
    getFavoriteRoutes,
    addToFavorites,
    removeFromFavorites,
    incrementRouteUsage,
    rateRoute,
    deleteRoute,
    getCommunityTraces
};
