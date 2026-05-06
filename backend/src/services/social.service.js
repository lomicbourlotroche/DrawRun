/* eslint-disable no-empty, no-redeclare, unused-imports/no-unused-vars */
const { dbGetMain, dbRunMain, dbAllMain, getUserDb, dbAllUser } = require('../database');

// Aliases locaux pour lisibilité
const dbGet  = (q, p) => dbGetMain(q, p);
const dbRun  = (q, p) => dbRunMain(q, p);
const dbAll  = (q, p) => dbAllMain(q, p);

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

async function createGroup(userId, name, description, isPrivate = true) {
    const inviteCode = isPrivate ? generateInviteCode() : null;

    const result = await dbRun(`
        INSERT INTO training_groups (name, description, creator_id, is_private, invite_code)
        VALUES (?, ?, ?, ?, ?)
    `, [name, description || '', userId, isPrivate ? 1 : 0, inviteCode]);

    const row = await dbGet('SELECT MAX(id) as id FROM training_groups');
    const groupId = row?.id || result.lastID;

    await dbRun(`
        INSERT INTO group_members (group_id, user_id, role)
        VALUES (?, ?, 'admin')
    `, [groupId, userId]);

    return {
        success: true,
        group: {
            id: groupId,
            name,
            description,
            inviteCode
        }
    };
}

async function joinGroup(userId, inviteCode) {
    const group = await dbGet(`
        SELECT * FROM training_groups WHERE invite_code = ?
    `, [inviteCode]);

    if (!group) {
        return { success: false, error: 'Invalid invite code' };
    }

    const existing = await dbGet(`
        SELECT * FROM group_members WHERE group_id = ? AND user_id = ?
    `, [group.id, userId]);

    if (existing) {
        return { success: false, error: 'Already a member' };
    }

    await dbRun(`
        INSERT INTO group_members (group_id, user_id, role)
        VALUES (?, ?, 'member')
    `, [group.id, userId]);

    return { success: true, group };
}

async function leaveGroup(userId, groupId) {
    const member = await dbGet(`
        SELECT role FROM group_members WHERE group_id = ? AND user_id = ?
    `, [groupId, userId]);

    if (!member) {
        return { success: false, error: 'Not a member of this group' };
    }

    const adminCount = await dbGet(`
        SELECT COUNT(*) as count FROM group_members WHERE group_id = ? AND role = 'admin'
    `, [groupId]);

    if (member.role === 'admin' && adminCount.count <= 1) {
        const otherMembers = await dbGet(`
            SELECT COUNT(*) as count FROM group_members WHERE group_id = ? AND user_id != ?
        `, [groupId, userId]);

        if (otherMembers.count > 0) {
            await dbRun(`
                UPDATE group_members SET role = 'admin'
                WHERE group_id = ? AND user_id != ?
                ORDER BY joined_at ASC LIMIT 1
            `, [groupId, userId]);
        } else {
            await dbRun('DELETE FROM training_groups WHERE id = ?', [groupId]);
        }
    }

    await dbRun(`
        DELETE FROM group_members WHERE group_id = ? AND user_id = ?
    `, [groupId, userId]);

    return { success: true };
}

async function getGroups(userId) {
    const groups = await dbAll(`
        SELECT g.*, gm.role,
            (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
        FROM training_groups g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = ?
        ORDER BY g.created_at DESC
    `, [userId]);

    return groups;
}

async function getGroupDetail(groupId, userId) {
    const group = await dbGet(`
        SELECT g.*,
            (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count,
            (SELECT COUNT(*) FROM group_members WHERE group_id = g.id AND role = 'admin') as admin_count
        FROM training_groups g WHERE g.id = ?
    `, [groupId]);

    if (!group) {
        return { success: false, error: 'Group not found' };
    }

    const membership = await dbGet(`
        SELECT role FROM group_members WHERE group_id = ? AND user_id = ?
    `, [groupId, userId]);

    return {
        success: true,
        group: { ...group, userRole: membership?.role || null, isMember: !!membership }
    };
}

