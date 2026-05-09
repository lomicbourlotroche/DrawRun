/* eslint-disable */
'use client';

import { useEffect, useRef, useState } from 'react';

interface ExploreMapProps {
  onMapReady?: (map: any) => void;
  onMapClick?: (latlng: { lat: number; lng: number }) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  mapLayer?: string;
  routes?: Array<{
    id: number;
    polyline: string;
    color?: string;
    name?: string;
    onClick?: () => void;
  }>;
  segments?: Array<{
    id: number;
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    polyline?: string;
    name?: string;
    onClick?: () => void;
  }>;
  userLocation?: { lat: number; lng: number } | null;
  heatmapData?: Array<{ lat: number; lng: number; intensity: number }>;
  showHeatmap?: boolean;
  routeCreationPoints?: Array<{ lat: number; lng: number }>;
  routeCreationActive?: boolean;
  onWaypointAdd?: (latlng: { lat: number; lng: number }) => void;
  onWaypointDrag?: (index: number, latlng: { lat: number; lng: number }) => void;
  currentRoutePolyline?: string;
  isLoop?: boolean;
}

function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

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
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const layersRef = useRef<Map<string, any>>(new Map());
  const heatmapLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const waypointMarkersRef = useRef<any[]>([]);
  const creationPolylineRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return;
    if (mapInstanceRef.current) return;

    const init = async () => {
      const L = await import('leaflet');

      const map = L.map(mapRef.current!, {
        zoomControl: false,
        attributionControl: true,
        zoom,
        center: [center.lat, center.lng],
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      const tileConfig = TILE_CONFIGS[mapLayer] || TILE_CONFIGS.osm;
      const tileLayer = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: 19,
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;

      if (onMapClick || onWaypointAdd) {
        map.on('click', (e: any) => {
          const ll = e.latlng;
          if (routeCreationActive && onWaypointAdd) {
            onWaypointAdd({ lat: ll.lat, lng: ll.lng });
          } else if (onMapClick) {
            onMapClick({ lat: ll.lat, lng: ll.lng });
          }
        });
      }

      setMapReady(true);
      onMapReady?.(map);
    };

    init();

    return () => {
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
      const map = mapInstanceRef.current;
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }
      const tileConfig = TILE_CONFIGS[mapLayer] || TILE_CONFIGS.osm;
      const tileLayer = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: 19,
      }).addTo(map);
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
        const points = decodePolyline(route.polyline);
        if (points.length < 2) return;

        const color = route.color || ROUTE_COLORS[idx % ROUTE_COLORS.length];
        const polyline = L.polyline(points, {
          color,
          weight: 4,
          opacity: 0.7,
        }).addTo(map);

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
        const points: [number, number][] = [];
        if (segment.polyline) {
          const decoded = decodePolyline(segment.polyline);
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
        }).addTo(map);

        if (segment.onClick) {
          polyline.on('click', segment.onClick);
        }

        const startIcon = L.divIcon({
          className: 'segment-marker-start',
          html: `<div style="width:10px;height:10px;background:#22c55e;border:2px solid white;border-radius:50%;"></div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        });

        L.marker([segment.startLat, segment.startLng], { icon: startIcon }).addTo(map);

        const endIcon = L.divIcon({
          className: 'segment-marker-end',
          html: `<div style="width:10px;height:10px;background:#ef4444;border:2px solid white;border-radius:50%;"></div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
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
      const map = mapInstanceRef.current;

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
        }).addTo(map);
        userMarkerRef.current = marker;
      }
    })();
  }, [userLocation, mapReady]);

  // Heatmap layer
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    const map = mapInstanceRef.current;

    if (heatmapLayerRef.current) {
      map.removeLayer(heatmapLayerRef.current);
      heatmapLayerRef.current = null;
    }

    if (showHeatmap && heatmapData.length > 0 && (window as any).L && (window as any).L.heatLayer) {
      const points = heatmapData.map((d) => [d.lat, d.lng, d.intensity] as any);
      const heat = (window as any).L.heatLayer(points, {
        radius: 20,
        blur: 15,
        maxZoom: 17,
        max: 1.0,
        gradient: { 0.2: '#blue', 0.5: '#lime', 0.8: '#yellow', 1.0: '#red' },
      }).addTo(map);
      heatmapLayerRef.current = heat;
    }
  }, [showHeatmap, heatmapData, mapReady]);

  // Route creation waypoints
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    const map = mapInstanceRef.current;
    (async () => {
      const L = await import('leaflet');

      waypointMarkersRef.current.forEach((m) => map.removeLayer(m));
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
        }).addTo(map);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          if (onWaypointDrag) {
            onWaypointDrag(idx, { lat: pos.lat, lng: pos.lng });
          }
        });

        waypointMarkersRef.current.push(marker);
      });

      const polyPoints = routeCreationPoints.map((p) => [p.lat, p.lng] as [number, number]);
      const polyline = L.polyline(polyPoints, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.8,
      }).addTo(map);
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
        ).addTo(map);
        layersRef.current.set('loop_closure', loopLine);
      }

      map.fitBounds(L.latLngBounds(polyPoints), { padding: [40, 40], maxZoom: 17 });
    })();

    return () => {
      waypointMarkersRef.current.forEach((m) => m._map?.removeLayer(m));
      if (creationPolylineRef.current) {
        creationPolylineRef.current._map?.removeLayer(creationPolylineRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeCreationPoints, mapReady, isLoop]);

  // Render current route polyline (for route detail preview)
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady || !currentRoutePolyline) return;
    (async () => {
      const L = await import('leaflet');
      const map = mapInstanceRef.current;

      layersRef.current.forEach((layer, key) => {
        if (key.startsWith('current_route_')) {
          map.removeLayer(layer);
          layersRef.current.delete(key);
        }
      });

      const points = decodePolyline(currentRoutePolyline);
      if (points.length < 2) return;

      const polyline = L.polyline(points, {
        color: '#f59e0b',
        weight: 5,
        opacity: 0.9,
      }).addTo(map);

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
