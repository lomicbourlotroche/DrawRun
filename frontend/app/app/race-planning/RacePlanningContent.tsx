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
import { Trophy, Download, Save, Printer, FolderOpen, AlertTriangle } from '@/components/ui/icons';
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
      toast.success('Plan de course calcul\u00e9 !');
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
      toast.success(`GPX charg\u00e9 : ${count} points, ~${distKm} km`);
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
    toast.success('Plan export\u00e9 en CSV');
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
      toast.success('Plan de course enregistr\u00e9 !');
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
    toast.success('Plan charg\u00e9');
  };

  const handleDeletePlan = async (id: number) => {
    try {
      await racePlanningApi.deleteRacePlan(id);
      setSavedPlans(prev => prev.filter(p => p.id !== id));
      toast.success('Plan supprim\u00e9');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <Trophy className="w-6 h-6 text-primary" />
            Planification de Course
          </h1>
          <p className="text-muted mt-1.5">
            Planifiez votre strat\u00e9gie de course avec des splits d\u00e9taill\u00e9s et une strat\u00e9gie de nutrition
          </p>
        </div>
        <div className="flex bg-surface p-1 rounded-xl">
          <button onClick={() => setMode('simple')} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200", mode === 'simple' ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-foreground")}>
            Distance Simple
          </button>
          <button onClick={() => setMode('gpx')} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200", mode === 'gpx' ? "bg-surface text-primary shadow-sm" : "text-muted hover:text-foreground")}>
            Profil GPX
          </button>
        </div>
      </div>

      <Card padding="none">
        <div className="px-6 py-4 border-b border-border">
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
                <div className="h-20 bg-surface rounded-lg" />
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
                <span>R\u00e9sum\u00e9</span>
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
                <div className="p-3 rounded-lg bg-surface">
                  <p className="text-xs text-muted">Distance</p>
                  <p className="text-lg font-semibold text-foreground">{result.summary.distance.toFixed(2)} km</p>
                </div>
                <div className="p-3 rounded-lg bg-surface">
                  <p className="text-xs text-muted">Temps estim\u00e9</p>
                  <p className="text-lg font-semibold text-foreground">{formatDuration(result.summary.totalTime)}</p>
                  {result.summary.correctedTotalTime && result.summary.correctedTotalTime !== result.summary.totalTime && (
                    <p className="text-xs text-warning">Corrig\u00e9: {formatDuration(result.summary.correctedTotalTime)}</p>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-surface">
                  <p className="text-xs text-muted">Allure</p>
                  <p className="text-lg font-semibold text-foreground">{racePlanningApi.formatPace(result.summary.targetPace)}</p>
                  {result.summary.correctedPace && result.summary.correctedPace !== result.summary.targetPace && (
                    <p className="text-xs text-warning">Corrig\u00e9e: {racePlanningApi.formatPace(result.summary.correctedPace)}</p>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-surface">
                  <p className="text-xs text-muted">FCM</p>
                  <p className="text-lg font-semibold text-foreground">{result.summary.fcm} bpm</p>
                </div>
              </div>

              {(result.summary.vdot || result.summary.tsb !== null || result.summary.ctl !== null) && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {result.summary.vdot && (
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                      <p className="text-xs text-muted">VDOT</p>
                      <p className="text-lg font-semibold text-foreground">{result.summary.vdot}</p>
                    </div>
                  )}
                  {result.summary.ctl !== null && (
                    <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                      <p className="text-xs text-muted">CTL (Fitness)</p>
                      <p className="text-lg font-semibold text-foreground">{result.summary.ctl}</p>
                    </div>
                  )}
                  {result.summary.tsb !== null && result.summary.tsb !== undefined && (
                    <div className={`p-3 rounded-lg border ${result.summary.tsb < -10 ? 'bg-danger/10 border-danger/30' : 'bg-primary/10 border-primary/30'}`}>
                      <p className="text-xs text-muted">TSB (Forme)</p>
                      <p className="text-lg font-semibold text-foreground">{result.summary.tsb}</p>
                    </div>
                  )}
                </div>
              )}

              {result.warnings.length > 0 && (
                <div className="mt-4 space-y-2">
                  {result.warnings.map((warning, idx) => {
                    const severityColors: Record<string, string> = {
                      info: 'bg-primary/10 border-primary/30',
                      moderate: 'bg-warning/10 border-warning/30',
                      high: 'bg-danger/10 border-danger/30',
                      critical: 'bg-danger/20 border-danger/50',
                    };
                    const severityIconColors: Record<string, string> = {
                      info: 'text-primary',
                      moderate: 'text-warning',
                      high: 'text-danger',
                      critical: 'text-danger',
                    };
                    const colorKey = warning.severity || (warning.type === 'fatigue' ? 'moderate' : 'info');
                    return (
                      <div key={idx} className={`p-3 rounded-lg flex items-start gap-2 border ${severityColors[colorKey]}`}>
                        <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${severityIconColors[colorKey]}`} />
                        <p className="text-sm text-foreground">{warning.message}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {result.pacingStrategy !== null && (
            <Card>
              <CardHeader><CardTitle>Strat\u00e9gie d&apos;allure</CardTitle></CardHeader>
              <CardContent>
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <p className="font-semibold text-foreground">{String((result.pacingStrategy as Record<string, unknown>).name ?? '')}</p>
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
                    <div key={key} className="p-2 rounded bg-surface text-center">
                      <p className="text-xs text-muted capitalize">{key}</p>
                      <p className="font-medium text-foreground">{result.environmentalImpact?.[key] ?? '-'}</p>
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
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-center">
                    <p className="text-xs text-muted">Dur\u00e9e</p>
                    <p className="text-lg font-semibold text-foreground">{result.taperRecommendation.duration} jours</p>
                  </div>
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-center">
                    <p className="text-xs text-muted">R\u00e9duction volume</p>
                    <p className="text-lg font-semibold text-foreground">-{result.taperRecommendation.volumeReduction}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-center">
                    <p className="text-xs text-muted">Gain estim\u00e9</p>
                    <p className="text-lg font-semibold text-foreground">+{result.taperRecommendation.expectedGain}%</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-1 px-2 text-muted">J-</th>
                        <th className="text-left py-1 px-2 text-muted">Volume</th>
                        <th className="text-left py-1 px-2 text-muted">Charge</th>
                        <th className="text-left py-1 px-2 text-muted">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                       {result.taperRecommendation?.plan.slice(0, 7).map((day) => (
                        <tr key={day.daysOut} className={`border-b border-border/50 ${day.isCompetition ? 'bg-primary/10 font-semibold' : ''}`}>
                          <td className="py-1 px-2 text-foreground">{day.daysOut}</td>
                          <td className="py-1 px-2 text-foreground">{day.volumePercent}%</td>
                          <td className="py-1 px-2 text-foreground">{day.targetLoad}</td>
                          <td className="py-1 px-2 text-xs text-muted">{day.sessionDescription}</td>
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
            <CardHeader><CardTitle>Strat\u00e9gie de nutrition</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <p className="text-xs text-muted">Eau totale</p>
                  <p className="text-lg font-semibold text-foreground">{result.nutritionStrategy.totalWater} ml</p>
                </div>
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                  <p className="text-xs text-muted">Gels</p>
                  <p className="text-lg font-semibold text-foreground">{result.nutritionStrategy.totalGels}</p>
                </div>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-foreground mb-1">Avant la course</p>
                  {typeof result.nutritionStrategy.preRace === 'string' ? (
                    <p className="text-muted">{result.nutritionStrategy.preRace}</p>
                  ) : (
                    <div className="space-y-2">
                      {result.nutritionStrategy.preRace?.meal && (
                        <div className="p-2 rounded bg-surface">
                          <p className="font-medium text-foreground">{result.nutritionStrategy.preRace.meal.timing}</p>
                          <p className="text-muted">{result.nutritionStrategy.preRace.meal.description}</p>
                        </div>
                      )}
                      {result.nutritionStrategy.preRace?.topUp && (
                        <div className="p-2 rounded bg-surface">
                          <p className="font-medium text-foreground">{result.nutritionStrategy.preRace.topUp.timing}</p>
                          <p className="text-muted">{result.nutritionStrategy.preRace.topUp.description}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Pendant la course</p>
                  {typeof result.nutritionStrategy.duringRace === 'string' ? (
                    <p className="text-muted">{result.nutritionStrategy.duringRace}</p>
                  ) : Array.isArray(result.nutritionStrategy.duringRace) ? (
                    <div className="space-y-2">
                      {result.nutritionStrategy.duringRace.map((item: { timing: string; type: string; amount: string; description: string }, idx: number) => (
                        <div key={idx} className="p-2 rounded bg-surface">
                          <p className="font-medium text-foreground">{item.timing} {'\u2014'} {item.amount}</p>
                          <p className="text-muted">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Apr\u00e8s la course</p>
                  {typeof result.nutritionStrategy.postRace === 'string' ? (
                    <p className="text-muted">{result.nutritionStrategy.postRace}</p>
                  ) : (
                    <div className="space-y-2">
                      {result.nutritionStrategy.postRace?.within30min && (
                        <div className="p-2 rounded bg-surface">
                          <p className="font-medium text-foreground">Dans les 30 min</p>
                          <p className="text-muted">{result.nutritionStrategy.postRace.within30min.description}</p>
                        </div>
                      )}
                      {result.nutritionStrategy.postRace?.within2hours && (
                        <div className="p-2 rounded bg-surface">
                          <p className="font-medium text-foreground">Dans les 2h</p>
                          <p className="text-muted">{result.nutritionStrategy.postRace.within2hours.description}</p>
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
