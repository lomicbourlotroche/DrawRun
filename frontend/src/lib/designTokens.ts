/**
 * DrawRun Design System - Single Source of Truth
 * 
 * Ce fichier centralise TOUS les tokens de design pour DrawRun.
 * UNIQUE au projet - inspiré des algorithmes scientifiques et du domaine sportif.
 * 
 * UTILISATION :
 * 1. Importer depuis ce fichier UNIQUEMENT
 * 2. NE JAMAIS dupliquer ces valeurs ailleurs
 * 3. Exécuter `npm run generate:design-tokens` pour synchroniser globals.css et tailwind.config.js
 * 
 * DOMAINE SPORTIF :
 * - Zones cardiaques (5 zones basées sur %FCM)
 * - Zones de puissance cyclisme (7 zones)
 * - États de forme (PMC: Performance Management Chart)
 * - seuils de fatigue et surentraînement
 */

// ============================================================================
// COULEURS - Palette Principale (Unique à DrawRun)
// ============================================================================

export const colors = {
  // Primary - Soft Blue (Flow Light - CTA, liens, actions principales)
  // 🎯 Couleur principale apaisante et moderne
  primary: {
    50: '#F0F7FF',
    100: '#E0F0FE',
    200: '#B8DAFD',
    300: '#8FC3FB',
    400: '#66ADF9',
    500: '#4D97F7',        // ← DEFAULT (CTA principal)
    600: '#337BE5',
    700: '#265FB3',
    800: '#1A4380',
    900: '#0D2140',
    DEFAULT: '#4D97F7',
    foreground: '#FFFFFF',
    glow: 'rgba(77, 151, 247, 0.25)',
    glowStrong: 'rgba(77, 151, 247, 0.35)',
  },

  // Secondary - Soft Lavender (accents secondaires, profondeur)
  secondary: {
    50: '#F8F7FC',
    100: '#F0EEF8',
    200: '#D8D5EC',
    300: '#C0BCE0',
    400: '#A8A3D4',
    500: '#908BC8',        // ← DEFAULT
    600: '#7873BC',
    700: '#605BAF',
    800: '#4844A3',
    900: '#302E97',
    DEFAULT: '#908BC8',
    foreground: '#FFFFFF',
  },

  // Success - Soft Sage (validation, succès, récupération)
  success: {
    50: '#F4F9F4',
    100: '#E8F3E8',
    200: '#C8E0C8',
    300: '#A8CD A8',
    400: '#88BA88',
    500: '#68A768',        // ← DEFAULT
    600: '#549454',
    700: '#408140',
    800: '#2C6E2C',
    900: '#185B18',
    DEFAULT: '#68A768',
    foreground: '#FFFFFF',
    glow: 'rgba(104, 167, 104, 0.25)',
  },

  // Recovery - Soft Teal (récupération, fraîcheur)
  recovery: {
    50: '#F0F9FA',
    100: '#E0F3F4',
    200: '#B8E1E3',
    300: '#90CFD2',
    400: '#68BDC1',
    500: '#40ABAF',        // ← DEFAULT
    600: '#34999D',
    700: '#28777A',
    800: '#1C5557',
    900: '#103335',
    DEFAULT: '#40ABAF',
    foreground: '#FFFFFF',
    glow: 'rgba(64, 171, 175, 0.25)',
  },

  // Warning - Soft Amber (alertes, attention)
  warning: {
    50: '#FEFBF4',
    100: '#FDF6E8',
    200: '#FAE8C8',
    300: '#F7DAA8',
    400: '#F4CC88',
    500: '#F1BE68',        // ← DEFAULT
    600: '#D9A954',
    700: '#C19440',
    800: '#A97F2C',
    900: '#916A18',
    DEFAULT: '#F1BE68',
    foreground: '#2C3E50',
    glow: 'rgba(241, 190, 104, 0.25)',
  },

  // Danger - Soft Coral (erreurs, danger)
  danger: {
    50: '#FEF5F4',
    100: '#FDEAE8',
    200: '#FACAC6',
    300: '#F7AAA4',
    400: '#F48A82',
    500: '#F16A60',        // ← DEFAULT
    600: '#D95448',
    700: '#C13E30',
    800: '#A92818',
    900: '#911200',
    DEFAULT: '#F16A60',
    foreground: '#FFFFFF',
    glow: 'rgba(241, 106, 96, 0.25)',
  },

  // Peak - Soft Peach (pic de performance)
  peak: {
    50: '#FEF8F4',
    100: '#FDEFE8',
    200: '#FAD8C8',
    300: '#F7C1A8',
    400: '#F4AA88',
    500: '#F19368',        // ← DEFAULT
    600: '#D97E54',
    700: '#C16940',
    800: '#A9542C',
    900: '#913F18',
    DEFAULT: '#F19368',
    foreground: '#FFFFFF',
    glow: 'rgba(241, 147, 104, 0.25)',
  },

  // Neutres Flow Light - Palette apaisante et aérée
  neutral: {
    50: '#FAFBFD',        // Fond principal (60%) - off-white
    100: '#F5F7FA',       // Fond alternatif
    200: '#E8ECF2',       // Bordures légères
    300: '#CBD2DC',       // Bordures
    400: '#8A95A7',       // Texte secondaire/muted
    500: '#6B7280',       // Texte tertiaire
    600: '#4B5563',       // Texte émphasé
    700: '#374151',       // Élévation
    800: '#2C3E50',       // Surface (30%) - dark blue-gray
    900: '#1F2937',       // Texte principal (10%)
  },

  // Couleurs des types d'activités (Sport-specific)
  activity: {
    run: '#FF3B30',       // Course à pied
    ride: '#FF9500',      // Cyclisme
    swim: '#007AFF',      // Natation
    hike: '#34C759',      // Randonnée
    walk: '#8E8E93',      // Marche
    ski: '#007AFF',       // Ski
    trail: '#FF6D00',     // Trail running
    rowing: '#00BCD4',    // Aviron
    other: '#8E8E93',     // Autre
  },
};

