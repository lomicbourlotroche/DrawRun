'use client';

import React, { useState, useEffect } from 'react';
import { Button, Avatar, Skeleton, GlassCard } from '@/components/ui';
import { Users, UserPlus, Search, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFriends } from '@/hooks/useSocial';
import { FRIENDS_CONSTANTS } from '@/constants/social';

export default function FriendsTab() {
  const {
    friends,
    requests,
    isLoading,
    error,
    searchResults,
    isSearching,
    handleSearch: handleSearchFromHook,
    handleAddFriend,
    handleAccept,
    handleRemove,
  } = useFriends();

  const [searchQuery, setSearchQuery] = useState('');

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= FRIENDS_CONSTANTS.MIN_SEARCH_LENGTH) {
        handleSearchFromHook(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearchFromHook]);

  // Show errors
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSearch = () => {
    if (searchQuery.length >= FRIENDS_CONSTANTS.MIN_SEARCH_LENGTH) {
      handleSearchFromHook(searchQuery);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 md:space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
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
          onKeyDown={handleKeyDown}
          aria-label="Rechercher un athlète"
          className="w-full pl-12 pr-16 py-3 rounded-2xl bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
        />
        {searchQuery.length >= FRIENDS_CONSTANTS.MIN_SEARCH_LENGTH && (
          <button
            onClick={handleSearch}
            disabled={isSearching}
            aria-label={isSearching ? 'Recherche en cours' : 'Lancer la recherche'}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted">Résultats</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {searchResults.slice(0, FRIENDS_CONSTANTS.MAX_SEARCH_RESULTS).map((user) => (
              <GlassCard key={user.id} padding="sm" hover>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={user.name} size="md" />
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{user.name}</p>
                      <p className="text-xs text-muted truncate">{user.email}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="rounded-xl shrink-0 min-h-[36px]"
                    onClick={() => handleAddFriend(user.id)}
                    aria-label={`Ajouter ${user.name} comme ami`}
                  >
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
            <div className="w-2 h-2 bg-peak rounded-full animate-pulse" />
            <h3 className="text-sm font-semibold">Demandes en attente</h3>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-peak/10 text-peak font-medium">
              {requests.length}
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {requests.map((req) => (
              <GlassCard key={req.userId || req.user_id || 0} padding="sm" hover>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={req.name} size="md" />
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{req.name}</p>
                      <p className="text-xs text-muted truncate">{req.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="rounded-xl bg-success hover:bg-success min-h-[36px] min-w-[36px] p-0"
                      onClick={() => handleAccept(req.userId || req.user_id || 0)}
                      aria-label={`Accepter la demande d'ami de ${req.name}`}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-xl text-muted hover:text-danger min-h-[36px] min-w-[36px] p-0"
                      onClick={() => handleRemove(req.userId || req.user_id || 0)}
                      aria-label={`Refuser la demande d'ami de ${req.name}`}
                    >
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
          <div className="text-center py-8 md:py-12">
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
              <Users className="w-8 h-8 md:w-10 md:h-10 text-primary/50" />
            </div>
            <p className="font-medium">Aucun ami pour le moment</p>
            <p className="text-sm text-muted mt-1">Recherchez des athlètes pour vous connecter</p>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {friends.map((friend) => (
              <GlassCard key={friend.id || friend.friend_id || friend.user_id || 0} padding="sm" hover>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <Avatar name={friend.name} size="md" />
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-success rounded-full border-2 border-card" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{friend.name}</p>
                      <p className="text-xs text-muted">
                        Amis depuis {new Date(friend.accepted_at || friend.created_at || '').toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-xl text-muted hover:text-danger shrink-0 min-h-[36px] min-w-[36px] p-0"
                    onClick={() => handleRemove(friend.id || friend.friend_id || friend.user_id || 0)}
                    aria-label={`Supprimer ${friend.name} de mes amis`}
                  >
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
