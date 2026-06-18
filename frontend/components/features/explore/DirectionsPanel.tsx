'use client';

import { useMemo } from 'react';
import { MapPin, ChevronLeft } from '@/components/ui/icons';
import type { Direction } from '@/lib/api';

interface DirectionsPanelProps {
  directions: Direction[];
  totalDistance: string;
  totalDuration: string;
  elevationGain: number;
  routeName: string;
  onClose?: () => void;
  onBack?: () => void;
}

function getDirectionIcon(type: string, modifier: string): string {
  const turnIcons: Record<string, string> = {
    'turn-left': '←',
    'turn-right': '→',
    'turn-slight-left': '↖',
    'turn-slight-right': '↗',
    'turn-sharp-left': '↰',
    'turn-sharp-right': '↱',
    'straight': '↑',
    'uturn': '↩',
    'fork-left': '↙',
    'fork-right': '↘',
    'ramp-left': '↙',
    'ramp-right': '↘',
    'roundabout': '⟳',
    'roundabout-turn': '⟳',
    'arrive': '📍',
    'depart': '🏁',
    'merge': '⇉',
    'continue': '↑',
    'end': '🏁',
  };
  
  const key = modifier ? `${type}-${modifier}` : type;
  return turnIcons[key] || turnIcons[type] || '↑';
}

export default function DirectionsPanel({
  directions,
  totalDistance,
  totalDuration,
  elevationGain,
  routeName,
  onClose,
  onBack,
}: DirectionsPanelProps) {
  const stats = useMemo(() => [
    { label: 'Distance', value: totalDistance },
    { label: 'Durée estimée', value: totalDuration },
    { label: 'Dénivelé +', value: `${elevationGain} m` },
    { label: 'Directions', value: `${directions.length}` },
  ], [directions.length, elevationGain, totalDistance, totalDuration]);

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors"
                aria-label="Retour"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold text-foreground leading-tight">{routeName}</h2>
              <p className="text-xs text-muted-foreground">Itinéraire détaillé</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              aria-label="Fermer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-px bg-border/50">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-surface p-3 text-center">
              <div className="text-base font-bold text-primary">{stat.value}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Directions list */}
      <div className="flex-1 overflow-y-auto">
        {directions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
            <MapPin className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-sm">Aucune direction disponible</p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[30px] top-0 bottom-0 w-0.5 bg-primary/20" />

            {directions.map((dir, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === directions.length - 1;
              
              return (
                <div key={dir.index || idx} className="relative flex items-start gap-4 p-4 pl-0">
                  {/* Timeline dot + icon */}
                  <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-[60px]">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-lg
                      ${isFirst
                        ? 'bg-primary text-white shadow-md shadow-primary/25'
                        : isLast
                          ? 'bg-success text-white'
                          : 'bg-muted text-muted-foreground'
                      }
                    `}>
                      {getDirectionIcon(dir.type, dir.modifier)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground leading-tight">
                        {dir.instruction}
                      </p>
                      <span className="text-xs font-bold text-primary whitespace-nowrap flex-shrink-0">
                        {dir.distance_formatted}
                      </span>
                    </div>
                    {dir.street && (
                      <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                        {dir.street}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