async function editGroup(userId, groupId, updates) {
    const membership = await dbGet(`
        SELECT role FROM group_members WHERE group_id = ? AND user_id = ?
    `, [groupId, userId]);

    if (!membership || membership.role !== 'admin') {
        return { success: false, error: 'Admin access required' };
    }

    const fields = [];
    const values = [];

    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    if (updates.isPrivate !== undefined) { fields.push('is_private = ?'); values.push(updates.isPrivate ? 1 : 0); }

    if (fields.length === 0) {
        return { success: false, error: 'No fields to update' };
    }

    if (updates.regenerateInvite) {
        fields.push('invite_code = ?');
        values.push(generateInviteCode());
    }

    values.push(groupId);
    await dbRun(`UPDATE training_groups SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);

    return { success: true };
}

async function deleteGroup(userId, groupId) {
    const membership = await dbGet(`
        SELECT role FROM group_members WHERE group_id = ? AND user_id = ?
    `, [groupId, userId]);

    if (!membership || membership.role !== 'admin') {
        return { success: false, error: 'Admin access required' };
    }

    await dbRun('DELETE FROM group_members WHERE group_id = ?', [groupId]);
    await dbRun('DELETE FROM training_groups WHERE id = ?', [groupId]);

    return { success: true };
}

async function kickMember(adminId, groupId, targetUserId) {
    const admin = await dbGet(`
        SELECT role FROM group_members WHERE group_id = ? AND user_id = ?
    `, [groupId, adminId]);

    if (!admin || admin.role !== 'admin') {
        return { success: false, error: 'Admin access required' };
    }

    const target = await dbGet(`
        SELECT role FROM group_members WHERE group_id = ? AND user_id = ?
    `, [groupId, targetUserId]);

    if (!target) {
        return { success: false, error: 'User is not a member' };
    }

    if (target.role === 'admin' && adminId !== targetUserId) {
        return { success: false, error: 'Cannot kick another admin' };
    }

    await dbRun('DELETE FROM group_members WHERE group_id = ? AND user_id = ?', [groupId, targetUserId]);

    return { success: true };
}

async function promoteMember(adminId, groupId, targetUserId, newRole) {
    if (!['admin', 'moderator', 'member'].includes(newRole)) {
        return { success: false, error: 'Invalid role' };
    }

    const admin = await dbGet(`
        SELECT role FROM group_members WHERE group_id = ? AND user_id = ?
    `, [groupId, adminId]);

    if (!admin || admin.role !== 'admin') {
        return { success: false, error: 'Admin access required' };
    }

    await dbRun(`
        UPDATE group_members SET role = ? WHERE group_id = ? AND user_id = ?
    `, [newRole, groupId, targetUserId]);

    return { success: true };
}

async function getGroupMembers(groupId) {
    const members = await dbAll(`
        SELECT gm.id, gm.group_id, gm.user_id, gm.role, gm.joined_at,
            u.email, json_extract(u.profile_data, '$.name') as name,
            json_extract(u.profile_data, '$.avatar_url') as avatar_url
        FROM group_members gm
        LEFT JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = ?
        ORDER BY
            CASE gm.role WHEN 'admin' THEN 1 WHEN 'moderator' THEN 2 ELSE 3 END,
            gm.joined_at ASC
    `, [groupId]);

    return members;
}

async function getGroupActivities(groupId, limit = 20, offset = 0) {
    const memberIds = await dbAll(`
        SELECT user_id FROM group_members WHERE group_id = ?
    `, [groupId]);

    if (memberIds.length === 0) return [];

    const allActivities = [];
    for (const member of memberIds) {
        try {
            const userDb = await getUserDb(member.user_id);
            const activities = await dbAllUser(userDb, `
                SELECT a.*, u.name as owner_name
                FROM activities a
                JOIN users u ON a.user_id = u.id
                WHERE a.user_id = ?
                ORDER BY a.start_date DESC
            `, [member.user_id]);
            allActivities.push(...activities);
        } catch (_) {
            // Skip users whose DB is unavailable
        }
    }

    // Sort globally and apply pagination
    allActivities.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    return allActivities.slice(offset, offset + limit);
}

async function getGroupEvents(groupId) {
    const memberIds = await dbAll(`
        SELECT user_id FROM group_members WHERE group_id = ?
    `, [groupId]);

    if (memberIds.length === 0) return [];

    const allEvents = [];
    for (const member of memberIds) {
        try {
            const userDb = await getUserDb(member.user_id);
            const events = await dbAllUser(userDb, `
                SELECT e.*,
                    (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id AND status = 'going') as attendee_count
                FROM events e
                WHERE e.group_id = ? AND e.event_date >= datetime('now')
                ORDER BY e.event_date ASC
            `, [groupId]);
            allEvents.push(...events);
        } catch (_) {
            // Skip users whose DB is unavailable
        }
    }

    // Sort globally by date
    allEvents.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
    return allEvents;
}

async function createEvent(userId, groupId, title, description, location, eventDate, endDate, isOnline, maxAttendees) {
    const membership = await dbGet(`
        SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?
    `, [groupId, userId]);

    if (!membership) {
        return { success: false, error: 'Must be a group member' };
    }

    const result = await dbRun(`
        INSERT INTO events (title, description, location, event_date, end_date, is_online, max_attendees, group_id, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, description || '', location || '', eventDate, endDate, isOnline ? 1 : 0, maxAttendees, groupId, userId]);

    const row = await dbGet('SELECT MAX(id) as id FROM events');
    const eventId = row?.id || result.lastID;

    await dbRun(`
        INSERT INTO event_participants (event_id, user_id, status)
        VALUES (?, ?, 'going')
    `, [eventId, userId]);

    return { success: true, eventId };
}

