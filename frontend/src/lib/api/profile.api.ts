import { client } from './client';

import type { User, AthleteStats } from '@/types';

/**

 * Extended profile data with additional user information

 */

export interface ExtendedProfile {
  id: string;

  userId: string;

  bio?: string;

  location?: string;

  website?: string;

  birthDate?: string;

  height?: number; // in cm

  weight?: number; // in kg

  preferredLanguage?: string;

  preferredUnits?: 'metric' | 'imperial';

  notificationPreferences?: {
    email?: boolean;

    push?: boolean;

    weeklyReport?: boolean;

    achievementNotifications?: boolean;

    socialNotifications?: boolean;
  };

  privacySettings?: {
    profileVisibility?: 'public' | 'friends' | 'private';

    activityVisibility?: 'public' | 'friends' | 'private';

    showLocation?: boolean;

    showAge?: boolean;

    showWeight?: boolean;
  };

  socialLinks?: {
    strava?: string;

    garmin?: string;

    twitter?: string;

    instagram?: string;

    facebook?: string;
  };

  createdAt: string;

  updatedAt: string;
}

/**

 * Athlete information from connected services

 */

export interface AthleteInfo {
  id: string;

  userId: string;

  service: 'garmin' | 'strava' | 'polar' | 'suunto' | 'coros' | 'other';

  serviceUserId: string;

  displayName: string;

  avatarUrl?: string;

  accessToken?: string;

  refreshToken?: string;

  tokenExpiresAt?: string;

  lastSyncAt?: string;

  syncEnabled: boolean;

  profileData?: {
    athleteType?: string;

    sex?: string;

    age?: number;

    weight?: number;

    height?: number;

    fcm?: number;

    restingHR?: number;

    vdot?: number;

    vma?: number;

    maxHR?: number;

    thresholdHR?: number;

    zones?: Array<{
      zone: number;

      name: string;

      minHR: number;

      maxHR: number;
    }>;
  };

  connectedAt: string;

  updatedAt: string;
}

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

  /**

   * Get extended profile data

   */

  getExtendedProfile(): Promise<ExtendedProfile> {
    return client.request('/api/profile/extended');
  },

  /**

   * Update extended profile data

   */

  updateExtendedProfile(data: Partial<ExtendedProfile>): Promise<{ success: boolean }> {
    return client.request('/api/profile/extended', {
      method: 'PUT',

      body: JSON.stringify(data),
    });
  },

  getConstants(): Promise<{
    fcm: number | null;

    fcmSource: string;

    vma: number | null;

    vmaSource: string;

    vdot: number | null;

    vdotSource: string;

    restingHR: number;

    age: number;

    sex: string;

    weight: number | null;
  }> {
    return client.request('/api/metrics/constants');
  },

  /**

   * Get athlete information from connected services

   */

  getAthlete(): Promise<AthleteInfo> {
    return client.request('/api/profile/athlete');
  },

  getAthleteStats(): Promise<AthleteStats> {
    return client.request('/api/profile/athlete/stats');
  },
};