// ============================================================================
// 🎯 TOKENS METIERS - UNIQUEMENT DRAWRUN
// ============================================================================

// Zones Cardiaques (basées sur %FCM - Fréquence Cardiaque Maximale)
// 📊 Utilisées dans les algorithmes cardiovascular.js et hr_zones/
export const hrZones = {
  // Zone 1: Très léger - Récupération active (50-60% FCM)
  zone1: {
    color: '#00C853',     // Vert clair - récupération
    name: 'Very Light',
    description: 'Récupération active, échauffement',
    intensity: '50-60%',
    DEFAULT: '#00C853',
    foreground: '#0F172A',
    light: '#E8F9EE',
    dark: '#002810',
  },

  // Zone 2: Léger - Endurance de base (60-70% FCM)
  zone2: {
    color: '#8BC34A',     // Vert - endurance
    name: 'Light',
    description: 'Endurance fondamentale, combustion des graisses',
    intensity: '60-70%',
    DEFAULT: '#8BC34A',
    foreground: '#0F172A',
    light: '#F0F8E8',
    dark: '#1B5E20',
  },

  // Zone 3: Modéré - Seuil aérobie (70-80% FCM)
  zone3: {
    color: '#FFAB00',     // Orange - modéré
    name: 'Moderate',
    description: 'Amélioration de la capacité aérobie',
    intensity: '70-80%',
    DEFAULT: '#FFAB00',
    foreground: '#0F172A',
    light: '#FFF8E1',
    dark: '#E65100',
  },

  // Zone 4: Intense - Seuil lactique (80-90% FCM)
  zone4: {
    color: '#FF6D00',     // Orange vif - intense
    name: 'Hard',
    description: 'Amélioration de la puissance et de la vitesse',
    intensity: '80-90%',
    DEFAULT: '#FF6D00',
    foreground: '#FFFFFF',
    light: '#FFF3E0',
    dark: '#E65100',
  },

  // Zone 5: Maximum - Effort maximal (90-100% FCM)
  zone5: {
    color: '#FF5252',     // Rouge - maximal
    name: 'Maximum',
    description: 'Sprints, efforts maximaux, compétition',
    intensity: '90-100%',
    DEFAULT: '#FF5252',
    foreground: '#FFFFFF',
    light: '#FFEBEE',
    dark: '#C62828',
  },

  // Palette complète des zones
  all: ['#00C853', '#8BC34A', '#FFAB00', '#FF6D00', '#FF5252'],
  palette: {
    1: '#00C853',
    2: '#8BC34A',
    3: '#FFAB00',
    4: '#FF6D00',
    5: '#FF5252',
  },
};