async function joinEvent(userId, eventId) {
    const existing = await dbGet(`
        SELECT status FROM event_participants WHERE event_id = ? AND user_id = ?
    `, [eventId, userId]);

    if (existing) {
        return { success: false, error: 'Already registered' };
    }

    await dbRun(`
        INSERT INTO event_participants (event_id, user_id, status)
        VALUES (?, ?, 'going')
    `, [eventId, userId]);

    return { success: true };
}

async function getPublicGroups(searchQuery) {
    let query = `
        SELECT g.*,
            (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count,
            COALESCE(
                NULLIF(json_extract(u.profile_data, '$.name'), ''),
                u.name,
                'Utilisateur ' || u.id
            ) as creator_name
        FROM training_groups g
        JOIN users u ON g.creator_id = u.id
        WHERE g.is_private = 0
    `;
    const params = [];

    if (searchQuery) {
        query += ' AND (g.name LIKE ? OR g.description LIKE ?)';
        params.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }

    query += ' ORDER BY member_count DESC, g.created_at DESC LIMIT 50';

    return dbAll(query, params);
}

function generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

async function updateSharedStats(userId, statType, statValue, statUnit, period = 'week', anonymous = true) {
    await dbRun(`
        INSERT OR REPLACE INTO shared_stats (user_id, stat_type, stat_value, stat_unit, period, shared_anonymously)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, statType, statValue, statUnit, period, anonymous ? 1 : 0]);

    return { success: true };
}

async function getLeaderboard(groupId, category = 'distance', period = 'week') {
    let query = `
        SELECT 
            CASE WHEN ss.shared_anonymously = 1 THEN 'Anonymous' ELSE json_extract(u.profile_data, '$.name') END as name,
            ss.stat_value as value,
            ss.stat_unit as unit
        FROM shared_stats ss
        LEFT JOIN users u ON ss.user_id = u.id
        WHERE ss.stat_type = ? AND ss.period = ?
    `;

    if (groupId) {
        query = `
            SELECT 
                CASE WHEN ss.shared_anonymously = 1 THEN 'Anonymous' ELSE json_extract(u.profile_data, '$.name') END as name,
                ss.stat_value as value,
                ss.stat_unit as unit
            FROM shared_stats ss
            LEFT JOIN users u ON ss.user_id = u.id
            JOIN group_members gm ON gm.user_id = ss.user_id
            WHERE gm.group_id = ? AND ss.stat_type = ? AND ss.period = ?
        `;
    }

    const leaderboard = await dbAll(query + ' ORDER BY ss.stat_value DESC LIMIT 100', 
        groupId ? [groupId, category, period] : [category, period]);

    return leaderboard.map((entry, index) => ({
        ...entry,
        rank: index + 1
    }));
}

async function likeActivity(userId, activityId, fromUserId) {
    
    const existing = await dbGet('SELECT * FROM activity_likes WHERE activity_id = ? AND activity_owner_id = ? AND from_user_id = ?', [activityId, userId, fromUserId]);
    if (existing) return { success: false, error: 'Already liked' };
    
    await dbRun('INSERT INTO activity_likes (activity_id, activity_owner_id, from_user_id) VALUES (?, ?, ?)', [activityId, userId, fromUserId]);
    
    if (userId !== fromUserId) {
        try { await notifyActivityLike(userId, activityId, fromUserId); } catch (e) {}
    }
    return { success: true };
}

async function unlikeActivity(userId, activityId, fromUserId) {
    
    await dbRun('DELETE FROM activity_likes WHERE activity_id = ? AND activity_owner_id = ? AND from_user_id = ?', [activityId, userId, fromUserId]);
    return { success: true };
}

async function getActivityLikes(userId, activityId) {
    
    return await dbAll(`
        SELECT u.id, u.name, u.avatar
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

function generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
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
        SELECT ac.*, u.name as user_name, u.avatar as user_avatar
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
        SELECT ar.*, u.name as user_name, u.avatar as user_avatar
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

async function createConversation(userId, participantIds, type = 'private', groupId = null, title = null) {
    
    
    const result = await dbRun(`
        INSERT INTO conversations (type, group_id, title)
        VALUES (?, ?, ?)
    `, [type, groupId, title]);
    
    const conversationId = result.lastID;
    
    const allParticipants = [...new Set([userId, ...participantIds])];
    for (const pId of allParticipants) {
        await dbRun(`
            INSERT INTO conversation_participants (conversation_id, user_id)
            VALUES (?, ?)
        `, [conversationId, pId]);
    }
    
    return { success: true, conversationId };
}

async function getUserConversations(userId) {
    
    return await dbAll(`
        SELECT c.*, 
            (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
            (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at
        FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        WHERE cp.user_id = ?
        ORDER BY last_message_at DESC
    `, [userId]);
}

async function getConversationMessages(conversationId) {
    
    return await dbAll(`
        SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
        ORDER BY m.created_at ASC
    `, [conversationId]);
}

async function sendMessage(userId, conversationId, content, messageType = 'text') {
    
    
    const result = await dbRun(`
        INSERT INTO messages (conversation_id, sender_id, content, message_type)
        VALUES (?, ?, ?, ?)
    `, [conversationId, userId, content, messageType]);
    
    await dbRun(`
        UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [conversationId]);
    
    return { success: true, messageId: result.lastID };
}

async function getConversationParticipants(conversationId) {
    
    return await dbAll(`
        SELECT cp.*, u.name, u.email
        FROM conversation_participants cp
        LEFT JOIN users u ON cp.user_id = u.id
        WHERE cp.conversation_id = ?
    `, [conversationId]);
}

async function createGroupConversation(userId, groupId, title) {
    return createConversation(userId, [], 'group', groupId, title);
}

async function createChallenge(userId, title, description, type, targetValue, targetUnit, durationDays, isPublic = true, maxParticipants = null) {
    
    
    const result = await dbRun(`
        INSERT INTO challenges (title, description, type, target_value, target_unit, duration_days, created_by, is_public, max_participants)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, description, type, targetValue, targetUnit, durationDays, userId, isPublic ? 1 : 0, maxParticipants]);
    
    const challengeId = result.lastID;
    
    await dbRun(`
        INSERT INTO user_challenges (user_id, challenge_id, start_date, end_date, progress, status)
        VALUES (?, ?, datetime('now'), datetime('now', '+' || ? || ' days'), 0, 'active')
    `, [userId, challengeId, durationDays]);
    
    return { success: true, challengeId };
}

async function joinChallenge(userId, challengeId) {
    
    
    const challenge = await dbGet(`SELECT * FROM challenges WHERE id = ?`, [challengeId]);
    if (!challenge) return { success: false, error: 'Challenge not found' };
    
    if (challenge.max_participants) {
        const count = await dbGet(`SELECT COUNT(*) as count FROM user_challenges WHERE challenge_id = ?`, [challengeId]);
        if (count.count >= challenge.max_participants) {
            return { success: false, error: 'Challenge is full' };
        }
    }
    
    const duration = challenge.duration_days || 30;
    await dbRun(`
        INSERT INTO user_challenges (user_id, challenge_id, start_date, end_date, progress, status)
        VALUES (?, ?, datetime('now'), datetime('now', '+' || ? || ' days'), 0, 'active')
    `, [userId, challengeId, duration]);
    
    return { success: true };
}

async function updateChallengeProgress(userId, challengeId, progress) {
    
    
    await dbRun(`
        UPDATE user_challenges 
        SET progress = ?, status = CASE WHEN ? >= 100 THEN 'completed' ELSE status END
        WHERE user_id = ? AND challenge_id = ?
    `, [progress, progress, userId, challengeId]);
    
    return { success: true };
}

async function getUserChallenges(userId) {
    
    return await dbAll(`
        SELECT c.*, uc.progress, uc.status as user_status, uc.start_date, uc.end_date
        FROM challenges c
        JOIN user_challenges uc ON c.id = uc.challenge_id
        WHERE uc.user_id = ?
        ORDER BY uc.start_date DESC
    `, [userId]);
}

async function getPublicChallenges() {
    
    return await dbAll(`
        SELECT c.*, 
            (SELECT COUNT(*) FROM user_challenges WHERE challenge_id = c.id) as participant_count
        FROM challenges c
        WHERE c.is_public = 1 AND c.end_date > datetime('now')
        ORDER BY c.created_at DESC
    `);
}

async function getChallengeDetails(challengeId) {
    
    
    const challenge = await dbGet(`SELECT * FROM challenges WHERE id = ?`, [challengeId]);
    if (!challenge) return null;
    
    const participants = await dbAll(`
        SELECT uc.*, u.name
        FROM user_challenges uc
        LEFT JOIN users u ON uc.user_id = u.id
        WHERE uc.challenge_id = ?
        ORDER BY uc.progress DESC
    `, [challengeId]);
    
    return { ...challenge, participants };
}

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
    const { getUserDb } = require('../database');
    
    let activityName = 'your activity';
    try {
        const uDb = getUserDb(userId);
        const activity = await dbGet(uDb, `SELECT name FROM activities WHERE id = ?`, [activityId]);
        if (activity) activityName = activity.name || activityName;
    } catch(e) {}
    
    const fromUser = await dbGet(`
        SELECT email, name FROM users WHERE id = ?
    `, [fromUserId]);
    
    const userName = fromUser?.name || fromUser?.email || 'Someone';
    
    return createNotification(userId, 'activity_like', 'New Like', 
        `${userName} liked ${activityName}`, { activityId, fromUserId });
}

