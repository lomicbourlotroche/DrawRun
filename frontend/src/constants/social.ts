/**
 * ============================================================
 * SOCIAL CONSTANTS
 * ============================================================
 * Centralisation des constantes utilisées dans les fonctionnalités sociales.
 *
 * @module constants/social
 */

// ============================================================
// LEADERBOARD CONSTANTS
// ============================================================

export const LEADERBOARD_CATEGORIES = [
  { id: 'distance', label: 'Distance', unit: 'km', icon: 'MapPin' },
  { id: 'duration', label: 'Temps', unit: 'h', icon: 'Clock' },
  { id: 'tss', label: 'TSS', unit: '', icon: 'Activity' },
  { id: 'activities', label: 'Séances', unit: '', icon: 'Trophy' },
] as const;

export const LEADERBOARD_PERIODS = [
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
  { id: 'year', label: 'Année' },
] as const;

// ============================================================
// PODIUM STYLES
// ============================================================

export const PODIUM_STYLES = [
  {
    bg: 'from-yellow-400 to-amber-500',
    text: 'text-yellow-600',
    badge: '🥇',
    label: 'Leader',
    ring: 'ring-yellow-400',
  },
  { bg: 'from-gray-300 to-gray-400', text: 'text-gray-500', badge: '🥈', label: '2ème', ring: 'ring-gray-400' },
  { bg: 'from-orange-400 to-amber-600', text: 'text-orange-600', badge: '🥉', label: '3ème', ring: 'ring-orange-400' },
] as const;

// ============================================================
// SPORT GRADIENTS (pour les cartes d'activités)
// ============================================================

export const SPORT_GRADIENTS: Record<string, string> = {
  Running: 'from-orange-500 to-red-500',
  Cycling: 'from-blue-500 to-cyan-500',
  Swimming: 'from-cyan-500 to-blue-400',
  Hiking: 'from-green-500 to-emerald-500',
  Walking: 'from-teal-500 to-green-500',
  run: 'from-orange-500 to-red-500',
  ride: 'from-blue-500 to-cyan-500',
  swim: 'from-cyan-500 to-blue-400',
  hike: 'from-green-500 to-emerald-500',
  walk: 'from-teal-500 to-green-500',
} as const;

// ============================================================
// CHALLENGE CONSTANTS
// ============================================================

export const CHALLENGE_MODES = {
  quota: { icon: '🎯', label: 'Objectif' },
  streak: { icon: '🔥', label: 'Série' },
  weekly: { icon: '📅', label: 'Hebdomadaire' },
  frequency: { icon: '⏳', label: 'Fréquence' },
} as const;

export const CHALLENGE_TYPES = {
  distance: { icon: '📏', label: 'Distance', unit: 'km' },
  duration: { icon: '⏱️', label: 'Durée', unit: 'min' },
  elevation: { icon: '⛰️', label: 'Dénivelé', unit: 'm' },
  activities: { icon: '🏃', label: 'Activités', unit: '' },
} as const;

// Milestones pour les défis (par défaut)
export const DEFAULT_CHALLENGE_MILESTONES = [
  { pct: 25, label: '1/4', icon: '🌱' },
  { pct: 50, label: 'Moitié', icon: '🌿' },
  { pct: 75, label: '3/4', icon: '🌳' },
  { pct: 100, label: 'Terminé', icon: '🎉' },
] as const;

// Couleurs de progression pour les défis
export const PROGRESS_COLORS = [
  { threshold: 0, color: 'bg-red-500' },
  { threshold: 25, color: 'bg-orange-500' },
  { threshold: 50, color: 'bg-yellow-500' },
  { threshold: 75, color: 'bg-green-500' },
  { threshold: 100, color: 'bg-success' },
] as const;

// ============================================================
// FRIENDS CONSTANTS
// ============================================================

export const FRIENDS_CONSTANTS = {
  MIN_SEARCH_LENGTH: 2,
  MAX_SEARCH_RESULTS: 10,
  FRIENDS_PER_PAGE: 20,
} as const;

// ============================================================
// GROUPS CONSTANTS
// ============================================================

export const GROUPS_CONSTANTS = {
  MAX_PUBLIC_GROUPS: 5,
  GROUPS_PER_PAGE: 10,
} as const;

// ============================================================
// SOCIAL FEED CONSTANTS
// ============================================================

export const SOCIAL_FEED_CONSTANTS = {
  INITIAL_DISPLAY_COUNT: 10,
  LOAD_MORE_INCREMENT: 10,
  MAX_COMMENT_LENGTH: 500,
} as const;

// ============================================================
// ACCESSIBILITY CONSTANTS
// ============================================================

export const A11Y = {
  FEED: {
    LOAD_MORE_BUTTON: "Charger plus d'activités",
    LIKE_BUTTON: (liked: boolean) => (liked ? 'Retirer le like' : 'Ajouter un like'),
    COMMENT_BUTTON: 'Commenter cette activité',
  },
  FRIENDS: {
    ADD_FRIEND_BUTTON: 'Ajouter comme ami',
    ACCEPT_REQUEST_BUTTON: "Accepter la demande d'ami",
    REJECT_REQUEST_BUTTON: "Refuser la demande d'ami",
    REMOVE_FRIEND_BUTTON: 'Supprimer de mes amis',
  },
  GROUPS: {
    CREATE_GROUP_BUTTON: 'Créer un nouveau groupe',
    JOIN_GROUP_BUTTON: 'Rejoindre ce groupe',
    LEAVE_GROUP_BUTTON: 'Quitter ce groupe',
    COPY_INVITE_CODE_BUTTON: "Copier le code d'invitation",
  },
  CHALLENGES: {
    CREATE_CHALLENGE_BUTTON: 'Créer un nouveau défi',
    JOIN_CHALLENGE_BUTTON: 'Rejoindre ce défi',
  },
} as const;

// ============================================================
// ERROR MESSAGES
// ============================================================

export const SOCIAL_ERRORS = {
  FETCH_FRIENDS: "Impossible de charger la liste d'amis",
  FETCH_FRIEND_REQUESTS: "Impossible de charger les demandes d'amis",
  SEND_FRIEND_REQUEST: "Impossible d'envoyer la demande d'ami",
  ACCEPT_FRIEND_REQUEST: "Impossible d'accepter la demande d'ami",
  REJECT_FRIEND_REQUEST: "Impossible de refuser la demande d'ami",
  REMOVE_FRIEND: 'Impossible de supprimer cet ami',
  FETCH_GROUPS: 'Impossible de charger les groupes',
  CREATE_GROUP: 'Impossible de créer le groupe',
  JOIN_GROUP: 'Impossible de rejoindre le groupe',
  LEAVE_GROUP: 'Impossible de quitter le groupe',
  FETCH_CHALLENGES: 'Impossible de charger les défis',
  CREATE_CHALLENGE: 'Impossible de créer le défi',
  JOIN_CHALLENGE: 'Impossible de rejoindre le défi',
  FETCH_LEADERBOARD: 'Impossible de charger le classement',
  FETCH_FEED: "Impossible de charger le fil d'actualité",
  LIKE_ACTIVITY: "Impossible d'aimer cette activité",
  UNLIKE_ACTIVITY: 'Impossible de retirer le like',
  ADD_COMMENT: "Impossible d'ajouter un commentaire",
  FETCH_COMMENTS: 'Impossible de charger les commentaires',
} as const;
