/* eslint-disable unused-imports/no-unused-imports, react/jsx-no-undef, no-undef */
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Select, ActivitySkeleton, EmptyState } from '@/components/ui';
import { formatDate, formatDistance, getSportColor } from '@/lib/utils';
import type { Activity } from '@/types';
import { Clock, Heart, TrendingUp, ChevronRight, Search, RefreshCw, ChevronDown, Mountain } from 'lucide-react';
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
    { id: 'all', label: 'Tous', count: validActivities.length },
    { id: 'run', label: 'Course', count: validActivities.filter((a) => (a.type as string).toLowerCase().startsWith('run')).length },
    { id: 'bike', label: 'Vélo', count: validActivities.filter((a) => (a.type as string).toLowerCase().startsWith('bike') || (a.type as string).toLowerCase().startsWith('ride')).length },
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 bg-neutral-100 rounded-2xl animate-pulse" />
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
    <div className="space-y-5">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Rechercher une activité..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-surface border border-neutral-200/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-all duration-200 ease-smooth hover:border-neutral-300"
          />
        </div>
        <Select
          options={[
            { value: 'date', label: 'Date' },
            { value: 'distance', label: 'Distance' },
            { value: 'duration', label: 'Durée' },
          ]}
          value={sortBy}
          onChange={handleSortChange}
          className="w-full sm:w-40"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filterOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handleFilterChange(opt.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ease-smooth ${
              filter === opt.id
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-surface border border-neutral-200/60 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300'
            }`}
          >
            {opt.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              filter === opt.id ? 'bg-white/20' : 'bg-neutral-100'
            }`}>
              {opt.count}
            </span>
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs text-neutral-500">
        {filteredActivities.length} activité{filteredActivities.length > 1 ? 's' : ''}
        {filter !== 'all' || searchQuery ? ' (filtrées)' : ''}
      </p>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleActivities.map((activity) => {
          const distanceM = activity.distance ?? 0;
          const durationS = activity.moving_time ?? activity.elapsed_time ?? 0;
          const elevation = activity.total_elevation_gain;
          const avgHR = activity.avgHR || activity.average_heartrate || 0;

          return (
            <Link
              key={activity.id}
              href={`/app/activities/${activity.id}`}
              className="group block"
            >
              <div className="relative bg-surface rounded-2xl border border-neutral-200/60 shadow-card overflow-hidden transition-all duration-200 ease-smooth hover:shadow-md hover:-translate-y-0.5 hover:border-primary-200/50">
                {/* Sport color accent */}
                <div
                  className="absolute top-0 left-0 w-full h-1"
                  style={{ backgroundColor: getSportColor(activity.type) }}
                />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ backgroundColor: `${getSportColor(activity.type)}15` }}
                      >
                        {getSportIcon(activity.type)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate text-sm group-hover:text-primary-500 transition-colors">
                          {activity.title || activity.name || 'Activité'}
                        </h3>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {formatDate(activity.date || activity.start_date || '')}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-primary-500 transition-colors flex-shrink-0 mt-1" />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {distanceM > 0 && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-50">
                        <TrendingUp className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-foreground tabular-nums">{formatDistance(distanceM)}</p>
                          <p className="text-[10px] text-neutral-500">distance</p>
                        </div>
                      </div>
                    )}
                    {durationS > 0 && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-50">
                        <Clock className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-foreground tabular-nums">
                            {Math.floor(durationS / 3600) > 0
                              ? `${Math.floor(durationS / 3600)}h${Math.floor((durationS % 3600) / 60).toString().padStart(2, '0')}`
                              : `${Math.floor(durationS / 60)} min`}
                          </p>
                          <p className="text-[10px] text-neutral-500">durée</p>
                        </div>
                      </div>
                    )}
                    {avgHR > 0 && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-50">
                        <Heart className="w-3.5 h-3.5 text-danger flex-shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-foreground tabular-nums">{avgHR}</p>
                          <p className="text-[10px] text-neutral-500">FC moy</p>
                        </div>
                      </div>
                    )}
                    {elevation !== null && elevation !== undefined && elevation > 0 && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-50">
                        <Mountain className="w-3.5 h-3.5 text-success flex-shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-foreground tabular-nums">{Math.round(elevation)} m</p>
                          <p className="text-[10px] text-neutral-500">dénivelé</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pace + Draw Button */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
                    <div className="flex items-center gap-3">
                      {activity.pace && (
                        <span className="text-xs font-medium text-neutral-600">{activity.pace}/km</span>
                      )}
                      {activity.gap && (
                        <span className="text-xs font-semibold text-primary-500">GAP {activity.gap}</span>
                      )}
                    </div>
                    {activity.user_id && (
                      <div onClick={(e) => e.preventDefault()}>
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
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Load more */}
      {hasMore && (
        <button
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-neutral-200/60 text-sm font-medium text-neutral-600 hover:text-foreground hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 ease-smooth"
        >
          <ChevronDown className="w-4 h-4" />
          Charger {Math.min(PAGE_SIZE, filteredActivities.length - visibleCount)} activités de plus
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
