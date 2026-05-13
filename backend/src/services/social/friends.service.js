const { dbGetMain, dbRunMain, dbAllMain } = require('../../database');
const dbGet = (q, p) => dbGetMain(q, p);
const dbRun = (q, p) => dbRunMain(q, p);
const dbAll = (q, p) => dbAllMain(q, p);
const notifyNewFriendRequest = () => {};

async function sendFriendRequest(userId, friendId) {
    if (userId === friendId) {
        return { success: false, error: 'Cannot add yourself as friend' };
    }

    const existing = await dbGet(`
        SELECT * FROM friends 
        WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `, [userId, friendId, friendId, userId]);

    if (existing) {
        return { success: false, error: 'Friend request already exists' };
    }

    await dbRun(`
        INSERT INTO friends (user_id, friend_id, status)
        VALUES (?, ?, 'pending')
    `, [userId, friendId]);

    return { success: true, message: 'Friend request sent' };
}

async function acceptFriendRequest(userId, friendId) {
    await dbRun(`
        UPDATE friends 
        SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND friend_id = ? AND status = 'pending'
    `, [friendId, userId]);

    await dbRun(`
        INSERT OR IGNORE INTO friends (user_id, friend_id, status, accepted_at)
        VALUES (?, ?, 'accepted', CURRENT_TIMESTAMP)
    `, [userId, friendId]);

    // Notify the friend who sent the request
    try {
        await notifyNewFriendRequest(friendId, userId);
    } catch (err) {
        // notification failed — non-blocking
    }

    return { success: true, message: 'Friend request accepted' };
}

async function rejectFriendRequest(userId, friendId) {
    await dbRun(`
        DELETE FROM friends 
        WHERE user_id = ? AND friend_id = ? AND status = 'pending'
    `, [friendId, userId]);

    return { success: true, message: 'Friend request rejected' };
}

async function removeFriend(userId, friendId) {
    await dbRun(`
        DELETE FROM friends 
        WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `, [userId, friendId, friendId, userId]);

    return { success: true, message: 'Friend removed' };
}

async function getFriends(userId) {
    const friends = await dbAll(`
        SELECT f.friend_id, f.accepted_at, u.email, json_extract(u.profile_data, '$.name') as name
        FROM friends f
        LEFT JOIN users u ON f.friend_id = u.id
        WHERE f.user_id = ? AND f.status = 'accepted'
        UNION
        SELECT f.user_id as friend_id, f.accepted_at, u.email, json_extract(u.profile_data, '$.name') as name
        FROM friends f
        LEFT JOIN users u ON f.user_id = u.id
        WHERE f.friend_id = ? AND f.status = 'accepted'
    `, [userId, userId]);

    return friends;
}

async function getPendingRequests(userId) {
    const requests = await dbAll(`
        SELECT f.user_id, f.created_at, u.email, json_extract(u.profile_data, '$.name') as name
        FROM friends f
        LEFT JOIN users u ON f.user_id = u.id
        WHERE f.friend_id = ? AND f.status = 'pending'
    `, [userId]);

    return requests;
}

async function generatePartnerSuggestions(userId) {
    
    
    // Get user profile
    const userProfile = await dbGet(`
        SELECT * FROM user_profiles_extended WHERE user_id = ?
    `, [userId]);
    
    if (!userProfile) {
        return { success: false, error: 'Complete your profile first' };
    }
    
    // Get user's friends
    const friends = await dbAll(`
        SELECT friend_id FROM friends WHERE user_id = ? AND status = 'accepted'
        UNION
        SELECT user_id as friend_id FROM friends WHERE friend_id = ? AND status = 'accepted'
    `, [userId, userId]);
    
    const friendIds = friends.map(f => f.friend_id);
    
    // Find potential partners
    let query = `
        SELECT u.id, u.email, json_extract(u.profile_data, '$.name') as name,
               up.level, up.favorite_sports, up.location, up.training_frequency,
               CASE 
                   WHEN up.location = ? AND up.level = ? THEN 100
                   WHEN up.location = ? THEN 70
                   WHEN up.level = ? THEN 50
                   ELSE 30
               END as match_score
        FROM users u
        LEFT JOIN user_profiles_extended up ON u.id = up.user_id
        WHERE u.id != ?
    `;
    
    const params = [userProfile.location, userProfile.level, userProfile.location, userProfile.level, userId];
    
    if (friendIds.length > 0) {
        query += ` AND u.id NOT IN (${friendIds.map(() => '?').join(',')})`;
        params.push(...friendIds);
    }
    
    query += ` ORDER BY match_score DESC LIMIT 10`;
    
    const suggestions = await dbAll(query, params);
    
    // Store suggestions
    for (const suggestion of suggestions) {
        await dbRun(`
            INSERT OR REPLACE INTO partner_suggestions (user_id, suggested_user_id, match_score, reason)
            VALUES (?, ?, ?, ?)
        `, [userId, suggestion.id, suggestion.match_score, `Match score: ${suggestion.match_score}%`]);
    }
    
    return { success: true, suggestions };
}

async function getPartnerSuggestions(userId) {
    
    
    
    const suggestions = await dbAll(`
        SELECT ps.*, NULL as email, NULL as name,
               up.level, up.favorite_sports, up.location
        FROM partner_suggestions ps
        LEFT JOIN user_profiles_extended up ON ps.suggested_user_id = up.user_id
        WHERE ps.user_id = ?
        ORDER BY ps.match_score DESC
    `, [userId]);
    
    return suggestions;
}

module.exports = {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    getFriends,
    getPendingRequests,
    generatePartnerSuggestions,
    getPartnerSuggestions
};