async function notifyNewComment(userId, activityId, fromUserId) {
    const { getUserDb } = require('../database');
    
    let activityName = 'your activity';
    try {
        const uDb = getUserDb(userId);
        const activity = await dbGet(uDb, `SELECT name FROM activities WHERE id = ?`, [activityId]);
        if (activity) activityName = activity.name || activityName;
    } catch(e) {}
    
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

module.exports = {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    getFriends,
    getPendingRequests,
    createGroup,
    joinGroup,
    leaveGroup,
    getGroups,
    getGroupDetail,
    editGroup,
    deleteGroup,
    kickMember,
    promoteMember,
    getGroupMembers,
    getGroupActivities,
    getGroupEvents,
    getPublicGroups,
    updateSharedStats,
    getLeaderboard,
    likeActivity,
    unlikeActivity,
    getActivityLikes,
    getUserLikedActivities,
    generateInviteCode,
    addComment,
    getActivityComments,
    deleteComment,
    addReaction,
    removeReaction,
    getActivityReactions,
    getUserActivityReactions,
    createConversation,
    getUserConversations,
    getConversationMessages,
    sendMessage,
    getConversationParticipants,
    createGroupConversation,
    createChallenge,
    joinChallenge,
    updateChallengeProgress,
    getUserChallenges,
    getPublicChallenges,
    getChallengeDetails,
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
    
    // Phase 2: Challenge Teams
    createChallengeTeam,
    joinChallengeTeam,
    getChallengeTeams,
    
    // Phase 2: Badges & XP
    createBadge,
    awardBadge,
    getUserBadges,
    addXP,
    getUserLevel,
    
    // Phase 2: Events
    createEvent,
    joinEvent,
    
    // Phase 2: Partner Suggestions
    generatePartnerSuggestions,
    getPartnerSuggestions
};

// ============================================================
// PHASE 2: CHALLENGE TEAMS
// ============================================================

async function createChallengeTeam(userId, challengeId, teamName) {
    
    
    
    // Check if user is part of the challenge
    const userChallenge = await dbGet(`
        SELECT * FROM user_challenges 
        WHERE user_id = ? AND challenge_id = ?
    `, [userId, challengeId]);
    
    if (!userChallenge) {
        return { success: false, error: 'You must join the challenge first' };
    }
    
    // Check if challenge is a team challenge
    const challenge = await dbGet(`SELECT * FROM challenges WHERE id = ?`, [challengeId]);
    if (!challenge.is_team) {
        return { success: false, error: 'This is not a team challenge' };
    }
    
    // Create team
    const result = await dbRun(`
        INSERT INTO challenge_teams (challenge_id, name, created_by)
        VALUES (?, ?, ?)
    `, [challengeId, teamName, userId]);
    
    const teamId = result.lastID;
    
    // Add creator to team
    await dbRun(`
        INSERT INTO challenge_team_members (team_id, user_id)
        VALUES (?, ?)
    `, [teamId, userId]);
    
    // Update user challenge with team
    await dbRun(`
        UPDATE user_challenges 
        SET team_id = ?
        WHERE user_id = ? AND challenge_id = ?
    `, [teamId, userId, challengeId]);
    
    const team = await dbGet(`
        SELECT ct.*, NULL as email, NULL as creator_name
        FROM challenge_teams ct
        WHERE ct.id = ?
    `, [teamId]);
    
    return { success: true, team };
}

async function joinChallengeTeam(userId, teamId) {
    
    
    
    // Check if team exists
    const team = await dbGet(`SELECT * FROM challenge_teams WHERE id = ?`, [teamId]);
    if (!team) {
        return { success: false, error: 'Team not found' };
    }
    
    // Check if user is part of the challenge
    const userChallenge = await dbGet(`
        SELECT * FROM user_challenges 
        WHERE user_id = ? AND challenge_id = ?
    `, [userId, team.challenge_id]);
    
    if (!userChallenge) {
        return { success: false, error: 'You must join the challenge first' };
    }
    
    // Check if team is full
    if (team.max_members) {
        const memberCount = await dbGet(`
            SELECT COUNT(*) as count FROM challenge_team_members WHERE team_id = ?
        `, [teamId]);
        
        if (memberCount.count >= team.max_members) {
            return { success: false, error: 'Team is full' };
        }
    }
    
    // Check if already in a team for this challenge
    if (userChallenge.team_id) {
        return { success: false, error: 'You are already in a team for this challenge' };
    }
    
    // Join team
    await dbRun(`
        INSERT INTO challenge_team_members (team_id, user_id)
        VALUES (?, ?)
    `, [teamId, userId]);
    
    // Update user challenge with team
    await dbRun(`
        UPDATE user_challenges 
        SET team_id = ?
        WHERE user_id = ? AND challenge_id = ?
    `, [teamId, userId, team.challenge_id]);
    
    return { success: true, message: 'Joined team successfully' };
}

async function getChallengeTeams(challengeId) {
    
    
    
    const teams = await dbAll(`
        SELECT ct.*, 
               (SELECT COUNT(*) FROM challenge_team_members WHERE team_id = ct.id) as member_count,
               (SELECT SUM(progress) FROM user_challenges WHERE team_id = ct.id) as team_progress
        FROM challenge_teams ct
        WHERE ct.challenge_id = ?
        ORDER BY team_progress DESC
    `, [challengeId]);
    
    return teams;
}

// ============================================================
// PHASE 2: BADGES & XP
// ============================================================

async function createBadge(name, description, icon, xpReward, criteria) {
    
    
    const result = await dbRun(`
        INSERT INTO badges (name, description, icon, xp_reward, criteria)
        VALUES (?, ?, ?, ?, ?)
    `, [name, description, icon, xpReward, criteria]);
    
    const badge = await dbGet(`SELECT * FROM badges WHERE id = ?`, result.lastID);
    
    return { success: true, badge };
}

async function awardBadge(userId, badgeId) {
    
    
    
    // Check if badge exists
    const badge = await dbGet(`SELECT * FROM badges WHERE id = ?`, [badgeId]);
    if (!badge) {
        return { success: false, error: 'Badge not found' };
    }
    
    // Check if already awarded
    const existing = await dbGet(`
        SELECT * FROM user_badges WHERE user_id = ? AND badge_id = ?
    `, [userId, badgeId]);
    
    if (existing) {
        return { success: false, error: 'Badge already awarded' };
    }
    
    // Award badge
    await dbRun(`
        INSERT INTO user_badges (user_id, badge_id)
        VALUES (?, ?)
    `, [userId, badgeId]);
    
    // Award XP
    await addXP(userId, badge.xp_reward);
    
    return { success: true, message: 'Badge awarded' };
}

async function getUserBadges(userId) {
    
    
    
    const badges = await dbAll(`
        SELECT b.*, ub.earned_at
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = ?
        ORDER BY ub.earned_at DESC
    `, [userId]);
    
    return badges;
}

async function addXP(userId, xp) {
    
    
    
    // Check if user has XP record
    let userXP = await dbGet(`SELECT * FROM user_xp WHERE user_id = ?`, [userId]);
    
    if (!userXP) {
        // Create new record
        await dbRun(`
            INSERT INTO user_xp (user_id, total_xp, level)
            VALUES (?, ?, ?)
        `, [userId, xp, Math.floor(xp / 100) + 1]);
    } else {
        // Update existing record
        const newTotalXP = userXP.total_xp + xp;
        const newLevel = Math.floor(newTotalXP / 100) + 1;
        
        await dbRun(`
            UPDATE user_xp 
            SET total_xp = ?, level = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `, [newTotalXP, newLevel, userId]);
    }
    
    return { success: true };
}

async function getUserLevel(userId) {
    
    
    
    let userXP = await dbGet(`SELECT * FROM user_xp WHERE user_id = ?`, [userId]);
    
    if (!userXP) {
        return { level: 1, total_xp: 0, xp_to_next_level: 100 };
    }
    
    const xpToNextLevel = (userXP.level * 100) - userXP.total_xp;
    
    return {
        level: userXP.level,
        total_xp: userXP.total_xp,
        xp_to_next_level: Math.max(0, xpToNextLevel)
    };
}

// ============================================================
// PHASE 2: EVENTS
// ============================================================

async function createEvent(userId, groupId, title, description, location, eventDate, endDate, isOnline = false, maxAttendees = null) {
    
    
    
    // Check if user is member of the group
    if (groupId) {
        const member = await dbGet(`
            SELECT * FROM group_members WHERE group_id = ? AND user_id = ?
        `, [groupId, userId]);
        
        if (!member) {
            return { success: false, error: 'You are not a member of this group' };
        }
    }
    
    const result = await dbRun(`
        INSERT INTO events (group_id, title, description, location, event_date, end_date, created_by, is_online, max_attendees)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [groupId, title, description, location, eventDate, endDate, userId, isOnline ? 1 : 0, maxAttendees]);
    
    const eventId = result.lastID;
    
    // Auto-join creator
    await dbRun(`
        INSERT INTO event_attendees (event_id, user_id, status)
        VALUES (?, ?, 'going')
    `, [eventId, userId]);
    
    const event = await dbGet(`
        SELECT e.*, NULL as email, NULL as organizer_name
        FROM events e
        WHERE e.id = ?
    `, [eventId]);
    
    return { success: true, event };
}

async function joinEvent(userId, eventId, status = 'going') {
    
    
    
    // Check if event exists
    const event = await dbGet(`SELECT * FROM events WHERE id = ?`, [eventId]);
    if (!event) {
        return { success: false, error: 'Event not found' };
    }
    
    // Check if already joined
    const existing = await dbGet(`
        SELECT * FROM event_attendees WHERE event_id = ? AND user_id = ?
    `, [eventId, userId]);
    
    if (existing) {
        // Update status
        await dbRun(`
            UPDATE event_attendees 
            SET status = ?
            WHERE event_id = ? AND user_id = ?
        `, [status, eventId, userId]);
    } else {
        // Check capacity
        if (event.max_attendees) {
            const count = await dbGet(`
                SELECT COUNT(*) as count FROM event_attendees WHERE event_id = ? AND status = 'going'
            `, [eventId]);
            
            if (count.count >= event.max_attendees && status === 'going') {
                return { success: false, error: 'Event is full' };
            }
        }
        
        // Join event
        await dbRun(`
            INSERT INTO event_attendees (event_id, user_id, status)
            VALUES (?, ?, ?)
        `, [eventId, userId, status]);
    }
    
    return { success: true, message: `RSVP updated to ${status}` };
}

// ============================================================
// PHASE 2: PARTNER SUGGESTIONS
// ============================================================

async function generatePartnerSuggestions(userId) {
    const { getUserDb } = require('../database');
    
    
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