// Zones de Puissance Cyclisme (basées sur FTP - Functional Threshold Power)
// 🚴 Utilisées dans power/, critical_power.js
export const powerZones = {
  // Zone 1: Récupération active (<55% FTP)
  zone1: {
    color: '#00BCD4',     // Cyan - récupération
    name: 'Active Recovery',
    description: 'Récupération, très léger',
    intensity: '<55%',
    DEFAULT: '#00BCD4',
    foreground: '#FFFFFF',
  },

  // Zone 2: Endurance (56-75% FTP)
  zone2: {
    color: '#00C853',     // Vert - endurance
    name: 'Endurance',
    description: 'Endurance fondamentale',
    intensity: '56-75%',
    DEFAULT: '#00C853',
    foreground: '#FFFFFF',
  },

  // Zone 3: Tempo (76-90% FTP)
  zone3: {
    color: '#8BC34A',     // Vert foncé - tempo
    name: 'Tempo',
    description: 'Allure marathon, seuil aérobie',
    intensity: '76-90%',
    DEFAULT: '#8BC34A',
    foreground: '#0F172A',
  },

  // Zone 4: Seuil lactique (91-105% FTP)
  zone4: {
    color: '#FFAB00',     // Orange - seuil
    name: 'Threshold',
    description: 'Seuil lactique, allure 10km',
    intensity: '91-105%',
    DEFAULT: '#FFAB00',
    foreground: '#0F172A',
  },

  // Zone 5: VO2 Max (106-120% FTP)
  zone5: {
    color: '#FF6D00',     // Orange vif - VO2 max
    name: 'VO2 Max',
    description: 'Capacité anaérobie, allure 3km-5km',
    intensity: '106-120%',
    DEFAULT: '#FF6D00',
    foreground: '#FFFFFF',
  },

  // Zone 6: Anaérobie (121-150% FTP)
  zone6: {
    color: '#E91E63',     // Rose - anaérobie
    name: 'Anaerobic Capacity',
    description: 'Efforts courts et intenses',
    intensity: '121-150%',
    DEFAULT: '#E91E63',
    foreground: '#FFFFFF',
  },

  // Zone 7: Neuromusculaire (>150% FTP)
  zone7: {
    color: '#9C27B0',     // Violet - neuromusculaire
    name: 'Neuromuscular',
    description: 'Sprints, départs, accélérations',
    intensity: '>150%',
    DEFAULT: '#9C27B0',
    foreground: '#FFFFFF',
  },

  // Palette complète
  all: ['#00BCD4', '#00C853', '#8BC34A', '#FFAB00', '#FF6D00', '#E91E63', '#9C27B0'],
  palette: {
    1: '#00BCD4',
    2: '#00C853',
    3: '#8BC34A',
    4: '#FFAB00',
    5: '#FF6D00',
    6: '#E91E63',
    7: '#9C27B0',
  },
};

// États de Forme - Performance Management Chart (PMC)
// 📈 Modèle scientifique pour suivre la fatigue, la forme et la performance
export const pmcStates = {
  // Forme excellente - Pic de performance (Forme > Fatigue)
  peak: {
    color: colors.peak.DEFAULT,
    name: 'Peak Form',
    description: 'Performance optimale, prêt à battre des records',
    DEFAULT: colors.peak.DEFAULT,
    foreground: colors.peak.foreground,
    glow: colors.peak.glow,
  },

  // Bonne forme - Récupération complète
  fresh: {
    color: colors.recovery.DEFAULT,
    name: 'Fresh',
    description: 'Bien récupéré, bonne forme générale',
    DEFAULT: colors.recovery.DEFAULT,
    foreground: colors.recovery.foreground,
    glow: colors.recovery.glow,
  },

  // Forme normale - Équilibre
  normal: {
    color: colors.primary.DEFAULT,
    name: 'Normal',
    description: 'État de forme standard, équilibre charge/récupération',
    DEFAULT: colors.primary.DEFAULT,
    foreground: colors.primary.foreground,
    glow: colors.primary.glow,
  },

  // Fatigue modérée - Besoin de récupération
  fatigued: {
    color: colors.warning.DEFAULT,
    name: 'Fatigued',
    description: 'Fatigue accumulée, récupération nécessaire',
    DEFAULT: colors.warning.DEFAULT,
    foreground: colors.warning.foreground,
    glow: colors.warning.glow,
  },

  // Surentraînement - Alerte rouge
  overtrained: {
    color: colors.danger.DEFAULT,
    name: 'Overtrained',
    description: 'Risque de blessure ou de contre-performance',
    DEFAULT: colors.danger.DEFAULT,
    foreground: colors.danger.foreground,
    glow: colors.danger.glow,
  },

  // Palette des états
  palette: [
    colors.danger.DEFAULT,   // overtrained
    colors.warning.DEFAULT, // fatigued
    colors.primary.DEFAULT, // normal
    colors.recovery.DEFAULT,// fresh
    colors.peak.DEFAULT,    // peak
  ],
};

// Niveaux de Fatigue (basés sur le modèle PMC)
// 💤 Utilisés dans overtraining.js
export const fatigueLevels = {
  // Niveau 1: Frais - Fatigue < 10%
  fresh: {
    color: colors.recovery.DEFAULT,
    threshold: 10,
    description: 'Aucune fatigue significatif',
    DEFAULT: colors.recovery.DEFAULT,
  },

  // Niveau 2: Normal - Fatigue 10-30%
  normal: {
    color: colors.primary.DEFAULT,
    threshold: 30,
    description: 'Fatigue normale après entraînement',
    DEFAULT: colors.primary.DEFAULT,
  },

  // Niveau 3: Fatigué - Fatigue 30-50%
  fatigued: {
    color: colors.warning.DEFAULT,
    threshold: 50,
    description: 'Besoin de récupération',
    DEFAULT: colors.warning.DEFAULT,
  },

  // Niveau 4: Très fatigué - Fatigue 50-70%
  veryFatigued: {
    color: '#FF8F00',
    threshold: 70,
    description: 'Récupération active nécessaire',
    DEFAULT: '#FF8F00',
    foreground: '#0F172A',
  },

  // Niveau 5: Surentraînement - Fatigue > 70%
  overtrained: {
    color: colors.danger.DEFAULT,
    threshold: 70,
    description: 'Risque élevé de blessure',
    DEFAULT: colors.danger.DEFAULT,
  },
};

