import type { ThemeColorScale, ThemeNeutralScale, ThemePalette } from './types';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

function l(r: number, g: number, b: number, amount: number): string {
  const nr = Math.round(r + (255 - r) * amount);
  const ng = Math.round(g + (255 - g) * amount);
  const nb = Math.round(b + (255 - b) * amount);
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

function d(r: number, g: number, b: number, amount: number): string {
  const nr = Math.round(r * (1 - amount));
  const ng = Math.round(g * (1 - amount));
  const nb = Math.round(b * (1 - amount));
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

export function generateScale(hex: string): Record<string, string> {
  const { r, g, b } = hexToRgb(hex);
  return {
    '50': l(r, g, b, 0.92),
    '100': l(r, g, b, 0.82),
    '200': l(r, g, b, 0.65),
    '300': l(r, g, b, 0.45),
    '400': l(r, g, b, 0.22),
    '500': hex,
    '600': d(r, g, b, 0.15),
    '700': d(r, g, b, 0.35),
    '800': d(r, g, b, 0.55),
    '900': d(r, g, b, 0.75),
  };
}

export function makeColorScale(hex: string, foreground?: string): ThemeColorScale {
  const scale = generateScale(hex);
  return {
    50: scale['50'],
    100: scale['100'],
    200: scale['200'],
    300: scale['300'],
    400: scale['400'],
    500: scale['500'],
    600: scale['600'],
    700: scale['700'],
    800: scale['800'],
    900: scale['900'],
    DEFAULT: hex,
    foreground: foreground || '#FFFFFF',
  };
}

export function makeNeutralScale(bgHex: string, fgHex: string): ThemeNeutralScale {
  const bg = hexToRgb(bgHex);
  const fg = hexToRgb(fgHex);
  return {
    '50': l(bg.r, bg.g, bg.b, 0.95),
    '100': l(bg.r, bg.g, bg.b, 0.88),
    '200': l(bg.r, bg.g, bg.b, 0.75),
    '300': l(bg.r, bg.g, bg.b, 0.58),
    '400': l(bg.r, bg.g, bg.b, 0.38),
    '500': l(fg.r, fg.g, fg.b, 0.65),
    '600': l(fg.r, fg.g, fg.b, 0.45),
    '700': l(fg.r, fg.g, fg.b, 0.28),
    '800': l(fg.r, fg.g, fg.b, 0.15),
    '900': fgHex,
  };
}

export function paletteToCssVars(prefix: string, palette: ThemeColorScale | ThemeNeutralScale): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [key, val] of Object.entries(palette)) {
    if (typeof val === 'string' && val.startsWith('#')) {
      const { r, g, b } = hexToRgb(val);
      vars[`${prefix}-${key}`] = val;
      vars[`${prefix}-${key}-rgb`] = `${r} ${g} ${b}`;
    }
  }
  return vars;
}

export function flattenSemanticTokens(
  themeId: string,
  mode: 'light' | 'dark',
  palette: ThemePalette,
  semantic: Record<string, string>,
  shadows: { card: string; cardHover: string; elevated: string; buttonPrimary: string; buttonPrimaryHover: string },
  radius: { card: string; button: string; input: string; badge: string },
): Record<string, string> {
  const vars: Record<string, string> = {};

  // Add all palette colors as CSS vars
  for (const [colorName, scale] of Object.entries(palette)) {
    Object.assign(vars, paletteToCssVars(colorName, scale));
  }

  // Semantic tokens
  for (const [key, val] of Object.entries(semantic)) {
    if (val.startsWith('#')) {
      const { r, g, b } = hexToRgb(val);
      vars[key] = val;
      vars[`${key}-rgb`] = `${r} ${g} ${b}`;
    } else {
      vars[key] = val;
    }
  }

  // Shadows  
  vars['shadow-card'] = shadows.card;
  vars['shadow-card-hover'] = shadows.cardHover;
  vars['shadow-elevated'] = shadows.elevated;
  vars['shadow-button-primary'] = shadows.buttonPrimary;
  vars['shadow-button-primary-hover'] = shadows.buttonPrimaryHover;

  // Radius
  vars['radius-card'] = radius.card;
  vars['radius-button'] = radius.button;
  vars['radius-input'] = radius.input;
  vars['radius-badge'] = radius.badge;

  // Activity colors (consistent across themes)
  vars['activity-run'] = '#FF3B30';
  vars['activity-ride'] = '#FF9500';
  vars['activity-swim'] = '#007AFF';
  vars['activity-hike'] = '#34C759';
  vars['activity-walk'] = '#8E8E93';
  vars['activity-ski'] = '#007AFF';
  vars['activity-trail'] = '#FF6D00';
  vars['activity-rowing'] = '#00BCD4';
  vars['activity-other'] = '#94A3B8';

  return vars;
}

export function cssVarsToString(vars: Record<string, string>, indent: string = '  '): string {
  return Object.entries(vars)
    .map(([key, val]) => `${indent}--${key}: ${val};`)
    .join('\n');
}
