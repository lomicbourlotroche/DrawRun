/**
 * ============================================================
 * SOCIAL SERVICE - Service Social Refactorisé
 * ============================================================
 * 
 * Architecture modulaire du service social
 * - friends.service.js: Gestion des amitiés
 * - groups.service.js: Gestion des groupes
 * - feed.service.js: Gestion du feed social
 * - challenges.service.js: Gestion des défis (futur)
 * 
 * @module social/index
 */

'use strict';

// Import des modules spécialisés
const friendsService = require('./friends.service');
const groupsService = require('./groups.service');
const feedService = require('./feed.service');

// Export unifié pour compatibilité avec l'ancien API
module.exports = {
    // Friends module
    sendFriendRequest: friendsService.sendFriendRequest,
    acceptFriendRequest: friendsService.acceptFriendRequest,
    rejectFriendRequest: friendsService.rejectFriendRequest,
    removeFriend: friendsService.removeFriend,
    getFriends: friendsService.getFriends,
    getPendingRequests: friendsService.getPendingRequests,
    areFriends: friendsService.areFriends,

    // Groups module
    createGroup: groupsService.createGroup,
    joinGroupByInvite: groupsService.joinGroupByInvite,
    leaveGroup: groupsService.leaveGroup,
    getUserGroups: groupsService.getUserGroups,
    getGroupMembers: groupsService.getGroupMembers,
    promoteToAdmin: groupsService.promoteToAdmin,
    generateInviteCode: groupsService.generateInviteCode,

    // Feed module
    shareActivity: feedService.shareActivity,
    createTextPost: feedService.createTextPost,
    deletePost: feedService.deletePost,
    getUserFeed: feedService.getUserFeed,
    likePost: feedService.likePost,
    unlikePost: feedService.unlikePost,
    addComment: feedService.addComment,

    // Modules individuels pour accès direct
    friends: friendsService,
    groups: groupsService,
    feed: feedService
};