// Niveaux de Readiness (Prêt à s'entraîner)
// ✅ Utilisés dans readiness.js
export const readinessLevels = {
  // Excellent - Toutes les métriques au vert
  excellent: {
    color: colors.success.DEFAULT,
    score: 90,
    description: 'Parfait pour un entraînement intense',
    DEFAULT: colors.success.DEFAULT,
    foreground: colors.success.foreground,
  },

  // Bon - Métriques légèrement en dessous
  good: {
    color: colors.recovery.DEFAULT,
    score: 70,
    description: 'Bon pour un entraînement modéré',
    DEFAULT: colors.recovery.DEFAULT,
    foreground: colors.recovery.foreground,
  },

  // Moyen - Certaines métriques en alertes
  fair: {
    color: colors.warning.DEFAULT,
    score: 50,
    description: 'Récupération active recommandée',
    DEFAULT: colors.warning.DEFAULT,
    foreground: colors.warning.foreground,
  },

  // Faible - Plusieurs métriques en alerte
  poor: {
    color: '#FF6D00',
    score: 30,
    description: 'Éviter les entraînements intenses',
    DEFAULT: '#FF6D00',
    foreground: '#FFFFFF',
  },

  // Très faible - Métriques critiques
  veryPoor: {
    color: colors.danger.DEFAULT,
    score: 0,
    description: 'Repos complet nécessaire',
    DEFAULT: colors.danger.DEFAULT,
    foreground: colors.danger.foreground,
  },
};

// Métriques de Performance (TSS, TRIMP, etc.)
// 📊 Utilisées dans tss.js, training_load.js
export const performanceMetrics = {
  // TSS - Training Stress Score
  tss: {
    low: '#00BCD4',       // < 150 - Récupération
    moderate: '#00C853',  // 150-300 - Endurance
    high: '#FFAB00',     // 300-450 - Intense
    veryHigh: '#FF6D00', // > 450 - Très intense
    extreme: '#FF5252',   // > 600 - Extrême
  },

  // TRIMP - Training Impulse
  trimp: {
    low: '#00BCD4',
    moderate: '#00C853',
    high: '#FFAB00',
    veryHigh: '#FF6D00',
    extreme: '#FF5252',
  },

  // Charge d'entraînement
  load: {
    acute: '#0066FF',     // Charge aiguë (7 jours)
    chronic: '#5856D6',  // Charge chronique (42 jours)
    ratio: '#FF6D00',     // Ratio ACWR
  },
};

// Niveaux de Polarisation (80/20 Rule)
// 🎯 Utilisés dans polarization.js
export const polarization = {
  // Zone 1 - Endurance (80% du volume)
  zone1: {
    color: colors.recovery.DEFAULT,
    target: 80,
    name: 'Endurance',
    description: 'Entraînement en zone 1 (aérobie)',
    DEFAULT: colors.recovery.DEFAULT,
  },

  // Zone 2+ - Intensité (20% du volume)
  zone2Plus: {
    color: colors.peak.DEFAULT,
    target: 20,
    name: 'Intensity',
    description: 'Entraînement en zones 2+ (anaérobie)',
    DEFAULT: colors.peak.DEFAULT,
  },

  // Déséquilibre
  imbalance: {
    color: colors.danger.DEFAULT,
    threshold: 85,
    description: 'Trop d\'intensité, risque de surentraînement',
    DEFAULT: colors.danger.DEFAULT,
  },
};

// Niveaux de Stress Thermique
// 🌡️ Utilisés dans environmental_impact.js
export const heatStress = {
  low: {
    color: '#00BCD4',
    threshold: 20,      // °C
    description: 'Conditions optimales',
    DEFAULT: '#00BCD4',
  },
  moderate: {
    color: '#00C853',
    threshold: 25,
    description: 'Conditions acceptables',
    DEFAULT: '#00C853',
  },
  high: {
    color: '#FFAB00',
    threshold: 30,
    description: 'Précautions nécessaires',
    DEFAULT: '#FFAB00',
  },
  extreme: {
    color: '#FF5252',
    threshold: 35,
    description: 'Danger - Éviter l\'effort',
    DEFAULT: '#FF5252',
  },
};

// Niveaux d'Hydratation
// 💧 Utilisés dans nutrition.js
export const hydrationLevels = {
  optimal: {
    color: '#00C853',
    percentage: 100,
    description: 'Hydratation optimale',
    DEFAULT: '#00C853',
  },
  good: {
    color: '#8BC34A',
    percentage: 80,
    description: 'Bonne hydratation',
    DEFAULT: '#8BC34A',
  },
  fair: {
    color: '#FFAB00',
    percentage: 60,
    description: 'Hydratation moyenne',
    DEFAULT: '#FFAB00',
  },
  poor: {
    color: '#FF6D00',
    percentage: 40,
    description: 'Déshydratation légère',
    DEFAULT: '#FF6D00',
  },
  critical: {
    color: '#FF5252',
    percentage: 20,
    description: 'Déshydratation sévère',
    DEFAULT: '#FF5252',
  },
};

