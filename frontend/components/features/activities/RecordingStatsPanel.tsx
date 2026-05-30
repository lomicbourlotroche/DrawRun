'use client';
import { Mountain, TrendingUp, Heart, Gauge, Flag } from 'lucide-react';
import type { FilteredGPSPoint } from '@/lib/gpsFilter';
import type { LapData } from '@/lib/offlineQueue';

interface RecordingStats {
  distance: number;
  duration: number;
  elapsedTime: number;
  avgSpeed: number;
  maxSpeed: number;
  elevationGain: number;
  elevationLoss: number;
  cadence: number | null;
  avgHR: number | null;
  maxHR: number | null;
  currentHR: number | null;
  gap: number | null;
}

interface RecordingStatsPanelProps {
  stats: RecordingStats;
  currentGPS: FilteredGPSPoint | null;
  hrConnected: boolean;
  hrData: { heartRate: number; timestamp: number } | null;
  laps: LapData[];
  formatPace: (_speedKmh: number) => string;
  formatDuration: (_seconds: number) => string;
}

export function RecordingStatsPanel({
  stats, currentGPS, hrConnected, hrData, laps,
  formatPace, formatDuration,
}: RecordingStatsPanelProps) {
  return (
    <>
      <div className="w-full max-w-sm mb-4">
        <div className="flex items-center justify-between py-3 border-y border-surface">
          <div className="flex-1 text-center">
            <div className="text-3xl font-bold text-foreground">
              {stats.distance < 1000 ? Math.round(stats.distance) : (stats.distance / 1000).toFixed(2)}
            </div>
            <div className="text-xs text-muted mt-0.5">{stats.distance < 1000 ? 'mètres' : 'km'}</div>
          </div>
          <div className="w-px h-10 bg-surface" />
          <div className="flex-1 text-center">
            <div className="text-3xl font-bold text-foreground">{formatDuration(stats.duration)}</div>
            <div className="text-xs text-muted mt-0.5">durée</div>
          </div>
          <div className="w-px h-10 bg-surface" />
          <div className="flex-1 text-center">
            <div className="text-3xl font-bold text-foreground">
              {stats.avgSpeed > 0 ? formatPace(stats.avgSpeed) : '--:--'}
            </div>
            <div className="text-xs text-muted mt-0.5">allure</div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center w-full max-w-sm mb-4">
        {stats.elevationGain > 0 && (
          <div className="bg-surface rounded-md px-2.5 py-1.5 flex items-center gap-1.5 text-xs">
            <Mountain className="w-3.5 h-3.5 text-success" />
            <span className="text-foreground font-medium">+{Math.round(stats.elevationGain)}m</span>
          </div>
        )}
        {currentGPS && currentGPS.speed && currentGPS.speed > 0 && (
          <div className="bg-surface rounded-md px-2.5 py-1.5 flex items-center gap-1.5 text-xs">
            <TrendingUp className="w-3.5 h-3.5 text-success/80" />
            <span className="text-foreground font-medium">{(currentGPS.speed * 3.6).toFixed(1)} km/h</span>
          </div>
        )}
        {hrConnected && hrData && (
          <div className="bg-surface rounded-md px-2.5 py-1.5 flex items-center gap-1.5 text-xs">
            <Heart className="w-3.5 h-3.5 text-danger/80" />
            <span className="text-foreground font-medium">{hrData.heartRate} bpm</span>
          </div>
        )}
        {stats.gap && (
          <div className="bg-surface rounded-md px-2.5 py-1.5 flex items-center gap-1.5 text-xs">
            <Gauge className="w-3.5 h-3.5 text-secondary" />
            <span className="text-foreground font-medium">{formatDuration(stats.gap)}/km</span>
          </div>
        )}
        {laps.length > 0 && (
          <div className="bg-surface rounded-md px-2.5 py-1.5 flex items-center gap-1.5 text-xs">
            <Flag className="w-3.5 h-3.5 text-warning" />
            <span className="text-foreground font-medium">{laps.length} tour{(laps.length > 1 ? 's' : '')}</span>
          </div>
        )}
      </div>
    </>
  );
}
