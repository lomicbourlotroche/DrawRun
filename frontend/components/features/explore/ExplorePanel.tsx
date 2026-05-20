'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { SegmentList } from './Segments';
import { RouteList } from './Routes';
import { FilterChipGroup } from '@/components/ui/Tabs';
import { Compass, Route, Heart, Plus, X } from 'lucide-react';

interface Segment {
  id: number;
  name: string;
  description?: string;
  distance: number;
  elevation_gain: number;
  elevation_loss?: number;
  avg_grade?: number;
  activity_type: string;
  effort_count: number;
  creator_name?: string;
  total_efforts?: number;
  unique_athletes?: number;
  kom?: { user_name: string; elapsed_time: number };
  qom?: { user_name: string; elapsed_time: number };
}

interface RouteItem {
  id: number;
  name: string;
  description?: string;
  distance: number;
  elevation_gain: number;
  elevation_loss?: number;
  activity_type: string;
  estimated_duration?: number;
  difficulty?: string;
  tags?: string[];
  avg_rating?: number;
  rating_count?: number;
  usage_count?: number;
  creator_name?: string;
  is_favorited?: boolean;
  polyline: string;
}

interface ExplorePanelProps {
  segments: Segment[];
  segmentsLoading: boolean;
  routes: RouteItem[];
  routesLoading: boolean;
  favorites: RouteItem[];
  favoritesLoading: boolean;
  onSegmentClick: (_segment: Segment) => void;
  onRouteClick: (_route: RouteItem) => void;
  onFavoriteClick: (_route: RouteItem) => void;
  activeFilter: { type: string; difficulty: string };
  onFilterChange: (_filter: { type: string; difficulty: string }) => void;
  onOpenRoutePlanner: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const ACTIVITY_TYPES = [
  { id: '', label: 'Tous' },
  { id: 'Run', label: 'Course' },
  { id: 'Bike', label: 'Vélo' },
  { id: 'Swim', label: 'Natation' },
];

const DIFFICULTIES = [
  { id: '', label: 'Tous' },
  { id: 'easy', label: 'Facile' },
  { id: 'medium', label: 'Modéré' },
  { id: 'hard', label: 'Difficile' },
];

export default function ExplorePanel({
  segments,
  segmentsLoading,
  routes,
  routesLoading,
  favorites,
  favoritesLoading,
  onSegmentClick,
  onRouteClick,
  onFavoriteClick,
  activeFilter,
  onFilterChange,
  onOpenRoutePlanner,
  isOpen,
  onToggle,
}: ExplorePanelProps) {
  const [activeTab, setActiveTab] = useState('segments');

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute top-4 left-4 z-[500] flex items-center gap-2 px-3 min-h-[44px] bg-surface/90 backdrop-blur-sm rounded-lg shadow-md border border-border text-sm font-medium hover:bg-surface transition-colors"
      >
        {isOpen ? <X className="w-4 h-4" /> : <Compass className="w-4 h-4" />}
        <span className="hidden sm:inline">{isOpen ? 'Fermer' : 'Explorer'}</span>
      </button>

      {/* Panel */}
      <div
        className={`absolute top-0 left-0 z-[400] h-full bg-surface/95 backdrop-blur-md border-r border-border
                    shadow-lg transition-all duration-300 flex flex-col
                    ${isOpen ? 'w-full sm:w-96 translate-x-0' : 'w-96 -translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" />
            Explorer
          </h2>
          <button
            onClick={onToggle}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-surface transition-colors sm:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="px-4 pt-3 pb-2 border-b border-border">
              <TabsList className="w-full">
                <TabsTrigger value="segments" className="text-xs">
                  <Compass className="w-3.5 h-3.5" />
                  Segments
                </TabsTrigger>
                <TabsTrigger value="routes" className="text-xs">
                  <Route className="w-3.5 h-3.5" />
                  Parcours
                </TabsTrigger>
                <TabsTrigger value="favorites" className="text-xs">
                  <Heart className="w-3.5 h-3.5" />
                  Favoris
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <TabsContent value="segments">
                <div className="space-y-3">
                  <SegmentList
                    segments={segments}
                    isLoading={segmentsLoading}
                    onSegmentClick={onSegmentClick}
                  />
                </div>
              </TabsContent>

              <TabsContent value="routes">
                <div className="space-y-3">
                  {/* Filters */}
                  <div className="space-y-2 pb-2">
                    <FilterChipGroup
                      options={ACTIVITY_TYPES}
                      activeFilter={activeFilter.type || 'all'}
                      onFilterChange={(type) => {
                        onFilterChange({ ...activeFilter, type: type === 'all' ? '' : type });
                      }}
                    />
                    <FilterChipGroup
                      options={DIFFICULTIES}
                      activeFilter={activeFilter.difficulty || 'all'}
                      onFilterChange={(diff) => {
                        onFilterChange({ ...activeFilter, difficulty: diff === 'all' ? '' : diff });
                      }}
                    />
                  </div>
                  <RouteList
                    routes={routes}
                    isLoading={routesLoading}
                    onRouteClick={onRouteClick}
                  />
                </div>
              </TabsContent>

              <TabsContent value="favorites">
                <div className="space-y-3">
                  <RouteList
                    routes={favorites}
                    isLoading={favoritesLoading}
                    onRouteClick={onFavoriteClick}
                    showFavoriteButton={false}
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Bottom action */}
        <div className="p-4 pb-[env(safe-area-inset-bottom,16px)] border-t border-border">
          <button
            onClick={onOpenRoutePlanner}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Créer un parcours
          </button>
        </div>
      </div>
    </>
  );
}
