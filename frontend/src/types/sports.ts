/**
 * ============================================================
 * TYPES SPORTS - Définitions centralisées des sports
 * ============================================================
 *
 * Tous les sports поддерживаемые par l'application.
 * Chaque sport a ses propres métriques et algorithmes.
 *
 * @module types/sports
 */

export type SportType =
  | 'run'
  | 'trail_run'
  | 'race_walk'
  | 'walk'
  | 'hike'
  | 'bike'
  | 'mountain_bike'
  | 'gravel_bike'
  | 'indoor_cycling'
  | 'virtual_ride'
  | 'swim'
  | 'open_water_swim'
  | 'triathlon'
  | 'duathlon'
  | 'aquathlon'
  | 'crossfit'
  | 'weight_training'
  | 'strength_training'
  | 'cardio_training'
  | 'hiit'
  | 'circuit_training'
  | 'pilates'
  | 'yoga'
  | 'rowing'
  | 'kayak'
  | 'canoe'
  | 'stand_up_paddle'
  | 'ski_alpine'
  | 'ski_touring'
  | 'ski_cross_country'
  | 'snowboard'
  | 'roller_ski'
  | 'tennis'
  | 'badminton'
  | 'squash'
  | 'basketball'
  | 'football'
  | 'soccer'
  | 'rugby'
  | 'volleyball'
  | 'handball'
  | 'golf'
  | 'climbing'
  | 'via_ferrata'
  | 'mountaineering'
  | 'land_sailing'
  | 'other';

export interface SportCategory {
  id: SportType;
  name: string;
  nameFr: string;
  category: 'endurance' | 'strength' | 'team' | 'racket' | 'winter' | 'water' | 'other';
  primaryMetric: 'distance' | 'duration' | 'reps' | 'weight';
  hasHeartRate: boolean;
  hasPower: boolean;
  hasGPS: boolean;
  hasCadence: boolean;
  hasElevation: boolean;
  unit: string;
}

export interface SportProfile {
  sport: SportType;
  ftp?: number;
  swimFtp?: number;
  thresholdPace?: number;
  thresholdPower?: number;
  targetHeartRate?: number;
}

