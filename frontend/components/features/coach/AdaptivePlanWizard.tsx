'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui';
import { api } from '@/lib/api';
import { Loader2 } from '@/components/ui/icons';
import { toast } from 'sonner';
import FieldRenderer, { type Field } from './FieldRenderer';
import WizardHeader from './WizardHeader';
import WizardNavigation from './WizardNavigation';

interface WizardStep {
  id: number;
  title: string;
  description: string;
  fields: Field[];
}

const wizardSteps: WizardStep[] = [
  {
    id: 1,
    title: 'Votre Objectif',
    description: 'Commençons par définir votre objectif principal.',
    fields: [
      {
        name: 'goal',
        type: 'select',
        label: 'Quel est votre objectif principal ?',
        required: true,
        options: [
          { value: 'health',       label: 'Santé / Bien-être' },
          { value: 'weight_loss',  label: 'Perte de poids' },
          { value: '5k',           label: 'Course 5 km' },
          { value: '10k',          label: 'Course 10 km' },
          { value: 'half',         label: 'Semi-marathon (21 km)' },
          { value: 'marathon',     label: 'Marathon (42 km)' },
          { value: 'custom',       label: 'Distance personnalisée' },
          { value: 'improvement',  label: 'Améliorer mes performances' },
        ],
      },
      {
        name: 'targetDistance',
        type: 'distance',
        label: 'Distance cible (en km)',
        placeholder: 'ex: 7.5',
        condition: (f) => f.goal === 'custom',
      },
    ],
  },
  {
    id: 2,
    title: 'Votre Profil',
    description: 'Parlez-nous un peu de vous et de votre expérience.',
    fields: [
      {
        name: 'experienceLevel',
        type: 'select',
        label: 'Quel est votre niveau de course ?',
        required: true,
        options: [
          { value: 'beginner',     label: "Débutant — Je n'ai jamais ou très peu couru" },
          { value: 'intermediate', label: 'Intermédiaire — Je cours régulièrement depuis 6 mois+' },
          { value: 'advanced',     label: 'Avancé — Je cours depuis plusieurs années' },
        ],
      },
      {
        name: 'currentWeeklyKm',
        type: 'number',
        label: 'Combien de km courez-vous par semaine actuellement ?',
        placeholder: '0 si vous ne courez pas',
        required: true,
      },
      {
        name: 'hasVMA',
        type: 'checkbox',
        label: 'Je connais ma VMA (Vitesse Maximale Aérobie)',
      },
      {
        name: 'vmaValue',
        type: 'number',
        label: 'Votre VMA (km/h)',
        placeholder: 'ex: 14.5',
        condition: (f) => f.hasVMA === true,
      },
      {
        name: 'hasVDOT',
        type: 'checkbox',
        label: 'Je connais mon VDOT (score Jack Daniels)',
      },
      {
        name: 'vdotValue',
        type: 'number',
        label: 'Votre VDOT',
        placeholder: 'ex: 45',
        condition: (f) => f.hasVDOT === true,
      },
      {
        name: 'fcm',
        type: 'number',
        label: 'FC Max (bpm) — Optionnel',
        placeholder: 'ex: 185',
      },
    ],
  },
  {
    id: 3,
    title: "Votre Emploi du Temps",
    description: 'Quand voulez-vous vous entraîner ?',
    fields: [
      {
        name: 'sessionsPerWeek',
        type: 'select',
        label: 'Combien de séances par semaine souhaitez-vous ?',
        required: true,
        options: [
          { value: '2', label: '2 séances — Idéal pour commencer' },
          { value: '3', label: '3 séances — Équilibre' },
          { value: '4', label: '4 séances — Développement' },
          { value: '5', label: '5 séances — Performance' },
          { value: '6', label: '6 séances — Avancé' },
        ],
      },
      {
        name: 'trainingDays',
        type: 'multiselect',
        label: 'Quels jours préférez-vous ?',
        required: true,
        options: [
          { value: '1', label: 'Lundi' },
          { value: '2', label: 'Mardi' },
          { value: '3', label: 'Mercredi' },
          { value: '4', label: 'Jeudi' },
          { value: '5', label: 'Vendredi' },
          { value: '6', label: 'Samedi' },
          { value: '0', label: 'Dimanche' },
        ],
      },
      {
        name: 'availableTimePerSession',
        type: 'select',
        label: 'Combien de temps pouvez-vous consacrer par séance ?',
        required: true,
        options: [
          { value: '20', label: '20-30 minutes' },
          { value: '30', label: '30-45 minutes' },
          { value: '45', label: '45-60 minutes' },
          { value: '60', label: '60+ minutes' },
        ],
      },
    ],
  },
  {
    id: 4,
    title: 'Votre Santé',
    description: 'Informez-nous de vos limitations éventuelles.',
    fields: [
      {
        name: 'injuries',
        type: 'text',
        label: 'Blessures ou limitations ?',
        placeholder: 'Aucune / Genou droit / Dos sensible...',
      },
      {
        name: 'equipment',
        type: 'select',
        label: 'Équipement disponible',
        required: true,
        options: [
          { value: 'minimal', label: 'Juste des chaussures' },
          { value: 'watch',   label: 'Montre GPS' },
          { value: 'hrm',     label: 'Montre + Cardiofréquencemètre' },
          { value: 'full',    label: 'Équipement complet (GPS, cardio, etc.)' },
        ],
      },
    ],
  },
  {
    id: 5,
    title: 'Votre Motivation',
    description: 'Ce qui vous pousse à vous entraîner.',
    fields: [
      {
        name: 'motivation',
        type: 'select',
        label: 'Niveau de motivation',
        required: true,
        options: [
          { value: 'low',    label: 'Je vais faire de mon mieux' },
          { value: 'medium', label: 'Je suis motivé(e)' },
          { value: 'high',   label: 'Je suis très engagé(e) !' },
        ],
      },
      {
        name: 'notes',
        type: 'text',
        label: 'Informations supplémentaires (optionnel)',
        placeholder: 'Objectif particulier, préférences...',
      },
    ],
  },
];