// ============================================================================
// GRADIENTS (y compris gradients métiers)
// ============================================================================

export const gradients = {
  // Gradients Flow Light - doux et apaisants
  primary: 'linear-gradient(135deg, #66A3F5 0%, #4D97F7 50%, #337BE5 100%)',
  success: 'linear-gradient(135deg, #7FB069 0%, #68A768 50%, #549454 100%)',
  warning: 'linear-gradient(135deg, #F4C57A 0%, #F1BE68 50%, #D9A954 100%)',
  dark: 'linear-gradient(135deg, #2C3E50 0%, #374151 100%)',
  peak: 'linear-gradient(135deg, #F4A982 0%, #F19368 50%, #D97E54 100%)',
  recovery: 'linear-gradient(135deg, #52B8BC 0%, #40ABAF 50%, #34999D 100%)',
  glass: 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.4) 100%)',
  mesh: 'radial-gradient(at 40% 20%, var(--primary-200) 0px, transparent 50%), radial-gradient(at 80% 0%, var(--success-200) 0px, transparent 50%), radial-gradient(at 0% 50%, var(--neutral-100) 0px, transparent 50%)',

  // Gradients métiers
  // PMC (Performance Management Chart)
  pmc: {
    fitness: 'linear-gradient(135deg, #0066FF 0%, #5856D6 100%)',     // Courbe de fitness
    fatigue: 'linear-gradient(135deg, #FFAB00 0%, #FF6D00 100%)',    // Courbe de fatigue
    form: 'linear-gradient(135deg, #00BCD4 0%, #00C853 100%)',        // Courbe de forme
  },

  // Zones cardiaques
  hrZones: 'linear-gradient(90deg, #00C853 0%, #00C853 20%, #8BC34A 20%, #8BC34A 40%, #FFAB00 40%, #FFAB00 60%, #FF6D00 60%, #FF6D00 80%, #FF5252 80%, #FF5252 100%)',
  hrZonesVertical: 'linear-gradient(to bottom, #00C853 0%, #00C853 20%, #8BC34A 20%, #8BC34A 40%, #FFAB00 40%, #FFAB00 60%, #FF6D00 60%, #FF6D00 80%, #FF5252 80%, #FF5252 100%)',

  // Zones de puissance
  powerZones: 'linear-gradient(90deg, #00BCD4 0%, #00BCD4 14.28%, #00C853 14.28%, #00C853 42.85%, #8BC34A 42.85%, #8BC34A 57.14%, #FFAB00 57.14%, #FFAB00 71.42%, #FF6D00 71.42%, #FF6D00 85.71%, #E91E63 85.71%, #E91E63 100%)',

  // Niveaux de readiness
  readiness: 'linear-gradient(90deg, #FF5252 0%, #FF5252 20%, #FF6D00 20%, #FF6D00 40%, #FFAB00 40%, #FFAB00 60%, #00BCD4 60%, #00BCD4 80%, #00C853 80%, #00C853 100%)',

  // État de forme PMC
  formState: 'linear-gradient(135deg, #FF5252 0%, #FF6D00 25%, #FFAB00 50%, #00BCD4 75%, #00C853 100%)',
};

// ============================================================================
// TOKENS SEMANTIQUES (Light Mode)
// ============================================================================

export const lightTokens = {
  // Background - Flow Light airy feel
  bg: colors.neutral[50],           // #FAFBFD - Fond principal
  bgSecondary: colors.neutral[100], // #F5F7FA - Fond alternatif
  surface: '#FFFFFF',              // Cartes blanches avec ombre douce
  surfaceElevated: '#FFFFFF',
  
  // Text - Softer contrast for comfort
  foreground: colors.neutral[900],  // #1F2937 - Texte principal
  textPrimary: colors.neutral[800], // #2C3E50
  textSecondary: colors.neutral[600], // #4B5563
  textTertiary: colors.neutral[500],  // #6B7280
  muted: colors.neutral[400],       // #8A95A7 - Texte atténué
  textMuted: colors.neutral[400],
  
  // Borders - Subtle and soft
  border: colors.neutral[200],      // #E8ECF2
  borderStrong: colors.neutral[300], // #CBD2DC
  
  // Semantic colors - Flow Light palette
  primary: colors.primary.DEFAULT,  // #4D97F7
  secondary: colors.secondary.DEFAULT, // #908BC8
  success: colors.success.DEFAULT,  // #68A768
  warning: colors.warning.DEFAULT,  // #F1BE68
  danger: colors.danger.DEFAULT,    // #F16A60
  info: colors.primary.DEFAULT,
  peak: colors.peak.DEFAULT,        // #F19368
  recovery: colors.recovery.DEFAULT, // #40ABAF

  // Background status - Soft tints
  bgSuccess: colors.success[50],    // #F4F9F4
  bgWarning: colors.warning[50],    // #FEFBF4
  bgDanger: colors.danger[50],      // #FEF5F4
  bgInfo: colors.primary[50],       // #F0F7FF

  // DrawRun-specific semantic colors
  formPeak: pmcStates.peak.DEFAULT,
  formFresh: pmcStates.fresh.DEFAULT,
  formNormal: pmcStates.normal.DEFAULT,
  formFatigued: pmcStates.fatigued.DEFAULT,
  formOvertrained: pmcStates.overtrained.DEFAULT,
};

