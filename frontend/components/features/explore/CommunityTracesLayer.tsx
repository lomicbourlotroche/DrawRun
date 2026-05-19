'use client';

import { useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { decodePolyline } from '@/lib/utils';
import type { DrawRunMap, DrawRunPolyline, LatLng } from '@/types/leaflet';

/**
 * Community trace data
 */
interface CommunityTrace {
  id: number;
  polyline: string;
  distance: number;
  activity_type: string;
  difficulty?: string;
  elevation_gain?: number;
}

/**
 * Props for CommunityTracesLayer component
 */
interface CommunityTracesLayerProps {
  map: DrawRunMap;
  visible: boolean;
  activityType?: string;
}

const TRACE_COLOR = '#8b5cf6';
const TRACE_OPACITY = 0.25;
const TRACE_WEIGHT = 2;

/**
 * CommunityTracesLayer component for displaying community traces on a Leaflet map.
 * 
 * Features:
 * - Fetches community traces from the API
 * - Displays traces as polylines on the map
 * - Supports visibility toggling
 * - Fully typed with no `any` types
 * 
 * @param props - CommunityTracesLayerProps containing map, visibility, and activity type filter
 */
export default function CommunityTracesLayer({
  map,
  visible,
  activityType,
}: CommunityTracesLayerProps) {
  const tracesRef = useRef<DrawRunPolyline[]>([]);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!map || !visible) return;
    if (loadedRef.current) return;

    loadedRef.current = true;

    api.getCommunityTraces(activityType).then((res) => {
      if (!res.success || !res.traces) return;
      if (!map) return;

      import('leaflet').then((L) => {
        const layers: DrawRunPolyline[] = [];

        res.traces.forEach((trace: CommunityTrace) => {
          if (!trace.polyline) return;

          const points = decodePolyline(trace.polyline) as LatLng[];
          if (points.length < 2) return;

          const polyline = L.polyline(points, {
            color: TRACE_COLOR,
            weight: TRACE_WEIGHT,
            opacity: TRACE_OPACITY,
            smoothFactor: 1,
            interactive: false,
          }) as DrawRunPolyline;
          polyline.addTo(map);

          layers.push(polyline);
        });

        tracesRef.current = layers;
      });
    });

    return () => {
      loadedRef.current = false;
      tracesRef.current.forEach((layer) => {
        if (layer && (layer as unknown as { _map: unknown })._map) {
          map.removeLayer(layer);
        }
      });
      tracesRef.current = [];
    };
  }, [map, visible, activityType]);

  // Visibility toggle without re-fetching
  useEffect(() => {
    if (!map) return;

    if (visible) {
      tracesRef.current.forEach((layer) => {
        if (layer && !(layer as unknown as { _map: unknown })._map) {
          map.addLayer(layer);
        }
      });
    } else {
      tracesRef.current.forEach((layer) => {
        if (layer && (layer as unknown as { _map: unknown })._map) {
          map.removeLayer(layer);
        }
      });
    }
  }, [visible, map]);

  return null;
}
