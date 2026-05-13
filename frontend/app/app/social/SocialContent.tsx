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
import { 
  Users, UserPlus, Search, Trophy, MessageCircle, 
  Heart, MapPin, Clock, Flame, TrendingUp, Users2,
  Loader2, X, Check, Copy, Activity, ChevronRight, Sparkles
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
// CHALLENGES TAB
// ============================================================================

// Challenge mode definitions
const CHALLENGE_MODES = [
  { id: 'quota',       label: 'Quota total',     icon: '🎯', desc: 'Atteindre un objectif cumulé sur la durée' },
  { id: 'progressive', label: 'Jauge progressive', icon: '📈', desc: 'Objectif qui augmente chaque semaine' },
  { id: 'streak',      label: 'Streak',           icon: '🔥', desc: 'Courir X jours consécutifs' },
  { id: 'frequency',   label: 'Fréquence',        icon: '📅', desc: 'X sorties par semaine pendant N semaines' },
  { id: 'pace',        label: 'Performance',      icon: '⚡', desc: 'Réaliser une sortie à une allure cible' },
] as const;

const CHALLENGE_TYPES = [
  { id: 'distance',   label: 'Distance',    unit: 'km',         icon: '📏', modes: ['quota','progressive','streak'] },
  { id: 'elevation',  label: 'Dénivelé',    unit: 'm',          icon: '⛰️', modes: ['quota','progressive'] },
  { id: 'time',       label: 'Temps actif', unit: 'min',        icon: '⏱️', modes: ['quota','progressive','streak'] },
  { id: 'activities', label: 'Activités',   unit: 'sorties',    icon: '📊', modes: ['quota','frequency','streak'] },
  { id: 'pace',       label: 'Allure cible', unit: 'min/km',    icon: '⚡', modes: ['pace'] },
] as const;

const SPORT_TYPES = [
  { id: 'any',  label: 'Tous sports', icon: '🏅' },
  { id: 'run',  label: 'Course',      icon: '🏃' },
  { id: 'bike', label: 'Vélo',        icon: '🚴' },
  { id: 'swim', label: 'Natation',    icon: '🏊' },
  { id: 'hike', label: 'Randonnée',   icon: '🥾' },
];

const BADGE_ICONS = ['🏆','🔥','⚡','🎯','💪','🌟','🚀','🏅','💎','🦁','🐉','🌈'];

const PRESET_CHALLENGES = [
  { title: '100km en 30 jours', type: 'distance', target_value: 100, duration_days: 30, challenge_mode: 'quota', badge_icon: '🏃', sport_type: 'run' },
  { title: 'Everest Challenge', type: 'elevation', target_value: 8848, duration_days: 30, challenge_mode: 'quota', badge_icon: '⛰️', sport_type: 'any' },
  { title: 'Streak 30 jours', type: 'activities', target_value: 30, duration_days: 30, challenge_mode: 'streak', streak_days: 30, badge_icon: '🔥', sport_type: 'any' },
  { title: 'Montée en puissance', type: 'distance', target_value: 20, duration_days: 42, challenge_mode: 'progressive', weekly_target: 20, weekly_increase_pct: 10, badge_icon: '📈', sport_type: 'run' },
  { title: '3 sorties/semaine', type: 'activities', target_value: 12, duration_days: 28, challenge_mode: 'frequency', frequency_per_week: 3, badge_icon: '📅', sport_type: 'any' },
];

type ChallengeForm = {
  title: string; description: string; type: string; target_value: string;
  end_date: string; challenge_mode: string; weekly_target: string;
  weekly_increase_pct: string; streak_days: string; frequency_per_week: string;
  sport_type: string; badge_icon: string; is_public: boolean;
};

function ChallengesTab() {
  const [publicChallenges, setPublicChallenges] = useState<Array<{
    id: number; title: string; description: string; type: string;
    target_value: number; target_unit: string; duration_days: number;
    participant_count: number; created_at: string; challenge_mode?: string;
    badge_icon?: string; sport_type?: string; milestones?: string;
    weekly_target?: number; weekly_increase_pct?: number;
    streak_days?: number; frequency_per_week?: number; creator_name?: string;
  }>>([]);
  const [myChallenges, setMyChallenges] = useState<Array<{
    id: number; title: string; description: string; type: string;
    target_value: number; target_unit: string; progress: number;
    user_status: string; start_date: string; end_date: string;
    challenge_mode?: string; badge_icon?: string; milestones?: string;
    streak_current?: number; streak_best?: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1=mode, 2=type+target, 3=details
  const [form, setForm] = useState<ChallengeForm>({
    title: '', description: '', type: 'distance', target_value: '',
    end_date: '', challenge_mode: 'quota', weekly_target: '',
    weekly_increase_pct: '10', streak_days: '', frequency_per_week: '3',
    sport_type: 'any', badge_icon: '🏆', is_public: true,
  });
  const [isCreating, setIsCreating] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pub, mine] = await Promise.all([
        api.getPublicChallenges().catch(() => []),
        api.getUserChallenges().catch(() => []),
      ]);
      setPublicChallenges((pub as typeof publicChallenges) || []);
      setMyChallenges((mine as typeof myChallenges) || []);
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const applyPreset = (preset: typeof PRESET_CHALLENGES[number]) => {
    setForm(p => ({
      ...p,
      title: preset.title,
      type: preset.type,
      target_value: String(preset.target_value),
      challenge_mode: preset.challenge_mode,
      badge_icon: preset.badge_icon,
      sport_type: preset.sport_type,
      weekly_target: 'weekly_target' in preset ? String((preset as {weekly_target?: number}).weekly_target ?? '') : '',
      weekly_increase_pct: 'weekly_increase_pct' in preset ? String((preset as {weekly_increase_pct?: number}).weekly_increase_pct ?? '10') : '10',
      streak_days: 'streak_days' in preset ? String((preset as {streak_days?: number}).streak_days ?? '') : '',
      frequency_per_week: 'frequency_per_week' in preset ? String((preset as {frequency_per_week?: number}).frequency_per_week ?? '3') : '3',
      end_date: new Date(Date.now() + preset.duration_days * 86400000).toISOString().split('T')[0],
    }));
    setWizardStep(2);
  };

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setIsCreating(true);
    try {
      const durationDays = form.end_date
        ? Math.max(1, Math.ceil((new Date(form.end_date).getTime() - Date.now()) / 86400000))
        : 30;
      await api.createChallenge({
        title: form.title,
        description: form.description,
        type: form.type,
        target_value: parseFloat(form.target_value) || 0,
        duration_days: durationDays,
        is_public: form.is_public,
        challenge_mode: form.challenge_mode,
        badge_icon: form.badge_icon,
        sport_type: form.sport_type,
        weekly_target: form.weekly_target ? parseFloat(form.weekly_target) : undefined,
        weekly_increase_pct: form.weekly_increase_pct ? parseFloat(form.weekly_increase_pct) : undefined,
        streak_days: form.streak_days ? parseInt(form.streak_days) : undefined,
        frequency_per_week: form.frequency_per_week ? parseInt(form.frequency_per_week) : undefined,
      });
      toast.success('Défi créé ! 🏆');
      setShowCreate(false);
      setWizardStep(1);
      setForm({ title: '', description: '', type: 'distance', target_value: '', end_date: '', challenge_mode: 'quota', weekly_target: '', weekly_increase_pct: '10', streak_days: '', frequency_per_week: '3', sport_type: 'any', badge_icon: '🏆', is_public: true });
      load();
    } catch { toast.error('Erreur lors de la création'); }
    finally { setIsCreating(false); }
  };

  const handleJoin = async (id: number) => {
    try {
      const res = await api.joinChallenge(id);
      if (res.success) { toast.success('Défi rejoint ! 🎯'); load(); }
      else toast.error(res.error || 'Erreur');
    } catch { toast.error('Erreur'); }
  };

  const getModeInfo = (mode: string) => CHALLENGE_MODES.find(m => m.id === mode) || CHALLENGE_MODES[0];
  const getTypeInfo = (type: string) => CHALLENGE_TYPES.find(t => t.id === type) || CHALLENGE_TYPES[0];

  const getMilestones = (c: { milestones?: string }) => {
    if (!c.milestones) return [{ pct: 25, label: 'Bronze', icon: '🥉' }, { pct: 50, label: 'Argent', icon: '🥈' }, { pct: 75, label: 'Or', icon: '🥇' }, { pct: 100, label: 'Légendaire', icon: '💎' }];
    try { return JSON.parse(c.milestones); } catch { return []; }
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 100) return 'bg-yellow-400';
    if (pct >= 75) return 'bg-green-500';
    if (pct >= 50) return 'bg-blue-500';
    if (pct >= 25) return 'bg-orange-400';
    return 'bg-primary';
  };

  const formatDaysLeft = (endDate: string) => {
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
    if (days < 0) return 'Terminé';
    if (days === 0) return 'Dernier jour !';
    return `${days}j restants`;
  };

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Défis
        </h3>
        <Button size="sm" onClick={() => { setShowCreate(true); setWizardStep(1); }} className="rounded-xl gap-1">
          <Sparkles className="w-4 h-4" /> Créer un défi
        </Button>
      </div>

      {/* Mes défis en cours */}
      {myChallenges.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted uppercase tracking-wide">Mes défis</p>
          {myChallenges.map(c => {
            const pct = Math.min(100, c.progress || 0);
            const milestones = getMilestones(c);
            const nextMilestone = milestones.find((m: {pct:number}) => m.pct > pct);
            const mode = getModeInfo(c.challenge_mode || 'quota');
            return (
              <GlassCard key={c.id} padding="sm">
                <GlassCardContent>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-2xl">{c.badge_icon || '🏆'}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{c.title}</p>
                          <p className="text-xs text-muted">{mode.icon} {mode.label} · {getTypeInfo(c.type).icon} {c.target_value} {c.target_unit}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${c.user_status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
                        {c.user_status === 'completed' ? '✓ Terminé' : formatDaysLeft(c.end_date)}
                      </span>
                    </div>
                    {c.challenge_mode === 'streak' && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1"><span className="text-orange-400">🔥</span><span className="font-bold">{c.streak_current || 0}</span><span className="text-muted text-xs">actuel</span></div>
                        <div className="flex items-center gap-1"><span className="text-yellow-400">⭐</span><span className="font-bold">{c.streak_best || 0}</span><span className="text-muted text-xs">record</span></div>
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="relative w-full bg-border rounded-full h-3">
                        <div className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(pct)}`} style={{ width: `${pct}%` }} />
                        {milestones.map((m: {pct:number}) => (
                          <div key={m.pct} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2" style={{ left: `${m.pct}%` }}>
                            <div className={`w-0.5 h-4 rounded-full ${pct >= m.pct ? 'bg-white/80' : 'bg-muted/40'}`} />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-muted">
                        <span className="font-medium text-foreground">{pct.toFixed(0)}%</span>
                        {nextMilestone && <span>{(nextMilestone as {icon:string}).icon} {(nextMilestone as {label:string}).label} à {(nextMilestone as {pct:number}).pct}%</span>}
                        <span>{c.target_value} {c.target_unit}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {milestones.map((m: {pct:number; label:string; icon:string}) => (
                        <div key={m.pct} className={`flex-1 text-center py-1 rounded-lg text-xs transition-all ${pct >= m.pct ? 'bg-yellow-500/20 text-yellow-600 font-medium' : 'bg-border/50 text-muted'}`}>
                          {m.icon} {m.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Défis publics */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted uppercase tracking-wide">Défis publics</p>
        {publicChallenges.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-muted opacity-30" />
            <p className="text-muted text-sm">Aucun défi public pour l&apos;instant</p>
            <p className="text-xs text-muted mt-1">Soyez le premier à en créer un !</p>
          </div>
        ) : publicChallenges.map(c => {
          const alreadyJoined = myChallenges.some(m => m.id === c.id);
          const mode = getModeInfo(c.challenge_mode || 'quota');
          return (
            <GlassCard key={c.id} padding="sm">
              <GlassCardContent>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="text-2xl shrink-0">{c.badge_icon || '🏆'}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{c.title}</p>
                      {c.description && <p className="text-xs text-muted mb-1 line-clamp-1">{c.description}</p>}
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">{mode.icon} {mode.label}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-border text-muted">{getTypeInfo(c.type).icon} {c.target_value} {c.target_unit}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-border text-muted">⏳ {c.duration_days}j</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-border text-muted">👥 {c.participant_count || 0}</span>
                      </div>
                      {c.creator_name && <p className="text-xs text-muted mt-1">par {c.creator_name}</p>}
                    </div>
                  </div>
                  {!alreadyJoined ? (
                    <Button size="sm" variant="secondary" onClick={() => handleJoin(c.id)} className="rounded-xl shrink-0">Rejoindre</Button>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500 font-medium shrink-0">✓ Rejoint</span>
                  )}
                </div>
              </GlassCardContent>
            </GlassCard>
          );
        })}
      </div>

      {/* ===== WIZARD CRÉATION ===== */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" />Créer un défi</h3>
                <button onClick={() => { setShowCreate(false); setWizardStep(1); }} className="p-2 rounded-xl hover:bg-border transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex gap-1">{[1,2,3].map(s => <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= wizardStep ? 'bg-primary' : 'bg-border'}`} />)}</div>
              <p className="text-xs text-muted mt-2">{wizardStep === 1 && 'Étape 1 — Choisir le mode'}{wizardStep === 2 && 'Étape 2 — Définir l\'objectif'}{wizardStep === 3 && 'Étape 3 — Personnaliser'}</p>
            </div>
            <div className="px-6 py-5 max-h-[65vh] overflow-y-auto space-y-4">
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">⚡ Démarrage rapide</p>
                    <div className="grid grid-cols-1 gap-2">
                      {PRESET_CHALLENGES.map(p => (
                        <button key={p.title} onClick={() => applyPreset(p)} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left">
                          <span className="text-2xl">{p.badge_icon}</span>
                          <div><p className="text-sm font-medium">{p.title}</p><p className="text-xs text-muted">{getModeInfo(p.challenge_mode).label} · {p.target_value} {getTypeInfo(p.type).unit}</p></div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div><div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted">ou créer sur mesure</span></div></div>
                  <div>
                    <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Mode du défi</p>
                    <div className="grid grid-cols-1 gap-2">
                      {CHALLENGE_MODES.map(m => (
                        <button key={m.id} onClick={() => setForm(p => ({ ...p, challenge_mode: m.id }))} className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${form.challenge_mode === m.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'}`}>
                          <span className="text-xl">{m.icon}</span>
                          <div className="flex-1"><p className="text-sm font-medium">{m.label}</p><p className="text-xs text-muted">{m.desc}</p></div>
                          {form.challenge_mode === m.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Sport</p>
                    <div className="flex flex-wrap gap-2">
                      {SPORT_TYPES.map(s => (
                        <button key={s.id} onClick={() => setForm(p => ({ ...p, sport_type: s.id }))} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border transition-all ${form.sport_type === s.id ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:border-primary/30'}`}>{s.icon} {s.label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Métrique</p>
                    <div className="grid grid-cols-2 gap-2">
                      {CHALLENGE_TYPES.filter(t => (t.modes as readonly string[]).includes(form.challenge_mode)).map(t => (
                        <button key={t.id} onClick={() => setForm(p => ({ ...p, type: t.id }))} className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${form.type === t.id ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:border-primary/30'}`}>
                          <span>{t.icon}</span><div className="text-left"><p className="text-sm">{t.label}</p><p className="text-xs text-muted">{t.unit}</p></div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {form.challenge_mode !== 'streak' && form.challenge_mode !== 'frequency' && (
                    <Input label={`Objectif (${getTypeInfo(form.type).unit})`} type="number" value={form.target_value} onChange={e => setForm(p => ({ ...p, target_value: e.target.value }))} placeholder={form.type === 'distance' ? 'Ex: 100' : form.type === 'elevation' ? 'Ex: 2000' : 'Ex: 600'} />
                  )}
                  {form.challenge_mode === 'progressive' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Input label={`Départ sem. 1 (${getTypeInfo(form.type).unit})`} type="number" value={form.weekly_target} onChange={e => setForm(p => ({ ...p, weekly_target: e.target.value }))} placeholder="Ex: 20" />
                      <Input label="Augmentation/sem. (%)" type="number" value={form.weekly_increase_pct} onChange={e => setForm(p => ({ ...p, weekly_increase_pct: e.target.value }))} placeholder="Ex: 10" />
                    </div>
                  )}
                  {form.challenge_mode === 'streak' && (
                    <Input label="Jours consécutifs requis" type="number" value={form.streak_days} onChange={e => setForm(p => ({ ...p, streak_days: e.target.value, target_value: e.target.value }))} placeholder="Ex: 30" />
                  )}
                  {form.challenge_mode === 'frequency' && (
                    <Input label="Sorties par semaine" type="number" value={form.frequency_per_week} onChange={e => setForm(p => ({ ...p, frequency_per_week: e.target.value }))} placeholder="Ex: 3" />
                  )}
                  <Input label="Date de fin" type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} />
                </div>
              )}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <Input label="Nom du défi *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: 100km en juin" />
                  <div>
                    <label className="text-xs font-medium text-muted uppercase tracking-wide mb-1 block">Description</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Décrivez votre défi, les règles, la motivation..." rows={3} className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:border-primary outline-none resize-none" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Badge</p>
                    <div className="flex flex-wrap gap-2">
                      {BADGE_ICONS.map(icon => (
                        <button key={icon} onClick={() => setForm(p => ({ ...p, badge_icon: icon }))} className={`w-10 h-10 text-xl rounded-xl border transition-all ${form.badge_icon === icon ? 'border-primary bg-primary/10 scale-110' : 'border-border hover:border-primary/30'}`}>{icon}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                    <div><p className="text-sm font-medium">Défi public</p><p className="text-xs text-muted">Visible et rejoignable par tous</p></div>
                    <button onClick={() => setForm(p => ({ ...p, is_public: !p.is_public }))} className={`w-12 h-6 rounded-full transition-all relative ${form.is_public ? 'bg-primary' : 'bg-border'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_public ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                    <p className="text-sm font-semibold">{form.badge_icon} {form.title || 'Mon défi'}</p>
                    <p className="text-xs text-muted">{getModeInfo(form.challenge_mode).icon} {getModeInfo(form.challenge_mode).label} · {getTypeInfo(form.type).icon} {form.target_value || '?'} {getTypeInfo(form.type).unit}</p>
                    {form.end_date && <p className="text-xs text-muted">⏳ Jusqu&apos;au {new Date(form.end_date).toLocaleDateString('fr-FR')}</p>}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-border flex gap-3">
              {wizardStep > 1 && <Button variant="secondary" onClick={() => setWizardStep(s => s - 1)} className="rounded-xl">← Retour</Button>}
              {wizardStep < 3 ? (
                <Button onClick={() => setWizardStep(s => s + 1)} className="flex-1 rounded-xl" disabled={wizardStep === 2 && !form.target_value && form.challenge_mode !== 'frequency'}>Suivant →</Button>
              ) : (
                <Button onClick={handleCreate} disabled={isCreating || !form.title.trim()} className="flex-1 rounded-xl">
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : '🏆 Créer le défi'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SocialContent() {
  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'groups' | 'challenges' | 'rankings'>('feed');

  const tabs = [
    { id: 'feed', label: 'Fil', icon: Flame },
    { id: 'friends', label: 'Amis', icon: Users },
    { id: 'groups', label: 'Groupes', icon: Users2 },
    { id: 'challenges', label: 'Défis', icon: Trophy },
    { id: 'rankings', label: 'Classement', icon: TrendingUp },
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
        {activeTab === 'challenges' && <ChallengesTab />}
        {activeTab === 'rankings' && <LeaderboardTab />}
      </div>
    </div>
  );
}
