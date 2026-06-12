import type { ThemeDefinition, ThemeConfig } from './types';
import { trailTheme } from './trail.theme';
import { peakTheme } from './peak.theme';
import { apexTheme } from './apex.theme';
import { kompakTheme } from './kompak.theme';
import { flattenSemanticTokens, cssVarsToString } from './helpers';

export type { ThemeDefinition, ThemeConfig };
export type ThemeId = 'trail' | 'peak' | 'apex' | 'kompak';

export const themes: Record<ThemeId, ThemeDefinition> = {
  trail: trailTheme,
  peak: peakTheme,
  apex: apexTheme,
  kompak: kompakTheme,
};

export const themeList: ThemeDefinition[] = Object.values(themes);

export function getTheme(id: string): ThemeDefinition {
  return themes[id as ThemeId] || themes.trail;
}

export function getThemeCSSVars(themeId: string, mode: 'light' | 'dark'): string {
  const theme = getTheme(themeId);
  const semanticData = mode === 'light' ? theme.semantic.light : theme.semantic.dark;
  const vars = flattenSemanticTokens(
    themeId,
    mode,
    theme.colors,
    semanticData,
    theme.shadows,
    theme.radius,
  );
  return cssVarsToString(vars);
}

export function getThemeFonts(themeId: string): string[] {
  const theme = getTheme(themeId);
  const fonts: string[] = [];
  const fontFamily = theme.typography.fontFamily;
  
  if (fontFamily.sans.includes('DM Sans')) fonts.push('DM Sans');
  if (fontFamily.sans.includes('Plus Jakarta Sans')) fonts.push('Plus Jakarta Sans');
  if (fontFamily.sans.includes('Inter')) fonts.push('Inter');
  if (fontFamily.display.includes('Playfair Display')) fonts.push('Playfair Display');
  if (fontFamily.display.includes('DM Serif Display')) fonts.push('DM Serif Display');
  
  return [...new Set(fonts)];
}

export function generateAllThemeCSS(): string {
  const cssParts: string[] = [];
  const modeLabels: Array<{ class: string; mode: 'light' | 'dark' }> = [
    { class: '', mode: 'light' },
    { class: '.dark', mode: 'dark' },
  ];
  
  for (const [themeId, theme] of Object.entries(themes)) {
    for (const { class: cls, mode } of modeLabels) {
      const selector = cls ? `[data-theme="${themeId}"]${cls}` : `[data-theme="${themeId}"]`;
      const semanticData = mode === 'light' ? theme.semantic.light : theme.semantic.dark;
      const vars = flattenSemanticTokens(themeId, mode, theme.colors, semanticData, theme.shadows, theme.radius);
      
      // Add font family vars
      vars['font-sans'] = theme.typography.fontFamily.sans;
      vars['font-display'] = theme.typography.fontFamily.display;
      vars['font-mono'] = theme.typography.fontFamily.mono;
      
      // Add opacity vars
      vars['opacity-disabled'] = '0.5';
      vars['opacity-muted'] = '0.7';
      vars['opacity-subtle'] = '0.1';
      vars['opacity-light'] = '0.2';
      vars['opacity-medium'] = '0.3';
      vars['opacity-strong'] = '0.4';
      vars['opacity-hover'] = '0.9';
      vars['opacity-active'] = '0.8';
      
      const css = `${selector} {\n${cssVarsToString(vars, '  ')}}\n`;
      cssParts.push(css);
    }
  }
  
  return cssParts.join('\n');
}

// Store theme config in localStorage
const STORAGE_KEY = 'drawrun-theme-config';

export function saveThemeConfig(config: ThemeConfig): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }
}

export function loadThemeConfig(): ThemeConfig {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
    // Check for system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return { theme: 'trail', mode: prefersDark ? 'dark' : 'light' };
  }
  return { theme: 'trail', mode: 'dark' };
}
