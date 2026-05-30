'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useUserConstantsStore } from '@/stores';
import { PerformanceZones, PerformanceMetrics, ProgressionChart } from '@/components/features/performance';
import { Card, Skeleton, Badge } from '@/components/ui';
import { NavTabs } from '@/components/ui/NavTabs';
import { EliteAnalyticsSection } from './EliteAnalyticsSection';
import { IntensityDistributionSection } from './IntensityDistributionSection';
import { HRVRecoverySection } from './HRVRecoverySection';
import { Dumbbell, Bike, Waves, Activity, TrendingUp, Gauge, Zap, BarChart3, Brain, Heart, MapPin, Clock } from 'lucide-react';
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
          setPolarizationError('Pas assez de données FC pour calculer la polarisation');
        }
      } catch {
        setPolarizationError('Données de polarisation non disponibles');
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
          setHrvError('Pas assez d\'activités récentes pour estimer le HRV');
        }
      } catch {
        setHrvError('Données HRV non disponibles');
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
    { id: 'bike', label: 'Vélo', icon: <Bike className="w-4 h-4" /> },
    { id: 'swim', label: 'Natation', icon: <Waves className="w-4 h-4" /> },
  ];

  const tabs = [
    { id: 'metrics', label: 'Métriques', icon: <Gauge className="w-4 h-4" /> },
    { id: 'zones', label: 'Zones', icon: <Zap className="w-4 h-4" /> },
    { id: 'progression', label: 'Progression', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'analyse', label: 'Analyse', icon: <Brain className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
            <Activity className="w-6 h-6 text-primary-500" />
            Performances
          </h1>
          <p className="text-neutral-500 mt-1.5">Suivez vos métriques et progressions</p>
        </div>
        <button
          onClick={handleRecalculate}
          disabled={isRecalculating}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary-50 text-primary-600 hover:bg-primary-100 transition-all disabled:opacity-50"
        >
          <Activity className={`w-4 h-4 ${isRecalculating ? 'animate-spin' : ''}`} />
          {isRecalculating ? 'Calcul...' : 'Recalculer'}
        </button>
      </div>

      <NavTabs tabs={sportTabs} activeTab={sport} onChange={(id) => setSport(id as 'run' | 'bike' | 'swim')} />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <>
          <NavTabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as typeof activeTab)} />

          {activeTab === 'metrics' && (
            <div className="space-y-6">
              <PerformanceMetrics sport={sport} metrics={{
                vma: profile?.vma ?? undefined,
                vdot: profile?.vdot ?? undefined,
                vo2max: profile?.fcm ? Math.round((profile.fcm - (profile.restingHR || 60)) * 0.15 + 30) : undefined,
              }} />
              <Card padding="none">
                <div className="px-6 py-4 border-b border-neutral-200/60">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Heart className="w-5 h-5 text-danger" />
                    Métriques clés
                  </h3>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { value: profile?.fcm, label: 'FCM', gradient: 'from-danger/5 to-danger/10', border: 'border-danger/10' },
                      { value: profile?.vdot, label: 'VDOT', gradient: 'from-primary-50 to-primary-100/50', border: 'border-primary-200/30' },
                      { value: profile?.vma ? `${profile.vma.toFixed(1)}` : null, label: 'VMA km/h', gradient: 'from-success/5 to-success/10', border: 'border-success/10' },
                      { value: profile?.fcm ? Math.round((profile.fcm - (profile.restingHR || 60)) * 0.15 + 30) : null, label: 'VO₂ max', gradient: 'from-warning/5 to-warning/10', border: 'border-warning/10', badge: 'Estimé' },
                    ].map(({ value, label, gradient, border, badge }) => (
                      <div key={label} className={`relative overflow-hidden p-4 rounded-xl bg-gradient-to-br ${gradient} ${border} text-center transition-all hover:shadow-md`}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary-500" />
                        <p className="text-3xl font-bold text-primary-500 tracking-tight tabular-nums">{value ?? '--'}</p>
                        <p className="text-xs text-neutral-500 mt-1 font-medium">{label}{badge ? <Badge variant="outline" className="text-[10px] ml-1">{badge}</Badge> : null}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}
          {activeTab === 'zones' && <PerformanceZones zones={{
            ...zones,
            fcm: profile?.fcm || 0,
            vma: profile?.vma || 0,
            vdot: profile?.vdot || 0,
          } as unknown as Zones} />}
          {activeTab === 'progression' && (
            <div className="space-y-4">
              {activities.length === 0 ? (
                <Card padding="lg" className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                  <p className="text-neutral-500">Aucune activité enregistrée</p>
                  <p className="text-xs text-neutral-400 mt-1">Synchronisez vos activités pour voir vos statistiques.</p>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { icon: MapPin, value: computeStats(activities).totalKm.toFixed(1), label: 'km total', gradient: 'from-primary-50 to-primary-100/50', border: 'border-primary-200/30' },
                      { icon: Clock, value: computeStats(activities).totalHours.toFixed(1), label: 'heures', gradient: 'from-primary-50 to-primary-100/50', border: 'border-primary-200/30' },
                      { icon: TrendingUp, value: computeStats(activities).avgKm.toFixed(1), label: 'km/séance', gradient: 'from-success/5 to-success/10', border: 'border-success/10' },
                      { icon: BarChart3, value: activities.length, label: 'activités', gradient: 'from-peak/5 to-peak/10', border: 'border-peak/10' },
                    ].map(({ icon: Icon, value, label, gradient, border }) => (
                      <div key={label} className={`relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br ${gradient} ${border} text-center transition-all hover:shadow-md`}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary-500" />
                        <Icon className="w-5 h-5 mx-auto mb-2 text-primary-500" />
                        <p className="text-3xl font-bold text-foreground tracking-tight tabular-nums">{value}</p>
                        <p className="text-xs text-neutral-500 mt-1 font-medium">{label}</p>
                      </div>
                    ))}
                  </div>

                  <Card padding="none">
                    <div className="px-6 py-4 border-b border-neutral-200/60">
                      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary-500" />
                        Répartition par type
                      </h3>
                    </div>
                    <div className="p-5 space-y-4">
                      {Object.entries(computeStats(activities).byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                        const pct = Math.round((count / activities.length) * 100);
                        return (
                          <div key={type} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-foreground">{type}</span>
                              <span className="text-neutral-500">{count} séance{count > 1 ? 's' : ''} ({pct}%)</span>
                            </div>
                            <div className="h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                              <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  <ProgressionChart activities={activities} sport={sport} />
                </>
              )}
            </div>
          )}
          {activeTab === 'analyse' && (
            <div className="space-y-6">
              <IntensityDistributionSection polarization={polarization} error={polarizationError} />
              <HRVRecoverySection hrv={hrv} error={hrvError} />
              <EliteAnalyticsSection activities={activities} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
