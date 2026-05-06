/**
 * ============================================================
 * GROUPS SERVICE - Module Groups du Service Social
 * ============================================================
 * 
 * Gestion des groupes d'utilisateurs et des communautés
 * @module social/groups.service
 */

'use strict';

const crypto = require('crypto');
const { dbGetMain, dbRunMain, dbAllMain } = require('../../database');
const { logger } = require('../../logger');

// Aliases locaux pour lisibilité
const dbGet = (q, p) => dbGetMain(q, p);
const dbRun = (q, p) => dbRunMain(q, p);
const dbAll = (q, p) => dbAllMain(q, p);

/**
 * Générer un code d'invitation unique
 * @returns {string} Code d'invitation de 8 caractères
 */
function generateInviteCode() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Créer un nouveau groupe
 * @param {number} userId - ID du créateur
 * @param {string} name - Nom du groupe
 * @param {string} description - Description du groupe
 * @param {boolean} isPrivate - Groupe privé ou public
 * @returns {Promise<{success: boolean, groupId?: number, inviteCode?: string, message?: string, error?: string}>}
 */
async function createGroup(userId, name, description, isPrivate = true) {
    const inviteCode = isPrivate ? generateInviteCode() : null;

    try {
        const result = await dbRun(`
            INSERT INTO groups (name, description, is_private, invite_code, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [name, description, isPrivate, inviteCode, userId]);

        // Ajouter le créateur comme admin du groupe
        await dbRun(`
            INSERT INTO group_members (group_id, user_id, role, joined_at)
            VALUES (?, ?, 'admin', CURRENT_TIMESTAMP)
        `, [result.lastID, userId]);

        logger.info(`Group created: ${name} by user ${userId}`);

        return { 
            success: true, 
            groupId: result.lastID, 
            inviteCode,
            message: 'Group created successfully' 
        };
    } catch (error) {
        logger.error('Error creating group:', error);
        return { success: false, error: 'Failed to create group' };
    }
}

/**
 * Rejoindre un groupe avec code d'invitation
 * @param {number} userId - ID de l'utilisateur
 * @param {string} inviteCode - Code d'invitation
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
async function joinGroupByInvite(userId, inviteCode) {
    // Vérifier si le code d'invitation est valide
    const group = await dbGet(`
        SELECT id, name FROM groups 
        WHERE invite_code = ? AND is_private = 1
    `, [inviteCode]);

    if (!group) {
        return { success: false, error: 'Invalid invite code' };
    }

    // Vérifier si l'utilisateur est déjà membre
    const existingMember = await dbGet(`
        SELECT id FROM group_members 
        WHERE group_id = ? AND user_id = ?
    `, [group.id, userId]);

    if (existingMember) {
        return { success: false, error: 'Already a member of this group' };
    }

    // Ajouter l'utilisateur comme membre
    await dbRun(`
        INSERT INTO group_members (group_id, user_id, role, joined_at)
        VALUES (?, ?, 'member', CURRENT_TIMESTAMP)
    `, [group.id, userId]);

    logger.info(`User ${userId} joined group ${group.name} via invite code`);

    return { success: true, message: 'Joined group successfully' };
}

/**
 * Quitter un groupe
 * @param {number} userId - ID de l'utilisateur
 * @param {number} groupId - ID du groupe
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
async function leaveGroup(userId, groupId) {
    // Vérifier si l'utilisateur est membre
    const membership = await dbGet(`
        SELECT role FROM group_members 
        WHERE group_id = ? AND user_id = ?
    `, [groupId, userId]);

    if (!membership) {
        return { success: false, error: 'Not a member of this group' };
    }

    // Empêter le dernier admin de quitter
    if (membership.role === 'admin') {
        const adminCount = await dbGet(`
            SELECT COUNT(*) as count FROM group_members 
            WHERE group_id = ? AND role = 'admin'
        `, [groupId]);

        if (adminCount.count === 1) {
            return { success: false, error: 'Cannot leave group: you are the only admin' };
        }
    }

    // Supprimer l'adhésion
    await dbRun(`
        DELETE FROM group_members 
        WHERE group_id = ? AND user_id = ?
    `, [groupId, userId]);

    logger.info(`User ${userId} left group ${groupId}`);

    return { success: true, message: 'Left group successfully' };
}

/**
 * Récupérer les groupes d'un utilisateur
 * @param {number} userId - ID de l'utilisateur
 * @returns {Promise<Array>} Liste des groupes avec détails
 */
async function getUserGroups(userId) {
    const groups = await dbAll(`
        SELECT g.id, g.name, g.description, g.is_private, gm.role, gm.joined_at, 
               (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
        FROM groups g
        INNER JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = ?
        ORDER BY gm.joined_at DESC
    `, [userId]);

    return groups;
}

/**
 * Récupérer les membres d'un groupe
 * @param {number} groupId - ID du groupe
 * @param {number} requestingUserId - ID de l'utilisateur qui fait la demande
 * @returns {Promise<{success: boolean, members?: Array, error?: string}>}
 */
async function getGroupMembers(groupId, requestingUserId) {
    // Vérifier si l'utilisateur a accès au groupe
    const membership = await dbGet(`
        SELECT role FROM group_members 
        WHERE group_id = ? AND user_id = ?
    `, [groupId, requestingUserId]);

    if (!membership) {
        return { success: false, error: 'Access denied' };
    }

    const members = await dbAll(`
        SELECT gm.user_id, gm.role, gm.joined_at,
               json_extract(u.profile_data, '$.name') as name,
               u.email
        FROM group_members gm
        LEFT JOIN users u ON gm.user_id = u.id
        WHERE gm.group_id = ?
        ORDER BY gm.role DESC, gm.joined_at ASC
    `, [groupId]);

    return { success: true, members };
}

/**
 * Promouvoir un membre en admin
 * @param {number} adminUserId - ID de l'admin qui fait la promotion
 * @param {number} groupId - ID du groupe
 * @param {number} targetUserId - ID de l'utilisateur à promouvoir
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
async function promoteToAdmin(adminUserId, groupId, targetUserId) {
    // Vérifier si l'admin a les droits
    const adminMembership = await dbGet(`
        SELECT role FROM group_members 
        WHERE group_id = ? AND user_id = ?
    `, [groupId, adminUserId]);

    if (!adminMembership || adminMembership.role !== 'admin') {
        return { success: false, error: 'Only admins can promote members' };
    }

    // Vérifier si la cible est un membre
    const targetMembership = await dbGet(`
        SELECT role FROM group_members 
        WHERE group_id = ? AND user_id = ?
    `, [groupId, targetUserId]);

    if (!targetMembership) {
        return { success: false, error: 'User is not a member of this group' };
    }

    if (targetMembership.role === 'admin') {
        return { success: false, error: 'User is already an admin' };
    }

    // Promouvoir l'utilisateur
    await dbRun(`
        UPDATE group_members 
        SET role = 'admin'
        WHERE group_id = ? AND user_id = ?
    `, [groupId, targetUserId]);

    logger.info(`User ${targetUserId} promoted to admin in group ${groupId} by ${adminUserId}`);

    return { success: true, message: 'User promoted to admin successfully' };
}

module.exports = {
    createGroup,
    joinGroupByInvite,
    leaveGroup,
    getUserGroups,
    getGroupMembers,
    promoteToAdmin,
    generateInviteCode
};
