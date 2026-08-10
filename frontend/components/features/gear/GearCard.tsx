'use client';

import React from 'react';
import { Card } from '@/components/ui';
import { Footprints, Bike, Settings, Trash2, AlertCircle } from '@/components/ui/icons';

interface Gear {
  id: number;
  name: string;
  brand: string;
  model: string;
  type: string;
  current_distance: number;
  max_distance: number;
  is_active: boolean | number;
}

interface GearCardProps {
  gear: Gear;
  onEdit: (_gear: Gear) => void;
  onDelete: (_id: number) => void;
}

export const GearCard: React.FC<GearCardProps> = ({ gear, onEdit, onDelete }) => {
  const usagePercent = gear.max_distance > 0 ? Math.min((gear.current_distance / gear.max_distance) * 100, 100) : 0;
  const isNearLimit = usagePercent > 80;
  const isOverLimit = usagePercent >= 100;

  const getIcon = () => {
    switch (gear.type.toLowerCase()) {
      case 'shoes':
      case 'chaussures':
        return <Footprints className="w-6 h-6" role="img" aria-label="Shoes icon" />;
      case 'bike':
      case 'velo':
        return <Bike className="w-6 h-6" role="img" aria-label="Bike icon" />;
      default:
        return <Settings className="w-6 h-6" role="img" aria-label="Settings icon" />;
    }
  };

  const getProgressBarColor = () => {
    if (isOverLimit) return 'bg-danger';
    if (isNearLimit) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <Card role="article" className={`p-5 relative overflow-hidden transition-all duration-300 hover:shadow-xl ${!gear.is_active ? 'opacity-60 grayscale' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-4">
          <div className={`p-3 rounded-xl ${isNearLimit ? 'bg-warning/5 text-warning' : 'bg-primary/5 text-primary'}`}>
            {getIcon()}
          </div>
          <div>
            <h3 className="font-bold text-foreground">{gear.name}</h3>
            <p className="text-sm text-muted">{gear.brand} {gear.model}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(gear)}
            aria-label="Settings"
            className="p-2 text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(gear.id)}
            aria-label="Trash"
            className="p-2 text-muted hover:text-danger hover:bg-danger/5 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div className="text-sm font-medium text-foreground">
            {gear.current_distance.toFixed(1)} km
          </div>
          <div className="text-xs text-muted">
            Limite: {gear.max_distance} km
          </div>
        </div>

        <div className="h-2 bg-background rounded-full overflow-hidden">
          <div
            role="progressbar"
            className={`h-full transition-all duration-1000 ${getProgressBarColor()}`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>

        {isNearLimit && (
          <div className={`flex items-center gap-2 text-xs font-medium ${isOverLimit ? 'text-danger' : 'text-warning'}`}>
            <AlertCircle className="w-4 h-4" />
            {isOverLimit ? 'Matériel à remplacer impérativement !' : 'Pensez à renouveler bientôt.'}
          </div>
        )}
      </div>

      {!gear.is_active && (
        <div className="absolute top-2 right-12 bg-background text-muted text-[10px] font-bold uppercase px-2 py-0.5 rounded">
          Archivé
        </div>
      )}
    </Card>
  );
};
