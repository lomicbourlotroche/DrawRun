'use client';

import { useEffect, useRef } from 'react';
import type { DrawRunMap, LatLngWithIntensity } from '@/types/leaflet';
import L from 'leaflet';

interface HeatmapDataPoint {
  lat: number;
  lng: number;
  intensity: number;
}

interface HeatmapOverlayProps {
  map: DrawRunMap;
  heatmapData: HeatmapDataPoint[];
  showHeatmap: boolean;
}

export default function HeatmapOverlay({ map, heatmapData, showHeatmap }: HeatmapOverlayProps) {
  const layerRef = useRef<L.HeatLayer | null>(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current as unknown as L.Layer);
      layerRef.current = null;
    }

    if (showHeatmap && heatmapData.length > 0) {
      const wL = window.L as unknown as { heatLayer: (_points: [number, number, number][], _options?: Record<string, unknown>) => L.Layer };
      if (wL.heatLayer) {
        const points = heatmapData.map((d) => [d.lat, d.lng, d.intensity] as LatLngWithIntensity);
        const heat = wL.heatLayer(points, {
          radius: 20,
          blur: 15,
          maxZoom: 17,
          max: 1.0,
          gradient: {
            0.2: 'var(--primary)',
            0.4: 'var(--primary)',
            0.6: 'var(--primary)',
            0.8: 'var(--peak)',
            1.0: 'var(--peak)',
          },
        });
        heat.addTo(map);
        layerRef.current = heat as unknown as L.HeatLayer;
      }
    }

    // Cleanup heatmap layer on unmount
    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current as unknown as L.Layer);
        layerRef.current = null;
      }
    };
  }, [showHeatmap, heatmapData, map]);

  return null;
}
