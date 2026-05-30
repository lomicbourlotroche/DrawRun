'use client';

import { useMemo } from 'react';
import type { TrainingPlan, TrainingSession } from '@/types';

// Résolution des couleurs Tailwind → valeurs hex pour les styles inline
const TW_COLORS: Record<string, string> = {
  'hr-zone-1': '#00C853',
  'hr-zone-3': '#FFAB00',
  'hr-zone-4': '#FF6D00',
  'peak': '#FF6D00',
  'danger': '#FF5252',
  'success': '#00C853',
  'primary': '#0066FF',
  'muted': '#64748B',
  'warning': '#FFAB00',
};

function resolveColor(twClass: string, defaultFallback = '#64748B20'): string {
  const base = twClass.replace('bg-', '').replace('border-', '').replace('/30', '').replace('/20', '');
  const hex = TW_COLORS[base];
  if (!hex) return defaultFallback;
  const opacity = twClass.includes('/30') ? '4D' : twClass.includes('/20') ? '33' : '';
  return opacity ? hex + opacity : hex;
}

interface PlanGanttChartProps {
  plan: TrainingPlan;
  onSessionClick?: (_week: number, _session: TrainingSession) => void;
}

// Couleurs par type de séance basées sur les tokens métiers
const sessionTypeColors: Record<string, { bg: string; border: string; text: string }> = {
  'Endurance': { bg: 'bg-hr-zone-1/30', border: 'border-hr-zone-1', text: 'text-hr-zone-1' },
  'Tempo': { bg: 'bg-hr-zone-3/30', border: 'border-hr-zone-3', text: 'text-hr-zone-3' },
  'Interval': { bg: 'bg-hr-zone-4/30', border: 'border-hr-zone-4', text: 'text-hr-zone-4' },
  'Seuil': { bg: 'bg-hr-zone-3/30', border: 'border-hr-zone-3', text: 'text-hr-zone-3' },
  'Fractionné': { bg: 'bg-hr-zone-4/30', border: 'border-hr-zone-4', text: 'text-hr-zone-4' },
  'Récupération': { bg: 'bg-hr-zone-1/30', border: 'border-hr-zone-1', text: 'text-hr-zone-1' },
  'Régénération': { bg: 'bg-hr-zone-1/30', border: 'border-hr-zone-1', text: 'text-hr-zone-1' },
  'Test': { bg: 'bg-peak/30', border: 'border-peak', text: 'text-peak' },
  'Course': { bg: 'bg-danger/30', border: 'border-danger', text: 'text-danger' },
  'default': { bg: 'bg-muted/30', border: 'border-muted', text: 'text-muted' },
};

// Couleurs par phase
const phaseColors: Record<string, { bg: string; text: string }> = {
  'Foundation': { bg: 'bg-success/20', text: 'text-success' },
  'Development': { bg: 'bg-primary/20', text: 'text-primary' },
  'Intensity': { bg: 'bg-peak/20', text: 'text-peak' },
  'Peak': { bg: 'bg-danger/20', text: 'text-danger' },
  'Recovery': { bg: 'bg-muted/20', text: 'text-muted' },
};

