'use client';

import { useEffect, useRef } from 'react';
import { decodePolyline } from '@/lib/utils';
import type { DrawRunMap, LatLng } from '@/types/leaflet';
import L from 'leaflet';

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

interface SegmentOverlayProps {
  map: DrawRunMap;
  segments: SegmentData[];
}

export default function SegmentOverlay({ map, segments }: SegmentOverlayProps) {
  const layersRef = useRef<Map<string, L.Layer>>(new Map());

  useEffect(() => {
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
        color: 'var(--secondary)',
        weight: 3,
        opacity: 0.5,
        dashArray: '8 4',
      });
      polyline.addTo(map);

      if (segment.onClick) {
        polyline.on('click', segment.onClick);
      }

      const markerSize = window.innerWidth < 640 ? 14 : 10;
      const startIcon = L.divIcon({
        className: 'segment-marker-start',
        html: `<div style="width:${markerSize}px;height:${markerSize}px;background:var(--success);border:2px solid var(--surface);border-radius:50%;"></div>`,
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize / 2],
      });

      L.marker([segment.startLat, segment.startLng], { icon: startIcon }).addTo(map);

      const endIcon = L.divIcon({
        className: 'segment-marker-end',
        html: `<div style="width:${markerSize}px;height:${markerSize}px;background:var(--danger);border:2px solid var(--surface);border-radius:50%;"></div>`,
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize / 2],
      });

      L.marker([segment.endLat, segment.endLng], { icon: endIcon }).addTo(map);

      layersRef.current.set(`segment_${segment.id}`, polyline);
    });
  }, [segments, map]);

  return null;
}
