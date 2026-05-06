/**
 * ============================================================
 * FRIENDS SERVICE - Module Friends du Service Social
 * ============================================================
 * 
 * Gestion des relations d'amitié entre utilisateurs
 * @module social/friends.service
 */

'use strict';

const { dbGetMain, dbRunMain, dbAllMain } = require('../../database');

// Aliases locaux pour lisibilité
const dbGet = (q, p) => dbGetMain(q, p);
const dbRun = (q, p) => dbRunMain(q, p);
const dbAll = (q, p) => dbAllMain(q, p);

/**
 * Envoyer une demande d'ami
 * @param {number} userId - ID de l'utilisateur qui envoie
 * @param {number} friendId - ID de l'ami potentiel
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
async function sendFriendRequest(userId, friendId) {
    // Validation: ne peut pas s'ajouter soi-même
    if (userId === friendId) {
        return { success: false, error: 'Cannot add yourself as friend' };
    }

    // Vérifier si une relation existe déjà
    const existing = await dbGet(`
        SELECT * FROM friends 
        WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `, [userId, friendId, friendId, userId]);

    if (existing) {
        return { success: false, error: 'Friend request already exists' };
    }

    // Créer la demande d'ami
    await dbRun(`
        INSERT INTO friends (user_id, friend_id, status)
        VALUES (?, ?, 'pending')
    `, [userId, friendId]);

    return { success: true, message: 'Friend request sent' };
}

/**
 * Accepter une demande d'ami
 * @param {number} userId - ID de l'utilisateur qui accepte
 * @param {number} friendId - ID de l'ami qui a envoyé la demande
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function acceptFriendRequest(userId, friendId) {
    // Mettre à jour le statut de la demande originale
    await dbRun(`
        UPDATE friends 
        SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND friend_id = ? AND status = 'pending'
    `, [friendId, userId]);

    // Créer l'entrée réciproque pour la relation bidirectionnelle
    await dbRun(`
        INSERT OR IGNORE INTO friends (user_id, friend_id, status, accepted_at)
        VALUES (?, ?, 'accepted', CURRENT_TIMESTAMP)
    `, [userId, friendId]);

    // TODO: Envoyer une notification à l'ami qui a envoyé la demande
    // try {
    //     await notifyNewFriendRequest(friendId, userId);
    // } catch (err) {
    //     // notification failed — non-blocking
    // }

    return { success: true, message: 'Friend request accepted' };
}

/**
 * Refuser une demande d'ami
 * @param {number} userId - ID de l'utilisateur qui refuse
 * @param {number} friendId - ID de l'ami qui a envoyé la demande
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function rejectFriendRequest(userId, friendId) {
    await dbRun(`
        DELETE FROM friends 
        WHERE user_id = ? AND friend_id = ? AND status = 'pending'
    `, [friendId, userId]);

    return { success: true, message: 'Friend request rejected' };
}

/**
 * Supprimer un ami existant
 * @param {number} userId - ID de l'utilisateur
 * @param {number} friendId - ID de l'ami à supprimer
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function removeFriend(userId, friendId) {
    await dbRun(`
        DELETE FROM friends 
        WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `, [userId, friendId, friendId, userId]);

    return { success: true, message: 'Friend removed' };
}

/**
 * Récupérer la liste des amis d'un utilisateur
 * @param {number} userId - ID de l'utilisateur
 * @returns {Promise<Array>} Liste des amis avec informations de base
 */
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

/**
 * Récupérer les demandes d'amis en attente
 * @param {number} userId - ID de l'utilisateur
 * @returns {Promise<Array>} Liste des demandes en attente
 */
async function getPendingRequests(userId) {
    const requests = await dbAll(`
        SELECT f.user_id, f.created_at, u.email, json_extract(u.profile_data, '$.name') as name
        FROM friends f
        LEFT JOIN users u ON f.user_id = u.id
        WHERE f.friend_id = ? AND f.status = 'pending'
    `, [userId]);

    return requests;
}

/**
 * Vérifier si deux utilisateurs sont amis
 * @param {number} userId - ID du premier utilisateur
 * @param {number} friendId - ID du deuxième utilisateur
 * @returns {Promise<boolean>} True si ils sont amis
 */
async function areFriends(userId, friendId) {
    const friendship = await dbGet(`
        SELECT status FROM friends 
        WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `, [userId, friendId, friendId, userId]);

    return friendship && friendship.status === 'accepted';
}

module.exports = {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    getFriends,
    getPendingRequests,
    areFriends
};
