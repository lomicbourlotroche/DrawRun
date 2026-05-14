export const API_BASE_URL =
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? '' // Use relative URLs in production (nginx handles proxying)
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    forgotPassword: '/api/auth/forgot-password/request',
    resetPassword: '/api/auth/forgot-password/confirm',
  },
  profile: {
    get: '/api/profile',
    update: '/api/profile',
  },
  activities: {
    list: '/api/activities',
    detail: (id: number) => `/api/activities/${id}`,
    streams: (id: number) => `/api/activities/${id}/streams`,
    create: '/api/activities/create',
  },
  pmc: '/api/pmc',
  recommendations: '/api/recommendations',
  zones: '/api/zones',
  sync: '/api/sync',
  strava: {
    url: '/api/strava/url',
    callback: '/api/strava/callback',
  },
  athlete: {
    get: '/api/athlete',
    activities: '/api/athlete/activities',
  },
  racePlanning: {
    calculate: '/api/race-planning/calculate',
    save: '/api/race-planning/save',
    list: '/api/race-planning/list',
    delete: (id: number) => `/api/race-planning/${id}`,
    strategy: '/api/race-planning/race-strategy',
  },
} as const;

export const SPORTS = {
  run: { label: 'Course', icon: 'Run', color: '#007AFF' },
  bike: { label: 'Vélo', icon: 'Bike', color: '#FF9500' },
  swim: { label: 'Natation', icon: 'Swim', color: '#5856D6' },
} as const;

export const TRAINING_TYPES = {
  E: { label: 'Endurance', color: '#34C759', icon: 'Heart' },
  T: { label: 'Seuil/Tempo', color: '#007AFF', icon: 'Gauge' },
  I: { label: 'Intervalles', color: '#FF9500', icon: 'Zap' },
  R: { label: 'Récupération', color: '#64748B', icon: 'Coffee' },
  L: { label: 'Sortie longue', color: '#5856D6', icon: 'Mountain' },
  M: { label: 'Allure marathon', color: '#FF2D55', icon: 'Flag' },
  S: { label: 'Short', color: '#FF9500', icon: 'Timer' },
  REST: { label: 'Repos', color: '#334155', icon: 'Moon' },
} as const;

export const ZONE_NAMES = {
  1: 'Récupération',
  2: 'Endurance',
  3: 'Tempo',
  4: 'Seuil',
  5: 'VO2max',
  6: 'Anaérobie',
  7: 'Neuromusculaire',
} as const;
