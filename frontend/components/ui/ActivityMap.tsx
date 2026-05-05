/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef } from 'react';

interface ActivityMapProps {
  polyline?: string | null;
  latlng?: [number, number][];
  className?: string;
  color?: string;
}

// Decode Google Polyline format
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

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ActivityMap({ polyline, latlng, className = '', color = '#FF3B30' }: ActivityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // @ts-ignore
  const mapInstanceRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Only run on client side
    if (typeof window === 'undefined') return;

    const initMap = async () => {
      const L = await import('leaflet');

      // Clean up existing map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Get coordinates
      let coordinates: [number, number][] = [];
      
      if (polyline) {
        coordinates = decodePolyline(polyline);
      } else if (latlng && latlng.length > 0) {
        coordinates = latlng;
      }

      if (coordinates.length === 0) {
        return;
      }

      // Create map
      const map = L.map(mapRef.current!, {
        zoomControl: false,
        attributionControl: false,
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      // Add polyline
      const polylineLayer = L.polyline(coordinates, {
        color: color,
        weight: 4,
        opacity: 0.8,
      }).addTo(map);

      // Fit bounds
      map.fitBounds(polylineLayer.getBounds(), { padding: [20, 20] });

      // Add start marker
      if (coordinates.length > 0) {
        L.circleMarker(coordinates[0], {
          radius: 8,
          fillColor: '#22c55e',
          color: '#fff',
          weight: 2,
          fillOpacity: 1,
        }).addTo(map);
      }

      // Add end marker
      if (coordinates.length > 1) {
        L.circleMarker(coordinates[coordinates.length - 1], {
          radius: 8,
          fillColor: '#ef4444',
          color: '#fff',
          weight: 2,
          fillOpacity: 1,
        }).addTo(map);
      }

      mapInstanceRef.current = map;
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [polyline, latlng, color]);

  const hasData = polyline || (latlng && latlng.length > 0);

  if (!hasData) {
    return (
      <div className={`bg-background rounded-lg flex items-center justify-center ${className}`} style={{ minHeight: '200px' }}>
        <div className="text-center text-muted">
          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-sm">Pas de données GPS</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg overflow-hidden border border-border ${className}`}>
      <div ref={mapRef} style={{ height: '100%', minHeight: '250px' }} />
    </div>
  );
}
