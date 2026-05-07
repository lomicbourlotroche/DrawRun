'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Footprints, Bike, Settings, Trash2, AlertCircle } from 'lucide-react';
import { PrimaryButton } from '@/components/ui';

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
  onEdit: (gear: Gear) => void;
  onDelete: (id: number) => void;
}

export const GearCard: React.FC<GearCardProps> = ({ gear, onEdit, onDelete }) => {
  const usagePercent = Math.min((gear.current_distance / gear.max_distance) * 100, 100);
  const isNearLimit = usagePercent > 80;
  const isOverLimit = usagePercent >= 100;

  const getIcon = () => {
    switch (gear.type.toLowerCase()) {
      case 'shoes':
      case 'chaussures':
        return <Footprints className="w-6 h-6" />;
      case 'bike':
      case 'velo':
        return <Bike className="w-6 h-6" />;
      default:
        return <Settings className="w-6 h-6" />;
    }
  };

  const getProgressBarColor = () => {
    if (isOverLimit) return 'bg-red-500';
    if (isNearLimit) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <Card className={`p-5 relative overflow-hidden transition-all duration-300 hover:shadow-xl ${!gear.is_active ? 'opacity-60 grayscale' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-4">
          <div className={`p-3 rounded-xl ${isNearLimit ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
            {getIcon()}
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{gear.name}</h3>
            <p className="text-sm text-slate-500">{gear.brand} {gear.model}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => onEdit(gear)}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(gear.id)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div className="text-sm font-medium text-slate-700">
            {gear.current_distance.toFixed(1)} <span className="text-slate-400 font-normal">km</span>
          </div>
          <div className="text-xs text-slate-400">
            Limite: {gear.max_distance} km
          </div>
        </div>

        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${getProgressBarColor()}`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>

        {isNearLimit && (
          <div className={`flex items-center gap-2 text-xs font-medium ${isOverLimit ? 'text-red-600' : 'text-amber-600'}`}>
            <AlertCircle className="w-4 h-4" />
            {isOverLimit ? 'Matériel à remplacer impérativement !' : 'Pensez à renouveler bientôt.'}
          </div>
        )}
      </div>

      {!gear.is_active && (
        <div className="absolute top-2 right-12 bg-slate-200 text-slate-600 text-[10px] font-bold uppercase px-2 py-0.5 rounded">
          Archivé
        </div>
      )}
    </Card>
  );
};
