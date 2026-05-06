/**
 * ============================================================
 * FEED SERVICE - Module Feed du Service Social
 * ============================================================
 * 
 * Gestion du fil d'actualités social et des partages
 * @module social/feed.service
 */

'use strict';

const { dbGetMain, dbRunMain, dbAllMain, getUserDb } = require('../../database');
const { logger } = require('../../logger');

// Aliases locaux pour lisibilité
const dbGet = (q, p) => dbGetMain(q, p);
const dbRun = (q, p) => dbRunMain(q, p);
const dbAll = (q, p) => dbAllMain(q, p);

/**
 * Partager une activité dans le feed social
 * @param {number} userId - ID de l'utilisateur
 * @param {number} activityId - ID de l'activité à partager
 * @param {string} caption - Légende optionnelle
 * @returns {Promise<{success: boolean, postId?: number, message?: string, error?: string}>}
 */
async function shareActivity(userId, activityId, caption = '') {
    try {
        // Vérifier que l'activité appartient à l'utilisateur
        const userDb = await getUserDb(userId);
        const activity = await userDb.get(`
            SELECT id, title, type FROM activities WHERE id = ?
        `, [activityId]);

        if (!activity) {
            return { success: false, error: 'Activity not found' };
        }

        // Créer le post dans le feed
        const result = await dbRun(`
            INSERT INTO social_feed (user_id, activity_id, caption, post_type, created_at)
            VALUES (?, ?, ?, 'activity_share', CURRENT_TIMESTAMP)
        `, [userId, activityId, caption]);

        logger.info(`User ${userId} shared activity ${activityId} to social feed`);

        return { 
            success: true, 
            postId: result.lastID,
            message: 'Activity shared successfully' 
        };
    } catch (error) {
        logger.error('Error sharing activity:', error);
        return { success: false, error: 'Failed to share activity' };
    }
}

/**
 * Créer un post texte dans le feed
 * @param {number} userId - ID de l'utilisateur
 * @param {string} content - Contenu du post
 * @returns {Promise<{success: boolean, postId?: number, message?: string, error?: string}>}
 */
async function createTextPost(userId, content) {
    try {
        if (!content || content.trim().length === 0) {
            return { success: false, error: 'Content cannot be empty' };
        }

        if (content.length > 500) {
            return { success: false, error: 'Content too long (max 500 characters)' };
        }

        const result = await dbRun(`
            INSERT INTO social_feed (user_id, content, post_type, created_at)
            VALUES (?, ?, 'text', CURRENT_TIMESTAMP)
        `, [userId, content.trim()]);

        logger.info(`User ${userId} created text post`);

        return { 
            success: true, 
            postId: result.lastID,
            message: 'Post created successfully' 
        };
    } catch (error) {
        logger.error('Error creating text post:', error);
        return { success: false, error: 'Failed to create post' };
    }
}

/**
 * Supprimer un post du feed
 * @param {number} userId - ID de l'utilisateur
 * @param {number} postId - ID du post à supprimer
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
async function deletePost(userId, postId) {
    try {
        // Vérifier que le post appartient à l'utilisateur
        const post = await dbGet(`
            SELECT id FROM social_feed 
            WHERE id = ? AND user_id = ?
        `, [postId, userId]);

        if (!post) {
            return { success: false, error: 'Post not found or access denied' };
        }

        // Supprimer le post (cascade supprimera les likes et commentaires)
        await dbRun(`
            DELETE FROM social_feed 
            WHERE id = ? AND user_id = ?
        `, [postId, userId]);

        logger.info(`User ${userId} deleted post ${postId}`);

        return { success: true, message: 'Post deleted successfully' };
    } catch (error) {
        logger.error('Error deleting post:', error);
        return { success: false, error: 'Failed to delete post' };
    }
}

/**
 * Récupérer le feed social d'un utilisateur
 * @param {number} userId - ID de l'utilisateur
 * @param {number} page - Page de résultats
 * @param {number} perPage - Nombre de résultats par page
 * @returns {Promise<{success: boolean, posts?: Array, hasMore?: boolean, error?: string}>}
 */
