/* eslint-disable unused-imports/no-unused-vars */
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui';
import { api } from '@/lib/api';
import { Target, CheckCircle2, ChevronRight, ChevronLeft, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface WizardStep {
  id: number;
  title: string;
  description: string;
  fields: Field[];
}

interface Field {
  name: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'multiselect' | 'distance';
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  condition?: (formData: Record<string, unknown>) => boolean;
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

// Champs qui peuvent être pré-remplis automatiquement
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

export default function AdaptivePlanWizard({ onComplete }: { onComplete: (plan: unknown) => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>({ ...DEFAULT_FORM });
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(true);
  const [activitiesAnalyzed, setActivitiesAnalyzed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger les valeurs par défaut depuis les activités passées
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
    // Quand l'utilisateur modifie un champ auto-rempli, retirer le badge
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

  const renderField = (field: Field) => {
    if (field.condition && !field.condition(formData)) return null;

    const isAutoFilled = autoFilledFields.has(field.name);
    const autoFilledBadge = isAutoFilled ? (
      <span className="inline-flex items-center gap-1 text-xs text-primary-600 bg-primary-50 border border-primary-200 rounded-full px-2 py-0.5 ml-2">
        <Sparkles className="w-3 h-3" />
        Auto
      </span>
    ) : null;

    const inputClass = `w-full bg-background border rounded-lg px-4 py-2.5 text-foreground transition-colors ${
      isAutoFilled
        ? 'border-primary-300 bg-primary-50/30 focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
        : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/10'
    }`;

    switch (field.type) {
      case 'text':
        return (
          <div key={field.name} className="space-y-1.5">
            <label className="flex items-center text-sm font-medium text-foreground">
              {field.label}{autoFilledBadge}
            </label>
            <input
              type="text"
              value={(formData[field.name] as string) || ''}
              onChange={e => updateField(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={inputClass}
            />
          </div>
        );

      case 'number':
      case 'distance':
        return (
          <div key={field.name} className="space-y-1.5">
            <label className="flex items-center text-sm font-medium text-foreground">
              {field.label}{autoFilledBadge}
            </label>
            <input
              type="number"
              step={field.type === 'distance' ? '0.1' : '1'}
              value={(formData[field.name] as string | number) || ''}
              onChange={e => updateField(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={inputClass}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="space-y-1.5">
            <label className="flex items-center text-sm font-medium text-foreground">
              {field.label}{autoFilledBadge}
            </label>
            <select
              value={(formData[field.name] as string) || ''}
              onChange={e => updateField(field.name, e.target.value)}
              className={inputClass}
            >
              <option value="">Sélectionner...</option>
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        );

      case 'multiselect': {
        const selected = (formData[field.name] as string[]) || [];
        return (
          <div key={field.name} className="space-y-1.5">
            <label className="flex items-center text-sm font-medium text-foreground">
              {field.label}{autoFilledBadge}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {field.options?.map(opt => {
                const active = selected.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleMultiSelect(field.name, opt.value)}
                    className={`p-2 rounded-lg border text-sm transition-all ${
                      active
                        ? 'bg-primary text-foreground border-primary shadow-sm'
                        : 'bg-background text-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      case 'checkbox':
        return (
          <div key={field.name} className="flex items-center gap-2.5">
            <input
              type="checkbox"
              id={field.name}
              checked={(formData[field.name] as boolean) || false}
              onChange={e => updateField(field.name, e.target.checked)}
              className="w-4 h-4 rounded border-border bg-background accent-primary"
            />
            <label htmlFor={field.name} className="flex items-center text-sm text-foreground cursor-pointer">
              {field.label}{autoFilledBadge}
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  // Écran de chargement pendant la récupération des defaults
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              {currentStepData.title}
            </CardTitle>
            <p className="text-sm text-muted mt-1">{currentStepData.description}</p>
          </div>
          <span className="text-sm text-muted tabular-nums">
            {currentStep + 1} / {wizardSteps.length}
          </span>
        </div>

        {/* Barre de progression */}
        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / wizardSteps.length) * 100}%` }}
          />
        </div>

        {/* Badge données auto-remplies */}
        {activitiesAnalyzed > 0 && autoFilledFields.size > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-primary-700 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2">
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              <strong>{activitiesAnalyzed} activité{activitiesAnalyzed > 1 ? 's' : ''}</strong> analysée{activitiesAnalyzed > 1 ? 's' : ''} —
              les champs marqués <strong>Auto</strong> sont pré-remplis depuis vos données
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-5">
          {currentStepData.fields.map(field => renderField(field))}
        </div>

        <div className="flex justify-between mt-8 pt-4 border-t border-border">
          <Button
            variant="secondary"
            onClick={() => setCurrentStep(p => p - 1)}
            disabled={isFirstStep || isSubmitting}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Précédent
          </Button>

          {isLastStep ? (
            <Button onClick={handleSubmit} isLoading={isSubmitting}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Créer mon plan
            </Button>
          ) : (
            <Button onClick={() => setCurrentStep(p => p + 1)}>
              Suivant
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
