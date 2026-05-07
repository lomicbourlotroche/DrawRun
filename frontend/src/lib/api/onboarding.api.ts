/**
 * ============================================================
 * ONBOARDING API - Endpoints onboarding et préférences
 * ============================================================
 * 
 * Ce fichier contient tous les endpoints d'onboarding :
 * - Status et étapes
 * - Préférences utilisateur
 * 
 * @module lib/api/onboarding.api
 */

import { client } from './client';
import type { UpdatePreferencesParams } from './types';

export const onboardingApi = {
  /**
   * Récupère le statut de l'onboarding
   */
  getOnboardingStatus(): Promise<{
    completed: boolean;
    steps: {
      profile: { completed: boolean; required: boolean };
      vma: { completed: boolean; required: boolean };
      fcm: { completed: boolean; required: boolean };
      plan: { completed: boolean; required: boolean };
      first_activity: { completed: boolean; required: boolean };
      sync: { completed: boolean; required: boolean };
    };
  }> {
    return client.request('/api/onboarding/status');
  },

  /**
   * Complète une étape d'onboarding
   */
  completeOnboardingStep(step: string): Promise<{ success: boolean }> {
    return client.request('/api/onboarding/step', {
      method: 'POST',
      body: JSON.stringify({ step }),
    });
  },

  /**
   * Récupère les préférences utilisateur
   */
  getPreferences(): Promise<{
    dashboard_widgets: unknown[];
    onboarding_completed: boolean;
    notification_settings: unknown;
    theme: string;
    units: string;
  }> {
    return client.request('/api/preferences');
  },

  /**
   * Met à jour les préférences
   */
  updatePreferences(params: UpdatePreferencesParams): Promise<{ success: boolean }> {
    return client.request('/api/preferences', {
      method: 'PUT',
      body: JSON.stringify(params),
    });
  },

  /**
   * Met à jour les widgets du dashboard
   */
  updateWidgets(widgets: unknown[]): Promise<{ success: boolean }> {
    return client.request('/api/preferences/widgets', {
      method: 'POST',
      body: JSON.stringify({ widgets }),
    });
  },
};
