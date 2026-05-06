/* eslint-disable unused-imports/no-unused-imports, react/jsx-no-undef, no-undef */
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GradientBadge, FilterChipGroup, Select, ActivitySkeleton, EmptyState } from '@/components/ui';
import { formatDate, formatDistance, getSportColor } from '@/lib/utils';
import type { Activity } from '@/types';
import { Clock, Heart, TrendingUp, ChevronRight, Search, RefreshCw } from 'lucide-react';
import { DrawButton } from '@/components/features/social/DrawButton';

interface ActivityListProps {
  activities: Activity[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function ActivityList({ activities, isLoading, onRefresh }: ActivityListProps) {
  const [filter, setFilter] = useState<'all' | 'run' | 'bike' | 'swim'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'distance' | 'duration'>('date');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredActivities = useMemo(() => {
    let filtered = activities;

    if (filter !== 'all') {
      filtered = filtered.filter((a) => a.type === filter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((a) =>
        a.title.toLowerCase().includes(query) ||
        a.date.includes(query)
      );
    }

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'distance':
          return b.distance - a.distance;
        case 'duration':
          return (b.moving_time || 0) - (a.moving_time || 0);
        default:
          return 0;
      }
    });
  }, [activities, filter, sortBy, searchQuery]);

  const validActivities = Array.isArray(activities) ? activities : [];
  const filterOptions = [
    { id: 'all', label: 'Tous', count: validActivities.length },
    { id: 'run', label: 'Course', count: validActivities.filter?.((a: Activity) => a.type === 'run').length || 0 },
    { id: 'bike', label: 'Vélo', count: validActivities.filter?.((a: Activity) => a.type === 'bike').length || 0 },
    { id: 'swim', label: 'Natation', count: validActivities.filter?.((a: Activity) => a.type === 'swim').length || 0 },
  ];

  const sportIcons: Record<string, string> = {
    run: '🏃',
    bike: '🚴',
    swim: '🏊',
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <ActivitySkeleton key={i} />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <EmptyState
        icon={<Search className="w-8 h-8" />}
        title="Aucune activité"
        description="Synchronisez avec Strava ou Garmin pour importer vos activités."
        action={
          onRefresh && (
            <button onClick={onRefresh} className="btn-primary">
              <RefreshCw className="w-4 h-4 mr-2" />
              Synchroniser
            </button>
          )
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Rechercher une activité..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <Select
          options={[
            { value: 'date', label: 'Date' },
            { value: 'distance', label: 'Distance' },
            { value: 'duration', label: 'Durée' },
          ]}
          value={sortBy}
          onChange={(v) => setSortBy(v as typeof sortBy)}
          className="w-full sm:w-40"
        />
      </div>

      <FilterChipGroup
        options={filterOptions}
        activeFilter={filter}
        onFilterChange={(id) => setFilter(id as typeof filter)}
      />

      <div className="space-y-3">
        {filteredActivities.map((activity, index) => (
          <Link
            key={activity.id}
            href={`/app/activities/${activity.id}`}
            className="block group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <GlassCard hover className="animate-slide-up" padding="md">
              <GlassCardContent>
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${getSportColor(activity.type)}20` }}
                  >
                    {sportIcons[activity.type] || '🏃'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {activity.title}
                      </h3>
                      <GradientBadge variant="primary" size="sm">
                        {activity.type}
                      </GradientBadge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(activity.date)}
                      </span>
                      {activity.avgHR > 0 && (
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5" />
                          {activity.avgHR} bpm
                        </span>
                      )}
                      {activity.tss && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          TSS {activity.tss}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">
                      {formatDistance(activity.distance)}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted">
                      {activity.pace && <span>{activity.pace}/km</span>}
                      {activity.duration && <span>{activity.duration}</span>}
                    </div>
                    {activity.user_id && (
                      <div className="mt-2">
                        <DrawButton
                          activityId={activity.id}
                          ownerId={activity.user_id}
                          initialDrawCount={activity.draw_count || 0}
                          initialHasDrawn={activity.has_drawn || false}
                          size="sm"
                          onDrawChange={(hasDrawn, count) => {
                            // Mettre à jour l'activité localement
                            activity.has_drawn = hasDrawn;
                            activity.draw_count = count;
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </GlassCardContent>
             </GlassCard>
          </Link>
        ))}
      </div>

      {filteredActivities.length === 0 && searchQuery && (
        <EmptyState
          icon={<Search className="w-8 h-8" />}
          title="Aucun résultat"
          description={`Aucune activité ne correspond à "${searchQuery}"`}
        />
      )}
    </div>
  );
}
