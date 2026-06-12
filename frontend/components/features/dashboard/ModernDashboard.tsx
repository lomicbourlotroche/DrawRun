'use client';

import { useDashboardStore } from '@/stores';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { ReadinessCard } from './ReadinessCard';
import { RecommendationCard } from './RecommendationCard';
import { InjuryRiskCard } from './InjuryRiskCard';
import { PmcChart } from './PmcChart';
import { cn } from '@/lib/utils';
import { TrendingUp, Activity, Heart, Zap, ChevronRight, BarChart3 } from '@/components/ui/icons';
import Link from 'next/link';
import type { Activity as ActivityType, PmcDataPoint } from '@/types';

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}`;
  return `${m} min`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function getActivityIcon(type: string) {
  const t = type?.toLowerCase() ?? '';
  if (t.includes('run') || t.includes('course') || t.includes('trail')) return <Activity className="w-4 h-4" />;
  if (t.includes('bike') || t.includes('velo') || t.includes('cycling')) return <TrendingUp className="w-4 h-4" />;
  if (t.includes('swim') || t.includes('natation')) return <BarChart3 className="w-4 h-4" />;
  return <Activity className="w-4 h-4" />;
}

function getPmcStats(pmcData: PmcDataPoint[]) {
  if (pmcData.length === 0) return null;
  const latest = pmcData[pmcData.length - 1];
  return {
    ctl: Math.round(latest.ctl),
    atl: Math.round(latest.atl),
    tsb: Math.round(latest.tsb),
  };
}

interface HeroMetricProps {
  label: string;
  value: string;
  unit?: string;
  icon: React.ReactNode;
  accent: string;
  intensity: number;
  delay: string;
}

function HeroMetric({ label, value, unit, icon, accent, intensity, delay }: HeroMetricProps) {
  return (
    <div className={cn('animate-slide-up opacity-0 fill-mode-forwards', delay)}>
      <Card
        variant="glass"
        accent="primary"
        className="relative overflow-hidden group hover:border-primary/30"
      >
        <div className="flex items-start justify-between mb-2">
          <span className="text-[10px] font-semibold text-muted uppercase tracking-widest">{label}</span>
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', accent)}>
            {icon}
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-foreground tabular-nums tracking-tight">{value}</span>
          {unit && <span className="text-xs font-medium text-muted">{unit}</span>}
        </div>
        <div className="mt-3 h-1.5 bg-surface rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-1000', accent.replace('bg-', 'bg-') + '/60')}
            style={{ width: `${Math.min(intensity, 100)}%` }}
          />
        </div>
        <div className={cn('absolute -right-4 -bottom-4 w-20 h-20 blur-2xl rounded-full opacity-20', accent)} />
      </Card>
    </div>
  );
}

function ActivityRow({ activity }: { activity: ActivityType }) {
  const dateStr = activity.start_date ?? activity.date;
  const durationS = activity.moving_time ?? activity.elapsed_time ?? 0;
  const elevation = activity.total_elevation_gain;

  return (
    <Link
      href={`/app/activities/${activity.id}`}
      className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 transition-all duration-200 group border border-transparent hover:border-primary/10"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
          {getActivityIcon(activity.type)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{activity.title ?? 'Activit\u00e9'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {dateStr ? formatDate(dateStr) : '\u2014'}
            {durationS > 0 && ` \u00b7 ${formatDuration(durationS)}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        {(activity.distance ?? 0) > 0 && (
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground tabular-nums">{formatDistance(activity.distance!)}</p>
            {elevation != null && elevation > 0 && (
              <p className="text-[10px] text-muted-foreground">{Math.round(elevation)} m D+</p>
            )}
          </div>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl bg-surface/50 border border-border/50 overflow-hidden relative', className)}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer bg-[length:200%_100%]" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-1/3 bg-surface rounded" />
        <div className="h-8 w-1/2 bg-surface rounded" />
        <div className="h-3 w-2/3 bg-surface rounded" />
      </div>
    </div>
  );
}

