const { dbGetMain, dbRunMain, dbAllMain, getUserDb, dbAllUser } = require('../../database');
const dbGet = (q, p) => dbGetMain(q, p);
const dbRun = (q, p) => dbRunMain(q, p);
const dbAll = (q, p) => dbAllMain(q, p);
const { notificationService: _notificationService } = require('./notifications.service');

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
                  AND (a.share_to_groups IS NULL OR a.share_to_groups = '[]' OR a.share_to_groups LIKE ?)
                ORDER BY a.start_date DESC
            `, [member.user_id, `%${groupId}%`]);

            // Filter activities based on share_to_groups
            for (const act of activities) {
                let shouldInclude = false;
                if (!act.share_to_groups) {
                    shouldInclude = false; // null = not shared with any group
                } else if (act.share_to_groups === '[]') {
                    shouldInclude = true; // [] = shared with all groups
                } else {
                    try {
                        const sharedGroups = JSON.parse(act.share_to_groups);
                        shouldInclude = sharedGroups.includes(groupId);
                    } catch (_) {
                        shouldInclude = false;
                    }
                }

                if (shouldInclude) {
                    // Parse shared_data_fields to filter exposed fields
                    let allowedFields = ['distance', 'time', 'pace', 'elevation', 'map'];
                    try {
                        if (act.shared_data_fields) {
                            allowedFields = JSON.parse(act.shared_data_fields);
                        }
                    } catch (_) { /* swallow */ }

                    // Filter activity data
                    allActivities.push({
                        id: act.id,
                        name: act.name,
                        type: act.type,
                        start_date: act.start_date,
                        owner_name: act.owner_name,
                        distance: allowedFields.includes('distance') ? act.distance : null,
                        moving_time: allowedFields.includes('time') ? act.moving_time : null,
                        average_speed: allowedFields.includes('pace') ? act.average_speed : null,
                        total_elevation_gain: allowedFields.includes('elevation') ? act.total_elevation_gain : null,
                        map_summary_polyline: allowedFields.includes('map') ? act.map_summary_polyline : null,
                        average_heartrate: allowedFields.includes('hr') ? act.average_heartrate : null,
                        max_heartrate: allowedFields.includes('hr') ? act.max_heartrate : null,
                    });
                }
            }
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

module.exports = {
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
    generateInviteCode,
    createEvent,
    joinEvent
};
