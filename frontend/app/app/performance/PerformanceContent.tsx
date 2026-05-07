/* eslint-disable unused-imports/no-unused-vars, react-hooks/exhaustive-deps */
/**
 * PerformanceContent - Contenu de la page Performance
 */

'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useUserConstantsStore } from '@/stores';
import { PerformanceZones, PerformanceMetrics, ProgressionChart } from '@/components/features/performance';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent, Skeleton, Progress } from '@/components/ui';
import { Dumbbell, Bike, Waves, Heart, Activity, TrendingUp, Gauge, Zap, BarChart3, Brain, AlertCircle, MapPin, Clock, Crown, Star } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'metrics' | 'zones' | 'stats' | 'progression' | 'analyse' | 'elite'>('metrics');
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
        api.getActivities().catch(() => ({ data: [] as ActivityType[] })),
      ]);
      setPmc(p);
      // acts est maintenant { data: Activity[], pagination: ... }
      const actsArray = Array.isArray((acts as any)?.data) ? (acts as any).data : [];
      setActivities(actsArray);

      // ── Polarisation ──────────────────────────────────────────────────────
      // Calculer la distribution d'intensité depuis la FC des activités
      // (zonePercent n'existe pas dans le type Activity — on estime depuis avgHR/maxHR)
      try {
        const profile = constantsResult?.profile;
        const fcm = profile?.fcm || 180;

        // Construire zonePercent estimé depuis average_heartrate et max_heartrate
        const activitiesWithZones = actsArray
          .filter((a: ActivityType) => a.average_heartrate)
          .map((a: ActivityType) => {
            const avgHR = a.average_heartrate ?? 0;
            const hrPct = avgHR / fcm;
            // Estimer la zone dominante depuis le % FCM
            let low = 0, moderate = 0, high = 0;
            if (hrPct < 0.70) { low = 100; }
            else if (hrPct < 0.80) { low = 40; moderate = 60; }
            else if (hrPct < 0.88) { moderate = 30; high = 70; }
            else { high = 100; }
            return { zonePercent: { 1: low / 2, 2: low / 2, 3: moderate, 4: high / 2, 5: high / 2 } };
          });

        if (activitiesWithZones.length > 0) {
          const polData = await api.getAlgoPolarization(activitiesWithZones);
          setPolarization(polData);
        } else {
          setPolarizationError('Pas assez de données FC pour calculer la polarisation');
        }
      } catch {
        setPolarizationError('Données de polarisation non disponibles');
      }

      // ── HRV ───────────────────────────────────────────────────────────────
      // Estimer le HRV depuis la FC de repos et les activités récentes
      try {
        const profile = constantsResult?.profile;
        const restingHR = (profile as unknown as Record<string, unknown> | null)?.restingHR as number | undefined;

        // Calculer un RMSSD estimé depuis la variabilité de FC entre activités
        const hrs = actsArray
          .filter((a: ActivityType) => a.average_heartrate)
          .slice(0, 14) // 2 dernières semaines
          .map((a: ActivityType) => a.average_heartrate as number);

        if (hrs.length >= 3) {
          // RMSSD estimé : écart-type de la FC × facteur de conversion empirique
          const mean = hrs.reduce((s: number, v: number) => s + v, 0) / hrs.length;
          const variance = hrs.reduce((s: number, v: number) => s + (v - mean) ** 2, 0) / hrs.length;
          const stdDev = Math.sqrt(variance);
          // Conversion empirique : stdDev FC ≈ RMSSD / 3 pour coureurs entraînés
          const estimatedRmssd = Math.round(stdDev * 3 + 20);
          const baseline = restingHR ? Math.round(60 / restingHR * 30 + 20) : null;

          const hrvData = await api.getAlgoHRV({
            rmssd: estimatedRmssd,
            baseline: baseline ?? undefined,
            restingHR: restingHR ?? 60,
          });
          setHrv(hrvData);
        } else {
          setHrvError('Pas assez d\'activités récentes pour estimer le HRV');
        }
      } catch {
        setHrvError('Données HRV non disponibles');
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
    { id: 'elite', label: 'Elite', icon: <Crown className="w-4 h-4 text-amber-500" /> },
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
            className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
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
                className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
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
              <GlassCard>
                <GlassCardHeader>
                  <GlassCardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    Métriques clés
                  </GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
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
                </GlassCardContent>
              </GlassCard>
            </div>
          )}
          {activeTab === 'zones' && <PerformanceZones zones={zones as any} />}
          {activeTab === 'stats' && (
            (() => {
              const stats = computeStats(activities);
              if (activities.length === 0) {
                return (
                  <GlassCard>
                    <GlassCardContent className="p-8 text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted opacity-30" />
                      <p className="text-muted">Aucune activité enregistrée</p>
                      <p className="text-xs text-muted mt-1">Synchronisez vos activités pour voir vos statistiques.</p>
                    </GlassCardContent>
                  </GlassCard>
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
                  <GlassCard>
                    <GlassCardHeader>
                      <GlassCardTitle className="text-base flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" />
                        Répartition par type
                      </GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent>
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
                    </GlassCardContent>
                  </GlassCard>
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
          {activeTab === 'elite' && (
            <EliteAnalyticsSection activities={activities} />
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// 10.3 — Elite Analytics Section
// ============================================================================

function EliteAnalyticsSection({ activities }: { activities: ActivityType[] }) {
    // Filtrer les activités avec EF
    const efData = activities
        .filter(a => a.efficiency_factor)
        .map(a => ({
            date: a.date || a.start_date || '',
            ef: a.efficiency_factor
        }))
        .reverse();
    
    const trailActivities = activities.filter(a => a.gap && a.total_elevation_gain && a.total_elevation_gain > 50);

    return (
        <div className="space-y-6 animate-slide-up">
            <GlassCard>
                <GlassCardHeader>
                    <GlassCardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Efficacité Aérobie (EF)
                    </GlassCardTitle>
                </GlassCardHeader>
                <GlassCardContent>
                    <p className="text-sm text-muted mb-6">
                        L&apos;Efficiency Factor (EF) mesure votre vitesse ajustée à la pente (GAP) par rapport à votre fréquence cardiaque moyenne.
                        Une hausse de l&apos;EF sur le long terme indique une amélioration de votre condition aérobie.
                    </p>
                    
                    <div className="h-64 relative">
                        {efData.length >= 2 ? (
                            <div className="w-full h-full flex flex-col justify-end gap-1">
                                <div className="flex-1 flex items-end gap-1 px-2">
                                    {efData.slice(-15).map((d, i) => {
                                        const h = Math.min(100, (d.ef || 0) * 40);
                                        return (
                                            <div 
                                                key={i} 
                                                className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t-sm transition-all group relative"
                                                style={{ height: `${h}%` }}
                                            >
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-neutral-900 text-white text-[10px] py-0.5 px-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                                                    {d.ef}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="h-px bg-border w-full" />
                                <div className="flex justify-between text-[10px] text-muted pt-1">
                                    <span>{new Date(efData[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                    <span>{new Date(efData[efData.length - 1].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center border border-dashed border-border rounded-xl">
                                <p className="text-sm text-muted">Pas assez de données pour le graphique EF</p>
                            </div>
                        )}
                    </div>
                </GlassCardContent>
            </GlassCard>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ── Analyse de Pente (GAP) ── */}
                <GlassCard>
                    <GlassCardHeader>
                        <GlassCardTitle className="flex items-center gap-2 text-base">
                            <MapPin className="w-4 h-4 text-primary" />
                            Analyse de Pente (GAP)
                        </GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left border-b border-border text-xs text-muted uppercase tracking-wider">
                                        <th className="pb-2 font-medium">Date</th>
                                        <th className="pb-2 font-medium text-right">Pace</th>
                                        <th className="pb-2 font-medium text-right text-primary">GAP</th>
                                        <th className="pb-2 font-medium text-right">Gain</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trailActivities.length > 0 ? (
                                        trailActivities.slice(0, 6).map(a => (
                                            <tr key={a.id} className="border-b border-border/50 last:border-0 hover:bg-muted/5 transition-colors">
                                                <td className="py-2.5 text-muted">{new Date(a.date || a.start_date || '').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</td>
                                                <td className="py-2.5 text-right font-medium">{a.pace}/km</td>
                                                <td className="py-2.5 text-right font-bold text-primary">{a.gap}/km</td>
                                                <td className="py-2.5 text-right text-xs">+{a.total_elevation_gain}m</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-muted italic">
                                                Aucune activité en dénivelé détectée.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </GlassCardContent>
                </GlassCard>

                {/* ── Cardiac Decoupling Concept ── */}
                <GlassCard>
                    <GlassCardHeader>
                        <GlassCardTitle className="flex items-center gap-2 text-base">
                            <Star className="w-4 h-4 text-amber-500" />
                            Économie Aérobie
                        </GlassCardTitle>
                    </GlassCardHeader>
                    <GlassCardContent className="space-y-4">
                        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                            <h4 className="text-sm font-semibold text-amber-600 mb-1">Concept Elite</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Un coureur efficace maintient son allure sans que sa fréquence cardiaque ne dérive de manière excessive. 
                                Si votre EF augmente au fil des mois pour une même intensité, vous devenez une machine plus efficace.
                            </p>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Dernière séance EF</span>
                                <span className="text-lg font-bold text-primary">{efData.length > 0 ? efData[efData.length - 1].ef : '--'}</span>
                            </div>
                            <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-2/3" />
                            </div>
                            <p className="text-[10px] text-muted text-right italic">
                                Comparé à votre baseline de 1.42
                            </p>
                        </div>
                    </GlassCardContent>
                </GlassCard>
            </div>
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
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Distribution d&apos;intensité
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="flex items-center gap-2 text-muted py-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </GlassCardContent>
      </GlassCard>
    );
  }

  if (!polarization) {
    return (
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Distribution d&apos;intensité
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="space-y-3">
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </div>
        </GlassCardContent>
      </GlassCard>
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
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Distribution d&apos;intensité
        </GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent className="space-y-5">
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
      </GlassCardContent>
    </GlassCard>
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
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            HRV &amp; Récupération
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="flex items-center gap-2 text-muted py-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </GlassCardContent>
      </GlassCard>
    );
  }

  if (!hrv) {
    return (
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            HRV &amp; Récupération
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="space-y-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </div>
        </GlassCardContent>
      </GlassCard>
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
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          HRV &amp; Récupération
        </GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent className="space-y-5">
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
      </GlassCardContent>
    </GlassCard>
  );
}
