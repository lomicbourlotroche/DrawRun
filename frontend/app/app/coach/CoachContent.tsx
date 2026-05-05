/**
 * CoachContent - Contenu de la page Coach
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Skeleton } from '@/components/ui';
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
      if (profileData) setProfile(profileData);
    }).finally(() => setIsLoading(false));
  }, []);

  const intensityStyles: Record<string, { bg: string; border: string; icon: string }> = {
    green: { bg: 'bg-green-500/20', border: 'border-l-green-500', icon: 'text-green-400' },
    blue: { bg: 'bg-blue-500/20', border: 'border-l-blue-500', icon: 'text-blue-400' },
    orange: { bg: 'bg-orange-500/20', border: 'border-l-orange-500', icon: 'text-orange-400' },
    red: { bg: 'bg-red-500/20', border: 'border-l-red-500', icon: 'text-red-400' },
    gray: { bg: 'bg-gray-500/20', border: 'border-l-gray-500', icon: 'text-gray-400' },
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
        <Card className={`border-l-4 ${style.border} bg-card/80`}>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${style.bg}`}>
                <Zap className={`w-6 h-6 ${style.icon}`} />
              </div>
              <div className="flex-1">
                <Badge className={`${style.bg} ${style.icon}`}>
                  {rec.type}
                </Badge>
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
              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-border">
                {rec.metrics.weeklyKm !== undefined && (
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold text-foreground">{rec.metrics.weeklyKm}</p>
                    <p className="text-xs text-muted">km/sem</p>
                  </div>
                )}
                {rec.metrics.vdot !== undefined && (
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold text-green-400">{rec.metrics.vdot}</p>
                    <p className="text-xs text-muted">VDOT</p>
                  </div>
                )}
                {rec.metrics.streak !== undefined && (
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold text-orange-400">{rec.metrics.streak}</p>
                    <p className="text-xs text-muted">Série</p>
                  </div>
                )}
                {rec.metrics.activitiesCount !== undefined && (
                  <div className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold text-blue-400">{rec.metrics.activitiesCount}</p>
                    <p className="text-xs text-muted">Séances</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Zap className="w-12 h-12 mx-auto mb-4 text-muted opacity-30" />
            <p className="text-muted">Aucune recommandation</p>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gauge className="w-4 h-4 text-primary" />
            Profil actuel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
              <p className="text-2xl font-bold text-blue-400">
                {profile?.vdot != null ? String(profile.vdot) : '-'}
              </p>
              <p className="text-xs text-muted">VDOT</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
              <p className="text-2xl font-bold text-red-400">
                {profile?.fcm != null ? String(profile.fcm) : '-'}
              </p>
              <p className="text-xs text-muted">FCM</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
              <p className="text-2xl font-bold text-green-400">
                {profile?.weeklyKm != null ? `${profile.weeklyKm}km` : '-'}
              </p>
              <p className="text-xs text-muted">Volume/sem</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-center">
              <p className="text-2xl font-bold text-orange-400">
                {profile?.pace != null ? String(profile.pace) : '-'}
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
    <Card>
      <CardContent className="p-8 text-center">
        <Target className="w-12 h-12 mx-auto mb-4 text-muted opacity-30" />
        <p className="text-muted">{message}</p>
        <p className="text-xs text-muted mt-2">Créez un plan dans l&apos;onglet Plan pour commencer.</p>
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
      // GET /api/coach/plan returns { plan, sessions, planId } or null
      const data = await api.getActivePlan() as { plan?: Record<string, unknown>; planId?: number } | null;
      if (data?.plan && data.planId) {
        // Fetch full plan structure via GET /api/coach/plan/:id
        const fullPlan = await api.getPlan(data.planId).catch(() => null);
        setActivePlan((fullPlan as unknown as TrainingPlan) ?? null);
      } else {
        setActivePlan(null);
      }
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
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
