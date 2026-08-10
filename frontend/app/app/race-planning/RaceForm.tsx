'use client';

import React from 'react';
import { MapPin } from '@/components/ui/icons';
import { Button, Input } from '@/components/ui';
import type { RacePlanningRequest } from '@/types';

const ELEVATION_PROFILES = [
  { id: 'flat',        label: 'Plat',       description: 'Route plate sans dénivelé',       icon: MapPin },
  { id: 'rolling',     label: 'Vallonné',   description: 'Montées et descentes modérées',   icon: MapPin },
  { id: 'mountainous', label: 'Montagneux', description: 'Dénivelé important',              icon: MapPin },
] as const;

const DISTANCE_PRESETS = [
  { label: '5K',      km: 5 },
  { label: '10K',     km: 10 },
  { label: 'Semi',    km: 21.0975 },
  { label: 'Marathon',km: 42.195 },
];

interface RaceFormProps {
  form: RacePlanningRequest;
  setForm: React.Dispatch<React.SetStateAction<RacePlanningRequest>>;
}

export function RaceForm({ form, setForm }: RaceFormProps) {
  return (
    <>
      <div>
        <label className="text-sm font-medium mb-2 block">Distance</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {DISTANCE_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant={form.distance === preset.km ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setForm({ ...form, distance: preset.km })}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <Input
          type="number"
          step="0.1"
          value={form.distance}
          onChange={(e) => setForm({ ...form, distance: parseFloat(e.target.value) || 0 })}
          label="Distance personnalisée (km)"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Profil du terrain</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {ELEVATION_PROFILES.map((profile) => (
            <button
              key={profile.id}
              onClick={() => setForm({ ...form, elevationProfile: profile.id })}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                form.elevationProfile === profile.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <MapPin className={`w-4 h-4 mb-1 ${
                form.elevationProfile === profile.id ? 'text-primary' : 'text-muted'
              }`} />
              <p className="text-sm font-medium">{profile.label}</p>
              <p className="text-xs text-muted">{profile.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">
          Niveau de fatigue (0-10)
        </label>
        <input
          type="range"
          min="0"
          max="10"
          value={form.fatigue}
          onChange={(e) => setForm({ ...form, fatigue: parseInt(e.target.value) })}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs text-muted mt-1">
          <span>Reposé (0)</span>
          <span className="font-medium">{form.fatigue}</span>
          <span>Fatigué (10)</span>
        </div>
      </div>
    </>
  );
}