const AUTO_FILLED_FIELDS = new Set([
  'currentWeeklyKm', 'experienceLevel', 'fcm',
  'vmaValue', 'hasVMA', 'vdotValue', 'hasVDOT',
  'sessionsPerWeek', 'trainingDays', 'availableTimePerSession', 'equipment',
]);

const DEFAULT_FORM: Record<string, unknown> = {
  goal: '',
  targetDistance: '',
  experienceLevel: '',
  currentWeeklyKm: '',
  hasVMA: false,
  vmaValue: '',
  hasVDOT: false,
  vdotValue: '',
  fcm: '',
  sessionsPerWeek: '3',
  trainingDays: [],
  availableTimePerSession: '30',
  injuries: '',
  equipment: 'minimal',
  motivation: 'medium',
  notes: '',
};

export default function AdaptivePlanWizard({ onComplete }: { onComplete: (_plan: unknown) => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>({ ...DEFAULT_FORM });
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(true);
  const [activitiesAnalyzed, setActivitiesAnalyzed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadDefaults = async () => {
      setIsLoadingDefaults(true);
      try {
        const result = await api.getWizardDefaults();
        if (result?.defaults && Object.keys(result.defaults).length > 0) {
          const filled = new Set<string>();
          const updates: Record<string, unknown> = {};

          for (const [key, value] of Object.entries(result.defaults)) {
            if (value !== null && value !== undefined && AUTO_FILLED_FIELDS.has(key)) {
              updates[key] = value;
              filled.add(key);
            }
          }

          setFormData(prev => ({ ...prev, ...updates }));
          setAutoFilledFields(filled);
          setActivitiesAnalyzed(result.activitiesAnalyzed ?? 0);

          if (filled.size > 0) {
            toast.success(
              `${result.activitiesAnalyzed} activité${result.activitiesAnalyzed > 1 ? 's' : ''} analysée${result.activitiesAnalyzed > 1 ? 's' : ''} — formulaire pré-rempli`,
              { duration: 3000 }
            );
          }
        }
      } catch {
        // Silencieux — le wizard fonctionne sans les defaults
      } finally {
        setIsLoadingDefaults(false);
      }
    };
    loadDefaults();
  }, []);

  const currentStepData = wizardSteps[currentStep];
  const isLastStep = currentStep === wizardSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const updateField = (name: string, value: unknown) => {
    if (autoFilledFields.has(name)) {
      setAutoFilledFields(prev => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelect = (name: string, value: string) => {
    const current = (formData[name] as string[]) || [];
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateField(name, next);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const goalDistances: Record<string, number> = {
        '5k': 5000, '10k': 10000, 'half': 21097, 'marathon': 42195,
        'health': 5000, 'weight_loss': 5000, 'improvement': 10000,
      };
      const targetDistanceMeters =
        formData.goal === 'custom' && formData.targetDistance
          ? parseFloat(formData.targetDistance as string) * 1000
          : goalDistances[formData.goal as string] || 10000;

      const weeks =
        formData.goal === 'marathon' ? 16 :
        formData.goal === 'half'     ? 12 :
        formData.goal === 'improvement' ? 10 : 8;

      const planData = await api.startAdaptivePlan({
        targetDistance: targetDistanceMeters,
        weeks,
        sessionsPerWeek: parseInt(formData.sessionsPerWeek as string),
        trainingDays: ((formData.trainingDays as string[]) || []).map(d => parseInt(d)),
        hasVMA: formData.hasVMA as boolean,
        vmaValue: formData.vmaValue ? parseFloat(formData.vmaValue as string) : null,
        vdotValue: formData.vdotValue ? parseFloat(formData.vdotValue as string) : null,
        experienceLevel: formData.experienceLevel as string,
        currentWeeklyKm: parseInt(formData.currentWeeklyKm as string) || 0,
        goals: formData.goal as string,
        availableTimePerSession: parseInt(formData.availableTimePerSession as string),
        equipment: formData.equipment as string,
        motivation: formData.motivation as string,
        injuries: formData.injuries as string,
        notes: formData.notes as string,
        questionnaire: formData,
      });
      toast.success('Plan créé avec succès !');
      onComplete(planData);
    } catch {
      toast.error('Erreur lors de la création du plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingDefaults) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted">Analyse de vos activités passées...</p>
          <p className="text-xs text-muted mt-1">Pré-remplissage du formulaire en cours</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <WizardHeader
          title={currentStepData.title}
          description={currentStepData.description}
          currentStep={currentStep}
          totalSteps={wizardSteps.length}
          activitiesAnalyzed={activitiesAnalyzed}
          autoFilledFieldsCount={autoFilledFields.size}
        />
      </CardHeader>

      <CardContent>
        <div className="space-y-5">
          {currentStepData.fields.map(field => (
            <FieldRenderer
              key={field.name}
              field={field}
              formData={formData}
              autoFilledFields={autoFilledFields}
              onUpdateField={updateField}
              onMultiSelect={handleMultiSelect}
            />
          ))}
        </div>

        <WizardNavigation
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          isSubmitting={isSubmitting}
          onPrevious={() => setCurrentStep(p => p - 1)}
          onNext={() => setCurrentStep(p => p + 1)}
          onSubmit={handleSubmit}
        />
      </CardContent>
    </Card>
  );
}
