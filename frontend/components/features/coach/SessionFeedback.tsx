'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Progress } from '@/components/ui';
import { api } from '@/lib/api';
import { MessageSquare, Frown, Meh, Smile, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import SessionResultIndicator from './SessionResultIndicator';

interface SessionFeedbackProps {
  session: {
    week: number;
    day: number;
    type: string;
    title: string;
    description: string;
    duration: string;
    target?: string;
    actualResult?: {
      completed: boolean;
      onTime: boolean;
      difficulty: 'easy' | 'normal' | 'hard';
    };
  };
  planId: number;
  sessionNumber: number;
  onComplete: () => void;
  onResult?: (_result: 'success' | 'failed' | 'partial') => void;
}

// Map les résultats de séance à des indicateurs visuels
const getResultFromFeedback = (difficulty: string, onTime: boolean, completed: boolean): 'success' | 'failed' | 'partial' | 'skipped' => {
  if (!completed) return 'skipped';
  if (difficulty === 'easy' && onTime) return 'success';
  if (difficulty === 'normal' && onTime) return 'success';
  if (difficulty === 'hard' && onTime) return 'partial';
  if (!onTime) return 'partial';
  return 'partial';
};

export default function SessionFeedback({ session, planId, sessionNumber, onComplete, onResult }: SessionFeedbackProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(session.actualResult?.difficulty || null);
  const [rpe, setRpe] = useState<number>(5);
  const [hasPain, setHasPain] = useState(false);
  const [painLocation, setPainLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const difficultyOptions = [
    { value: 'easy', label: 'Facile', icon: Smile, color: 'text-success/80', bg: 'bg-success/20', result: 'success' as const },
    { value: 'normal', label: 'Normal', icon: Meh, color: 'text-primary/80', bg: 'bg-primary/20', result: 'success' as const },
    { value: 'hard', label: 'Difficile', icon: Frown, color: 'text-peak/80', bg: 'bg-peak/20', result: 'partial' as const },
  ];

  // Calculer le résultat actuel
  const currentResult = useMemo(() => {
    if (session.actualResult) {
      return getResultFromFeedback(
        session.actualResult.difficulty || 'normal',
        session.actualResult.onTime || false,
        session.actualResult.completed || false
      );
    }
    return null;
  }, [session.actualResult]);

  // Afficher l'indicateur de résultat après soumission
  const displayResult = useMemo(() => {
    if (isSubmitted && selectedDifficulty) {
      // Simuler un résultat basé sur les réponses
      // En réalité, ça viendrait du backend après analyse
      if (selectedDifficulty === 'easy') return 'success';
      if (selectedDifficulty === 'normal') return 'success';
      if (selectedDifficulty === 'hard') return 'partial';
    }
    return currentResult;
  }, [isSubmitted, selectedDifficulty, currentResult]);

  const handleSubmit = async () => {
    if (!selectedDifficulty) {
      toast.error('Veuillez indiquer la difficulté de la séance');
      return;
    }

    setIsLoading(true);
    try {
      await api.submitPlanFeedback({
        planId,
        sessionNumber,
        feedback: {
          difficulty: selectedDifficulty as 'easy' | 'normal' | 'hard',
          rpe,
          pain: hasPain,
          notes: [notes, hasPain ? `Pain: ${painLocation}` : ''].filter(Boolean).join(' | ') || undefined,
        },
      });

      // Notifier le parent du résultat
      const result: 'success' | 'failed' | 'partial' = selectedDifficulty === 'hard' ? 'partial' : 'success';
      onResult?.(result);
      
      toast.success('Feedback enregistré !');
      setIsSubmitted(true);
      setTimeout(() => onComplete(), 1500);
    } catch {
      toast.error('Erreur lors de l\'envoi du feedback');
    } finally {
      setIsLoading(false);
    }
  };

  // Pourcentage RPE pour la barre de progression
  const rpePercentage = (rpe / 10) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Comment s&apos;est passée votre séance ?
        </CardTitle>
        <p className="text-sm text-muted">
          {session.title} - {session.duration}
        </p>
        
        {/* Indicateur de résultat */}
        {displayResult && (
          <div className="mt-3">
            <SessionResultIndicator result={displayResult} size="md" showLabel />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Difficulty selection avec indicateurs visuels */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Difficulté ressentie
          </label>
          <div className="grid grid-cols-3 gap-3">
            {difficultyOptions.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedDifficulty(option.value)}
                disabled={isSubmitted}
                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                  selectedDifficulty === option.value
                    ? `bg-${option.value === 'easy' ? 'success' : option.value === 'normal' ? 'primary' : 'peak'}/20 border-${option.value === 'easy' ? 'success' : option.value === 'normal' ? 'primary' : 'peak'}`
                    : 'bg-background border-border hover:border-primary/50'
                }`}
              >
                <option.icon className={`w-8 h-8 ${option.color}`} />
                <span className="text-sm mt-2 font-medium">{option.label}</span>
                {selectedDifficulty === option.value && (
                  <SessionResultIndicator 
                    result={option.result} 
                    size="sm" 
                    className="mt-2"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* RPE Scale avec barre de progression */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Effort perçu (RPE)
          </label>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-muted">1</span>
            <input
              type="range"
              min="1"
              max="10"
              value={rpe}
              onChange={(e) => setRpe(parseInt(e.target.value))}
              disabled={isSubmitted}
              className="flex-1 accent-primary"
            />
            <span className="text-xs text-muted">10</span>
          </div>
          <div className="mt-2">
            <Progress value={rpePercentage} className="h-2" />
            <p className="text-center text-sm text-muted mt-1">{rpe}/10</p>
          </div>
          <div className="flex justify-between text-[10px] text-muted mt-1">
            <span>Très facile</span>
            <span>Extrême</span>
          </div>
        </div>

        {/* Indicateur RPE visuel */}
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <span
              key={num}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all ${
                num === rpe 
                  ? 'bg-primary text-white font-bold' 
                  : num < rpe 
                    ? 'bg-primary/30 text-primary/80' 
                    : 'bg-muted/20 text-muted'
              }`}
            >
              {num}
            </span>
          ))}
        </div>

        {/* Pain */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="hasPain"
              checked={hasPain}
              onChange={(e) => setHasPain(e.target.checked)}
              disabled={isSubmitted}
              className="w-5 h-5 rounded border-border bg-background"
            />
            <label htmlFor="hasPain" className="text-sm text-foreground">
              J&apos;ai ressenti une douleur
            </label>
          </div>
          
          {hasPain && (
            <input
              type="text"
              value={painLocation}
              onChange={(e) => setPainLocation(e.target.value)}
              disabled={isSubmitted}
              placeholder="Où ? (ex: genou droit, mollet gauche...)"
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground"
            />
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Notes (optionnel)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitted}
            placeholder="Commentaires, ressentis, conditions météo..."
            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground h-24"
          />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          isLoading={isLoading}
          disabled={isSubmitted}
          className="w-full"
        >
          {isSubmitted ? 'Feedback enregistré ✓' : 'Valider'}
          {!isSubmitted && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
        
        {/* Résumé après soumission */}
        {isSubmitted && displayResult && (
          <div className="mt-4 p-4 rounded-lg bg-surface border border-border">
            <h4 className="font-medium mb-2">Résumé</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted w-24">Difficulté</span>
                <span className="text-sm">{difficultyOptions.find(o => o.value === selectedDifficulty)?.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted w-24">RPE</span>
                <span className="text-sm">{rpe}/10</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted w-24">Résultat</span>
                <SessionResultIndicator result={displayResult} size="sm" showLabel />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
