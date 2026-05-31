'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import type { Recommendation, TrainingPlan } from '@/types';
import {
  Zap, TrendingUp,
  Brain, Calendar, Gauge, Trophy, Flame, Target,
} from '@/components/ui/icons';
import AdaptivePlanWizard from '@/components/features/coach/AdaptivePlanWizard';
import { GanttChart } from '@/components/features/coach/GanttChart';
import ProgressChart from '@/components/features/coach/ProgressChart';
import GamificationWidget from '@/components/features/coach/GamificationWidget';

function TodayTab() {
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    Promise.all([
      api.getRecommendations().catch(() => null),
      api.getCoachProfile().catch(() => null),
    ]).then(([recData, profileData]) => {
      if (recData) setRec(recData);
      if (profileData) setProfile(profileData as unknown as Record<string, unknown>);
    }).finally(() => setIsLoading(false));
  }, []);

  const intensityStyles: Record<string, { bg: string; border: string; icon: string }> = {
    green: { bg: 'bg-success/20', border: 'border-l-success', icon: 'text-success' },
    blue: { bg: 'bg-primary/20', border: 'border-l-primary', icon: 'text-primary' },
    orange: { bg: 'bg-peak/20', border: 'border-l-peak', icon: 'text-peak' },
    red: { bg: 'bg-danger/20', border: 'border-l-danger', icon: 'text-danger' },
    gray: { bg: 'bg-border/20', border: 'border-l-border', icon: 'text-muted' },
  };

  const style = intensityStyles[rec?.intensityColor || 'blue'];

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-48 rounded-xl bg-surface/50 border border-border/50 animate-pulse" />
          <div className="h-32 rounded-xl bg-surface/50 border border-border/50 animate-pulse" />
        </div>
      ) : rec ? (
        <div className="animate-slide-up opacity-0 fill-mode-forwards delay-[0ms]">
          <Card variant="glass" accent="primary" className={`relative overflow-hidden group`}>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${style.bg}`}>
                  <Zap className={`w-6 h-6 ${style.icon}`} />
                </div>
                <div className="flex-1">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.icon}`}>
                    {rec.type}
                  </span>
                  <h2 className="text-xl font-bold mt-2">{rec.title}</h2>
                  {rec.subtitle && (
                    <p className="text-sm text-muted">{rec.subtitle}</p>
                  )}
                </div>
              </div>

              {rec.description && (
                <p className="text-sm text-foreground/80 leading-relaxed mt-3">
                  {rec.description}
                </p>
              )}

              {rec.structure && rec.structure.length > 0 && (
                <div className="space-y-2 pt-3">
                  {rec.structure.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-foreground/80">{step}</span>
                    </div>
                  ))}
                </div>
              )}

              {rec.metrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-border/50 mt-4">
                  {rec.metrics.weeklyKm !== undefined && (
                    <div className="text-center p-2 rounded-lg bg-surface">
                      <p className="text-lg font-bold text-foreground">{rec.metrics.weeklyKm}</p>
                      <p className="text-xs text-muted">km/sem</p>
                    </div>
                  )}
                  {rec.metrics.vdot !== undefined && (
                    <div className="text-center p-2 rounded-lg bg-surface">
                      <p className="text-lg font-bold text-success">{rec.metrics.vdot}</p>
                      <p className="text-xs text-muted">VDOT</p>
                    </div>
                  )}
                  {rec.metrics.streak !== undefined && (
                    <div className="text-center p-2 rounded-lg bg-surface">
                      <p className="text-lg font-bold text-peak">{rec.metrics.streak}</p>
                      <p className="text-xs text-muted">Serie</p>
                    </div>
                  )}
                  {rec.metrics.activitiesCount !== undefined && (
                    <div className="text-center p-2 rounded-lg bg-surface">
                      <p className="text-lg font-bold text-primary">{rec.metrics.activitiesCount}</p>
                      <p className="text-xs text-muted">Seances</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="animate-slide-up opacity-0 fill-mode-forwards delay-[0ms]">
          <Card variant="glass" accent="primary" padding="lg">
            <CardContent className="text-center">
              <Zap className="w-12 h-12 mx-auto mb-4 text-muted opacity-30" />
              <p className="text-muted">Aucune recommandation</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="animate-slide-up opacity-0 fill-mode-forwards delay-[100ms]">
        <Card variant="glass" accent="success">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gauge className="w-4 h-4 text-primary" />
              Profil actuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
                <p className="text-2xl font-bold text-primary">
                  {profile?.vdot !== null && profile?.vdot !== undefined ? String(profile.vdot) : '-'}
                </p>
                <p className="text-xs text-muted">VDOT</p>
              </div>
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-center">
                <p className="text-2xl font-bold text-danger">
                  {profile?.fcm !== null && profile?.fcm !== undefined ? String(profile.fcm) : '-'}
                </p>
                <p className="text-xs text-muted">FCM</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-center">
                <p className="text-2xl font-bold text-success">
                  {profile?.weeklyKm !== null && profile?.weeklyKm !== undefined ? `${profile.weeklyKm}km` : '-'}
                </p>
                <p className="text-xs text-muted">Volume/sem</p>
              </div>
              <div className="p-3 rounded-lg bg-peak/10 border border-peak/20 text-center">
                <p className="text-2xl font-bold text-peak">
                  {profile?.pace !== null && profile?.pace !== undefined ? String(profile.pace) : '-'}
                </p>
                <p className="text-xs text-muted">Allure</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function NoPlanMessage({ message }: { message: string }) {
  return (
    <Card variant="glass" accent="warning" padding="lg">
      <CardContent className="p-8 text-center">
        <Target className="w-12 h-12 mx-auto mb-4 text-muted opacity-30" />
        <p className="text-muted">{message}</p>
        <p className="text-xs text-muted mt-2">Creez un plan dans l&apos;onglet Plan pour commencer.</p>
      </CardContent>
    </Card>
  );
}

export default function CoachContent() {
  const [activeTab, setActiveTab] = useState<'today' | 'plan' | 'progress' | 'achievements'>('today');
  const [activePlan, setActivePlan] = useState<TrainingPlan | null>(null);
  const [isPlanLoading, setIsPlanLoading] = useState(true);

  const loadActivePlan = useCallback(async () => {
    setIsPlanLoading(true);
    try {
      const data = await api.getActivePlan();
      setActivePlan((data?.fullPlan ?? null) as TrainingPlan | null);
    } catch {
      setActivePlan(null);
    } finally {
      setIsPlanLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivePlan();
  }, [loadActivePlan]);

  const handlePlanCreated = useCallback(async () => {
    await loadActivePlan();
    setActiveTab('plan');
  }, [loadActivePlan]);

  const tabs = useMemo(() => [
    { id: 'today', label: "Aujourd'hui", icon: <Flame className="w-4 h-4" /> },
    { id: 'plan', label: 'Plan', icon: <Calendar className="w-4 h-4" /> },
    { id: 'progress', label: 'Progression', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'achievements', label: 'Realisations', icon: <Trophy className="w-4 h-4" /> },
  ] as const, []);

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="animate-slide-up opacity-0 fill-mode-forwards delay-[0ms]">
        <Card variant="glass" accent="primary" className="relative overflow-hidden">
          <CardContent className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Brain className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Coach</h1>
              <p className="text-muted mt-1">Entrainement personnalise base sur vos donnees</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="animate-slide-up opacity-0 fill-mode-forwards delay-[100ms]">
        <div className="flex items-center gap-1 overflow-x-auto" role="tablist">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id as typeof tabs[number]['id'])}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted hover:text-foreground hover:bg-muted/20'
              )}
            >
              <span className="w-4 h-4">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'today' && <TodayTab />}

      {activeTab === 'plan' && (
        <div className="animate-slide-up opacity-0 fill-mode-forwards delay-[200ms]">
          {isPlanLoading ? (
            <div className="space-y-4">
              <div className="h-48 rounded-xl bg-surface/50 border border-border/50 animate-pulse" />
              <div className="h-32 rounded-xl bg-surface/50 border border-border/50 animate-pulse" />
            </div>
          ) : activePlan ? (
            <GanttChart plan={activePlan} />
          ) : (
            <AdaptivePlanWizard onComplete={handlePlanCreated} />
          )}
        </div>
      )}

      {activeTab === 'progress' && (
        <div className="animate-slide-up opacity-0 fill-mode-forwards delay-[200ms]">
          {isPlanLoading ? (
            <div className="h-64 rounded-xl bg-surface/50 border border-border/50 animate-pulse" />
          ) : activePlan ? (
            <ProgressChart planId={Number(activePlan.id)} />
          ) : (
            <NoPlanMessage message="Aucune progression a afficher." />
          )}
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="animate-slide-up opacity-0 fill-mode-forwards delay-[200ms]">
          {isPlanLoading ? (
            <div className="h-64 rounded-xl bg-surface/50 border border-border/50 animate-pulse" />
          ) : activePlan ? (
            <GamificationWidget planId={Number(activePlan.id)} />
          ) : (
            <NoPlanMessage message="Aucune realisation a afficher." />
          )}
        </div>
      )}
    </div>
  );
}
