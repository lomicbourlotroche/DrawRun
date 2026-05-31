'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Avatar, Skeleton, GlassCard, GlassCardContent } from '@/components/ui';
import type { SocialFeedItem } from '@/types';
import CommentModal from '../modals/CommentModal';
import { Flame, MapPin, Clock, TrendingUp, Heart, MessageCircle, ChevronRight } from '@/components/ui/icons';
import { toast } from 'sonner';
import { useFeed, getSportGradient, formatPace } from '@/hooks/useSocial';
import { SOCIAL_FEED_CONSTANTS } from '@/constants/social';

export default function FeedTab() {
  const {
    activities,
    isLoading,
    isRefreshing,
    error,
    displayCount,
    loadFeed,
    handleLike,
    setDisplayCount,
  } = useFeed();

  const [commentActivityId, setCommentActivityId] = useState<number | null>(null);

  // Show errors
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleCommentCountChange = useCallback(
    (_activityId: number, _delta: number) => {
      // This could be moved to useFeed hook if needed
      // For now, keeping it local as it's a UI concern
      // The actual comment count update would need to be handled by the hook
    },
    []
  );

  if (isLoading) {
    return (
      <div className="space-y-3 md:space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 rounded-3xl" />
        ))}
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
        <p className="text-xs text-muted">
          {activities.length} activité{activities.length > 1 ? 's' : ''}
        </p>
        <button
          onClick={() => loadFeed(true)}
          disabled={isRefreshing}
          aria-label={isRefreshing ? 'Rafraîchissement en cours' : 'Rafraîchir le fil'}
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
                    <p className="text-xs text-muted truncate">
                      {activity.start_date_local
                        ? new Date(activity.start_date_local).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })
                        : ''}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 bg-gradient-to-r ${getSportGradient(
                    activity.type || ''
                  )} text-white border-0`}
                >
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
                    <span className="text-xs md:text-sm font-medium">
                      {((activity.distance ?? 0) / 1000).toFixed(2)} km
                    </span>
                  </div>
                )}
                {(activity.moving_time ?? 0) > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-2 rounded-xl bg-muted/50">
                    <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary shrink-0" />
                    <span className="text-xs md:text-sm font-medium">
                      {Math.floor((activity.moving_time ?? 0) / 60)} min
                    </span>
                  </div>
                )}
                {((activity.average_speed as number) ?? 0) > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 md:py-2 rounded-xl bg-muted/50">
                    <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary shrink-0" />
                    <span className="text-xs md:text-sm font-medium">
                      {formatPace(activity.average_speed as number)} /km
                    </span>
                  </div>
                )}
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-border mt-auto">
                <button
                  onClick={() => handleLike(activity.id, !!activity.user_liked)}
                  aria-label={activity.user_liked ? 'Retirer le like' : 'Ajouter un like'}
                  className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-full transition-all min-h-[36px] ${
                    activity.user_liked
                      ? 'bg-danger/20 text-danger'
                      : 'bg-muted text-muted hover:bg-danger/10 hover:text-danger'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 md:w-5 md:h-5 ${
                      activity.user_liked ? 'fill-current' : ''
                    }`}
                  />
                  <span className="font-semibold text-xs md:text-sm">{activity.like_count || 0}</span>
                </button>

                <div className="flex items-center gap-1 md:gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-xs md:text-sm min-h-[36px]"
                    onClick={() => setCommentActivityId(activity.id)}
                    aria-label="Commenter cette activité"
                  >
                    <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1" />
                    {(activity as SocialFeedItem & { comment_count?: number }).comment_count || 'Commenter'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full min-h-[36px] min-w-[36px] p-0"
                    aria-label="Voir les détails"
                  >
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
          <Button
            variant="secondary"
            onClick={() => setDisplayCount((d) => d + SOCIAL_FEED_CONSTANTS.LOAD_MORE_INCREMENT)}
            className="rounded-xl"
            aria-label={`Charger ${SOCIAL_FEED_CONSTANTS.LOAD_MORE_INCREMENT} activités supplémentaires`}
          >
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
