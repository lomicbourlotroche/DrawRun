'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { api, racePlanningApi } from '@/lib/api';
import type { RacePlanningResponse, RacePlanningRequest, Split, RaceNutritionStrategy } from '@/types';
import type { SavedRacePlan, RaceSplit } from '@/lib/api/race-planning.api';
import { StrategySlider } from './StrategySlider';
import { RaceForm } from './RaceForm';
import { GpxImportSection } from './GpxImportSection';
import { AdvancedConditions } from './AdvancedConditions';
import { SavedPlansModal } from './SavedPlansModal';
import { RaceChart } from './RaceChart';
import { RaceSplitsTable } from './RaceSplitsTable';
import { formatDuration } from './race-planning.utils';
import { Trophy, Download, Save, Printer, FolderOpen, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function RacePlanningContent() {
  const [form, setForm] = useState<RacePlanningRequest>({
    distance: 10,
    elevationProfile: 'flat',
    fatigue: 0,
  });
  const [targetMode, setTargetMode] = useState<'time' | 'pace'>('time');
  const [targetTime, setTargetTime] = useState('');
  const [targetPace, setTargetPace] = useState('');
  const [mode, setMode] = useState<'simple' | 'gpx'>('simple');
  const [gpxRaw, setGpxRaw] = useState<string | null>(null);
  const [gpxFileName, setGpxFileName] = useState<string | null>(null);
  const [gpxPointCount, setGpxPointCount] = useState(0);
  const [gpxDistKm, setGpxDistKm] = useState(0);
  const [strategyBias, setStrategyBias] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RacePlanningResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [temperature, setTemperature] = useState(15);
  const [humidity, setHumidity] = useState(50);
  const [altitude, setAltitude] = useState(0);
  const [windSpeed, setWindSpeed] = useState(0);

  const [savedPlans, setSavedPlans] = useState<SavedRacePlan[]>([]);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  const handleCalculate = async () => {
    setIsLoading(true);
    try {
      const params: RacePlanningRequest = {
        distance: form.distance,
        elevationProfile: form.elevationProfile,
        fatigue: form.fatigue,
        strategyBias,
      };

      if (targetMode === 'time' && targetTime.trim()) {
        params.targetTime = targetTime;
      } else if (targetMode === 'pace' && targetPace.trim()) {
        const [mins, secs] = targetPace.split(':').map(Number);
        params.targetPace = mins * 60 + (secs || 0);
      }

      if (mode === 'gpx') {
        if (!gpxRaw) {
          toast.error('Veuillez d\'abord importer un fichier GPX');
          setIsLoading(false);
          return;
        }
        params.gpxData = gpxRaw;
        if (gpxDistKm > 0) params.distance = gpxDistKm;
        delete params.elevationProfile;
        delete params.fatigue;
      }

      if (showAdvanced) {
        params.temperature = temperature;
        params.humidity = humidity;
        params.altitude = altitude;
        params.windSpeed = windSpeed;
      }

      const response = await api.calculateRacePlan(params);
      setResult(response);
      toast.success('Plan de course calculé !');
    } catch {
      toast.error('Erreur lors du calcul du plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGpxFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const xml = event.target?.result as string;
      const matches = xml.match(/<trkpt/g);
      const count = matches ? matches.length : 0;
      const trkptRe = /<trkpt lat="([^"]+)" lon="([^"]+)"/g;
      const pts: [number, number][] = [];
      let m;
      while ((m = trkptRe.exec(xml)) !== null) {
        pts.push([parseFloat(m[1]), parseFloat(m[2])]);
      }
      let dist = 0;
      for (let i = 1; i < pts.length; i++) {
        const R = 6371000;
        const dLat = (pts[i][0] - pts[i-1][0]) * Math.PI / 180;
        const dLon = (pts[i][1] - pts[i-1][1]) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(pts[i-1][0]*Math.PI/180)*Math.cos(pts[i][0]*Math.PI/180)*Math.sin(dLon/2)**2;
        dist += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      }
      const distKm = Math.round(dist / 10) / 100;
      setGpxRaw(xml);
      setGpxPointCount(count);
      setGpxDistKm(distKm);
      setForm(f => ({ ...f, distance: distKm }));
      toast.success(`GPX chargé : ${count} points, ~${distKm} km`);
    };
    reader.readAsText(file);
  }, []);

  const handlePrint = () => window.print();

  const handleExportCsv = () => {
    const r = result;
    if (!r) return;
    const distKm = r.summary.distance ?? form.distance ?? 0;
    const filename = `race-plan-${distKm.toFixed(1)}km-${new Date().toISOString().split('T')[0]}.csv`;
    racePlanningApi.downloadCsv(r.splits, filename);
    toast.success('Plan exporté en CSV');
  };

  const handleSavePlan = async () => {
    const r = result;
    if (!r) return;
    const dist = r.summary.distance ?? form.distance ?? 0;
    try {
      await racePlanningApi.saveRacePlan({
        name: `${dist.toFixed(1)}km - ${new Date().toLocaleDateString('fr-FR')}`,
        distance: dist,
        targetPace: r.summary.targetPace,
        totalTime: r.summary.totalTime,
        elevationProfile: r.summary.elevationProfile ?? form.elevationProfile,
        fatigue: form.fatigue,
        splits: r.splits as unknown as RaceSplit[],
        nutritionStrategy: r.nutritionStrategy as import('@/lib/api/race-planning.api').NutritionStrategy,
      });
      toast.success('Plan de course enregistré !');
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleOpenPlans = async () => {
    setIsLoadingPlans(true);
    setShowPlansModal(true);
    try {
      const plans = await racePlanningApi.listRacePlans();
      setSavedPlans(plans);
    } catch {
      toast.error('Erreur lors du chargement des plans');
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const handleLoadPlan = (plan: Record<string, unknown>) => {
    setForm({
      distance: (plan.distance as number) || form.distance,
      elevationProfile: (plan.elevationProfile as 'flat' | 'rolling' | 'mountainous') || form.elevationProfile,
      fatigue: (plan.fatigue as number) ?? form.fatigue,
    });
    setResult({
      summary: {
        distance: plan.distance as number,
        targetPace: plan.targetPace as number,
        totalTime: plan.totalTime as number,
        elevationProfile: plan.elevationProfile as string,
        fcm: 0,
      },
      splits: plan.splits as Split[],
      nutritionStrategy: plan.nutritionStrategy as RaceNutritionStrategy,
      racePrediction: null,
      warnings: [],
    } as RacePlanningResponse);
    setShowPlansModal(false);
    toast.success('Plan chargé');
  };

  const handleDeletePlan = async (id: number) => {
    try {
      await racePlanningApi.deleteRacePlan(id);
      setSavedPlans(prev => prev.filter(p => p.id !== id));
      toast.success('Plan supprimé');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <Trophy className="w-6 h-6 text-primary-500" />
            Planification de Course
          </h1>
          <p className="text-neutral-500 mt-1.5">
            Planifiez votre stratégie de course avec des splits détaillés et une stratégie de nutrition
          </p>
        </div>
        <div className="flex bg-neutral-100 p-1 rounded-xl">
          <button onClick={() => setMode('simple')} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-smooth", mode === 'simple' ? "bg-surface text-primary-600 shadow-sm" : "text-neutral-600 hover:text-foreground")}>
            Distance Simple
          </button>
          <button onClick={() => setMode('gpx')} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-smooth", mode === 'gpx' ? "bg-surface text-primary-600 shadow-sm" : "text-neutral-600 hover:text-foreground")}>
            Profil GPX
          </button>
        </div>
      </div>

      <Card padding="none">
        <div className="px-6 py-4 border-b border-neutral-200/60">
          <h3 className="text-base font-semibold text-foreground">
            {mode === 'simple' ? 'Configuration de la course' : 'Configuration via GPX'}
          </h3>
        </div>
        <div className="p-6 space-y-6">
          {mode === 'simple' && <RaceForm form={form} setForm={setForm} />}

          {mode === 'gpx' && (
            <GpxImportSection
              targetMode={targetMode}
              onTargetModeChange={setTargetMode}
              targetTime={targetTime}
              onTargetTimeChange={setTargetTime}
              targetPace={targetPace}
              onTargetPaceChange={setTargetPace}
              gpxRaw={gpxRaw}
              gpxFileName={gpxFileName}
              gpxPointCount={gpxPointCount}
              gpxDistKm={gpxDistKm}
              fileInputRef={fileInputRef}
              onFileUpload={handleFileUpload}
              recommendedPace={result?.racePrediction?.recommendedPace}
              gpxProfile={result?.gpxProfile}
            />
          )}

          <AdvancedConditions
            showAdvanced={showAdvanced}
            onToggle={() => setShowAdvanced(!showAdvanced)}
            temperature={temperature}
            onTemperatureChange={setTemperature}
            humidity={humidity}
            onHumidityChange={setHumidity}
            altitude={altitude}
            onAltitudeChange={setAltitude}
            windSpeed={windSpeed}
            onWindSpeedChange={setWindSpeed}
          />

          <StrategySlider value={strategyBias} onChange={setStrategyBias} />

          <Button onClick={handleCalculate} isLoading={isLoading} className="w-full">
            Calculer le plan de course
          </Button>
        </div>
      </Card>

      {isLoading && !result && (
        <div className="space-y-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader><CardTitle>Chargement...</CardTitle></CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {result.splits?.length > 0 && (
            <RaceChart
              splits={result.splits}
              strategyBias={result.summary?.strategyBias}
              elevationAutoDetected={result.summary?.elevationAutoDetected}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span>Résumé</span>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 no-print">
                  <Button variant="secondary" size="sm" onClick={handleOpenPlans} leftIcon={<FolderOpen className="w-4 h-4" />}>
                    Mes plans
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleSavePlan} leftIcon={<Save className="w-4 h-4" />}>
                    Enregistrer
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handlePrint} leftIcon={<Printer className="w-4 h-4" />}>
                    Imprimer PDF
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

              {(result.summary.vdot || result.summary.tsb !== null || result.summary.ctl !== null) && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {result.summary.vdot && (
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                      <p className="text-xs text-muted">VDOT</p>
                      <p className="text-lg font-semibold">{result.summary.vdot}</p>
                    </div>
                  )}
                  {result.summary.ctl !== null && (
                    <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                      <p className="text-xs text-muted">CTL (Fitness)</p>
                      <p className="text-lg font-semibold">{result.summary.ctl}</p>
                    </div>
                  )}
                  {result.summary.tsb !== null && (
                    <div className={`p-3 rounded-lg border ${result.summary.tsb < -10 ? 'bg-error/10 border-error/30' : 'bg-info/10 border-info/30'}`}>
                      <p className="text-xs text-muted">TSB (Forme)</p>
                      <p className="text-lg font-semibold">{result.summary.tsb}</p>
                    </div>
                  )}
                </div>
              )}

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
                      <div key={idx} className={`p-3 rounded-lg flex items-start gap-2 border ${severityColors[colorKey]}`}>
                        <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${severityIconColors[colorKey]}`} />
                        <p className="text-sm">{warning.message}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {result.pacingStrategy !== null && (
            <Card>
              <CardHeader><CardTitle>Stratégie d&apos;allure</CardTitle></CardHeader>
              <CardContent>
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <p className="font-semibold">{String((result.pacingStrategy as Record<string, unknown>).name ?? '')}</p>
                  <p className="text-sm text-muted mt-1">{String((result.pacingStrategy as Record<string, unknown>).description ?? '')}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {result.environmentalImpact && (
            <Card>
              <CardHeader><CardTitle>Impact environnemental</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['temperature', 'humidity', 'altitude', 'wind'] as const).map((key) => (
                    <div key={key} className="p-2 rounded bg-muted/50 text-center">
                      <p className="text-xs text-muted capitalize">{key}</p>
                      <p className="font-medium">{result.environmentalImpact?.[key] ?? '-'}</p>
                    </div>
                  ))}
                </div>
                {result.environmentalImpact.overall && (
                  <p className="text-sm mt-3 text-muted">
                    Impact global: <span className="font-medium text-foreground">{result.environmentalImpact.overall}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {result.taperRecommendation && (
            <Card>
              <CardHeader><CardTitle>Recommandation de taper</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-info/10 border border-info/30 text-center">
                    <p className="text-xs text-muted">Durée</p>
                    <p className="text-lg font-semibold">{result.taperRecommendation.duration} jours</p>
                  </div>
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-center">
                    <p className="text-xs text-muted">Réduction volume</p>
                    <p className="text-lg font-semibold">-{result.taperRecommendation.volumeReduction}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-center">
                    <p className="text-xs text-muted">Gain estimé</p>
                    <p className="text-lg font-semibold">+{result.taperRecommendation.expectedGain}%</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1 px-2">J-</th>
                        <th className="text-left py-1 px-2">Volume</th>
                        <th className="text-left py-1 px-2">Charge</th>
                        <th className="text-left py-1 px-2">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.taperRecommendation?.plan.slice(0, 7).map((day: { daysOut: number; volumePercent: number; targetLoad: string; sessionDescription: string; isCompetition?: boolean }) => (
                        <tr key={day.daysOut} className={`border-b border-border/50 ${day.isCompetition ? 'bg-primary/10 font-semibold' : ''}`}>
                          <td className="py-1 px-2">{day.daysOut}</td>
                          <td className="py-1 px-2">{day.volumePercent}%</td>
                          <td className="py-1 px-2">{day.targetLoad}</td>
                          <td className="py-1 px-2 text-xs">{day.sessionDescription}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted mt-2">Ref: {result.taperRecommendation.reference}</p>
              </CardContent>
            </Card>
          )}

          <RaceSplitsTable splits={result.splits} />

          <Card>
            <CardHeader><CardTitle>Stratégie de nutrition</CardTitle></CardHeader>
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

      <SavedPlansModal
        isOpen={showPlansModal}
        onClose={() => setShowPlansModal(false)}
        isLoading={isLoadingPlans}
        savedPlans={savedPlans}
        onLoadPlan={handleLoadPlan}
        onDeletePlan={handleDeletePlan}
      />
    </div>
  );
}
