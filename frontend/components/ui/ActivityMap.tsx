/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef } from 'react';

interface ActivityMapProps {
  polyline?: string | null;
  latlng?: [number, number][];
  className?: string;
  color?: string;
  currentPosition?: [number, number] | null;
  accuracy?: number;
  showTrailAnimation?: boolean;
  segments?: Array<{
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    color?: string;
  }>;
  onMapReady?: (map: any) => void;
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

export default function ActivityMap({
  polyline, latlng, className = '', color = '#FF3B30',
  currentPosition, accuracy, showTrailAnimation = false,
  segments, onMapReady,
}: ActivityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const trailLayerRef = useRef<any>(null);
  const positionMarkerRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);
  const segmentLayersRef = useRef<any[]>([]);
  const animationProgressRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const prevPointsLength = useRef(0);

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return;

    const initMap = async () => {
      const L = await import('leaflet');

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      let coordinates: [number, number][] = [];
      if (polyline) coordinates = decodePolyline(polyline);
      else if (latlng && latlng.length > 0) coordinates = latlng;

      if (coordinates.length === 0 && !currentPosition) return;

      const map = L.map(mapRef.current!, {
        zoomControl: false,
        attributionControl: false,
        zoom: 16,
        center: currentPosition || (coordinates.length > 0 ? coordinates[0] : [48.8566, 2.3522]),
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      // Trail polyline with progressive animation
      if (coordinates.length > 0) {
        if (showTrailAnimation && coordinates.length > 1) {
          const trailLine = L.polyline([coordinates[0]], {
            color, weight: 4, opacity: 0.8,
          }).addTo(map);
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
            color, weight: 4, opacity: 0.8,
          }).addTo(map);
          trailLayerRef.current = trailLine;
        }

        map.fitBounds(L.latLngBounds(coordinates), { padding: [20, 20], maxZoom: 17 });

        if (coordinates.length > 0) {
          L.circleMarker(coordinates[0], {
            radius: 8, fillColor: '#22c55e', color: '#fff', weight: 2, fillOpacity: 1,
          }).addTo(map);
        }
        if (coordinates.length > 1) {
          L.circleMarker(coordinates[coordinates.length - 1], {
            radius: 8, fillColor: '#ef4444', color: '#fff', weight: 2, fillOpacity: 1,
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

        const marker = L.marker(currentPosition, { icon: pulseIcon, zIndexOffset: 1000 }).addTo(map);
        positionMarkerRef.current = marker;

        if (accuracy && accuracy > 0 && accuracy < 200) {
          const circle = L.circle(currentPosition, {
            radius: accuracy,
            color: '#3B82F6',
            fillColor: '#3B82F6',
            fillOpacity: 0.1,
            weight: 1,
            opacity: 0.3,
          }).addTo(map);
          accuracyCircleRef.current = circle;
        }
      }

      // Segment overlays
      if (segments && segments.length > 0) {
        segments.forEach(seg => {
          const segColor = seg.color || '#8B5CF6';
          const segLine = L.polyline([[seg.startLat, seg.startLng], [seg.endLat, seg.endLng]], {
            color: segColor, weight: 6, opacity: 0.6, dashArray: '10 6',
          }).addTo(map);
          segmentLayersRef.current.push(segLine);
        });
      }

      mapInstanceRef.current = map;
      onMapReady?.(map);
    };

    initMap();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [polyline, latlng, color]);

  // Update trail progressively when new points arrive
  useEffect(() => {
    if (!mapInstanceRef.current || !latlng || latlng.length === 0) return;

    const map = mapInstanceRef.current;
    const L = (window as any).L;

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

    prevPointsLength.current = latlng.length;
  }, [latlng, currentPosition, accuracy]);

  const hasData = polyline || (latlng && latlng.length > 0) || !!currentPosition;

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
      <style>{`
        @keyframes gps-pulse {
          0% { box-shadow: 0 0 0 4px rgba(59,130,246,0.3); }
          50% { box-shadow: 0 0 0 4px rgba(59,130,246,0.3), 0 0 0 12px rgba(59,130,246,0.1); }
          100% { box-shadow: 0 0 0 4px rgba(59,130,246,0.3); }
        }
      `}</style>
      <div ref={mapRef} style={{ height: '100%', minHeight: '250px' }} />
    </div>
  );
}