export const SPORTS: Record<SportType, SportCategory> = {
  // Course à pied
  run: {
    id: 'run',
    name: 'Run',
    nameFr: 'Course à pied',
    category: 'endurance',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: true,
    hasCadence: true,
    hasElevation: true,
    unit: 'km',
  },
  trail_run: {
    id: 'trail_run',
    name: 'Trail Run',
    nameFr: 'Course nature',
    category: 'endurance',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: true,
    hasCadence: true,
    hasElevation: true,
    unit: 'km',
  },
  race_walk: {
    id: 'race_walk',
    name: 'Race Walk',
    nameFr: 'Marcheathlon',
    category: 'endurance',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: true,
    hasCadence: true,
    hasElevation: true,
    unit: 'km',
  },
  walk: {
    id: 'walk',
    name: 'Walk',
    nameFr: 'Marche',
    category: 'endurance',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: true,
    hasCadence: false,
    hasElevation: true,
    unit: 'km',
  },
  hike: {
    id: 'hike',
    name: 'Hike',
    nameFr: 'Randonnée',
    category: 'endurance',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: true,
    hasCadence: false,
    hasElevation: true,
    unit: 'km',
  },

  // Vélo
  bike: {
    id: 'bike',
    name: 'Bike',
    nameFr: 'Vélo route',
    category: 'endurance',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: true,
    hasGPS: true,
    hasCadence: true,
    hasElevation: true,
    unit: 'km',
  },
  mountain_bike: {
    id: 'mountain_bike',
    name: 'Mountain Bike',
    nameFr: 'VTT',
    category: 'endurance',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: true,
    hasGPS: true,
    hasCadence: true,
    hasElevation: true,
    unit: 'km',
  },
  gravel_bike: {
    id: 'gravel_bike',
    name: 'Gravel Bike',
    nameFr: 'Gravel',
    category: 'endurance',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: true,
    hasGPS: true,
    hasCadence: true,
    hasElevation: true,
    unit: 'km',
  },
  indoor_cycling: {
    id: 'indoor_cycling',
    name: 'Indoor Cycling',
    nameFr: 'Vélo indoor',
    category: 'endurance',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: true,
    hasGPS: false,
    hasCadence: true,
    hasElevation: false,
    unit: 'km',
  },
  virtual_ride: {
    id: 'virtual_ride',
    name: 'Virtual Ride',
    nameFr: 'Vélo virtuel',
    category: 'endurance',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: true,
    hasGPS: false,
    hasCadence: true,
    hasElevation: false,
    unit: 'km',
  },

  // Natation
  swim: {
    id: 'swim',
    name: 'Swim',
    nameFr: 'Natation',
    category: 'endurance',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: false,
    hasCadence: true,
    hasElevation: false,
    unit: 'm',
  },
  open_water_swim: {
    id: 'open_water_swim',
    name: 'Open Water Swim',
    nameFr: 'Nage en eau libre',
    category: 'endurance',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: true,
    hasCadence: true,
    hasElevation: false,
    unit: 'm',
  },

  // Triathlon
  triathlon: {
    id: 'triathlon',
    name: 'Triathlon',
    nameFr: 'Triathlon',
    category: 'endurance',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: true,
    hasGPS: true,
    hasCadence: true,
    hasElevation: true,
    unit: 'km',
  },
  duathlon: {
    id: 'duathlon',
    name: 'Duathlon',
    nameFr: 'Duathlon',
    category: 'endurance',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: true,
    hasCadence: true,
    hasElevation: true,
    unit: 'km',
  },
  aquathlon: {
    id: 'aquathlon',
    name: 'Aquathlon',
    nameFr: 'Aquathlon',
    category: 'endurance',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: true,
    hasCadence: true,
    hasElevation: false,
    unit: 'km',
  },

  // Force
  weight_training: {
    id: 'weight_training',
    name: 'Weight Training',
    nameFr: 'Musculation',
    category: 'strength',
    primaryMetric: 'weight',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: false,
    hasCadence: false,
    hasElevation: false,
    unit: 'kg',
  },
  strength_training: {
    id: 'strength_training',
    name: 'Strength Training',
    nameFr: 'Entraînement force',
    category: 'strength',
    primaryMetric: 'weight',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: false,
    hasCadence: false,
    hasElevation: false,
    unit: 'kg',
  },
  cardio_training: {
    id: 'cardio_training',
    name: 'Cardio Training',
    nameFr: 'Cardio',
    category: 'strength',
    primaryMetric: 'duration',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: false,
    hasCadence: false,
    hasElevation: false,
    unit: 'min',
  },
  hiit: {
    id: 'hiit',
    name: 'HIIT',
    nameFr: 'HIIT',
    category: 'strength',
    primaryMetric: 'duration',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: false,
    hasCadence: false,
    hasElevation: false,
    unit: 'min',
  },
  circuit_training: {
    id: 'circuit_training',
    name: 'Circuit Training',
    nameFr: 'Circuit training',
    category: 'strength',
    primaryMetric: 'duration',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: false,
    hasCadence: false,
    hasElevation: false,
    unit: 'min',
  },
  crossfit: {
    id: 'crossfit',
    name: 'Crossfit',
    nameFr: 'Crossfit',
    category: 'strength',
    primaryMetric: 'reps',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: false,
    hasCadence: false,
    hasElevation: false,
    unit: 'reps',
  },
  pilates: {
    id: 'pilates',
    name: 'Pilates',
    nameFr: 'Pilates',
    category: 'strength',
    primaryMetric: 'duration',
    hasHeartRate: false,
    hasPower: false,
    hasGPS: false,
    hasCadence: false,
    hasElevation: false,
    unit: 'min',
  },
  yoga: {
    id: 'yoga',
    name: 'Yoga',
    nameFr: 'Yoga',
    category: 'strength',
    primaryMetric: 'duration',
    hasHeartRate: false,
    hasPower: false,
    hasGPS: false,
    hasCadence: false,
    hasElevation: false,
    unit: 'min',
  },

  // Eau
  rowing: {
    id: 'rowing',
    name: 'Rowing',
    nameFr: 'Aviron',
    category: 'water',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: true,
    hasGPS: false,
    hasCadence: true,
    hasElevation: false,
    unit: 'm',
  },
  kayak: {
    id: 'kayak',
    name: 'Kayak',
    nameFr: 'Kayak',
    category: 'water',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: true,
    hasCadence: false,
    hasElevation: false,
    unit: 'km',
  },
  canoe: {
    id: 'canoe',
    name: 'Canoe',
    nameFr: 'Canoë',
    category: 'water',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: true,
    hasCadence: false,
    hasElevation: false,
    unit: 'km',
  },
  stand_up_paddle: {
    id: 'stand_up_paddle',
    name: 'Stand Up Paddle',
    nameFr: 'Paddle',
    category: 'water',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: true,
    hasCadence: false,
    hasElevation: false,
    unit: 'km',
  },

  // Hiver
  ski_alpine: {
    id: 'ski_alpine',
    name: 'Alpine Ski',
    nameFr: 'Ski alpin',
    category: 'winter',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: true,
    hasCadence: false,
    hasElevation: true,
    unit: 'km',
  },
  ski_touring: {
    id: 'ski_touring',
    name: 'Ski Touring',
    nameFr: 'Ski de rando',
    category: 'winter',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: true,
    hasCadence: true,
    hasElevation: true,
    unit: 'km',
  },
  ski_cross_country: {
    id: 'ski_cross_country',
    name: 'Cross Country Ski',
    nameFr: 'Ski de fond',
    category: 'winter',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: true,
    hasGPS: true,
    hasCadence: true,
    hasElevation: true,
    unit: 'km',
  },
  snowboard: {
    id: 'snowboard',
    name: 'Snowboard',
    nameFr: 'Snowboard',
    category: 'winter',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: true,
    hasCadence: false,
    hasElevation: true,
    unit: 'km',
  },
  roller_ski: {
    id: 'roller_ski',
    name: 'Roller Ski',
    nameFr: 'Ski à rollers',
    category: 'winter',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: true,
    hasCadence: true,
    hasElevation: false,
    unit: 'km',
  },

  // Raquette
  tennis: {
    id: 'tennis',
    name: 'Tennis',
    nameFr: 'Tennis',
    category: 'racket',
    primaryMetric: 'duration',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: false,
    hasCadence: false,
    hasElevation: false,
    unit: 'min',
  },
  badminton: {
    id: 'badminton',
    name: 'Badminton',
    nameFr: 'Badminton',
    category: 'racket',
    primaryMetric: 'duration',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: false,
    hasCadence: false,
    hasElevation: false,
    unit: 'min',
  },
  squash: {
    id: 'squash',
    name: 'Squash',
    nameFr: 'Squash',
    category: 'racket',
    primaryMetric: 'duration',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: false,
    hasCadence: false,
    hasElevation: false,
    unit: 'min',
  },

  // Équipe
  basketball: {
    id: 'basketball',
    name: 'Basketball',
    nameFr: 'Basketball',
    category: 'team',
    primaryMetric: 'duration',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: false,
    hasCadence: false,
    hasElevation: false,
    unit: 'min',
  },
  football: {
    id: 'football',
    name: 'American Football',
    nameFr: 'Football US',
    category: 'team',
    primaryMetric: 'duration',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: false,
    hasCadence: false,
    hasElevation: false,
    unit: 'min',
  },
  soccer: {
    id: 'soccer',
    name: 'Soccer',
    nameFr: 'Football',
    category: 'team',
    primaryMetric: 'duration',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: false,
    hasCadence: false,
    hasElevation: false,
    unit: 'min',
  },
  rugby: {
    id: 'rugby',
    name: 'Rugby',
    nameFr: 'Rugby',
    category: 'team',
    primaryMetric: 'duration',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: false,
    hasCadence: false,
    hasElevation: false,
    unit: 'min',
  },
  volleyball: {
    id: 'volleyball',
    name: 'Volleyball',
    nameFr: 'Volleyball',
    category: 'team',
    primaryMetric: 'duration',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: false,
    hasCadence: false,
    hasElevation: false,
    unit: 'min',
  },
  handball: {
    id: 'handball',
    name: 'Handball',
    nameFr: 'Handball',
    category: 'team',
    primaryMetric: 'duration',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: false,
    hasCadence: false,
    hasElevation: false,
    unit: 'min',
  },
  golf: {
    id: 'golf',
    name: 'Golf',
    nameFr: 'Golf',
    category: 'team',
    primaryMetric: 'duration',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: true,
    hasCadence: false,
    hasElevation: true,
    unit: 'trous',
  },

  // Montagne
  climbing: {
    id: 'climbing',
    name: 'Climbing',
    nameFr: 'Escalade',
    category: 'other',
    primaryMetric: 'duration',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: false,
    hasCadence: false,
    hasElevation: true,
    unit: 'voies',
  },
  via_ferrata: {
    id: 'via_ferrata',
    name: 'Via Ferrata',
    nameFr: 'Via ferrata',
    category: 'other',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: true,
    hasCadence: false,
    hasElevation: true,
    unit: 'km',
  },
  mountaineering: {
    id: 'mountaineering',
    name: 'Mountaineering',
    nameFr: 'Alpinisme',
    category: 'other',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: true,
    hasCadence: false,
    hasElevation: true,
    unit: 'km',
  },

  // Other
  land_sailing: {
    id: 'land_sailing',
    name: 'Land Sailing',
    nameFr: 'Char à voile',
    category: 'other',
    primaryMetric: 'distance',
    hasHeartRate: true,
    hasPower: false,
    hasGPS: true,
    hasCadence: false,
    hasElevation: false,
    unit: 'km',
  },
  other: {
    id: 'other',
    name: 'Other',
    nameFr: 'Autre',
    category: 'other',
    primaryMetric: 'duration',
    hasHeartRate: false,
    hasPower: false,
    hasGPS: false,
    hasCadence: false,
    hasElevation: false,
    unit: 'min',
  },
};

