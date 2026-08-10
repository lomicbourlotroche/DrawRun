'use client';

import { useState, useEffect } from 'react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent, Button } from '@/components/ui';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { api } from '@/lib/api';
import { Sun, Moon, Monitor, Globe, Layout } from '@/components/ui/icons';
import { toast } from 'sonner';

export function PreferencesSection() {
  const { language, setLanguage } = useLanguage();
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [density, setDensity] = useState<'compact' | 'normal' | 'comfortable'>('normal');
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const prefs = await api.getPreferences();
        if (prefs.theme) setTheme(prefs.theme as 'light' | 'dark' | 'auto');
        if (prefs.units) setUnits(prefs.units as 'metric' | 'imperial');
      } catch { /* silencieux */ }
    };
    load();
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    api.updatePreferences({ theme: newTheme }).catch(() => {});
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage as 'fr' | 'en' | 'es' | 'de' | 'it' | 'pt');
  };

  const handleUnitsChange = (newUnits: 'metric' | 'imperial') => {
    setUnits(newUnits);
    api.updatePreferences({ units: newUnits }).catch(() => {});
  };

  const savePreferences = async () => {
    setIsSavingPreferences(true);
    try {
      await api.updatePreferences({ theme, units, density, language });
      toast.success('Préférences sauvegardées');
    } catch {
      toast.error('Erreur lors de la sauvegarde des préférences');
    } finally {
      setIsSavingPreferences(false);
    }
  };

  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle className="flex items-center gap-2">
          <Monitor className="w-5 h-5 text-primary" />
          Personnalisation de l&apos;interface
        </GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium mb-3 block">Thème</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleThemeChange('light')}
              className={`p-3 rounded-lg border-2 transition-all ${
                theme === 'light'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Sun className="w-5 h-5 mx-auto mb-1 text-warning" />
              <p className="text-xs">Clair</p>
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`p-3 rounded-lg border-2 transition-all ${
                theme === 'dark'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Moon className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-xs">Sombre</p>
            </button>
            <button
              onClick={() => handleThemeChange('auto')}
              className={`p-3 rounded-lg border-2 transition-all ${
                theme === 'auto'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Monitor className="w-5 h-5 mx-auto mb-1 text-muted" />
              <p className="text-xs">Auto</p>
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-3 block">Unités</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleUnitsChange('metric')}
              className={`p-3 rounded-lg border-2 transition-all ${
                units === 'metric'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <p className="text-sm font-medium">Métrique</p>
              <p className="text-xs text-muted">km, kg, m</p>
            </button>
            <button
              onClick={() => handleUnitsChange('imperial')}
              className={`p-3 rounded-lg border-2 transition-all ${
                units === 'imperial'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <p className="text-sm font-medium">Impérial</p>
              <p className="text-xs text-muted">mi, lbs, ft</p>
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-3 block flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Langue
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleLanguageChange('fr')}
              className={`p-3 rounded-lg border-2 transition-all ${
                language === 'fr'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <p className="text-sm font-medium">Français</p>
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`p-3 rounded-lg border-2 transition-all ${
                language === 'en'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <p className="text-sm font-medium">English</p>
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-3 block flex items-center gap-2">
            <Layout className="w-4 h-4" />
            Densité de l&apos;interface
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setDensity('compact')}
              className={`p-3 rounded-lg border-2 transition-all ${
                density === 'compact'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <p className="text-sm font-medium">Compact</p>
              <p className="text-xs text-muted">Moins d&apos;espace</p>
            </button>
            <button
              onClick={() => setDensity('normal')}
              className={`p-3 rounded-lg border-2 transition-all ${
                density === 'normal'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <p className="text-sm font-medium">Normal</p>
              <p className="text-xs text-muted">Équilibré</p>
            </button>
            <button
              onClick={() => setDensity('comfortable')}
              className={`p-3 rounded-lg border-2 transition-all ${
                density === 'comfortable'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <p className="text-sm font-medium">Confort</p>
              <p className="text-xs text-muted">Plus d&apos;espace</p>
            </button>
          </div>
        </div>

        <Button onClick={savePreferences} isLoading={isSavingPreferences} className="w-full">
          Sauvegarder les préférences
        </Button>
      </GlassCardContent>
    </GlassCard>
  );
}
