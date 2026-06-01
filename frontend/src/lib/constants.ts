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
    credentialsDecathlon: '/api/auth/credentials/decathlon',
    disconnectDecathlon: '/api/auth/disconnect/decathlon',
    credentialsSuunto: '/api/auth/credentials/suunto',
    disconnectSuunto: '/api/auth/disconnect/suunto',
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
  recommendations: '/api/pmc/recommendations',
  zones: '/api/algo/zones',
  sync: '/api/sync',
  syncStatus: '/api/sync/status',
  algo: {
    vdot: '/api/algo/vdot',
    health: '/api/algo/health',
    readiness: '/api/algo/readiness',
    analyze: '/api/algo/analyze',
    polarization: '/api/algo/polarization',
    hrv: '/api/algo/hrv',
    taper: '/api/algo/taper',
    criticalPower: '/api/algo/critical-power',
    tss: '/api/algo/tss',
    overtraining: '/api/algo/overtraining',
    constants: '/api/algo/constants',
    sports: '/api/algo/sports',
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
  run: { label: 'Course', icon: 'Run', color: 'var(--primary)' },
  bike: { label: 'Vélo', icon: 'Bike', color: 'var(--warning)' },
  swim: { label: 'Natation', icon: 'Swim', color: 'var(--secondary)' },
} as const;

export const TRAINING_TYPES = {
  E: { label: 'Endurance', color: 'var(--success)', icon: 'Heart' },
  T: { label: 'Seuil/Tempo', color: 'var(--primary)', icon: 'Gauge' },
  I: { label: 'Intervalles', color: 'var(--warning)', icon: 'Zap' },
  R: { label: 'Récupération', color: 'var(--muted)', icon: 'Coffee' },
  L: { label: 'Sortie longue', color: 'var(--secondary)', icon: 'Mountain' },
  M: { label: 'Allure marathon', color: 'var(--danger)', icon: 'Flag' },
  S: { label: 'Short', color: 'var(--warning)', icon: 'Timer' },
  REST: { label: 'Repos', color: 'var(--neutral-800)', icon: 'Moon' },
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







