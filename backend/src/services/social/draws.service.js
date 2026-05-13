const { dbGetMain, dbRunMain, dbAllMain } = require('../../database');
const { logger } = require('../../utils/logger');

// Aliases locaux pour lisibilité
const dbGet = (q, p) => dbGetMain(q, p);
const dbRun = (q, p) => dbRunMain(q, p);
const dbAll = (q, p) => dbAllMain(q, p);

/**
 * Donner un draw (like) à une activité
 * @param {number} userId - ID de l'utilisateur qui donne le draw
 * @param {number} activityId - ID de l'activité
 * @param {number} ownerId - ID du propriétaire de l'activité
 * @returns {Promise<{success: boolean, draw_count: number, message?: string, error?: string}>}
 */
async function giveDraw(userId, activityId, ownerId) {
    try {
        // Vérifier si le draw existe déjà
        const existing = await dbGet(
            'SELECT * FROM activity_draws WHERE activity_id = ? AND from_user_id = ?',
            [activityId, userId]
        );

        if (existing) {
            // Récupérer le nombre actuel de draws
            const countResult = await dbGet(
                'SELECT COUNT(*) as count FROM activity_draws WHERE activity_id = ?',
                [activityId]
            );
            return { 
                success: false, 
                error: 'Already drawn',
                draw_count: countResult?.count || 0
            };
        }

        // Créer le draw
        await dbRun(
            'INSERT INTO activity_draws (activity_id, activity_owner_id, from_user_id) VALUES (?, ?, ?)',
            [activityId, ownerId, userId]
        );

        // Récupérer le nouveau nombre de draws
        const countResult = await dbGet(
            'SELECT COUNT(*) as count FROM activity_draws WHERE activity_id = ?',
            [activityId]
        );

        // Notifier le propriétaire si ce n'est pas son propre draw
        if (ownerId !== userId) {
            try {
                await notifyActivityDraw(ownerId, activityId, userId);
            } catch (err) {
                logger.error('Failed to send draw notification:', err);
            }
        }

        return { 
            success: true, 
            draw_count: countResult?.count || 0,
            message: 'Draw given successfully'
        };
    } catch (error) {
        logger.error('Error giving draw:', error);
        return { success: false, error: 'Failed to give draw' };
    }
}

/**
 * Retirer un draw d'une activité
 * @param {number} userId - ID de l'utilisateur qui retire son draw
 * @param {number} activityId - ID de l'activité
 * @returns {Promise<{success: boolean, draw_count: number, message?: string, error?: string}>}
 */
async function removeDraw(userId, activityId) {
    try {
        await dbRun(
            'DELETE FROM activity_draws WHERE activity_id = ? AND from_user_id = ?',
            [activityId, userId]
        );

        // Récupérer le nouveau nombre de draws
        const countResult = await dbGet(
            'SELECT COUNT(*) as count FROM activity_draws WHERE activity_id = ?',
            [activityId]
        );

        return { 
            success: true, 
            draw_count: countResult?.count || 0,
            message: 'Draw removed successfully'
        };
    } catch (error) {
        logger.error('Error removing draw:', error);
        return { success: false, error: 'Failed to remove draw' };
    }
}

/**
 * Basculer (toggle) un draw sur une activité
 * @param {number} userId - ID de l'utilisateur
 * @param {number} activityId - ID de l'activité
 * @param {number} ownerId - ID du propriétaire de l'activité
 * @returns {Promise<{success: boolean, draw_count: number, has_drawn: boolean, message?: string, error?: string}>}
 */
async function toggleDraw(userId, activityId, ownerId) {
    const existing = await dbGet(
        'SELECT * FROM activity_draws WHERE activity_id = ? AND from_user_id = ?',
        [activityId, userId]
    );

    if (existing) {
        // Retirer le draw
        const result = await removeDraw(userId, activityId);
        return {
            ...result,
            has_drawn: false
        };
    } else {
        // Donner un draw
        const result = await giveDraw(userId, activityId, ownerId);
        return {
            ...result,
            has_drawn: true
        };
    }
}

/**
 * Récupérer le nombre de draws d'une activité
 * @param {number} activityId - ID de l'activité
 * @returns {Promise<number>}
 */
