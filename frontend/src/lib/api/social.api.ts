/**
 * ============================================================
 * SOCIAL API - Endpoints sociaux
 * ============================================================
 * 
 * Ce fichier contient tous les endpoints sociaux :
 * - Amis et groupes
 * - Likes et Draws
 * - Feed et commentaires
 * - Chat et challenges
 * 
 * @module lib/api/social.api
 */

import { client } from './client';
import type {
  Friend,
  FriendRequest,
  Group,
  GroupDetail,
  GroupMember,
  GroupEvent,
  GroupUpdate,
  LeaderboardEntry,
  ActivityLike,
  SocialFeedItem,
  UserSearchResult,
  PublicProfile,
  Comment,
  Reaction,
  Activity,
} from '@/types';
import type {
  CreateGroupParams,
  ShareStatsParams,
  LeaderboardParams,
  CreateConversationParams,
  SendMessageParams,
  CreateChallengeParams,
  UpdateChallengeProgressParams,
  CreateEventParams,
  CreateBadgeParams,
  AddCommentParams,
  AddReactionParams,
  RemoveReactionParams,
  PaginationParams,
} from './types';

export const socialApi = {
  // ============================================================================
  // Friends
  // ============================================================================

  getFriends(): Promise<Friend[]> {
    return client.request('/api/social/friends');
  },

  getPendingFriendRequests(): Promise<FriendRequest[]> {
    return client.request('/api/social/friends/pending');
  },

  sendFriendRequest(userId: number): Promise<{ success: boolean; message?: string; error?: string }> {
    return client.request('/api/social/friends/request', {
      method: 'POST',
      body: JSON.stringify({ friendId: userId }),
    });
  },

  acceptFriendRequest(friendId: number): Promise<{ success: boolean; message?: string }> {
    return client.request('/api/social/friends/accept', {
      method: 'POST',
      body: JSON.stringify({ friendId }),
    });
  },

  rejectFriendRequest(friendId: number): Promise<{ success: boolean; message?: string }> {
    return client.request('/api/social/friends/reject', {
      method: 'POST',
      body: JSON.stringify({ friendId }),
    });
  },

  removeFriend(friendId: number): Promise<{ success: boolean; message?: string }> {
    return client.request(`/api/social/friends/${friendId}`, { method: 'DELETE' });
  },

  // ============================================================================
  // Groups
  // ============================================================================

  getGroups(): Promise<Group[]> {
    return client.request('/api/social/groups');
  },

  getPublicGroups(search?: string): Promise<Group[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return client.request(`/api/social/groups/public${query}`);
  },

  createGroup(params: CreateGroupParams): Promise<{ success: boolean; group?: Group; error?: string }> {
    return client.request('/api/social/groups', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  joinGroup(inviteCode: string): Promise<{ success: boolean; group?: Group; error?: string }> {
    return client.request('/api/social/groups/join', {
      method: 'POST',
      body: JSON.stringify({ inviteCode }),
    });
  },

  getGroupDetail(groupId: number): Promise<GroupDetail> {
    return client.request(`/api/social/groups/${groupId}`);
  },

  editGroup(groupId: number, updates: Partial<GroupUpdate>): Promise<{ success: boolean; error?: string }> {
    return client.request(`/api/social/groups/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteGroup(groupId: number): Promise<{ success: boolean; error?: string }> {
    return client.request(`/api/social/groups/${groupId}`, { method: 'DELETE' });
  },

  leaveGroup(groupId: number): Promise<{ success: boolean; error?: string }> {
    return client.request(`/api/social/groups/${groupId}/leave`, { method: 'POST' });
  },

  getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return client.request(`/api/social/groups/${groupId}/members`);
  },

  kickMember(groupId: number, userId: number): Promise<{ success: boolean; error?: string }> {
    return client.request(`/api/social/groups/${groupId}/kick`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  promoteMember(groupId: number, userId: number, role: string): Promise<{ success: boolean; error?: string }> {
    return client.request(`/api/social/groups/${groupId}/promote`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    });
  },

  getGroupActivities(groupId: number, limit = 20, offset = 0): Promise<Activity[]> {
    return client.request(`/api/social/groups/${groupId}/activities?limit=${limit}&offset=${offset}`);
  },

  getGroupEvents(groupId: number): Promise<GroupEvent[]> {
    return client.request(`/api/social/groups/${groupId}/events`);
  },

  createEvent(groupId: number, event: CreateEventParams): Promise<{ success: boolean; eventId?: number; error?: string }> {
    return client.request(`/api/social/groups/${groupId}/events`, {
      method: 'POST',
      body: JSON.stringify(event),
    });
  },

  joinEvent(eventId: number): Promise<{ success: boolean; error?: string }> {
    return client.request(`/api/social/events/${eventId}/join`, { method: 'POST' });
  },

  createGroupConversation(groupId: number, title?: string): Promise<{ success: boolean; conversation?: unknown; existing?: boolean; error?: string }> {
    return client.request(`/api/social/groups/${groupId}/conversation`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },

  // ============================================================================
  // Likes & Draws
  // ============================================================================

  likeActivity(activityId: number): Promise<{ success: boolean; message: string }> {
    return client.request(`/api/social/activities/${activityId}/like`, { method: 'POST' });
  },

  unlikeActivity(activityId: number): Promise<{ success: boolean; message: string }> {
    return client.request(`/api/social/activities/${activityId}/like`, { method: 'DELETE' });
  },

  getActivityLikes(activityId: number): Promise<ActivityLike[]> {
    return client.request(`/api/social/activities/${activityId}/likes`);
  },

  getLikedActivities(): Promise<ActivityLike[]> {
    return client.request('/api/social/liked-activities');
  },

  toggleActivityDraw(activityId: number, ownerId: number): Promise<{
    success: boolean;
    draw_count: number;
    has_drawn: boolean;
    message?: string;
    error?: string;
  }> {
    return client.request(`/api/social/activities/${activityId}/draw`, {
      method: 'POST',
      body: JSON.stringify({ ownerId }),
    });
  },

  getActivityDraws(activityId: number): Promise<{
    success: boolean;
    draws: Array<{
      id: number;
      activity_id: number;
      from_user_id: number;
      user_name: string;
      created_at: string;
    }>;
    draw_count: number;
    has_drawn: boolean;
  }> {
    return client.request(`/api/social/activities/${activityId}/draws`);
  },

  getActivityDrawStats(activityId: number): Promise<{
    success: boolean;
    count: number;
    recent_draws: Array<{
      user_id: number;
      user_name: string;
      created_at: string;
    }>;
    has_drawn: boolean;
  }> {
    return client.request(`/api/social/activities/${activityId}/draws/stats`);
  },

  hasUserDrawnActivity(activityId: number): Promise<{
    success: boolean;
    has_drawn: boolean;
  }> {
    return client.request(`/api/social/activities/${activityId}/draws/me`);
  },

  getUserDrawnActivities(): Promise<{
    success: boolean;
    activities: Array<{
      activity_id: number;
      drawn_at: string;
      activity_owner_id: number;
    }>;
  }> {
    return client.request('/api/social/user/draws');
  },

  // ============================================================================
  // Social Feed
  // ============================================================================

  getSocialFeed(): Promise<SocialFeedItem[]> {
    return client.request('/api/social/feed');
  },

  getSocialFeedPaginated(limit?: number, offset?: number): Promise<{
    success: boolean;
    feed: Array<{
      id: number;
      name: string;
      type: string;
      start_date: string;
      distance: number;
      moving_time: number;
      total_elevation_gain?: number;
      user_id: number;
      user_name: string;
      draw_count: number;
      comment_count: number;
      photo_count: number;
    }>;
  }> {
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    if (offset) params.set('offset', String(offset));
    return client.request(`/api/social/feed?${params.toString()}`);
  },

  // ============================================================================
  // User Search & Profiles
  // ============================================================================

  searchUsers(query: string): Promise<UserSearchResult[]> {
    const params = new URLSearchParams({ q: query });
    return client.request(`/api/social/users/search?${params.toString()}`);
  },

  getPublicProfile(userId: number): Promise<PublicProfile> {
    return client.request(`/api/social/profile/${userId}`);
  },

  // ============================================================================
  // Comments
  // ============================================================================

  addComment(activityId: number, content: string): Promise<{ success: boolean; comment?: Comment; error?: string }> {
    return client.request(`/api/social/activities/${activityId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  getActivityComments(activityId: number): Promise<Comment[]> {
    return client.request(`/api/social/activities/${activityId}/comments`);
  },

  deleteComment(commentId: number): Promise<{ success: boolean; message?: string }> {
    return client.request(`/api/social/comments/${commentId}`, { method: 'DELETE' });
  },

  // ============================================================================
  // Reactions
  // ============================================================================

  addReaction(activityId: number, reactionType: string): Promise<{ success: boolean; message?: string; error?: string }> {
    return client.request(`/api/social/activities/${activityId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ reaction_type: reactionType }),
    });
  },

  removeReaction(activityId: number, reactionType: string): Promise<{ success: boolean; message?: string }> {
    return client.request(`/api/social/activities/${activityId}/reactions`, {
      method: 'DELETE',
      body: JSON.stringify({ reaction_type: reactionType }),
    });
  },

  getActivityReactions(activityId: number): Promise<Reaction[]> {
    return client.request(`/api/social/activities/${activityId}/reactions`);
  },

  getUserActivityReactions(activityId: number): Promise<string[]> {
    return client.request(`/api/social/activities/${activityId}/reactions/user`);
  },

  // ============================================================================
  // Chat & Messaging
  // ============================================================================

  createConversation(params: CreateConversationParams): Promise<{ 
    success: boolean; 
    conversation?: unknown; 
    existing?: boolean; 
    error?: string 
  }> {
    return client.request('/api/social/conversations', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  getUserConversations(): Promise<unknown[]> {
    return client.request('/api/social/conversations');
  },

  getConversationMessages(conversationId: number, limit = 50, offset = 0): Promise<unknown[]> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    return client.request(`/api/social/conversations/${conversationId}/messages?${params.toString()}`);
  },

  sendMessage(params: SendMessageParams): Promise<{ success: boolean; message?: unknown; error?: string }> {
    return client.request(`/api/social/conversations/${params.conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ 
        content: params.content, 
        message_type: params.messageType, 
        attachment_url: params.attachmentUrl 
      }),
    });
  },

  getConversationParticipants(conversationId: number): Promise<unknown[]> {
    return client.request(`/api/social/conversations/${conversationId}/participants`);
  },

  createGroupConversation(groupId: number, title?: string): Promise<{ 
    success: boolean; 
    conversation?: unknown; 
    existing?: boolean; 
    error?: string 
  }> {
    return client.request(`/api/social/groups/${groupId}/conversation`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  },

  // ============================================================================
  // Challenges
  // ============================================================================

  createChallenge(params: CreateChallengeParams): Promise<{ 
    success: boolean; 
    challenge?: unknown; 
    error?: string 
  }> {
    return client.request('/api/social/challenges', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  joinChallenge(challengeId: number): Promise<{ success: boolean; message?: string; error?: string }> {
    return client.request(`/api/social/challenges/${challengeId}/join`, { method: 'POST' });
  },

  updateChallengeProgress(params: UpdateChallengeProgressParams): Promise<{ 
    success: boolean; 
    status?: string; 
    progress?: number; 
    error?: string 
  }> {
    return client.request(`/api/social/challenges/${params.challengeId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ progress: params.progress }),
    });
  },

  getUserChallenges(): Promise<unknown[]> {
    return client.request('/api/social/challenges/user');
  },

  getPublicChallenges(limit = 20): Promise<unknown[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    return client.request(`/api/social/challenges/public?${params.toString()}`);
  },

  getChallengeDetails(challengeId: number): Promise<{ 
    success: boolean; 
    challenge?: unknown; 
    participants?: unknown[]; 
    user_participation?: unknown; 
    error?: string 
  }> {
    return client.request(`/api/social/challenges/${challengeId}`);
  },

  createChallengeTeam(challengeId: number, name: string): Promise<{ 
    success: boolean; 
    team?: unknown; 
    error?: string 
  }> {
    return client.request(`/api/social/challenges/${challengeId}/teams`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  joinChallengeTeam(teamId: number): Promise<{ success: boolean; message?: string; error?: string }> {
    return client.request(`/api/social/challenges/teams/${teamId}/join`, { method: 'POST' });
  },

  getChallengeTeams(challengeId: number): Promise<unknown[]> {
    return client.request(`/api/social/challenges/${challengeId}/teams`);
  },

  // ============================================================================
  // Leaderboard
  // ============================================================================

  getLeaderboard(params?: LeaderboardParams): Promise<LeaderboardEntry[]> {
    const query = new URLSearchParams();
    if (params?.groupId) query.set('groupId', String(params.groupId));
    if (params?.category) query.set('category', params.category);
    if (params?.period) query.set('period', params.period);
    return client.request(`/api/social/leaderboard?${query.toString()}`);
  },

  shareStats(params: ShareStatsParams): Promise<{ success: boolean }> {
    return client.request('/api/social/stats/share', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // ============================================================================
  // Events
  // ============================================================================

  createEvent(params: CreateEventParams): Promise<{ 
    success: boolean; 
    event?: unknown; 
    error?: string 
  }> {
    return client.request('/api/social/events', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  joinEvent(eventId: number, status = 'going'): Promise<{ success: boolean; message?: string; error?: string }> {
    return client.request(`/api/social/events/${eventId}/join`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },

  // ============================================================================
  // Badges & XP
  // ============================================================================

  createBadge(params: CreateBadgeParams): Promise<{ 
    success: boolean; 
    badge?: unknown; 
    error?: string 
  }> {
    return client.request('/api/social/badges', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  awardBadge(badgeId: number): Promise<{ success: boolean; message?: string; error?: string }> {
    return client.request(`/api/social/badges/${badgeId}/award`, { method: 'POST' });
  },

  getUserBadges(): Promise<unknown[]> {
    return client.request('/api/social/badges/user');
  },

  getUserLevel(): Promise<{ level: number; total_xp: number; xp_to_next_level: number }> {
    return client.request('/api/social/level');
  },

  addXP(xp: number): Promise<{ success: boolean; error?: string }> {
    return client.request('/api/social/xp/add', {
      method: 'POST',
      body: JSON.stringify({ xp }),
    });
  },

  // ============================================================================
  // Partner Suggestions
  // ============================================================================

  generatePartnerSuggestions(): Promise<{ success: boolean; suggestions?: unknown[]; error?: string }> {
    return client.request('/api/social/partners/suggest', { method: 'POST' });
  },

  getPartnerSuggestions(): Promise<unknown[]> {
    return client.request('/api/social/partners');
  },

  // ============================================================================
  // Activity Photos
  // ============================================================================

  addActivityPhoto(activityId: number, data: {
    url: string;
    caption?: string;
    lat?: number;
    lng?: number;
  }): Promise<{ success: boolean; photo_id?: number; message?: string }> {
    return client.request(`/api/social/activities/${activityId}/photos`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getActivityPhotos(activityId: number): Promise<{
    success: boolean;
    photos: Array<{
      id: number;
      url: string;
      caption?: string;
      lat?: number;
      lng?: number;
      user_name: string;
      created_at: string;
    }>;
  }> {
    return client.request(`/api/social/activities/${activityId}/photos`);
  },

  deleteActivityPhoto(photoId: number): Promise<{ success: boolean; message?: string }> {
    return client.request(`/api/social/photos/${photoId}`, { method: 'DELETE' });
  },

  // ============================================================================
  // Notifications
  // ============================================================================

  getNotifications(params?: PaginationParams): Promise<{ notifications: unknown[]; unread_count: number }> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    return client.request(`/api/social/notifications?${query.toString()}`);
  },

  markNotificationAsRead(notificationId: number): Promise<{ success: boolean }> {
    return client.request(`/api/social/notifications/${notificationId}/read`, { method: 'PUT' });
  },

  markAllNotificationsAsRead(): Promise<{ success: boolean }> {
    return client.request('/api/social/notifications/read-all', { method: 'PUT' });
  },

  deleteNotification(notificationId: number): Promise<{ success: boolean }> {
    return client.request(`/api/social/notifications/${notificationId}`, { method: 'DELETE' });
  },
};
