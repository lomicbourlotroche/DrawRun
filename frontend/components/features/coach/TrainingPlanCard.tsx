/* eslint-disable unused-imports/no-unused-vars */
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button, Badge, Modal } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { TrainingPlan, TrainingSession } from '@/types';
import { Calendar, ChevronRight, ChevronLeft, Target, MessageSquare } from 'lucide-react';
import SessionFeedback from './SessionFeedback';
import SessionResultIndicator from './SessionResultIndicator';

interface TrainingPlanCardProps {
  plan: TrainingPlan;
  onDelete?: () => void;
  onSessionComplete?: (session: TrainingSession) => void;
}

// Couleurs des phases bases sur les tokens metiers
const phases = {
  'Foundation': { color: 'var(--hr-zone-1)', label: 'Phase I - Fondation', bg: 'var(--hr-zone-1/20)' },
  'Development': { color: 'var(--hr-zone-2)', label: 'Phase II - Developpement', bg: 'var(--hr-zone-2/20)' },
  'Intensity': { color: 'var(--hr-zone-3)', label: 'Phase III - Intensite', bg: 'var(--hr-zone-3/20)' },
  'Peak': { color: 'var(--hr-zone-4)', label: 'Phase IV - Affutage', bg: 'var(--hr-zone-4/20)' },
  'Recovery': { color: 'var(--mutable)', label: 'Semaine de recuperation', bg: 'var(--mutable/20)' },
};

// Couleurs des types de seance bases sur les tokens metiers
const sessionTypeColors: Record<string, { bg: string; text: string }> = {
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
};

// Mapper les types francais
const SESSION_TYPE_MAP: Record<string, string> = {
  'Seuil': 'Tempo',
  'Fractionne': 'Interval',
  'Regeneration': 'Recovery',
  'Course': 'Race',
};

const getSessionTypeColor = (type: string) => {
  const mappedType = SESSION_TYPE_MAP[type] || type;
  return sessionTypeColors[mappedType] || sessionTypeColors['Endurance'];
};

// Mapper le result a un indicateur visuel
const getResultIndicator = (session: TrainingSession) => {
  if (!session.completed) return null;
  
  const s = session as unknown as Record<string, unknown>;
  if (s.result) {
    return <SessionResultIndicator result={s.result as 'success' | 'failed' | 'partial' | 'skipped'} size="sm" />;
  }
  
  if (s.feedback) {
    const feedback = s.feedback as { difficulty?: string };
    if (feedback.difficulty === 'easy') return <SessionResultIndicator result="success" size="sm" />;
    if (feedback.difficulty === 'normal') return <SessionResultIndicator result="success" size="sm" />;
    if (feedback.difficulty === 'hard') return <SessionResultIndicator result="partial" size="sm" />;
  }
  
  return <SessionResultIndicator result="success" size="sm" />;
};

