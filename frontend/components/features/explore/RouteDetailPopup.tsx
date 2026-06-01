'use client';

import { X, MapPin, Mountain, Clock, Star, TrendingUp } from '@/components/ui/icons';
import { Button, Badge } from '@/components/ui';

interface RouteDetail {
  id: number;
  name: string;
  description?: string;
  distance: number;
  elevation_gain: number;
  elevation_loss?: number;
  activity_type: string;
  estimated_duration?: number;
  difficulty?: string;
  avg_rating?: number;
  rating_count?: number;
  usage_count: number;
  creator_name?: string;
}

interface RouteDetailPopupProps {
  route: RouteDetail;
  onClose: () => void;
  onViewDetails: () => void;
  onUseRoute?: () => void;
}

function formatDist(m: number): string {
  return `${(m / 1000).toFixed(1)} km`;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m > 0 ? m : ''}`;
  return `${m} min`;
}

const DIFFICULTY_LABELS: Record<string, { label: string; color: string }> = {
  easy: { label: 'Facile', color: 'bg-success-50 text-success-700 border-success-300' },
  medium: { label: 'Modéré', color: 'bg-warning-50 text-warning-700 border-warning-300' },
  hard: { label: 'Difficile', color: 'bg-danger-50 text-danger-700 border-danger-300' },
};

const ACTIVITY_ICONS: Record<string, string> = {
  Run: '🏃',
  Bike: '🚴',
  Swim: '🏊',
  Hike: '🥾',
};

export default function RouteDetailPopup({
  route,
  onClose,
  onViewDetails,
  onUseRoute,
}: RouteDetailPopupProps) {
  const diff = DIFFICULTY_LABELS[route.difficulty || 'medium'];

  return (
    <div className="absolute top-20 left-4 right-4 sm:left-4 sm:w-72 sm:right-auto z-[600] bg-surface/95 backdrop-blur-md rounded-xl shadow-xl border border-border overflow-hidden" role="dialog" aria-labelledby="route-detail-title" aria-modal="false">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg" aria-hidden="true">{ACTIVITY_ICONS[route.activity_type] || '📍'}</span>
          <h3 id="route-detail-title" className="font-semibold text-sm truncate">{route.name}</h3>
        </div>
        <button
          onClick={onClose}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-surface transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label="Fermer"
          type="button"
        >
          <X className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        </button>
      </div>

      <div className="p-3 space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span className="font-semibold text-foreground">{formatDist(route.distance)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mountain className="w-3.5 h-3.5" />
            <span className="font-semibold text-foreground">D+ {route.elevation_gain} m</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-semibold text-foreground">{formatDuration(route.estimated_duration)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="font-semibold text-foreground">
              {route.avg_rating ? (
                <>{route.avg_rating.toFixed(1)} <Star className="w-3 h-3 inline text-warning" /></>
              ) : '—'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={diff.color}>{diff.label}</Badge>
          <Badge variant="secondary">{ACTIVITY_ICONS[route.activity_type]?.trim() || ''} {route.activity_type}</Badge>
          {route.usage_count > 0 && (
            <span className="text-xs text-muted-foreground ml-auto">
              {route.usage_count}× utilisé
            </span>
          )}
        </div>

        {route.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{route.description}</p>
        )}

        {route.creator_name && (
          <p className="text-xs text-muted-foreground">par {route.creator_name}</p>
        )}

        <div className="flex gap-2 pt-1">
          <Button onClick={onViewDetails} variant="outline" size="sm" className="flex-1 text-xs">
            Détails
          </Button>
          {onUseRoute && (
            <Button onClick={onUseRoute} size="sm" className="flex-1 text-xs">
              Utiliser
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
