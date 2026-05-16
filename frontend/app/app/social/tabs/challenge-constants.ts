export const CHALLENGE_MODES = [
  { id: 'quota',       label: 'Quota total',     icon: '🎯', desc: 'Atteindre un objectif cumulé sur la durée' },
  { id: 'progressive', label: 'Jauge progressive', icon: '📈', desc: 'Objectif qui augmente chaque semaine' },
  { id: 'streak',      label: 'Streak',           icon: '🔥', desc: 'Courir X jours consécutifs' },
  { id: 'frequency',   label: 'Fréquence',        icon: '📅', desc: 'X sorties par semaine pendant N semaines' },
  { id: 'pace',        label: 'Performance',      icon: '⚡', desc: 'Réaliser une sortie à une allure cible' },
] as const;

export const CHALLENGE_TYPES = [
  { id: 'distance',   label: 'Distance',    unit: 'km',         icon: '📏', modes: ['quota','progressive','streak'] },
  { id: 'elevation',  label: 'Dénivelé',    unit: 'm',          icon: '⛰️', modes: ['quota','progressive'] },
  { id: 'time',       label: 'Temps actif', unit: 'min',        icon: '⏱️', modes: ['quota','progressive','streak'] },
  { id: 'activities', label: 'Activités',   unit: 'sorties',    icon: '📊', modes: ['quota','frequency','streak'] },
  { id: 'pace',       label: 'Allure cible', unit: 'min/km',    icon: '⚡', modes: ['pace'] },
] as const;

export const SPORT_TYPES = [
  { id: 'any',  label: 'Tous sports', icon: '🏅' },
  { id: 'run',  label: 'Course',      icon: '🏃' },
  { id: 'bike', label: 'Vélo',        icon: '🚴' },
  { id: 'swim', label: 'Natation',    icon: '🏊' },
  { id: 'hike', label: 'Randonnée',   icon: '🥾' },
];

export const BADGE_ICONS = ['🏆','🔥','⚡','🎯','💪','🌟','🚀','🏅','💎','🦁','🐉','🌈'];

export const PRESET_CHALLENGES = [
  { title: '100km en 30 jours', type: 'distance', target_value: 100, duration_days: 30, challenge_mode: 'quota', badge_icon: '🏃', sport_type: 'run' },
  { title: 'Everest Challenge', type: 'elevation', target_value: 8848, duration_days: 30, challenge_mode: 'quota', badge_icon: '⛰️', sport_type: 'any' },
  { title: 'Streak 30 jours', type: 'activities', target_value: 30, duration_days: 30, challenge_mode: 'streak', streak_days: 30, badge_icon: '🔥', sport_type: 'any' },
  { title: 'Montée en puissance', type: 'distance', target_value: 20, duration_days: 42, challenge_mode: 'progressive', weekly_target: 20, weekly_increase_pct: 10, badge_icon: '📈', sport_type: 'run' },
  { title: '3 sorties/semaine', type: 'activities', target_value: 12, duration_days: 28, challenge_mode: 'frequency', frequency_per_week: 3, badge_icon: '📅', sport_type: 'any' },
];

export type ChallengeForm = {
  title: string; description: string; type: string; target_value: string;
  end_date: string; challenge_mode: string; weekly_target: string;
  weekly_increase_pct: string; streak_days: string; frequency_per_week: string;
  sport_type: string; badge_icon: string; is_public: boolean;
};

export function getModeInfo(mode: string) {
  return CHALLENGE_MODES.find(m => m.id === mode) || CHALLENGE_MODES[0];
}

export function getTypeInfo(type: string) {
  return CHALLENGE_TYPES.find(t => t.id === type) || CHALLENGE_TYPES[0];
}

export function getMilestones(c: { milestones?: string }) {
  if (!c.milestones) return [{ pct: 25, label: 'Bronze', icon: '🥉' }, { pct: 50, label: 'Argent', icon: '🥈' }, { pct: 75, label: 'Or', icon: '🥇' }, { pct: 100, label: 'Légendaire', icon: '💎' }];
  try { return JSON.parse(c.milestones); } catch { return []; }
}

export function getProgressColor(pct: number) {
  if (pct >= 100) return 'bg-yellow-400';
  if (pct >= 75) return 'bg-success';
  if (pct >= 50) return 'bg-primary';
  if (pct >= 25) return 'bg-orange-400';
  return 'bg-primary';
}

export function formatDaysLeft(endDate: string) {
  const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return 'Terminé';
  if (days === 0) return 'Dernier jour !';
  return `${days}j restants`;
}
