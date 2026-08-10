'use client';

import React from 'react';
import { Upload, MapPin } from '@/components/ui/icons';
import { Button, Input } from '@/components/ui';
import { GpxProfileBadge } from './GpxProfileBadge';
import { fmtPace } from './race-planning.utils';
import { cn } from '@/lib/utils';
import type { GpxProfile } from '@/types';

interface GpxImportSectionProps {
  targetMode: 'time' | 'pace';
  onTargetModeChange: (_mode: 'time' | 'pace') => void;
  targetTime: string;
  onTargetTimeChange: (_time: string) => void;
  targetPace: string;
  onTargetPaceChange: (_pace: string) => void;
  gpxRaw: string | null;
  gpxFileName: string | null;
  gpxPointCount: number;
  gpxDistKm: number;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileUpload: (_e: React.ChangeEvent<HTMLInputElement>) => void;
  recommendedPace?: number;
  gpxProfile?: GpxProfile;
}

export function GpxImportSection({
  targetMode,
  onTargetModeChange,
  targetTime,
  onTargetTimeChange,
  targetPace,
  onTargetPaceChange,
  gpxRaw,
  gpxFileName,
  gpxPointCount,
  gpxDistKm,
  fileInputRef,
  onFileUpload,
  recommendedPace,
  gpxProfile,
}: GpxImportSectionProps) {
  return (
    <>
      <div className="space-y-3">
        <label className="text-sm font-medium mb-2 block">Parcours GPX</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
            gpxRaw ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
          )}
        >
          <Upload className={cn('w-8 h-8 mx-auto mb-2', gpxRaw ? 'text-primary' : 'text-muted')} />
          <p className="text-sm font-medium">
            {gpxRaw ? `${gpxFileName} — ${gpxPointCount} points` : 'Cliquez pour importer un fichier .gpx'}
          </p>
          {gpxRaw && <p className="text-xs text-muted mt-1">Distance estimée : {gpxDistKm} km</p>}
        </div>
        <input
          type="file"
          ref={fileInputRef as React.RefObject<HTMLInputElement>}
          onChange={onFileUpload}
          accept=".gpx"
          className="hidden"
        />

        {gpxRaw && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-muted">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>
                Distance auto-détectée : <strong>{gpxDistKm} km</strong>
              </span>
            </div>
            <p className="text-xs text-muted italic">
              Le profil de terrain, la fatigue et l&apos;altitude sont détectés automatiquement depuis le GPX.
            </p>
          </div>
        )}
        {gpxProfile && <GpxProfileBadge profile={gpxProfile} />}
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Objectif (optionnel)</label>
        <p className="text-xs text-muted mb-2">Laissez vide pour une prédiction automatique basée sur votre VDOT</p>
        <div className="flex gap-2 mb-3">
          <Button
            variant={targetMode === 'time' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onTargetModeChange('time')}
          >
            Temps final
          </Button>
          <Button
            variant={targetMode === 'pace' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onTargetModeChange('pace')}
          >
            Allure cible
          </Button>
        </div>
        {targetMode === 'time' ? (
          <Input
            type="text"
            value={targetTime}
            onChange={(e) => onTargetTimeChange(e.target.value)}
            label="Temps objectif (HH:MM:SS)"
            placeholder="00:45:00"
          />
        ) : (
          <Input
            type="text"
            value={targetPace}
            onChange={(e) => onTargetPaceChange(e.target.value)}
            label="Allure cible (MM:SS/km)"
            placeholder="04:30"
          />
        )}
        {recommendedPace !== null && recommendedPace !== undefined && (
          <p className="text-xs text-primary mt-1">
            Prédiction VDOT : {recommendedPace}s/km ({fmtPace(recommendedPace)}/km)
          </p>
        )}
      </div>
    </>
  );
}
