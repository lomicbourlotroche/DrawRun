/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Input, Badge, Avatar, Skeleton } from '@/components/ui';
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
  Users, UserPlus, Search, Trophy, Target, MessageCircle, 
  Heart, MapPin, Clock, Flame, Users2, X, Check, Copy, Bell, Activity, ChevronRight, Sparkles
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
      /* silencieux — friends reste vide */
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    try {
      const results = await api.searchUsers(searchQuery);
      setSearchResults(results || []);
    } catch (e) {
      toast.error('Erreur');
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
          className="w-full pl-12 pr-4 py-3 rounded-2xl bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
        />
        {searchQuery.length >= 2 && (
          <button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted">Résultats</h3>
          <div className="space-y-2">
            {searchResults.map((user) => (
              <div key={user.id} className="group p-4 bg-card border border-border rounded-2xl hover:border-primary/30 hover:shadow-lg transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar name={user.name} size="md" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-card" />
                    </div>
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs text-muted">Membre depuis {new Date(user.memberSince || user.member_since || '').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <Button size="md" className="rounded-xl" onClick={() => handleAddFriend(user.id)}>
                    <UserPlus className="w-4 h-4 mr-1" />
                    Ajouter
                  </Button>
                </div>
              </div>
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
            <Badge variant="default" className="bg-orange-500 text-white">{requests.length}</Badge>
          </div>
          <div className="grid gap-2">
            {requests.map((req) => (
              <div key={req.userId || req.user_id || 0} className="p-4 bg-gradient-to-r from-orange-500/10 to-amber-500/5 border border-orange-500/20 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar name={req.name} size="md" />
                    <div>
                      <p className="font-semibold">{req.name}</p>
                      <p className="text-xs text-muted">{req.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="md" className="rounded-xl bg-success hover:bg-success/90" onClick={() => handleAccept(req.userId || req.user_id || 0)}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="md" variant="ghost" className="rounded-xl text-muted hover:text-danger" onClick={() => handleRemove(req.userId || req.user_id || 0)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
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
        {isLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : friends.length === 0 ? (
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
              <div key={friend.id || friend.friend_id || friend.user_id || 0} className="group p-4 bg-card border border-border rounded-2xl hover:border-primary/30 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar name={friend.name} size="md" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-card" />
                    </div>
                    <div>
                      <p className="font-semibold">{friend.name}</p>
                      <p className="text-xs text-muted">Amis depuis {new Date(friend.accepted_at || friend.created_at || '').toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <Button size="md" variant="ghost" className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-danger" onClick={() => handleRemove(friend.id || friend.user_id || 0)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
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

  const loadFeed = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getSocialFeed();
      setActivities(data || []);
    } catch {
      /* silencieux — feed reste vide */
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

  const getSportGradient = (type: string) => {
    const gradients: Record<string, string> = {
      Running: 'from-orange-500 to-red-500',
      Cycling: 'from-blue-500 to-cyan-500',
      Swimming: 'from-cyan-500 to-blue-400',
      Hiking: 'from-green-500 to-emerald-500',
      Walking: 'from-teal-500 to-green-500',
    };
    return gradients[type] || 'from-primary to-blue-500';
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-3xl" />)}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
            <Flame className="w-12 h-12 text-orange-500/50" />
          </div>
          <p className="font-semibold text-lg">Aucune activité récente</p>
          <p className="text-sm text-muted mt-2">Ajoutez des amis pour voir leurs activités</p>
        </div>
      ) : (
        activities.map((activity) => (
          <div key={activity.id} className="group bg-card border border-border rounded-3xl overflow-hidden hover:border-primary/30 hover:shadow-xl transition-all duration-300">
            {/* Header gradient bar */}
            <div className={`h-1.5 bg-gradient-to-r ${getSportGradient(activity.type || '')}`} />
            
            <div className="p-5">
              {/* User header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar name={activity.owner_name} size="md" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success rounded-full border-2 border-card" />
                  </div>
                  <div>
                    <p className="font-semibold">{activity.owner_name}</p>
                    <p className="text-xs text-muted">{activity.start_date_local ? new Date(activity.start_date_local).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}</p>
                  </div>
                </div>
                <Badge className={`bg-gradient-to-r ${getSportGradient(activity.type || '')} text-white border-0 rounded-full px-3 py-1`}>
                  {activity.type}
                </Badge>
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
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{((activity.average_speed as number ?? 0) * 3.6).toFixed(1)} km/h</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <button 
                  onClick={() => handleLike(activity.id, !!activity.user_liked)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    activity.user_liked 
                      ? 'bg-danger/20 text-danger' 
                      : 'bg-muted text-muted hover:bg-danger/10 hover:text-danger'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${activity.user_liked ? 'fill-current' : ''}`} />
                  <span className="font-semibold text-sm">{activity.like_count || 0}</span>
                </button>
                
                <div className="flex items-center gap-2">
                  <Button size="md" variant="ghost" className="rounded-full">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Commenter
                  </Button>
                  <Button size="md" variant="ghost" className="rounded-full">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ============================================================================
// LEADERBOARD TAB
// ============================================================================

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
      /* silencieux — leaderboard reste vide */
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
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-500/20 flex items-center justify-center">
            <Trophy className="w-12 h-12 text-yellow-500/50" />
          </div>
          <p className="font-semibold text-lg">Aucune donnée</p>
          <p className="text-sm text-muted mt-2">Commencez à vous entraîner pour apparaître ici</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Podium for top 3 */}
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
              <div 
                key={actualIndex} 
                className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl hover:border-primary/20 hover:shadow-md transition-all"
              >
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
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// GROUPS TAB
// ============================================================================

function GroupsTab() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });
  const [inviteCode, setInviteCode] = useState('');

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getGroups();
      setGroups(data || []);
    } catch {
      /* silencieux — groups reste vide */
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
      setNewGroup({ name: '', description: '' });
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

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1 rounded-xl" onClick={() => setShowJoin(true)}>
          <Users2 className="w-4 h-4 mr-2" />
          Rejoindre un groupe
        </Button>
        <Button className="flex-1 rounded-xl" onClick={() => setShowCreate(true)}>
          <Sparkles className="w-4 h-4 mr-2" />
          Créer un groupe
        </Button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-card p-6 rounded-3xl w-full max-w-md border border-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-1">Créer un groupe</h3>
            <p className="text-sm text-muted mb-6">Invitez vos amis à s'entraîner ensemble</p>
            <div className="space-y-4">
              <Input 
                label="Nom" 
                value={newGroup.name} 
                onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                placeholder="Mon groupe d'entraînement"
              />
              <Input 
                label="Description" 
                value={newGroup.description} 
                onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                placeholder="Description du groupe..."
              />
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
            <p className="text-sm text-muted mb-6">Entrez le code d'invitation partagé par l'admin</p>
            <div className="space-y-4">
              <Input 
                label="Code d'invitation" 
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

      {/* Groups List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
            <Users2 className="w-12 h-12 text-primary/50" />
          </div>
          <p className="font-semibold text-lg">Aucun groupe</p>
          <p className="text-sm text-muted mt-2">Créez ou rejoignez un groupe pour commencer</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {groups.map((group) => (
            <div key={group.id} className="p-5 bg-card border border-border rounded-2xl hover:border-primary/20 hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
                    <Users2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">{group.name}</h4>
                    {group.description && (
                      <p className="text-sm text-muted mt-1">{group.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="default" className="rounded-full">{group.member_count} membres</Badge>
                      {group.role === 'admin' && (
                        <Badge variant="primary" className="rounded-full bg-primary/10 text-primary">Admin</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {group.invite_code && (
                    <Button size="md" variant="ghost" className="rounded-xl" onClick={() => copyCode(group.invite_code || group.inviteCode || '')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                  {group.role !== 'admin' && (
                    <Button size="md" variant="ghost" className="rounded-xl text-muted hover:text-danger" onClick={() => handleLeave(group.id)}>
                      Quitter
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MESSAGES TAB
// ============================================================================

function MessagesTab() {
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-recovery/20 flex items-center justify-center">
        <MessageCircle className="w-12 h-12 text-primary/50" />
      </div>
      <p className="font-semibold text-lg">Messagerie à venir</p>
      <p className="text-sm text-muted mt-2">Cette fonctionnalité sera disponible prochainement</p>
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
      case 'friend_request': return 'bg-primary/10 text-primary';
      case 'challenge': return 'bg-warning/10 text-warning';
      case 'like': return 'bg-danger/10 text-danger';
      case 'message': return 'bg-success/10 text-success';
      default: return 'bg-muted text-muted';
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notifications
          {unreadCount > 0 && (
            <Badge variant="default" className="bg-danger text-white rounded-full">{unreadCount}</Badge>
          )}
        </h3>
        {unreadCount > 0 && (
          <Button size="md" variant="ghost" onClick={handleMarkAllAsRead}>
            Tout marquer comme lu
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : notifications.length === 0 ? (
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
            <div 
              key={notification.id}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                notification.unread 
                  ? 'bg-primary/5 border-primary/20 shadow-sm' 
                  : 'bg-card border-border hover:bg-muted/30'
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CLUBS TAB
// ============================================================================

function ClubsTab() {
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
        <Users className="w-12 h-12 text-purple-500/50" />
      </div>
      <p className="font-semibold text-lg">Clubs à venir</p>
      <p className="text-sm text-muted mt-2">Cette fonctionnalité sera disponible prochainement</p>
    </div>
  );
}

// ============================================================================
// CHALLENGES TAB
// ============================================================================

function ChallengesTab() {
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
        <Target className="w-12 h-12 text-orange-500/50" />
      </div>
      <p className="font-semibold text-lg">Défis à venir</p>
      <p className="text-sm text-muted mt-2">Cette fonctionnalité sera disponible prochainement</p>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/** @deprecated Use SocialContent from app/app/social/SocialContent.tsx instead. This component is kept for reference only. */
export default function SocialHub() {
  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'groups' | 'rankings' | 'challenges' | 'messages' | 'notifications' | 'clubs'>('feed');

  const tabs = [
    { id: 'feed', label: 'Fil', icon: Flame },
    { id: 'friends', label: 'Amis', icon: Users },
    { id: 'groups', label: 'Groupes', icon: Users2 },
    { id: 'rankings', label: 'Classement', icon: Trophy },
    { id: 'challenges', label: 'Défis', icon: Target },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'notifications', label: 'Notifs', icon: Bell },
    { id: 'clubs', label: 'Clubs', icon: Users },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
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
      <div className="animate-fade-in">
        {activeTab === 'feed' && <FeedTab />}
        {activeTab === 'friends' && <FriendsTab />}
        {activeTab === 'groups' && <GroupsTab />}
        {activeTab === 'rankings' && <LeaderboardTab />}
        {activeTab === 'challenges' && <ChallengesTab />}
        {activeTab === 'messages' && <MessagesTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'clubs' && <ClubsTab />}
      </div>
    </div>
  );
}
