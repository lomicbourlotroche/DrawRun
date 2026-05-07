/**
 * ============================================================
 * PROFILE API - Endpoints profil utilisateur
 * ============================================================
 * 
 * Ce fichier contient tous les endpoints liés au profil :
 * - Get / Update profile
 * - Extended profile
 * - Athlete info
 * 
 * @module lib/api/profile.api
 */

import { client } from './client';
import type { User, AthleteStats } from '@/types';

export const profileApi = {
  /**
   * Récupère le profil utilisateur
   */
  getProfile(): Promise<User> {
    return client.request('/api/profile');
  },

  /**
   * Met à jour le profil utilisateur
   */
  updateProfile(data: Partial<User>): Promise<{ success: boolean }> {
    return client.request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Upload avatar photo (base64)
   */
   uploadAvatar(imageData: string): Promise<{ success: boolean; avatar_url: string }> {
    return client.request('/api/profile/avatar', {
      method: 'POST',
      body: JSON.stringify({ avatar: imageData }),
    });
  },

  getExtendedProfile(): Promise<Record<string, unknown>> {
    return client.request('/api/profile/extended');
  },

  updateExtendedProfile(data: Record<string, unknown>): Promise<{ success: boolean }> {
    return client.request('/api/profile/extended', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getAthlete(): Promise<Record<string, unknown>> {
    return client.request('/api/profile/athlete');
  },

  getAthleteStats(): Promise<AthleteStats> {
    return client.request('/api/profile/athlete/stats');
  },

};