export const SPORT_CATEGORIES = ['endurance', 'strength', 'team', 'racket', 'winter', 'water', 'other'] as const;
export type SportCategoryType = (typeof SPORT_CATEGORIES)[number];

export function getSportCategory(sport: SportType): SportCategory {
  return SPORTS[sport] || SPORTS.other;
}

export function isEnduranceSport(sport: SportType): boolean {
  return SPORTS[sport]?.category === 'endurance';
}

export function isCyclingSport(sport: SportType): boolean {
  return ['bike', 'mountain_bike', 'gravel_bike', 'indoor_cycling', 'virtual_ride'].includes(sport);
}

export function isRunningSport(sport: SportType): boolean {
  return ['run', 'trail_run', 'race_walk'].includes(sport);
}

export function isSwimmingSport(sport: SportType): boolean {
  return ['swim', 'open_water_swim'].includes(sport);
}

export function isWinterSport(sport: SportType): boolean {
  return ['ski_alpine', 'ski_touring', 'ski_cross_country', 'snowboard', 'roller_ski'].includes(sport);
}

export function hasPowerMeter(sport: SportType): boolean {
  return SPORTS[sport]?.hasPower || false;
}

export function hasGPS(sport: SportType): boolean {
  return SPORTS[sport]?.hasGPS || false;
}
