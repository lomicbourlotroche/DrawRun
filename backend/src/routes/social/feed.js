'use strict';
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../auth');
const social = require('../../services/social.service');
const { dbAllMain, dbGetMain, getUserDbByEmail } = require('../../database');
const { logger } = require('../../utils/logger');

const dbAll = (q, p) => dbAllMain(q, p);
const dbGet = (q, p) => dbGetMain(q, p);

// GET /api/social/groups/:id/challenges — list group challenges
router.get('/groups/:id/challenges', verifyToken, async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        if (!groupId || groupId <= 0) return res.status(400).json({ error: 'Invalid group ID' });
        const challenges = await social.getGroupChallenges(groupId);
        res.json(challenges || []);
    } catch (error) {
        logger.error('Get group challenges error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get group challenges' });
    }
});

// POST /api/social/groups/:id/challenges — create a group challenge
router.post('/groups/:id/challenges', verifyToken, async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        if (!groupId || groupId <= 0) return res.status(400).json({ error: 'Invalid group ID' });

        const {
            title, description, type = 'distance', target_value, end_date,
            challenge_mode = 'quota', milestones, weekly_target, weekly_increase_pct = 10,
            streak_days, frequency_per_week, sport_type = 'any', badge_icon = '🏆',
            max_participants = null,
        } = req.body;

        if (!title) return res.status(400).json({ error: 'title is required' });

        let durationDays = 30;
        if (end_date) {
            const diff = new Date(end_date) - new Date();
            durationDays = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        }

         const unitMap = { distance: 'km', elevation: 'm', time: 'min', activities: 'sorties', pace: 'min/km', frequency: 'séances/sem' };
         // eslint-disable-next-line security/detect-object-injection
         const targetUnit = unitMap[type] || 'km';

         const result = await social.createChallenge(
             req.user.id, title, description || '', type,
             parseFloat(target_value) || 0, targetUnit, durationDays,
             false, // group challenges are not globally public
             max_participants,
             {
                 challengeMode: challenge_mode,
                 milestones: milestones || null,
                 weeklyTarget: weekly_target || null,
                 weeklyIncreasePct: weekly_increase_pct,
                 streakDays: streak_days || null,
                 frequencyPerWeek: frequency_per_week || null,
                 sportType: sport_type,
                 badgeIcon: badge_icon,
                 groupId,
             }
         );
        res.status(201).json(result);
    } catch (error) {
        logger.error('Create group challenge error:', { error: error.message });
        res.status(500).json({ error: 'Failed to create group challenge' });
    }
});

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
        const { dbAllUser } = require('../../database');
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
                    } catch (_) { /* swallow */ }

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

module.exports = router;
