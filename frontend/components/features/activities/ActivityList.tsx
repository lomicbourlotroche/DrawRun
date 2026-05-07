/* eslint-disable unused-imports/no-unused-imports, react/jsx-no-undef, no-undef */
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { GlassCard, GlassCardContent, GradientBadge, FilterChipGroup, Select, ActivitySkeleton, EmptyState } from '@/components/ui';
import { formatDate, formatDistance, getSportColor } from '@/lib/utils';
import type { Activity } from '@/types';
import { Clock, Heart, TrendingUp, ChevronRight, Search, RefreshCw, ChevronDown } from 'lucide-react';
import { DrawButton } from '@/components/features/social/DrawButton';

const PAGE_SIZE = 20;

interface ActivityListProps {
  activities: Activity[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function ActivityList({ activities, isLoading, onRefresh }: ActivityListProps) {
  const [filter, setFilter] = useState<'all' | 'run' | 'bike' | 'swim'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'distance' | 'duration'>('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filteredActivities = useMemo(() => {
    let filtered = activities;

    if (filter !== 'all') {
      filtered = filtered.filter((a) => {
        const t = (a.type as string).toLowerCase();
        return t === filter || t.startsWith(filter);
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((a) =>
        (a.title || a.name || '').toLowerCase().includes(query) ||
        (a.date || a.start_date || '').includes(query)
      );
    }

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date || b.start_date || 0).getTime() - new Date(a.date || a.start_date || 0).getTime();
        case 'distance':
          return b.distance - a.distance;
        case 'duration':
          return (b.moving_time || 0) - (a.moving_time || 0);
        default:
          return 0;
      }
    });
  }, [activities, filter, sortBy, searchQuery]);

  // Réinitialiser la pagination quand les filtres changent
  const handleFilterChange = (id: string) => {
    setFilter(id as typeof filter);
    setVisibleCount(PAGE_SIZE);
  };
  const handleSortChange = (v: string) => {
    setSortBy(v as typeof sortBy);
    setVisibleCount(PAGE_SIZE);
  };
  const handleSearchChange = (v: string) => {
    setSearchQuery(v);
    setVisibleCount(PAGE_SIZE);
  };

  const visibleActivities = filteredActivities.slice(0, visibleCount);
  const hasMore = visibleCount < filteredActivities.length;

  const validActivities = Array.isArray(activities) ? activities : [];
  const filterOptions = [
    { id: 'all',  label: 'Tous',     count: validActivities.length },
    { id: 'run',  label: 'Course',   count: validActivities.filter((a) => (a.type as string).toLowerCase().startsWith('run')).length },
    { id: 'bike', label: 'Vélo',     count: validActivities.filter((a) => (a.type as string).toLowerCase().startsWith('bike') || (a.type as string).toLowerCase().startsWith('ride')).length },
    { id: 'swim', label: 'Natation', count: validActivities.filter((a) => (a.type as string).toLowerCase().startsWith('swim')).length },
  ];

  const sportIcons: Record<string, string> = {
    run: '🏃', running: '🏃',
    bike: '🚴', ride: '🚴', cycling: '🚴',
    swim: '🏊', swimming: '🏊',
    hike: '🥾', walk: '🚶',
    workout: '💪',
  };

  const getSportIcon = (type: string) => sportIcons[(type || '').toLowerCase()] || '🏃';

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
      {/* Barre de recherche + tri */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Rechercher une activité..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="input pl-10"
          />
        </div>
        <Select
          options={[
            { value: 'date',     label: 'Date' },
            { value: 'distance', label: 'Distance' },
            { value: 'duration', label: 'Durée' },
          ]}
          value={sortBy}
          onChange={handleSortChange}
          className="w-full sm:w-40"
        />
      </div>

      {/* Filtres par type */}
      <FilterChipGroup
        options={filterOptions}
        activeFilter={filter}
        onFilterChange={handleFilterChange}
      />

      {/* Compteur */}
      <p className="text-xs text-muted">
        {filteredActivities.length} activité{filteredActivities.length > 1 ? 's' : ''}
        {filter !== 'all' || searchQuery ? ' (filtrées)' : ''}
        {hasMore ? ` — ${visibleCount} affichées` : ''}
      </p>

      {/* Liste */}
      <div className="space-y-3">
        {visibleActivities.map((activity, index) => (
          <Link
            key={activity.id}
            href={`/app/activities/${activity.id}`}
            className="block group"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <GlassCard hover className="animate-slide-up" padding="md">
              <GlassCardContent>
                <div className="flex items-start sm:items-center gap-4 flex-wrap">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: `${getSportColor(activity.type)}20` }}
                  >
                    {getSportIcon(activity.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {activity.title || activity.name || 'Activité'}
                      </h3>
                      <GradientBadge variant="primary" size="sm">
                        {activity.type}
                      </GradientBadge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(activity.date || activity.start_date || '')}
                      </span>
                      {(activity.avgHR || activity.average_heartrate || 0) > 0 && (
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5" />
                          {activity.avgHR || activity.average_heartrate} bpm
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

                  <div className="text-right flex-shrink-0 ml-auto sm:ml-0">
                    <p className="text-lg font-bold text-foreground">
                      {formatDistance(activity.distance)}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted justify-end">
                      {activity.gap ? (
                        <div className="flex flex-col items-end leading-tight">
                          <span className="text-foreground font-medium">{activity.pace}/km</span>
                          <span className="text-xs text-primary-600 font-semibold" title="Grade Adjusted Pace (GAP)">GAP {activity.gap}</span>
                        </div>
                      ) : (
                        activity.pace && <span>{activity.pace}/km</span>
                      )}
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
                            activity.has_drawn = hasDrawn;
                            activity.draw_count = count;
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 self-center" />
                </div>
              </GlassCardContent>
            </GlassCard>
          </Link>
        ))}
      </div>

      {/* Bouton "Charger plus" */}
      {hasMore && (
        <button
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border text-sm font-medium text-muted hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <ChevronDown className="w-4 h-4" />
          Charger {Math.min(PAGE_SIZE, filteredActivities.length - visibleCount)} activités de plus
          <span className="text-xs text-muted/60">({filteredActivities.length - visibleCount} restantes)</span>
        </button>
      )}

      {filteredActivities.length === 0 && (searchQuery || filter !== 'all') && (
        <EmptyState
          icon={<Search className="w-8 h-8" />}
          title="Aucun résultat"
          description={searchQuery ? `Aucune activité ne correspond à "${searchQuery}"` : `Aucune activité de type "${filter}"`}
        />
      )}
    </div>
  );
}

