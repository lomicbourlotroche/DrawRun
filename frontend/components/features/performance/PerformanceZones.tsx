'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, LegacyTabs as Tabs } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Zones, HRZone, SpeedZone } from '@/types';
import { Activity, Zap, Timer, TrendingUp, Award } from 'lucide-react';

const ZONE_COLORS = [
  '#64748B', // Zone 1 - Gray
  '#22C55E', // Zone 2 - Green
  '#3B82F6', // Zone 3 - Blue
  '#F59E0B', // Zone 4 - Orange
  '#EF4444', // Zone 5 - Red
  '#8B5CF6', // Zone 6 - Purple
  '#EC4899', // Zone 7 - Pink
];

interface PerformanceZonesProps {
  zones: Zones | null;
  isLoading?: boolean;
}

export function PerformanceZones({ zones, isLoading }: PerformanceZonesProps) {
  const [activeTab, setActiveTab] = useState('hr');
  const [isProMode, setIsProMode] = useState(false);

  const tabs = [
    { id: 'hr', label: 'Fréquence Cardiaque', icon: <Activity className="w-4 h-4" /> },
    { id: 'pace', label: 'Allure', icon: <Timer className="w-4 h-4" /> },
    { id: 'vdot', label: 'VDOT', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  if (isLoading || !zones) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Zones d&apos;entraînement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-background rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const displayZones = <T extends { zone: number }>(zoneList: T[]): T[] => {
    if (isProMode) return zoneList;
    return zoneList.filter((z) => z.zone <= 5);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Zones d&apos;entraînement</CardTitle>
            <p className="text-xs text-muted mt-1">
              FCM: {zones.fcm} bpm | VMA: {zones.vma} km/h | VDOT: {zones.vdot}
            </p>
          </div>
          <button
            onClick={() => setIsProMode(!isProMode)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              isProMode
                ? 'bg-primary text-white'
                : 'bg-surface text-muted hover:text-foreground'
            )}
          >
            {isProMode ? 'Mode Pro (7 zones)' : 'Mode Standard (5 zones)'}
          </button>
        </div>
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} className="mt-4" />
      </CardHeader>
      <CardContent>
        {activeTab === 'hr' && (
          <div className="space-y-2">
            {displayZones(zones.hrZones).map((zone) => (
              <div
                key={zone.zone}
                className="flex items-center gap-4 p-3 rounded-lg bg-background"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: ZONE_COLORS[(zone.zone - 1) % ZONE_COLORS.length] }}
                >
                  {zone.zone}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{zone.name}</p>
                  {zone.description && (
                    <p className="text-xs text-muted">{zone.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {(zone as HRZone).minHR || zone.min} - {(zone as HRZone).maxHR || zone.max} bpm
                  </p>
                  <p className="text-xs text-muted">
                    ~{Math.round(((zone as HRZone).minHR || zone.min + ((zone as HRZone).maxHR || zone.max)) / 2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'pace' && (
          <div className="space-y-2">
            {displayZones(zones.speedZones).map((zone) => (
              <div
                key={zone.zone}
                className="flex items-center gap-4 p-3 rounded-lg bg-background"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: ZONE_COLORS[(zone.zone - 1) % ZONE_COLORS.length] }}
                >
                  {zone.zone}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{zone.name}</p>
                  {(zone as SpeedZone).description && (
                    <p className="text-xs text-muted">{(zone as SpeedZone).description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {(zone as SpeedZone).minPace || zone.min} - {(zone as SpeedZone).maxPace || zone.max}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'vdot' && zones.trainingPaces && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-background rounded-lg">
                <p className="text-xs text-muted mb-1">E (Endurance)</p>
                <p className="font-medium text-foreground">
                  {zones.trainingPaces.E.min} - {zones.trainingPaces.E.max}
                </p>
                <p className="text-xs text-muted">min/km</p>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-xs text-muted mb-1">M (Marathon)</p>
                <p className="font-medium text-foreground">{zones.trainingPaces.M}</p>
                <p className="text-xs text-muted">min/km</p>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-xs text-muted mb-1">T (Seuil)</p>
                <p className="font-medium text-foreground">{zones.trainingPaces.T}</p>
                <p className="text-xs text-muted">min/km</p>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-xs text-muted mb-1">I (Intervalle)</p>
                <p className="font-medium text-foreground">{zones.trainingPaces.I}</p>
                <p className="text-xs text-muted">min/km</p>
              </div>
            </div>
            <div className="p-3 bg-background rounded-lg">
              <p className="text-xs text-muted mb-1">R (Répétitions)</p>
              <p className="font-medium text-foreground">{zones.trainingPaces.R}</p>
              <p className="text-xs text-muted">min/km (vitesse)</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
