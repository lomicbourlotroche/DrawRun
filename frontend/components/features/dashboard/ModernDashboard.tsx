'use client';

import Link from 'next/link';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
  Clock,
  Mountain,
} from 'lucide-react';
import { useAuthStore, useDashboardStore } from '@/stores';
import { ReadinessCard } from './ReadinessCard';
import { RecommendationCard } from './RecommendationCard';
import type { Activity as ActivityType, PmcDataPoint } from '@/types';

// ─── helpers ────────────────────────────────────────────────────────────────

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
  if (t.includes('run') || t.includes('course') || t.includes('trail')) {
    return <Activity className="w-4 h-4" />;
  }
  if (t.includes('bike') || t.includes('velo') || t.includes('cycling')) {
    return <TrendingUp className="w-4 h-4" />;
  }
  if (t.includes('swim') || t.includes('natation')) {
    return <BarChart3 className="w-4 h-4" />;
  }
  return <Activity className="w-4 h-4" />;
}

// ─── sub-components ──────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: number | null;
}

function StatCard({ title, value, subtitle, icon, iconBg, trend }: StatCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)] transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        {trend !== null && trend !== undefined && (
          <div
            className={`flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full ${
              trend > 0
                ? 'bg-green-50 text-green-600'
                : trend < 0
                ? 'bg-red-50 text-red-500'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {trend > 0 ? (
              <ArrowUp className="w-3 h-3" />
            ) : trend < 0 ? (
              <ArrowDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            {Math.abs(trend)}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-sm font-medium text-slate-900 mt-0.5">{title}</p>
      <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
    </div>
  );
}

interface ActivityRowProps {
  activity: ActivityType;
}

function ActivityRow({ activity }: ActivityRowProps) {
  const dateStr = activity.start_date ?? activity.date;
  const distanceM = activity.distance ?? 0;
  const durationS = activity.moving_time ?? activity.elapsed_time ?? 0;
  const elevation = activity.total_elevation_gain;

  return (
    <Link
      href={`/app/activities/${activity.id}`}
      className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 transition-colors duration-150 group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
          {getActivityIcon(activity.type)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {activity.title ?? 'Activité'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {dateStr ? formatDate(dateStr) : '—'}
            {durationS > 0 && ` · ${formatDuration(durationS)}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0 ml-3">
        {distanceM > 0 && (
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900 tabular-nums">
              {formatDistance(distanceM)}
            </p>
            {elevation != null && elevation > 0 && (
              <p className="text-xs text-slate-400 flex items-center justify-end gap-0.5">
                <Mountain className="w-3 h-3" />
                {Math.round(elevation)} m
              </p>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

// ─── PMC stat helpers ────────────────────────────────────────────────────────

function getPmcStats(pmcData: PmcDataPoint[]) {
  if (pmcData.length === 0) return null;
  const latest = pmcData[pmcData.length - 1];
  const prev = pmcData.length > 7 ? pmcData[pmcData.length - 8] : null;
  return {
    ctl: Math.round(latest.ctl),
    atl: Math.round(latest.atl),
    tsb: Math.round(latest.tsb),
    ctlTrend: prev ? Math.round(latest.ctl - prev.ctl) : null,
    tsbTrend: prev ? Math.round(latest.tsb - prev.tsb) : null,
  };
}

function getMonthlyStats(activities: ActivityType[]) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth = activities.filter((a) => {
    const d = new Date(a.start_date ?? a.date);
    return d >= startOfMonth;
  });
  const totalDistance = thisMonth.reduce((sum, a) => sum + (a.distance ?? 0), 0);
  return { count: thisMonth.length, totalDistance };
}

// ─── main component ──────────────────────────────────────────────────────────

export function ModernDashboard() {
  const { user } = useAuthStore();
  const { readiness, recommendation, pmcData, recentActivities, isLoading } = useDashboardStore();

  const pmc = getPmcStats(pmcData);
  const monthly = getMonthlyStats(recentActivities);

  // Greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const firstName = user?.name?.split(' ')[0] ?? 'Athlète';

  // Skeleton loader
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-64 bg-slate-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {greeting}, {firstName} 👋
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Activités ce mois"
          value={String(monthly.count)}
          subtitle="depuis le 1er du mois"
          icon={<Activity className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-50"
          trend={null}
        />
        <StatCard
          title="Distance totale"
          value={monthly.totalDistance > 0 ? formatDistance(monthly.totalDistance) : '—'}
          subtitle="ce mois-ci"
          icon={<TrendingUp className="w-5 h-5 text-green-600" />}
          iconBg="bg-green-50"
          trend={null}
        />
        <StatCard
          title="CTL (Forme)"
          value={pmc ? String(pmc.ctl) : '—'}
          subtitle="charge chronique"
          icon={<BarChart3 className="w-5 h-5 text-violet-600" />}
          iconBg="bg-violet-50"
          trend={pmc?.ctlTrend ?? null}
        />
        <StatCard
          title="TSB (Fraîcheur)"
          value={pmc ? String(pmc.tsb) : '—'}
          subtitle={
            pmc
              ? pmc.tsb > 5
                ? 'Bien reposé'
                : pmc.tsb < -10
                ? 'Fatigué'
                : 'Équilibré'
              : 'données PMC'
          }
          icon={
            pmc && pmc.tsb < -10 ? (
              <TrendingDown className="w-5 h-5 text-amber-600" />
            ) : (
              <TrendingUp className="w-5 h-5 text-amber-600" />
            )
          }
          iconBg="bg-amber-50"
          trend={pmc?.tsbTrend ?? null}
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activities */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">Activités récentes</h3>
            <Link
              href="/app/activities"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Voir tout
            </Link>
          </div>

          <div className="p-2">
            {recentActivities.length > 0 ? (
              recentActivities.slice(0, 5).map((activity) => (
                <ActivityRow key={activity.id} activity={activity} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                  <Clock className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">Aucune activité récente</p>
                <p className="text-xs text-slate-400 mt-1">
                  Synchronisez vos services pour voir vos activités
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-5">
          {/* Readiness */}
          <ReadinessCard readiness={readiness} isLoading={isLoading} />

          {/* Recommendation */}
          {recommendation && (
            <RecommendationCard recommendation={recommendation} isLoading={isLoading} />
          )}

          {/* PMC summary if no recommendation */}
          {!recommendation && pmc && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Métriques PMC</h3>
              <div className="space-y-3">
                {[
                  { label: 'CTL — Forme', value: pmc.ctl, color: 'bg-blue-500' },
                  { label: 'ATL — Fatigue', value: pmc.atl, color: 'bg-red-400' },
                  {
                    label: 'TSB — Fraîcheur',
                    value: Math.abs(pmc.tsb),
                    color: pmc.tsb >= 0 ? 'bg-green-500' : 'bg-amber-400',
                  },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">{m.label}</span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {m.label.startsWith('TSB') && pmc.tsb < 0 ? '-' : ''}
                        {m.value}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${m.color}`}
                        style={{ width: `${Math.min(100, (m.value / 150) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
