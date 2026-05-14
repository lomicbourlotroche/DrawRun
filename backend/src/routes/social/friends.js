'use strict';
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../auth');
const social = require('../../services/social.service');
const { logger } = require('../../utils/logger');
const { sendPushNotification } = require('../../services/notifications/push.service');

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

// ============================================================
// Partner Suggestions (Phase 2)
// ============================================================

router.post('/partners/suggest', verifyToken, async (req, res) => {
    try {
        try {
            const result = await social.generatePartnerSuggestions(req.user.id);
            res.json(result);
        } catch (_) {
            res.json({ success: true, suggestions: [] });
        }
    } catch (error) {
        logger.error('Generate partner suggestions error:', { error: error.message });
        res.status(500).json({ error: 'Failed to generate suggestions' });
    }
});

router.get('/partners', verifyToken, async (req, res) => {
    try {
        try {
            const suggestions = await social.getPartnerSuggestions(req.user.id);
            res.json(suggestions);
        } catch (_) {
            res.json([]);
        }
    } catch (error) {
        logger.error('Get partner suggestions error:', { error: error.message });
        res.status(500).json({ error: 'Failed to get suggestions' });
    }
});

module.exports = router;
