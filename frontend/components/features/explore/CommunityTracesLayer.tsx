'use client';

import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';

interface CommunityTrace {
  id: number;
  polyline: string;
  distance: number;
  activity_type: string;
  difficulty?: string;
  elevation_gain?: number;
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

interface CommunityTracesLayerProps {
  map: any;
  visible: boolean;
  activityType?: string;
}

const TRACE_COLOR = '#8b5cf6';
const TRACE_OPACITY = 0.25;
const TRACE_WEIGHT = 2;

export default function CommunityTracesLayer({
  map,
  visible,
  activityType,
}: CommunityTracesLayerProps) {
  const tracesRef = useRef<any[]>([]);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!map || !visible) return;
    if (loadedRef.current) return;

    loadedRef.current = true;

    api.getCommunityTraces(activityType).then((res) => {
      if (!res.success || !res.traces) return;
      if (!map) return;

      import('leaflet').then((L) => {
        const layers: any[] = [];

        res.traces.forEach((trace: CommunityTrace) => {
          if (!trace.polyline) return;

          const points = decodePolyline(trace.polyline);
          if (points.length < 2) return;

          const polyline = L.polyline(points, {
            color: TRACE_COLOR,
            weight: TRACE_WEIGHT,
            opacity: TRACE_OPACITY,
            smoothFactor: 1,
            interactive: false,
          }).addTo(map);

          layers.push(polyline);
        });

        tracesRef.current = layers;
      });
    });

    return () => {
      loadedRef.current = false;
      tracesRef.current.forEach((l) => {
        if (l._map) l.remove();
      });
      tracesRef.current = [];
    };
  }, [map, visible, activityType]);

  // Visibility toggle without re-fetching
  useEffect(() => {
    if (!map) return;

    if (visible) {
      tracesRef.current.forEach((l) => {
        if (!l._map) l.addTo(map);
      });
    } else {
      tracesRef.current.forEach((l) => {
        if (l._map) l.remove();
      });
    }
  }, [visible, map]);

  return null;
}
