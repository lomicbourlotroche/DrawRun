/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import { decodePolyline } from '@/lib/utils';
import type {
  DrawRunMap,
  DrawRunPolyline,
  DrawRunMarker,
  LatLng,
  LatLngWithIntensity,
} from '@/types/leaflet';
import L from 'leaflet';

/**
 * Route data for display on the map
 */
interface RouteData {
  id: number;
  polyline: string;
  color?: string;
  name?: string;
  onClick?: () => void;
}

/**
 * Segment data for display on the map
 */
interface SegmentData {
  id: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  polyline?: string;
  name?: string;
  onClick?: () => void;
}

/**
 * Heatmap data point
 */
interface HeatmapDataPoint {
  lat: number;
  lng: number;
  intensity: number;
}

/**
 * Coordinate point
 */
interface CoordinatePoint {
  lat: number;
  lng: number;
}

/**
 * Props for ExploreMap component
 */
interface ExploreMapProps {
  onMapReady?: (map: DrawRunMap) => void;
  onMapClick?: (latlng: CoordinatePoint) => void;
  center?: CoordinatePoint;
  zoom?: number;
  mapLayer?: string;
  routes?: RouteData[];
  segments?: SegmentData[];
  userLocation?: CoordinatePoint | null;
  heatmapData?: HeatmapDataPoint[];
  showHeatmap?: boolean;
  routeCreationPoints?: CoordinatePoint[];
  routeCreationActive?: boolean;
  onWaypointAdd?: (latlng: CoordinatePoint) => void;
  onWaypointDrag?: (index: number, latlng: CoordinatePoint) => void;
  currentRoutePolyline?: string;
  isLoop?: boolean;
}

/**
 * Tile layer configuration
 */
const TILE_CONFIGS: Record<string, { url: string; attribution: string }> = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  topo: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
  },
};

const ROUTE_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];

/**
 * ExploreMap component for displaying interactive maps with routes, segments, and heatmaps.
 * 
 * Features:
 * - Multiple tile layer options (OSM, Topo, Satellite)
 * - Route and segment display with custom colors
 * - User location marker
 * - Heatmap overlay
 * - Route creation with waypoints
 * - Responsive design with resize handling
 * 
 * @param props - ExploreMapProps containing map configuration and data
 */
