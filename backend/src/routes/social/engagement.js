'use strict';
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../auth');
const social = require('../../services/social.service');
const draws = require('../../services/social/draws.service');
const { dbRunMain, dbAllMain, dbGetMain } = require('../../database');
const { logger } = require('../../utils/logger');
const { sendPushNotification } = require('../../services/notifications/push.service');

const dbRun = (q, p) => dbRunMain(q, p);
const dbAll = (q, p) => dbAllMain(q, p);
const dbGet = (q, p) => dbGetMain(q, p);

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

module.exports = router;
