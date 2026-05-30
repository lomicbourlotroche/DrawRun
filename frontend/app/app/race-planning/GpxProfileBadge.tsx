'use client';

import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GpxProfile } from '@/types';

export function GpxProfileBadge({ profile }: { profile: GpxProfile }) {
  const terrainLabel = { flat: 'Plat', rolling: 'Vallonné', mountainous: 'Montagneux' }[profile.terrainType];
  const terrainColor = { flat: 'bg-green-100 text-green-700', rolling: 'bg-yellow-100 text-yellow-700', mountainous: 'bg-red-100 text-red-700' }[profile.terrainType];
  return (
    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-primary">Terrain détecté automatiquement</span>
        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', terrainColor)}>{terrainLabel}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center"><p className="font-bold text-success">+{profile.elevGain}m</p><p className="text-muted">Dénivelé +</p></div>
        <div className="text-center"><p className="font-bold text-danger">-{profile.elevLoss}m</p><p className="text-muted">Dénivelé -</p></div>
        <div className="text-center"><p className="font-bold">{profile.gainPerKm}m/km</p><p className="text-muted">Gain/km</p></div>
      </div>
    </div>
  );
}
