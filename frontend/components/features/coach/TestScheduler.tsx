/* eslint-disable unused-imports/no-unused-vars */
'use client';

import { useState } from 'react';
import { Button, Modal } from '@/components/ui';
import { api } from '@/lib/api';
import { Activity, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface TestSchedulerProps {
  planId: number;
  onTestScheduled?: () => void;
}

const testTypes = [
  { value: 'vma', label: 'Test VMA (Vitesse Maximale Aérobie)', description: 'Test sur piste de 6 minutes ou semi-Cooper' },
  { value: 'cooper', label: 'Test Cooper', description: 'Courir la plus grande distance en 12 minutes' },
  { value: 'vdot', label: 'Test VDOT', description: 'Course de référence pour calculer votre VDOT' },
  { value: 'fitness', label: 'Test Fitness', description: 'Évaluation globale de la condition physique' },
];

export default function TestScheduler({ planId, onTestScheduled }: TestSchedulerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [testType, setTestType] = useState('vma');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testProtocol, setTestProtocol] = useState<{ name: string; description: string; steps: string[] } | null>(null);

  const handleSchedule = async () => {
    if (!scheduledDate) {
      toast.error('Veuillez sélectionner une date');
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.scheduleTest({
        planId,
        testType: testType as 'vma' | 'cooper' | 'vdot' | 'fitness',
        scheduledDate,
      });

      setTestProtocol(result.testProtocol);
      toast.success(result.message);
      onTestScheduled?.();
    } catch {
      toast.error('Erreur lors de la planification');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTest = testTypes.find(t => t.value === testType);

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setIsOpen(true)}
        leftIcon={<Activity className="w-4 h-4" />}
      >
        Planifier un test
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => { setIsOpen(false); setTestProtocol(null); }}
        title="Planifier un test d'évaluation"
        size="lg"
      >
        <div className="space-y-4">
          {!testProtocol ? (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Type de test</label>
                <div className="space-y-2">
                  {testTypes.map(type => (
                    <div
                      key={type.value}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        testType === type.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setTestType(type.value)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          testType === type.value ? 'border-primary bg-primary' : 'border-border'
                        }`}>
                          {testType === type.value && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <span className="font-medium text-foreground">{type.label}</span>
                      </div>
                      <p className="text-xs text-muted mt-1 ml-6">{type.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Date prévue</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground"
                />
              </div>

              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-foreground/80">
                    <p className="font-medium">Conseils pour le test :</p>
                    <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                      <li>Reposez-vous la veille du test</li>
                      <li>Faites le test à jeun ou 2h après un repas léger</li>
                      <li>Hydratez-vous bien avant le test</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="font-medium text-foreground">Test planifié avec succès !</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-foreground">{testProtocol.name}</h4>
                <p className="text-sm text-muted">{testProtocol.description}</p>
                <div className="space-y-2 mt-4">
                  {testProtocol.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm text-foreground/80">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {!testProtocol && (
              <>
                <Button variant="secondary" onClick={() => setIsOpen(false)} className="flex-1">
                  Annuler
                </Button>
                <Button onClick={handleSchedule} isLoading={isLoading} className="flex-1">
                  Planifier
                </Button>
              </>
            )}
            {testProtocol && (
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