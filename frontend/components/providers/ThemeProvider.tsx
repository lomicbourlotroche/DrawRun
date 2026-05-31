'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { ThemeConfig } from '@/themes';
import { loadThemeConfig, saveThemeConfig, getThemeFonts } from '@/themes';

interface ThemeContextType {
  theme: string;
  mode: 'light' | 'dark';
  setTheme: (_theme: string) => void;
  setMode: (_mode: 'light' | 'dark') => void;
  toggleMode: () => void;
  config: ThemeConfig;
}

const defaultContext: ThemeContextType = {
  theme: 'trail',
  mode: 'dark',
  setTheme: () => {},
  setMode: () => {},
  toggleMode: () => {},
  config: { theme: 'trail', mode: 'dark' },
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

function loadGoogleFonts(fonts: string[]) {
  const families = fonts
    .map((f) => f.replace(/ /g, '+'))
    .join('&family=');
  if (!families) return;
  const id = 'drawrun-fonts';
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${families}:wght@300;400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
}

function applyThemeConfig(config: ThemeConfig) {
  const root = document.documentElement;
  root.setAttribute('data-theme', config.theme);
  root.classList.toggle('dark', config.mode === 'dark');
  saveThemeConfig(config);
  loadGoogleFonts(getThemeFonts(config.theme));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ThemeConfig>({ theme: 'trail', mode: 'dark' });

  useEffect(() => {
    const saved = loadThemeConfig();
    setConfig(saved);
    applyThemeConfig(saved);
  }, []);

  const setTheme = useCallback((theme: string) => {
    setConfig((prev: ThemeConfig) => {
      const next = { ...prev, theme };
      applyThemeConfig(next);
      return next;
    });
  }, []);

  const setMode = useCallback((mode: 'light' | 'dark') => {
    setConfig((prev: ThemeConfig) => {
      const next = { ...prev, mode };
      applyThemeConfig(next);
      return next;
    });
  }, []);

  const toggleMode = useCallback(() => {
    setConfig((prev: ThemeConfig): ThemeConfig => {
      const next: ThemeConfig = { ...prev, mode: prev.mode === 'dark' ? 'light' : 'dark' };
      applyThemeConfig(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme: config.theme,
        mode: config.mode,
        setTheme,
        setMode,
        toggleMode,
        config,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
