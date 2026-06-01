'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import CommunityTracesLayer from '@/components/features/explore/CommunityTracesLayer';
import type { DrawRunMap } from '@/types/leaflet';

interface HeatmapViewProps {
  mapCenter: { lat: number; lng: number };
  activeFilterType: string;
  mapInstance: DrawRunMap | null;
  routePlannerOpen: boolean;
  showHeatmap: boolean;
  onShowHeatmapChange: (_show: boolean) => void;
  onHeatmapDataChange: (_data: Array<{ lat: number; lng: number; intensity: number }>) => void;
}

export default function HeatmapView({
  mapCenter,
  activeFilterType,
  mapInstance,
  routePlannerOpen,
  showHeatmap,
  onShowHeatmapChange,
  onHeatmapDataChange,
}: HeatmapViewProps) {
  const [showCommunityTraces, setShowCommunityTraces] = useState(false);

  useEffect(() => {
    if (!showHeatmap) {
      onHeatmapDataChange([]);
      return;
    }
    const radius = 10000;
    api.getHeatmap(mapCenter.lat, mapCenter.lng, radius, activeFilterType || undefined).then((res) => {
      if (res.success) {
        onHeatmapDataChange(res.heatmap || []);
      }
    }).catch(() => {});
  }, [showHeatmap, mapCenter, activeFilterType, onHeatmapDataChange]);

  return (
    <>
      {mapInstance && (
        <CommunityTracesLayer
          map={mapInstance}
          visible={showCommunityTraces && !routePlannerOpen}
        />
      )}
      <button
        onClick={() => onShowHeatmapChange(!showHeatmap)}
        className={`flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg shadow-md border transition-all ${
          showHeatmap
            ? 'bg-peak text-white border-peak'
            : 'bg-surface/90 backdrop-blur-sm border-border hover:bg-surface text-muted-foreground'
        }`}
        title="Heatmap"
        aria-label={showHeatmap ? 'Désactiver la heatmap' : 'Activer la heatmap'}
        aria-pressed={showHeatmap}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="12" r="6" strokeDasharray="2 2" />
          <circle cx="12" cy="12" r="10" strokeDasharray="2 4" />
        </svg>
      </button>
      <button
        onClick={() => setShowCommunityTraces((p) => !p)}
        className={`flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg shadow-md border transition-all ${
          showCommunityTraces
            ? 'bg-secondary-500 text-secondary-foreground border-secondary-500'
            : 'bg-surface/90 backdrop-blur-sm border-border hover:bg-surface text-muted-foreground'
        }`}
        title="Traces de la communauté"
        aria-label={showCommunityTraces ? 'Masquer les traces de la communauté' : 'Afficher les traces de la communauté'}
        aria-pressed={showCommunityTraces}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16M4 12h16M4 19h7" />
        </svg>
      </button>
    </>
  );
}
