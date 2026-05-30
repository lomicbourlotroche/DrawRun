'use client';

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import type { TrainingPlan, TrainingWeek, TrainingSession } from '@/types';

export interface GanttChartProps {
  plan: TrainingPlan;
  onSessionClick?: (_session: TrainingSession, _week: TrainingWeek) => void;
}

// Couleurs des phases basées sur les tokens métiers
const PHASE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Foundation: { bg: 'var(--hr-zone-1/20)', text: 'var(--hr-zone-1)', border: 'var(--hr-zone-1/30)' },
  Development: { bg: 'var(--hr-zone-2/20)', text: 'var(--hr-zone-2)', border: 'var(--hr-zone-2/30)' },
  Intensity: { bg: 'var(--hr-zone-3/20)', text: 'var(--hr-zone-3)', border: 'var(--hr-zone-3/30)' },
  Peak: { bg: 'var(--hr-zone-4/20)', text: 'var(--hr-zone-4)', border: 'var(--hr-zone-4/30)' },
  Recovery: { bg: 'var(--mutable/20)', text: 'var(--mutable)', border: 'var(--mutable/30)' },
  Tapering: { bg: 'var(--peak/20)', text: 'var(--peak)', border: 'var(--peak/30)' },
  Base: { bg: 'var(--surface/20)', text: 'var(--foreground)', border: 'var(--border/30)' },
};

// Types de séance et leurs couleurs basées sur les tokens métiers
const SESSION_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  'Endurance': { bg: 'var(--hr-zone-1/80)', text: 'var(--hr-zone-1)' },
  'Interval': { bg: 'var(--hr-zone-4/80)', text: 'var(--hr-zone-4)' },
  'Tempo': { bg: 'var(--hr-zone-3/80)', text: 'var(--hr-zone-3)' },
  'Recovery': { bg: 'var(--mutable/80)', text: 'var(--mutable)' },
  'Long Run': { bg: 'var(--hr-zone-2/80)', text: 'var(--hr-zone-2)' },
  'Hill': { bg: 'var(--peak/80)', text: 'var(--peak)' },
  'Speed': { bg: 'var(--hr-zone-4/80)', text: 'var(--hr-zone-4)' },
  'Fartlek': { bg: 'var(--hr-zone-3/80)', text: 'var(--hr-zone-3)' },
  'Progression': { bg: 'var(--hr-zone-3/80)', text: 'var(--hr-zone-3)' },
  'Race': { bg: 'var(--danger)', text: 'var(--danger-foreground)' },
  'Test': { bg: 'var(--peak)', text: 'var(--peak-foreground)' },
  'Warmup': { bg: 'var(--hr-zone-1/60)', text: 'var(--hr-zone-1)' },
  'Cooldown': { bg: 'var(--mutable/60)', text: 'var(--mutable)' },
};

// Mapper les types français aux types anglais pour la compatibilité
const SESSION_TYPE_MAP: Record<string, string> = {
  'Seuil': 'Tempo',
  'Fractionne': 'Interval',
  'Regeneration': 'Recovery',
  'Course': 'Race',
};

