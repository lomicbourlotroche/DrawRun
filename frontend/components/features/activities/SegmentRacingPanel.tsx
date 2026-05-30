'use client';
import { Upload, Plus, Ghost } from 'lucide-react';

interface Segment {
  id: string;
  name: string;
  description?: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  distance: number;
  elevationGain: number;
  personalRecord?: number;
}

interface SegmentRacingPanelProps {
  nearbySegments: Segment[];
  showSegmentsOnMap: boolean;
  activeSegment: Segment | null;
  onToggleShowOnMap: (_show: boolean) => void;
  onGhostRace: (_segment: Segment) => void;
  onImportGpx: () => void;
  onCreateSegment: () => void;
  onClose: () => void;
  formatDistance: (_meters: number) => string;
  formatDuration: (_seconds: number) => string;
}

export function SegmentRacingPanel({
  nearbySegments, showSegmentsOnMap, activeSegment,
  onToggleShowOnMap, onGhostRace, onImportGpx, onCreateSegment, onClose,
  formatDistance, formatDuration,
}: SegmentRacingPanelProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          type="button"
          onClick={onImportGpx}
          className="flex items-center gap-2 p-3 rounded-lg bg-surface hover:bg-surface-hover transition-colors"
        >
          <Upload className="w-4 h-4 text-peak-400" />
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Importer GPX</p>
            <p className="text-[10px] text-muted">Suivre une trace</p>
          </div>
        </button>
        <button
          type="button"
          onClick={onCreateSegment}
          className="flex items-center gap-2 p-3 rounded-lg bg-surface hover:bg-surface-hover transition-colors"
        >
          <Plus className="w-4 h-4 text-success" />
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Créer segment</p>
            <p className="text-[10px] text-muted">Depuis le tracé</p>
          </div>
        </button>
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground mb-3">
        <input type="checkbox" checked={showSegmentsOnMap} onChange={e => onToggleShowOnMap(e.target.checked)} className="rounded bg-surface border-surface" />
        Afficher les segments sur la carte
      </label>
      {nearbySegments.length === 0 && (
        <p className="text-center text-muted py-8">Aucun segment à proximité</p>
      )}
      {nearbySegments.map(seg => (
        <div
          key={seg.id}
          className="p-3 rounded-lg bg-surface/50"
        >
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium text-foreground">{seg.name}</p>
            {seg.personalRecord && (
              <span className="text-xs text-success font-mono">{formatDuration(seg.personalRecord)}</span>
            )}
          </div>
          <p className="text-sm text-muted">{formatDistance(seg.distance)} · {Math.round(seg.elevationGain)}m D+</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => onGhostRace(seg)}
              className="flex-1 h-8 rounded-md bg-surface-hover hover:bg-muted text-xs text-foreground flex items-center justify-center gap-1 transition-colors"
            >
              <Ghost className="w-3 h-3" />
              Ghost race
            </button>
          </div>
        </div>
      ))}
      {activeSegment && (
        <div className="p-3 rounded-lg bg-peak/10 border border-peak/20">
          <p className="text-sm font-medium text-peak-400">Segment en cours: {activeSegment.name}</p>
        </div>
      )}
      <button type="button" onClick={onClose} className="w-full h-12 rounded-lg bg-surface hover:bg-surface-hover text-foreground text-sm font-medium transition-colors">Retour</button>
    </div>
  );
}
