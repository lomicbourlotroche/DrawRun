/**
 * PerformanceContent - Contenu de la page Performance
 */

'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useUserConstantsStore } from '@/stores';
import { PerformanceZones, PerformanceMetrics, ProgressionChart } from '@/components/features/performance';
import { Card, CardHeader, CardTitle, CardContent, Skeleton, Progress } from '@/components/ui';
import { Dumbbell, Bike, Waves, Heart, Activity, TrendingUp, Gauge, Zap, BarChart3, Brain, AlertCircle, MapPin, Clock } from 'lucide-react';
import type { PmcDataPoint, Activity as ActivityType } from '@/types';

interface PolarizationData {
  index: number;
  distribution: { low: number; moderate: number; high: number };
  classification: { type: string; label: string; optimal: boolean };
  recommendation: { type: string; message: string };
  target: { low: number; moderate: number; high: number };
}

interface HRVData {
  status: string;
  score: number;
  message: string;
  rmssd: number;
  baselineRmssd?: number;
  ratio: number;
  readiness: number;
  stressScore?: number;
}

interface StatsData {
  totalKm: number;
  totalHours: number;
  avgKm: number;
  byType: Record<string, number>;
}

function computeStats(activities: ActivityType[]): StatsData {
  const totalKm = activities.reduce((s, a) => s + (a.distance ?? 0) / 1000, 0);
  const totalHours = activities.reduce((s, a) => s + ((a.moving_time ?? 0) / 3600), 0);
  const avgKm = activities.length > 0 ? totalKm / activities.length : 0;
  const byType = activities.reduce<Record<string, number>>((acc, a) => {
    const t = (a.type as string) ?? 'Other';
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});
  return { totalKm, totalHours, avgKm, byType };
}

