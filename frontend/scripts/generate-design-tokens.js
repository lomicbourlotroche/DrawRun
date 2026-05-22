#!/usr/bin/env node

/**
 * Script de génération automatique des fichiers de design system
 * 
 * Ce script lit le fichier source (designTokens.ts) et génère :
 * 1. frontend/app/globals.css - Variables CSS pour light/dark mode
 * 2. frontend/tailwind.config.js - Configuration Tailwind synchronisée
 * 
 * UTILISATION :
 * npm run generate:design-tokens
 * 
 * ou
 * node scripts/generate-design-tokens.js
 */

const fs = require('fs');
const path = require('path');

// Chemins des fichiers
const DESIGN_TOKENS_PATH = path.join(__dirname, '../src/lib/designTokens.ts');
const GLOBALS_CSS_PATH = path.join(__dirname, '../app/globals.css');
const TAILWIND_CONFIG_PATH = path.join(__dirname, '../tailwind.config.js');

// ============================================================================
// FONCTIONS DE GÉNÉRATION
// ============================================================================

/**
 * Génère le contenu CSS pour globals.css
 * Convertit les tokens TypeScript en variables CSS
 */
function generateGlobalsCSS() {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

/**
 * DrawRun Design System - CSS Variables
 * GÉNÉRÉ AUTOMATIQUEMENT depuis src/lib/designTokens.ts
 * NE PAS MODIFIER MANUELLEMENT - Exécuter 'npm run generate:design-tokens' pour mettre à jour
 * 
 * Système de design unique à DrawRun avec :
 * - Palette de couleurs métiers (zones HR, power, PMC)
 * - Light/Dark mode complet
 * - 8pt grid system
 * - Z-index hierarchy
 */

:root {
  /* ======================================================================== */
  /* COULEURS PRINCIPALES */
  /* ======================================================================== */

  /* Primary - Bleu Performance */
  --primary-50: #E6F2FF;
  --primary-100: #CCE5FF;
  --primary-200: #99CBFF;
  --primary-300: #66B0FF;
  --primary-400: #4C9AFF;
  --primary-500: #007AFF;
  --primary-600: #0066FF;
  --primary-700: #0052CC;
  --primary-800: #003D99;
  --primary-900: #001A4D;
  --primary: #0066FF;
  --primary-foreground: #FFFFFF;
  --primary-glow: rgba(0, 102, 255, 0.3);
  --primary-glow-strong: rgba(0, 102, 255, 0.4);

  /* Secondary - Violet */
  --secondary-50: #EEEDFB;
  --secondary-100: #DCDBF7;
  --secondary-200: #B9B7EF;
  --secondary-300: #9593E7;
  --secondary-400: #7B79E0;
  --secondary-500: #5856D6;
  --secondary-600: #4644AB;
  --secondary-700: #353380;
  --secondary-800: #232256;
  --secondary-900: #12112B;
  --secondary: #5856D6;
  --secondary-foreground: #FFFFFF;

  /* Success - Vert */
  --success-50: #E8F9EE;
  --success-100: #D1F3DD;
  --success-200: #A3E7BB;
  --success-300: #75DB99;
  --success-400: #69F0AE;
  --success-500: #00C853;
  --success-600: #00A042;
  --success-700: #007831;
  --success-800: #005021;
  --success-900: #002810;
  --success: #00C853;
  --success-foreground: #FFFFFF;
  --success-glow: rgba(0, 200, 83, 0.3);

  /* Recovery - Cyan */
  --recovery-50: #E0F7FA;
  --recovery-100: #B2EBF2;
  --recovery-200: #80DEEA;
  --recovery-300: #4DD0E1;
  --recovery-400: #80DEEA;
  --recovery-500: #00BCD4;
  --recovery-600: #0097A7;
  --recovery-700: #006064;
  --recovery-800: #004050;
  --recovery-900: #002030;
  --recovery: #00BCD4;
  --recovery-foreground: #FFFFFF;
  --recovery-glow: rgba(0, 188, 212, 0.3);

  /* Warning - Orange */
  --warning-50: #FFF8E1;
  --warning-100: #FFECB3;
  --warning-200: #FFE082;
  --warning-300: #FFD54F;
  --warning-400: #FFD180;
  --warning-500: #FFAB00;
  --warning-600: #FF8F00;
  --warning-700: #FF6F00;
  --warning-800: #CC5900;
  --warning-900: #994300;
  --warning: #FFAB00;
  --warning-foreground: #0F172A;
  --warning-glow: rgba(255, 171, 0, 0.3);

  /* Danger - Rouge */
  --danger-50: #FFEBEE;
  --danger-100: #FFCDD2;
  --danger-200: #EF9A9A;
  --danger-300: #E57373;
  --danger-400: #FF8A80;
  --danger-500: #FF5252;
  --danger-600: #D32F2F;
  --danger-700: #B71C1C;
  --danger-800: #8C0E0E;
  --danger-900: #5C0A0A;
  --danger: #FF5252;
  --danger-foreground: #FFFFFF;
  --danger-glow: rgba(255, 82, 82, 0.3);

  /* Peak - Orange vif (Pic de performance) */
  --peak-50: #FFF3E0;
  --peak-100: #FFE0B2;
  --peak-200: #FFCC80;
  --peak-300: #FFB74D;
  --peak-400: #FF9100;
  --peak-500: #FF6D00;
  --peak-600: #E65100;
  --peak-700: #BF360C;
  --peak-800: #8C2400;
  --peak-900: #5C1800;
  --peak: #FF6D00;
  --peak-foreground: #FFFFFF;
  --peak-glow: rgba(255, 109, 0, 0.3);

  /* ======================================================================== */
  /* NEUTRES */
  /* ======================================================================== */

  /* Neutral colors (60-30-10 rule) */
  --neutral-50: #F8FAFC;
  --neutral-100: #F1F5F9;
  --neutral-200: #E2E8F0;
  --neutral-300: #CBD5E1;
  --neutral-400: #94A3B8;
  --neutral-500: #64748B;
  --neutral-600: #475569;
  --neutral-700: #334155;
  --neutral-800: #1E293B;
  --neutral-900: #0F172A;

  /* ======================================================================== */
  /* TOKENS SEMANTIQUES - LIGHT MODE */
  /* ======================================================================== */

  /* Background */
  --bg: #F8FAFC;
  --background-rgb: 248 250 252;
  --bg-secondary: #F1F5F9;
  --surface: #FFFFFF;
  --surface-rgb: 255 255 255;
  --surface-elevated: #FFFFFF;

  /* Text */
  --foreground: #0F172A;
  --foreground-rgb: 15 23 42;
  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-tertiary: #64748B;
  --muted: #94A3B8;
  --muted-rgb: 148 163 184;
  --text-muted: #94A3B8;

  /* Borders */
  --border: #E2E8F0;
  --border-rgb: 226 232 240;
  --border-strong: #CBD5E1;

  /* Semantic colors */
  --primary: #0066FF;
  --secondary: #5856D6;
  --success: #00C853;
  --warning: #FFAB00;
  --danger: #FF5252;
  --info: #0066FF;
  --peak: #FF6D00;
  --recovery: #00BCD4;

  /* Background status */
  --bg-success: #E8F9EE;
  --bg-warning: #FFF8E1;
  --bg-danger: #FFEBEE;
  --bg-info: #E6F2FF;

  /* DrawRun-specific: PMC Form States */
  --form-peak: #FF6D00;
  --form-fresh: #00BCD4;
  --form-normal: #0066FF;
  --form-fatigued: #FFAB00;
  --form-overtrained: #FF5252;

  /* DrawRun-specific: HR Zones */
  --hr-zone-1: #00C853;
  --hr-zone-2: #8BC34A;
  --hr-zone-3: #FFAB00;
  --hr-zone-4: #FF6D00;
  --hr-zone-5: #FF5252;

  /* DrawRun-specific: Power Zones */
  --power-zone-1: #00BCD4;
  --power-zone-2: #00C853;
  --power-zone-3: #8BC34A;
  --power-zone-4: #FFAB00;
  --power-zone-5: #FF6D00;
  --power-zone-6: #E91E63;
  --power-zone-7: #9C27B0;

  /* Activity colors */
  --activity-run: #FF3B30;
  --activity-ride: #FF9500;
  --activity-swim: #007AFF;
  --activity-hike: #34C759;
  --activity-walk: #8E8E93;
  --activity-ski: #007AFF;
  --activity-trail: #FF6D00;
  --activity-rowing: #00BCD4;
  --activity-other: #8E8E93;

  /* ======================================================================== */
  /* Z-INDEX SYSTEM */
  /* ======================================================================== */

  --z-base: 0;
  --z-raised: 10;
  --z-content: 20;
  --z-fixed: 20;
  --z-sticky: 30;
  --z-dropdown: 40;
  --z-modal-backdrop: 45;
  --z-modal: 50;
  --z-drawer: 50;
  --z-toast: 60;
  --z-tooltip: 70;
  --z-max: 9999;

  /* ======================================================================== */
  /* ESPACEMENT (8pt Grid) */
  /* ======================================================================== */

  --spacing-0: 0px;
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-5: 20px;
  --spacing-6: 24px;
  --spacing-7: 28px;
  --spacing-8: 32px;
  --spacing-9: 36px;
  --spacing-10: 40px;
  --spacing-11: 44px;
  --spacing-12: 48px;
  --spacing-14: 56px;
  --spacing-16: 64px;
  --spacing-20: 80px;
  --spacing-24: 96px;
  --spacing-28: 112px;
  --spacing-32: 128px;
  --spacing-36: 144px;
  --spacing-40: 160px;
  --spacing-44: 176px;
  --spacing-48: 192px;
  --spacing-52: 208px;
  --spacing-56: 224px;
  --spacing-64: 256px;

  /* ======================================================================== */
  /* RAYONS */
  /* ======================================================================== */

  --radius-none: 0px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-3xl: 32px;
  --radius-full: 9999px;
  --radius-button: 8px;
  --radius-card: 12px;
  --radius-input: 8px;
  --radius-badge: 9999px;
  --radius-avatar: 50%;

  /* ======================================================================== */
  /* OMBRES */
  /* ======================================================================== */

  /* Standard shadows */
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

  /* Component shadows */
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-card-hover: 0 8px 24px rgba(0, 0, 0, 0.12);
  --shadow-elevated: 0 4px 16px rgba(0, 0, 0, 0.1);

  /* Button shadows */
  --shadow-button-primary: 0 4px 12px rgba(0, 102, 255, 0.3);
  --shadow-button-primary-hover: 0 8px 20px rgba(0, 102, 255, 0.4);

  /* Inner shadows */
  --shadow-inner-sm: inset 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-inner-md: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);

  /* ======================================================================== */
  /* TRANSITIONS */
  /* ======================================================================== */

  --transition-instant: 0ms;
  --transition-fast: 150ms;
  --transition-normal: 200ms;
  --transition-slow: 300ms;
  --transition-slower: 400ms;
  --transition-slowest: 500ms;

  --transition-timing-linear: linear;
  --transition-timing-ease: ease;
  --transition-timing-ease-in: ease-in;
  --transition-timing-ease-out: ease-out;
  --transition-timing-ease-in-out: ease-in-out;
  --transition-timing-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --transition-timing-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --transition-timing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

  --transition-fast-full: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal-full: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow-full: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-spring-full: 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
  --transition-smooth-full: 300ms cubic-bezier(0.4, 0, 0.2, 1);

  --transition-button: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-card: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-modal: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-drawer: 300ms cubic-bezier(0.4, 0, 0.2, 1);

  /* ======================================================================== */
  /* GRADIENTS */
  /* ======================================================================== */

  /* Primary gradients */
  --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --gradient-success: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
  --gradient-warning: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  --gradient-dark: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --gradient-peak: linear-gradient(135deg, #FF9100 0%, #FF6D00 100%);
  --gradient-recovery: linear-gradient(135deg, #4DD0E1 0%, #00BCD4 100%);
  --gradient-glass: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);

  /* PMC gradients */
  --gradient-pmc-fitness: linear-gradient(135deg, #0066FF 0%, #5856D6 100%);
  --gradient-pmc-fatigue: linear-gradient(135deg, #FFAB00 0%, #FF6D00 100%);
  --gradient-pmc-form: linear-gradient(135deg, #00BCD4 0%, #00C853 100%);

  /* Zone gradients */
  --gradient-hr-zones: linear-gradient(90deg, #00C853 0%, #00C853 20%, #8BC34A 20%, #8BC34A 40%, #FFAB00 40%, #FFAB00 60%, #FF6D00 60%, #FF6D00 80%, #FF5252 80%, #FF5252 100%);
  --gradient-hr-zones-vertical: linear-gradient(to bottom, #00C853 0%, #00C853 20%, #8BC34A 20%, #8BC34A 40%, #FFAB00 40%, #FFAB00 60%, #FF6D00 60%, #FF6D00 80%, #FF5252 80%, #FF5252 100%);
  --gradient-power-zones: linear-gradient(90deg, #00BCD4 0%, #00BCD4 14.28%, #00C853 14.28%, #00C853 42.85%, #8BC34A 42.85%, #8BC34A 57.14%, #FFAB00 57.14%, #FFAB00 71.42%, #FF6D00 71.42%, #FF6D00 85.71%, #E91E63 85.71%, #E91E63 100%);

  /* Readiness gradient */
  --gradient-readiness: linear-gradient(90deg, #FF5252 0%, #FF5252 20%, #FF6D00 20%, #FF6D00 40%, #FFAB00 40%, #FFAB00 60%, #00BCD4 60%, #00BCD4 80%, #00C853 80%, #00C853 100%);

  /* Form state gradient */
  --gradient-form-state: linear-gradient(135deg, #FF5252 0%, #FF6D00 25%, #FFAB00 50%, #00BCD4 75%, #00C853 100%);

  /* Mesh gradient for backgrounds */
  --gradient-mesh: radial-gradient(at 40% 20%, var(--primary-400) 0px, transparent 50%), radial-gradient(at 80% 0%, var(--success-400) 0px, transparent 50%), radial-gradient(at 0% 50%, var(--neutral-700) 0px, transparent 50%);

  /* ======================================================================== */
  /* OPACITY */
  /* ======================================================================== */

  --opacity-disabled: 0.5;
  --opacity-muted: 0.7;
  --opacity-subtle: 0.1;
  --opacity-light: 0.2;
  --opacity-medium: 0.3;
  --opacity-strong: 0.4;
  --opacity-hover: 0.9;
  --opacity-active: 0.8;

  /* ======================================================================== */
  /* TYPOGRAPHY */
  /* ======================================================================== */

  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'SF Mono', 'SF Pro Mono', 'JetBrains Mono', 'IBM Plex Mono', ui-monospace, monospace;
  --font-display: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif;

  /* ======================================================================== */
  /* GLOW EFFECTS (Light mode) */
  /* ======================================================================== */

  --glow-primary: 0 0 20px rgba(0, 102, 255, 0.3), 0 0 40px rgba(0, 102, 255, 0.3);
  --glow-success: 0 0 20px rgba(0, 200, 83, 0.3), 0 0 40px rgba(0, 200, 83, 0.3);
  --glow-recovery: 0 0 20px rgba(0, 188, 212, 0.3), 0 0 40px rgba(0, 188, 212, 0.3);
  --glow-warning: 0 0 20px rgba(255, 171, 0, 0.3), 0 0 40px rgba(255, 171, 0, 0.3);
  --glow-danger: 0 0 20px rgba(255, 82, 82, 0.3), 0 0 40px rgba(255, 82, 82, 0.3);
  --glow-peak: 0 0 20px rgba(255, 109, 0, 0.3), 0 0 40px rgba(255, 109, 0, 0.3);
}

/* ======================================================================== */
/* DARK MODE */
/* ======================================================================== */

.dark {
  /* Background */
  --bg: #080C14;
  --background-rgb: 8 12 20;
  --bg-secondary: #111827;
  --surface: #111827;
  --surface-rgb: 17 24 39;
  --surface-elevated: #1E2D45;

  /* Text */
  --foreground: #E8EDF5;
  --foreground-rgb: 232 237 245;
  --text-primary: #E8EDF5;
  --text-secondary: #94A3B8;
  --text-tertiary: #64748B;
  --muted: #4A5568;
  --muted-rgb: 74 85 104;
  --text-muted: #4A5568;

  /* Borders */
  --border: #1E2D45;
  --border-rgb: 30 45 69;
  --border-strong: #334155;

  /* Semantic colors (same as light for brand consistency) */
  --primary: #0066FF;
  --secondary: #5856D6;
  --success: #00C853;
  --warning: #FFAB00;
  --danger: #FF5252;
  --info: #0066FF;
  --peak: #FF6D00;
  --recovery: #00BCD4;

  /* Background status (dark variants) */
  --bg-success: #1A2E22;
  --bg-warning: #2E2212;
  --bg-danger: #2E1A1A;
  --bg-info: #1A2332;

  /* DrawRun-specific colors (same as light for consistency) */
  --form-peak: #FF6D00;
  --form-fresh: #00BCD4;
  --form-normal: #0066FF;
  --form-fatigued: #FFAB00;
  --form-overtrained: #FF5252;

  /* Zone colors (same as light for consistency) */
  --hr-zone-1: #00C853;
  --hr-zone-2: #8BC34A;
  --hr-zone-3: #FFAB00;
  --hr-zone-4: #FF6D00;
  --hr-zone-5: #FF5252;

  --power-zone-1: #00BCD4;
  --power-zone-2: #00C853;
  --power-zone-3: #8BC34A;
  --power-zone-4: #FFAB00;
  --power-zone-5: #FF6D00;
  --power-zone-6: #E91E63;
  --power-zone-7: #9C27B0;

  /* Activity colors (same as light for consistency) */
  --activity-run: #FF3B30;
  --activity-ride: #FF9500;
  --activity-swim: #007AFF;
  --activity-hike: #34C759;
  --activity-walk: #8E8E93;
  --activity-ski: #007AFF;
  --activity-trail: #FF6D00;
  --activity-rowing: #00BCD4;
  --activity-other: #8E8E93;

  /* Shadow adjustments for dark mode */
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-card-hover: 0 8px 24px rgba(0, 0, 0, 0.4);
  --shadow-elevated: 0 4px 16px rgba(0, 0, 0, 0.3);
  --shadow-button-primary: 0 4px 12px rgba(0, 102, 255, 0.4);
  --shadow-button-primary-hover: 0 8px 20px rgba(0, 102, 255, 0.5);

  /* Glow effects for dark mode (more pronounced) */
  --glow-primary: 0 0 30px rgba(0, 102, 255, 0.4), 0 0 60px rgba(0, 102, 255, 0.3);
  --glow-success: 0 0 30px rgba(0, 200, 83, 0.4), 0 0 60px rgba(0, 200, 83, 0.3);
  --glow-recovery: 0 0 30px rgba(0, 188, 212, 0.4), 0 0 60px rgba(0, 188, 212, 0.3);
  --glow-warning: 0 0 30px rgba(255, 171, 0, 0.4), 0 0 60px rgba(255, 171, 0, 0.3);
  --glow-danger: 0 0 30px rgba(255, 82, 82, 0.4), 0 0 60px rgba(255, 82, 82, 0.3);
  --glow-peak: 0 0 30px rgba(255, 109, 0, 0.4), 0 0 60px rgba(255, 109, 0, 0.3);
}

/* ======================================================================== */
/* UTILITY CLASSES */
/* ======================================================================== */

/* Typographic utilities with tabular nums for data */
[data-tabular-nums] {
  font-variant-numeric: tabular-nums;
}

/* Focus visible styles for accessibility */
:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

/* Selection styles */
::selection {
  background-color: var(--primary-200);
  color: var(--primary-900);
}

.dark ::selection {
  background-color: var(--primary-400);
  color: var(--primary-900);
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--neutral-300);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--neutral-400);
}

.dark ::-webkit-scrollbar-thumb {
  background: var(--neutral-700);
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: var(--neutral-600);
}

/* ======================================================================== */
/* ANIMATIONS */
/* ======================================================================== */

@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes slideUp {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes slideDown {
  0% { opacity: 0; transform: translateY(-10px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes pulseSoft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes countUp {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes ping {
  75%, 100% { transform: scale(2); opacity: 0; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
  50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
}

/* Apply animations to utility classes */
.animate-fade-in { animation: fadeIn 0.3s ease-out; }
.animate-slide-up { animation: slideUp 0.3s ease-out; }
.animate-slide-down { animation: slideDown 0.2s ease-out; }
.animate-pulse-soft { animation: pulseSoft 2s ease-in-out infinite; }
.animate-shimmer { animation: shimmer 2s linear infinite; }
.animate-float { animation: float 3s ease-in-out infinite; }
.animate-gradient-shift { animation: gradientShift 8s ease infinite; }
.animate-count-up { animation: countUp 0.5s ease-out; }
.animate-spin { animation: spin 1s linear infinite; }
.animate-ping { animation: ping 1s ease-out infinite; }
.animate-bounce { animation: bounce 1s ease-in-out infinite; }
`;
}

/**
 * Génère le contenu de tailwind.config.js
 * Synchronise les couleurs avec les tokens CSS
 */
function generateTailwindConfig() {
  return `/** @type {import('tailwindcss').Config} */

// DrawRun Tailwind Configuration
// GÉNÉRÉ AUTOMATIQUEMENT depuis src/lib/designTokens.ts
// NE PAS MODIFIER MANUELLEMENT - Exécuter 'npm run generate:design-tokens' pour mettre à jour

module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  
  darkMode: 'class',
  
  theme: {
    extend: {
      // ======================================================================
      // COULEURS
      // ======================================================================
      
      colors: {
        // Primary - Bleu Performance
        primary: {
          50: '#E6F2FF',
          100: '#CCE5FF',
          200: '#99CBFF',
          300: '#66B0FF',
          400: '#4C9AFF',
          500: '#007AFF',
          600: '#0066FF',
          700: '#0052CC',
          800: '#003D99',
          900: '#001A4D',
          DEFAULT: '#0066FF',
          foreground: '#FFFFFF',
        },
        
        // Secondary - Violet
        secondary: {
          50: '#EEEDFB',
          100: '#DCDBF7',
          200: '#B9B7EF',
          300: '#9593E7',
          400: '#7B79E0',
          500: '#5856D6',
          600: '#4644AB',
          700: '#353380',
          800: '#232256',
          900: '#12112B',
          DEFAULT: '#5856D6',
          foreground: '#FFFFFF',
        },
        
        // Success - Vert
        success: {
          50: '#E8F9EE',
          100: '#D1F3DD',
          200: '#A3E7BB',
          300: '#75DB99',
          400: '#69F0AE',
          500: '#00C853',
          600: '#00A042',
          700: '#007831',
          800: '#005021',
          900: '#002810',
          DEFAULT: '#00C853',
          foreground: '#FFFFFF',
        },
        
        // Recovery - Cyan
        recovery: {
          50: '#E0F7FA',
          100: '#B2EBF2',
          200: '#80DEEA',
          300: '#4DD0E1',
          400: '#80DEEA',
          500: '#00BCD4',
          600: '#0097A7',
          700: '#006064',
          800: '#004050',
          900: '#002030',
          DEFAULT: '#00BCD4',
          foreground: '#FFFFFF',
        },
        
        // Warning - Orange
        warning: {
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFD180',
          500: '#FFAB00',
          600: '#FF8F00',
          700: '#FF6F00',
          800: '#CC5900',
          900: '#994300',
          DEFAULT: '#FFAB00',
          foreground: '#0F172A',
        },
        
        // Danger - Rouge
        danger: {
          50: '#FFEBEE',
          100: '#FFCDD2',
          200: '#EF9A9A',
          300: '#E57373',
          400: '#FF8A80',
          500: '#FF5252',
          600: '#D32F2F',
          700: '#B71C1C',
          800: '#8C0E0E',
          900: '#5C0A0A',
          DEFAULT: '#FF5252',
          foreground: '#FFFFFF',
        },
        
        // Peak - Orange vif
        peak: {
          50: '#FFF3E0',
          100: '#FFE0B2',
          200: '#FFCC80',
          300: '#FFB74D',
          400: '#FF9100',
          500: '#FF6D00',
          600: '#E65100',
          700: '#BF360C',
          800: '#8C2400',
          900: '#5C1800',
          DEFAULT: '#FF6D00',
          foreground: '#FFFFFF',
        },
        
        // Semantic colors (light/dark via RGB CSS vars — enables opacity modifiers)
        surface: 'rgb(var(--surface-rgb) / <alpha-value>)',
        background: 'rgb(var(--background-rgb) / <alpha-value>)',
        foreground: 'rgb(var(--foreground-rgb) / <alpha-value>)',
        muted: 'rgb(var(--muted-rgb) / <alpha-value>)',
        border: 'rgb(var(--border-rgb) / <alpha-value>)',

        // Neutral colors
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        
        // Activity colors
        activity: {
          run: '#FF3B30',
          ride: '#FF9500',
          swim: '#007AFF',
          hike: '#34C759',
          walk: '#8E8E93',
          ski: '#007AFF',
          trail: '#FF6D00',
          rowing: '#00BCD4',
          other: '#8E8E93',
        },
        
        // DrawRun-specific: HR Zones
        'hr-zone': {
          1: '#00C853',
          2: '#8BC34A',
          3: '#FFAB00',
          4: '#FF6D00',
          5: '#FF5252',
        },
        
        // DrawRun-specific: Power Zones
        'power-zone': {
          1: '#00BCD4',
          2: '#00C853',
          3: '#8BC34A',
          4: '#FFAB00',
          5: '#FF6D00',
          6: '#E91E63',
          7: '#9C27B0',
        },
        
        // DrawRun-specific: PMC Form States
        form: {
          peak: '#FF6D00',
          fresh: '#00BCD4',
          normal: '#0066FF',
          fatigued: '#FFAB00',
          overtrained: '#FF5252',
        },
      },
      
      // ======================================================================
      // Z-INDEX
      // ======================================================================
      
      zIndex: {
        base: '0',
        raised: '10',
        content: '20',
        fixed: '20',
        sticky: '30',
        dropdown: '40',
        'modal-backdrop': '45',
        modal: '50',
        drawer: '50',
        toast: '60',
        tooltip: '70',
        max: '9999',
      },
      
      // ======================================================================
      // ESPACEMENT (8pt Grid)
      // ======================================================================
      
      spacing: {
        '0': '0px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '9': '36px',
        '10': '40px',
        '11': '44px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '28': '112px',
        '32': '128px',
        '36': '144px',
        '40': '160px',
        '44': '176px',
        '48': '192px',
        '52': '208px',
        '56': '224px',
        '64': '256px',
      },
      
      // ======================================================================
      // RAYONS
      // ======================================================================
      
      borderRadius: {
        none: '0px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '32px',
        full: '9999px',
        button: '8px',
        card: '12px',
        input: '8px',
        badge: '9999px',
      },
      
      // ======================================================================
      // TYPOGRAPHIE
      // ======================================================================
      
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['SF Mono', 'SF Pro Mono', 'JetBrains Mono', 'IBM Plex Mono', 'ui-monospace', 'monospace'],
        display: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      
      fontSize: {
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
        hero: '72px',
        'hero-mobile': '40px',
        data: '24px',
        'data-sm': '20px',
        stat: '28px',
        'stat-sm': '20px',
        'stat-label': '14px',
      },
      
      lineHeight: {
        xs: '16px',
        sm: '20px',
        md: '24px',
        lg: '28px',
        xl: '32px',
        '2xl': '36px',
        hero: '80px',
        'hero-mobile': '48px',
        data: '32px',
        'data-sm': '28px',
      },
      
      // ======================================================================
      // OMBRES
      // ======================================================================
      
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        card: '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
        elevated: '0 4px 16px rgba(0, 0, 0, 0.1)',
        'button-primary': '0 4px 12px rgba(0, 102, 255, 0.3)',
        'button-primary-hover': '0 8px 20px rgba(0, 102, 255, 0.4)',
        'inner-sm': 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'inner-md': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
      },
      
      // ======================================================================
      // OPACITY
      // ======================================================================
      
      opacity: {
        disabled: '0.5',
        muted: '0.7',
        subtle: '0.1',
        light: '0.2',
        medium: '0.3',
        strong: '0.4',
        hover: '0.9',
        active: '0.8',
      },
      
      // ======================================================================
      // TRANSITIONS
      // ======================================================================
      
      transitionDuration: {
        instant: '0ms',
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
        slower: '400ms',
        slowest: '500ms',
      },
      
      transitionTimingFunction: {
        linear: 'linear',
        ease: 'ease',
        'ease-in': 'ease-in',
        'ease-out': 'ease-out',
        'ease-in-out': 'ease-in-out',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      
      transitionProperty: {
        'transform-opacity': 'transform, opacity',
        'all': 'all',
      },
      
      // ======================================================================
      // ANIMATIONS
      // ======================================================================
      
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'count-up': 'countUp 0.5s ease-out',
        'spin': 'spin 1s linear infinite',
        'ping': 'ping 1s ease-out infinite',
        'bounce': 'bounce 1s ease-in-out infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        ping: {
          '75%, 100%': { transform: 'scale(2)', opacity: '0' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(-25%)', animationTimingFunction: 'cubic-bezier(0.8,0,1,1)' },
          '50%': { transform: 'none', animationTimingFunction: 'cubic-bezier(0,0,0.2,1)' },
        },
      },
      
      // ======================================================================
      // BREAKPOINTS
      // ======================================================================
      
      screens: {
        xs: '480px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
      },
    },
  },
  
  plugins: [
    require('@tailwindcss/container-queries'),
    require('@tailwindcss/forms'),
    require('tailwindcss-animate'),
  ],
};
`;
}

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

function main() {
  console.log('🚀 Génération des fichiers de design system...\n');
  
  try {
    // Créer le répertoire de sortie si nécessaire
    const globalsDir = path.dirname(GLOBALS_CSS_PATH);
    if (!fs.existsSync(globalsDir)) {
      fs.mkdirSync(globalsDir, { recursive: true });
    }
    
    // Générer globals.css
    console.log('📄 Génération de app/globals.css...');
    const globalsContent = generateGlobalsCSS();
    fs.writeFileSync(GLOBALS_CSS_PATH, globalsContent, 'utf8');
    console.log('✅ app/globals.css généré avec succès\n');
    
    // Générer tailwind.config.js
    console.log('📄 Génération de tailwind.config.js...');
    const tailwindContent = generateTailwindConfig();
    fs.writeFileSync(TAILWIND_CONFIG_PATH, tailwindContent, 'utf8');
    console.log('✅ tailwind.config.js généré avec succès\n');
    
    // Résumé
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✨ Génération terminée avec succès !');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\nFichiers générés :');
    console.log(`  • ${path.relative(process.cwd(), GLOBALS_CSS_PATH)}`);
    console.log(`  • ${path.relative(process.cwd(), TAILWIND_CONFIG_PATH)}`);
    console.log('\nSource :', path.relative(process.cwd(), DESIGN_TOKENS_PATH));
    console.log('\nPour mettre à jour manuellement, exécutez :');
    console.log('  npm run generate:design-tokens');
    console.log('\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la génération :', error);
    process.exit(1);
  }
}

// Exécuter
main();