// Jours de la semaine
const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export function PlanGanttChart({ plan, onSessionClick }: PlanGanttChartProps) {
  const totalWeeks = plan.durationWeeks;
  const weeks = useMemo(() => plan.weeks, [plan.weeks]);

  // Calculer la date de début de chaque semaine
  const weekStartDates = useMemo(() => {
    const startDate = new Date(plan.startDate);
    return weeks.map((_, index) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + (index * 7));
      return date;
    });
  }, [weeks, plan.startDate]);

  // Générer la grille des jours
  const dayGrid = useMemo(() => {
    const grid: { week: number; day: number; date?: Date; session?: TrainingSession }[][] = [];
    
    weeks.forEach((week, weekIndex) => {
      const weekStart = weekStartDates[weekIndex];
      const weekRow: { week: number; day: number; date?: Date; session?: TrainingSession }[] = [];
      
      // Créer 7 jours pour chaque semaine
      for (let day = 0; day < 7; day++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + day);
        
        // Trouver la session pour ce jour
        const session = week.sessions.find(s => s.day === day + 1);
        
        weekRow.push({
          week: week.week,
          day: day + 1,
          date,
          session,
        });
      }
      
      grid.push(weekRow);
    });
    
    return grid;
  }, [weeks, weekStartDates]);

  // Calculer la largeur maximale de la grille
  const gridWidth = useMemo(() => {
    return `${Math.max(7, totalWeeks) * 60 + 100}px`;
  }, [totalWeeks]);

  const getSessionColor = (session: TrainingSession) => {
    return sessionTypeColors[session.type] || sessionTypeColors.default;
  };

  const getPhaseColor = (phase: string) => {
    return phaseColors[phase] || phaseColors.Foundation;
  };

  const handleSessionClick = (week: number, session: TrainingSession) => {
    onSessionClick?.(week, session);
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-fit" style={{ width: gridWidth }}>
        {/* Légende des phases */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(phaseColors).map(([phase, colors]) => {
              const hasPhase = weeks.some(w => w.phase === phase);
              if (!hasPhase) return null;
              return (
                <div key={phase} className="flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: resolveColor(colors.bg) }}
                  />
                  <span className="text-xs text-muted">{phase}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* En-têtes des semaines */}
        <div className="flex">
          <div className="w-10 flex-shrink-0" />
          {weeks.map((week) => (
            <div
              key={week.week}
              className="w-14 flex-shrink-0 text-center p-2 border border-border"
            >
              <span className="text-xs font-medium text-foreground">S{week.week}</span>
              <div className="text-xs text-muted truncate">
                {weekStartDates[week.week - 1]?.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          ))}
        </div>

        {/* Grille des jours */}
        <div className="flex border-t border-border">
          {/* Colonne des jours */}
          <div className="w-10 flex-shrink-0">
            {daysOfWeek.map((day, _index) => (
              <div
                key={day}
                className="h-14 flex items-center justify-center text-xs font-medium text-muted border-r border-b border-border"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Cellules des séances */}
          {dayGrid.map((weekRow, weekIndex) => (
            <div key={weekIndex} className="flex">
              {weekRow.map((cell, _dayIndex) => {
                const session = cell.session;
                const phase = weeks[weekIndex]?.phase;
                const phaseColor = getPhaseColor(phase || 'Foundation');
                
                if (session) {
                  const color = getSessionColor(session);
                  const isCompleted = session.completed;
                  
                  return (
                    <button
                      key={session.id}
                      onClick={() => handleSessionClick(cell.week, session)}
                      className={`
                        h-14 w-14 flex-shrink-0 relative border border-border
                        ${isCompleted ? 'opacity-60' : 'hover:brightness-110'}
                        transition-all duration-200
                      `}
                      style={{
                        background: resolveColor(color.bg),
                        borderLeft: cell.day === 1 ? `3px solid ${resolveColor(phaseColor.bg)}` : undefined,
                      }}
                      aria-label={`Séance: ${session.title} - Semaine ${cell.week}, Jour ${cell.day}`}
                    >
                      {isCompleted && (
                        <span className="absolute top-1 right-1 w-3 h-3 bg-success rounded-full flex items-center justify-center">
                          <span className="text-[8px] text-white">✓</span>
                        </span>
                      )}
                      <span className={`text-[10px] font-medium truncate px-1 ${color.text}`}>
                        {session.title.slice(0, 3)}
                      </span>
                      <div className="absolute bottom-1 left-1 right-1 h-0.5" style={{ backgroundColor: resolveColor(color.border) }} />
                    </button>
                  );
                }
                
                return (
                  <div
                    key={cell.day}
                    className="h-14 w-14 flex-shrink-0 border-r border-b border-border bg-background"
                    style={{
                      borderLeft: cell.day === 1 ? `3px solid ${resolveColor(phaseColor.bg)}` : undefined,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Légende des types de séance */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted mb-2">Types de séance</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(sessionTypeColors).map(([type, colors]) => {
              const hasType = weeks.some(w => w.sessions.some(s => s.type === type));
              if (!hasType) return null;
              return (
                <div key={type} className="flex items-center gap-2">
                  <span
                    className="w-10 h-4 rounded-sm"
                    style={{
                      background: resolveColor(colors.bg),
                      border: `1px solid ${resolveColor(colors.border)}`,
                    }}
                  />
                  <span className="text-xs text-muted">{type}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
