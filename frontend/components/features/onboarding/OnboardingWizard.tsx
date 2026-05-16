'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { api } from '@/lib/api';
import { User, Heart, Target, CheckCircle2, ChevronRight, ChevronLeft, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: any;
  fields: Field[];
  completed: boolean;
  required: boolean;
}

interface Field {
  name: string;
  type: 'text' | 'number' | 'select' | 'checkbox';
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

export default function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [stepStatus, setStepStatus] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, any>>({
    name: '',
    fcm: '',
    vma: '',
    restingHR: '60',
    sex: 'M',
    weeklyKm: '20',
    goal: 'fitness'
  });

  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const status = await api.getOnboardingStatus();
      setStepStatus({
        profile: status.steps.profile.completed,
        fcm: status.steps.profile.completed,
        vma: status.steps.vma.completed,
        plan: status.steps.plan.completed,
        first_activity: status.steps.first_activity.completed,
        sync: status.steps.sync.completed
      });

      if (status.completed) {
        onComplete();
      }
    } catch {
      /* silencieux — onboarding status non disponible */
    } finally {
      setIsLoading(false);
    }
  }, [onComplete]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: 'Votre Profil',
      description: 'Commençons par quelques informations de base',
      icon: User,
      completed: stepStatus.profile,
      required: true,
      fields: [
        { name: 'name', type: 'text', label: 'Votre prénom', placeholder: 'Prénom', required: true },
        { name: 'sex', type: 'select', label: 'Sexe', options: [{ value: 'M', label: 'Homme' }, { value: 'F', label: 'Femme' }], required: true },
        { name: 'weeklyKm', type: 'number', label: 'Km par semaine actuels', placeholder: '20', required: true }
      ]
    },
    {
      id: 2,
      title: 'Fréquence Cardiaque',
      description: 'Données essentielles pour personnaliser vos zones',
      icon: Heart,
      completed: stepStatus.fcm,
      required: true,
      fields: [
        { name: 'fcm', type: 'number', label: 'FC Max (bpm)', placeholder: '185', required: true },
        { name: 'restingHR', type: 'number', label: 'FC Repos (bpm)', placeholder: '60', required: false }
      ]
    },
    {
      id: 3,
      title: 'VMA / VDOT',
      description: 'Améliore la précision des recommandations',
      icon: Zap,
      completed: stepStatus.vma,
      required: false,
      fields: [
        { name: 'vma', type: 'number', label: 'VMA (km/h) - Optionnel', placeholder: '15' },
        { name: 'vdot', type: 'number', label: 'VDOT - Optionnel', placeholder: '45' }
      ]
    },
    {
      id: 4,
      title: 'Objectif',
      description: 'Définissez votre objectif principal',
      icon: Target,
      completed: stepStatus.plan,
      required: false,
      fields: [
        { name: 'goal', type: 'select', label: 'Votre objectif', options: [
          { value: 'fitness', label: 'Fitness / Bien-être' },
          { value: '5k', label: '5 km' },
          { value: '10k', label: '10 km' },
          { value: 'half', label: 'Semi-marathon' },
          { value: 'marathon', label: 'Marathon' },
          { value: 'improvement', label: 'Améliorer mes performances' }
        ]}
      ]
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    await api.completeOnboardingStep(steps[currentStep].id.toString());
    setStepStatus(prev => ({ ...prev, [stepKeyMap[currentStep + 1]]: true }));
    handleNext();
  };

  const stepFields: Record<number, string> = {
    1: 'name,sex,weeklyKm',
    2: 'fcm,restingHR',
    3: 'vma,vdot',
    4: 'goal',
  };

  const stepKeyMap: Record<number, string> = {
    1: 'profile',
    2: 'fcm',
    3: 'vma',
    4: 'plan',
  };

  const handleSaveStep = async () => {
    setIsLoading(true);
    try {
      const fields = stepFields[currentStep + 1].split(',');
      const payload: Record<string, any> = {};
      for (const f of fields) {
        const val = formData[f];
        if (val !== undefined && val !== '') {
          payload[f] = val;
        } else {
          const fieldDef = steps[currentStep].fields.find(fd => fd.name === f);
          if (fieldDef?.required) {
            toast.error(`Veuillez remplir le champ "${fieldDef.label}"`);
            setIsLoading(false);
            return;
          }
        }
      }
      if (Object.keys(payload).length > 0) {
        await api.updateProfile(payload);
      }
      await api.completeOnboardingStep(steps[currentStep].id.toString());
      setStepStatus(prev => ({ ...prev, [stepKeyMap[currentStep + 1]]: true }));
      toast.success('Étape complétée !');

      if (currentStep === steps.length - 1) {
        onComplete();
      } else {
        handleNext();
      }
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsLoading(false);
    }
  };

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  if (isLoading && currentStep === 0) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/2 mx-auto" />
            <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            {step.title}
          </CardTitle>
          <span className="text-sm text-muted">
            Étape {currentStep + 1}/{steps.length}
          </span>
        </div>
        <div className="mt-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted mb-6">{step.description}</p>

        <div className="space-y-4">
          {step.fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              {field.type === 'text' && (
                <input
                  type="text"
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground"
                />
              )}
              {field.type === 'number' && (
                <input
                  type="number"
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground"
                />
              )}
              {field.type === 'select' && (
                <select
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground"
                >
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>

        {step.completed && (
          <div className="mt-4 p-3 rounded-lg bg-success/10 border border-green-500/20">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">Étape déjà complétée</span>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          {!isFirstStep && (
            <Button variant="secondary" onClick={handlePrev} disabled={isLoading}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Précédent
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            {!step.required && (
              <Button variant="ghost" onClick={handleSkip} disabled={isLoading}>
                Passer
              </Button>
            )}
            {isLastStep ? (
              <Button onClick={handleSaveStep} isLoading={isLoading}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Terminer
              </Button>
            ) : (
              <Button onClick={handleSaveStep} isLoading={isLoading}>
                Suivant
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}