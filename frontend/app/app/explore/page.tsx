'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import type { DrawRunMap } from '@/types/leaflet';
import { Search, X } from 'lucide-react';
import ExplorePanel from '@/components/features/explore/ExplorePanel';
import MapLayerSwitcher from '@/components/features/explore/MapLayerSwitcher';
import LocationSearch from '@/components/features/explore/LocationSearch';
import RoutePlanner from '@/components/features/explore/RoutePlanner';
import RouteDetailPopup from '@/components/features/explore/RouteDetailPopup';
import CommunityTracesLayer from '@/components/features/explore/CommunityTracesLayer';

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

const ROUTE_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function ExplorePage() {
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 48.400771, lng: -4.502407 });
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

  // Community traces & heatmap
  const [showCommunityTraces, setShowCommunityTraces] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [heatmapData, setHeatmapData] = useState<Array<{ lat: number; lng: number; intensity: number }>>([]);
  const [mapInstance, setMapInstance] = useState<DrawRunMap | null>(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Has user been located
  const locatedRef = useRef(false);

  const loadSegments = useCallback(async (lat?: number, lng?: number) => {
    setSegmentsLoading(true);
    try {
      if (lat && lng) {
        const res = await api.getNearbySegments(lat, lng, 10000);
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
  }, [router]);

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

  // Geolocate user
  useEffect(() => {
    if (locatedRef.current) return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setMapCenter({ lat: latitude, lng: longitude });
        loadSegments(latitude, longitude);
        locatedRef.current = true;
      },
      () => {
        locatedRef.current = true;
      },
      { timeout: 5000 }
    );
  }, [loadSegments]);

  // Reload routes when filters change
  useEffect(() => {
    loadRoutes(activeFilter.type || undefined, activeFilter.difficulty || undefined);
  }, [activeFilter, loadRoutes]);

  // Filter also favorites specifically
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Load heatmap data when activated
  useEffect(() => {
    if (!showHeatmap) {
      setHeatmapData([]);
      return;
    }

    const radius = 10000;
    api.getHeatmap(mapCenter.lat, mapCenter.lng, radius, activeFilter.type || undefined).then((res) => {
      if (res.success) {
        setHeatmapData(res.heatmap || []);
      }
    }).catch(() => {
      /* ignore */
    });
  }, [showHeatmap, mapCenter, activeFilter.type]);

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

  return (
    <div className="relative w-full overflow-hidden -m-4 lg:-m-6" style={{ height: 'calc(100dvh - 4rem)' }}>
      {/* Map */}
      <div className="absolute inset-0">
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

      {/* Community traces layer */}
      {mapInstance && (
        <CommunityTracesLayer
          map={mapInstance}
          visible={showCommunityTraces && !routePlannerOpen}
        />
      )}

      {/* Desktop search */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] max-sm:hidden">
        <LocationSearch
          onSelectLocation={(lat, lng, label) => {
            setMapCenter({ lat, lng });
            setMapZoom(15);
            userLocation && loadSegments(lat, lng);
            toast.success(label.split(',')[0]);
          }}
        />
      </div>

      {/* Mobile search overlay */}
      {showMobileSearch && (
        <div className="absolute inset-x-0 top-0 z-[600] sm:hidden">
          <div className="flex items-center gap-2 p-3 bg-white/95 backdrop-blur-md border-b border-border shadow-md">
            <div className="flex-1">
              <LocationSearch
                onSelectLocation={(lat, lng, label) => {
                  setMapCenter({ lat, lng });
                  setMapZoom(15);
                  userLocation && loadSegments(lat, lng);
                  setShowMobileSearch(false);
                  toast.success(label.split(',')[0]);
                }}
              />
            </div>
            <button
              onClick={() => setShowMobileSearch(false)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-surface transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Control overlays */}
      <div className="absolute top-4 right-4 z-[500] flex flex-col gap-2">
        {/* Mobile search toggle */}
        <button
          onClick={() => setShowMobileSearch(true)}
          className="sm:hidden flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg shadow-md border
                     bg-white/90 backdrop-blur-sm border-border hover:bg-white transition-colors text-muted-foreground"
          title="Rechercher"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowHeatmap((p) => !p)}
          className={`flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg shadow-md border transition-all ${
            showHeatmap
              ? 'bg-peak text-white border-peak'
              : 'bg-white/90 backdrop-blur-sm border-border hover:bg-white text-muted-foreground'
          }`}
          title="Heatmap"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="12" r="6" strokeDasharray="2 2" />
            <circle cx="12" cy="12" r="10" strokeDasharray="2 4" />
          </svg>
        </button>
        <button
          onClick={() => setShowCommunityTraces((p) => !p)}
          className={`flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg shadow-md border transition-all ${
            showCommunityTraces
              ? 'bg-purple-600 text-white border-purple-600'
              : 'bg-white/90 backdrop-blur-sm border-border hover:bg-white text-muted-foreground'
          }`}
          title="Traces de la communauté"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16M4 12h16M4 19h7" />
          </svg>
        </button>
        <MapLayerSwitcher activeLayer={mapLayer} onLayerChange={setMapLayer} />
      </div>

      {/* Geolocate button */}
      <button
        onClick={handleLocateMe}
        className="absolute max-sm:bottom-4 max-sm:right-4 sm:top-4 sm:right-16 z-[500] flex items-center justify-center
                   min-w-[44px] min-h-[44px] bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-border
                   hover:bg-white transition-colors"
        title="Me localiser"
      >
        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Panel */}
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

      {/* Route planner (bottom sheet) */}
      {routePlannerOpen && (
        <RoutePlanner
          waypoints={waypoints}
          onWaypointsChange={setWaypoints}
          onClose={closeRoutePlanner}
          isLoop={isLoop}
          onLoopChange={setIsLoop}
        />
      )}
    </div>
  );
}
