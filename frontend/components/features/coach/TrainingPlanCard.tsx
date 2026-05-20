/* eslint-disable unused-imports/no-unused-vars */
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button, Badge, Modal } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { TrainingPlan } from '@/types';
import { Calendar, ChevronRight, ChevronLeft, Target } from 'lucide-react';

interface TrainingPlanCardProps {
  plan: TrainingPlan;
  onDelete?: () => void;
}

export function TrainingPlanCard({ plan, onDelete }: TrainingPlanCardProps) {
  const [expandedWeek, setExpandedWeek] = useState(plan.currentWeek);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<typeof plan.weeks[0]['sessions'][0] | null>(null);

  const phases = {
    'Foundation': { color: 'var(--success)', label: 'Phase I - Fondation' },
    'Development': { color: 'var(--primary)', label: 'Phase II - Développement' },
    'Intensity': { color: 'var(--peak)', label: 'Phase III - Intensité' },
    'Peak': { color: 'var(--danger)', label: 'Phase IV - Affûtage' },
    'Recovery': { color: 'var(--muted)', label: 'Semaine de récupération' },
  };

  const weekPhase = phases[plan.weeks[expandedWeek - 1]?.phase as keyof typeof phases];

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/20 to-secondary/20">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{plan.name}</CardTitle>
              <p className="text-sm text-muted mt-1">
                {plan.target} • Semaine {plan.currentWeek}/{plan.durationWeeks}
              </p>
            </div>
            <Badge variant="primary" size="md">
              {Math.round((plan.currentWeek / plan.durationWeeks) * 100)}%
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="flex border-b border-border">
            {plan.weeks.map((week) => (
              <button
                key={week.week}
                onClick={() => setExpandedWeek(week.week)}
                className={cn(
                  'flex-1 py-3 text-sm font-medium transition-colors',
                    expandedWeek === week.week
                    ? 'bg-surface text-foreground'
                    : 'text-muted hover:text-foreground hover:bg-surface/50'
                )}
              >
                S{week.week}
              </button>
            ))}
          </div>

          <div className="p-4">
            {weekPhase && (
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
                style={{ backgroundColor: `${weekPhase.color}20`, color: weekPhase.color }}
              >
                {weekPhase.label}
              </div>
            )}

            <div className="space-y-3">
              {plan.weeks[expandedWeek - 1]?.sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    setSelectedSession(session);
                    setShowDetailModal(true);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-background hover:bg-background/80 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/20 text-primary font-medium">
                    {session.day}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{session.title}</p>
                    <p className="text-sm text-muted">{session.type}</p>
                  </div>
                  {session.completed ? (
                    <Badge variant="success" size="sm">Complété</Badge>
                  ) : (
                    <Badge variant="default" size="sm">À faire</Badge>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted" />
                </button>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="ghost" size="sm" leftIcon={<ChevronLeft className="w-4 h-4" />} disabled={expandedWeek <= 1} onClick={() => setExpandedWeek(expandedWeek - 1)}>
            Semaine précédente
          </Button>
          <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />} disabled={expandedWeek >= plan.durationWeeks} onClick={() => setExpandedWeek(expandedWeek + 1)}>
            Semaine suivante
          </Button>
        </CardFooter>
      </Card>

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedSession?.title || 'Détails de la séance'}
        size="lg"
      >
        {selectedSession && (
          <div className="space-y-4">
            <div className="flex gap-4 text-sm text-muted">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Semaine {expandedWeek}, Jour {selectedSession.day}
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                {selectedSession.type}
              </span>
            </div>

            <p className="text-muted">{selectedSession.description}</p>

            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Structure de la séance</h4>
              {selectedSession.steps.map((step, index) => (
                <div key={step.id} className="flex items-start gap-3 p-3 rounded-lg bg-background">
                  <span className="w-6 h-6 rounded-full bg-surface flex items-center justify-center text-xs text-muted flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{step.description}</p>
                    <p className="text-sm text-muted">
                      {step.duration}
                      {step.targetType !== 'none' && step.targetValue && ` • ${step.targetValue}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <Button className="flex-1">Commencer la séance</Button>
              <Button variant="secondary">Marquer comme complété</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
