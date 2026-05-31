'use client';

import { useTheme } from '@/components/providers/ThemeProvider';
import { themeList, type ThemeDefinition } from '@/themes';
import { Sun, Moon, Check } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

const themePreviewColors: Record<string, { primary: string; secondary: string }> = {
  trail: { primary: '#E05A3A', secondary: '#2D5A3E' },
  peak: { primary: '#2563EB', secondary: '#475569' },
  apex: { primary: '#D4AF37', secondary: '#7F1D3C' },
  kompak: { primary: '#E3543E', secondary: '#1D2B3E' },
};

function ThemeCard({ definition, active, onSelect }: { definition: ThemeDefinition; active: boolean; onSelect: () => void }) {
  const colors = themePreviewColors[definition.id] || themePreviewColors.trail;

  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative flex flex-col items-start gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left w-full',
        active
          ? 'border-primary bg-primary/10 shadow-sm'
          : 'border-border hover:border-primary/30 hover:bg-background'
      )}
    >
      {active && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <Check size={14} className="text-white" />
        </div>
      )}

      <div className="flex items-center gap-3 w-full">
        <div className="flex -space-x-1.5">
          <div className="w-8 h-8 rounded-full border-2 border-white" style={{ backgroundColor: colors.primary }} />
          <div className="w-8 h-8 rounded-full border-2 border-white" style={{ backgroundColor: colors.secondary }} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground">{definition.name}</p>
          <p className="text-xs text-muted truncate">{definition.description}</p>
        </div>
      </div>

      <div className="flex gap-1.5 w-full">
        <div className="flex-1 h-2 rounded-full opacity-60" style={{ backgroundColor: colors.primary }} />
        <div className="flex-1 h-2 rounded-full opacity-40" style={{ backgroundColor: colors.primary }} />
        <div className="flex-1 h-2 rounded-full opacity-20" style={{ backgroundColor: colors.primary }} />
      </div>

      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: i === 1 ? colors.primary : 'var(--neutral-300)' }} />
        ))}
      </div>
    </button>
  );
}

export default function AppearancePage() {
  const { theme, mode, setTheme, setMode } = useTheme();

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Apparence</h2>
        <p className="text-sm text-muted mt-1">Personnalisez l&apos;apparence de DrawRun</p>
      </div>

      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">Mode d&apos;affichage</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode('light')}
            className={cn(
              'flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200',
              mode === 'light'
                ? 'border-primary bg-primary/10 shadow-sm'
                : 'border-border hover:border-primary/30 hover:bg-background'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
               mode === 'light' ? 'bg-primary text-white' : 'bg-surface text-muted'
            )}>
              <Sun size={20} />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm text-foreground">Clair</p>
              <p className="text-xs text-muted">Fonds clairs, textes foncés</p>
            </div>
            {mode === 'light' && (
              <Check size={18} className="text-primary ml-auto flex-shrink-0" />
            )}
          </button>

          <button
            onClick={() => setMode('dark')}
            className={cn(
              'flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200',
              mode === 'dark'
                ? 'border-primary bg-primary/10 shadow-sm'
                : 'border-border hover:border-primary/30 hover:bg-background'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
               mode === 'dark' ? 'bg-primary text-white' : 'bg-surface text-muted'
            )}>
              <Moon size={20} />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm text-foreground">Sombre</p>
              <p className="text-xs text-muted">Fonds foncés, textes clairs</p>
            </div>
            {mode === 'dark' && (
              <Check size={18} className="text-primary ml-auto flex-shrink-0" />
            )}
          </button>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">Thème de couleurs</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {themeList.map((t) => (
            <ThemeCard
              key={t.id}
              definition={t}
              active={theme === t.id}
              onSelect={() => setTheme(t.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
