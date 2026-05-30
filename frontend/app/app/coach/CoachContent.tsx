/**
 * CoachContent - Contenu de la page Coach
 * Corrigé : utilisation de Card unifié, tokens métiers, accessibilité
 */

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, GradientBadge, Skeleton, NavTabs } from '@/components/ui';
import { api } from '@/lib/api';
import type { Recommendation, TrainingPlan } from '@/types';
import {
  Zap, TrendingUp,
  Brain, Calendar, Gauge, Trophy, Flame, Target,
} from 'lucide-react';
import AdaptivePlanWizard from '@/components/features/coach/AdaptivePlanWizard';
// TrainingPlanCard available for future use
// import { TrainingPlanCard } from '@/components/features/coach/TrainingPlanCard';
import { GanttChart } from '@/components/features/coach/GanttChart';
import ProgressChart from '@/components/features/coach/ProgressChart';
import GamificationWidget from '@/components/features/coach/GamificationWidget';

// ============================================================================
// TODAY TAB
// ============================================================================

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

  // Utilisation des tokens métiers pour les couleurs d'intensité
  const intensityStyles: Record<string, { bg: string; border: string; icon: string }> = {
    green: { bg: 'bg-success/20', border: 'border-l-success', icon: 'text-success/80' },
    blue: { bg: 'bg-primary/20', border: 'border-l-primary', icon: 'text-primary/80' },
    orange: { bg: 'bg-peak/20', border: 'border-l-peak', icon: 'text-peak/80' },
    red: { bg: 'bg-danger/20', border: 'border-l-danger', icon: 'text-danger/80' },
    gray: { bg: 'bg-border/20', border: 'border-l-border', icon: 'text-muted' },
  };

  const style = intensityStyles[rec?.intensityColor || 'blue'];

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
      ) : rec ? (
        <Card variant="glass" className={`border-l-4 ${style.border}`}>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${style.bg}`}>
                <Zap className={`w-6 h-6 ${style.icon}`} />
              </div>
              <div className="flex-1">
                <GradientBadge variant="primary" size="sm" className={`${style.bg} ${style.icon}`}>
                  {rec.type}
                </GradientBadge>
                <h2 className="text-xl font-bold mt-2">{rec.title}</h2>
                {rec.subtitle && (
                  <p className="text-sm text-muted">{rec.subtitle}</p>
                )}
              </div>
            </div>

            {rec.description && (
              <p className="text-sm text-foreground/80 leading-relaxed">
                {rec.description}
              </p>
            )}

            {rec.structure && rec.structure.length > 0 && (
              <div className="space-y-2 pt-2">
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-border">
                {rec.metrics.weeklyKm !== undefined && (
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold text-foreground">{rec.metrics.weeklyKm}</p>
                    <p className="text-xs text-muted">km/sem</p>
                  </div>
                )}
                {rec.metrics.vdot !== undefined && (
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold text-success/80">{rec.metrics.vdot}</p>
                    <p className="text-xs text-muted">VDOT</p>
                  </div>
                )}
                {rec.metrics.streak !== undefined && (
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold text-peak/80">{rec.metrics.streak}</p>
                    <p className="text-xs text-muted">Serie</p>
                  </div>
                )}
                {rec.metrics.activitiesCount !== undefined && (
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold text-primary/80">{rec.metrics.activitiesCount}</p>
                    <p className="text-xs text-muted">Seances</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card variant="glass" padding="lg">
          <CardContent className="text-center">
            <Zap className="w-12 h-12 mx-auto mb-4 text-muted opacity-30" />
            <p className="text-muted">Aucune recommandation</p>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gauge className="w-4 h-4 text-primary" />
            Profil actuel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
              <p className="text-2xl font-bold text-primary/80">
                {profile?.vdot !== null && profile?.vdot !== undefined ? String(profile.vdot) : '-'}
              </p>
              <p className="text-xs text-muted">VDOT</p>
            </div>
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-center">
              <p className="text-2xl font-bold text-danger/80">
                {profile?.fcm !== null && profile?.fcm !== undefined ? String(profile.fcm) : '-'}
              </p>
              <p className="text-xs text-muted">FCM</p>
            </div>
            <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-center">
              <p className="text-2xl font-bold text-success/80">
                {profile?.weeklyKm !== null && profile?.weeklyKm !== undefined ? `${profile.weeklyKm}km` : '-'}
              </p>
              <p className="text-xs text-muted">Volume/sem</p>
            </div>
            <div className="p-3 rounded-lg bg-peak/10 border border-peak/20 text-center">
              <p className="text-2xl font-bold text-peak/80">
                {profile?.pace !== null && profile?.pace !== undefined ? String(profile.pace) : '-'}
              </p>
              <p className="text-xs text-muted">Allure</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// NO PLAN PLACEHOLDER
// ============================================================================

function NoPlanMessage({ message }: { message: string }) {
  return (
    <Card variant="glass">
      <CardContent className="p-8 text-center">
        <Target className="w-12 h-12 mx-auto mb-4 text-muted opacity-30" />
        <p className="text-muted">{message}</p>
        <p className="text-xs text-muted mt-2">Creez un plan dans l&apos;onglet Plan pour commencer.</p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CoachContent() {
  const [activeTab, setActiveTab] = useState<'today' | 'plan' | 'progress' | 'achievements'>('today');
  const [activePlan, setActivePlan] = useState<TrainingPlan | null>(null);
  const [isPlanLoading, setIsPlanLoading] = useState(true);

  const loadActivePlan = useCallback(async () => {
    setIsPlanLoading(true);
    try {
      // GET /api/coach/plan now returns { plan, sessions, planId, fullPlan }
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
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
          <Brain className="w-6 h-6 text-primary-500" />
          Coach DrawRun
        </h1>
        <p className="text-neutral-500 mt-1.5">Entrainement personnalise base sur vos donnees</p>
      </div>

      <NavTabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as typeof tabs[number]['id'])} />

      {/* Content */}
      {activeTab === 'today' && <TodayTab />}

      {activeTab === 'plan' && (
        isPlanLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
        ) : activePlan ? (
          <GanttChart plan={activePlan} />
        ) : (
          <AdaptivePlanWizard onComplete={handlePlanCreated} />
        )
      )}

      {activeTab === 'progress' && (
        isPlanLoading ? (
          <Skeleton className="h-64" />
        ) : activePlan ? (
          <ProgressChart planId={Number(activePlan.id)} />
        ) : (
          <NoPlanMessage message="Aucune progression a afficher." />
        )
      )}

      {activeTab === 'achievements' && (
        isPlanLoading ? (
          <Skeleton className="h-64" />
        ) : activePlan ? (
          <GamificationWidget planId={Number(activePlan.id)} />
        ) : (
          <NoPlanMessage message="Aucune realisation a afficher." />
        )
      )}
    </div>
  );
}
