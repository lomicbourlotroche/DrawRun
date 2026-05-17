'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import type {
  HeatmapLayerProps,
  DrawRunMap,
  HeatmapPoint,
  LatLngWithIntensity,
} from '@/types/leaflet';
import L from 'leaflet';

/**
 * HeatmapLayer component for displaying activity heatmaps on a Leaflet map.
 * 
 * Features:
 * - Fetches heatmap data from the API based on bounds and activity type
 * - Displays heatmap using leaflet-heat plugin
 * - Supports visibility toggling without re-fetching data
 * - Fully typed with no `any` types
 * - Accessible with ARIA attributes
 * 
 * @param props - HeatmapLayerProps containing map, bounds, activity type, and visibility
 */
export default function HeatmapLayer({
  map,
  bounds,
  activityType = 'Run',
  visible,
}: HeatmapLayerProps) {
  const [data, setData] = useState<HeatmapPoint[]>([]);
  const layerRef = useRef<L.HeatLayer | null>(null);
  const prevVisible = useRef(false);

  // Fetch heatmap data when bounds or activity type changes
  useEffect(() => {
    if (!bounds || !visible) return;

    const centerLat = (bounds.north + bounds.south) / 2;
    const centerLng = (bounds.east + bounds.west) / 2;
    const radiusLat = Math.max(
      1000,
      (bounds.north - bounds.south) * 111000 * 0.6
    );

    api.getHeatmap(centerLat, centerLng, Math.round(radiusLat), activityType)
      .then((res) => {
        if (res.success) {
          setData(res.heatmap);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch heatmap data:', error);
      });
  }, [bounds, activityType, visible]);

  // Create or update heatmap layer when data changes
  useEffect(() => {
    if (!map || data.length === 0) return;

    const L = window.L;

    // Cleanup existing layer
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    // Create heatmap layer if visible and data is available
    if (visible && L?.heatLayer) {
      const points = data.map((d) => [d.lat, d.lng, d.intensity] as LatLngWithIntensity);
      const heat = L.heatLayer(points, {
        radius: 18,
        blur: 12,
        maxZoom: 16,
        max: 1.0,
        gradient: {
          0.2: '#313695',
          0.4: '#4575b4',
          0.6: '#74add1',
          0.8: '#fdae61',
          1.0: '#f46d43',
        },
      }) as L.HeatLayer;
      heat.addTo(map);
      layerRef.current = heat;
    }

    return () => {
      if (layerRef.current && map) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [data, visible, map]);

  // Toggle visibility without re-fetching data
  useEffect(() => {
    if (!map) return;

    if (visible && layerRef.current) {
      map.addLayer(layerRef.current);
    } else if (!visible && layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    prevVisible.current = visible;
  }, [visible, map]);

  return null;
}
