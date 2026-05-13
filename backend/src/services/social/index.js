'use strict';

const {
    sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend,
    getFriends, getPendingRequests, generatePartnerSuggestions, getPartnerSuggestions
} = require('./friends.service');

const {
    createGroup, joinGroup, leaveGroup, getGroups, getGroupDetail, editGroup, deleteGroup,
    kickMember, promoteMember, getGroupMembers, getGroupActivities, getGroupEvents,
    getPublicGroups, generateInviteCode, createEvent, joinEvent
} = require('./groups.service');

const {
    createChallenge, joinChallenge, updateChallengeProgress, getUserChallenges,
    getPublicChallenges, getChallengeDetails, getGroupChallenges,
    createChallengeTeam, joinChallengeTeam, getChallengeTeams,
    createBadge, awardBadge, getUserBadges, addXP, getUserLevel
} = require('./challenges.service');

const {
    likeActivity, unlikeActivity, getActivityLikes, getUserLikedActivities,
    addComment, getActivityComments, deleteComment,
    addReaction, removeReaction, getActivityReactions, getUserActivityReactions
} = require('./engagement.service');

const {
    createConversation, getUserConversations, getConversationMessages,
    sendMessage, getConversationParticipants, createGroupConversation
} = require('./conversations.service');

const notificationService = require('./notifications.service');

const {
    updateSharedStats, getLeaderboard
} = require('./feed.service');

module.exports = {
    sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend,
    getFriends, getPendingRequests, createGroup, joinGroup, leaveGroup, getGroups,
    getGroupDetail, editGroup, deleteGroup, kickMember, promoteMember, getGroupMembers,
    getGroupActivities, getGroupEvents, getPublicGroups, updateSharedStats, getLeaderboard,
    likeActivity, unlikeActivity, getActivityLikes, getUserLikedActivities,
    generateInviteCode, addComment, getActivityComments, deleteComment,
    addReaction, removeReaction, getActivityReactions, getUserActivityReactions,
    createConversation, getUserConversations, getConversationMessages, sendMessage,
    getConversationParticipants, createGroupConversation,
    createChallenge, joinChallenge, updateChallengeProgress, getUserChallenges,
    getPublicChallenges, getChallengeDetails, getGroupChallenges,
    createChallengeTeam, joinChallengeTeam, getChallengeTeams,
    createBadge, awardBadge, getUserBadges, addXP, getUserLevel,
    ...notificationService,
    generatePartnerSuggestions, getPartnerSuggestions,
    createEvent, joinEvent,
};
