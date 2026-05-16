'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Avatar, Skeleton, GlassCard, GlassCardContent } from '@/components/ui';
import { api } from '@/lib/api';
import type { SocialFeedItem } from '@/types';
import CommentModal from '../modals/CommentModal';
import { Flame, MapPin, Clock, TrendingUp, Heart, MessageCircle, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

function getSportGradient(type: string) {
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

function formatPace(speedMs: number): string {
  if (!speedMs || speedMs <= 0) return '--';
  const paceMinPerKm = 1000 / (speedMs * 60);
  const mins = Math.floor(paceMinPerKm);
  const secs = Math.round((paceMinPerKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function FeedTab() {
  const [activities, setActivities] = useState<SocialFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commentActivityId, setCommentActivityId] = useState<number | null>(null);
  const [displayCount, setDisplayCount] = useState(10);

  const loadFeed = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const data = await api.getSocialFeed();
      setActivities(data || []);
    } catch {
      /* silent */
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const handleLike = async (activityId: number, currentLiked: boolean) => {
    setActivities(prev => prev.map(a =>
      a.id === activityId
        ? { ...a, user_liked: !currentLiked, like_count: currentLiked ? (a.like_count ?? 0) - 1 : (a.like_count ?? 0) + 1 }
        : a
    ));
    try {
      if (currentLiked) await api.unlikeActivity(activityId);
      else await api.likeActivity(activityId);
    } catch {
      setActivities(prev => prev.map(a =>
        a.id === activityId
          ? { ...a, user_liked: currentLiked, like_count: currentLiked ? (a.like_count ?? 0) + 1 : (a.like_count ?? 0) - 1 }
          : a
      ));
      toast.error('Erreur');
    }
  };

  const handleCommentCountChange = (activityId: number, delta: number) => {
    setActivities(prev => prev.map(a =>
      a.id === activityId
        ? { ...a, comment_count: (a.comment_count ?? 0) + delta }
        : a
    ));
  };

  if (isLoading) {
    return (
      <div className="space-y-3 md:space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-3xl" />)}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 md:py-16">
        <div className="w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
          <Flame className="w-8 h-8 md:w-12 md:h-12 text-peak/50" />
        </div>
        <p className="font-semibold text-base md:text-lg">Aucune activité récente</p>
        <p className="text-sm text-muted mt-2">Ajoutez des amis pour voir leurs activités</p>
      </div>
    );
  }

  const displayed = activities.slice(0, displayCount);

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted">{activities.length} activité{activities.length > 1 ? 's' : ''}</p>
        <button
          onClick={() => loadFeed(true)}
          disabled={isRefreshing}
          className="text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-50 min-h-[36px] px-3"
        >
          {isRefreshing ? 'Rafraîchissement...' : 'Rafraîchir'}
        </button>
      </div>

      <div className="grid gap-3 md:gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {displayed.map((activity) => (
          <GlassCard key={activity.id} hover className="overflow-hidden flex flex-col">
            <div className={`h-1.5 bg-gradient-to-r ${getSportGradient(activity.type || '')}`} />
            <GlassCardContent className="p-4 md:p-5 flex-1 flex flex-col">
              {/* User header */}
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar name={activity.owner_name} size="md" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-card" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm md:text-base truncate">{activity.owner_name}</p>
                    <p className="text-xs text-muted truncate">{activity.start_date_local ? new Date(activity.start_date_local).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 bg-gradient-to-r ${getSportGradient(activity.type || '')} text-white border-0`}>
                  {activity.type}
                </span>
              </div>

              {/* Activity name */}
              <h4 className="font-bold text-base md:text-lg mb-3 truncate">{activity.name}</h4>

              {/* Stats */}
              <div className="flex flex-wrap gap-2 md:gap-4 mb-4">
                {(activity.distance ?? 0) > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-2 rounded-xl bg-muted/50">
                    <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary shrink-0" />
                    <span className="text-xs md:text-sm font-medium">{((activity.distance ?? 0) / 1000).toFixed(2)} km</span>
                  </div>
                )}
                {(activity.moving_time ?? 0) > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-2 rounded-xl bg-muted/50">
                    <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary shrink-0" />
                    <span className="text-xs md:text-sm font-medium">{Math.floor((activity.moving_time ?? 0) / 60)} min</span>
                  </div>
                )}
                {((activity.average_speed as number) ?? 0) > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-2 rounded-xl bg-muted/50">
                    <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary shrink-0" />
                    <span className="text-xs md:text-sm font-medium">{formatPace(activity.average_speed as number)} /km</span>
                  </div>
                )}
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-border mt-auto">
                <button
                  onClick={() => handleLike(activity.id, !!activity.user_liked)}
                  className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-full transition-all min-h-[36px] ${
                    activity.user_liked
                      ? 'bg-danger/20 text-danger'
                      : 'bg-muted text-muted hover:bg-danger/10 hover:text-danger'
                  }`}
                >
                  <Heart className={`w-4 h-4 md:w-5 md:h-5 ${activity.user_liked ? 'fill-current' : ''}`} />
                  <span className="font-semibold text-xs md:text-sm">{activity.like_count || 0}</span>
                </button>

                <div className="flex items-center gap-1 md:gap-2">
                  <Button size="sm" variant="ghost" className="rounded-full text-xs md:text-sm min-h-[36px]" onClick={() => setCommentActivityId(activity.id)}>
                    <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" />
                    {(activity as SocialFeedItem & { comment_count?: number }).comment_count || 'Commenter'}
                  </Button>
                  <Button size="sm" variant="ghost" className="rounded-full min-h-[36px] min-w-[36px] p-0">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </GlassCardContent>
          </GlassCard>
        ))}
      </div>

      {displayCount < activities.length && (
        <div className="text-center pt-4">
          <Button variant="secondary" onClick={() => setDisplayCount(d => d + 10)} className="rounded-xl">
            Voir plus ({activities.length - displayCount} restantes)
          </Button>
        </div>
      )}

      {commentActivityId !== null && (
        <CommentModal
          activityId={commentActivityId}
          onClose={() => setCommentActivityId(null)}
          onCommentCountChange={(delta) => handleCommentCountChange(commentActivityId, delta)}
        />
      )}
    </>
  );
}
