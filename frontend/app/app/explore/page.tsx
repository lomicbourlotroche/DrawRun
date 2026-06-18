'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import type { DrawRunMap } from '@/types/leaflet';
import { 
  Search, X, Compass, MapPin, Plus, LocateFixed,
  Route, Heart
} from '@/components/ui/icons';
import ExplorePanel from '@/components/features/explore/ExplorePanel';
import MapLayerSwitcher from '@/components/features/explore/MapLayerSwitcher';
import LocationSearch from '@/components/features/explore/LocationSearch';
import RoutePlanner from '@/components/features/explore/RoutePlanner';
import RouteDetailPopup from '@/components/features/explore/RouteDetailPopup';
import HeatmapView from './HeatmapView';

const ExploreMap = dynamic(
  () => import('@/components/features/explore/ExploreMap'),
  { ssr: false }
);

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
  start_lat?: number;
  start_lng?: number;
  end_lat?: number;
  end_lng?: number;
  polyline?: string;
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
  usage_count: number;
  creator_name?: string;
  is_favorited?: boolean;
  polyline: string;
}

interface MapRoute {
  id: number;
  polyline: string;
  color?: string;
  name?: string;
  onClick?: () => void;
}

interface MapSegment {
  id: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  polyline?: string;
  name?: string;
  onClick?: () => void;
}

type Waypoint = { lat: number; lng: number };

const ROUTE_COLORS = ['var(--danger)', 'var(--primary)', 'var(--success)', 'var(--peak)', 'var(--secondary)', 'var(--danger)', 'var(--recovery)', 'var(--peak)'];
const DEFAULT_CENTER = { lat: 48.400771, lng: -4.502407 };

