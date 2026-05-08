/* eslint-disable unused-imports/no-unused-vars */
/**
 * ============================================================
 * SOCIAL ROUTES (Express)
 * ============================================================
 * Routes API pour les fonctionnalités sociales
 *
 * Note: Les fonctions métier sont dans services/social.service.js
 */

'use strict';

const express = require('express');
const { verifyToken } = require('../auth');
const social = require('../services/social.service');
const draws = require('../services/draws.service');
const { dbRunMain, dbAllMain, dbGetMain, getUserDbByEmail } = require('../database');
const { logger } = require('../logger');
const { sendPushNotification } = require('../services/push.service');

const router = express.Router();

const dbRun = (q, p) => dbRunMain(q, p);
const dbAll = (q, p) => dbAllMain(q, p);
const dbGet = (q, p) => dbGetMain(q, p);

// ============================================================================
// FRIENDS
// ============================================================================

router.post('/friends/request', verifyToken, async (req, res) => {
    try {
        const { friendId } = req.body;
        const result = await social.sendFriendRequest(req.user.id, friendId);
        
        // Send push notification to target user
        const userName = req.user.name || 'Quelqu\'un';
        sendPushNotification(
            friendId,
            'Nouvelle demande d\'ami',
            `${userName} vous a envoyé une demande d'ami`,
            { type: 'friend_request', fromUserId: req.user.id }
        );
        
        res.json(result);
    } catch (error) {
        logger.error('Send friend request error:', { error: error.message });
        res.status(500).json({ error: 'Failed to send friend request' });
    }
});

router.get('/friends/pending', verifyToken, async (req, res) => {
    try {
        const requests = await social.getPendingRequests(req.user.id);
        res.json(requests || []);
    } catch (error) {
        logger.error('Get pending requests error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get pending requests' });
    }
});

router.post('/friends/accept', verifyToken, async (req, res) => {
    try {
        const { friendId } = req.body;
        if (!friendId) {
            return res.status(400).json({ error: 'friendId is required' });
        }
        const result = await social.acceptFriendRequest(req.user.id, friendId);
        res.json(result);
    } catch (error) {
        logger.error('Accept friend request error:', { error: error.message });
        res.status(500).json({ error: 'Failed to accept friend request' });
    }
});

router.post('/friends/reject', verifyToken, async (req, res) => {
    try {
        const { friendId } = req.body;
        if (!friendId) {
            return res.status(400).json({ error: 'friendId is required' });
        }
        const result = await social.rejectFriendRequest(req.user.id, friendId);
        res.json(result);
    } catch (error) {
        logger.error('Reject friend request error:', { error: error.message });
        res.status(500).json({ error: 'Failed to reject friend request' });
    }
});

router.get('/friends', verifyToken, async (req, res) => {
    try {
        const friends = await social.getFriends(req.user.id);
        res.json(friends);
    } catch (error) {
        logger.error('Get friends error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get friends' });
    }
});

router.delete('/friends/:id', verifyToken, async (req, res) => {
    try {
        const friendId = parseInt(req.params.id);
        if (!friendId || friendId <= 0) {
            return res.status(400).json({ error: 'Invalid friend ID' });
        }
        const result = await social.removeFriend(req.user.id, friendId);
        res.json(result);
    } catch (error) {
        logger.error('Remove friend error:', { error: error.message });
        res.status(500).json({ error: 'Failed to remove friend' });
    }
});

// ============================================================================
// GROUPS
// ============================================================================
// GROUPS - Complete CRUD + Management
// ============================================================================

// Create group
router.post('/groups', verifyToken, async (req, res) => {
    try {
        const { name, description, isPrivate } = req.body;
        const result = await social.createGroup(req.user.id, name, description, isPrivate !== false);
        res.json(result);
    } catch (error) {
        logger.error('Create group error:', { error: error.message });
        res.status(500).json({ error: 'Failed to create group' });
    }
});

// Get user's groups
router.get('/groups', verifyToken, async (req, res) => {
    try {
        const groups = await social.getGroups(req.user.id);
        res.json(groups);
    } catch (error) {
        logger.error('Get groups error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get groups' });
    }
});

// Get public/discoverable groups
router.get('/groups/public', verifyToken, async (req, res) => {
    try {
        const { search } = req.query;
        const groups = await social.getPublicGroups(search);
        res.json(groups);
    } catch (error) {
        logger.error('Get public groups error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get public groups' });
    }
});

// Join group by invite code
router.post('/groups/join', verifyToken, async (req, res) => {
    try {
        const { inviteCode } = req.body;
        if (!inviteCode) {
            return res.status(400).json({ error: 'inviteCode is required' });
        }
        const result = await social.joinGroup(req.user.id, inviteCode);
        res.json(result);
    } catch (error) {
        logger.error('Join group error:', { error: error.message });
        res.status(500).json({ error: 'Failed to join group' });
    }
});

