/**
 * DrawRun Design System - Single Source of Truth
 * 
 * Ce fichier centralise TOUS les tokens de design :
 * - Couleurs (light + dark)
 * - Typographie
 * - Espacement (8pt grid)
 * - Rayons
 * - Ombres
 * - Z-index
 * - Transitions
 * - Animations
 * 
 * UTILISATION :
 * 1. Importer depuis ce fichier UNIQUEMENT
 * 2. NE JAMAIS dupliquer ces valeurs ailleurs
 * 3. Générer globals.css et tailwind.config.js à partir de ce fichier
 */

// ============================================================================
// COULEURS - Palette Principal
// ============================================================================

export const colors = {
  // Primary - Bleu Performance (CTA, liens, actions principales)
  primary: {
    50: '#E6F2FF',
    100: '#CCE5FF',
    200: '#99CBFF',
    300: '#66B0FF',
    400: '#4C9AFF',
    500: '#007AFF',
    600: '#0066FF',        // ← DEFAULT (CTA principal)
    700: '#0052CC',
    800: '#003D99',
    900: '#001A4D',
    DEFAULT: '#0066FF',
    foreground: '#FFFFFF',
    glow: 'rgba(0, 102, 255, 0.3)',
    glowStrong: 'rgba(0, 102, 255, 0.4)',
  },

  // Secondary - Violet (accents secondaires)
  secondary: {
    50: '#EEEDFB',
    100: '#DCDBF7',
    200: '#B9B7EF',
    300: '#9593E7',
    400: '#7B79E0',
    500: '#5856D6',        // ← DEFAULT
    600: '#4644AB',
    700: '#353380',
    800: '#232256',
    900: '#12112B',
    DEFAULT: '#5856D6',
    foreground: '#FFFFFF',
  },

  // Success - Vert (validation, succès)
  success: {
    50: '#E8F9EE',
    100: '#D1F3DD',
    200: '#A3E7BB',
    300: '#75DB99',
    400: '#69F0AE',
    500: '#00C853',        // ← DEFAULT
    600: '#00A042',
    700: '#007831',
    800: '#005021',
    900: '#002810',
    DEFAULT: '#00C853',
    foreground: '#FFFFFF',
    glow: 'rgba(0, 200, 83, 0.3)',
  },

  // Recovery - Cyan (récupération, fraîcheur)
  recovery: {
    50: '#E0F7FA',
    100: '#B2EBF2',
    200: '#80DEEA',
    300: '#4DD0E1',
    400: '#80DEEA',
    500: '#00BCD4',        // ← DEFAULT
    600: '#0097A7',
    700: '#006064',
    800: '#004050',
    900: '#002030',
    DEFAULT: '#00BCD4',
    foreground: '#FFFFFF',
    glow: 'rgba(0, 188, 212, 0.3)',
  },

  // Warning - Orange (alertes, attention)
  warning: {
    50: '#FFF8E1',
    100: '#FFECB3',
    200: '#FFE082',
    300: '#FFD54F',
    400: '#FFD180',
    500: '#FFAB00',        // ← DEFAULT
    600: '#FF8F00',
    700: '#FF6F00',
    800: '#CC5900',
    900: '#994300',
    DEFAULT: '#FFAB00',
    foreground: '#0F172A',
    glow: 'rgba(255, 171, 0, 0.3)',
  },

  // Danger - Rouge (erreurs, danger)
  danger: {
    50: '#FFEBEE',
    100: '#FFCDD2',
    200: '#EF9A9A',
    300: '#E57373',
    400: '#FF8A80',
    500: '#FF5252',        // ← DEFAULT
    600: '#D32F2F',
    700: '#B71C1C',
    800: '#8C0E0E',
    900: '#5C0A0A',
    DEFAULT: '#FF5252',
    foreground: '#FFFFFF',
    glow: 'rgba(255, 82, 82, 0.3)',
  },

  // Peak - Orange vif (pic de performance)
  peak: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    200: '#FFCC80',
    300: '#FFB74D',
    400: '#FF9100',
    500: '#FF6D00',        // ← DEFAULT
    600: '#E65100',
    700: '#BF360C',
    800: '#8C2400',
    900: '#5C1800',
    DEFAULT: '#FF6D00',
    foreground: '#FFFFFF',
    glow: 'rgba(255, 109, 0, 0.3)',
  },

  // Neutres (60-30-10 rule)
  neutral: {
    50: '#F8FAFC',        // Fond principal (60%)
    100: '#F1F5F9',       // Fond alternatif
    200: '#E2E8F0',       // Bordures légères
    300: '#CBD5E1',       // Bordures
    400: '#94A3B8',       // Texte secondaire/muted
    500: '#64748B',       // Texte tertiaire
    600: '#475569',       // Texte émphasé
    700: '#334155',       // Élévation
    800: '#1E293B',       // Surface (30%)
    900: '#0F172A',       // Texte principal (10%)
  },

  // Couleurs des types d'activités
  activity: {
    run: '#FF3B30',
    ride: '#FF9500',
    swim: '#007AFF',
    hike: '#34C759',
    walk: '#8E8E93',
    ski: '#007AFF',
    other: '#8E8E93',
  },
};

