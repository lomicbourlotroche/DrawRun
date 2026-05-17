/**
 * ============================================================
 * USE SOCIAL HOOK
 * ============================================================
 * Hook React pour gérer les fonctionnalités sociales.
 * Centralise la logique pour les amis, groupes, défis, feed, et classement.
 * 
 * @module hooks/useSocial
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type {
  Friend,
  FriendRequest,
  Group,
  LeaderboardEntry,
  SocialFeedItem,
  UserSearchResult,
} from '@/types';
import { SOCIAL_ERRORS } from '@/constants/social';

// ============================================================
// TYPES
// ============================================================

interface UseFriendsReturn {
  friends: Friend[];
  requests: FriendRequest[];
  isLoading: boolean;
  error: string | null;
  searchResults: UserSearchResult[];
  isSearching: boolean;
  searchQuery: string;
  loadFriends: () => Promise<void>;
  handleSearch: (query: string) => Promise<void>;
  handleAddFriend: (userId: number) => Promise<void>;
  handleAccept: (userId: number) => Promise<void>;
  handleRemove: (userId: number) => Promise<void>;
  setSearchQuery: (query: string) => void;
}

interface UseGroupsReturn {
  groups: Group[];
  publicGroups: Group[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  loadGroups: () => Promise<void>;
  handleSearch: (query: string) => Promise<void>;
  handleLeave: (groupId: number) => Promise<void>;
  setSearchQuery: (query: string) => void;
}

interface UseLeaderboardReturn {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
  category: string;
  period: string;
  setCategory: (category: string) => void;
  setPeriod: (period: string) => void;
  loadLeaderboard: () => Promise<void>;
}

interface UseFeedReturn {
  activities: SocialFeedItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  displayCount: number;
  loadFeed: (refresh?: boolean) => Promise<void>;
  handleLike: (activityId: number, currentLiked: boolean) => Promise<void>;
  setDisplayCount: (count: number) => void;
}

interface UseChallengesReturn {
  publicChallenges: Array<{
    id: number;
    title: string;
    description?: string;
    type: string;
    target_value: number;
    target_unit?: string;
    duration_days: number;
    participant_count: number;
    created_at: string;
    challenge_mode?: string;
    badge_icon?: string;
    sport_type?: string;
    milestones?: string;
    weekly_target?: number;
    weekly_increase_pct?: number;
    streak_days?: number;
    frequency_per_week?: number;
    creator_name?: string;
  }>;
  myChallenges: Array<{
    id: number;
    title: string;
    description?: string;
    type: string;
    target_value: number;
    target_unit?: string;
    progress: number;
    user_status: string;
    start_date: string;
    end_date: string;
    challenge_mode?: string;
    badge_icon?: string;
    milestones?: string;
    streak_current?: number;
    streak_best?: number;
  }>;
  isLoading: boolean;
  error: string | null;
  loadChallenges: () => Promise<void>;
  handleJoin: (challengeId: number) => Promise<void>;
}

// ============================================================
// HOOKS
// ============================================================

/**
 * Hook pour gérer les amis et les demandes d'amis.
 */
