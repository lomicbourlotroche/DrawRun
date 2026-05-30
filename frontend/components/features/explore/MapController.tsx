'use client';

import { useEffect, useRef, useState } from 'react';
import type { DrawRunMap } from '@/types/leaflet';
import L from 'leaflet';

interface CoordinatePoint {
  lat: number;
  lng: number;
}

interface MapControllerProps {
  center: CoordinatePoint;
  zoom: number;
  mapLayer: string;
  routeCreationActive: boolean;
  onMapReady: (_map: DrawRunMap) => void;
  onMapClick?: (_latlng: CoordinatePoint) => void;
  onWaypointAdd?: (_latlng: CoordinatePoint) => void;
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

export default function MapController({
  center,
  zoom,
  mapLayer,
  routeCreationActive,
  onMapReady,
  onMapClick,
  onWaypointAdd,
}: MapControllerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<DrawRunMap | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return;
    if (mapInstanceRef.current) return;

    const init = async () => {
      window.L = L;
      // @ts-ignore - leaflet.heat has no types
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
      });
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
      onMapReady(map);
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

  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    const map = mapInstanceRef.current;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const tileConfig = TILE_CONFIGS[mapLayer] || TILE_CONFIGS.osm;
    const tileLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 19,
    });
    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;
  }, [mapLayer, mapReady]);

  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    mapInstanceRef.current.setView([center.lat, center.lng], zoom);
  }, [center.lat, center.lng, zoom, mapReady]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full min-h-[400px] explore-map-container"
    />
  );
}
