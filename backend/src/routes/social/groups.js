'use strict';
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../auth');
const social = require('../../services/social.service');
const { logger } = require('../../utils/logger');

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

module.exports = router;