async function getActivityDrawCount(activityId) {
    const result = await dbGet(
        'SELECT COUNT(*) as count FROM activity_draws WHERE activity_id = ?',
        [activityId]
    );
    return result?.count || 0;
}

/**
 * Récupérer tous les draws d'une activité avec les infos des utilisateurs
 * @param {number} activityId - ID de l'activité
 * @returns {Promise<Array>}
 */
async function getActivityDraws(activityId) {
    const draws = await dbAll(`
        SELECT ad.*, 
               json_extract(u.profile_data, '$.name') as user_name,
               u.email as user_email
        FROM activity_draws ad
        LEFT JOIN users u ON ad.from_user_id = u.id
        WHERE ad.activity_id = ?
        ORDER BY ad.created_at DESC
    `, [activityId]);

    return draws.map(d => ({
        id: d.id,
        activity_id: d.activity_id,
        from_user_id: d.from_user_id,
        user_name: d.user_name || d.user_email?.split('@')[0] || 'Anonymous',
        created_at: d.created_at
    }));
}

/**
 * Vérifier si un utilisateur a donné un draw à une activité
 * @param {number} userId - ID de l'utilisateur
 * @param {number} activityId - ID de l'activité
 * @returns {Promise<boolean>}
 */
async function hasUserDrawn(userId, activityId) {
    const result = await dbGet(
        'SELECT * FROM activity_draws WHERE activity_id = ? AND from_user_id = ?',
        [activityId, userId]
    );
    return !!result;
}

/**
 * Récupérer les activités qu'un utilisateur a draw
 * @param {number} userId - ID de l'utilisateur
 * @returns {Promise<Array>}
 */
async function getUserDrawnActivities(userId) {
    const activities = await dbAll(`
        SELECT ad.activity_id, ad.created_at as drawn_at, ad.activity_owner_id
        FROM activity_draws ad
        WHERE ad.from_user_id = ?
        ORDER BY ad.created_at DESC
    `, [userId]);

    return activities;
}

/**
 * Récupérer les stats de draws d'une activité
 * @param {number} activityId - ID de l'activité
 * @returns {Promise<{count: number, recent_draws: Array}>}
 */
async function getActivityDrawStats(activityId) {
    const count = await getActivityDrawCount(activityId);
    const recentDraws = await dbAll(`
        SELECT ad.from_user_id, 
               json_extract(u.profile_data, '$.name') as user_name,
               u.email as user_email,
               ad.created_at
        FROM activity_draws ad
        LEFT JOIN users u ON ad.from_user_id = u.id
        WHERE ad.activity_id = ?
        ORDER BY ad.created_at DESC
        LIMIT 5
    `, [activityId]);

    return {
        count,
        recent_draws: recentDraws.map(d => ({
            user_id: d.from_user_id,
            user_name: d.user_name || d.user_email?.split('@')[0] || 'Anonymous',
            created_at: d.created_at
        }))
    };
}

/**
 * Notifier le propriétaire d'une activité qu'il a reçu un draw
 * @param {number} ownerId - ID du propriétaire
 * @param {number} activityId - ID de l'activité
 * @param {number} fromUserId - ID de l'utilisateur qui a donné le draw
 */
async function notifyActivityDraw(ownerId, activityId, fromUserId) {
    // Importer ici pour éviter les dépendances circulaires
    const socialService = require('../social.service');
    
    const fromUser = await dbGet(
        'SELECT email, json_extract(profile_data, "$.name") as name FROM users WHERE id = ?',
        [fromUserId]
    );
    
    const userName = fromUser?.name || fromUser?.email?.split('@')[0] || 'Someone';
    
    await socialService.createNotification(
        ownerId,
        'activity_draw',
        'Nouveau Draw !',
        `${userName} a donné un draw à votre activité`,
        { activityId, fromUserId }
    );
}

module.exports = {
    giveDraw,
    removeDraw,
    toggleDraw,
    getActivityDrawCount,
    getActivityDraws,
    hasUserDrawn,
    getUserDrawnActivities,
    getActivityDrawStats
};
