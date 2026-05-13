'use strict';

const { dbGetMain, dbRunMain, dbAllMain } = require('../../database');
const dbGet = (q, p) => dbGetMain(q, p);
const dbRun = (q, p) => dbRunMain(q, p);
const dbAll = (q, p) => dbAllMain(q, p);

async function createNotification(userId, type, title, message, data = {}) {
    
    
    await dbRun(`
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (?, ?, ?, ?, ?)
    `, [userId, type, title, message, JSON.stringify(data)]);
    
    return { success: true };
}

async function getUserNotifications(userId) {
    
    
    const notifications = await dbAll(`
        SELECT * FROM notifications 
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
    `, [userId]);
    
    return notifications.map(n => ({
        ...n,
        data: n.data ? JSON.parse(n.data) : {}
    }));
}

async function markNotificationAsRead(userId, notificationId) {
    
    
    await dbRun(`
        UPDATE notifications 
        SET read_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
    `, [notificationId, userId]);
    
    return { success: true };
}

async function markAllNotificationsAsRead(userId) {
    
    
    
    await dbRun(`
        UPDATE notifications 
        SET read_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND read_at IS NULL
    `, [userId]);
    
    return { success: true };
}

async function deleteNotification(userId, notificationId) {
    
    
    
    await dbRun(`
        DELETE FROM notifications 
        WHERE id = ? AND user_id = ?
    `, [notificationId, userId]);
    
    return { success: true };
}

// Helper function to create common notifications
async function notifyNewFriendRequest(userId, fromUserId) {
    
    const fromUser = await dbGet(`
        SELECT email, json_extract(profile_data, '$.name') as name FROM users WHERE id = ?
    `, [fromUserId]);
    
    const name = fromUser?.name || fromUser?.email || 'Someone';
    return createNotification(userId, 'friend_request', 'New Friend Request', 
        `${name} sent you a friend request`, { fromUserId });
}

async function notifyActivityLike(userId, activityId, fromUserId) {
    const { getUserDb } = require('../../database');
    
    let activityName = 'your activity';
    try {
        const uDb = await getUserDb(userId);
        const activity = await dbGet(uDb, `SELECT name FROM activities WHERE id = ?`, [activityId]);
        if (activity) activityName = activity.name || activityName;
    } catch(e) { /* swallow */ }
    
    const fromUser = await dbGet(`
        SELECT email, name FROM users WHERE id = ?
    `, [fromUserId]);
    
    const userName = fromUser?.name || fromUser?.email || 'Someone';
    
    return createNotification(userId, 'activity_like', 'New Like', 
        `${userName} liked ${activityName}`, { activityId, fromUserId });
}

async function notifyNewComment(userId, activityId, fromUserId) {
    const { getUserDb } = require('../../database');
    
    let activityName = 'your activity';
    try {
        const uDb = await getUserDb(userId);
        const activity = await dbGet(uDb, `SELECT name FROM activities WHERE id = ?`, [activityId]);
        if (activity) activityName = activity.name || activityName;
    } catch(e) { /* swallow */ }
    
    const fromUser = await dbGet(`
        SELECT email, name FROM users WHERE id = ?
    `, [fromUserId]);
    
    const userName = fromUser?.name || fromUser?.email || 'Someone';
    
    return createNotification(userId, 'new_comment', 'New Comment', 
        `${userName} commented on ${activityName}`, { activityId, fromUserId });
}

async function notifyNewMessage(userId, conversationId, fromUserId) {
    
    const fromUser = await dbGet(`
        SELECT email, name FROM users WHERE id = ?
    `, [fromUserId]);
    
    const userName = fromUser?.name || fromUser?.email || 'Someone';
    
    return createNotification(userId, 'new_message', 'New Message', 
        `${userName} sent you a message`, { conversationId, fromUserId });
}

async function notifyChallengeInvite(userId, challengeId, fromUserId) {
    
    const challenge = await dbGet(`SELECT title FROM challenges WHERE id = ?`, [challengeId]);
    const fromUser = await dbGet(`
        SELECT email, name FROM users WHERE id = ?
    `, [fromUserId]);
    
    const userName = fromUser?.name || fromUser?.email || 'Someone';
    const challengeTitle = challenge?.title || 'a challenge';
    
    return createNotification(userId, 'challenge_invite', 'Challenge Invitation', 
        `${userName} invited you to join "${challengeTitle}"`, { challengeId, fromUserId });
}

const notificationService = {
    createNotification,
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    notifyNewFriendRequest,
    notifyActivityLike,
    notifyNewComment,
    notifyNewMessage,
    notifyChallengeInvite,
};

module.exports = notificationService;
