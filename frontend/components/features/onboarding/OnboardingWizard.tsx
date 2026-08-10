'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui';
import { api } from '@/lib/api';
import { User, Heart, Target, CheckCircle2, Zap } from '@/components/ui/icons';
import { toast } from 'sonner';
import type { OnboardingStep, OnboardingFormData, OnboardingStepStatus } from './types';
import StepIndicator from './StepIndicator';
import StepRenderer from './StepRenderer';
import NavigationButtons from './NavigationButtons';

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
        sync: status.steps.sync.completed,
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
        {
          name: 'sex',
          type: 'select',
          label: 'Sexe',
          options: [
            { value: 'M', label: 'Homme' },
            { value: 'F', label: 'Femme' },
          ],
          required: true,
        },
        { name: 'weeklyKm', type: 'number', label: 'Km par semaine actuels', placeholder: '20', required: true },
      ],
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
        { name: 'restingHR', type: 'number', label: 'FC Repos (bpm)', placeholder: '60', required: false },
      ],
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
        { name: 'vdot', type: 'number', label: 'VDOT - Optionnel', placeholder: '45' },
      ],
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
            { value: 'improvement', label: 'Améliorer mes performances' },
          ],
        },
      ],
    },
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
      setStepStatus((prev) => ({ ...prev, [stepKeyMap[currentStep + 1]]: true }));
      handleNext();
    } catch {
      toast.error("Erreur lors du saut de l'étape");
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
          const fieldDef = steps[currentStep].fields.find((fd) => fd.name === fieldName);
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
      setStepStatus((prev) => ({ ...prev, [stepKeyMap[currentStep + 1]]: true }));
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

  const handleFieldChange = (name: string, value: string): void => {
    setFormData((prev) => ({ ...prev, [name]: value }));
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
          <span className="sr-only">Chargement du formulaire d&apos;onboarding...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg mx-auto" role="form" aria-label="Formulaire d'onboarding">
      <CardHeader>
        <StepIndicator title={step.title} icon={Icon} currentStep={currentStep} totalSteps={steps.length} />
      </CardHeader>
      <CardContent>
        <p className="text-muted mb-6">{step.description}</p>

        <StepRenderer
          fields={step.fields}
          formData={formData}
          onChange={handleFieldChange}
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveStep();
          }}
        />

        {step.completed && (
          <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/20" role="status" aria-live="polite">
            <div className="flex items-center gap-2 text-success/80">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm">Étape déjà complétée</span>
            </div>
          </div>
        )}

        <NavigationButtons
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          stepRequired={step.required}
          isLoading={isLoading}
          onPrev={handlePrev}
          onSkip={handleSkip}
          onSave={handleSaveStep}
        />
      </CardContent>
    </Card>
  );
}
