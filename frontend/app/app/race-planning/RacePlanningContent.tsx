'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge } from '@/components/ui';
import { api } from '@/lib/api';
import { client } from '@/lib/api/client';
import { racePlanningApi } from '@/lib/api/race-planning.api';
import type { RacePlanningResponse, RacePlanningRequest } from '@/types';
import { Trophy, Download, AlertTriangle, MapPin, Heart, Zap, Droplets, Save } from 'lucide-react';
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

  const handleSavePlan = async () => {
    if (!result) return;
    try {
      await client.request('/api/race-planning/save', {
        method: 'POST',
        body: JSON.stringify({
          name: `${form.distance}km - ${new Date().toLocaleDateString('fr-FR')}`,
          distance: form.distance,
          targetPace: result.summary.targetPace,
          totalTime: result.summary.totalTime,
          elevationProfile: form.elevationProfile,
          fatigue: form.fatigue,
          splits: result.splits,
          nutritionStrategy: result.nutritionStrategy,
        }),
      });
      toast.success('Plan de course enregistré !');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    }
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
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleSavePlan} leftIcon={<Save className="w-4 h-4" />}>
                    Enregistrer
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleExportCsv} leftIcon={<Download className="w-4 h-4" />}>
                    Exporter CSV
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted">Distance</p>
                  <p className="text-lg font-semibold">{result.summary.distance.toFixed(2)} km</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted">Temps estimé</p>
                  <p className="text-lg font-semibold">{formatDuration(result.summary.totalTime)}</p>
                  {result.summary.correctedTotalTime && result.summary.correctedTotalTime !== result.summary.totalTime && (
                    <p className="text-xs text-warning">Corrigé: {formatDuration(result.summary.correctedTotalTime)}</p>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted">Allure</p>
                  <p className="text-lg font-semibold">{racePlanningApi.formatPace(result.summary.targetPace)}</p>
                  {result.summary.correctedPace && result.summary.correctedPace !== result.summary.targetPace && (
                    <p className="text-xs text-warning">Corrigée: {racePlanningApi.formatPace(result.summary.correctedPace)}</p>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted">FCM</p>
                  <p className="text-lg font-semibold">{result.summary.fcm} bpm</p>
                </div>
              </div>

              {/* Additional metrics */}
              {(result.summary.vdot || result.summary.tsb != null || result.summary.ctl != null) && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {result.summary.vdot && (
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                      <p className="text-xs text-muted">VDOT</p>
                      <p className="text-lg font-semibold">{result.summary.vdot}</p>
                    </div>
                  )}
                  {result.summary.ctl != null && (
                    <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                      <p className="text-xs text-muted">CTL (Fitness)</p>
                      <p className="text-lg font-semibold">{result.summary.ctl}</p>
                    </div>
                  )}
                  {result.summary.tsb != null && (
                    <div className={`p-3 rounded-lg border ${result.summary.tsb < -10 ? 'bg-error/10 border-error/30' : 'bg-info/10 border-info/30'}`}>
                      <p className="text-xs text-muted">TSB (Forme)</p>
                      <p className="text-lg font-semibold">{result.summary.tsb}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="mt-4 space-y-2">
                  {result.warnings.map((warning, idx) => {
                    const severityColors: Record<string, string> = {
                      info: 'bg-info/10 border-info/30',
                      moderate: 'bg-warning/10 border-warning/30',
                      high: 'bg-error/10 border-error/30',
                      critical: 'bg-error/20 border-error/50',
                    };
                    const severityIconColors: Record<string, string> = {
                      info: 'text-info',
                      moderate: 'text-warning',
                      high: 'text-error',
                      critical: 'text-error',
                    };
                    const colorKey = warning.severity || (warning.type === 'fatigue' ? 'moderate' : 'info');
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg flex items-start gap-2 border ${severityColors[colorKey]}`}
                      >
                        <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${severityIconColors[colorKey]}`} />
                        <p className="text-sm">{warning.message}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pacing Strategy */}
          {result.pacingStrategy && (
            <Card>
              <CardHeader>
                <CardTitle>Stratégie d'allure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <p className="font-semibold">{result.pacingStrategy.name}</p>
                  <p className="text-sm text-muted mt-1">{result.pacingStrategy.description}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Environmental Impact */}
          {result.environmentalImpact && (
            <Card>
              <CardHeader>
                <CardTitle>Impact environnemental</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-2 rounded bg-muted/50 text-center">
                    <p className="text-xs text-muted">Température</p>
                    <p className="font-medium">{result.environmentalImpact.temperature}</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50 text-center">
                    <p className="text-xs text-muted">Humidité</p>
                    <p className="font-medium">{result.environmentalImpact.humidity}</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50 text-center">
                    <p className="text-xs text-muted">Altitude</p>
                    <p className="font-medium">{result.environmentalImpact.altitude}</p>
                  </div>
                  <div className="p-2 rounded bg-muted/50 text-center">
                    <p className="text-xs text-muted">Vent</p>
                    <p className="font-medium">{result.environmentalImpact.wind}</p>
                  </div>
                </div>
                {result.environmentalImpact.overall && (
                  <p className="text-sm mt-3 text-muted">Impact global: <span className="font-medium text-foreground">{result.environmentalImpact.overall}</span></p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Taper Recommendation */}
          {result.taperRecommendation && (
            <Card>
              <CardHeader>
                <CardTitle>Recommandation de taper</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 rounded-lg bg-info/10 border border-info/30">
                  <p className="font-semibold">Durée: {result.taperRecommendation.duration} jours</p>
                  <p className="text-sm text-muted mt-1">Réduction du volume progressive pour arriver frais le jour J.</p>
                </div>
              </CardContent>
            </Card>
          )}

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
                      <th className="text-left py-2 px-2 text-muted" title="Cardiac drift">Dérive</th>
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
                        <td className="py-2 px-2 text-muted text-xs">
                          {split.cardiacDrift != null ? `+${split.cardiacDrift} bpm` : '-'}
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex gap-1 flex-wrap">
                            {split.nutrition.map((nut, idx) => (
                              <Badge
                                key={idx}
                                variant={nut.type === 'water' ? 'secondary' : nut.type === 'gel' ? 'warning' : 'info'}
                                size="sm"
                              >
                                {nut.type === 'water' ? (
                                  <Droplets className="w-3 h-3 mr-1" />
                                ) : nut.type === 'gel' || nut.type === 'solid' ? (
                                  <Zap className="w-3 h-3 mr-1" />
                                ) : null}
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
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold mb-1">Avant la course</p>
                  {typeof result.nutritionStrategy.preRace === 'string' ? (
                    <p>{result.nutritionStrategy.preRace}</p>
                  ) : (
                    <div className="space-y-2">
                      {result.nutritionStrategy.preRace?.meal && (
                        <div className="p-2 rounded bg-muted/50">
                          <p className="font-medium">{result.nutritionStrategy.preRace.meal.timing}</p>
                          <p>{result.nutritionStrategy.preRace.meal.description}</p>
                        </div>
                      )}
                      {result.nutritionStrategy.preRace?.topUp && (
                        <div className="p-2 rounded bg-muted/50">
                          <p className="font-medium">{result.nutritionStrategy.preRace.topUp.timing}</p>
                          <p>{result.nutritionStrategy.preRace.topUp.description}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold mb-1">Pendant la course</p>
                  {typeof result.nutritionStrategy.duringRace === 'string' ? (
                    <p>{result.nutritionStrategy.duringRace}</p>
                  ) : Array.isArray(result.nutritionStrategy.duringRace) ? (
                    <div className="space-y-2">
                      {result.nutritionStrategy.duringRace.map((item: { timing: string; type: string; amount: string; description: string }, idx: number) => (
                        <div key={idx} className="p-2 rounded bg-muted/50">
                          <p className="font-medium">{item.timing} — {item.amount}</p>
                          <p>{item.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div>
                  <p className="font-semibold mb-1">Après la course</p>
                  {typeof result.nutritionStrategy.postRace === 'string' ? (
                    <p>{result.nutritionStrategy.postRace}</p>
                  ) : (
                    <div className="space-y-2">
                      {result.nutritionStrategy.postRace?.within30min && (
                        <div className="p-2 rounded bg-muted/50">
                          <p className="font-medium">Dans les 30 min</p>
                          <p>{result.nutritionStrategy.postRace.within30min.description}</p>
                        </div>
                      )}
                      {result.nutritionStrategy.postRace?.within2hours && (
                        <div className="p-2 rounded bg-muted/50">
                          <p className="font-medium">Dans les 2h</p>
                          <p>{result.nutritionStrategy.postRace.within2hours.description}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
