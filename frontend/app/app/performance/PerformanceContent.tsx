'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useUserConstantsStore } from '@/stores';
import { PerformanceZones, PerformanceMetrics, ProgressionChart } from '@/components/features/performance';
import { Card, CardHeader, CardTitle, CardContent, Skeleton, Badge } from '@/components/ui';
import { NavTabs } from '@/components/ui/NavTabs';
import { EliteAnalyticsSection } from './EliteAnalyticsSection';
import { IntensityDistributionSection } from './IntensityDistributionSection';
import { HRVRecoverySection } from './HRVRecoverySection';
import { cn } from '@/lib/utils';
import { Dumbbell, Bike, Waves, Activity, TrendingUp, Gauge, Zap, BarChart3, Brain, Heart, Clock } from '@/components/ui/icons';
import type { PmcDataPoint, Activity as ActivityType, Zones } from '@/types';

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
  const [activeTab, setActiveTab] = useState<'metrics' | 'zones' | 'progression' | 'analyse'>('metrics');
  const [, setPmc] = useState<PmcDataPoint[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [polarization, setPolarization] = useState<PolarizationData | null>(null);
  const [polarizationError, setPolarizationError] = useState<string | null>(null);
  const [hrv, setHrv] = useState<HRVData | null>(null);
  const [hrvError, setHrvError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const { fetchConstants, zones, profile } = useUserConstantsStore();

  useEffect(() => {
    if (api.isAuthenticated()) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const actsArray = Array.isArray(acts?.data) ? acts.data : [];
      setActivities(actsArray);

      try {
        const profileData = constantsResult?.profile;
        const fcm = profileData?.fcm || 180;

        const activitiesWithZones = actsArray
          .filter((a: ActivityType) => a.average_heartrate)
          .map((a: ActivityType) => {
            const avgHR = a.average_heartrate ?? 0;
            const hrPct = avgHR / fcm;
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
          setPolarizationError('Pas assez de donn\u00e9es FC pour calculer la polarisation');
        }
      } catch {
        setPolarizationError('Donn\u00e9es de polarisation non disponibles');
      }

      try {
        const profileData = constantsResult?.profile;
        const restingHR = (profileData as unknown as Record<string, unknown> | null)?.restingHR as number | undefined;

        const hrs = actsArray
          .filter((a: ActivityType) => a.average_heartrate)
          .slice(0, 14)
          .map((a: ActivityType) => a.average_heartrate as number);

        if (hrs.length >= 3) {
          const mean = hrs.reduce((s: number, v: number) => s + v, 0) / hrs.length;
          const variance = hrs.reduce((s: number, v: number) => s + (v - mean) ** 2, 0) / hrs.length;
          const stdDev = Math.sqrt(variance);
          const estimatedRmssd = Math.round(stdDev * 3 + 20);
          const baseline = restingHR ? Math.round(60 / restingHR * 30 + 20) : null;

          const hrvData = await api.getAlgoHRV({
            rmssd: estimatedRmssd,
            baseline: baseline ?? undefined,
            restingHR: restingHR ?? 60,
          });
          setHrv(hrvData);
        } else {
          setHrvError('Pas assez d\'activit\u00e9s r\u00e9centes pour estimer le HRV');
        }
      } catch {
        setHrvError('Donn\u00e9es HRV non disponibles');
      }

    } catch { /* silent */ }
    finally { setIsLoading(false); }
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      await api.recalculateMetrics();
      await loadData();
    } catch {
      // silent
    } finally {
      setIsRecalculating(false);
    }
  };

  const sportTabs = [
    { id: 'run', label: 'Course', icon: <Dumbbell className="w-4 h-4" /> },
    { id: 'bike', label: 'V\u00e9lo', icon: <Bike className="w-4 h-4" /> },
    { id: 'swim', label: 'Natation', icon: <Waves className="w-4 h-4" /> },
  ];

  const tabs = [
    { id: 'metrics', label: 'M\u00e9triques', icon: <Gauge className="w-4 h-4" /> },
    { id: 'zones', label: 'Zones', icon: <Zap className="w-4 h-4" /> },
    { id: 'progression', label: 'Progression', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'analyse', label: 'Analyse', icon: <Brain className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className={cn('animate-slide-up opacity-0 fill-mode-forwards delay-100')}>
        <Card variant="glass" accent="primary" className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Performances</h1>
                <p className="text-sm text-muted mt-0.5">Suivez vos m\u00e9triques et progressions</p>
              </div>
            </div>
            <button
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
            >
              <Activity className={cn('w-4 h-4', isRecalculating && 'animate-spin')} />
              {isRecalculating ? 'Calcul...' : 'Recalculer'}
            </button>
          </div>
          <div className="absolute -right-6 -bottom-6 w-32 h-32 blur-3xl rounded-full bg-primary/10" />
        </Card>
      </div>

      <div className={cn('animate-slide-up opacity-0 fill-mode-forwards delay-200')}>
        <NavTabs tabs={sportTabs} activeTab={sport} onChange={(id) => setSport(id as 'run' | 'bike' | 'swim')} />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <>
          <div className={cn('animate-slide-up opacity-0 fill-mode-forwards delay-300')}>
            <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-xl p-1 inline-flex w-full">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    activeTab === tab.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted hover:text-foreground'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'metrics' && (
            <div className="space-y-6">
              <div className={cn('animate-slide-up opacity-0 fill-mode-forwards delay-300')}>
                <PerformanceMetrics sport={sport} metrics={{
                  vma: profile?.vma ?? undefined,
                  vdot: profile?.vdot ?? undefined,
                  vo2max: profile?.fcm ? Math.round((profile.fcm - (profile.restingHR || 60)) * 0.15 + 30) : undefined,
                }} />
              </div>

              <div className={cn('animate-slide-up opacity-0 fill-mode-forwards delay-400')}>
                <Card variant="glass" accent="info" padding="none">
                  <CardHeader className="px-6 pt-5 pb-0">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Heart className="w-5 h-5 text-danger" />
                      M\u00e9triques cl\u00e9s
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { value: profile?.fcm, label: 'FCM', accent: 'danger' as const, badge: null },
                        { value: profile?.vdot, label: 'VDOT', accent: 'primary' as const, badge: null },
                        { value: profile?.vma ? `${profile.vma.toFixed(1)}` : null, label: 'VMA km/h', accent: 'success' as const, badge: null },
                        { value: profile?.fcm ? Math.round((profile.fcm - (profile.restingHR || 60)) * 0.15 + 30) : null, label: 'VO\u2082 max', accent: 'warning' as const, badge: 'Estim\u00e9' },
                      ].map(({ value, label, accent, badge }) => (
                        <Card key={label} variant="glass-subtle" accent={accent} className="text-center">
                          <p className="text-3xl font-bold text-foreground tracking-tight tabular-nums">{value ?? '--'}</p>
                          <p className="text-xs text-muted mt-1 font-medium">
                            {label}
                            {badge && <Badge variant="outline" className="text-[10px] ml-1">{badge}</Badge>}
                          </p>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'zones' && (
            <div className={cn('animate-slide-up opacity-0 fill-mode-forwards delay-300')}>
              <PerformanceZones zones={{
                ...zones,
                fcm: profile?.fcm || 0,
                vma: profile?.vma || 0,
                vdot: profile?.vdot || 0,
              } as unknown as Zones} />
            </div>
          )}

          {activeTab === 'progression' && (
            <div className="space-y-4">
              {activities.length === 0 ? (
                <Card variant="glass" padding="lg" className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted" />
                  <p className="text-muted">Aucune activit\u00e9 enregistr\u00e9e</p>
                  <p className="text-xs text-muted mt-1">Synchronisez vos activit\u00e9s pour voir vos statistiques.</p>
                </Card>
              ) : (
                <>
                  <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up opacity-0 fill-mode-forwards delay-300')}>
                    {[
                      { icon: TrendingUp, value: computeStats(activities).totalKm.toFixed(1), label: 'km total', accent: 'primary' as const },
                      { icon: Clock, value: computeStats(activities).totalHours.toFixed(1), label: 'heures', accent: 'primary' as const },
                      { icon: TrendingUp, value: computeStats(activities).avgKm.toFixed(1), label: 'km/s\u00e9ance', accent: 'success' as const },
                      { icon: BarChart3, value: activities.length, label: 'activit\u00e9s', accent: 'peak' as const },
                    ].map(({ icon: Icon, value, label, accent }) => (
                      <Card key={label} variant="glass" accent={accent} className="text-center">
                        <Icon className="w-5 h-5 mx-auto mb-2 text-foreground" />
                        <p className="text-3xl font-bold text-foreground tracking-tight tabular-nums">{value}</p>
                        <p className="text-xs text-muted mt-1 font-medium">{label}</p>
                      </Card>
                    ))}
                  </div>

                  <div className={cn('animate-slide-up opacity-0 fill-mode-forwards delay-400')}>
                    <Card variant="glass" accent="primary" padding="none">
                      <CardHeader className="px-6 pt-5 pb-0">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Activity className="w-4 h-4 text-primary" />
                          R\u00e9partition par type
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 space-y-4">
                        {Object.entries(computeStats(activities).byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                          const pct = Math.round((count / activities.length) * 100);
                          return (
                            <div key={type} className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-foreground">{type}</span>
                                <span className="text-muted-foreground">{count} s\u00e9ance{count > 1 ? 's' : ''} ({pct}%)</span>
                              </div>
                              <div className="h-2.5 bg-surface rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </div>

                  <div className={cn('animate-slide-up opacity-0 fill-mode-forwards delay-500')}>
                    <ProgressionChart activities={activities} sport={sport} />
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'analyse' && (
            <div className="space-y-6">
              <div className={cn('animate-slide-up opacity-0 fill-mode-forwards delay-300')}>
                <IntensityDistributionSection polarization={polarization} error={polarizationError} />
              </div>
              <div className={cn('animate-slide-up opacity-0 fill-mode-forwards delay-400')}>
                <HRVRecoverySection hrv={hrv} error={hrvError} />
              </div>
              <div className={cn('animate-slide-up opacity-0 fill-mode-forwards delay-500')}>
                <EliteAnalyticsSection activities={activities} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