// Get group detail
router.get('/groups/:id', verifyToken, async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        if (!groupId || groupId <= 0) {
            return res.status(400).json({ error: 'Invalid group ID' });
        }
        const result = await social.getGroupDetail(groupId, req.user.id);
        if (!result.success) {
            return res.status(404).json({ error: result.error });
        }
        res.json(result.group);
    } catch (error) {
        logger.error('Get group detail error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get group detail' });
    }
});

// Edit group (admin only)
router.put('/groups/:id', verifyToken, async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        if (!groupId || groupId <= 0) {
            return res.status(400).json({ error: 'Invalid group ID' });
        }
        const result = await social.editGroup(req.user.id, groupId, req.body);
        res.json(result);
    } catch (error) {
        logger.error('Edit group error:', { error: error.message });
        res.status(500).json({ error: 'Failed to edit group' });
    }
});

// Delete group (admin only)
router.delete('/groups/:id', verifyToken, async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        if (!groupId || groupId <= 0) {
            return res.status(400).json({ error: 'Invalid group ID' });
        }
        const result = await social.deleteGroup(req.user.id, groupId);
        res.json(result);
    } catch (error) {
        logger.error('Delete group error:', { error: error.message });
        res.status(500).json({ error: 'Failed to delete group' });
    }
});

// Leave group
router.post('/groups/:id/leave', verifyToken, async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        if (!groupId || groupId <= 0) {
            return res.status(400).json({ error: 'Invalid group ID' });
        }
        const result = await social.leaveGroup(req.user.id, groupId);
        res.json(result);
    } catch (error) {
        logger.error('Leave group error:', { error: error.message });
        res.status(500).json({ error: 'Failed to leave group' });
    }
});

// Get group members
router.get('/groups/:id/members', verifyToken, async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        if (!groupId || groupId <= 0) {
            return res.status(400).json({ error: 'Invalid group ID' });
        }
        const members = await social.getGroupMembers(groupId);
        res.json(members);
    } catch (error) {
        logger.error('Get group members error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get group members' });
    }
});

// Kick member (admin only)
router.post('/groups/:id/kick', verifyToken, async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        const { userId: targetUserId } = req.body;
        if (!groupId || !targetUserId) {
            return res.status(400).json({ error: 'groupId and userId are required' });
        }
        const result = await social.kickMember(req.user.id, groupId, targetUserId);
        res.json(result);
    } catch (error) {
        logger.error('Kick member error:', { error: error.message });
        res.status(500).json({ error: 'Failed to kick member' });
    }
});

// Promote/demote member (admin only)
router.post('/groups/:id/promote', verifyToken, async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        const { userId: targetUserId, role } = req.body;
        if (!groupId || !targetUserId || !role) {
            return res.status(400).json({ error: 'groupId, userId, and role are required' });
        }
        const result = await social.promoteMember(req.user.id, groupId, targetUserId, role);
        res.json(result);
    } catch (error) {
        logger.error('Promote member error:', { error: error.message });
        res.status(500).json({ error: 'Failed to promote member' });
    }
});

// Get group activities feed
router.get('/groups/:id/activities', verifyToken, async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        if (!groupId || groupId <= 0) {
            return res.status(400).json({ error: 'Invalid group ID' });
        }
        const { limit = 20, offset = 0 } = req.query;
        const activities = await social.getGroupActivities(groupId, parseInt(limit), parseInt(offset));
        res.json(activities);
    } catch (error) {
        logger.error('Get group activities error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get group activities' });
    }
});

// Get group events
router.get('/groups/:id/events', verifyToken, async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        if (!groupId || groupId <= 0) {
            return res.status(400).json({ error: 'Invalid group ID' });
        }
        const events = await social.getGroupEvents(groupId);
        res.json(events);
    } catch (error) {
        logger.error('Get group events error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get group events' });
    }
});

// Create group event
router.post('/groups/:id/events', verifyToken, async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        if (!groupId || groupId <= 0) {
            return res.status(400).json({ error: 'Invalid group ID' });
        }
        const { title, description, location, eventDate, endDate, isOnline, maxAttendees } = req.body;
        if (!title || !eventDate) {
            return res.status(400).json({ error: 'title and eventDate are required' });
        }
        const result = await social.createEvent(req.user.id, groupId, title, description, location, eventDate, endDate, isOnline, maxAttendees);
        res.json(result);
    } catch (error) {
        logger.error('Create event error:', { error: error.message });
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// Join event
router.post('/events/:id/join', verifyToken, async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        if (!eventId || eventId <= 0) {
            return res.status(400).json({ error: 'Invalid event ID' });
        }
        const result = await social.joinEvent(req.user.id, eventId);
        res.json(result);
    } catch (error) {
        logger.error('Join event error:', { error: error.message });
        res.status(500).json({ error: 'Failed to join event' });
    }
});

