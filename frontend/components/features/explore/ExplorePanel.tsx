'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { SegmentList } from './Segments';
import { RouteList } from './Routes';
import { FilterChipGroup } from '@/components/ui/Tabs';
import { Compass, Route, Heart, Plus, X } from '@/components/ui/icons';

interface Segment {
  id: number;
  name: string;
  description?: string;
  distance: number;
  elevation_gain: number;
  elevation_loss?: number;
  avg_grade?: number;
  activity_type: string;
  effort_count?: number;
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
  activeTab: 'routes' | 'segments' | 'favorites';
  onTabChange: (_tab: 'routes' | 'segments' | 'favorites') => void;
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

// Focus styles base classes
const focusClasses = 'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-surface';

// Button base classes with focus
const buttonBaseClasses = `flex items-center justify-center gap-2 px-3 min-h-[44px] rounded-lg transition-colors hover:bg-surface ${focusClasses}`;

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
  activeTab,
  onTabChange,
}: ExplorePanelProps) {

  return (
    <>
      {/* Toggle button - Always visible, accessible */}
      <button
        onClick={onToggle}
        className="absolute top-4 left-4 z-[500] flex items-center gap-2 px-3 min-h-[44px] bg-surface/90 backdrop-blur-sm rounded-lg shadow-md border border-border text-sm font-medium hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-surface"
        aria-label={isOpen ? 'Fermer le panneau Explorer' : 'Ouvrir le panneau Explorer'}
        aria-expanded={isOpen}
        aria-controls="explore-panel-content"
        type="button"
      >
        {isOpen ? (
          <X className="w-4 h-4" aria-hidden="true" />
        ) : (
          <Compass className="w-4 h-4" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">{isOpen ? 'Fermer' : 'Explorer'}</span>
      </button>

      {/* Panel - Responsive width + Accessible */}
      <div
        id="explore-panel-content"
        className={`absolute top-0 left-0 z-[400] h-full bg-surface/95 backdrop-blur-md border-r border-border shadow-lg transition-all duration-300 flex flex-col
                    ${isOpen ? 'w-full sm:w-96 md:w-80 translate-x-0' : 'w-full sm:w-96 md:w-80 -translate-x-full'}`}
        aria-hidden={!isOpen}
        aria-labelledby="explore-panel-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
          <h2
            id="explore-panel-title"
            className="text-lg font-bold flex items-center gap-2"
          >
            <Compass className="w-5 h-5 text-primary" aria-hidden="true" />
            Explorer
          </h2>
          <button
            onClick={onToggle}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-surface transition-colors ${focusClasses}`}
            aria-label="Fermer le panneau"
            type="button"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Tabs - Accessible tablist */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as 'routes' | 'segments' | 'favorites')}>
            <div className="px-4 pt-3 pb-2 border-b border-border">
              <div role="tablist" aria-label="Onglets Explorer">
                <TabsList className="w-full">
                  <TabsTrigger value="segments" className="text-xs">
                    <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Segments</span>
                  </TabsTrigger>
                  <TabsTrigger value="routes" className="text-xs">
                    <Route className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Parcours</span>
                  </TabsTrigger>
                  <TabsTrigger value="favorites" className="text-xs">
                    <Heart className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Favoris</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Tab Panels - Semantic lists */}
            <div className="flex-1 overflow-y-auto p-4">
              <div id="segments-panel" role="tabpanel" aria-labelledby="segments-tab">
                <TabsContent value="segments">
                  <div className="space-y-3">
                    {/* Header with count */}
                    <div className="flex items-center justify-between pb-2">
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-muted">
                          {segmentsLoading ? 'Chargement...' : `${segments.length} segments`}
                        </span>
                      </div>
                    </div>
                    <SegmentList
                      segments={segments}
                      isLoading={segmentsLoading}
                      onSegmentClick={onSegmentClick}
                    />
                  </div>
                </TabsContent>
              </div>

              <div id="routes-panel" role="tabpanel" aria-labelledby="routes-tab">
                <TabsContent value="routes">
                  <div className="space-y-3">
                    {/* Header with count */}
                    <div className="flex items-center justify-between pb-2">
                      <div className="flex items-center gap-2">
                        <Route className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-muted">
                          {routesLoading ? 'Chargement...' : `${routes.length} parcours`}
                        </span>
                      </div>
                    </div>

                    {/* Filters */}
                    <div className="space-y-2 pb-2">
                      <FilterChipGroup
                        options={ACTIVITY_TYPES}
                        activeFilter={activeFilter.type || 'all'}
                        onFilterChange={(type) => {
                          onFilterChange({ ...activeFilter, type: type === 'all' ? '' : type });
                        }}
                        aria-label="Filtrer par type d'activité"
                      />
                      <FilterChipGroup
                        options={DIFFICULTIES}
                        activeFilter={activeFilter.difficulty || 'all'}
                        onFilterChange={(diff) => {
                          onFilterChange({ ...activeFilter, difficulty: diff === 'all' ? '' : diff });
                        }}
                        aria-label="Filtrer par difficulté"
                      />
                    </div>
                    <RouteList
                      routes={routes}
                      isLoading={routesLoading}
                      onRouteClick={onRouteClick}
                    />
                  </div>
                </TabsContent>
              </div>

              <div id="favorites-panel" role="tabpanel" aria-labelledby="favorites-tab">
                <TabsContent value="favorites">
                  <div className="space-y-3">
                    {/* Header with count */}
                    <div className="flex items-center justify-between pb-2">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-danger" />
                        <span className="text-sm font-medium text-muted">
                          {favoritesLoading ? 'Chargement...' : `${favorites.length} favoris`}
                        </span>
                      </div>
                    </div>
                    <RouteList
                      routes={favorites}
                      isLoading={favoritesLoading}
                      onRouteClick={onFavoriteClick}
                      showFavoriteButton={false}
                    />
                  </div>
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>

        {/* Bottom action - Responsive padding */}
        <div className="p-4 pb-[env(safe-area-inset-bottom,16px)] border-t border-border bg-surface/50">
          <button
            onClick={onOpenRoutePlanner}
            className={`w-full ${buttonBaseClasses} bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl font-medium text-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200`}
            type="button"
            aria-label="Créer un parcours"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Créer un parcours</span>
          </button>
        </div>
      </div>
    </>
  );
}
