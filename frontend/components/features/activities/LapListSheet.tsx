'use client';
import type { LapData } from '@/lib/offlineQueue';

interface LapListSheetProps {
  laps: LapData[];
  formatDistance: (_meters: number) => string;
  formatDuration: (_seconds: number) => string;
}

export function LapListSheet({ laps, formatDistance, formatDuration }: LapListSheetProps) {
  if (laps.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-2">Tours</h3>
      <div className="space-y-px">
        {laps.map(lap => (
          <div key={lap.number} className="flex items-center justify-between text-sm px-3 py-2.5 bg-surface first:rounded-t-lg last:rounded-b-lg">
            <span className="text-muted">Tour {lap.number}</span>
            <span className="text-muted">{formatDistance(lap.distance)}</span>
            <span className="text-foreground font-mono">{formatDuration(lap.duration)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