// Create group conversation
router.post('/groups/:id/conversation', verifyToken, async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        if (!groupId || groupId <= 0) {
            return res.status(400).json({ error: 'Invalid group ID' });
        }
        const { title } = req.body;
        const result = await social.createGroupConversation(req.user.id, groupId, title);
        res.json(result);
    } catch (error) {
        logger.error('Create group conversation error:', { error: error.message });
        res.status(500).json({ error: 'Failed to create group conversation' });
    }
});

// ============================================================================
// LEADERBOARD
// ============================================================================

router.get('/leaderboard', verifyToken, async (req, res) => {
    try {
        const { category = 'distance', period = 'week', groupId } = req.query;
        const leaderboard = await social.getLeaderboard(groupId ? parseInt(groupId) : null, category, period);
        res.json(leaderboard);
    } catch (error) {
        logger.error('Get leaderboard error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get leaderboard' });
    }
});

// ============================================================================
// ACTIVITY LIKES
// ============================================================================

router.post('/activities/:activityId/like', verifyToken, async (req, res) => {
    try {
        const activityId = parseInt(req.params.activityId);
        if (!activityId || activityId <= 0) {
            return res.status(400).json({ error: 'Invalid activity ID' });
        }
        const result = await social.likeActivity(req.user.id, activityId);
        res.json(result);
    } catch (error) {
        logger.error('Like activity error:', { error: error.message });
        res.status(500).json({ error: 'Failed to like activity' });
    }
});

router.delete('/activities/:activityId/like', verifyToken, async (req, res) => {
    try {
        const activityId = parseInt(req.params.activityId);
        if (!activityId || activityId <= 0) {
            return res.status(400).json({ error: 'Invalid activity ID' });
        }
        const result = await social.unlikeActivity(req.user.id, activityId);
        res.json(result);
    } catch (error) {
        logger.error('Unlike activity error:', { error: error.message });
        res.status(500).json({ error: 'Failed to unlike activity' });
    }
});

router.get('/liked-activities', verifyToken, async (req, res) => {
    try {
        const activities = await social.getUserLikedActivities(req.user.id);
        res.json(activities);
    } catch (error) {
        logger.error('Get liked activities error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get liked activities' });
    }
});

// ============================================================================
// SOCIAL FEED
// ============================================================================

/**
 * @swagger
 * /social/feed:
 *   get:
 *     summary: Get social feed
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 */
router.get('/feed', verifyToken, async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;

        // Get friends list from main.db
        const friends = await dbAll(`
            SELECT friend_id FROM friends
            WHERE user_id = ? AND status = 'accepted'
            UNION
            SELECT user_id as friend_id FROM friends
            WHERE friend_id = ? AND status = 'accepted'
        `, [req.user.id, req.user.id]);

        const friendIds = friends.map(f => f.friend_id);
        friendIds.push(req.user.id);

        if (friendIds.length === 0) {
            return res.json([]);
        }

        // Activities are in per-user DBs, users table is in main.db.
        // We cannot cross-Join SQLite files. Fetch each user's activities separately.
        const { getUserDb, dbAllUser, dbGetUser } = require('../database');
        const allActivities = [];

        for (const friendId of friendIds) {
            try {
                const friendUser = await dbGet('SELECT email FROM users WHERE id = ?', [friendId]);
                if (!friendUser || !friendUser.email) continue;

                const friendDb = await getUserDbByEmail(friendUser.email);
                const activities = await dbAllUser(friendDb, `
                    SELECT id, name, type, start_date, distance, moving_time,
                           total_elevation_gain, average_speed, average_heartrate, max_heartrate,
                           map_summary_polyline, source, share_to_friends, shared_data_fields
                    FROM activities
                    WHERE share_to_friends = 1
                    ORDER BY start_date DESC
                    LIMIT 50
                `, []);

                for (const act of activities) {
                    // Parse shared_data_fields to filter exposed fields
                    let allowedFields = ['distance', 'time', 'pace', 'elevation', 'map'];
                    try {
                        if (act.shared_data_fields) {
                            allowedFields = JSON.parse(act.shared_data_fields);
                        }
                    } catch (_) {}

                    // Filter activity data based on sharing preferences
                    const filteredAct = {
                        id: act.id,
                        name: act.name,
                        type: act.type,
                        start_date: act.start_date,
                        owner_name: friendUser.name || friendUser.email.split('@')[0],
                        like_count: 0,
                        comment_count: 0,
                        photo_count: 0,
                        // Only include fields that are explicitly allowed
                        distance: allowedFields.includes('distance') ? act.distance : null,
                        moving_time: allowedFields.includes('time') ? act.moving_time : null,
                        average_speed: allowedFields.includes('pace') ? act.average_speed : null,
                        total_elevation_gain: allowedFields.includes('elevation') ? act.total_elevation_gain : null,
                        map_summary_polyline: allowedFields.includes('map') ? act.map_summary_polyline : null,
                        average_heartrate: allowedFields.includes('hr') ? act.average_heartrate : null,
                        max_heartrate: allowedFields.includes('hr') ? act.max_heartrate : null,
                    };
                    allActivities.push(filteredAct);
                }
            } catch (err) {
                logger.warn(`Feed: could not load activities for user ${friendId}: ${err.message}`);
            }
        }

        // Sort by date and paginate
        allActivities.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
        const paginated = allActivities.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

        res.json(paginated);
    } catch (error) {
        logger.error('Get feed error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get feed' });
    }
});

