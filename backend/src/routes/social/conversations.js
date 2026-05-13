'use strict';
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../auth');
const social = require('../../services/social.service');
const { dbAllMain } = require('../../database');
const { logger } = require('../../utils/logger');

const dbAll = (q, p) => dbAllMain(q, p);

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

module.exports = router;
