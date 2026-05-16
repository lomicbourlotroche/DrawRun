'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { api } from '@/lib/api';
import { MessageSquare, Frown, Meh, Smile, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface SessionFeedbackProps {
  session: {
    week: number;
    day: number;
    type: string;
    title: string;
    description: string;
    duration: string;
  };
  planId: number;
  sessionNumber: number;
  onComplete: () => void;
}

export default function SessionFeedback({ session, planId, sessionNumber, onComplete }: SessionFeedbackProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [rpe, setRpe] = useState<number>(5);
  const [hasPain, setHasPain] = useState(false);
  const [painLocation, setPainLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const difficultyOptions = [
    { value: 'easy', label: 'Facile', icon: Smile, color: 'text-success/80' },
    { value: 'normal', label: 'Normal', icon: Meh, color: 'text-primary/80' },
    { value: 'hard', label: 'Difficile', icon: Frown, color: 'text-peak/80' },
  ];

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

      toast.success('Feedback enregistré !');
      onComplete();
    } catch {
      toast.error('Erreur lors de l\'envoi du feedback');
    } finally {
      setIsLoading(false);
    }
  };

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
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Difficulty selection */}
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
                className={`flex flex-col items-center p-4 rounded-lg border transition-all ${
                  selectedDifficulty === option.value
                    ? 'bg-primary/20 border-primary'
                    : 'bg-background border-border hover:border-primary/50'
                }`}
              >
                <option.icon className={`w-6 h-6 ${option.color}`} />
                <span className="text-sm mt-2">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* RPE Scale */}
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
              className="flex-1"
            />
            <span className="text-xs text-muted">10</span>
          </div>
          <p className="text-center text-sm text-muted mt-1">{rpe}/10</p>
        </div>

        {/* Pain */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="hasPain"
              checked={hasPain}
              onChange={(e) => setHasPain(e.target.checked)}
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
            placeholder="Commentaires, ressentis, conditions météo..."
            className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground h-24"
          />
        </div>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          isLoading={isLoading}
          className="w-full"
        >
          Valider
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}