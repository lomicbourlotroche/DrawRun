'use strict';

const { dbRunMain, dbAllMain } = require('../../database');
const dbRun = (q, p) => dbRunMain(q, p);
const dbAll = (q, p) => dbAllMain(q, p);

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

module.exports = {
    createConversation,
    getUserConversations,
    getConversationMessages,
    sendMessage,
    getConversationParticipants,
    createGroupConversation,
};
