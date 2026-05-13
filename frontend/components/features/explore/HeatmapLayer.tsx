'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';

interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

interface HeatmapLayerProps {
  map: any;
  bounds: { north: number; south: number; east: number; west: number } | null;
  activityType?: string;
  visible: boolean;
}

export default function HeatmapLayer({
  map,
  bounds,
  activityType = 'Run',
  visible,
}: HeatmapLayerProps) {
  const [data, setData] = useState<HeatmapPoint[]>([]);
  const layerRef = useRef<any>(null);
  const prevVisible = useRef(false);

  useEffect(() => {
    if (!bounds || !visible) return;

    const centerLat = (bounds.north + bounds.south) / 2;
    const centerLng = (bounds.east + bounds.west) / 2;
    const radiusLat = Math.max(
      1000,
      (bounds.north - bounds.south) * 111000 * 0.6
    );

    api.getHeatmap(centerLat, centerLng, Math.round(radiusLat), activityType).then((res) => {
      if (res.success) {
        setData(res.heatmap);
      }
    });
  }, [bounds, activityType, visible]);

  useEffect(() => {
    if (!map || data.length === 0) return;

    import('leaflet').then(() => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }

      if (visible && (window as any).L?.heatLayer) {
        const points = data.map((d) => [d.lat, d.lng, d.intensity] as any);
        const heat = (window as any).L.heatLayer(points, {
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
        }).addTo(map);
        layerRef.current = heat;
      } else if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    });

    return () => {
      if (layerRef.current && map) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [data, visible, map]);

  // Visibility toggle without re-fetching
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
