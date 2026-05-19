/* eslint-disable eqeqeq */
/**
 * CoachContent - Contenu de la page Coach
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent, GradientBadge, Skeleton } from '@/components/ui';
import { api } from '@/lib/api';
import type { Recommendation, TrainingPlan } from '@/types';
import {
  Zap, TrendingUp,
  Brain, Calendar,
  Gauge, Trophy, Flame, Target,
} from 'lucide-react';
import AdaptivePlanWizard from '@/components/features/coach/AdaptivePlanWizard';
import { TrainingPlanCard } from '@/components/features/coach/TrainingPlanCard';
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

  const intensityStyles: Record<string, { bg: string; border: string; icon: string }> = {
    green: { bg: 'bg-success/20', border: 'border-l-success', icon: 'text-success/80' },
    blue: { bg: 'bg-primary/20', border: 'border-l-primary', icon: 'text-primary/80' },
    orange: { bg: 'bg-peak/20', border: 'border-l-peak', icon: 'text-peak/80' },
    red: { bg: 'bg-danger/20', border: 'border-l-danger', icon: 'text-danger/80' },
    gray: { bg: 'bg-neutral-500/20', border: 'border-l-neutral-500', icon: 'text-neutral-400' },
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
        <GlassCard className={`border-l-4 ${style.border}`} padding="lg">
          <GlassCardContent>
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
                    <p className="text-xs text-muted">Série</p>
                  </div>
                )}
                {rec.metrics.activitiesCount !== undefined && (
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold text-primary/80">{rec.metrics.activitiesCount}</p>
                    <p className="text-xs text-muted">Séances</p>
                  </div>
                )}
              </div>
            )}
          </GlassCardContent>
         </GlassCard>
       ) : (
          <GlassCard padding="lg">
            <GlassCardContent className="text-center">
             <Zap className="w-12 h-12 mx-auto mb-4 text-muted opacity-30" />
             <p className="text-muted">Aucune recommandation</p>
           </GlassCardContent>
         </GlassCard>
       )}

      {/* Quick Stats */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="text-base flex items-center gap-2">
            <Gauge className="w-4 h-4 text-primary" />
            Profil actuel
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center">
              <p className="text-2xl font-bold text-primary/80">
                {profile?.vdot != null ? String(profile.vdot) : '-'}
              </p>
              <p className="text-xs text-muted">VDOT</p>
            </div>
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-center">
              <p className="text-2xl font-bold text-danger/80">
                {profile?.fcm != null ? String(profile.fcm) : '-'}
              </p>
              <p className="text-xs text-muted">FCM</p>
            </div>
            <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-center">
              <p className="text-2xl font-bold text-success/80">
                {profile?.weeklyKm != null ? `${profile.weeklyKm}km` : '-'}
              </p>
              <p className="text-xs text-muted">Volume/sem</p>
            </div>
            <div className="p-3 rounded-lg bg-peak/10 border border-peak/20 text-center">
              <p className="text-2xl font-bold text-peak/80">
                {profile?.pace != null ? String(profile.pace) : '-'}
              </p>
              <p className="text-xs text-muted">Allure</p>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}

// ============================================================================
// NO PLAN PLACEHOLDER
// ============================================================================

function NoPlanMessage({ message }: { message: string }) {
  return (
    <GlassCard>
      <GlassCardContent className="p-8 text-center">
        <Target className="w-12 h-12 mx-auto mb-4 text-muted opacity-30" />
        <p className="text-muted">{message}</p>
        <p className="text-xs text-muted mt-2">Créez un plan dans l&apos;onglet Plan pour commencer.</p>
      </GlassCardContent>
    </GlassCard>
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

  const tabs = [
    { id: 'today', label: "Aujourd'hui", icon: Flame },
    { id: 'plan', label: 'Plan', icon: Calendar },
    { id: 'progress', label: 'Progression', icon: TrendingUp },
    { id: 'achievements', label: 'Réalisations', icon: Trophy },
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
          Coach DrawRun
        </h1>
        <p className="text-muted mt-1">Entraînement personnalisé basé sur vos données</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'text-muted hover:text-foreground hover:bg-muted'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'today' && <TodayTab />}

      {activeTab === 'plan' && (
        isPlanLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
        ) : activePlan ? (
          <TrainingPlanCard plan={activePlan} />
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
          <NoPlanMessage message="Aucune progression à afficher." />
        )
      )}

      {activeTab === 'achievements' && (
        isPlanLoading ? (
          <Skeleton className="h-64" />
        ) : activePlan ? (
          <GamificationWidget planId={Number(activePlan.id)} />
        ) : (
          <NoPlanMessage message="Aucune réalisation à afficher." />
        )
      )}
    </div>
  );
}
