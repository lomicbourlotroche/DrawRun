/**
 * DashboardContent - Contenu du dashboard séparé pour lazy loading
 * 
 * Ce fichier contient la logique métier du dashboard pour permettre
 * le lazy loading et améliorer le temps de chargement initial.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDashboardStore } from '@/stores';
import type { Readiness } from '@/types';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import {
  OvertrainingAlert,
  ModernDashboard,
} from '@/components/features/dashboard';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Activity, Heart, TrendingUp, Zap } from 'lucide-react';
import Link from 'next/link';
import { GlassCard, GradientBadge, PrimaryButton } from '@/components/ui';
import dynamic from 'next/dynamic';

const OnboardingWizard = dynamic(
  () => import('@/components/features/onboarding/OnboardingWizard'),
  { ssr: false }
);

export default function DashboardContent() {
  const { t } = useLanguage();
  const {
    isLoading,
    setReadiness,
    setPmcData,
    setRecentActivities,
    setLoading,
  } = useDashboardStore();
  const [hasData, setHasData] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    
    try {
      // Vérifier si l'onboarding est nécessaire
      try {
        const onboardingStatus = await api.getOnboardingStatus();
        if (onboardingStatus && !onboardingStatus.completed) {
          setShowOnboarding(true);
        }
      } catch { /* onboarding optionnel */ }
      setOnboardingChecked(true);

      const [activities, pmc, _recommendations] = await Promise.allSettled([
        api.getActivities(),
        api.getPmc(),
        api.getRecommendations(),
      ]);

      let readinessData;
      // Get readiness data after PMC data is available
      if (pmc.status === 'fulfilled' && pmc.value) {
        try {
          readinessData = { status: 'fulfilled' as const, value: await api.getAlgoReadiness({ pmc: pmc.value }) };
        } catch (error) {
          readinessData = { status: 'rejected' as const, reason: error };
        }
      } else {
        readinessData = { status: 'rejected' as const, reason: 'No PMC data available' };
      }

      let hasPmcData = false;

      if (activities.status === 'fulfilled' && activities.value) {
        const acts = activities.value.data;
        setRecentActivities(acts.slice(0, 5));
        setHasData(acts.length > 0);
      }

      if (pmc.status === 'fulfilled') {
        const pmcResult = pmc.value;
        if (pmcResult) {
          setPmcData(pmcResult);
          hasPmcData = true;
          // Also mark hasData if we have PMC data even without activities
          if (hasPmcData) {
            setHasData(true);
          }
        }
      }

      // Load readiness data
      if (readinessData.status === 'fulfilled' && readinessData.value) {
        const readinessResult = readinessData.value;
        // Map the API response to the Readiness type
        const readinessWithScore: any = {
          score: readinessResult.readiness ?? (typeof readinessResult === 'number' ? readinessResult : 70),
          status: (readinessResult.status as 'excellent' | 'good' | 'fair' | 'poor') || 'good',
          factors: {
            hrv: readinessResult.factors?.hrv ?? (readinessResult.factors?.hrvValue ? 80 : 60),
            sleep: readinessResult.factors?.sleep ?? (readinessResult.factors?.sleepHours ? 80 : 70),
            restingHR: readinessResult.factors?.restingHR ?? 60,
            stress: readinessResult.factors?.stress ?? 30
          }
        };
        setReadiness(readinessWithScore as Readiness);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.message) {
        logger.error(`Dashboard data load error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [setRecentActivities, setPmcData, setReadiness, setLoading]);

  useEffect(() => {
    if (api.isAuthenticated()) {
      loadDashboardData();
    }
  }, [loadDashboardData]);

  if (!isLoading && !hasData) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Onboarding wizard — affiché si l'utilisateur n'a pas encore configuré son profil */}
        {onboardingChecked && showOnboarding && (
          <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
        )}
        {/* Header avec badge */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{t.dashboard.title}</h1>
            <p className="text-neutral-500 mt-1">{t.dashboard.subtitle}</p>
          </div>
          <GradientBadge variant="primary" icon={Zap} dot>
            Prêt à commencer
          </GradientBadge>
        </div>

        {/* Empty State avec GlassCard */}
        <GlassCard className="p-8 md:p-12 text-center max-w-2xl mx-auto" hover={false}>
          <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-50 border border-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Activity className="w-10 h-10 text-primary-600" />
          </div>
          
          <h2 className="text-xl font-bold text-neutral-900 mb-2 tracking-tight">Aucune activité</h2>
          <p className="text-neutral-500 mb-8 max-w-md mx-auto leading-relaxed">
            Connectez Strava ou Garmin pour importer vos activités et voir vos statistiques. 
            Vos données seront automatiquement synchronisées.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/app/profile">
              <PrimaryButton variant="primary" icon={Heart} size="lg">
                Connecter des services
              </PrimaryButton>
            </Link>
            <Link href="/app/activities/new">
              <PrimaryButton variant="secondary" icon={TrendingUp} size="lg">
                Ajouter manuellement
              </PrimaryButton>
            </Link>
          </div>
        </GlassCard>

        {/* Quick Tips */}
        <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            { title: 'Synchronisation auto', desc: 'Vos activités se mettent à jour automatiquement' },
            { title: 'Analyse avancée', desc: 'VDOT, PMC et métriques scientifiques' },
            { title: 'Coaching adaptatif', desc: 'Plans personnalisés selon vos objectifs' },
          ].map((tip, i) => (
            <GlassCard key={i} padding="md" variant="subtle">
              <h3 className="font-semibold text-neutral-900 text-sm mb-1">{tip.title}</h3>
              <p className="text-xs text-neutral-500">{tip.desc}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-b from-neutral-50 to-white" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,102,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,102,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Onboarding wizard — affiché par-dessus le dashboard si nécessaire */}
        {onboardingChecked && showOnboarding && (
          <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
        )}
        <OvertrainingAlert />
        <ModernDashboard />
      </div>
    </div>
  );
}
