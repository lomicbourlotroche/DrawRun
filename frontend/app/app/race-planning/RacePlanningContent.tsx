/* eslint-disable eqeqeq, react/no-unescaped-entities */
'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge } from '@/components/ui';
import { api, coachApi } from '@/lib/api';
import { client } from '@/lib/api/client';
import { racePlanningApi } from '@/lib/api/race-planning.api';
import type { RacePlanningResponse, RacePlanningRequest, Split, GpxProfile } from '@/types';
import {
  Trophy, Download, AlertTriangle, MapPin, Heart, Zap, Droplets, Save, Upload,
  Printer, Mountain, TrendingUp, TrendingDown, Minus, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip,
  Area, Line, ReferenceLine, Legend
} from 'recharts';

const ELEVATION_PROFILES = [
  { id: 'flat',        label: 'Plat',       description: 'Route plate sans dénivelé',       icon: Minus },
  { id: 'rolling',     label: 'Vallonné',   description: 'Montées et descentes modérées',   icon: TrendingUp },
  { id: 'mountainous', label: 'Montagneux', description: 'Dénivelé important',              icon: Mountain },
] as const;

const DISTANCE_PRESETS = [
  { label: '5K',      km: 5 },
  { label: '10K',     km: 10 },
  { label: 'Semi',    km: 21.0975 },
  { label: 'Marathon',km: 42.195 },
];

// ─── Strategy Bias Slider ────────────────────────────────────────────────────
function StrategySlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const labels = [
    { v: -1,    label: 'Très négatif',  desc: 'Départ très lent, accélération forte' },
    { v: -0.5,  label: 'Négatif',       desc: 'Départ conservateur' },
    { v: 0,     label: 'Régulier',      desc: 'Allure constante' },
    { v: 0.5,   label: 'Positif',       desc: 'Départ rapide, gestion' },
    { v: 1,     label: 'Très positif',  desc: 'Départ à fond, résistance' },
  ];
  const current = labels.reduce((a, b) => Math.abs(b.v - value) < Math.abs(a.v - value) ? b : a);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Stratégie d&apos;allure</label>
        <span className="text-xs font-semibold text-primary px-2 py-0.5 bg-primary/10 rounded-full">
          {current.label}
        </span>
      </div>
      <input
        type="range" min="-1" max="1" step="0.1"
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-primary"
      />
      <div className="flex justify-between text-xs text-muted">
        <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3" />Negative split</span>
        <span>Régulier</span>
        <span className="flex items-center gap-1">Positive split<TrendingUp className="w-3 h-3" /></span>
      </div>
      <p className="text-xs text-muted italic">{current.desc}</p>
    </div>
  );
}

// ─── GPX Profile Badge ───────────────────────────────────────────────────────
function GpxProfileBadge({ profile }: { profile: GpxProfile }) {
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
        <div className="text-center"><p className="font-bold text-green-600">+{profile.elevGain}m</p><p className="text-muted">Dénivelé +</p></div>
        <div className="text-center"><p className="font-bold text-red-500">-{profile.elevLoss}m</p><p className="text-muted">Dénivelé -</p></div>
        <div className="text-center"><p className="font-bold">{profile.gainPerKm}m/km</p><p className="text-muted">Gain/km</p></div>
      </div>
    </div>
  );
}

