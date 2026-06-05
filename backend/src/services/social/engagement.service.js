'use strict';

const { dbGetMain, dbRunMain, dbAllMain } = require('../../database');
const dbGet = (q, p) => dbGetMain(q, p);
const dbRun = (q, p) => dbRunMain(q, p);
const dbAll = (q, p) => dbAllMain(q, p);
const { addXP: _addXP } = require('./challenges.service');
const notifyActivityLike = () => {};
const notifyNewComment = () => {};

async function likeActivity(userId, activityId, fromUserId) {
    
    const existing = await dbGet('SELECT * FROM activity_likes WHERE activity_id = ? AND activity_owner_id = ? AND from_user_id = ?', [activityId, userId, fromUserId]);
    if (existing) return { success: false, error: 'Already liked' };
    
    await dbRun('INSERT INTO activity_likes (activity_id, activity_owner_id, from_user_id) VALUES (?, ?, ?)', [activityId, userId, fromUserId]);
    
    if (userId !== fromUserId) {
        try { await notifyActivityLike(userId, activityId, fromUserId); } catch (e) { /* swallow */ }
    }
    return { success: true };
}

async function unlikeActivity(userId, activityId, fromUserId) {
    
    await dbRun('DELETE FROM activity_likes WHERE activity_id = ? AND activity_owner_id = ? AND from_user_id = ?', [activityId, userId, fromUserId]);
    return { success: true };
}

async function getActivityLikes(userId, activityId) {
    
    return await dbAll(`
        SELECT u.id, u.name, JSON_EXTRACT(u.profile_data, '$.avatar_url') as avatar
        FROM activity_likes al
        JOIN users u ON al.from_user_id = u.id
        WHERE al.activity_id = ? AND al.activity_owner_id = ?
        ORDER BY al.created_at DESC
    `, [activityId, userId]);
}

async function getUserLikedActivities(userId) {
    
    
    
    const activities = await dbAll(`
        SELECT a.*, 
               COUNT(DISTINCT al.id) as like_count,
               MAX(CASE WHEN al.from_user_id = ? THEN 1 ELSE 0 END) as user_liked
        FROM activities a
        LEFT JOIN activity_likes al ON a.id = al.activity_id
        WHERE a.id IN (SELECT DISTINCT activity_id FROM activity_likes WHERE user_id = ?)
        GROUP BY a.id
        ORDER BY MAX(al.created_at) DESC
    `, [userId, userId]);
    
    return activities;
}

// Phase 1: Activity Comments
async function addComment(userId, activityId, content, ownerId) {
    
    const result = await dbRun(`
        INSERT INTO activity_comments (activity_id, activity_owner_id, user_id, content)
        VALUES (?, ?, ?, ?)
    `, [activityId, ownerId, userId, content]);
    
    // Notify activity owner
    if (ownerId !== userId) {
        try {
            await notifyNewComment(ownerId, activityId, userId);
        } catch (err) {
            // notification failed — non-blocking
        }
    }
    return { success: true, comment: { id: result.lastID, activity_id: activityId, activity_owner_id: ownerId, user_id: userId, content, created_at: new Date().toISOString() } };
}

async function getActivityComments(activityId, ownerId) {
    
    const comments = await dbAll(`
        SELECT ac.*, u.name as user_name, JSON_EXTRACT(u.profile_data, '$.avatar_url') as user_avatar
        FROM activity_comments ac
        LEFT JOIN users u ON ac.user_id = u.id
        WHERE ac.activity_id = ? AND ac.activity_owner_id = ?
        ORDER BY ac.created_at DESC
    `, [activityId, ownerId]);
    return comments;
}

async function deleteComment(userId, commentId) {
    
    await dbRun('DELETE FROM activity_comments WHERE id = ? AND user_id = ?', [commentId, userId]);
    return { success: true, message: 'Comment deleted' };
}

// Phase 1: Activity Reactions
async function addReaction(userId, activityId, reactionType, ownerId) {
    
    const existing = await dbGet('SELECT * FROM activity_reactions WHERE activity_id = ? AND activity_owner_id = ? AND user_id = ? AND reaction_type = ?', [activityId, ownerId, userId, reactionType]);
    if (existing) {
        return { success: false, error: 'Already reacted' };
    }
    const result = await dbRun(`
        INSERT INTO activity_reactions (activity_id, activity_owner_id, user_id, reaction_type)
        VALUES (?, ?, ?, ?)
    `, [activityId, ownerId, userId, reactionType]);
    return { success: true, reaction: { id: result.lastID, activity_id: activityId, activity_owner_id: ownerId, user_id: userId, reaction_type: reactionType } };
}

async function removeReaction(userId, activityId, reactionType, ownerId) {
    
    await dbRun('DELETE FROM activity_reactions WHERE activity_id = ? AND activity_owner_id = ? AND user_id = ? AND reaction_type = ?', [activityId, ownerId, userId, reactionType]);
    return { success: true };
}

async function getActivityReactions(activityId, ownerId) {
    
    const reactions = await dbAll(`
        SELECT ar.*, u.name as user_name, JSON_EXTRACT(u.profile_data, '$.avatar_url') as user_avatar
        FROM activity_reactions ar
        LEFT JOIN users u ON ar.user_id = u.id
        WHERE ar.activity_id = ? AND ar.activity_owner_id = ?
        ORDER BY ar.created_at DESC
    `, [activityId, ownerId]);
    
    const grouped = {};
    reactions.forEach(r => {
        if (!grouped[r.reaction_type]) grouped[r.reaction_type] = [];
        grouped[r.reaction_type].push(r);
    });
    
    return grouped;
}

async function getUserActivityReactions(userId) {
    
    return await dbAll(`
        SELECT * FROM activity_reactions 
        WHERE user_id = ?
        ORDER BY created_at DESC
    `, [userId]);
}

module.exports = {
    likeActivity,
    unlikeActivity,
    getActivityLikes,
    getUserLikedActivities,
    addComment,
    getActivityComments,
    deleteComment,
    addReaction,
    removeReaction,
    getActivityReactions,
    getUserActivityReactions,
};
