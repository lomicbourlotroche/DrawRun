'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge } from '@/components/ui';
import { api } from '@/lib/api';
import { racePlanningApi } from '@/lib/api/race-planning.api';
import type { RacePlanningResponse, RacePlanningRequest } from '@/types';
import { Trophy, Download, AlertTriangle, MapPin, Heart, Zap, Droplets } from 'lucide-react';
import { toast } from 'sonner';

const ELEVATION_PROFILES = [
  { id: 'flat', label: 'Plat', description: 'Route plate sans dénivelé', factor: 1.0 },
  { id: 'rolling', label: 'Vallonné', description: 'Montées et descentes modérées', factor: 1.05 },
  { id: 'mountainous', label: 'Montagneux', description: 'Dénivelé important', factor: 1.15 },
] as const;

const DISTANCE_PRESETS = [
  { label: '5K', km: 5 },
  { label: '10K', km: 10 },
  { label: 'Semi', km: 21.0975 },
  { label: 'Marathon', km: 42.195 },
];

export function RacePlanningContent() {
  const [form, setForm] = useState<RacePlanningRequest>({
    distance: 10,
    elevationProfile: 'flat',
    fatigue: 0,
  });
  const [targetMode, setTargetMode] = useState<'time' | 'pace'>('time');
  const [targetTime, setTargetTime] = useState('00:50:00');
  const [targetPace, setTargetPace] = useState('05:00');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RacePlanningResponse | null>(null);

  const handleCalculate = async () => {
    setIsLoading(true);
    try {
      const params: RacePlanningRequest = {
        distance: form.distance,
        elevationProfile: form.elevationProfile,
        fatigue: form.fatigue,
      };

      if (targetMode === 'time') {
        params.targetTime = targetTime;
      } else {
        const [mins, secs] = targetPace.split(':').map(Number);
        params.targetPace = mins * 60 + secs;
      }

      const response = await api.calculateRacePlan(params);
      setResult(response);
      toast.success('Plan de course calculé !');
    } catch (error) {
      console.error('Race planning error:', error);
      toast.error('Erreur lors du calcul du plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!result) return;
    const filename = `race-plan-${form.distance}km-${new Date().toISOString().split('T')[0]}.csv`;
    racePlanningApi.downloadCsv(result.splits, filename);
    toast.success('Plan exporté en CSV');
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          Race Planning
        </h1>
        <p className="text-muted mt-1">
          Planifiez votre stratégie de course avec des splits détaillés et une stratégie de nutrition
        </p>
      </div>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration de la course</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Distance */}
          <div>
            <label className="text-sm font-medium mb-2 block">Distance</label>
            <div className="flex gap-2 mb-3">
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

          {/* Target Mode */}
          <div>
            <label className="text-sm font-medium mb-2 block">Objectif</label>
            <div className="flex gap-2 mb-3">
              <Button
                variant={targetMode === 'time' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setTargetMode('time')}
              >
                Temps final
              </Button>
              <Button
                variant={targetMode === 'pace' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setTargetMode('pace')}
              >
                Allure cible
              </Button>
            </div>

            {targetMode === 'time' ? (
              <Input
                type="text"
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
                label="Temps objectif (HH:MM:SS)"
                placeholder="00:45:00"
              />
            ) : (
              <Input
                type="text"
                value={targetPace}
                onChange={(e) => setTargetPace(e.target.value)}
                label="Allure cible (MM:SS/km)"
                placeholder="04:30"
              />
            )}
          </div>

          {/* Elevation Profile */}
          <div>
            <label className="text-sm font-medium mb-2 block">Profil du terrain</label>
            <div className="grid grid-cols-3 gap-2">
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

          {/* Fatigue Level */}
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

          <Button onClick={handleCalculate} isLoading={isLoading} className="w-full">
            Calculer le plan de course
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Résumé</span>
                <Button variant="secondary" size="sm" onClick={handleExportCsv} leftIcon={<Download className="w-4 h-4" />}>
                  Exporter CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted">Distance</p>
                  <p className="text-lg font-semibold">{result.summary.distance.toFixed(2)} km</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted">Temps total estimé</p>
                  <p className="text-lg font-semibold">{formatDuration(result.summary.totalTime)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted">Allure moyenne</p>
                  <p className="text-lg font-semibold">{racePlanningApi.formatPace(result.summary.targetPace)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted">FCM</p>
                  <p className="text-lg font-semibold">{result.summary.fcm} bpm</p>
                </div>
              </div>

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="mt-4 space-y-2">
                  {result.warnings.map((warning, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg flex items-start gap-2 ${
                        warning.type === 'fatigue'
                          ? 'bg-warning/10 border border-warning/30'
                          : 'bg-success/10 border border-success/30'
                      }`}
                    >
                      <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
                        warning.type === 'fatigue' ? 'text-warning' : 'text-success'
                      }`} />
                      <p className="text-sm">{warning.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Splits Table */}
          <Card>
            <CardHeader>
              <CardTitle>Splits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2">KM</th>
                      <th className="text-left py-2 px-2">Temps</th>
                      <th className="text-left py-2 px-2">Cumulé</th>
                      <th className="text-left py-2 px-2">Allure</th>
                      <th className="text-left py-2 px-2">Zone FC</th>
                      <th className="text-left py-2 px-2">FC</th>
                      <th className="text-left py-2 px-2">Ravitaillement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.splits.map((split) => (
                      <tr key={split.km} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-2 font-medium">{split.km}</td>
                        <td className="py-2 px-2">{formatDuration(split.splitTime)}</td>
                        <td className="py-2 px-2">{formatDuration(split.cumulativeTime)}</td>
                        <td className="py-2 px-2">{racePlanningApi.formatPace(split.pace)}</td>
                        <td className="py-2 px-2">
                          <Badge variant="secondary" size="sm">
                            <Heart className="w-3 h-3 mr-1" />
                            {split.hrZone}
                          </Badge>
                        </td>
                        <td className="py-2 px-2 text-muted">{split.hrRange}</td>
                        <td className="py-2 px-2">
                          <div className="flex gap-1 flex-wrap">
                            {split.nutrition.map((nut, idx) => (
                              <Badge
                                key={idx}
                                variant={nut.type === 'water' ? 'secondary' : 'warning'}
                                size="sm"
                              >
                                {nut.type === 'water' ? (
                                  <Droplets className="w-3 h-3 mr-1" />
                                ) : (
                                  <Zap className="w-3 h-3 mr-1" />
                                )}
                                {nut.label}
                              </Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Nutrition Strategy */}
          <Card>
            <CardHeader>
              <CardTitle>Stratégie de nutrition</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-info/10 border border-info/30">
                  <p className="text-xs text-muted">Eau totale</p>
                  <p className="text-lg font-semibold">{result.nutritionStrategy.totalWater} ml</p>
                </div>
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                  <p className="text-xs text-muted">Gels</p>
                  <p className="text-lg font-semibold">{result.nutritionStrategy.totalGels}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Avant la course:</strong> {result.nutritionStrategy.preRace}</p>
                <p><strong>Pendant:</strong> {result.nutritionStrategy.duringRace}</p>
                <p><strong>Après:</strong> {result.nutritionStrategy.postRace}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
