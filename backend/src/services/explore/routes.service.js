const { dbGetMain, dbRunMain, dbAllMain } = require('../../database');
const { logger } = require('../../utils/logger');
const { simplifyPolyline } = require('../../utils/polyline');
const routingService = require('./routing.service');

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
                              difficulty, tags, is_public, waypoints, directions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            data.name, data.description || '', userId, data.distance, 
            data.elevation_gain || 0, data.elevation_loss || 0, data.polyline,
            data.activity_type || 'Run', data.estimated_duration, data.difficulty,
            data.tags ? JSON.stringify(data.tags) : '[]', data.is_public !== false ? 1 : 0,
            data.waypoints ? JSON.stringify(data.waypoints) : null,
            data.directions ? JSON.stringify(data.directions) : null,
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
        waypoints: route.waypoints ? JSON.parse(route.waypoints) : null,
        directions: route.directions ? JSON.parse(route.directions) : null,
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
        tags: r.tags ? JSON.parse(r.tags) : [],
        waypoints: r.waypoints ? JSON.parse(r.waypoints) : null,
    }));
}

/**
 * Récupérer les routes créées par un utilisateur
 */
async function getUserRoutes(userId) {
    const routes = await dbAll(`
        SELECT r.*,
               json_extract(u.profile_data, '$.name') as creator_name
        FROM routes r
        LEFT JOIN users u ON r.created_by = u.id
        WHERE r.created_by = ?
        ORDER BY r.created_at DESC
    `, [userId]);
    
    return routes.map(r => ({
        ...r,
        tags: r.tags ? JSON.parse(r.tags) : [],
        waypoints: r.waypoints ? JSON.parse(r.waypoints) : null,
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
        waypoints: r.waypoints ? JSON.parse(r.waypoints) : null,
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
 * Générer une route via OSRM et la sauvegarder en base
 * 
 * @param {number} userId - ID du créateur
 * @param {Array<{lat: number, lng: number}>} data.waypoints - Points de passage
 * @param {string} data.activity_type - Type d'activité (Run, Bike, etc.)
 * @param {string} data.name - Nom de la route
 * @param {string} [data.description] - Description
 * @param {string} [data.difficulty] - Difficulté
 * @param {boolean} [data.is_public] - Visibilité
 * @param {string[]} [data.tags] - Tags
 * @returns {Promise<Object>} Résultat avec route_id et directions
 */
async function generateAndCreateRoute(userId, data) {
    try {
        const { waypoints, activity_type, name, description, difficulty, is_public, tags } = data;

        if (!waypoints || waypoints.length < 2) {
            return { success: false, error: 'Au moins 2 points de passage sont requis' };
        }

        // Appeler OSRM pour générer la route
        const routingResult = await routingService.generateRoute(waypoints, activity_type || 'Run');

        if (!routingResult.success) {
            return { success: false, error: routingResult.error || 'Échec de la génération de route' };
        }

        const genRoute = routingResult.route;

        // Créer la route en base
        const routeData = {
            name: name || `Parcours ${routingService.formatDistance(genRoute.distance)}`,
            description: description || '',
            distance: genRoute.distance,
            elevation_gain: genRoute.elevation_gain,
            elevation_loss: 0,
            polyline: genRoute.polyline,
            activity_type: activity_type || 'Run',
            estimated_duration: genRoute.duration,
            difficulty: difficulty || 'medium',
            tags: tags || [],
            is_public: is_public !== false,
            waypoints: waypoints,
            directions: genRoute.directions,
        };

        const result = await createRoute(userId, routeData);

        if (result.success) {
            return {
                success: true,
                route_id: result.route_id,
                directions: genRoute.directions,
                directions_count: genRoute.directions_count,
                distance: genRoute.distance,
                distance_formatted: genRoute.distance_formatted,
                duration: genRoute.duration,
                duration_formatted: genRoute.duration_formatted,
                polyline: genRoute.polyline,
                elevation_gain: genRoute.elevation_gain,
                waypoints_used: waypoints.length,
            };
        }

        return result;
    } catch (error) {
        logger.error('Error generating route:', error);
        return { success: false, error: error.message };
    }
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
    getCommunityTraces,
    generateAndCreateRoute
};
