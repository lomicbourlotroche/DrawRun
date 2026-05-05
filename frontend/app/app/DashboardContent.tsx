/**
 * DashboardContent - Contenu du dashboard séparé pour lazy loading
 * 
 * Ce fichier contient la logique métier du dashboard pour permettre
 * le lazy loading et améliorer le temps de chargement initial.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useDashboardStore } from '@/stores';
import { api } from '@/lib/api';
import {
  OvertrainingAlert,
  ModernDashboard,
} from '@/components/features/dashboard';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Activity, Heart } from 'lucide-react';
import Link from 'next/link';

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

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    
    try {
      const [activities, pmc] = await Promise.allSettled([
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

      if (activities.status === 'fulfilled') {
        const acts = activities.value;
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
        const readinessWithScore = {
          score: readinessResult.readiness,
          status: readinessResult.status as 'excellent' | 'good' | 'fair' | 'poor',
          factors: {
            hrv: readinessResult.factors.hrv ? 80 : 60, // Default values if not provided
            sleep: readinessResult.factors.sleep || 7,
            restingHR: 60,
            stress: 3
          }
        };
        setReadiness(readinessWithScore);
      }
    } catch {
      /* silencieux */
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
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.dashboard.title}</h1>
          <p className="text-muted mt-1">{t.dashboard.subtitle}</p>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Activity className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Aucune activité</h2>
          <p className="text-muted mb-6">
            Connectez Strava ou Garmin pour importer vos activités et voir vos statistiques.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/app/profile"
              className="inline-flex items-center gap-2 bg-primary text-white font-medium px-6 py-3 rounded-xl hover:bg-primary/90 transition-all"
            >
              <Heart className="w-5 h-5" />
              Connecter des services
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-4">
      <OvertrainingAlert />
      <ModernDashboard />
    </div>
  );
}