const TSB_STATUS: Record<string, { label: string; icon: string; color: string }> = {
  fresh: { label: 'Bien repos\u00e9', icon: '++', color: 'text-success' },
  balanced: { label: '\u00c9quilibr\u00e9', icon: '~', color: 'text-primary' },
  tired: { label: 'Fatigu\u00e9', icon: '--', color: 'text-warning' },
  overtrained: { label: 'Surentra\u00een\u00e9', icon: '!!', color: 'text-danger' },
};

function getTsbStatus(tsb: number) {
  if (tsb > 5) return TSB_STATUS.fresh;
  if (tsb >= -5) return TSB_STATUS.balanced;
  if (tsb >= -15) return TSB_STATUS.tired;
  return TSB_STATUS.overtrained;
}

export function ModernDashboard() {
  const { readiness, recommendation, pmcData, recentActivities, isLoading } = useDashboardStore();

  const pmc = getPmcStats(pmcData);

  if (isLoading) {
    return (
      <div className="space-y-5 p-1 animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <SkeletonBlock key={i} className="h-28" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SkeletonBlock className="lg:col-span-2 h-80" />
          <div className="space-y-4">
            <SkeletonBlock className="h-44" />
            <SkeletonBlock className="h-44" />
            <SkeletonBlock className="h-36" />
          </div>
        </div>
        <SkeletonBlock className="h-48" />
      </div>
    );
  }

  const hasNoData = recentActivities.length === 0 && (!pmc || (pmc.ctl === 0 && pmc.atl === 0 && pmc.tsb === 0));

  if (hasNoData) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <BarChart3 className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Command Center</h2>
        <p className="text-sm text-muted-foreground max-w-xs mb-6">
          Synchronisez vos services pour d\u00e9marrer le suivi de vos performances.
        </p>
        <Link
          href="/app/activities"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Zap className="w-4 h-4" />
          Ajouter une activit\u00e9
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-1 animate-fade-in">
      {/* Hero Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <HeroMetric
          label="CTL — Fitness"
          value={pmc ? String(pmc.ctl) : '\u2014'}
          icon={<TrendingUp className="w-4 h-4 text-white" />}
          accent="bg-primary"
          intensity={pmc ? Math.min((pmc.ctl / 100) * 100, 100) : 0}
          delay="delay-[0ms]"
        />
        <HeroMetric
          label="ATL — Fatigue"
          value={pmc ? String(pmc.atl) : '\u2014'}
          icon={<Activity className="w-4 h-4 text-white" />}
          accent="bg-danger"
          intensity={pmc ? Math.min((pmc.atl / 100) * 100, 100) : 0}
          delay="delay-[100ms]"
        />
        <HeroMetric
          label="TSB — Forme"
          value={pmc ? String(pmc.tsb) : '\u2014'}
          icon={<BarChart3 className="w-4 h-4 text-white" />}
          accent={pmc && pmc.tsb > 5 ? 'bg-success' : pmc && pmc.tsb < -15 ? 'bg-danger' : pmc && pmc.tsb < -5 ? 'bg-warning' : 'bg-primary'}
          intensity={pmc ? Math.min(Math.abs(pmc.tsb) * 4, 100) : 0}
          delay="delay-[200ms]"
        />
        <HeroMetric
          label="RHR — Repos"
          value={readiness?.factors?.restingHR ? String(readiness.factors.restingHR) : '\u2014'}
          unit="bpm"
          icon={<Heart className="w-4 h-4 text-white" />}
          accent="bg-secondary"
          intensity={readiness?.factors?.restingHR ? Math.max(0, 100 - readiness.factors.restingHR) : 0}
          delay="delay-[300ms]"
        />
      </div>

      {/* Two-Column Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: PMC Chart */}
        <div className="lg:col-span-2 animate-slide-up opacity-0 fill-mode-forwards delay-[100ms]">
          <Card variant="glass" accent="primary" hover className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted">
                  Performance Management Chart
                </CardTitle>
                <Zap className="w-4 h-4 text-primary/60" />
              </div>
            </CardHeader>
            <CardContent>
              <PmcChart data={pmcData} isLoading={false} />
              {pmc && (
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                  {[
                    { label: 'CTL', value: pmc.ctl, color: 'text-primary', bar: 'bg-primary' },
                    { label: 'ATL', value: pmc.atl, color: 'text-danger', bar: 'bg-danger' },
                    { label: 'TSB', value: pmc.tsb, color: getTsbStatus(pmc.tsb).color, bar: pmc.tsb >= 0 ? 'bg-success' : 'bg-warning' },
                  ].map((m) => (
                    <div key={m.label} className="flex items-center gap-2 text-xs">
                      <div className={cn('w-2 h-2 rounded-full', m.bar)} />
                      <span className="text-muted">{m.label}</span>
                      <span className={cn('font-bold tabular-nums', m.color)}>{m.value}</span>
                    </div>
                  ))}
                  <div className="ml-auto">
                    <span className={cn('text-[10px] font-bold uppercase tracking-wider', getTsbStatus(pmc.tsb).color)}>
                      {getTsbStatus(pmc.tsb).label}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Stacked Cards */}
        <div className="lg:col-span-1 space-y-4">
          <div className="animate-slide-up opacity-0 fill-mode-forwards delay-[200ms]">
            <Card variant="glass" accent="primary" hover className="relative overflow-hidden">
              <CardContent className="p-0">
                <ReadinessCard readiness={readiness} isLoading={false} />
              </CardContent>
            </Card>
          </div>

          <div className="animate-slide-up opacity-0 fill-mode-forwards delay-[300ms]">
            <Card variant="glass" accent="success" hover className="relative overflow-hidden">
              <CardContent className="p-0">
                <RecommendationCard recommendation={recommendation} isLoading={false} />
              </CardContent>
            </Card>
          </div>

          {pmcData.length > 0 && (
            <div className="animate-slide-up opacity-0 fill-mode-forwards delay-[400ms]">
              <Card variant="glass" accent="warning" hover className="relative overflow-hidden">
                <CardContent className="p-0">
                  <InjuryRiskCard
                    acwr={pmcData[pmcData.length - 1].acwr || (pmcData[pmcData.length - 1].atl / (pmcData[pmcData.length - 1].ctl || 1))}
                    trend={pmcData.length > 7 ? (pmcData[pmcData.length - 1].acwr! > pmcData[pmcData.length - 8].acwr! ? 'up' : 'down') : 'stable'}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {!recommendation && pmc && pmcData.length === 0 && (
            <div className="animate-slide-up opacity-0 fill-mode-forwards delay-[400ms]">
              <Card variant="glass" hover>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted">
                    M\u00e9triques PMC
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'CTL', value: pmc.ctl, color: 'bg-primary', max: 150 },
                    { label: 'ATL', value: pmc.atl, color: 'bg-danger', max: 150 },
                    { label: 'TSB', value: Math.abs(pmc.tsb), color: pmc.tsb >= 0 ? 'bg-success' : 'bg-warning', max: 50 },
                  ].map((m) => (
                    <div key={m.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground font-medium">{m.label}</span>
                        <span className="font-semibold text-foreground tabular-nums">
                          {m.label === 'TSB' && pmc.tsb < 0 ? '-' : ''}{m.value}
                        </span>
                      </div>
                      <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-700', m.color)}
                          style={{ width: `${Math.min(100, (m.value / m.max) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="animate-slide-up opacity-0 fill-mode-forwards delay-[500ms]">
        <Card variant="glass" accent="info" hover className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted">
                Activit\u00e9s r\u00e9centes
              </CardTitle>
              <Link
                href="/app/activities"
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                Voir tout
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <div className="divide-y divide-border/30">
                {recentActivities.slice(0, 5).map((activity) => (
                  <ActivityRow key={activity.id} activity={activity} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <Activity className="w-6 h-6 text-primary/60" />
                </div>
                <p className="text-sm font-medium text-foreground">Aucune activit\u00e9 r\u00e9cente</p>
                <p className="text-xs text-muted-foreground mt-1">Synchronisez vos services pour voir vos activit\u00e9s</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