export function RacePlanningContent() {
  const [form, setForm] = useState<RacePlanningRequest>({
    distance: 10,
    elevationProfile: 'flat',
    fatigue: 0,
  });
  const [targetMode, setTargetMode] = useState<'time' | 'pace'>('time');
  const [targetTime, setTargetTime] = useState('00:50:00');
  const [targetPace, setTargetPace] = useState('05:00');
  const [mode, setMode] = useState<'simple' | 'gpx'>('simple');
  const [gpxRaw, setGpxRaw] = useState<string | null>(null);
  const [gpxFileName, setGpxFileName] = useState<string | null>(null);
  const [gpxPointCount, setGpxPointCount] = useState(0);
  const [gpxDistKm, setGpxDistKm] = useState(0);
  const [strategyBias, setStrategyBias] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RacePlanningResponse | any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCalculate = async () => {
    setIsLoading(true);
    try {
      const params: RacePlanningRequest = {
        distance: form.distance,
        elevationProfile: form.elevationProfile,
        fatigue: form.fatigue,
        strategyBias,
      };

      if (targetMode === 'time') {
        params.targetTime = targetTime;
      } else {
        const [mins, secs] = targetPace.split(':').map(Number);
        params.targetPace = mins * 60 + (secs || 0);
      }

      if (mode === 'gpx') {
        if (!gpxRaw) {
          toast.error('Veuillez d\'abord importer un fichier GPX');
          setIsLoading(false);
          return;
        }
        // Send raw GPX — backend auto-detects terrain + distance
        params.gpxData = gpxRaw;
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

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGpxFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const xml = event.target?.result as string;
      // Quick count of trackpoints for UI feedback
      const matches = xml.match(/<trkpt/g);
      const count = matches ? matches.length : 0;
      // Quick distance estimate from first/last point
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
    if (!result) return;
    const filename = `race-plan-${(result.summary?.distance || form.distance).toFixed(1)}km-${new Date().toISOString().split('T')[0]}.csv`;
    racePlanningApi.downloadCsv(result.splits, filename);
    toast.success('Plan exporté en CSV');
  };

  const handleSavePlan = async () => {
    if (!result) return;
    try {
      await client.request('/api/race-planning/save', {
        method: 'POST',
        body: JSON.stringify({
          name: `${(result.summary?.distance || form.distance).toFixed(1)}km - ${new Date().toLocaleDateString('fr-FR')}`,
          distance: result.summary?.distance || form.distance,
          targetPace: result.summary?.targetPace,
          totalTime: result.summary?.totalTime,
          elevationProfile: result.summary?.elevationProfile || form.elevationProfile,
          fatigue: form.fatigue,
          splits: result.splits,
          nutritionStrategy: result.nutritionStrategy,
        }),
      });
      toast.success('Plan de course enregistré !');
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const fmtPace = (sec: number) => {
    if (!sec || sec <= 0) return '--:--';
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Build chart data from splits
  const chartData = result?.splits?.map((s: any) => ({
    km: s.km,
    pace: s.pace,
    elevation: s.elevChange ?? 0,
    grade: s.grade ?? 0,
    hr: s.hrRange ? parseInt(s.hrRange.split('-')[0]) : null,
  })) ?? [];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            Race Planning 2.0
          </h1>
          <p className="text-muted mt-1">
            Planifiez votre stratégie de course avec des splits détaillés et une stratégie de nutrition
          </p>
        </div>
        <div className="flex bg-muted p-1 rounded-xl">
          <button
            onClick={() => setMode('simple')}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", mode === 'simple' ? "bg-white text-primary shadow-sm" : "text-muted hover:text-foreground")}
          >
            Distance Simple
          </button>
          <button
            onClick={() => setMode('gpx')}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", mode === 'gpx' ? "bg-white text-primary shadow-sm" : "text-muted hover:text-foreground")}
          >
            Profil GPX
          </button>
        </div>
      </div>

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration de la course</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode Simple vs GPX Inputs */}
          {mode === 'simple' ? (
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
          ) : (
            <div className="space-y-3">
              <label className="text-sm font-medium mb-2 block">Parcours GPX</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                  gpxRaw ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
              >
                <Upload className={cn("w-8 h-8 mx-auto mb-2", gpxRaw ? "text-primary" : "text-muted")} />
                <p className="text-sm font-medium">
                  {gpxRaw ? `${gpxFileName} — ${gpxPointCount} points` : "Cliquez pour importer un fichier .gpx"}
                </p>
                {gpxRaw && <p className="text-xs text-muted mt-1">Distance estimée : {gpxDistKm} km</p>}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".gpx" className="hidden" />
              {/* Auto-detected profile shown after result */}
              {result?.gpxProfile && <GpxProfileBadge profile={result.gpxProfile} />}
            </div>
          )}

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

          {/* Strategy Bias Slider */}
          <StrategySlider value={strategyBias} onChange={setStrategyBias} />

          <Button onClick={handleCalculate} isLoading={isLoading} className="w-full">
            Calculer le plan de course
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6">

          {/* ── Strategy Curve Chart (both modes) ── */}
          {result.splits && result.splits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Courbe de Stratégie d&apos;Allure
                  {result.summary?.elevationAutoDetected && (
                    <span className="text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-2">
                      Terrain auto-détecté depuis GPX
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis dataKey="km" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} label={{ value: 'km', position: 'insideBottomRight', offset: -5, fontSize: 11 }} />
                      {/* Left axis: pace in sec/km (reversed so faster = higher) */}
                      <YAxis yAxisId="pace" orientation="left" reversed stroke="#818cf8" fontSize={11} tickLine={false} axisLine={false}
                        tickFormatter={v => fmtPace(v)}
                        label={{ value: 'Allure', angle: -90, position: 'insideLeft', fill: '#818cf8', fontSize: 10 }}
                      />
                      {/* Right axis: elevation change */}
                      <YAxis yAxisId="elev" orientation="right" stroke="#3b82f6" fontSize={11} tickLine={false} axisLine={false}
                        tickFormatter={v => `${v > 0 ? '+' : ''}${v}m`}
                        label={{ value: 'Dénivelé', angle: 90, position: 'insideRight', fill: '#3b82f6', fontSize: 10 }}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: 12 }}
                        formatter={(value: any, name: string) => {
                          if (name === 'pace') return [fmtPace(Number(value)) + '/km', 'Allure'];
                          if (name === 'elevation') return [`${Number(value) > 0 ? '+' : ''}${value}m`, 'Dénivelé'];
                          if (name === 'grade') return [`${value}%`, 'Pente'];
                          return [value, name];
                        }}
                      />
                      <Legend formatter={(v) => v === 'pace' ? 'Allure' : v === 'elevation' ? 'Dénivelé' : 'Pente'} />
                      {/* Zero reference line for elevation */}
                      <ReferenceLine yAxisId="elev" y={0} stroke="#64748b" strokeDasharray="3 3" />
                      {/* Elevation bars */}
                      <Area yAxisId="elev" type="monotone" dataKey="elevation" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={1.5} name="elevation" />
                      {/* Pace line — the strategy curve */}
                      <Line yAxisId="pace" type="monotone" dataKey="pace" stroke="#818cf8" strokeWidth={3} dot={false} name="pace" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted">
                  <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-indigo-400 rounded" /><span>Allure cible</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-4 h-3 bg-blue-400/20 border border-blue-400/40 rounded-sm" /><span>Dénivelé</span></div>
                  {result.summary?.strategyBias !== undefined && (
                    <div className="ml-auto text-xs font-medium text-primary">
                      Stratégie : {result.summary.strategyBias < -0.1 ? '⬇ Negative split' : result.summary.strategyBias > 0.1 ? '⬆ Positive split' : '➡ Régulier'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Résumé</span>
                <div className="flex gap-2 no-print">
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
                  {result.warnings.map((warning: any, idx: number) => {
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
          {result.pacingStrategy != null && (
            <Card>
              <CardHeader>
                <CardTitle>Stratégie d'allure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                  <p className="font-semibold">{String((result.pacingStrategy as Record<string, unknown>).name ?? '')}</p>
                  <p className="text-sm text-muted mt-1">{String((result.pacingStrategy as Record<string, unknown>).description ?? '')}</p>
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
                <div className="grid grid-cols-3 gap-3 mb-4">
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
                      {result.taperRecommendation.plan.slice(0, 7).map((day: any) => (
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
                      <th className="text-left py-2 px-2">Pente</th>
                      <th className="text-left py-2 px-2">Ravitaillement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.splits.map((split: any) => (
                      <tr key={split.km} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-2 font-medium">{split.km}</td>
                        <td className="py-2 px-2">{formatDuration(split.splitTime)}</td>
                        <td className="py-2 px-2">{formatDuration(split.cumulativeTime)}</td>
                        <td className="py-2 px-2 font-mono font-bold text-primary">{fmtPace(split.pace)}/km</td>
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
                          {split.grade != null ? (
                            <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded-full', split.grade > 2 ? 'bg-red-100 text-red-700' : split.grade < -2 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>
                              {split.grade > 0 ? '+' : ''}{split.grade}%
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-2 px-2">
                          <div className="flex gap-1 flex-wrap">
                            {split.nutrition?.map((nut: any, idx: number) => (
                              <Badge key={idx} variant={nut.type === 'water' ? 'secondary' : nut.type === 'gel' ? 'warning' : 'outline'} size="sm">
                                {nut.type === 'water' ? <Droplets className="w-3 h-3 mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
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