async function getUserFeed(userId, page = 1, perPage = 20) {
    try {
        const offset = (page - 1) * perPage;

        // Récupérer les posts des amis et de l'utilisateur
        const posts = await dbAll(`
            SELECT sf.id, sf.user_id, sf.content, sf.caption, sf.activity_id, sf.post_type, sf.created_at,
                   json_extract(u.profile_data, '$.name') as author_name,
                   a.title as activity_title, a.type as activity_type,
                   (SELECT COUNT(*) FROM post_likes WHERE post_id = sf.id) as like_count,
                   (SELECT COUNT(*) FROM post_comments WHERE post_id = sf.id) as comment_count,
                   EXISTS(SELECT 1 FROM post_likes WHERE post_id = sf.id AND user_id = ?) as user_liked
            FROM social_feed sf
            LEFT JOIN users u ON sf.user_id = u.id
            LEFT JOIN (
                SELECT user_id, id, title, type FROM activities 
                WHERE user_id = ?
            ) a ON sf.activity_id = a.id
            WHERE sf.user_id = ? OR sf.user_id IN (
                SELECT friend_id FROM friends 
                WHERE user_id = ? AND status = 'accepted'
                UNION
                SELECT user_id FROM friends 
                WHERE friend_id = ? AND status = 'accepted'
            )
            ORDER BY sf.created_at DESC
            LIMIT ? OFFSET ?
        `, [userId, userId, userId, userId, userId, perPage, offset]);

        // Vérifier s'il y a plus de résultats
        const hasMore = posts.length === perPage;

        return { 
            success: true, 
            posts,
            hasMore 
        };
    } catch (error) {
        logger.error('Error fetching user feed:', error);
        return { success: false, error: 'Failed to fetch feed' };
    }
}

/**
 * Aimer un post
 * @param {number} userId - ID de l'utilisateur
 * @param {number} postId - ID du post
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
async function likePost(userId, postId) {
    try {
        // Vérifier si le post existe
        const post = await dbGet(`
            SELECT id FROM social_feed WHERE id = ?
        `, [postId]);

        if (!post) {
            return { success: false, error: 'Post not found' };
        }

        // Vérifier si l'utilisateur a déjà aimé
        const existingLike = await dbGet(`
            SELECT id FROM post_likes 
            WHERE post_id = ? AND user_id = ?
        `, [postId, userId]);

        if (existingLike) {
            return { success: false, error: 'Post already liked' };
        }

        // Ajouter le like
        await dbRun(`
            INSERT INTO post_likes (post_id, user_id, created_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
        `, [postId, userId]);

        logger.info(`User ${userId} liked post ${postId}`);

        return { success: true, message: 'Post liked successfully' };
    } catch (error) {
        logger.error('Error liking post:', error);
        return { success: false, error: 'Failed to like post' };
    }
}

/**
 * Ne plus aimer un post
 * @param {number} userId - ID de l'utilisateur
 * @param {number} postId - ID du post
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
async function unlikePost(userId, postId) {
    try {
        // Supprimer le like
        const result = await dbRun(`
            DELETE FROM post_likes 
            WHERE post_id = ? AND user_id = ?
        `, [postId, userId]);

        if (result.changes === 0) {
            return { success: false, error: 'Post was not liked' };
        }

        logger.info(`User ${userId} unliked post ${postId}`);

        return { success: true, message: 'Post unliked successfully' };
    } catch (error) {
        logger.error('Error unliking post:', error);
        return { success: false, error: 'Failed to unlike post' };
    }
}

/**
 * Ajouter un commentaire à un post
 * @param {number} userId - ID de l'utilisateur
 * @param {number} postId - ID du post
 * @param {string} content - Contenu du commentaire
 * @returns {Promise<{success: boolean, commentId?: number, message?: string, error?: string}>}
 */
async function addComment(userId, postId, content) {
    try {
        if (!content || content.trim().length === 0) {
            return { success: false, error: 'Comment cannot be empty' };
        }

        if (content.length > 300) {
            return { success: false, error: 'Comment too long (max 300 characters)' };
        }

        // Vérifier que le post existe
        const post = await dbGet(`
            SELECT id FROM social_feed WHERE id = ?
        `, [postId]);

        if (!post) {
            return { success: false, error: 'Post not found' };
        }

        // Ajouter le commentaire
        const result = await dbRun(`
            INSERT INTO post_comments (post_id, user_id, content, created_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `, [postId, userId, content.trim()]);

        logger.info(`User ${userId} commented on post ${postId}`);

        return { 
            success: true, 
            commentId: result.lastID,
            message: 'Comment added successfully' 
        };
    } catch (error) {
        logger.error('Error adding comment:', error);
        return { success: false, error: 'Failed to add comment' };
    }
}

module.exports = {
    shareActivity,
    createTextPost,
    deletePost,
    getUserFeed,
    likePost,
    unlikePost,
    addComment
};
