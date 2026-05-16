'use client';

import { useState } from 'react';
import { Button, Modal } from '@/components/ui';
import { api } from '@/lib/api';
import { AlertTriangle, Activity, Briefcase, Plane, CloudOff, Frown, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface MissedSessionDialogProps {
  planId: number;
  sessionId: number;
  sessionName: string;
  onComplete?: () => void;
}

const reasons = [
  { value: 'injury', label: 'Blessure', icon: AlertTriangle, color: 'text-red-400' },
  { value: 'illness', label: 'Maladie', icon: Activity, color: 'text-orange-400' },
  { value: 'work', label: 'Travail', icon: Briefcase, color: 'text-blue-400' },
  { value: 'travel', label: 'Voyage', icon: Plane, color: 'text-purple-400' },
  { value: 'fatigue', label: 'Fatigue', icon: CloudOff, color: 'text-yellow-400' },
  { value: 'motivation', label: 'Manque de motivation', icon: Frown, color: 'text-gray-400' },
  { value: 'other', label: 'Autre', icon: HelpCircle, color: 'text-muted' },
];

export default function MissedSessionDialog({
  planId,
  sessionId,
  sessionName,
  onComplete,
}: MissedSessionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Veuillez sélectionner une raison');
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.reportMissedSession({
        planId,
        sessionId,
        reason: reason as 'injury' | 'illness' | 'work' | 'travel' | 'fatigue' | 'motivation' | 'other',
        notes: notes || undefined,
      });

      setRecommendation(result.recommendation);
      toast.success(result.message);
      onComplete?.();
    } catch {
      toast.error('Erreur lors du signalement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(true)}
        leftIcon={<AlertTriangle className="w-4 h-4" />}
      >
        Séance manquée
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => { setIsOpen(false); setRecommendation(null); setReason(''); setNotes(''); }}
        title="Signaler une séance manquée"
        size="md"
      >
        <div className="space-y-4">
          {!recommendation ? (
            <>
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="text-sm text-foreground">
                  <span className="font-medium">Séance :</span> {sessionName}
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Pourquoi avez-vous manqué cette séance ?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {reasons.map((r) => {
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setReason(r.value)}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          reason === r.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${r.color}`} />
                        <span className="text-sm text-foreground">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Notes (optionnel)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informations complémentaires..."
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground min-h-[80px]"
                />
              </div>

              {reason === 'injury' && (
                <div className="p-3 rounded-lg bg-danger/10 border border-red-500/20">
                  <p className="text-sm text-red-400">
                    Prenez le temps de guérir complètement. Le plan sera automatiquement ajusté et une phase de reprise progressive vous sera proposée.
                  </p>
                </div>
              )}

              {reason === 'illness' && (
                <div className="p-3 rounded-lg bg-peak/10 border border-orange-500/20">
                  <p className="text-sm text-orange-400">
                    Reposez-vous et récupérez. Le plan reprendra quand vous serez rétabli.
                  </p>
                </div>
              )}

              {reason === 'fatigue' && (
                <div className="p-3 rounded-lg bg-warning/10 border border-yellow-500/20">
                  <p className="text-sm text-yellow-400">
                    Écoutez votre corps. La récupération fait partie de l&apos;entraînement.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-success/10 border border-green-500/20">
                <p className="font-medium text-foreground mb-2">Recommandation</p>
                <p className="text-sm text-foreground/80">{recommendation}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {!recommendation && (
              <>
                <Button variant="secondary" onClick={() => setIsOpen(false)} className="flex-1">
                  Annuler
                </Button>
                <Button onClick={handleSubmit} isLoading={isLoading} className="flex-1">
                  Signaler
                </Button>
              </>
            )}
            {recommendation && (
              <Button onClick={() => setIsOpen(false)} className="w-full">
                Fermer
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}