// ============================================================================
// GRADIENTS
// ============================================================================

export const gradients = {
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  success: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
  warning: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  dark: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  peak: 'linear-gradient(135deg, #FF9100 0%, #FF6D00 100%)',
  recovery: 'linear-gradient(135deg, #4DD0E1 0%, #00BCD4 100%)',
  glass: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  mesh: 'radial-gradient(at 40% 20%, var(--primary-400) 0px, transparent 50%), radial-gradient(at 80% 0%, var(--success-400) 0px, transparent 50%), radial-gradient(at 0% 50%, var(--neutral-700) 0px, transparent 50%)',
};

// ============================================================================
// TOKENS SEMANTIQUES (Light Mode)
// ============================================================================

export const lightTokens = {
  // Background
  bg: colors.neutral[50],           // Fond principal
  bgSecondary: colors.neutral[100],  // Fond secondaire
  surface: '#FFFFFF',               // Cartes, surfaces élevées
  surfaceElevated: '#FFFFFF',
  
  // Text
  foreground: colors.neutral[900],   // Texte principal
  textPrimary: colors.neutral[900],
  textSecondary: colors.neutral[600],
  textTertiary: colors.neutral[500],
  muted: colors.neutral[400],        // Texte atténué
  textMuted: colors.neutral[400],
  
  // Borders
  border: colors.neutral[200],       // Bordures
  borderStrong: colors.neutral[300],
  
  // Semantic colors
  primary: colors.primary.DEFAULT,
  secondary: colors.secondary.DEFAULT,
  success: colors.success.DEFAULT,
  warning: colors.warning.DEFAULT,
  danger: colors.danger.DEFAULT,
  info: colors.primary.DEFAULT,
  peak: colors.peak.DEFAULT,
  recovery: colors.recovery.DEFAULT,

  // Background status
  bgSuccess: colors.success[50],
  bgWarning: colors.warning[50],
  bgDanger: colors.danger[50],
  bgInfo: colors.primary[50],
};

// ============================================================================
// TOKENS SEMANTIQUES (Dark Mode)
// ============================================================================

export const darkTokens = {
  // Background
  bg: '#080C14',                   // Fond principal
  bgSecondary: '#111827',          // Fond secondaire
  surface: '#111827',              // Cartes, surfaces élevées
  surfaceElevated: '#1E2D45',
  
  // Text
  foreground: '#E8EDF5',           // Texte principal
  textPrimary: '#E8EDF5',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  muted: '#4A5568',                // Texte atténué
  textMuted: '#4A5568',
  
  // Borders
  border: '#1E2D45',               // Bordures
  borderStrong: '#334155',
  
  // Semantic colors (same as light for consistency)
  primary: colors.primary.DEFAULT,
  secondary: colors.secondary.DEFAULT,
  success: colors.success.DEFAULT,
  warning: colors.warning.DEFAULT,
  danger: colors.danger.DEFAULT,
  info: colors.primary.DEFAULT,
  peak: colors.peak.DEFAULT,
  recovery: colors.recovery.DEFAULT,

  // Background status
  bgSuccess: '#1A2E22',
  bgWarning: '#2E2212',
  bgDanger: '#2E1A1A',
  bgInfo: '#1A2332',
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
  // Standard shadows
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // Component shadows
  card: '0 2px 8px rgba(0, 0, 0, 0.08)',
  cardHover: '0 8px 24px rgba(0, 0, 0, 0.12)',
  elevated: '0 4px 16px rgba(0, 0, 0, 0.1)',
  
  // Glow effects
  glow: {
    primary: `0 0 20px ${colors.primary.glow}, 0 0 40px ${colors.primary.glow}`,
    success: `0 0 20px ${colors.success.glow}, 0 0 40px ${colors.success.glow}`,
    recovery: `0 0 20px ${colors.recovery.glow}, 0 0 40px ${colors.recovery.glow}`,
    warning: `0 0 20px ${colors.warning.glow}, 0 0 40px ${colors.warning.glow}`,
    danger: `0 0 20px ${colors.danger.glow}, 0 0 40px ${colors.danger.glow}`,
    peak: `0 0 20px ${colors.peak.glow}, 0 0 40px ${colors.peak.glow}`,
  },
  
  button: {
    primary: '0 4px 12px rgba(0, 102, 255, 0.3)',
    primaryHover: '0 8px 20px rgba(0, 102, 255, 0.4)',
  },
  
  // Inner shadows
  inner: {
    sm: 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
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
// EXPORT DEFAULT (pour compatibilité descendante)
// ============================================================================

/**
 * @deprecated Utiliser les exports nommés directement (colors, typography, etc.)
 */
export const designTokens = {
  colors,
  gradients,
  lightTokens,
  darkTokens,
  typography,
  spacing,
  radius,
  shadows,
  zIndex,
  transitions,
  animations,
  opacity,
  breakpoints,
};

export default designTokens;