// ============================================================================
// ACTIVITY DRAWS (DrawRun Kudos System)
// ============================================================================

/**
 * @swagger
 * /social/activities/{activityId}/draw:
 *   post:
 *     summary: Toggle draw on an activity
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ownerId]
 *             properties:
 *               ownerId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Draw toggled successfully
 */
router.post('/activities/:activityId/draw', verifyToken, async (req, res) => {
    try {
        const activityId = parseInt(req.params.activityId);
        const { ownerId } = req.body;
        
        if (!activityId || activityId <= 0) {
            return res.status(400).json({ error: 'Invalid activity ID' });
        }
        
        if (!ownerId || ownerId <= 0) {
            return res.status(400).json({ error: 'Invalid owner ID' });
        }
        
        const result = await draws.toggleDraw(req.user.id, activityId, ownerId);
        
        // Send push notification to activity owner if draw was added (not removed)
        if (result && result.drawed) {
            const userName = req.user.name || 'Quelqu\'un';
            sendPushNotification(
                ownerId,
                'Nouveau draw !',
                `${userName} a drawé votre activité`,
                { type: 'draw', activityId: activityId }
            );
        }
        
        res.json(result);
    } catch (error) {
        logger.error('Toggle draw error:', { error: error.message });
        res.status(500).json({ error: 'Failed to toggle draw' });
    }
});

/**
 * @swagger
 * /social/activities/{activityId}/draws:
 *   get:
 *     summary: Get all draws for an activity
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of draws
 */
router.get('/activities/:activityId/draws', verifyToken, async (req, res) => {
    try {
        const activityId = parseInt(req.params.activityId);
        
        if (!activityId || activityId <= 0) {
            return res.status(400).json({ error: 'Invalid activity ID' });
        }
        
        const drawsList = await draws.getActivityDraws(activityId);
        const drawCount = await draws.getActivityDrawCount(activityId);
        const hasDrawn = await draws.hasUserDrawn(req.user.id, activityId);
        
        res.json({
            success: true,
            draws: drawsList,
            draw_count: drawCount,
            has_drawn: hasDrawn
        });
    } catch (error) {
        logger.error('Get draws error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get draws' });
    }
});

/**
 * @swagger
 * /social/activities/{activityId}/draws/stats:
 *   get:
 *     summary: Get draw stats for an activity
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Draw stats
 */
router.get('/activities/:activityId/draws/stats', verifyToken, async (req, res) => {
    try {
        const activityId = parseInt(req.params.activityId);
        
        if (!activityId || activityId <= 0) {
            return res.status(400).json({ error: 'Invalid activity ID' });
        }
        
        const stats = await draws.getActivityDrawStats(activityId);
        const hasDrawn = await draws.hasUserDrawn(req.user.id, activityId);
        
        res.json({
            success: true,
            ...stats,
            has_drawn: hasDrawn
        });
    } catch (error) {
        logger.error('Get draw stats error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get draw stats' });
    }
});

/**
 * @swagger
 * /social/activities/{activityId}/draws/me:
 *   get:
 *     summary: Check if current user has drawn an activity
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: activityId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Draw status
 */
router.get('/activities/:activityId/draws/me', verifyToken, async (req, res) => {
    try {
        const activityId = parseInt(req.params.activityId);
        
        if (!activityId || activityId <= 0) {
            return res.status(400).json({ error: 'Invalid activity ID' });
        }
        
        const hasDrawn = await draws.hasUserDrawn(req.user.id, activityId);
        
        res.json({
            success: true,
            has_drawn: hasDrawn
        });
    } catch (error) {
        logger.error('Check draw error:', { error: error.message });
        res.status(500).json({ error: 'Failed to check draw status' });
    }
});

/**
 * @swagger
 * /social/user/draws:
 *   get:
 *     summary: Get activities drawn by current user
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of drawn activities
 */
router.get('/user/draws', verifyToken, async (req, res) => {
    try {
        const activities = await draws.getUserDrawnActivities(req.user.id);
        res.json({
            success: true,
            activities
        });
    } catch (error) {
        logger.error('Get user draws error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get user draws' });
    }
});