// ============================================================================
// TOKENS SEMANTIQUES (Dark Mode)
// ============================================================================

export const darkTokens = {
  // Background - Flow Light dark variant (softer than pure black)
  bg: '#0F172A',                   // #0F172A - Fond principal doux
  bgSecondary: '#1E293B',          // #1E293B - Fond secondaire
  surface: '#1E293B',              // Cartes
  surfaceElevated: '#334155',      // Élévation
  
  // Text - High contrast but comfortable
  foreground: '#F8FAFC',           // #F8FAFC - Texte principal
  textPrimary: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  muted: '#64748B',                // Texte atténué
  textMuted: '#64748B',
  
  // Borders - Subtle in dark mode
  border: '#334155',               // Bordures
  borderStrong: '#475569',
  
  // Semantic colors - Same hues as light for brand consistency
  primary: colors.primary.DEFAULT,
  secondary: colors.secondary.DEFAULT,
  success: colors.success.DEFAULT,
  warning: colors.warning.DEFAULT,
  danger: colors.danger.DEFAULT,
  info: colors.primary.DEFAULT,
  peak: colors.peak.DEFAULT,
  recovery: colors.recovery.DEFAULT,

  // Background status (dark variants - muted tints)
  bgSuccess: '#1A2E22',
  bgWarning: '#2E2212',
  bgDanger: '#2E1A1A',
  bgInfo: '#1A2332',

  // DrawRun-specific semantic colors
  formPeak: pmcStates.peak.DEFAULT,
  formFresh: pmcStates.fresh.DEFAULT,
  formNormal: pmcStates.normal.DEFAULT,
  formFatigued: pmcStates.fatigued.DEFAULT,
  formOvertrained: pmcStates.overtrained.DEFAULT,
};

// ============================================================================
// TYPOGRAPHIE
// ============================================================================

export const typography = {
  fontFamily: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
    mono: "'SF Mono', 'SF Pro Mono', 'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace",
    display: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif",
  },
  
  sizes: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
    '6xl': '60px',
    '7xl': '72px',
    '8xl': '96px',
    // Custom sizes for data visualization
    hero: '72px',
    heroMobile: '40px',
    data: '24px',
    dataSm: '20px',
    stat: '28px',
    statSm: '20px',
    statLabel: '14px',
  },
  
  lineHeights: {
    xs: '16px',
    sm: '20px',
    md: '24px',
    lg: '28px',
    xl: '32px',
    '2xl': '36px',
    hero: '80px',
    heroMobile: '48px',
    data: '32px',
    dataSm: '28px',
  },
  
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
  },
};

// ============================================================================
// ESPACEMENT (8pt Grid System)
// ============================================================================

export const spacing = {
  // Base units (multiples of 8px)
  '0': '0px',
  '1': '4px',   // 0.5 × 8
  '2': '8px',   // 1 × 8
  '3': '12px',  // 1.5 × 8
  '4': '16px',  // 2 × 8
  '5': '20px',  // 2.5 × 8
  '6': '24px',  // 3 × 8
  '7': '28px',  // 3.5 × 8
  '8': '32px',  // 4 × 8
  '9': '36px',  // 4.5 × 8
  '10': '40px', // 5 × 8
  '11': '44px', // 5.5 × 8
  '12': '48px', // 6 × 8
  '14': '56px', // 7 × 8
  '16': '64px', // 8 × 8
  '20': '80px', // 10 × 8
  '24': '96px', // 12 × 8
  '28': '112px',// 14 × 8
  '32': '128px',// 16 × 8
  '36': '144px',// 18 × 8
  '40': '160px',// 20 × 8
  '44': '176px',// 22 × 8
  '48': '192px',// 24 × 8
  '52': '208px',// 26 × 8
  '56': '224px',// 28 × 8
  '64': '256px',// 32 × 8
  
  // Named aliases
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
  '4xl': '96px',
  
  // Component-specific
  card: {
    sm: '12px',
    md: '16px',
    lg: '24px',
  },
  button: {
    sm: '8px 16px',
    md: '12px 24px',
    lg: '16px 32px',
  },
};

// ============================================================================
// RAYONS (Border Radius)
// ============================================================================

