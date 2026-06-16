/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useRef } from 'react';
import { decodePolyline } from '@/lib/utils';
import type { DrawRunMap, LatLng } from '@/types/leaflet';
import L from 'leaflet';

interface RouteData {
  id: number;
  polyline: string;
  color?: string;
  name?: string;
  onClick?: () => void;
}

interface RouteOverlayProps {
  map: DrawRunMap;
  routes: RouteData[];
}

const ROUTE_COLORS = ['var(--danger)', 'var(--primary)', 'var(--success)', 'var(--peak)', 'var(--secondary)', 'var(--danger)'];

export default function RouteOverlay({ map, routes }: RouteOverlayProps) {
  const layersRef = useRef<Map<string, L.Polyline>>(new Map());

  useEffect(() => {
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
      });
      polyline.addTo(map);

      if (route.onClick) {
        polyline.on('click', route.onClick);
      }

      layersRef.current.set(`route_${route.id}`, polyline);
    });

    // Cleanup all route layers on unmount
    return () => {
      layersRef.current.forEach((layer, key) => {
        if (key.startsWith('route_')) {
          map.removeLayer(layer);
          layersRef.current.delete(key);
        }
      });
      layersRef.current.clear();
    };
  }, [routes, map]);

  return null;
}
