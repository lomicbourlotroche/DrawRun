'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { api } from '@/lib/api';
import { User, Heart, Target, CheckCircle2, ChevronRight, ChevronLeft, Zap } from 'lucide-react';
import { toast } from 'sonner';
import type { IconType } from 'react-icons';

/**
 * Represents a field in an onboarding step form
 */
interface Field {
  name: string;
  type: 'text' | 'number' | 'select' | 'checkbox';
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

/**
 * Represents an onboarding step with its fields and status
 */
interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: IconType;
  fields: Field[];
  completed: boolean;
  required: boolean;
}

/**
 * Form data type for onboarding
 */
interface OnboardingFormData {
  name: string;
  fcm: string;
  vma: string;
  restingHR: string;
  sex: string;
  weeklyKm: string;
  goal: string;
  vdot?: string;
}

/**
 * Status of each onboarding step
 */
interface OnboardingStepStatus {
  profile: boolean;
  fcm: boolean;
  vma: boolean;
  plan: boolean;
  first_activity: boolean;
  sync: boolean;
}

/**
 * OnboardingWizard component for guiding users through the initial setup process.
 * 
 * Features:
 * - Multi-step form with validation
 * - Progress tracking
 * - Skip functionality for optional steps
 * - Loading states and error handling
 * - Accessible form fields
 * 
 * @param onComplete - Callback function called when onboarding is completed
 */
export default function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [stepStatus, setStepStatus] = useState<OnboardingStepStatus>({
    profile: false,
    fcm: false,
    vma: false,
    plan: false,
    first_activity: false,
    sync: false,
  });
  
  const [formData, setFormData] = useState<OnboardingFormData>({
    name: '',
    fcm: '',
    vma: '',
    restingHR: '60',
    sex: 'M',
    weeklyKm: '20',
    goal: 'fitness',
  });

  /**
   * Load the onboarding status from the API
   */
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
      // Silencieux — onboarding status non disponible
    } finally {
      setIsLoading(false);
    }
  }, [onComplete]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  /**
   * Mapping of step IDs to their field names
   */
  const stepFields: Record<number, string> = {
    1: 'name,sex,weeklyKm',
    2: 'fcm,restingHR',
    3: 'vma,vdot',
    4: 'goal',
  };

  /**
   * Mapping of step IDs to their status keys
   */
  const stepKeyMap: Record<number, keyof OnboardingStepStatus> = {
    1: 'profile',
    2: 'fcm',
    3: 'vma',
    4: 'plan',
  };

  /**
   * Onboarding steps configuration
   */
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
        { 
          name: 'goal', 
          type: 'select', 
          label: 'Votre objectif', 
          options: [
            { value: 'fitness', label: 'Fitness / Bien-être' },
            { value: '5k', label: '5 km' },
            { value: '10k', label: '10 km' },
            { value: 'half', label: 'Semi-marathon' },
            { value: 'marathon', label: 'Marathon' },
            { value: 'improvement', label: 'Améliorer mes performances' }
          ]
        }
      ]
    }
  ];

  /**
   * Navigate to the next step
   */
  const handleNext = (): void => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  /**
   * Navigate to the previous step
   */
  const handlePrev = (): void => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * Skip the current step (for optional steps)
   */
  const handleSkip = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await api.completeOnboardingStep(steps[currentStep].id.toString());
      setStepStatus(prev => ({ ...prev, [stepKeyMap[currentStep + 1]]: true }));
      handleNext();
    } catch {
      toast.error('Erreur lors du saut de l\'étape');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save the current step data and mark it as complete
   */
  const handleSaveStep = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const fields = stepFields[currentStep + 1].split(',');
      const payload: Record<string, string> = {};
      
      for (const fieldName of fields) {
        const value = formData[fieldName as keyof OnboardingFormData];
        if (value !== undefined && value !== '') {
          payload[fieldName] = value;
        } else {
          const fieldDef = steps[currentStep].fields.find(fd => fd.name === fieldName);
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

  // Loading state for initial load
  if (isLoading && currentStep === 0) {
    return (
      <Card className="max-w-lg mx-auto" role="status" aria-live="polite">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/2 mx-auto" aria-hidden="true" />
            <div className="h-4 bg-muted rounded w-3/4 mx-auto" aria-hidden="true" />
          </div>
          <span className="sr-only">Chargement du formulaire d'onboarding...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg mx-auto" role="form" aria-label="Formulaire d'onboarding">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
            {step.title}
          </CardTitle>
          <span className="text-sm text-muted" aria-label={`Étape ${currentStep + 1} sur ${steps.length}`}>
            Étape {currentStep + 1}/{steps.length}
          </span>
        </div>
        <div className="mt-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden" role="progressbar" aria-valuenow={((currentStep + 1) / steps.length) * 100} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              aria-hidden="true"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted mb-6">{step.description}</p>

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSaveStep(); }}>
          {step.fields.map((field) => (
            <div key={field.name} className="space-y-2">
              <label className="block text-sm font-medium text-foreground" htmlFor={`field-${field.name}`}>
                {field.label}
                {field.required && <span className="text-danger/80 ml-1" aria-label="obligatoire">*</span>}
              </label>
              {field.type === 'text' && (
                <input
                  id={`field-${field.name}`}
                  type="text"
                  value={formData[field.name as keyof OnboardingFormData] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-required={field.required}
                  aria-label={field.label}
                />
              )}
              {field.type === 'number' && (
                <input
                  id={`field-${field.name}`}
                  type="number"
                  value={formData[field.name as keyof OnboardingFormData] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-required={field.required}
                  aria-label={field.label}
                  inputMode="numeric"
                />
              )}
              {field.type === 'select' && (
                <select
                  id={`field-${field.name}`}
                  value={formData[field.name as keyof OnboardingFormData] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-required={field.required}
                  aria-label={field.label}
                >
                  {!field.required && <option value="">Sélectionnez une option</option>}
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </form>

        {step.completed && (
          <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/20" role="status" aria-live="polite">
            <div className="flex items-center gap-2 text-success/80">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm">Étape déjà complétée</span>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          {!isFirstStep && (
            <Button 
              variant="secondary" 
              onClick={handlePrev} 
              disabled={isLoading}
              aria-label="Aller à l'étape précédente"
            >
              <ChevronLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Précédent
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            {!step.required && (
              <Button 
                variant="ghost" 
                onClick={handleSkip} 
                disabled={isLoading}
                aria-label="Passer cette étape"
              >
                Passer
              </Button>
            )}
            {isLastStep ? (
              <Button 
                onClick={handleSaveStep} 
                disabled={isLoading}
                aria-label="Terminer l'onboarding"
                aria-busy={isLoading}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" aria-hidden="true" />
                Terminer
              </Button>
            ) : (
              <Button 
                onClick={handleSaveStep} 
                disabled={isLoading}
                aria-label="Aller à l'étape suivante"
                aria-busy={isLoading}
              >
                Suivant
                <ChevronRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
