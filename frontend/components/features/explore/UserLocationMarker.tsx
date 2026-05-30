'use client';

import { useEffect, useRef } from 'react';
import type { DrawRunMap, DrawRunMarker } from '@/types/leaflet';
import L from 'leaflet';

interface CoordinatePoint {
  lat: number;
  lng: number;
}

interface UserLocationMarkerProps {
  map: DrawRunMap;
  userLocation: CoordinatePoint | null | undefined;
}

export default function UserLocationMarker({ map, userLocation }: UserLocationMarkerProps) {
  const markerRef = useRef<DrawRunMarker | null>(null);

  useEffect(() => {
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }

    if (userLocation) {
      const pulseIcon = L.divIcon({
        className: 'user-location-marker',
        html: `<div style="
          width:18px;height:18px;background:var(--primary);border:3px solid var(--surface);
          border-radius:50%;box-shadow:0 0 0 4px var(--primary-400);
        "></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([userLocation.lat, userLocation.lng], {
        icon: pulseIcon,
        zIndexOffset: 1000,
      }) as DrawRunMarker;
      marker.addTo(map);
      markerRef.current = marker;
    }
  }, [userLocation, map]);

  return null;
}
