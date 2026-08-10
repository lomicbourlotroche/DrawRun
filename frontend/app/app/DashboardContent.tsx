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
import { OvertrainingAlert, ModernDashboard } from '@/components/features/dashboard';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Activity, Heart, TrendingUp, Zap } from '@/components/ui/icons';
import Link from 'next/link';
import { Card, GradientBadge, PrimaryButton } from '@/components/ui';
import dynamic from 'next/dynamic';

const OnboardingWizard = dynamic(() => import('@/components/features/onboarding/OnboardingWizard'), { ssr: false });

export default function DashboardContent() {
  const { t } = useLanguage();
  const { isLoading, setReadiness, setPmcData, setRecentActivities, setLoading } = useDashboardStore();
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
      } catch {
        /* onboarding optionnel */
      }
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
        const readinessWithScore: Readiness = {
          score: readinessResult.readiness ?? (typeof readinessResult === 'number' ? readinessResult : 70),
          status: (readinessResult.status as 'excellent' | 'good' | 'fair' | 'poor') || 'good',
          factors: {
            hrv: readinessResult.factors?.hrv ?? (readinessResult.factors?.hrvValue ? 80 : 60),
            sleep: readinessResult.factors?.sleep ?? (readinessResult.factors?.sleepHours ? 80 : 70),
            restingHR: readinessResult.factors?.restingHR ?? 60,
            stress: readinessResult.factors?.stress ?? 30,
          },
        };
        setReadiness(readinessWithScore);
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
      <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
        {onboardingChecked && showOnboarding && <OnboardingWizard onComplete={() => setShowOnboarding(false)} />}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{t.dashboard.title}</h1>
            <p className="text-muted mt-1.5">{t.dashboard.subtitle}</p>
          </div>
          <GradientBadge variant="primary" icon={Zap} dot>
            Prêt à commencer
          </GradientBadge>
        </div>

        <Card padding="xl" className="text-center">
          <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Activity className="w-10 h-10 text-primary" />
          </div>

          <h2 className="text-xl font-bold text-foreground mb-2 tracking-tight">Aucune activité</h2>
          <p className="text-muted mb-8 max-w-md mx-auto leading-relaxed">
            Connectez Strava ou Garmin pour importer vos activités et voir vos statistiques. Vos données seront
            automatiquement synchronisées.
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
        </Card>

        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { title: 'Synchronisation auto', desc: 'Vos activités se mettent à jour automatiquement' },
            { title: 'Analyse avancée', desc: 'VDOT, PMC et métriques scientifiques' },
            { title: 'Coaching adaptatif', desc: 'Plans personnalisés selon vos objectifs' },
          ].map((tip, i) => (
            <div
              key={i}
              className="bg-surface/70 backdrop-blur-sm border border-border rounded-xl p-4 shadow-sm transition-all duration-200 ease-smooth hover:shadow-md hover:border-primary/20"
            >
              <h3 className="font-semibold text-foreground text-sm mb-1">{tip.title}</h3>
              <p className="text-xs text-muted">{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="fixed inset-0 bg-gradient-to-b from-muted/5 to-background pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {onboardingChecked && showOnboarding && <OnboardingWizard onComplete={() => setShowOnboarding(false)} />}
        <OvertrainingAlert />
        <ModernDashboard />
      </div>
    </div>
  );
}