export const radius = {
  none: '0px',
  sm: '6px',      // 0.375rem
  md: '8px',      // 0.5rem
  lg: '12px',     // 0.75rem
  xl: '16px',     // 1rem
  '2xl': '24px',  // 1.5rem
  '3xl': '32px',  // 2rem
  full: '9999px',
  
  // Component-specific
  button: '8px',
  card: '12px',
  input: '8px',
  badge: '9999px',
  avatar: '50%',
};

// ============================================================================
// OMBRES
// ============================================================================

export const shadows = {
  // Standard shadows - Flow Light: softer, more diffused
  xs: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
  sm: '0 2px 4px 0 rgba(15, 23, 42, 0.06), 0 1px 2px 0 rgba(15, 23, 42, 0.04)',
  md: '0 4px 8px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.06)',
  lg: '0 8px 16px -4px rgba(15, 23, 42, 0.1), 0 4px 8px -4px rgba(15, 23, 42, 0.06)',
  xl: '0 16px 32px -8px rgba(15, 23, 42, 0.12), 0 8px 16px -8px rgba(15, 23, 42, 0.08)',
  '2xl': '0 24px 48px -12px rgba(15, 23, 42, 0.15)',
  
  // Component shadows - Flow Light aesthetic
  card: '0 2px 8px rgba(15, 23, 42, 0.06)',
  cardHover: '0 8px 24px rgba(15, 23, 42, 0.1)',
  elevated: '0 4px 16px rgba(15, 23, 42, 0.08)',
  
  // Glow effects - softer for Flow Light
  glow: {
    primary: `0 0 24px ${colors.primary.glow}, 0 0 48px ${colors.primary.glow}`,
    success: `0 0 24px ${colors.success.glow}, 0 0 48px ${colors.success.glow}`,
    recovery: `0 0 24px ${colors.recovery.glow}, 0 0 48px ${colors.recovery.glow}`,
    warning: `0 0 24px ${colors.warning.glow}, 0 0 48px ${colors.warning.glow}`,
    danger: `0 0 24px ${colors.danger.glow}, 0 0 48px ${colors.danger.glow}`,
    peak: `0 0 24px ${colors.peak.glow}, 0 0 48px ${colors.peak.glow}`,
  },
  
  button: {
    primary: `0 4px 12px ${colors.primary.glow}`,
    primaryHover: `0 8px 20px ${colors.primary.glowStrong}`,
  },
  
  // Inner shadows - subtle depth
  inner: {
    sm: 'inset 0 1px 2px 0 rgba(15, 23, 42, 0.04)',
    md: 'inset 0 2px 4px 0 rgba(15, 23, 42, 0.06)',
  },
};

// ============================================================================
// Z-INDEX (Layer System)
// ============================================================================

export const zIndex = {
  // Base layers
  base: 0,
  raised: 10,
  
  // Content layers
  content: 20,
  dropdown: 40,
  sticky: 30,
  fixed: 20,
  
  // Overlay layers
  modalBackdrop: 45,
  modal: 50,
  drawer: 50,
  toast: 60,
  tooltip: 70,
  
  // Maximum
  max: 9999,
};

// ============================================================================
// TRANSITIONS
// ============================================================================

export const transitions = {
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '400ms',
    slowest: '500ms',
  },
  
  timing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  
  // Combined transitions
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  spring: '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  smooth: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: '400ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  
  // Component-specific
  button: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  card: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  modal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  drawer: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
};

// ============================================================================
// ANIMATIONS
// ============================================================================

export const animations = {
  fadeIn: {
    name: 'fadeIn',
    keyframes: {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    duration: '0.3s',
    timing: 'ease-out',
  },
  
  slideUp: {
    name: 'slideUp',
    keyframes: {
      '0%': { opacity: '0', transform: 'translateY(10px)' },
      '100%': { opacity: '1', transform: 'translateY(0)' },
    },
    duration: '0.3s',
    timing: 'ease-out',
  },
  
  slideDown: {
    name: 'slideDown',
    keyframes: {
      '0%': { opacity: '0', transform: 'translateY(-10px)' },
      '100%': { opacity: '1', transform: 'translateY(0)' },
    },
    duration: '0.2s',
    timing: 'ease-out',
  },
  
  pulseSoft: {
    name: 'pulseSoft',
    keyframes: {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.7' },
    },
    duration: '2s',
    timing: 'ease-in-out',
    iteration: 'infinite',
  },
  
  shimmer: {
    name: 'shimmer',
    keyframes: {
      '0%': { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' },
    },
    duration: '2s',
    timing: 'linear',
    iteration: 'infinite',
  },
  
  float: {
    name: 'float',
    keyframes: {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-10px)' },
    },
    duration: '3s',
    timing: 'ease-in-out',
    iteration: 'infinite',
  },
  
  gradientShift: {
    name: 'gradientShift',
    keyframes: {
      '0%, 100%': { backgroundPosition: '0% 50%' },
      '50%': { backgroundPosition: '100% 50%' },
    },
    duration: '8s',
    timing: 'ease',
    iteration: 'infinite',
  },
  
  countUp: {
    name: 'countUp',
    keyframes: {
      '0%': { opacity: '0', transform: 'translateY(10px)' },
      '100%': { opacity: '1', transform: 'translateY(0)' },
    },
    duration: '0.5s',
    timing: 'ease-out',
  },
  
  spin: {
    name: 'spin',
    keyframes: {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
    duration: '1s',
    timing: 'linear',
    iteration: 'infinite',
  },
  
  ping: {
    name: 'ping',
    keyframes: {
      '75%, 100%': { transform: 'scale(2)', opacity: '0' },
    },
    duration: '1s',
    timing: 'ease-out',
    iteration: 'infinite',
  },
  
  bounce: {
    name: 'bounce',
    keyframes: {
      '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8,0,1,1)' },
      '50%': { transform: 'none', animationTimingFunction: 'cubic-bezier(0,0,0.2,1)' },
    },
    duration: '1s',
    timing: 'ease-in-out',
    iteration: 'infinite',
  },
};

// ============================================================================
// OPACITY
// ============================================================================

export const opacity = {
  disabled: 0.5,
  muted: 0.7,
  subtle: 0.1,
  light: 0.2,
  medium: 0.3,
  strong: 0.4,
  hover: 0.9,
  active: 0.8,
};

// ============================================================================
// BREAKPOINTS (Responsive)
// ============================================================================

export const breakpoints = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
};

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Récupère la couleur d'une zone cardiaque
 * @param zone - Numéro de zone (1-5)
 * @returns Couleur hexadécimale
 */
