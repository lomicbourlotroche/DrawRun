'use client';

import React from 'react';
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
  ChevronRight,
  Flame,
} from 'lucide-react';
import { useAuthStore, useDashboardStore } from '@/stores';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { ReadinessCard } from './ReadinessCard';
import { RecommendationCard } from './RecommendationCard';
import { InjuryRiskCard } from './InjuryRiskCard';
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

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
  trend?: number | null;
}

function StatCard({ title, value, subtitle, icon, accentColor, trend }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden" padding="md">
      <div className={`absolute top-0 left-0 w-full h-1 ${accentColor}`} />
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accentColor} text-white`}>
          {icon}
        </div>
        {trend !== null && trend !== undefined && (
          <div
            className={`flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full ${
              trend > 0
                ? 'bg-success/10 text-success'
                : trend < 0
                ? 'bg-danger/10 text-danger'
                : 'bg-neutral-100 text-neutral-500'
            }`}
          >
            {trend > 0 ? <ArrowUp className="w-3 h-3" /> : trend < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {Math.abs(trend)}
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-foreground tabular-nums tracking-tight">{value}</p>
      <p className="text-sm font-medium text-foreground mt-1">{title}</p>
      <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>
    </Card>
  );
}

interface ActivityRowProps {
  activity: ActivityType;
}

function ActivityRow({ activity }: ActivityRowProps) {
  const dateStr = activity.start_date ?? activity.date;
  const durationS = activity.moving_time ?? activity.elapsed_time ?? 0;
  const elevation = activity.total_elevation_gain;

  return (
    <Link
      href={`/app/activities/${activity.id}`}
      className="flex items-center justify-between p-3.5 rounded-xl hover:bg-neutral-50 transition-all duration-200 group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-500 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
          {getActivityIcon(activity.type)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {activity.title ?? 'Activité'}
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">
            {dateStr ? formatDate(dateStr) : '—'}
            {durationS > 0 && ` · ${formatDuration(durationS)}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
        {(activity.distance ?? 0) > 0 && (
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground tabular-nums">
              {formatDistance(activity.distance!)}
            </p>
            {elevation !== null && elevation !== undefined && elevation > 0 && (
              <p className="text-xs text-neutral-500 flex items-center justify-end gap-0.5">
                <Mountain className="w-3 h-3" />
                {Math.round(elevation)} m
              </p>
            )}
          </div>
        )}
        <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-primary-500 transition-colors" />
      </div>
    </Link>
  );
}

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
  const totalDuration = thisMonth.reduce((sum, a) => sum + (a.moving_time ?? a.elapsed_time ?? 0), 0);
  return { count: thisMonth.length, totalDistance, totalDuration };
}

export function ModernDashboard() {
  const { user } = useAuthStore();
  const { readiness, recommendation, pmcData, recentActivities, isLoading } = useDashboardStore();

  const pmc = getPmcStats(pmcData);
  const monthly = getMonthlyStats(recentActivities);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const firstName = user?.name?.split(' ')[0] ?? 'Athlète';

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-neutral-100 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-neutral-100 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 h-72 bg-neutral-100 rounded-2xl" />
          <div className="lg:col-span-5 space-y-4">
            <div className="h-36 bg-neutral-100 rounded-2xl" />
            <div className="h-36 bg-neutral-100 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{greeting}, {firstName}</h1>
          <p className="text-sm text-muted mt-1">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted">
          <span className="flex items-center gap-1.5"><Flame className="w-4 h-4 text-primary-500" />{monthly.count} activités</span>
          {monthly.totalDistance > 0 && (
            <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-success" />{formatDistance(monthly.totalDistance)}</span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Activités"
          value={String(monthly.count)}
          subtitle="ce mois-ci"
          icon={<Activity className="w-5 h-5 text-white" />}
          accentColor="bg-primary-500"
          trend={null}
        />
        <StatCard
          title="Distance"
          value={monthly.totalDistance > 0 ? formatDistance(monthly.totalDistance) : '—'}
          subtitle="ce mois-ci"
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          accentColor="bg-success"
          trend={null}
        />
        <StatCard
          title="CTL"
          value={pmc ? String(pmc.ctl) : '—'}
          subtitle="charge chronique"
          icon={<BarChart3 className="w-5 h-5 text-white" />}
          accentColor="bg-secondary"
          trend={pmc?.ctlTrend ?? null}
        />
        <StatCard
          title="TSB"
          value={pmc ? String(pmc.tsb) : '—'}
          subtitle={pmc ? (pmc.tsb > 5 ? 'Bien reposé' : pmc.tsb < -10 ? 'Fatigué' : 'Équilibré') : 'données PMC'}
          icon={pmc && pmc.tsb < -10 ? <TrendingDown className="w-5 h-5 text-white" /> : <TrendingUp className="w-5 h-5 text-white" />}
          accentColor={pmc && pmc.tsb > 5 ? 'bg-success' : pmc && pmc.tsb < -10 ? 'bg-warning' : 'bg-primary-500'}
          trend={pmc?.tsbTrend ?? null}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Recent Activities */}
        <div className="lg:col-span-7">
          <Card padding="none">
            <CardHeader className="px-5 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Activités récentes</CardTitle>
                <Link
                  href="/app/activities"
                  className="text-sm font-medium text-primary hover:text-primary-600 transition-colors flex items-center gap-1"
                >
                  Voir tout
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              {recentActivities.length > 0 ? (
                recentActivities.slice(0, 5).map((activity) => (
                  <ActivityRow key={activity.id} activity={activity} />
                ))
              ) : (
                <div className="flex flex-col items-center py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-50 flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6 text-neutral-400" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Aucune activité récente</p>
                  <p className="text-xs text-neutral-500 mt-1">Synchronisez vos services pour voir vos activités</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="lg:col-span-5 space-y-4">
          <ReadinessCard readiness={readiness} isLoading={isLoading} />

          {pmcData.length > 0 && (
            <InjuryRiskCard
              acwr={pmcData[pmcData.length - 1].acwr || (pmcData[pmcData.length - 1].atl / (pmcData[pmcData.length - 1].ctl || 1))}
              trend={pmcData.length > 7 ? (pmcData[pmcData.length - 1].acwr! > pmcData[pmcData.length - 8].acwr! ? 'up' : 'down') : 'stable'}
            />
          )}

          {recommendation && (
            <RecommendationCard recommendation={recommendation} isLoading={isLoading} />
          )}

          {!recommendation && pmc && (
            <Card padding="none">
              <CardHeader className="px-5 py-4 border-b border-border">
                <CardTitle className="text-sm">Métriques PMC</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                {[
                  { label: 'CTL — Forme', value: pmc.ctl, color: 'bg-primary-500', max: 150 },
                  { label: 'ATL — Fatigue', value: pmc.atl, color: 'bg-danger', max: 150 },
                  { label: 'TSB — Fraîcheur', value: Math.abs(pmc.tsb), color: pmc.tsb >= 0 ? 'bg-success' : 'bg-warning', max: 50 },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-neutral-500 font-medium">{m.label}</span>
                      <span className="font-semibold text-foreground tabular-nums">
                        {m.label.startsWith('TSB') && pmc.tsb < 0 ? '-' : ''}{m.value}
                      </span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${m.color} transition-all duration-500`} style={{ width: `${Math.min(100, (m.value / m.max) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
