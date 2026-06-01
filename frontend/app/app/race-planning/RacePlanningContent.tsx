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
import { Trophy, Download, Save, Printer, FolderOpen, AlertTriangle, Clock, MapPin, Upload, Target, Settings, CheckCircle, BarChart3, Nutrition, Users } from '@/components/ui/icons';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { parseGpxProfile, countGpxPoints } from '@/lib/utils/gpx-utils';

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
      toast.success('Plan de course calcul\u0019 !');
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
      const profile = parseGpxProfile(xml);
      const count = countGpxPoints(xml);
      
      if (profile) {
        setGpxRaw(xml);
        setGpxPointCount(count);
        setGpxDistKm(profile.totalDistanceKm);
        setForm(f => ({ ...f, distance: profile.totalDistanceKm }));
        toast.success(`GPX charg\u0019 : ${count} points, ~${profile.totalDistanceKm} km`);
      } else {
        toast.error('Fichier GPX invalide ou trop court');
      }
    };
    reader.readAsText(file);
  }, [parseGpxProfile, countGpxPoints]);

  const handlePrint = () => window.print();

  const handleExportCsv = () => {
    const r = result;
    if (!r) return;
    const distKm = r.summary.distance ?? form.distance ?? 0;
    const filename = `race-plan-${distKm.toFixed(1)}km-${new Date().toISOString().split('T')[0]}.csv`;
    racePlanningApi.downloadCsv(r.splits, filename);
    toast.success('Plan export\u0019 en CSV');
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
      toast.success('Plan de course enregistr\u0019 !');
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
    toast.success('Plan charg\u0019');
  };

  const handleDeletePlan = async (id: number) => {
    try {
      await racePlanningApi.deleteRacePlan(id);
      setSavedPlans(prev => prev.filter(p => p.id !== id));
      toast.success('Plan supprim\u0019');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  // ========== RENDER ==========

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
      
      {/* ===== HEADER ===== */}
      <div className="bg-gradient-to-r from-primary/5 to-surface rounded-2xl p-6 md:p-8 border border-primary/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                Planification de Course
              </h1>
              <p className="text-muted mt-2 max-w-2xl">
                Cr\u0019eez des plans de course intelligents avec splits pr\u0019cis, 
                strat\u0019gie de nutrition et gestion de l'effort bas\u001ee sur vos donn\u0019es.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setMode('simple')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2",
                mode === 'simple' 
                  ? "bg-primary text-white shadow-lg shadow-primary/25"
                  : "bg-surface text-muted hover:bg-primary/10 hover:text-foreground"
              )}
            >
              <MapPin className="w-4 h-4" />
              Distance Simple
            </button>
            <button 
              onClick={() => setMode('gpx')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2",
                mode === 'gpx' 
                  ? "bg-primary text-white shadow-lg shadow-primary/25"
                  : "bg-surface text-muted hover:bg-primary/10 hover:text-foreground"
              )}
            >
              <Upload className="w-4 h-4" />
              Import GPX
            </button>
          </div>
        </div>
        
        {/* Steps indicator */}
        <div className="mt-6 pt-4 border-t border-primary/10">
          <div className="flex items-center justify-between">
            {[
              { num: '1', label: 'Configurer', icon: Settings },
              { num: '2', label: 'Objectif', icon: Target },
              { num: '3', label: 'Calculer', icon: Clock },
            ].map((step, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300",
                  idx < 0 ? "bg-primary text-white" : "bg-surface text-muted"
                )}>
                  <step.icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-muted hidden sm:block">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== CONFIGURATION CARD ===== */}
      <Card padding="none" className="shadow-lg">
        <div className="px-6 py-4 border-b border-border bg-surface/50">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            {mode === 'simple' ? (
              <>
                <MapPin className="w-5 h-5 text-primary" />
                Param\u0018tres de la course
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-primary" />
                Import et configuration GPX
              </>
            )}
          </h3>
          <p className="text-xs text-muted mt-1">
            {mode === 'simple' 
              ? 'D\u0019finissez la distance et le profil de d\u0019nivel\u0019'
              : 'Importez votre trace GPS pour une analyse pr\u0019cise du parcours'}
          </p>
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

          <div className="border-t border-border pt-4">
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
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                <label className="text-sm font-medium text-foreground">Strat\u0019gie de course</label>
              </div>
              {result?.pacingStrategy && (
                <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                  {(result.pacingStrategy as Record<string, unknown>).name as string}
                </span>
              )}
            </div>
            <StrategySlider value={strategyBias} onChange={setStrategyBias} />
            <p className="text-xs text-muted mt-2 flex items-center gap-1.5">
              <span className="text-primary">←</span>
              Conservative
              <span className="mx-2">|</span>
              <span className="text-warning">→</span>
              Agressive
            </p>
          </div>

          <Button 
            onClick={handleCalculate} 
            isLoading={isLoading} 
            className="w-full"
            size="lg"
            leftIcon={<Trophy className="w-5 h-5" />}
          >
            <span className="font-semibold">
              {result ? 'Recalculer le plan' : 'G\u0019n\u0019rer le plan de course'}
            </span>
          </Button>
        </div>
      </Card>

      {/* ===== LOADING ===== */}
      {isLoading && !result && (
        <div className="space-y-4 animate-pulse">
          <div className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-border">
            <div className="w-3 h-3 rounded-full bg-primary animate-bounce" />
            <span className="text-muted">Calcul en cours...</span>
          </div>
          <Card>
            <CardContent className="h-32 bg-gradient-to-r from-muted/50 to-muted/20 rounded-lg" />
          </Card>
          <Card>
            <CardContent className="h-24 bg-gradient-to-r from-muted/50 to-muted/20 rounded-lg" />
          </Card>
        </div>
      )}

      {/* ===== RESULTS ===== */}
      {result && (
        <div className="space-y-6">
          
          {/* Success banner */}
          <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-success/10 to-emerald/10 rounded-2xl border border-success/20 shadow-md">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-7 h-7 text-success" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span>✓ Plan de course g\u0019n\u0019r\u0019</span>
              </h2>
              <p className="text-sm text-muted mt-1">
                Distance: <span className="font-semibold text-foreground">{result.summary.distance.toFixed(2)} km</span>
                <span className="mx-2 text-muted">|</span>
                Strat\u0019gie: 
                <span className="font-semibold text-foreground">
                  {strategyBias > 0 ? 'Agressive' : strategyBias < 0 ? 'Conservative' : '\u0019quilibr\u001ee'}
                </span>
                {result.summary.elevationProfile && (
                  <>
                    <span className="mx-2 text-muted">|</span>
                    Profil: <span className="font-semibold text-foreground">{result.summary.elevationProfile}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Chart */}
          {result.splits?.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader className="border-b border-border pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Visualisation du plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RaceChart
                  splits={result.splits}
                  strategyBias={result.summary?.strategyBias}
                  elevationAutoDetected={result.summary?.elevationAutoDetected}
                />
              </CardContent>
            </Card>
          )}

          {/* Summary Card */}
          <Card className="shadow-lg">
            <CardHeader className="border-b border-border pb-2">
              <CardTitle className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  R\u0019sum\u0019
                </span>
                <div className="flex flex-wrap gap-2 no-print">
                  <Button variant="secondary" size="sm" onClick={handleOpenPlans} leftIcon={<FolderOpen className="w-4 h-4" />}>
                    Mes plans
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleSavePlan} leftIcon={<Save className="w-4 h-4" />}>
                    Enregistrer
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handlePrint} leftIcon={<Printer className="w-4 h-4" />}>
                    Imprimer
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleExportCsv} leftIcon={<Download className="w-4 h-4" />}>
                    CSV
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-surface border border-border">
                  <p className="text-xs text-muted mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    Distance
                  </p>
                  <p className="text-2xl font-bold text-foreground">{result.summary.distance.toFixed(2)}</p>
                  <p className="text-xs text-muted">km</p>
                </div>
                <div className="p-4 rounded-xl bg-surface border border-border">
                  <p className="text-xs text-muted mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Temps estim\u0019
                  </p>
                  <p className="text-2xl font-bold text-foreground">{formatDuration(result.summary.totalTime)}</p>
                  {result.summary.correctedTotalTime && result.summary.correctedTotalTime !== result.summary.totalTime && (
                    <p className="text-xs text-warning mt-1">Corrig\u0019: {formatDuration(result.summary.correctedTotalTime)}</p>
                  )}
                </div>
                <div className="p-4 rounded-xl bg-surface border border-border">
                  <p className="text-xs text-muted mb-1 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" />
                    Allure cible
                  </p>
                  <p className="text-2xl font-bold text-foreground">{racePlanningApi.formatPace(result.summary.targetPace)}</p>
                  {result.summary.correctedPace && result.summary.correctedPace !== result.summary.targetPace && (
                    <p className="text-xs text-warning mt-1">Corrig\u0019e: {racePlanningApi.formatPace(result.summary.correctedPace)}</p>
                  )}
                </div>
                <div className="p-4 rounded-xl bg-surface border border-border">
                  <p className="text-xs text-muted mb-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    FC Max
                  </p>
                  <p className="text-2xl font-bold text-foreground">{result.summary.fcm}</p>
                  <p className="text-xs text-muted">bpm</p>
                </div>
              </div>

              {(result.summary.vdot || result.summary.tsb !== null || result.summary.ctl !== null) && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                  {result.summary.vdot && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-xs text-muted mb-1">VDOT</p>
                      <p className="text-xl font-bold text-primary">{result.summary.vdot}</p>
                    </div>
                  )}
                  {result.summary.ctl !== null && (
                    <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                      <p className="text-xs text-muted mb-1">CTL (Fitness)</p>
                      <p className="text-xl font-bold text-success">{result.summary.ctl}</p>
                    </div>
                  )}
                  {result.summary.tsb !== null && result.summary.tsb !== undefined && (
                    <div className={`p-4 rounded-xl border ${result.summary.tsb < -10 ? 'bg-danger/5 border-danger/20 text-danger' : 'bg-primary/5 border-primary/20 text-primary'}`}>
                      <p className="text-xs text-muted mb-1">TSB (Forme)</p>
                      <p className="text-xl font-bold">{result.summary.tsb}</p>
                    </div>
                  )}
                </div>
              )}

              {result.warnings.length > 0 && (
                <div className="mt-6 space-y-3">
                  {result.warnings.map((warning, idx) => {
                    const severityColors = {
                      info: 'bg-primary/5 border-primary/20 text-primary',
                      moderate: 'bg-warning/5 border-warning/20 text-warning',
                      high: 'bg-danger/5 border-danger/20 text-danger',
                      critical: 'bg-danger/10 border-danger/30 text-danger',
                    };
                    const colorKey = warning.severity || (warning.type === 'fatigue' ? 'moderate' : 'info');
                    return (
                      <div key={idx} className={`p-4 rounded-xl flex items-start gap-3 border ${severityColors[colorKey]}`}>
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground">{warning.message}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {result.pacingStrategy !== null && (
            <Card className="shadow-lg">
              <CardHeader className="border-b border-border pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-500" />
                  Strat\u0019gie d'allure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="font-semibold text-foreground">{String((result.pacingStrategy as Record<string, unknown>).name ?? '')}</p>
                  <p className="text-sm text-muted mt-1">{String((result.pacingStrategy as Record<string, unknown>).description ?? '')}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {result.taperRecommendation && (
            <Card className="shadow-lg">
              <CardHeader className="border-b border-border pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Recommandation de taper
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
                    <p className="text-xs text-muted">Dur\u0019e</p>
                    <p className="text-lg font-semibold text-foreground">{result.taperRecommendation.duration} jours</p>
                  </div>
                  <div className="p-4 rounded-xl bg-warning/5 border border-warning/20 text-center">
                    <p className="text-xs text-muted">Volume</p>
                    <p className="text-lg font-semibold text-foreground">-{result.taperRecommendation.volumeReduction}%</p>
                  </div>
                  <div className="p-4 rounded-xl bg-success/5 border border-success/20 text-center">
                    <p className="text-xs text-muted">Gain estim\u0019</p>
                    <p className="text-lg font-semibold text-foreground">+{result.taperRecommendation.expectedGain}%</p>
                  </div>
                </div>
                <p className="text-xs text-muted mt-2">Ref: {result.taperRecommendation.reference}</p>
              </CardContent>
            </Card>
          )}

          <RaceSplitsTable splits={result.splits} />

          {/* Nutrition Card */}
          <Card className="shadow-lg">
            <CardHeader className="border-b border-border pb-2">
              <CardTitle className="flex items-center gap-2">
                <Nutrition className="w-5 h-5 text-orange-500" />
                Strat\u0019gie de nutrition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
                  <p className="text-xs text-muted mb-1">Eau totale</p>
                  <p className="text-2xl font-bold text-primary">{result.nutritionStrategy.totalWater}</p>
                  <p className="text-xs text-muted">ml</p>
                </div>
                <div className="p-4 rounded-xl bg-warning/5 border border-warning/20 text-center">
                  <p className="text-xs text-muted mb-1">Gels</p>
                  <p className="text-2xl font-bold text-warning">{result.nutritionStrategy.totalGels}</p>
                </div>
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Avant la course
                  </p>
                  {typeof result.nutritionStrategy.preRace === 'string' ? (
                    <p className="text-muted pl-6">{result.nutritionStrategy.preRace}</p>
                  ) : (
                    <div className="space-y-2 pl-6">
                      {result.nutritionStrategy.preRace?.meal && (
                        <div className="p-3 rounded-lg bg-surface border border-border">
                          <p className="font-medium text-foreground">{result.nutritionStrategy.preRace.meal.timing}</p>
                          <p className="text-muted text-sm">{result.nutritionStrategy.preRace.meal.description}</p>
                        </div>
                      )}
                      {result.nutritionStrategy.preRace?.topUp && (
                        <div className="p-3 rounded-lg bg-surface border border-border">
                          <p className="font-medium text-foreground">{result.nutritionStrategy.preRace.topUp.timing}</p>
                          <p className="text-muted text-sm">{result.nutritionStrategy.preRace.topUp.description}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <Target className="w-4 h-4" />
                    Pendant la course
                  </p>
                  {typeof result.nutritionStrategy.duringRace === 'string' ? (
                    <p className="text-muted pl-6">{result.nutritionStrategy.duringRace}</p>
                  ) : Array.isArray(result.nutritionStrategy.duringRace) ? (
                    <div className="space-y-2 pl-6">
                      {result.nutritionStrategy.duringRace.map((item: { timing: string; type: string; amount: string; description: string }, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg bg-surface border border-border">
                          <p className="font-medium text-foreground">{item.timing} \u2014 {item.amount}</p>
                          <p className="text-muted text-sm">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    Apr\u0018s la course
                  </p>
                  {typeof result.nutritionStrategy.postRace === 'string' ? (
                    <p className="text-muted pl-6">{result.nutritionStrategy.postRace}</p>
                  ) : (
                    <div className="space-y-2 pl-6">
                      {result.nutritionStrategy.postRace?.within30min && (
                        <div className="p-3 rounded-lg bg-surface border border-border">
                          <p className="font-medium text-foreground">Dans les 30 min</p>
                          <p className="text-muted text-sm">{result.nutritionStrategy.postRace.within30min.description}</p>
                        </div>
                      )}
                      {result.nutritionStrategy.postRace?.within2hours && (
                        <div className="p-3 rounded-lg bg-surface border border-border">
                          <p className="font-medium text-foreground">Dans les 2h</p>
                          <p className="text-muted text-sm">{result.nutritionStrategy.postRace.within2hours.description}</p>
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
