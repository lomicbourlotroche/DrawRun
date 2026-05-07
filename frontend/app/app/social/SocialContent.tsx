/**
 * SocialContent - Redesigned Social Page
 * =======================================
 * Modern UI with feed, friends, groups, and leaderboard tabs.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Input, GradientBadge, Avatar, Skeleton, GlassCard, GlassCardContent } from '@/components/ui';
import { api } from '@/lib/api';
import type { 
  SocialFeedItem, 
  Friend, 
  FriendRequest, 
  UserSearchResult, 
  LeaderboardEntry, 
  Group 
} from '@/types';
import { useNotificationsStore } from '@/stores';
import { 
  Users, UserPlus, Search, Trophy, MessageCircle, 
  Heart, MapPin, Clock, Flame, TrendingUp, Users2,
  Loader2, X, Check, Copy, Bell, Activity, ChevronRight, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// FRIENDS TAB
// ============================================================================

function FriendsTab() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  const loadFriends = useCallback(async () => {
    setIsLoading(true);
    try {
      const [friendsData, requestsData] = await Promise.all([
        api.getFriends(),
        api.getPendingFriendRequests()
      ]);
      setFriends(friendsData || []);
      setRequests(requestsData || []);
    } catch {
      /* silent */
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    setIsSearching(true);
    try {
      const results = await api.searchUsers(searchQuery);
      setSearchResults(results || []);
    } catch (e) {
      toast.error('Erreur');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (userId: number) => {
    try {
      await api.sendFriendRequest(userId);
      toast.success('Demande envoyée');
      setSearchResults(searchResults.filter(u => u.id !== userId));
    } catch (e) {
      toast.error('Erreur');
    }
  };

  const handleAccept = async (userId: number) => {
    try {
      await api.acceptFriendRequest(userId);
      toast.success('Accepté');
      loadFriends();
    } catch (e) {
      toast.error('Erreur');
    }
  };

  const handleRemove = async (friendId: number) => {
    try {
      await api.removeFriend(friendId);
      toast.success('Supprimé');
      loadFriends();
    } catch (e) {
      toast.error('Erreur');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-muted" />
        </div>
        <input
          type="text"
          placeholder="Rechercher un athlète..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="w-full pl-12 pr-16 py-3 rounded-2xl bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
        />
        {searchQuery.length >= 2 && (
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted">Résultats</h3>
          <div className="space-y-2">
            {searchResults.map((user) => (
              <GlassCard key={user.id} padding="sm" hover>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar name={user.name} size="md" />
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs text-muted">{user.email}</p>
                    </div>
                  </div>
                  <Button size="sm" className="rounded-xl" onClick={() => handleAddFriend(user.id)}>
                    <UserPlus className="w-4 h-4 mr-1" />
                    Ajouter
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Pending Requests */}
      {requests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            <h3 className="text-sm font-semibold">Demandes en attente</h3>
            <GradientBadge variant="warning" size="sm">{requests.length}</GradientBadge>
          </div>
          <div className="grid gap-2">
            {requests.map((req) => (
              <GlassCard key={req.userId || req.user_id || 0} padding="sm" hover>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar name={req.name} size="md" />
                    <div>
                      <p className="font-semibold">{req.name}</p>
                      <p className="text-xs text-muted">{req.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="rounded-xl bg-green-500 hover:bg-green-600" onClick={() => handleAccept(req.userId || req.user_id || 0)}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-xl text-muted hover:text-danger" onClick={() => handleRemove(req.userId || req.user_id || 0)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Mes amis
          </h3>
          <span className="text-xs text-muted">{friends.length}</span>
        </div>
        {friends.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
              <Users className="w-10 h-10 text-primary/50" />
            </div>
            <p className="font-medium">Aucun ami pour le moment</p>
            <p className="text-sm text-muted mt-1">Recherchez des athlètes pour vous connecter</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {friends.map((friend) => (
              <GlassCard key={friend.id || friend.friend_id || friend.user_id || 0} padding="sm" hover>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar name={friend.name} size="md" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card" />
                    </div>
                    <div>
                      <p className="font-semibold">{friend.name}</p>
                      <p className="text-xs text-muted">Amis depuis {new Date(friend.accepted_at || friend.created_at || '').toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-danger" onClick={() => handleRemove(friend.id || friend.friend_id || friend.user_id || 0)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// FEED TAB
// ============================================================================

function FeedTab() {
  const [activities, setActivities] = useState<SocialFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // État pour la modal de commentaires
  const [commentActivityId, setCommentActivityId] = useState<number | null>(null);
  const [comments, setComments] = useState<Array<{ id: number; content: string; user_name: string; created_at: string }>>([]);
  const [commentText, setCommentText] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);

  const loadFeed = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getSocialFeed();
      setActivities(data || []);
    } catch {
      /* silent */
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleLike = async (activityId: number, currentLiked: boolean) => {
    try {
      if (currentLiked) {
        await api.unlikeActivity(activityId);
      } else {
        await api.likeActivity(activityId);
      }
      setActivities(activities.map(a => 
        a.id === activityId 
          ? { ...a, user_liked: !currentLiked, like_count: currentLiked ? (a.like_count ?? 0) - 1 : (a.like_count ?? 0) + 1 }
          : a
      ));
    } catch (e) {
      toast.error('Erreur');
    }
  };

  const handleOpenComments = async (activityId: number) => {
    setCommentActivityId(activityId);
    setCommentText('');
    setIsLoadingComments(true);
    try {
      const data = await api.getActivityComments(activityId);
      setComments((data as Array<{ id: number; content: string; user_name: string; created_at: string }>) || []);
    } catch {
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || !commentActivityId) return;
    setIsPostingComment(true);
    try {
      await api.addComment(commentActivityId, commentText.trim());
      toast.success('Commentaire ajouté');
      setCommentText('');
      const data = await api.getActivityComments(commentActivityId);
      setComments((data as Array<{ id: number; content: string; user_name: string; created_at: string }>) || []);
      setActivities(prev => prev.map(a =>
        a.id === commentActivityId
          ? { ...a, comment_count: (a.comment_count ?? 0) + 1 }
          : a
      ));
    } catch {
      toast.error('Erreur lors de l\'ajout du commentaire');
    } finally {
      setIsPostingComment(false);
    }
  };

  const getSportGradient = (type: string) => {
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
  };

  const formatPace = (speedMs: number): string => {
    if (!speedMs || speedMs <= 0) return '--';
    const paceMinPerKm = 1000 / (speedMs * 60);
    const mins = Math.floor(paceMinPerKm);
    const secs = Math.round((paceMinPerKm - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-3xl" />)}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
          <Flame className="w-12 h-12 text-orange-500/50" />
        </div>
        <p className="font-semibold text-lg">Aucune activité récente</p>
        <p className="text-sm text-muted mt-2">Ajoutez des amis pour voir leurs activités</p>
      </div>
    );
  }

    return (
      <>
      <div className="space-y-4">
        {activities.map((activity) => (
          <GlassCard key={activity.id} hover className="overflow-hidden">
            {/* Header gradient bar */}
            <div className={`h-1.5 bg-gradient-to-r ${getSportGradient(activity.type || '')}`} />
            
            <GlassCardContent className="p-5">
              {/* User header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar name={activity.owner_name} size="md" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-card" />
                  </div>
                  <div>
                    <p className="font-semibold">{activity.owner_name}</p>
                    <p className="text-xs text-muted">{activity.start_date_local ? new Date(activity.start_date_local).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}</p>
                  </div>
                </div>
                <GradientBadge variant="primary" size="sm" className={`bg-gradient-to-r ${getSportGradient(activity.type || '')} text-white border-0`}>
                  {activity.type}
                </GradientBadge>
              </div>
             
              {/* Activity name */}
              <h4 className="font-bold text-lg mb-3">{activity.name}</h4>
             
              {/* Stats */}
              <div className="flex flex-wrap gap-4 mb-4">
                {(activity.distance ?? 0) > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{((activity.distance ?? 0) / 1000).toFixed(2)} km</span>
                  </div>
                )}
                {(activity.moving_time ?? 0) > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{Math.floor((activity.moving_time ?? 0) / 60)} min</span>
                  </div>
                )}
                {((activity.average_speed as number) ?? 0) > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{formatPace(activity.average_speed as number)} /km</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <button 
                  onClick={() => handleLike(activity.id, !!activity.user_liked)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    activity.user_liked 
                      ? 'bg-red-500/20 text-red-500' 
                      : 'bg-muted text-muted hover:bg-red-500/10 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${activity.user_liked ? 'fill-current' : ''}`} />
                  <span className="font-semibold text-sm">{activity.like_count || 0}</span>
                </button>
               
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" className="rounded-full" onClick={() => handleOpenComments(activity.id)}>
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {(activity as SocialFeedItem & { comment_count?: number }).comment_count
                      ? `${(activity as SocialFeedItem & { comment_count?: number }).comment_count}`
                      : 'Commenter'}
                  </Button>
                  <Button size="sm" variant="ghost" className="rounded-full">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        ))}
      </div>

      {/* ── Modal commentaires ── */}
      {commentActivityId !== null && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
          onClick={() => setCommentActivityId(null)}
        >
          <div
            className="bg-card rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                Commentaires
              </h3>
              <button
                onClick={() => setCommentActivityId(null)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted" />
              </button>
            </div>

            {/* Liste des commentaires */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 min-h-[120px]">
              {isLoadingComments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-muted opacity-30" />
                  <p className="text-sm text-muted">Aucun commentaire — soyez le premier !</p>
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <Avatar name={c.user_name} size="sm" />
                    <div className="flex-1 bg-muted/40 rounded-xl px-3 py-2">
                      <p className="text-xs font-semibold text-foreground">{c.user_name}</p>
                      <p className="text-sm text-foreground mt-0.5">{c.content || '(Aucun contenu)'}</p>
                      <p className="text-xs text-muted mt-1">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Zone de saisie */}
            <div className="px-5 py-4 border-t border-border">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handlePostComment()}
                  placeholder="Écrire un commentaire..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                  autoFocus
                />
                <button
                  onClick={handlePostComment}
                  disabled={!commentText.trim() || isPostingComment}
                  className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                >
                  {isPostingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Envoyer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function LeaderboardTab() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [category, setCategory] = useState('distance');
  const [period, setPeriod] = useState('week');
  const [isLoading, setIsLoading] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getLeaderboard({ category, period });
      setEntries(data || []);
    } catch {
      /* silent */
    } finally {
      setIsLoading(false);
    }
  }, [category, period]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const categories = [
    { id: 'distance', label: 'Distance', unit: 'km', icon: MapPin },
    { id: 'duration', label: 'Temps', unit: 'h', icon: Clock },
    { id: 'tss', label: 'TSS', unit: '', icon: Activity },
    { id: 'activities', label: 'Séances', unit: '', icon: Trophy },
  ];

  const periods = [
    { id: 'week', label: 'Semaine' },
    { id: 'month', label: 'Mois' },
    { id: 'year', label: 'Année' },
  ];

  const getPodiumStyle = (index: number) => {
    if (index === 0) return { bg: 'from-yellow-400 to-amber-500', text: 'text-yellow-600', badge: '🥇', label: 'Leader', ring: 'ring-yellow-400' };
    if (index === 1) return { bg: 'from-gray-300 to-gray-400', text: 'text-gray-500', badge: '🥈', label: '2ème', ring: 'ring-gray-400' };
    if (index === 2) return { bg: 'from-orange-400 to-amber-600', text: 'text-orange-600', badge: '🥉', label: '3ème', ring: 'ring-orange-400' };
    return { bg: 'from-muted to-muted/50', text: 'text-muted', badge: `#${index + 1}`, label: '', ring: 'ring-border' };
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-500/20 flex items-center justify-center">
          <Trophy className="w-12 h-12 text-yellow-500/50" />
        </div>
        <p className="font-semibold text-lg">Aucune donnée</p>
        <p className="text-sm text-muted mt-2">Commencez à vous entraîner pour apparaître ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                category === c.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-card border border-border text-muted hover:border-primary/30'
              }`}
            >
              <c.icon className="w-4 h-4" />
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {periods.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                period === p.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 0, 2].map((idx) => {
            const entry = entries[idx];
            const style = getPodiumStyle(idx);
            return (
              <div key={idx} className={`flex flex-col items-center p-4 rounded-2xl bg-gradient-to-b ${style.bg} ${idx === 0 ? 'order-2' : idx === 1 ? 'order-1' : 'order-3'}`}>
                <div className={`text-2xl mb-2`}>{style.badge}</div>
                <Avatar name={entry.name} size={idx === 0 ? 'lg' : 'md'} />
                <p className={`font-semibold text-sm mt-2 ${idx === 0 ? 'text-white' : 'text-foreground'}`}>{entry.name}</p>
                <p className={`text-lg font-bold ${idx === 0 ? 'text-white' : 'text-primary'}`}>{entry.value}</p>
                <p className={`text-xs ${idx === 0 ? 'text-white/80' : 'text-muted'}`}>{categories.find(c => c.id === category)?.unit}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Rest of the list */}
      {entries.slice(3).map((entry, index) => {
        const actualIndex = index + 3;
        const style = getPodiumStyle(actualIndex);
        return (
          <GlassCard key={actualIndex} padding="sm" hover>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${style.bg} flex items-center justify-center font-bold text-sm text-white`}>
                  {actualIndex + 1}
                </div>
                <Avatar name={entry.name} size="md" />
                <div>
                  <p className="font-semibold">{entry.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">{entry.value}</p>
                <p className="text-xs text-muted">{categories.find(c => c.id === category)?.unit}</p>
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}

// ============================================================================
// GROUPS TAB
// ============================================================================

import Link from 'next/link';

function GroupsTab() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', isPrivate: true });
  const [inviteCode, setInviteCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const [myGroups, pubGroups] = await Promise.all([
        api.getGroups(),
        api.getPublicGroups(),
      ]);
      setGroups(myGroups || []);
      setPublicGroups(pubGroups || []);
    } catch {
      /* silent */
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleCreate = async () => {
    if (!newGroup.name) return;
    try {
      await api.createGroup(newGroup);
      toast.success('Groupe créé');
      setShowCreate(false);
      setNewGroup({ name: '', description: '', isPrivate: true });
      loadGroups();
    } catch (e) {
      toast.error('Erreur');
    }
  };

  const handleJoin = async () => {
    if (!inviteCode) return;
    try {
      await api.joinGroup(inviteCode);
      toast.success('Rejoint');
      setShowJoin(false);
      setInviteCode('');
      loadGroups();
    } catch (e) {
      toast.error('Erreur');
    }
  };

  const handleLeave = async (groupId: number) => {
    try {
      await api.leaveGroup(groupId);
      toast.success('Quitté');
      loadGroups();
    } catch (e) {
      toast.error('Erreur');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copié');
  };

  const handleSearch = async () => {
    try {
      const results = await api.getPublicGroups(searchQuery);
      setPublicGroups(results || []);
    } catch {
      /* silent */
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1 rounded-xl" onClick={() => setShowJoin(true)}>
          <Users2 className="w-4 h-4 mr-2" />
          Rejoindre
        </Button>
        <Button className="flex-1 rounded-xl" onClick={() => setShowCreate(true)}>
          <Sparkles className="w-4 h-4 mr-2" />
          Créer
        </Button>
      </div>

      {/* My Groups */}
      {groups.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Users2 className="w-4 h-4 text-primary" />
            Mes groupes
          </h3>
          <div className="grid gap-3">
            {groups.map((group) => (
              <Link key={group.id} href={`/app/social/groups/${group.id}`} className="block">
                <GlassCard padding="md" hover>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
                        <Users2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{group.name}</h4>
                        {group.description && (
                          <p className="text-sm text-muted mt-1 line-clamp-2">{group.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          <GradientBadge variant="primary" size="sm" className="rounded-full">{group.member_count} membres</GradientBadge>
                          {group.is_private ? (
                            <GradientBadge variant="warning" size="sm" className="rounded-full">Privé</GradientBadge>
                          ) : (
                            <GradientBadge variant="success" size="sm" className="rounded-full">Public</GradientBadge>
                          )}
                          {group.role === 'admin' && (
                            <GradientBadge variant="info" size="sm" className="rounded-full">Admin</GradientBadge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {group.invite_code && (
                        <Button size="sm" variant="ghost" className="rounded-xl" onClick={(e) => { e.preventDefault(); copyCode(group.invite_code || ''); }}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}
                      {group.role !== 'admin' && (
                        <Button size="sm" variant="ghost" className="rounded-xl text-muted hover:text-danger" onClick={(e) => { e.preventDefault(); handleLeave(group.id); }}>
                          Quitter
                        </Button>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Discover Public Groups */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" />
            Découvrir des groupes
          </h3>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-4 py-2 rounded-xl bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
          />
          <Button variant="secondary" size="sm" onClick={handleSearch}>Rechercher</Button>
        </div>
        {publicGroups.length > 0 ? (
          <div className="grid gap-3">
            {publicGroups.filter(g => !groups.find(mg => mg.id === g.id)).slice(0, 5).map((group) => (
              <GlassCard key={group.id} padding="sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <Users2 className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">{group.name}</h4>
                      <p className="text-xs text-muted">{group.member_count} membres</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => { setInviteCode(group.invite_code || ''); setShowJoin(true); }}>
                    Rejoindre
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted">Aucun groupe public trouvé</p>
          </div>
        )}
      </div>

      {/* Empty State */}
      {groups.length === 0 && publicGroups.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
            <Users2 className="w-12 h-12 text-primary/50" />
          </div>
          <p className="font-semibold text-lg">Aucun groupe</p>
          <p className="text-sm text-muted mt-2">Créez ou rejoignez un groupe pour commencer</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-card p-6 rounded-3xl w-full max-w-md border border-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-1">Créer un groupe</h3>
            <p className="text-sm text-muted mb-6">Invitez vos amis à s&apos;entraîner ensemble</p>
            <div className="space-y-4">
              <Input 
                label="Nom" 
                value={newGroup.name} 
                onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                placeholder="Mon groupe d&apos;entraînement"
              />
              <Input 
                label="Description" 
                value={newGroup.description} 
                onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                placeholder="Description du groupe..."
              />
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                <div>
                  <p className="font-medium text-sm">Groupe privé</p>
                  <p className="text-xs text-muted">Code d&apos;invitation requis</p>
                </div>
                <input
                  type="checkbox"
                  checked={newGroup.isPrivate}
                  onChange={(e) => setNewGroup({...newGroup, isPrivate: e.target.checked})}
                  className="w-5 h-5 rounded"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowCreate(false)} className="flex-1 rounded-xl">Annuler</Button>
                <Button onClick={handleCreate} className="flex-1 rounded-xl">Créer</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Modal */}
      {showJoin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowJoin(false)}>
          <div className="bg-card p-6 rounded-3xl w-full max-w-md border border-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-1">Rejoindre un groupe</h3>
            <p className="text-sm text-muted mb-6">Entrez le code d&apos;invitation partagé par l&apos;admin</p>
            <div className="space-y-4">
              <Input 
                label="Code d&apos;invitation" 
                value={inviteCode} 
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="XXXXXXXX"
              />
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowJoin(false)} className="flex-1 rounded-xl">Annuler</Button>
                <Button onClick={handleJoin} className="flex-1 rounded-xl">Rejoindre</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// NOTIFICATIONS TAB
// ============================================================================

function NotificationsTab() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading, fetchNotifications } = useNotificationsStore();

  useEffect(() => {
    fetchNotifications().then(() => {
      const { unreadCount: count } = useNotificationsStore.getState();
      if (count > 0) {
        markAllAsRead();
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request': return <UserPlus className="w-5 h-5" />;
      case 'challenge': return <Trophy className="w-5 h-5" />;
      case 'like': return <Heart className="w-5 h-5" />;
      case 'message': return <MessageCircle className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'friend_request': return 'bg-blue-500/10 text-blue-500';
      case 'challenge': return 'bg-yellow-500/10 text-yellow-500';
      case 'like': return 'bg-red-500/10 text-red-500';
      case 'message': return 'bg-green-500/10 text-green-500';
      default: return 'bg-muted text-muted';
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notifications
          {unreadCount > 0 && (
            <GradientBadge variant="danger" size="sm" className="rounded-full">{unreadCount}</GradientBadge>
          )}
        </h3>
        {unreadCount > 0 && (
          <Button size="sm" variant="ghost" onClick={handleMarkAllAsRead}>
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
            <Bell className="w-12 h-12 text-primary/50" />
          </div>
          <p className="font-semibold text-lg">Aucune notification</p>
          <p className="text-sm text-muted mt-2">Vous serez notifié des nouvelles activités</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <GlassCard 
              key={notification.id}
              padding="sm"
              className={`cursor-pointer ${
                notification.unread 
                  ? 'border-primary/20 shadow-sm' 
                  : ''
              }`}
              onClick={() => notification.unread && handleMarkAsRead(notification.id)}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${getNotificationColor(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notification.unread ? 'font-semibold' : 'font-medium'}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    {new Date(notification.created_at || Date.now()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {notification.unread && (
                  <div className="w-2.5 h-2.5 bg-primary rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SocialContent() {
  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'groups' | 'rankings' | 'notifications'>('feed');

  const tabs = [
    { id: 'feed', label: 'Fil', icon: Flame },
    { id: 'friends', label: 'Amis', icon: Users },
    { id: 'groups', label: 'Groupes', icon: Users2 },
    { id: 'rankings', label: 'Classement', icon: Trophy },
    { id: 'notifications', label: 'Notifs', icon: Bell },
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Social
        </h1>
        <p className="text-muted mt-1">Connectez-vous avec d&apos;autres athlètes</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-card border border-border text-muted hover:text-foreground hover:border-primary/30'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === 'feed' && <FeedTab />}
        {activeTab === 'friends' && <FriendsTab />}
        {activeTab === 'groups' && <GroupsTab />}
        {activeTab === 'rankings' && <LeaderboardTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
      </div>
    </div>
  );
}
