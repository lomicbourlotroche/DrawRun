'use client';

import { useEffect, useRef } from 'react';
import { decodePolyline } from '@/lib/utils';
import type { DrawRunMap, LatLng } from '@/types/leaflet';
import L from 'leaflet';

interface CurrentRouteOverlayProps {
  map: DrawRunMap;
  currentRoutePolyline?: string;
}

export default function CurrentRouteOverlay({ map, currentRoutePolyline }: CurrentRouteOverlayProps) {
  const layersRef = useRef<Map<string, L.Polyline>>(new Map());

  useEffect(() => {
    if (!currentRoutePolyline) return;

    layersRef.current.forEach((layer, key) => {
      if (key.startsWith('current_route_')) {
        map.removeLayer(layer);
        layersRef.current.delete(key);
      }
    });

    const points = decodePolyline(currentRoutePolyline) as LatLng[];
    if (points.length < 2) return;

    const polyline = L.polyline(points, {
      color: 'var(--peak)',
      weight: 5,
      opacity: 0.9,
    });
    polyline.addTo(map);

    layersRef.current.set('current_route_', polyline);
    map.fitBounds(L.latLngBounds(points), { padding: [20, 20], maxZoom: 17 });
  }, [currentRoutePolyline, map]);

  return null;
}