export default function PerformanceContent() {
  const [sport, setSport] = useState<'run' | 'bike' | 'swim'>('run');
  const [activeTab, setActiveTab] = useState<'metrics' | 'zones' | 'stats' | 'progression' | 'analyse'>('metrics');
  const [pmc, setPmc] = useState<PmcDataPoint[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [polarization, setPolarization] = useState<PolarizationData | null>(null);
  const [polarizationError, setPolarizationError] = useState<string | null>(null);
  const [hrv, setHrv] = useState<HRVData | null>(null);
  const [hrvError, setHrvError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { data: userConstants, fetchConstants, zones, profile } = useUserConstantsStore();

  useEffect(() => {
    if (api.isAuthenticated()) loadData();
  }, [sport]);

  const loadData = async () => {
    setIsLoading(true);
    setPolarizationError(null);
    setHrvError(null);
    try {
      const [constantsResult, p, acts] = await Promise.all([
        fetchConstants(),
        api.getPmc().catch(() => []),
        api.getActivities().catch(() => []),
      ]);
      setPmc(p);
      setActivities(acts);

      if (!constantsResult) {
        // User constants not available — will use defaults
      }

      // Polarization — requires activities with zone data
      try {
        const activitiesWithZones = (acts as ActivityType[]).map((a) => ({
          zonePercent: (a as ActivityType & { zonePercent?: { 1?: number; 2?: number; 3?: number; 4?: number; 5?: number } }).zonePercent,
        }));
        const polData = await api.getAlgoPolarization(activitiesWithZones);
        setPolarization(polData);
      } catch {
        setPolarizationError('Données de polarisation non disponibles');
      }
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  };

  const sportTabs = [
    { id: 'run', label: 'Course', icon: <Dumbbell className="w-4 h-4" /> },
    { id: 'bike', label: 'Vélo', icon: <Bike className="w-4 h-4" /> },
    { id: 'swim', label: 'Natation', icon: <Waves className="w-4 h-4" /> },
  ] as const;

  const tabs = [
    { id: 'metrics', label: 'Métriques', icon: <Gauge className="w-4 h-4" /> },
    { id: 'zones', label: 'Zones', icon: <Zap className="w-4 h-4" /> },
    { id: 'stats', label: 'Statistiques', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'progression', label: 'Progression', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'analyse', label: 'Analyse', icon: <Brain className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          Performances
        </h1>
        <p className="text-muted mt-1">Suivez vos métriques et progressions</p>
      </div>

      {/* Sport selector */}
      <div className="flex gap-1 overflow-x-auto pb-2 border-b border-border">
        {sportTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setSport(t.id as typeof sport)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              sport === t.id ? 'bg-primary text-white' : 'text-muted hover:text-foreground hover:bg-muted'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-2 border-b border-border">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === t.id ? 'bg-primary text-white' : 'text-muted hover:text-foreground hover:bg-muted'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'metrics' && (
            <div className="space-y-6">
              <PerformanceMetrics sport={sport} metrics={{}} />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    Métriques clés
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                      <p className="text-2xl font-bold text-red-400">{profile?.fcm || '--'}</p>
                      <p className="text-xs text-muted">FCM</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                      <p className="text-2xl font-bold text-blue-400">{profile?.vdot || '--'}</p>
                      <p className="text-xs text-muted">VDOT</p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                      <p className="text-2xl font-bold text-green-400">{profile?.vma ? `${profile.vma.toFixed(1)}` : '--'}</p>
                      <p className="text-xs text-muted">VMA km/h</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {activeTab === 'zones' && <PerformanceZones zones={zones as any} />}
          {activeTab === 'stats' && (
            (() => {
              const stats = computeStats(activities);
              if (activities.length === 0) {
                return (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted opacity-30" />
                      <p className="text-muted">Aucune activité enregistrée</p>
                      <p className="text-xs text-muted mt-1">Synchronisez vos activités pour voir vos statistiques.</p>
                    </CardContent>
                  </Card>
                );
              }
              return (
                <div className="space-y-4">
                  {/* Métriques globales */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
                      <MapPin className="w-5 h-5 mx-auto mb-1 text-primary" />
                      <p className="text-2xl font-bold text-foreground">{stats.totalKm.toFixed(1)}</p>
                      <p className="text-xs text-muted">km total</p>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                      <Clock className="w-5 h-5 mx-auto mb-1 text-blue-400" />
                      <p className="text-2xl font-bold text-foreground">{stats.totalHours.toFixed(1)}</p>
                      <p className="text-xs text-muted">heures</p>
                    </div>
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                      <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-400" />
                      <p className="text-2xl font-bold text-foreground">{stats.avgKm.toFixed(1)}</p>
                      <p className="text-xs text-muted">km/séance</p>
                    </div>
                    <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
                      <BarChart3 className="w-5 h-5 mx-auto mb-1 text-orange-400" />
                      <p className="text-2xl font-bold text-foreground">{activities.length}</p>
                      <p className="text-xs text-muted">activités</p>
                    </div>
                  </div>

                  {/* Répartition par type */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" />
                        Répartition par type
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(stats.byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                          const pct = Math.round((count / activities.length) * 100);
                          return (
                            <div key={type} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-foreground">{type}</span>
                                <span className="text-muted">{count} séance{count > 1 ? 's' : ''} ({pct}%)</span>
                              </div>
                              <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })()
          )}
          {activeTab === 'progression' && <ProgressionChart activities={activities} sport={sport} />}
          {activeTab === 'analyse' && (
            <div className="space-y-6">
              {/* ── 10.1 Distribution d'intensité ── */}
              <IntensityDistributionSection
                polarization={polarization}
                error={polarizationError}
              />
              {/* ── 10.2 HRV & Récupération ── */}
              <HRVRecoverySection hrv={hrv} error={hrvError} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// 10.1 — Section Distribution d'intensité (Polarisation)
// ============================================================================

interface IntensityDistributionSectionProps {
  polarization: PolarizationData | null;
  error: string | null;
}

function IntensityDistributionSection({ polarization, error }: IntensityDistributionSectionProps) {
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Distribution d&apos;intensité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted py-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!polarization) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Distribution d&apos;intensité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const zones: Array<{
    key: keyof PolarizationData['distribution'];
    label: string;
    targetKey: keyof PolarizationData['target'];
    color: string;
    bgColor: string;
  }> = [
    { key: 'low', label: 'Faible intensité (Z1–Z2)', targetKey: 'low', color: 'bg-green-500', bgColor: 'bg-green-500/10' },
    { key: 'moderate', label: 'Intensité modérée (Z3)', targetKey: 'moderate', color: 'bg-yellow-500', bgColor: 'bg-yellow-500/10' },
    { key: 'high', label: 'Haute intensité (Z4–Z5)', targetKey: 'high', color: 'bg-red-500', bgColor: 'bg-red-500/10' },
  ];

  const isOptimal = polarization.classification.optimal;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Distribution d&apos;intensité
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Classification badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          isOptimal ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isOptimal ? 'bg-green-400' : 'bg-yellow-400'}`} />
          {polarization.classification.label}
        </div>

        {/* Zone bars */}
        <div className="space-y-4">
          {zones.map(({ key, label, targetKey, color, bgColor }) => {
            const actual = Math.round(polarization.distribution[key]);
            const target = Math.round(polarization.target[targetKey]);
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">{label}</span>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="font-semibold text-foreground">{actual}%</span>
                    <span className="text-xs">cible {target}%</span>
                  </div>
                </div>
                <div className={`relative h-3 rounded-full ${bgColor} overflow-hidden`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${Math.min(actual, 100)}%` }}
                  />
                  {/* Target marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white/60"
                    style={{ left: `${Math.min(target, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Polarization index */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm text-muted">Indice de polarisation</span>
          <span className="text-lg font-bold text-foreground">{polarization.index.toFixed(2)}</span>
        </div>

        {/* Recommendation */}
        {polarization.recommendation.message && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-foreground">{polarization.recommendation.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// 10.2 — Section HRV & Récupération
// ============================================================================

interface HRVRecoverySectionProps {
  hrv: HRVData | null;
  error: string | null;
}

function HRVRecoverySection({ hrv, error }: HRVRecoverySectionProps) {
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            HRV &amp; Récupération
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted py-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hrv) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            HRV &amp; Récupération
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusConfig: Record<string, { label: string; color: string; bgColor: string; barColor: string }> = {
    excellent: { label: 'Excellent', color: 'text-green-400', bgColor: 'bg-green-500/15', barColor: 'bg-green-500' },
    good:      { label: 'Bon',       color: 'text-blue-400',  bgColor: 'bg-blue-500/15',  barColor: 'bg-blue-500'  },
    moderate:  { label: 'Modéré',    color: 'text-yellow-400',bgColor: 'bg-yellow-500/15',barColor: 'bg-yellow-500'},
    low:       { label: 'Faible',    color: 'text-orange-400',bgColor: 'bg-orange-500/15',barColor: 'bg-orange-500'},
    poor:      { label: 'Mauvais',   color: 'text-red-400',   bgColor: 'bg-red-500/15',   barColor: 'bg-red-500'   },
  };

  const cfg = statusConfig[hrv.status] ?? statusConfig['moderate'];
  const readinessPct = Math.min(Math.max(Math.round(hrv.readiness), 0), 100);
  const scorePct = Math.min(Math.max(Math.round(hrv.score), 0), 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          HRV &amp; Récupération
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Score principal */}
        <div className={`flex items-center gap-4 p-4 rounded-xl ${cfg.bgColor}`}>
          <div className="text-center min-w-[64px]">
            <p className={`text-4xl font-bold ${cfg.color}`}>{scorePct}</p>
            <p className="text-xs text-muted mt-0.5">Score HRV</p>
          </div>
          <div className="flex-1 space-y-1">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bgColor} ${cfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.barColor}`} />
              {cfg.label}
            </div>
            <p className="text-sm text-foreground">{hrv.message}</p>
          </div>
        </div>

        {/* Métriques détaillées */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-background border border-border text-center">
            <p className="text-xl font-bold text-foreground">{hrv.rmssd}</p>
            <p className="text-xs text-muted mt-0.5">RMSSD (ms)</p>
          </div>
          {hrv.baselineRmssd !== undefined && (
            <div className="p-3 rounded-lg bg-background border border-border text-center">
              <p className="text-xl font-bold text-foreground">{hrv.baselineRmssd}</p>
              <p className="text-xs text-muted mt-0.5">Baseline (ms)</p>
            </div>
          )}
          <div className="p-3 rounded-lg bg-background border border-border text-center">
            <p className="text-xl font-bold text-foreground">{hrv.ratio.toFixed(2)}</p>
            <p className="text-xs text-muted mt-0.5">Ratio HRV</p>
          </div>
          {hrv.stressScore !== undefined && (
            <div className="p-3 rounded-lg bg-background border border-border text-center">
              <p className="text-xl font-bold text-foreground">{hrv.stressScore}</p>
              <p className="text-xs text-muted mt-0.5">Score stress</p>
            </div>
          )}
        </div>

        {/* Readiness bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted font-medium">Niveau de récupération</span>
            <span className="font-semibold text-foreground">{readinessPct}%</span>
          </div>
          <Progress value={readinessPct} className="h-2.5" />
        </div>
      </CardContent>
    </Card>
  );
}