export function getHRZoneColor(zone: number): string {
  const zones = [hrZones.zone1, hrZones.zone2, hrZones.zone3, hrZones.zone4, hrZones.zone5];
  return zones[Math.min(Math.max(zone, 1), 5) - 1].DEFAULT;
}

/**
 * Récupère la couleur d'une zone de puissance
 * @param zone - Numéro de zone (1-7)
 * @returns Couleur hexadécimale
 */
export function getPowerZoneColor(zone: number): string {
  const zones = [
    powerZones.zone1, powerZones.zone2, powerZones.zone3,
    powerZones.zone4, powerZones.zone5, powerZones.zone6, powerZones.zone7
  ];
  return zones[Math.min(Math.max(zone, 1), 7) - 1].DEFAULT;
}

/**
 * Récupère la couleur d'un état de forme PMC
 * @param formValue - Valeur de forme (Forme - Fatigue)
 * @returns Couleur hexadécimale
 */
export function getPMCFormColor(formValue: number): string {
  if (formValue > 20) return pmcStates.peak.DEFAULT;
  if (formValue > 10) return pmcStates.fresh.DEFAULT;
  if (formValue > -10) return pmcStates.normal.DEFAULT;
  if (formValue > -20) return pmcStates.fatigued.DEFAULT;
  return pmcStates.overtrained.DEFAULT;
}

/**
 * Récupère la couleur d'un niveau de readiness
 * @param score - Score de readiness (0-100)
 * @returns Couleur hexadécimale
 */
export function getReadinessColor(score: number): string {
  if (score >= 90) return readinessLevels.excellent.DEFAULT;
  if (score >= 70) return readinessLevels.good.DEFAULT;
  if (score >= 50) return readinessLevels.fair.DEFAULT;
  if (score >= 30) return readinessLevels.poor.DEFAULT;
  return readinessLevels.veryPoor.DEFAULT;
}

/**
 * Récupère la couleur d'un niveau de fatigue
 * @param fatiguePercent - Pourcentage de fatigue
 * @returns Couleur hexadécimale
 */
export function getFatigueColor(fatiguePercent: number): string {
  if (fatiguePercent > 70) return fatigueLevels.overtrained.DEFAULT;
  if (fatiguePercent > 50) return fatigueLevels.veryFatigued.DEFAULT;
  if (fatiguePercent > 30) return fatigueLevels.fatigued.DEFAULT;
  if (fatiguePercent > 10) return fatigueLevels.normal.DEFAULT;
  return fatigueLevels.fresh.DEFAULT;
}

// ============================================================================
// EXPORT DEFAULT (pour compatibilité descendante)
// ============================================================================

/**
 * @deprecated Utiliser les exports nommés directement (colors, typography, etc.)
 */
export const designTokens = {
  // Couleurs
  colors,
  gradients,
  lightTokens,
  darkTokens,
  
  // Tokens métiers (UNIQUE À DRAWRUN)
  hrZones,
  powerZones,
  pmcStates,
  fatigueLevels,
  readinessLevels,
  performanceMetrics,
  polarization,
  heatStress,
  hydrationLevels,
  
  // Design system
  typography,
  spacing,
  radius,
  shadows,
  zIndex,
  transitions,
  animations,
  opacity,
  breakpoints,
  
  // Fonctions utilitaires
  getHRZoneColor,
  getPowerZoneColor,
  getPMCFormColor,
  getReadinessColor,
  getFatigueColor,
};

export default designTokens;