export function GanttChart({ plan, onSessionClick }: GanttChartProps) {
  // Générer les jours de la semaine pour l'affichage
  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Calculer la largeur de chaque cellule (en %)
  const cellWidth = useMemo(() => {
    return '14.28%';
  }, []);

  // Handler pour cliquer sur une séance
  const handleSessionClick = (week: TrainingWeek, session: TrainingSession) => {
    onSessionClick?.(session, week);
  };

  const getSessionStyle = (type: string) => {
    const mappedType = SESSION_TYPE_MAP[type] || type;
    return SESSION_TYPE_COLORS[mappedType] || SESSION_TYPE_COLORS['Endurance'];
  };

  const getPhaseStyle = (phase: string) => {
    return PHASE_COLORS[phase] || PHASE_COLORS.Base;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg">Visualisation du plan d&apos;entrainement</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Légende des phases */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex flex-wrap gap-3">
            {Object.entries(PHASE_COLORS).map(([phase, colors]) => {
              const hasPhase = plan.weeks.some(w => w.phase === phase);
              if (!hasPhase) return null;
              return (
                <div key={phase} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.bg }}
                    aria-label={`Couleur ${phase}`}
                  />
                  <span className="text-xs text-muted">{phase}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* En-tête avec les semaines */}
        <div className="flex border-b border-border">
          <div className="w-20 p-3 text-xs font-medium text-muted border-r border-border">
            Jour
          </div>
          {plan.weeks.map((week) => (
            <div
              key={week.week}
              className={`flex-1 p-3 text-center text-xs font-medium ${week.phase === 'Recovery' ? 'bg-muted/10' : 'bg-surface'}`}
              style={{ minWidth: cellWidth }}
            >
              <div className="flex flex-col">
                <span className="font-medium text-foreground">S{week.week}</span>
                <span className="text-xs text-muted">
                  {week.phase.length > 10 ? week.phase.substring(0, 8) + '...' : week.phase}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Lignes pour chaque jour (1-7) */}
        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
          // Trouver toutes les séances pour ce jour dans toutes les semaines
          const sessionsByWeek = plan.weeks.map((week) => {
            const session = week.sessions.find((s) => s.day === day);
            return { week, session };
          });

          return (
            <div key={day} className="flex border-b border-border last:border-b-0">
              {/* Label du jour */}
              <div className="w-20 p-3 text-xs font-medium text-muted border-r border-border flex items-center justify-center bg-surface">
                {daysOfWeek[day - 1]}
              </div>

              {/* Cellules pour chaque semaine */}
              {sessionsByWeek.map(({ week, session }) => {
                const phase = getPhaseStyle(week.phase);
                
                if (!session) {
                  return (
                    <div
                      key={`${week.week}-${day}`}
                      className={`flex-1 p-1 border-r border-border last:border-r-0`}
                      style={{ 
                        minWidth: cellWidth,
                        backgroundColor: phase.bg,
                        borderLeft: `1px solid ${phase.border}`
                      }}
                    />
                  );
                }

                const sessionStyle = getSessionStyle(session.type);
                const isCompleted = session.completed;

                return (
                  <button
                    key={`${week.week}-${day}`}
                    onClick={() => handleSessionClick(week, session)}
                    className={`
                      flex-1 p-1 border-r border-border last:border-r-0
                      relative group
                    `}
                    style={{ minWidth: cellWidth }}
                    aria-label={`Seance: ${session.title}, Semaine ${week.week}, Jour ${day}`}
                  >
                    {/* Tooltip invisible qui apparaît au hover */}
                    <div
                      className="absolute z-10 hidden group-hover:block bg-foreground text-background px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg -top-8 left-1/2 -translate-x-1/2"
                      style={{ minWidth: 'max-content' }}
                    >
                      <div className="font-medium">{session.title}</div>
                      <div className="text-muted-foreground text-xs">{session.type}</div>
                      {session.completed && (
                        <div className="text-success-400 text-xs">Completee</div>
                      )}
                    </div>

                    {/* Barre de séance */}
                    <div
                      className={`
                        h-6 rounded transition-all hover:scale-105 hover:shadow-md
                        ${isCompleted ? 'opacity-100 ring-2 ring-foreground/20' : 'opacity-90'}
                      `}
                      style={{ backgroundColor: sessionStyle.bg }}
                      title={`${session.title} (${session.type})${isCompleted ? ' - Completee' : ''}`}
                    />

                    {/* Indicateur de complétion */}
                    {isCompleted && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <svg className="w-4 h-4 text-background" fill="none" viewBox="0 0 24 24">
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}

        {/* Ligne de progression actuelle */}
        <div className="relative h-1 bg-background">
          <div
            className="absolute top-0 left-0 h-full bg-primary transition-all"
            style={{
              width: `${((plan.currentWeek - 1) / plan.durationWeeks) * 100}%`,
              left: '20%',
            }}
          />
          <div
            className="absolute top-0 h-full w-1 bg-primary"
            style={{
              left: `calc(20% + ${((plan.currentWeek - 1) / plan.durationWeeks) * 100}%)`,
            }}
          />
        </div>

        {/* Légende des types de séance */}
        <div className="px-6 py-4 border-t border-border">
          <div className="text-xs text-muted mb-2">Types de séance</div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(SESSION_TYPE_COLORS).map(([type, style]) => {
              const hasType = plan.weeks.some(w => w.sessions.some(s => {
                const mappedType = SESSION_TYPE_MAP[s.type] || s.type;
                return mappedType === type;
              }));
              if (!hasType) return null;
              return (
                <div key={type} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: style.bg }} />
                  <span className="text-xs text-muted">{type}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Résumé du plan */}
        <div className="px-6 py-4 border-t border-border bg-surface/50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">{plan.durationWeeks}</span>
              <span className="text-xs text-muted">Semaines</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground">
                {plan.weeks.reduce((acc, week) => acc + week.sessions.length, 0)}
              </span>
              <span className="text-xs text-muted">Seances</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-primary">
                {Math.round((plan.currentWeek / plan.durationWeeks) * 100)}%
              </span>
              <span className="text-xs text-muted">Avancement</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default GanttChart;