export function TrainingPlanCard({ plan, onDelete, onSessionComplete }: TrainingPlanCardProps) {
  const [expandedWeek, setExpandedWeek] = useState(plan.currentWeek);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);

  const weekPhase = phases[plan.weeks[expandedWeek - 1]?.phase as keyof typeof phases] || phases.Foundation;

  const handleMarkComplete = (session: TrainingSession) => {
    // Marquer comme completé
    // En vrai, ca devrait appeler l'API
    onSessionComplete?.({ ...session, completed: true } as TrainingSession);
    setShowDetailModal(false);
    setSelectedSession(null);
  };

  const handleSessionClick = (session: TrainingSession) => {
    setSelectedSession(session);
    setShowDetailModal(true);
  };

  const handleGiveFeedback = (session: TrainingSession) => {
    setSelectedSession(session);
    setShowDetailModal(false);
    setShowFeedbackModal(true);
  };

  const handleFeedbackComplete = () => {
    setShowFeedbackModal(false);
    setSelectedSession(null);
    // Recharger ou notifier le parent
  };

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
                style={{ backgroundColor: weekPhase.bg, color: weekPhase.color }}
              >
                {weekPhase.label}
              </div>
            )}

            <div className="space-y-3">
              {plan.weeks[expandedWeek - 1]?.sessions.map((session) => {
                const typeColor = getSessionTypeColor(session.type);
                const resultIndicator = getResultIndicator(session);
                
                return (
                  <button
                    key={session.id}
                    onClick={() => handleSessionClick(session)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-background hover:bg-background/80 transition-colors text-left group"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: typeColor.bg }}>
                      <span className="font-medium" style={{ color: typeColor.text }}>{session.day}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{session.title}</p>
                      <p className="text-sm text-muted">{session.type}</p>
                    </div>
                    
                    {/* Indicateur de resultat */}
                    {session.completed && (
                      <div className="flex items-center gap-2">
                        {resultIndicator}
                        {!!(session as unknown as Record<string, unknown>).feedback && (
                          <Badge variant="default" size="sm" className="bg-muted/50">
                            RPE: {((session as unknown as Record<string, unknown>).feedback as { rpe?: number }).rpe}/10
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {!session.completed ? (
                      <Badge variant="default" size="sm">A faire</Badge>
                    ) : (
                      <Badge variant="success" size="sm">Completee</Badge>
                    )}
                    
                    <ChevronRight className="w-4 h-4 text-muted group-hover:translate-x-0.5 transition-transform" />
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="ghost" size="sm" leftIcon={<ChevronLeft className="w-4 h-4" />} disabled={expandedWeek <= 1} onClick={() => setExpandedWeek(expandedWeek - 1)}>
            Semaine precedente
          </Button>
          <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />} disabled={expandedWeek >= plan.durationWeeks} onClick={() => setExpandedWeek(expandedWeek + 1)}>
            Semaine suivante
          </Button>
        </CardFooter>
      </Card>

      {/* Modal de details de la seance */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedSession?.title || 'Details de la seance'}
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
              <h4 className="font-medium text-foreground">Structure de la seance</h4>
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

            {/* Indicateur de resultat et feedback existant */}
            {selectedSession.completed && (
              <div className="pt-4 border-t border-border">
                <h4 className="font-medium text-foreground mb-3">Resultat</h4>
                <div className="flex items-center gap-4">
                  {getResultIndicator(selectedSession)}
                  {!!(selectedSession as unknown as Record<string, unknown>).feedback && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted">Difficulte:</span>
                        <Badge variant="default" size="sm">
                          {((selectedSession as unknown as Record<string, unknown>).feedback as { difficulty?: string }).difficulty}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted">RPE:</span>
                        <Badge variant="default" size="sm">
                          {((selectedSession as unknown as Record<string, unknown>).feedback as { rpe?: number }).rpe}/10
                        </Badge>
                      </div>
                      {((selectedSession as unknown as Record<string, unknown>).feedback as { hasPain?: boolean; painLocation?: string }).hasPain && (
                        <div className="text-sm text-danger">
                          ⚠️ Douleur: {((selectedSession as unknown as Record<string, unknown>).feedback as { painLocation?: string }).painLocation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {!Boolean((selectedSession as unknown as Record<string, unknown>).feedback) && (
                  <div className="mt-4 p-4 rounded-lg bg-surface border border-border">
                    <p className="text-sm text-muted mb-3">
                      Donnez votre feedback pour cette seance
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleGiveFeedback(selectedSession)}
                      leftIcon={<MessageSquare className="w-4 h-4" />}
                    >
                      Donner un feedback
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t border-border">
              {selectedSession.completed ? (
                <>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleGiveFeedback(selectedSession)}
                    leftIcon={<MessageSquare className="w-4 h-4" />}
                    disabled={!!(selectedSession as unknown as Record<string, unknown>).feedback}
                  >
                    {(selectedSession as unknown as Record<string, unknown>).feedback ? 'Feedback deja donne' : 'Donner un feedback'}
                  </Button>
                </>
              ) : (
                <>
                  <Button className="flex-1" onClick={() => handleMarkComplete(selectedSession)}>
                    Marquer comme completee
                  </Button>
                  <Button variant="secondary" onClick={() => handleMarkComplete(selectedSession)}>
                    Commencer la seance
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de feedback */}
      {selectedSession && (
        <Modal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          title="Feedback de la seance"
          size="lg"
        >
          <SessionFeedback
            session={{
              week: expandedWeek,
              day: selectedSession.day,
              type: selectedSession.type,
              title: selectedSession.title,
              description: selectedSession.description,
              duration: selectedSession.steps.reduce((acc, step) => acc + (parseFloat(step.duration) || 0), 0) + ' min',
              actualResult: {
                completed: true,
                onTime: true,
                difficulty: 'normal',
              },
            }}
            planId={Number(plan.id)}
            sessionNumber={expandedWeek * 7 + selectedSession.day}
            onComplete={handleFeedbackComplete}
            onResult={(result) => {
              // Mettre a jour la session localement
              if (selectedSession) {
                const updatedSession = { ...selectedSession, result };
                setSelectedSession(updatedSession);
              }
            }}
          />
        </Modal>
      )}
    </>
  );
}