export default function ExploreMap({
  onMapReady,
  onMapClick,
  center = { lat: 48.400771, lng: -4.502407 },
  zoom = 14,
  mapLayer = 'osm',
  routes = [],
  segments = [],
  userLocation,
  heatmapData = [],
  showHeatmap = false,
  routeCreationPoints = [],
  routeCreationActive = false,
  onWaypointAdd,
  onWaypointDrag,
  currentRoutePolyline,
  isLoop = false,
}: ExploreMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<DrawRunMap | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const layersRef = useRef<Map<string, L.Layer>>(new Map());
  const heatmapLayerRef = useRef<L.HeatLayer | null>(null);
  const userMarkerRef = useRef<DrawRunMarker | null>(null);
  const waypointMarkersRef = useRef<DrawRunMarker[]>([]);
  const creationPolylineRef = useRef<DrawRunPolyline | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return;
    if (mapInstanceRef.current) return;

    const init = async () => {
      const L = await import('leaflet');
      // @ts-ignore - Assign to window for leaflet-heat
      window.L = L;
      // @ts-ignore - Import leaflet-heat
      await import('leaflet.heat');

      const map = L.map(mapRef.current!, {
        zoomControl: false,
        attributionControl: true,
        zoom,
        center: [center.lat, center.lng],
      }) as DrawRunMap;

      L.control.zoom({ position: 'topright' }).addTo(map);

      const tileConfig = TILE_CONFIGS[mapLayer] || TILE_CONFIGS.osm;
      const tileLayer = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: 19,
      }) as L.TileLayer;
      tileLayer.addTo(map);

      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;

      if (onMapClick || onWaypointAdd) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          const ll = e.latlng;
          if (routeCreationActive && onWaypointAdd) {
            onWaypointAdd({ lat: ll.lat, lng: ll.lng });
          } else if (onMapClick) {
            onMapClick({ lat: ll.lat, lng: ll.lng });
          }
        });
      }

      // Invalidate map size on container resize (orientation change etc.)
      const resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      if (mapRef.current) {
        resizeObserver.observe(mapRef.current);
      }
      resizeObserverRef.current = resizeObserver;

      setMapReady(true);
      onMapReady?.(map);
    };

    init();

    return () => {
      resizeObserverRef.current?.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update tile layer when mapLayer changes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    (async () => {
      const L = await import('leaflet');
      const map = mapInstanceRef.current!;
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }
      const tileConfig = TILE_CONFIGS[mapLayer] || TILE_CONFIGS.osm;
      const tileLayer = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: 19,
      }) as L.TileLayer;
      tileLayer.addTo(map);
      tileLayerRef.current = tileLayer;
    })();
  }, [mapLayer, mapReady]);

  // Update center/zoom
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    mapInstanceRef.current.setView([center.lat, center.lng], zoom);
  }, [center.lat, center.lng, zoom, mapReady]);

  // Render routes
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    const map = mapInstanceRef.current;
    (async () => {
      const L = await import('leaflet');

      // Clear existing route layers
      layersRef.current.forEach((layer, key) => {
        if (key.startsWith('route_')) {
          map.removeLayer(layer);
          layersRef.current.delete(key);
        }
      });

      routes.forEach((route, idx) => {
        const points = decodePolyline(route.polyline) as LatLng[];
        if (points.length < 2) return;

        const color = route.color || ROUTE_COLORS[idx % ROUTE_COLORS.length];
        const polyline = L.polyline(points, {
          color,
          weight: 4,
          opacity: 0.7,
        }) as DrawRunPolyline;
        polyline.addTo(map);

        if (route.onClick) {
          polyline.on('click', route.onClick);
        }

        layersRef.current.set(`route_${route.id}`, polyline);
      });
    })();
  }, [routes, mapReady]);

  // Render segments
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    const map = mapInstanceRef.current;
    (async () => {
      const L = await import('leaflet');

      layersRef.current.forEach((layer, key) => {
        if (key.startsWith('segment_')) {
          map.removeLayer(layer);
          layersRef.current.delete(key);
        }
      });

      segments.forEach((segment) => {
        const points: LatLng[] = [];
        if (segment.polyline) {
          const decoded = decodePolyline(segment.polyline) as LatLng[];
          points.push(...decoded);
        } else {
          points.push([segment.startLat, segment.startLng]);
          points.push([segment.endLat, segment.endLng]);
        }

        const polyline = L.polyline(points, {
          color: '#8b5cf6',
          weight: 3,
          opacity: 0.5,
          dashArray: '8 4',
        }) as DrawRunPolyline;
        polyline.addTo(map);

        if (segment.onClick) {
          polyline.on('click', segment.onClick);
        }

        const markerSize = window.innerWidth < 640 ? 14 : 10;
        const startIcon = L.divIcon({
          className: 'segment-marker-start',
          html: `<div style="width:${markerSize}px;height:${markerSize}px;background:#22c55e;border:2px solid white;border-radius:50%;"></div>`,
          iconSize: [markerSize, markerSize],
          iconAnchor: [markerSize / 2, markerSize / 2],
        });

        L.marker([segment.startLat, segment.startLng], { icon: startIcon }).addTo(map);

        const endIcon = L.divIcon({
          className: 'segment-marker-end',
          html: `<div style="width:${markerSize}px;height:${markerSize}px;background:#ef4444;border:2px solid white;border-radius:50%;"></div>`,
          iconSize: [markerSize, markerSize],
          iconAnchor: [markerSize / 2, markerSize / 2],
        });

        L.marker([segment.endLat, segment.endLng], { icon: endIcon }).addTo(map);

        layersRef.current.set(`segment_${segment.id}`, polyline);
      });
    })();
  }, [segments, mapReady]);

  // User location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    (async () => {
      const L = await import('leaflet');
      const map = mapInstanceRef.current!;

      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }

      if (userLocation) {
        const pulseIcon = L.divIcon({
          className: 'user-location-marker',
          html: `<div style="
            width:18px;height:18px;background:#3b82f6;border:3px solid white;
            border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3);
          "></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

        const marker = L.marker([userLocation.lat, userLocation.lng], {
          icon: pulseIcon,
          zIndexOffset: 1000,
        }) as DrawRunMarker;
        marker.addTo(map);
        userMarkerRef.current = marker;
      }
    })();
  }, [userLocation, mapReady]);

  // Heatmap layer
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    const map = mapInstanceRef.current!;

    if (heatmapLayerRef.current) {
      map.removeLayer(heatmapLayerRef.current as unknown as L.Layer);
      heatmapLayerRef.current = null;
    }

    if (showHeatmap && heatmapData.length > 0 && (window as unknown as { L: { heatLayer: unknown } }).L?.heatLayer) {
      const L = window.L;
      const points = heatmapData.map((d) => [d.lat, d.lng, d.intensity] as LatLngWithIntensity);
      const heat = L.heatLayer(points, {
        radius: 20,
        blur: 15,
        maxZoom: 17,
        max: 1.0,
        gradient: { 0.2: '#313695', 0.4: '#4575b4', 0.6: '#74add1', 0.8: '#fdae61', 1.0: '#f46d43' },
      }) as unknown as L.Layer;
      heat.addTo(map);
      heatmapLayerRef.current = heat as unknown as L.HeatLayer;
    }
  }, [showHeatmap, heatmapData, mapReady]);

  // Route creation waypoints
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    const map = mapInstanceRef.current;
    (async () => {
      const L = await import('leaflet');

      waypointMarkersRef.current.forEach((m) => {
        if (m && (m as unknown as { _map: unknown })._map) {
          map.removeLayer(m);
        }
      });
      waypointMarkersRef.current = [];

      if (creationPolylineRef.current) {
        map.removeLayer(creationPolylineRef.current);
        creationPolylineRef.current = null;
      }

      // Remove old loop closure layer
      layersRef.current.forEach((layer, key) => {
        if (key === 'loop_closure') {
          map.removeLayer(layer);
          layersRef.current.delete(key);
        }
      });

      if (routeCreationPoints.length === 0) return;

      routeCreationPoints.forEach((pt, idx) => {
        const waypointIcon = L.divIcon({
          className: 'waypoint-marker',
          html: `<div style="
            width:24px;height:24px;background:#3b82f6;border:3px solid white;
            border-radius:50%;display:flex;align-items:center;justify-content:center;
            color:white;font-size:11px;font-weight:bold;
          ">${idx + 1}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([pt.lat, pt.lng], {
          icon: waypointIcon,
          draggable: true,
        }) as DrawRunMarker;
        marker.addTo(map);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          if (onWaypointDrag) {
            onWaypointDrag(idx, { lat: pos.lat, lng: pos.lng });
          }
        });

        waypointMarkersRef.current.push(marker);
      });

      const polyPoints = routeCreationPoints.map((p) => [p.lat, p.lng] as LatLng);
      const polyline = L.polyline(polyPoints, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.8,
      }) as DrawRunPolyline;
      polyline.addTo(map);
      creationPolylineRef.current = polyline;

      // Render loop closure as dashed line
      if (isLoop && routeCreationPoints.length >= 3) {
        const first = routeCreationPoints[0];
        const last = routeCreationPoints[routeCreationPoints.length - 1];
        const loopLine = L.polyline(
          [[last.lat, last.lng], [first.lat, first.lng]],
          {
            color: '#3b82f6',
            weight: 3,
            opacity: 0.6,
            dashArray: '8 6',
          }
        ) as DrawRunPolyline;
        loopLine.addTo(map);
        layersRef.current.set('loop_closure', loopLine);
      }

      map.fitBounds(L.latLngBounds(polyPoints), { padding: [40, 40], maxZoom: 17 });
    })();

    return () => {
      waypointMarkersRef.current.forEach((m) => {
        if (m && (m as unknown as { _map: unknown })._map) {
          (m as unknown as { _map: { removeLayer: (layer: unknown) => void } })._map.removeLayer(m);
        }
      });
      if (creationPolylineRef.current) {
        const map = mapInstanceRef.current;
        if (map && creationPolylineRef.current && (creationPolylineRef.current as unknown as { _map: unknown })._map) {
          map.removeLayer(creationPolylineRef.current);
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeCreationPoints, mapReady, isLoop]);

  // Render current route polyline (for route detail preview)
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady || !currentRoutePolyline) return;
    (async () => {
      const L = await import('leaflet');
      const map = mapInstanceRef.current!;

      layersRef.current.forEach((layer, key) => {
        if (key.startsWith('current_route_')) {
          map.removeLayer(layer);
          layersRef.current.delete(key);
        }
      });

      const points = decodePolyline(currentRoutePolyline) as LatLng[];
      if (points.length < 2) return;

      const polyline = L.polyline(points, {
        color: '#f59e0b',
        weight: 5,
        opacity: 0.9,
      }) as DrawRunPolyline;
      polyline.addTo(map);

      layersRef.current.set('current_route_', polyline);
      map.fitBounds(L.latLngBounds(points), { padding: [20, 20], maxZoom: 17 });
    })();
  }, [currentRoutePolyline, mapReady]);

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '100%', minHeight: '400px' }}
      className="explore-map-container"
    />
  );
}
