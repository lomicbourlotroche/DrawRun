/**
 * ============================================================
 * CHALLENGE CONSTANTS
 * ============================================================
 * Constantes et types spécifiques aux défis (challenges).
 *
 * @module challenge-constants
 */

// ============================================================
// CHALLENGE MODES
// ============================================================

export const CHALLENGE_MODES = [
  { id: 'quota', label: 'Quota total', icon: '🎯', desc: 'Atteindre un objectif cumulé sur la durée' },
  { id: 'progressive', label: 'Jauge progressive', icon: '📈', desc: 'Objectif qui augmente chaque semaine' },
  { id: 'streak', label: 'Streak', icon: '🔥', desc: 'Courir X jours consécutifs' },
  { id: 'frequency', label: 'Fréquence', icon: '📅', desc: 'X sorties par semaine pendant N semaines' },
  { id: 'pace', label: 'Performance', icon: '⚡', desc: 'Réaliser une sortie à une allure cible' },
] as const;

// Type pour les modes de défi
export type ChallengeMode = (typeof CHALLENGE_MODES)[number]['id'];

// ============================================================
// CHALLENGE TYPES
// ============================================================

export const CHALLENGE_TYPES = [
  { id: 'distance', label: 'Distance', unit: 'km', icon: '📏', modes: ['quota', 'progressive', 'streak'] as const },
  { id: 'elevation', label: 'Dénivelé', unit: 'm', icon: '⛰️', modes: ['quota', 'progressive'] as const },
  { id: 'time', label: 'Temps actif', unit: 'min', icon: '⏱️', modes: ['quota', 'progressive', 'streak'] as const },
  {
    id: 'activities',
    label: 'Activités',
    unit: 'sorties',
    icon: '📊',
    modes: ['quota', 'frequency', 'streak'] as const,
  },
  { id: 'pace', label: 'Allure cible', unit: 'min/km', icon: '⚡', modes: ['pace'] as const },
] as const;

// Type pour les types de défi
export type ChallengeType = (typeof CHALLENGE_TYPES)[number]['id'];

// ============================================================
// SPORT TYPES
// ============================================================

export const SPORT_TYPES = [
  { id: 'any', label: 'Tous sports', icon: '🏅' },
  { id: 'run', label: 'Course', icon: '🏃' },
  { id: 'bike', label: 'Vélo', icon: '🚴' },
  { id: 'swim', label: 'Natation', icon: '🏊' },
  { id: 'hike', label: 'Randonnée', icon: '🥾' },
] as const;

// Type pour les types de sport
export type SportType = (typeof SPORT_TYPES)[number]['id'];

// ============================================================
// BADGE ICONS
// ============================================================

export const BADGE_ICONS = ['🏆', '🔥', '⚡', '🎯', '💪', '🌟', '🚀', '🏅', '💎', '🦁', '🐉', '🌈'] as const;

// Type pour les icônes de badge
export type BadgeIcon = (typeof BADGE_ICONS)[number];

// ============================================================
// PRESET CHALLENGES
// ============================================================

interface PresetChallenge {
  title: string;
  type: ChallengeType;
  target_value: number;
  duration_days: number;
  challenge_mode: ChallengeMode;
  badge_icon: string;
  sport_type: SportType;
  weekly_target?: number;
  weekly_increase_pct?: number;
  streak_days?: number;
  frequency_per_week?: number;
}

export const PRESET_CHALLENGES: PresetChallenge[] = [
  {
    title: '100km en 30 jours',
    type: 'distance',
    target_value: 100,
    duration_days: 30,
    challenge_mode: 'quota',
    badge_icon: '🏃',
    sport_type: 'run',
  },
  {
    title: 'Everest Challenge',
    type: 'elevation',
    target_value: 8848,
    duration_days: 30,
    challenge_mode: 'quota',
    badge_icon: '⛰️',
    sport_type: 'any',
  },
  {
    title: 'Streak 30 jours',
    type: 'activities',
    target_value: 30,
    duration_days: 30,
    challenge_mode: 'streak',
    streak_days: 30,
    badge_icon: '🔥',
    sport_type: 'any',
  },
  {
    title: 'Montée en puissance',
    type: 'distance',
    target_value: 20,
    duration_days: 42,
    challenge_mode: 'progressive',
    weekly_target: 20,
    weekly_increase_pct: 10,
    badge_icon: '📈',
    sport_type: 'run',
  },
  {
    title: '3 sorties/semaine',
    type: 'activities',
    target_value: 12,
    duration_days: 28,
    challenge_mode: 'frequency',
    frequency_per_week: 3,
    badge_icon: '📅',
    sport_type: 'any',
  },
];

// ============================================================
// FORM TYPE
// ============================================================

export interface ChallengeForm {
  title: string;
  description: string;
  type: string;
  target_value: string;
  end_date: string;
  challenge_mode: string;
  weekly_target: string;
  weekly_increase_pct: string;
  streak_days: string;
  frequency_per_week: string;
  sport_type: string;
  badge_icon: string;
  is_public: boolean;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Récupère les informations sur un mode de défi.
 * @param mode - L'ID du mode de défi
 * @returns L'objet mode correspondant ou le premier mode par défaut
 */
export function getModeInfo(mode: string): (typeof CHALLENGE_MODES)[number] {
  return CHALLENGE_MODES.find((m) => m.id === mode) || CHALLENGE_MODES[0];
}

/**
 * Récupère les informations sur un type de défi.
 * @param type - L'ID du type de défi
 * @returns L'objet type correspondant ou le premier type par défaut
 */
export function getTypeInfo(type: string): (typeof CHALLENGE_TYPES)[number] {
  return CHALLENGE_TYPES.find((t) => t.id === type) || CHALLENGE_TYPES[0];
}

/**
 * Récupère les milestones pour un défi.
 * @param c - Objet contenant les milestones (optionnel)
 * @returns Tableau de milestones avec pct, label, et icon
 */
export function getMilestones(c: { milestones?: string }): Array<{ pct: number; label: string; icon: string }> {
  if (!c.milestones) {
    return [
      { pct: 25, label: 'Bronze', icon: '🥉' },
      { pct: 50, label: 'Argent', icon: '🥈' },
      { pct: 75, label: 'Or', icon: '🥇' },
      { pct: 100, label: 'Légendaire', icon: '💎' },
    ];
  }
  try {
    return JSON.parse(c.milestones);
  } catch {
    return [];
  }
}

/**
 * Récupère la couleur de progression en fonction du pourcentage.
 * @param pct - Pourcentage de progression (0-100)
 * @returns Classe CSS pour la couleur de fond
 */
export function getProgressColor(pct: number): string {
  if (pct >= 100) return 'bg-warning/80';
  if (pct >= 75) return 'bg-success';
  if (pct >= 50) return 'bg-primary';
  if (pct >= 25) return 'bg-peak/80';
  return 'bg-primary';
}

/**
 * Formate le nombre de jours restants jusqu'à une date.
 * @param endDate - Date de fin au format ISO
 * @returns Chaîne formatée (ex: "5j restants", "Terminé", "Dernier jour !")
 */
export function formatDaysLeft(endDate: string): string {
  const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return 'Terminé';
  if (days === 0) return 'Dernier jour !';
  return `${days}j restants`;
}
