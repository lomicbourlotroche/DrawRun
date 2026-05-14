/**
 * ============================================================
 * USER CONSTANTS API
 * ============================================================
 * Endpoint unifié pour toutes les constantes utilisateur.
 */

import { client } from './client';

export interface UserProfile {
  age: number;
  fcm: number;
  restingHR: number;
  sex: string;
  weight: number;
  vma: number | null;
  vdot: number | null;
  vo2max: number | null;
  ftp: number | null;
  calculatedFcm: number;
}

export interface HrZone {
  zone: number;
  name: string;
  minHR: number;
  maxHR: number;
  percent: [number, number];
  description: string;
}

export interface SpeedZone {
  zone: string;
  name: string;
  minSpeed: number;
  maxSpeed: number;
  minPace: number;
  maxPace: number;
  description: string;
}

export interface TrainingPace {
  zone: string;
  name: string;
  pace: number;
  speed: number;
  description: string;
}

export interface UserZones {
  hrZones: HrZone[];
  hrPercentZones: Array<{ zone: number; name: string; minHR: number; maxHR: number; description: string }>;
  speedZones: SpeedZone[] | null;
  trainingPaces: TrainingPace[] | null;
  fcm: number;
  vma: number;
  vdot: number;
}

export interface UserConstantsResponse {
  profile: UserProfile;
  zones: UserZones;
  sources: Record<string, string>;
}

export const userConstantsApi = {
  get(): Promise<UserConstantsResponse> {
    return client.request('/api/user/constants');
  },
};