export function useFriends(): UseFriendsReturn {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadFriends = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [friendsData, requestsData] = await Promise.all([
        api.getFriends(),
        api.getPendingFriendRequests(),
      ]);
      setFriends(friendsData || []);
      setRequests(requestsData || []);
    } catch {
      setError(SOCIAL_ERRORS.FETCH_FRIENDS);
      setFriends([]);
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    setError(null);
    try {
      const results = await api.searchUsers(query);
      setSearchResults(results || []);
    } catch {
      setError(SOCIAL_ERRORS.FETCH_FRIENDS);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleAddFriend = useCallback(async (userId: number) => {
    try {
      await api.sendFriendRequest(userId);
      setSearchResults((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      setError(SOCIAL_ERRORS.SEND_FRIEND_REQUEST);
    }
  }, []);

  const handleAccept = useCallback(async (userId: number) => {
    try {
      await api.acceptFriendRequest(userId);
      await loadFriends();
    } catch {
      setError(SOCIAL_ERRORS.ACCEPT_FRIEND_REQUEST);
    }
  }, [loadFriends]);

  const handleRemove = useCallback(async (userId: number) => {
    try {
      await api.removeFriend(userId);
      await loadFriends();
    } catch {
      setError(SOCIAL_ERRORS.REMOVE_FRIEND);
    }
  }, [loadFriends]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  return {
    friends,
    requests,
    isLoading,
    error,
    searchResults,
    isSearching,
    searchQuery,
    loadFriends,
    handleSearch,
    handleAddFriend,
    handleAccept,
    handleRemove,
    setSearchQuery,
  };
}

/**
 * Hook pour gérer les groupes.
 */
export function useGroups(): UseGroupsReturn {
  const [groups, setGroups] = useState<Group[]>([]);
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [myGroups, pubGroups] = await Promise.all([
        api.getGroups(),
        api.getPublicGroups(),
      ]);
      setGroups(myGroups || []);
      setPublicGroups(pubGroups || []);
    } catch {
      setError(SOCIAL_ERRORS.FETCH_GROUPS);
      setGroups([]);
      setPublicGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    try {
      const results = await api.getPublicGroups(query);
      setPublicGroups(results || []);
    } catch {
      setError(SOCIAL_ERRORS.FETCH_GROUPS);
      setPublicGroups([]);
    }
  }, []);

  const handleLeave = useCallback(async (groupId: number) => {
    try {
      await api.leaveGroup(groupId);
      await loadGroups();
    } catch {
      setError(SOCIAL_ERRORS.LEAVE_GROUP);
    }
  }, [loadGroups]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  return {
    groups,
    publicGroups,
    isLoading,
    error,
    searchQuery,
    loadGroups,
    handleSearch,
    handleLeave,
    setSearchQuery,
  };
}

/**
 * Hook pour gérer le classement (leaderboard).
 */
export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('distance');
  const [period, setPeriod] = useState('week');

  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getLeaderboard({ category, period });
      setEntries(data || []);
    } catch {
      setError(SOCIAL_ERRORS.FETCH_LEADERBOARD);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [category, period]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  return {
    entries,
    isLoading,
    error,
    category,
    period,
    setCategory,
    setPeriod,
    loadLeaderboard,
  };
}

/**
 * Hook pour gérer le fil d'actualité (feed).
 */
export function useFeed() {
  const [activities, setActivities] = useState<SocialFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(10);

  const loadFeed = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const data = await api.getSocialFeed();
      setActivities(data || []);
    } catch {
      setError(SOCIAL_ERRORS.FETCH_FEED);
      setActivities([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const handleLike = useCallback(async (activityId: number, currentLiked: boolean) => {
    setActivities((prev) =>
      prev.map((a) =>
        a.id === activityId
          ? {
              ...a,
              user_liked: !currentLiked,
              like_count: currentLiked ? (a.like_count ?? 0) - 1 : (a.like_count ?? 0) + 1,
            }
          : a
      )
    );
    try {
      if (currentLiked) await api.unlikeActivity(activityId);
      else await api.likeActivity(activityId);
    } catch {
      setActivities((prev) =>
        prev.map((a) =>
          a.id === activityId
            ? {
                ...a,
                user_liked: currentLiked,
                like_count: currentLiked ? (a.like_count ?? 0) + 1 : (a.like_count ?? 0) - 1,
              }
            : a
        )
      );
      setError(SOCIAL_ERRORS.LIKE_ACTIVITY);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  return {
    activities,
    isLoading,
    isRefreshing,
    error,
    displayCount,
    loadFeed,
    handleLike,
    setDisplayCount,
  };
}

/**
 * Hook pour gérer les défis (challenges).
 */
export function useChallenges() {
  const [publicChallenges, setPublicChallenges] = useState<Array<{
    id: number;
    title: string;
    description?: string;
    type: string;
    target_value: number;
    target_unit?: string;
    duration_days: number;
    participant_count: number;
    created_at: string;
    challenge_mode?: string;
    badge_icon?: string;
    sport_type?: string;
    milestones?: string;
    weekly_target?: number;
    weekly_increase_pct?: number;
    streak_days?: number;
    frequency_per_week?: number;
    creator_name?: string;
  }>>( []);
  const [myChallenges, setMyChallenges] = useState<Array<{
    id: number;
    title: string;
    description?: string;
    type: string;
    target_value: number;
    target_unit?: string;
    progress: number;
    user_status: string;
    start_date: string;
    end_date: string;
    challenge_mode?: string;
    badge_icon?: string;
    milestones?: string;
    streak_current?: number;
    streak_best?: number;
  }>>( []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChallenges = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [pub, mine] = await Promise.all([
        api.getPublicChallenges().catch(() => []),
        api.getUserChallenges().catch(() => []),
      ]);
      setPublicChallenges(pub || []);
      setMyChallenges(mine || []);
    } catch {
      setError(SOCIAL_ERRORS.FETCH_CHALLENGES);
      setPublicChallenges([]);
      setMyChallenges([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleJoin = useCallback(async (challengeId: number) => {
    try {
      const res = await api.joinChallenge(challengeId);
      if (res?.success) {
        await loadChallenges();
      } else {
        setError(res?.error || SOCIAL_ERRORS.JOIN_CHALLENGE);
      }
    } catch {
      setError(SOCIAL_ERRORS.JOIN_CHALLENGE);
    }
  }, [loadChallenges]);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  return {
    publicChallenges,
    myChallenges,
    isLoading,
    error,
    loadChallenges,
    handleJoin,
  };
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Formate le temps en minutes:secondes.
 */
export function formatPace(speedMs: number): string {
  if (!speedMs || speedMs <= 0) return '--';
  const paceMinPerKm = 1000 / (speedMs * 60);
  const mins = Math.floor(paceMinPerKm);
  const secs = Math.round((paceMinPerKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Récupère le gradient de couleur pour un type de sport.
 */
export function getSportGradient(type: string): string {
  const gradients: Record<string, string> = {
    Running: 'from-orange-500 to-red-500',
    Cycling: 'from-blue-500 to-cyan-500',
    Swimming: 'from-cyan-500 to-blue-400',
    Hiking: 'from-green-500 to-emerald-500',
    Walking: 'from-teal-500 to-green-500',
    run: 'from-orange-500 to-red-500',
    ride: 'from-blue-500 to-cyan-500',
    swim: 'from-cyan-500 to-blue-400',
    hike: 'from-green-500 to-emerald-500',
    walk: 'from-teal-500 to-green-500',
  };
  return gradients[type] || 'from-primary to-blue-500';
}

/**
 * Récupère les informations sur le mode de défi.
 */
export function getModeInfo(mode: string) {
  const modes = {
    quota: { icon: '🎯', label: 'Objectif' },
    streak: { icon: '🔥', label: 'Série' },
    weekly: { icon: '📅', label: 'Hebdomadaire' },
    frequency: { icon: '⏳', label: 'Fréquence' },
  };
  return modes[mode] || modes.quota;
}

/**
 * Récupère les informations sur le type de défi.
 */
export function getTypeInfo(type: string) {
  const types = {
    distance: { icon: '📏', label: 'Distance', unit: 'km' },
    duration: { icon: '⏱️', label: 'Durée', unit: 'min' },
    elevation: { icon: '⛰️', label: 'Dénivelé', unit: 'm' },
    activities: { icon: '🏃', label: 'Activités', unit: '' },
  };
  return types[type] || types.distance;
}

/**
 * Récupère les milestones pour un défi.
 */
export function getMilestones(challenge: {
  milestones?: string;
  challenge_mode?: string;
}) {
  const defaultMilestones = [
    { pct: 25, label: '1/4', icon: '🌱' },
    { pct: 50, label: 'Moitié', icon: '🌿' },
    { pct: 75, label: '3/4', icon: '🌳' },
    { pct: 100, label: 'Terminé', icon: '🎉' },
  ];
  
  if (challenge.milestones) {
    try {
      return JSON.parse(challenge.milestones);
    } catch {
      return defaultMilestones;
    }
  }
  
  if (challenge.challenge_mode === 'streak') {
    return [
      { pct: 25, label: '7j', icon: '🔥' },
      { pct: 50, label: '14j', icon: '🔥🔥' },
      { pct: 75, label: '21j', icon: '🔥🔥🔥' },
      { pct: 100, label: '30j', icon: '🏆' },
    ];
  }
  
  return defaultMilestones;
}

/**
 * Récupère la couleur de progression en fonction du pourcentage.
 */
export function getProgressColor(pct: number): string {
  if (pct >= 100) return 'bg-success';
  if (pct >= 75) return 'bg-green-500';
  if (pct >= 50) return 'bg-yellow-500';
  if (pct >= 25) return 'bg-orange-500';
  return 'bg-red-500';
}

/**
 * Formate le nombre de jours restants.
 */
export function formatDaysLeft(endDate: string): string {
  if (!endDate) return 'Pas de date limite';
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Terminé';
  if (diffDays === 1) return '1 jour restant';
  return `${diffDays} jours restants`;
}
