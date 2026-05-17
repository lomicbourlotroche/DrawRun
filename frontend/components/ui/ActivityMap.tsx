'use client';

import { useEffect, useRef, useMemo, useCallback } from 'react';
import type {
  ActivityMapProps,
  DrawRunMap,
  DrawRunPolyline,
  DrawRunMarker,
  DrawRunCircle,
  DrawRunCircleMarker,
  LatLng,
  MapSegment,
} from '@/types/leaflet';
import { decodePolyline } from '@/lib/polyline';
import L from 'leaflet';

/**
 * ActivityMap component for displaying GPS tracks and current position on a Leaflet map.
 * 
 * Features:
 * - Displays polyline tracks from encoded strings or coordinate arrays
 * - Shows current position with pulsing marker and accuracy circle
 * - Supports trail animation for live tracking
 * - Displays segments with custom colors
 * - Fully accessible with ARIA attributes
 * 
 * @param props - ActivityMapProps containing polyline, coordinates, position, and display options
 */
export default function ActivityMap({
  polyline,
  latlng,
  className = '',
  color = '#FF3B30',
  currentPosition,
  accuracy,
  showTrailAnimation = false,
  segments,
  onMapReady,
}: ActivityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<DrawRunMap | null>(null);
  const trailLayerRef = useRef<DrawRunPolyline | null>(null);
  const positionMarkerRef = useRef<DrawRunMarker | null>(null);
  const accuracyCircleRef = useRef<DrawRunCircle | null>(null);
  const segmentLayersRef = useRef<DrawRunPolyline[]>([]);
  const animationProgressRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const prevPointsLength = useRef(0);

  // Memoize decoded coordinates to prevent unnecessary recalculations
  const coordinates = useMemo<LatLng[]>(() => {
    if (polyline) return decodePolyline(polyline);
    if (latlng && latlng.length > 0) return latlng;
    return [];
  }, [polyline, latlng]);

  // Cleanup animation and map on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Initialize the map
  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return;

    const initMap = async () => {
      // Ensure Leaflet is loaded
      if (typeof window.L === 'undefined') {
        await import('leaflet');
      }
      const L = window.L;

      // Cleanup existing map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Check if we have data to display
      if (coordinates.length === 0 && !currentPosition) return;

      // Create map instance
      const map = L.map(mapRef.current!, {
        zoomControl: false,
        attributionControl: false,
        zoom: 16,
        center: currentPosition || (coordinates.length > 0 ? coordinates[0] : [48.8566, 2.3522]),
      }) as DrawRunMap;

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      // Trail polyline with progressive animation
      if (coordinates.length > 0) {
        if (showTrailAnimation && coordinates.length > 1) {
          const trailLine = L.polyline([coordinates[0]], {
            color,
            weight: 4,
            opacity: 0.8,
          }) as DrawRunPolyline;
          trailLine.addTo(map);
          trailLayerRef.current = trailLine;

          const totalLen = coordinates.length;
          let i = 1;
          const animateTrail = () => {
            if (i >= totalLen || !trailLine) return;
            const chunkSize = Math.max(1, Math.floor(totalLen / 60));
            const end = Math.min(i + chunkSize, totalLen);
            const segment = coordinates.slice(0, end);
            trailLine.setLatLngs(segment);
            i = end;
            animationFrameRef.current = requestAnimationFrame(animateTrail);
          };
          animateTrail();
        } else {
          const trailLine = L.polyline(coordinates, {
            color,
            weight: 4,
            opacity: 0.8,
          }) as DrawRunPolyline;
          trailLine.addTo(map);
          trailLayerRef.current = trailLine;
        }

        // Fit map to bounds
        map.fitBounds(L.latLngBounds(coordinates), { padding: [20, 20], maxZoom: 17 });

        // Add start marker (green)
        if (coordinates.length > 0) {
          L.circleMarker(coordinates[0], {
            radius: 8,
            fillColor: '#22c55e',
            color: '#fff',
            weight: 2,
            fillOpacity: 1,
          }).addTo(map);
        }

        // Add end marker (red)
        if (coordinates.length > 1) {
          L.circleMarker(coordinates[coordinates.length - 1], {
            radius: 8,
            fillColor: '#ef4444',
            color: '#fff',
            weight: 2,
            fillOpacity: 1,
          }).addTo(map);
        }
      }

      // Current position marker (pulsing)
      if (currentPosition) {
        const pulseIcon = L.divIcon({
          className: 'gps-pulse-marker',
          html: `<div style="
            width: 18px; height: 18px;
            background: #3B82F6;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 0 0 4px rgba(59,130,246,0.3), 0 0 0 8px rgba(59,130,246,0.15);
            animation: gps-pulse 2s ease-in-out infinite;
          "></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

        const marker = L.marker(currentPosition, {
          icon: pulseIcon,
          zIndexOffset: 1000,
        }) as DrawRunMarker;
        marker.addTo(map);
        positionMarkerRef.current = marker;

        // Accuracy circle
        if (accuracy && accuracy > 0 && accuracy < 200) {
          const circle = L.circle(currentPosition, {
            radius: accuracy,
            color: '#3B82F6',
            fillColor: '#3B82F6',
            fillOpacity: 0.1,
            weight: 1,
            opacity: 0.3,
          }) as DrawRunCircle;
          circle.addTo(map);
          accuracyCircleRef.current = circle;
        }
      }

      // Segment overlays
      if (segments && segments.length > 0) {
        segments.forEach((seg) => {
          const segColor = seg.color || '#8B5CF6';
          const segLine = L.polyline(
            [[seg.startLat, seg.startLng], [seg.endLat, seg.endLng]],
            {
              color: segColor,
              weight: 6,
              opacity: 0.6,
              dashArray: '10 6',
            }
          ) as DrawRunPolyline;
          segLine.addTo(map);
          segmentLayersRef.current.push(segLine);
        });
      }

      mapInstanceRef.current = map;
      onMapReady?.(map);
    };

    initMap();
  }, [polyline, latlng, color, currentPosition, accuracy, showTrailAnimation, coordinates]);

  // Update trail progressively when new points arrive
  useEffect(() => {
    if (!mapInstanceRef.current || !latlng || latlng.length === 0) return;

    const map = mapInstanceRef.current;

    if (latlng.length > prevPointsLength.current && trailLayerRef.current) {
      trailLayerRef.current.setLatLngs(latlng);

      if (currentPosition) {
        map.panTo(currentPosition, { animate: true, duration: 0.3 });
      }
    }

    // Update position marker position
    if (currentPosition && positionMarkerRef.current) {
      positionMarkerRef.current.setLatLng(currentPosition);
      if (accuracyCircleRef.current && accuracy) {
        accuracyCircleRef.current.setLatLng(currentPosition);
        accuracyCircleRef.current.setRadius(accuracy);
      }
    }

    prevPointsLength.current = latlng?.length || 0;
  }, [latlng, currentPosition, accuracy]);

  const hasData = polyline || (latlng && latlng.length > 0) || !!currentPosition;

  if (!hasData) {
    return (
      <div
        className={`bg-background rounded-lg flex items-center justify-center ${className}`}
        style={{ minHeight: '200px' }}
        role="region"
        aria-label="Carte sans données GPS"
      >
        <div className="text-center text-muted">
          <svg
            className="w-12 h-12 mx-auto mb-2 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <p className="text-sm">Pas de données GPS</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg overflow-hidden border border-border ${className}`}
      role="region"
      aria-label="Carte d'activité avec parcours GPS"
    >
      <style jsx>{`
        @keyframes gps-pulse {
          0% { box-shadow: 0 0 0 4px rgba(59,130,246,0.3); }
          50% { box-shadow: 0 0 0 4px rgba(59,130,246,0.3), 0 0 0 12px rgba(59,130,246,0.1); }
          100% { box-shadow: 0 0 0 4px rgba(59,130,246,0.3); }
        }
      `}</style>
      <div
        ref={mapRef}
        style={{ height: '100%', minHeight: '250px' }}
        aria-label="Carte interactive affichant le parcours de l'activité"
        role="application"
      />
    </div>
  );
}