// ============================================================================
// ACTIVITY PHOTOS
// ============================================================================

/**
 * @swagger
 * /social/activities/{activityId}/photos:
 *   post:
 *     summary: Add a photo to an activity
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 */
router.post('/activities/:activityId/photos', verifyToken, async (req, res) => {
    try {
        const activityId = parseInt(req.params.activityId);
        const { url, caption, lat, lng } = req.body;
        
        const result = await dbRun(`
            INSERT INTO activity_photos (activity_id, user_id, url, caption, lat, lng)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [activityId, req.user.id, url, caption, lat, lng]);
        
        res.status(201).json({
            success: true,
            photo_id: result.lastID,
            message: 'Photo added successfully'
        });
    } catch (error) {
        logger.error('Add photo error:', error);
        res.status(500).json({ error: 'Failed to add photo' });
    }
});

/**
 * @swagger
 * /social/activities/{activityId}/photos:
 *   get:
 *     summary: Get all photos for an activity
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 */
router.get('/activities/:activityId/photos', verifyToken, async (req, res) => {
    try {
        const activityId = parseInt(req.params.activityId);
        
        const photos = await dbAll(`
            SELECT ap.*, json_extract(u.profile_data, '$.name') as user_name
            FROM activity_photos ap
            LEFT JOIN users u ON ap.user_id = u.id
            WHERE ap.activity_id = ?
            ORDER BY ap.created_at DESC
        `, [activityId]);
        
        res.json({
            success: true,
            photos: photos.map(p => ({
                ...p,
                user_name: p.user_name || 'Anonymous'
            }))
        });
    } catch (error) {
        logger.error('Get photos error:', error);
        res.status(500).json({ error: 'Failed to get photos' });
    }
});

/**
 * @swagger
 * /social/photos/{photoId}:
 *   delete:
 *     summary: Delete a photo
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/photos/:photoId', verifyToken, async (req, res) => {
    try {
        const photoId = parseInt(req.params.photoId);
        
        await dbRun(`
            DELETE FROM activity_photos WHERE id = ? AND user_id = ?
        `, [photoId, req.user.id]);
        
        res.json({ success: true, message: 'Photo deleted' });
    } catch (error) {
        logger.error('Delete photo error:', error);
        res.status(500).json({ error: 'Failed to delete photo' });
    }
});

// ============================================================================
// SOCIAL FEED (duplicate removed — real implementation is above)
// ============================================================================

// ============================================================================
// USERS
// ============================================================================

router.get('/users/search', verifyToken, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length === 0) {
            return res.status(400).json({ error: 'Query parameter q is required' });
        }
        const searchTerm = `%${q.trim()}%`;
        const users = await dbAll(`
            SELECT id, email, json_extract(profile_data, '$.name') as name
            FROM users
            WHERE (email LIKE ? OR json_extract(profile_data, '$.name') LIKE ?)
              AND id != ?
            LIMIT 20
        `, [searchTerm, searchTerm, req.user.id]);
        res.json(users || []);
    } catch (error) {
        logger.error('Search users error:', { error: error.message });
        res.status(500).json({ error: 'Failed to search users' });
    }
});

router.get('/profile/:id', verifyToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (!userId || userId <= 0) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        const user = await dbGet(`
            SELECT id, email, json_extract(profile_data, '$.name') as name
            FROM users WHERE id = ?
        `, [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        logger.error('Get public profile error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// ============================================================================
// COMMENTS
// ============================================================================

router.post('/activities/:activityId/comments', verifyToken, async (req, res) => {
    try {
        const activityId = parseInt(req.params.activityId);
        const { content } = req.body;
        if (!activityId || activityId <= 0) {
            return res.status(400).json({ error: 'Invalid activity ID' });
        }
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'content is required' });
        }
        try {
            // Get activity owner first
            const activity = await dbGet(
                'SELECT user_id FROM activities WHERE id = ?',
                [activityId]
            );
            const activityOwnerId = activity ? activity.user_id : req.user.id;
            
            const result = await dbRun(`
                INSERT INTO activity_comments (activity_id, activity_owner_id, user_id, content)
                VALUES (?, ?, ?, ?)
            `, [activityId, activityOwnerId, req.user.id, content.trim()]);
            
            // Send push notification to activity owner (if not the commenter)
            if (activityOwnerId !== req.user.id) {
                const userName = req.user.name || 'Quelqu\'un';
                sendPushNotification(
                    activityOwnerId,
                    'Nouveau commentaire',
                    `${userName} a commenté votre activité`,
                    { type: 'comment', activityId: activityId }
                );
            }
            
            res.status(201).json({
                success: true,
                comment: {
                    id: result.lastID,
                    activity_id: activityId,
                    user_id: req.user.id,
                    content: content.trim(),
                    created_at: new Date().toISOString()
                }
            });
        } catch (_) {
            res.status(500).json({ error: 'Failed to add comment' });
        }
    } catch (error) {
        logger.error('Add comment error:', { error: error.message });
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

router.get('/activities/:activityId/comments', verifyToken, async (req, res) => {
    try {
        const activityId = parseInt(req.params.activityId);
        if (!activityId || activityId <= 0) {
            return res.status(400).json({ error: 'Invalid activity ID' });
        }
        try {
            const comments = await dbAll(`
                SELECT ac.id, ac.activity_id, ac.user_id, ac.content, ac.created_at,
                       json_extract(u.profile_data, '$.name') as user_name
                FROM activity_comments ac
                LEFT JOIN users u ON ac.user_id = u.id
                WHERE ac.activity_id = ?
                ORDER BY ac.created_at ASC
            `, [activityId]);
            res.json(comments);
        } catch (_) {
            res.json([]);
        }
    } catch (error) {
        logger.error('Get comments error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get comments' });
    }
});

router.delete('/comments/:commentId', verifyToken, async (req, res) => {
    try {
        const commentId = parseInt(req.params.commentId);
        if (!commentId || commentId <= 0) {
            return res.status(400).json({ error: 'Invalid comment ID' });
        }
        try {
            await dbRun(`
                DELETE FROM activity_comments WHERE id = ? AND user_id = ?
            `, [commentId, req.user.id]);
            res.json({ success: true, message: 'Comment deleted' });
        } catch (_) {
            res.json({ success: true, message: 'Comment deleted' });
        }
    } catch (error) {
        logger.error('Delete comment error:', { error: error.message });
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});

// ============================================================================
// REACTIONS
// ============================================================================

router.post('/activities/:activityId/reactions', verifyToken, async (req, res) => {
    try {
        const activityId = parseInt(req.params.activityId);
        const { reaction_type } = req.body;
        if (!activityId || activityId <= 0) {
            return res.status(400).json({ error: 'Invalid activity ID' });
        }
        if (!reaction_type) {
            return res.status(400).json({ error: 'reaction_type is required' });
        }
        try {
            const existing = await dbGet(`
                SELECT id FROM activity_reactions
                WHERE activity_id = ? AND user_id = ? AND reaction_type = ?
            `, [activityId, req.user.id, reaction_type]);
            if (existing) {
                return res.status(409).json({ success: false, error: 'Already reacted' });
            }
            const result = await dbRun(`
                INSERT INTO activity_reactions (activity_id, user_id, reaction_type)
                VALUES (?, ?, ?)
            `, [activityId, req.user.id, reaction_type]);
            res.status(201).json({
                success: true,
                reaction: { id: result.lastID, activity_id: activityId, user_id: req.user.id, reaction_type }
            });
        } catch (_) {
            res.status(500).json({ error: 'Failed to add reaction' });
        }
    } catch (error) {
        logger.error('Add reaction error:', { error: error.message });
        res.status(500).json({ error: 'Failed to add reaction' });
    }
});

router.delete('/activities/:activityId/reactions', verifyToken, async (req, res) => {
    try {
        const activityId = parseInt(req.params.activityId);
        const { reaction_type } = req.body;
        if (!activityId || activityId <= 0) {
            return res.status(400).json({ error: 'Invalid activity ID' });
        }
        try {
            await dbRun(`
                DELETE FROM activity_reactions
                WHERE activity_id = ? AND user_id = ? AND reaction_type = ?
            `, [activityId, req.user.id, reaction_type]);
            res.json({ success: true });
        } catch (_) {
            res.json({ success: true });
        }
    } catch (error) {
        logger.error('Remove reaction error:', { error: error.message });
        res.status(500).json({ error: 'Failed to remove reaction' });
    }
});

router.get('/activities/:activityId/reactions', verifyToken, async (req, res) => {
    try {
        const activityId = parseInt(req.params.activityId);
        if (!activityId || activityId <= 0) {
            return res.status(400).json({ error: 'Invalid activity ID' });
        }
        try {
            const reactions = await dbAll(`
                SELECT reaction_type, COUNT(*) as count
                FROM activity_reactions
                WHERE activity_id = ?
                GROUP BY reaction_type
            `, [activityId]);
            res.json(reactions);
        } catch (_) {
            res.json([]);
        }
    } catch (error) {
        logger.error('Get reactions error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get reactions' });
    }
});

router.get('/activities/:activityId/reactions/user', verifyToken, async (req, res) => {
    try {
        const activityId = parseInt(req.params.activityId);
        if (!activityId || activityId <= 0) {
            return res.status(400).json({ error: 'Invalid activity ID' });
        }
        try {
            const reactions = await dbAll(`
                SELECT reaction_type FROM activity_reactions
                WHERE activity_id = ? AND user_id = ?
            `, [activityId, req.user.id]);
            res.json(reactions.map(r => r.reaction_type));
        } catch (_) {
            res.json([]);
        }
    } catch (error) {
        logger.error('Get user reactions error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get user reactions' });
    }
});

// ============================================================================
// NOTIFICATIONS
// ============================================================================

router.get('/notifications', verifyToken, async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        try {
            const notifications = await dbAll(`
                SELECT * FROM notifications
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `, [req.user.id, parseInt(limit), parseInt(offset)]);
            const unreadRow = await dbGet(`
                SELECT COUNT(*) as count FROM notifications
                WHERE user_id = ? AND read_at IS NULL
            `, [req.user.id]);
            res.json({
                success: true,
                notifications: notifications.map(n => ({
                    ...n,
                    data: n.data ? (() => { try { return JSON.parse(n.data); } catch (_) { return {}; } })() : {}
                })),
                unread_count: unreadRow ? unreadRow.count : 0
            });
        } catch (_) {
            res.json({ success: true, notifications: [], unread_count: 0 });
        }
    } catch (error) {
        logger.error('Get notifications error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get notifications' });
    }
});

router.put('/notifications/read-all', verifyToken, async (req, res) => {
    try {
        try {
            await dbRun(`
                UPDATE notifications SET read_at = CURRENT_TIMESTAMP
                WHERE user_id = ? AND read_at IS NULL
            `, [req.user.id]);
        } catch (_) { /* table may not exist */ }
        res.json({ success: true });
    } catch (error) {
        logger.error('Mark all notifications read error:', { error: error.message });
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
});

router.put('/notifications/:id/read', verifyToken, async (req, res) => {
    try {
        const notifId = parseInt(req.params.id);
        if (!notifId || notifId <= 0) {
            return res.status(400).json({ error: 'Invalid notification ID' });
        }
        try {
            await dbRun(`
                UPDATE notifications SET read_at = CURRENT_TIMESTAMP
                WHERE id = ? AND user_id = ?
            `, [notifId, req.user.id]);
        } catch (_) { /* table may not exist */ }
        res.json({ success: true });
    } catch (error) {
        logger.error('Mark notification read error:', { error: error.message });
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
});

router.delete('/notifications/:id', verifyToken, async (req, res) => {
    try {
        const notifId = parseInt(req.params.id);
        if (!notifId || notifId <= 0) {
            return res.status(400).json({ error: 'Invalid notification ID' });
        }
        try {
            await dbRun(`
                DELETE FROM notifications WHERE id = ? AND user_id = ?
            `, [notifId, req.user.id]);
        } catch (_) { /* table may not exist */ }
        res.json({ success: true });
    } catch (error) {
        logger.error('Delete notification error:', { error: error.message });
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// ============================================================================
// CHAT (CONVERSATIONS)
// ============================================================================

router.post('/conversations', verifyToken, async (req, res) => {
    try {
        const { otherUserId } = req.body;
        if (!otherUserId) {
            return res.status(400).json({ error: 'otherUserId is required' });
        }
        try {
            const result = await social.createConversation(req.user.id, [parseInt(otherUserId)], 'private');
            res.json(result);
        } catch (_) {
            res.json({ success: true, conversations: [] });
        }
    } catch (error) {
        logger.error('Create conversation error:', { error: error.message });
        res.status(500).json({ error: 'Failed to create conversation' });
    }
});

router.get('/conversations', verifyToken, async (req, res) => {
    try {
        try {
            const conversations = await social.getUserConversations(req.user.id);
            res.json({ success: true, conversations });
        } catch (_) {
            res.json({ success: true, conversations: [] });
        }
    } catch (error) {
        logger.error('Get conversations error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get conversations' });
    }
});

router.get('/conversations/:id/messages', verifyToken, async (req, res) => {
    try {
        const conversationId = parseInt(req.params.id);
        if (!conversationId || conversationId <= 0) {
            return res.status(400).json({ error: 'Invalid conversation ID' });
        }
        const { limit = 50, offset = 0 } = req.query;
        try {
            const messages = await dbAll(`
                SELECT m.*, json_extract(u.profile_data, '$.name') as sender_name
                FROM messages m
                LEFT JOIN users u ON m.sender_id = u.id
                WHERE m.conversation_id = ?
                ORDER BY m.created_at DESC
                LIMIT ? OFFSET ?
            `, [conversationId, parseInt(limit), parseInt(offset)]);
            res.json({ success: true, messages });
        } catch (_) {
            res.json({ success: true, messages: [] });
        }
    } catch (error) {
        logger.error('Get messages error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

router.post('/conversations/:id/messages', verifyToken, async (req, res) => {
    try {
        const conversationId = parseInt(req.params.id);
        if (!conversationId || conversationId <= 0) {
            return res.status(400).json({ error: 'Invalid conversation ID' });
        }
        const { content, message_type = 'text' } = req.body;
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'content is required' });
        }
        try {
            const result = await social.sendMessage(req.user.id, conversationId, content.trim(), message_type);
            res.status(201).json(result);
        } catch (_) {
            res.status(500).json({ error: 'Failed to send message' });
        }
    } catch (error) {
        logger.error('Send message error:', { error: error.message });
        res.status(500).json({ error: 'Failed to send message' });
    }
});

router.get('/conversations/:id/participants', verifyToken, async (req, res) => {
    try {
        const conversationId = parseInt(req.params.id);
        if (!conversationId || conversationId <= 0) {
            return res.status(400).json({ error: 'Invalid conversation ID' });
        }
        try {
            const participants = await social.getConversationParticipants(conversationId);
            res.json({ success: true, participants });
        } catch (_) {
            res.json({ success: true, participants: [] });
        }
    } catch (error) {
        logger.error('Get participants error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get participants' });
    }
});

// ============================================================================
// CHALLENGES
// ============================================================================

router.post('/challenges', verifyToken, async (req, res) => {
    try {
        const { name, description, type, target, end_date } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'name is required' });
        }
        try {
            // Calculate duration in days from end_date if provided
            let durationDays = 30;
            if (end_date) {
                const diff = new Date(end_date) - new Date();
                durationDays = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
            }
            const result = await social.createChallenge(
                req.user.id, name, description || '', type || 'distance',
                target || 0, 'km', durationDays, true, null
            );
            res.status(201).json(result);
        } catch (_) {
            res.status(500).json({ error: 'Failed to create challenge' });
        }
    } catch (error) {
        logger.error('Create challenge error:', { error: error.message });
        res.status(500).json({ error: 'Failed to create challenge' });
    }
});

router.get('/challenges/public', verifyToken, async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        try {
            const challenges = await dbAll(`
                SELECT c.*,
                    (SELECT COUNT(*) FROM user_challenges WHERE challenge_id = c.id) as participant_count
                FROM challenges c
                WHERE c.is_public = 1
                ORDER BY c.created_at DESC
                LIMIT ?
            `, [parseInt(limit)]);
            res.json(challenges);
        } catch (_) {
            res.json([]);
        }
    } catch (error) {
        logger.error('Get public challenges error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get challenges' });
    }
});

router.get('/challenges/user', verifyToken, async (req, res) => {
    try {
        try {
            const challenges = await social.getUserChallenges(req.user.id);
            res.json({ success: true, challenges });
        } catch (_) {
            res.json({ success: true, challenges: [] });
        }
    } catch (error) {
        logger.error('Get user challenges error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get user challenges' });
    }
});

router.post('/challenges/:id/join', verifyToken, async (req, res) => {
    try {
        const challengeId = parseInt(req.params.id);
        if (!challengeId || challengeId <= 0) {
            return res.status(400).json({ error: 'Invalid challenge ID' });
        }
        try {
            const result = await social.joinChallenge(req.user.id, challengeId);
            res.json(result);
        } catch (_) {
            res.status(500).json({ error: 'Failed to join challenge' });
        }
    } catch (error) {
        logger.error('Join challenge error:', { error: error.message });
        res.status(500).json({ error: 'Failed to join challenge' });
    }
});

router.get('/challenges/:id', verifyToken, async (req, res) => {
    try {
        const challengeId = parseInt(req.params.id);
        if (!challengeId || challengeId <= 0) {
            return res.status(400).json({ error: 'Invalid challenge ID' });
        }
        try {
            const challenge = await social.getChallengeDetails(challengeId);
            if (!challenge) {
                return res.status(404).json({ error: 'Challenge not found' });
            }
            res.json({ success: true, challenge });
        } catch (_) {
            res.status(404).json({ error: 'Challenge not found' });
        }
    } catch (error) {
        logger.error('Get challenge error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get challenge' });
    }
});

router.put('/challenges/:id/progress', verifyToken, async (req, res) => {
    try {
        const challengeId = parseInt(req.params.id);
        if (!challengeId || challengeId <= 0) {
            return res.status(400).json({ error: 'Invalid challenge ID' });
        }
        const { progress } = req.body;
        if (progress === undefined || progress === null) {
            return res.status(400).json({ error: 'progress is required' });
        }
        try {
            const result = await social.updateChallengeProgress(req.user.id, challengeId, progress);
            res.json(result);
        } catch (_) {
            res.status(500).json({ error: 'Failed to update progress' });
        }
    } catch (error) {
        logger.error('Update challenge progress error:', { error: error.message });
        res.status(500).json({ error: 'Failed to update challenge progress' });
    }
});

module.exports = router;