export default function ExplorePage() {
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(14.15);
  const [mapLayer, setMapLayer] = useState('osm');
  const [panelOpen, setPanelOpen] = useState(true);

  // Segments state
  const [segments, setSegments] = useState<Segment[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(false);

  // Routes state
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);

  // Favorites state
  const [favorites, setFavorites] = useState<RouteItem[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  // Filters
  const [activeFilter, setActiveFilter] = useState<{ type: string; difficulty: string }>({
    type: '',
    difficulty: '',
  });

  // Map overlays
  const [mapRoutes, setMapRoutes] = useState<MapRoute[]>([]);
  const [mapSegments, setMapSegments] = useState<MapSegment[]>([]);

  // Route planner
  const [routePlannerOpen, setRoutePlannerOpen] = useState(false);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [isLoop, setIsLoop] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteItem | null>(null);

  // Heatmap
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapData, setHeatmapData] = useState<Array<{ lat: number; lng: number; intensity: number }>>([]);
  const [mapInstance, setMapInstance] = useState<DrawRunMap | null>(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [activeTab, setActiveTab] = useState<'routes' | 'segments' | 'favorites'>('routes');

  const locatedRef = useRef(false);

  const loadSegments = useCallback(async (lat?: number, lng?: number) => {
    setSegmentsLoading(true);
    try {
      const useLat = lat ?? mapCenter.lat;
      const useLng = lng ?? mapCenter.lng;
      
      if (useLat && useLng) {
        const res = await api.getNearbySegments(useLat, useLng, 10000);
        if (res.success) {
          const segs = (res.segments ?? []) as Segment[];
          setSegments(segs);
          setMapSegments(
            segs
              .filter((s) => s.start_lat && s.start_lng && s.end_lat && s.end_lng)
              .map((s) => ({
                id: s.id,
                startLat: s.start_lat!,
                startLng: s.start_lng!,
                endLat: s.end_lat!,
                endLng: s.end_lng!,
                polyline: s.polyline,
                name: s.name,
                onClick: () => router.push(`/app/explore/segments/${s.id}`),
              }))
          );
        }
      } else {
        const res = await api.getPublicSegments();
        if (res.success) {
          setSegments((res.segments ?? []) as Segment[]);
        }
      }
    } catch {
      /* ignore */
    } finally {
      setSegmentsLoading(false);
    }
  }, [router, mapCenter]);

  const loadRoutes = useCallback(async (type?: string, difficulty?: string) => {
    setRoutesLoading(true);
    try {
      const res = await api.getPublicRoutes(type, difficulty);
      if (res.success) {
        const r = (res.routes ?? []) as RouteItem[];
        setRoutes(r);
        setMapRoutes(
          r.filter((rt) => rt.polyline).map((rt, idx) => ({
            id: rt.id,
            polyline: rt.polyline,
            color: ROUTE_COLORS[idx % ROUTE_COLORS.length],
            name: rt.name,
            onClick: () => setSelectedRoute(rt),
          }))
        );
      }
    } catch {
      /* ignore */
    } finally {
      setRoutesLoading(false);
    }
  }, []);

  const loadFavorites = useCallback(async () => {
    setFavoritesLoading(true);
    try {
      const res = await api.getFavoriteRoutes();
      if (res.success) {
        setFavorites(res.routes as RouteItem[]);
      }
    } catch {
      /* ignore */
    } finally {
      setFavoritesLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadSegments();
    loadRoutes();
    loadFavorites();
  }, [loadSegments, loadRoutes, loadFavorites]);

  // Geolocate user with fallback
  useEffect(() => {
    if (locatedRef.current) return;
    
    const geolocateUser = () => {
      if (!navigator.geolocation) {
        setMapCenter(DEFAULT_CENTER);
        loadSegments(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
        locatedRef.current = true;
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setMapCenter({ lat: latitude, lng: longitude });
          setMapZoom(14);
          loadSegments(latitude, longitude);
          locatedRef.current = true;
        },
        () => {
          setMapCenter(DEFAULT_CENTER);
          loadSegments(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng);
          locatedRef.current = true;
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    };

    geolocateUser();
  }, [loadSegments]);

  useEffect(() => {
    loadRoutes(activeFilter.type || undefined, activeFilter.difficulty || undefined);
  }, [activeFilter, loadRoutes]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Géolocalisation non supportée');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setMapCenter({ lat: latitude, lng: longitude });
        setMapZoom(15);
        loadSegments(latitude, longitude);
        toast.success('Position détectée');
      },
      () => toast.error('Impossible d\'obtenir votre position')
    );
  }, [loadSegments]);

  const handleWaypointAdd = useCallback((latlng: { lat: number; lng: number }) => {
    setWaypoints((prev) => [...prev, latlng]);
  }, []);

  const handleWaypointDrag = useCallback((index: number, latlng: { lat: number; lng: number }) => {
    setWaypoints((prev) => {
      const next = [...prev];
      next[index] = latlng;
      return next;
    });
  }, []);

  const openRoutePlanner = useCallback(() => {
    setRoutePlannerOpen(true);
    setWaypoints([]);
    setIsLoop(false);
    setPanelOpen(false);
  }, []);

  const closeRoutePlanner = useCallback(() => {
    setRoutePlannerOpen(false);
    setWaypoints([]);
    setIsLoop(false);
    setPanelOpen(true);
  }, []);

  const handleRouteCreated = useCallback(() => {
    loadRoutes();
    loadFavorites();
  }, [loadRoutes, loadFavorites]);

  return (
    <div className="relative w-full h-[calc(100dvh-4rem)] -m-4 lg:-m-6 flex flex-col overflow-hidden bg-surface">
      {/* ===== HEADER WITH MAGAZINE STYLE ===== */}
      <div className="absolute top-0 left-0 right-0 z-[450] bg-gradient-to-b from-black/40 to-transparent">
        <div className="flex items-center justify-between p-4 pb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/20">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div className="text-white">
              <h1 className="text-xl font-black tracking-tight leading-none">EXPLORER</h1>
              <p className="text-[11px] opacity-80 font-medium tracking-wide">
                DÉCOUVREZ — PARCOURS & SEGMENTS
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={openRoutePlanner}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-md border border-white/25 rounded-xl text-white text-sm font-bold hover:bg-white/25 transition-all shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Créer un parcours
            </button>
          </div>
        </div>
      </div>

      <div id="explore-main" className="relative flex-1 flex">
        {/* Map */}
        <div className="absolute inset-0" role="region" aria-label="Carte d'exploration">
          <ExploreMap
            center={mapCenter}
            zoom={mapZoom}
            mapLayer={mapLayer}
            routes={routePlannerOpen ? [] : mapRoutes}
            segments={routePlannerOpen ? [] : mapSegments}
            userLocation={userLocation}
            routeCreationActive={routePlannerOpen}
            routeCreationPoints={waypoints}
            onWaypointAdd={handleWaypointAdd}
            onWaypointDrag={handleWaypointDrag}
            isLoop={isLoop}
            onMapReady={setMapInstance}
            heatmapData={heatmapData}
            showHeatmap={showHeatmap}
          />
        </div>

        {/* Search bar */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[500] w-full max-w-md px-4 max-sm:hidden">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl shadow-black/10 border border-white/30 overflow-hidden">
            <LocationSearch
              onSelectLocation={(lat, lng, label) => {
                setMapCenter({ lat, lng });
                setMapZoom(15);
                userLocation && loadSegments(lat, lng);
                toast.success(label.split(',')[0]);
              }}
              placeholder="Rechercher un lieu..."
            />
          </div>
        </div>

        {/* Mobile search overlay */}
        {showMobileSearch && (
          <div className="absolute inset-x-0 top-0 z-[600] sm:hidden" role="region" aria-label="Recherche mobile">
            <div className="flex items-center gap-2 p-3 bg-surface/95 backdrop-blur-md border-b border-border shadow-md">
              <div className="flex-1">
                <LocationSearch
                  onSelectLocation={(lat, lng, label) => {
                    setMapCenter({ lat, lng });
                    setMapZoom(15);
                    userLocation && loadSegments(lat, lng);
                    setShowMobileSearch(false);
                    toast.success(label.split(',')[0]);
                  }}
                  placeholder="Rechercher un lieu..."
                />
              </div>
              <button
                onClick={() => setShowMobileSearch(false)}
                className="flex items-center justify-center w-11 h-11 rounded-xl hover:bg-muted transition-colors"
                aria-label="Fermer la recherche"
                type="button"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}

        {/* Right side controls */}
        <div className="absolute top-20 right-4 z-[500] flex flex-col gap-2">
          <button
            onClick={() => setShowMobileSearch(true)}
            className="sm:hidden flex items-center justify-center w-11 h-11 rounded-xl bg-surface/90 backdrop-blur-md border border-border shadow-lg hover:bg-surface transition-colors text-muted-foreground"
            title="Rechercher"
            aria-label="Rechercher un lieu"
            type="button"
          >
            <Search className="w-4 h-4" />
          </button>
          <HeatmapView
            mapCenter={mapCenter}
            activeFilterType={activeFilter.type}
            mapInstance={mapInstance}
            routePlannerOpen={routePlannerOpen}
            showHeatmap={showHeatmap}
            onShowHeatmapChange={setShowHeatmap}
            onHeatmapDataChange={setHeatmapData}
          />
          <MapLayerSwitcher activeLayer={mapLayer} onLayerChange={setMapLayer} />
        </div>

        {/* Geolocate button */}
        <button
          onClick={handleLocateMe}
          className="absolute bottom-4 right-4 z-[500] flex items-center justify-center w-12 h-12 bg-primary rounded-2xl shadow-xl shadow-primary/30 hover:bg-primary/90 hover:scale-105 transition-all duration-200 text-white"
          title="Me localiser"
          aria-label="Me localiser sur la carte"
          type="button"
        >
          <LocateFixed className="w-5 h-5" />
        </button>

        {/* Mobile FAB - Create route */}
        <button
          onClick={openRoutePlanner}
          className="absolute bottom-20 right-4 z-[500] sm:hidden flex items-center justify-center w-12 h-12 bg-primary rounded-2xl shadow-xl shadow-primary/30 hover:bg-primary/90 hover:scale-105 transition-all duration-200 text-white"
          title="Créer un parcours"
          aria-label="Créer un parcours"
          type="button"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Tab selector - Magazine style for explore panel */}
        {!routePlannerOpen && (
          <div className="absolute bottom-4 left-4 z-[500]">
            <div className="flex items-center gap-1 bg-surface/95 backdrop-blur-md rounded-2xl border border-border shadow-xl p-1">
              {[
                { id: 'routes', label: 'Parcours', icon: Route },
                { id: 'segments', label: 'Segments', icon: MapPin },
                { id: 'favorites', label: 'Favoris', icon: Heart },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
                      isActive
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                    type="button"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Side panel */}
        <ExplorePanel
          segments={segments}
          segmentsLoading={segmentsLoading}
          routes={routes}
          routesLoading={routesLoading}
          favorites={favorites}
          favoritesLoading={favoritesLoading}
          onSegmentClick={(segment) => router.push(`/app/explore/segments/${segment.id}`)}
          onRouteClick={(route) => router.push(`/app/explore/routes/${route.id}`)}
          onFavoriteClick={(route) => router.push(`/app/explore/routes/${route.id}`)}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onOpenRoutePlanner={openRoutePlanner}
          isOpen={panelOpen}
          onToggle={() => setPanelOpen((p) => !p)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Route detail popup */}
        {selectedRoute && !routePlannerOpen && (
          <RouteDetailPopup
            route={selectedRoute}
            onClose={() => setSelectedRoute(null)}
            onViewDetails={() => {
              setSelectedRoute(null);
              router.push(`/app/explore/routes/${selectedRoute.id}`);
            }}
            onUseRoute={async () => {
              try {
                await api.useRoute(selectedRoute.id);
                toast.success('Parcours ajouté à vos activités');
                setSelectedRoute(null);
              } catch {
                toast.error('Erreur lors de l\'utilisation du parcours');
              }
            }}
          />
        )}

        {/* Route planner */}
        {routePlannerOpen && (
          <RoutePlanner
            waypoints={waypoints}
            onWaypointsChange={setWaypoints}
            onClose={closeRoutePlanner}
            isLoop={isLoop}
            onLoopChange={setIsLoop}
            onRouteCreated={handleRouteCreated}
          />
        )}
      </div>
    </div>
  );
}
