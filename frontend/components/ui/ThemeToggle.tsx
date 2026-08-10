'use client';

import { useTheme } from '../providers/ThemeProvider';
import { Sun, Moon } from '@/components/ui/icons';

export function ThemeToggle() {
  const { mode, toggleMode } = useTheme();

  return (
    <button
      onClick={toggleMode}
      className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-muted hover:text-primary hover:bg-primary-50 transition-colors"
      title={mode === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
    >
      {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
