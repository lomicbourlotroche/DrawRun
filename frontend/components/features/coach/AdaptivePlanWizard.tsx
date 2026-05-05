'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select } from '@/components/ui';
import { api } from '@/lib/api';
import { Target, Gauge, Calendar, Activity, Heart, Zap, CheckCircle2, ChevronRight, ChevronLeft, Clock } from 'lucide-react';
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
  condition?: (formData: Record<string, any>) => boolean;
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
          { value: 'health', label: 'Santé / Bien-être' },
          { value: 'weight_loss', label: 'Perte de poids' },
          { value: '5k', label: 'Course 5 km' },
          { value: '10k', label: 'Course 10 km' },
          { value: 'half', label: 'Semi-marathon (21 km)' },
          { value: 'marathon', label: 'Marathon (42 km)' },
          { value: 'custom', label: 'Distance personnalisée' },
          { value: 'improvement', label: 'Améliorer mes performances' },
        ]
      },
      {
        name: 'targetDistance',
        type: 'distance',
        label: 'Distance cible (en km)',
        placeholder: 'ex: 7.5',
        condition: (formData) => formData.goal === 'custom'
      }
    ]
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
          { value: 'beginner', label: 'Débutant - Je n\'ai jamais ou très peu couru' },
          { value: 'intermediate', label: 'Intermédiaire - Je cours régulièrement depuis 6 mois+' },
          { value: 'advanced', label: 'Avancé - Je cours depuis plusieurs années' },
        ]
      },
      {
        name: 'currentWeeklyKm',
        type: 'number',
        label: 'Combien de km courez-vous par semaine actuellement ?',
        placeholder: '0 si vous ne courez pas',
        required: true
      },
      {
        name: 'hasVMA',
        type: 'checkbox',
        label: 'Je connais ma VMA (Vitesse Maximale Aérobie)',
        required: false
      },
      {
        name: 'vmaValue',
        type: 'number',
        label: 'Votre VMA (km/h)',
        placeholder: 'ex: 14.5',
        condition: (formData) => formData.hasVMA === true,
        required: false
      },
      {
        name: 'hasVDOT',
        type: 'checkbox',
        label: 'Je connais mon VDOT (score Jack Daniels)',
        required: false
      },
      {
        name: 'vdotValue',
        type: 'number',
        label: 'Votre VDOT',
        placeholder: 'ex: 45',
        condition: (formData) => formData.hasVDOT === true,
        required: false
      },
      {
        name: 'fcm',
        type: 'number',
        label: 'FC Max (bpm) - Optionnel',
        placeholder: 'ex: 185',
        required: false
      }
    ]
  },
  {
    id: 3,
    title: 'Votre Emploi du Temps',
    description: 'Quand voulez-vous vous entraîner ?',
    fields: [
      {
        name: 'sessionsPerWeek',
        type: 'select',
        label: 'Combien de séances par semaine souhaitez-vous ?',
        required: true,
        options: [
          { value: '2', label: '2 séances - Idéal pour commencer' },
          { value: '3', label: '3 séances - Équilibre' },
          { value: '4', label: '4 séances - Développement' },
          { value: '5', label: '5 séances - Performance' },
          { value: '6', label: '6 séances - Avancé' },
        ]
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
        ]
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
        ]
      }
    ]
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
        required: false
      },
      {
        name: 'equipment',
        type: 'select',
        label: 'Équipement disponible',
        required: true,
        options: [
          { value: 'minimal', label: 'Juste des chaussures' },
          { value: 'watch', label: 'Montre GPS' },
          { value: 'hrm', label: 'Montre + Cardiofréquencemètre' },
          { value: 'full', label: 'Équipement complet (GPS, cardio, etc.)' },
        ]
      }
    ]
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
          { value: 'low', label: 'Je vais faire de mon mieux' },
          { value: 'medium', label: 'Je suis motivé(e)' },
          { value: 'high', label: 'Je suis très engagé(e) !' },
        ]
      },
      {
        name: 'notes',
        type: 'text',
        label: 'Informations supplémentaires (optionnel)',
        placeholder: 'Objectif particulier, préférences...',
        required: false
      }
    ]
  }
];

export default function AdaptivePlanWizard({ onComplete }: { onComplete: (plan: any) => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({
    goal: '',
    targetDistance: '',
    experienceLevel: '',
    currentWeeklyKm: 0,
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
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const currentStepData = wizardSteps[currentStep];
  const isLastStep = currentStep === wizardSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const updateField = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelect = (name: string, value: string) => {
    const currentValues = formData[name] || [];
    if (currentValues.includes(value)) {
      updateField(name, currentValues.filter((v: string) => v !== value));
    } else {
      updateField(name, [...currentValues, value]);
    }
  };

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Calculer la distance cible en mètres
      let targetDistanceMeters: number;
      
      if (formData.goal === 'custom' && formData.targetDistance) {
        targetDistanceMeters = parseFloat(formData.targetDistance) * 1000;
      } else {
        const goalDistances: Record<string, number> = {
          '5k': 5000,
          '10k': 10000,
          'half': 21097,
          'marathon': 42195,
          'health': 5000,
          'weight_loss': 5000,
          'improvement': 10000
        };
        targetDistanceMeters = goalDistances[formData.goal] || 10000;
      }

      // Calculer la durée du plan en semaines
      const weeks = formData.goal === 'marathon' ? 16 : 
                    formData.goal === 'half' ? 12 :
                    formData.goal === 'improvement' ? 10 : 8;

      const planData = await api.startAdaptivePlan({
        targetDistance: targetDistanceMeters,
        weeks,
        sessionsPerWeek: parseInt(formData.sessionsPerWeek),
        trainingDays: formData.trainingDays.map((d: string) => parseInt(d)),
        hasVMA: formData.hasVMA,
        vmaValue: formData.vmaValue ? parseFloat(formData.vmaValue) : null,
        vdotValue: formData.vdotValue ? parseFloat(formData.vdotValue) : null,
        experienceLevel: formData.experienceLevel,
        currentWeeklyKm: parseInt(formData.currentWeeklyKm) || 0,
        goals: formData.goal,
        availableTimePerSession: parseInt(formData.availableTimePerSession),
        equipment: formData.equipment,
        motivation: formData.motivation,
        injuries: formData.injuries,
        notes: formData.notes,
        questionnaire: formData
      });
      toast.success('Plan créé avec succès !');
      onComplete(planData);
    } catch {
      toast.error('Erreur lors de la création du plan');
    } finally {
      setIsLoading(false);
    }
  };

  const renderField = (field: Field) => {
    if (field.condition && !field.condition(formData)) {
      return null;
    }

    switch (field.type) {
      case 'text':
        return (
          <div key={field.name} className="space-y-2">
            <label className="block text-sm font-medium text-foreground">{field.label}</label>
            <input
              type="text"
              value={formData[field.name] || ''}
              onChange={(e) => updateField(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground"
            />
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="space-y-2">
            <label className="block text-sm font-medium text-foreground">{field.label}</label>
            <input
              type="number"
              value={formData[field.name] || ''}
              onChange={(e) => updateField(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground"
            />
          </div>
        );

      case 'distance':
        return (
          <div key={field.name} className="space-y-2">
            <label className="block text-sm font-medium text-foreground">{field.label}</label>
            <input
              type="number"
              step="0.1"
              value={formData[field.name] || ''}
              onChange={(e) => updateField(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground"
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <label className="block text-sm font-medium text-foreground">{field.label}</label>
            <select
              value={formData[field.name] || ''}
              onChange={(e) => updateField(field.name, e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground"
            >
              <option value="">Sélectionner...</option>
              {field.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        );

      case 'multiselect':
        return (
          <div key={field.name} className="space-y-2">
            <label className="block text-sm font-medium text-foreground mb-2">{field.label}</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {field.options?.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleMultiSelect(field.name, opt.value)}
                  className={`p-2 rounded-lg border transition-all ${
                    (formData[field.name] || []).includes(opt.value)
                      ? 'bg-primary text-white border-primary'
                      : 'bg-background text-foreground border-border hover:border-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.name} className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={field.name}
              checked={formData[field.name] || false}
              onChange={(e) => updateField(field.name, e.target.checked)}
              className="w-5 h-5 rounded border-border bg-background"
            />
            <label htmlFor={field.name} className="text-sm text-foreground">{field.label}</label>
          </div>
        );

      default:
        return null;
    }
  };

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
          <span className="text-sm text-muted">
            Étape {currentStep + 1}/{wizardSteps.length}
          </span>
        </div>
        <div className="mt-4 progress-bar">
          <div 
            className="h-2 bg-primary rounded-full transition-all"
            style={{ width: `${((currentStep + 1) / wizardSteps.length) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {currentStepData.fields.map(field => renderField(field))}
        </div>

        <div className="flex justify-between mt-8">
          <Button
            variant="secondary"
            onClick={handlePrev}
            disabled={isFirstStep || isLoading}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Précédent
          </Button>

          {isLastStep ? (
            <Button onClick={handleSubmit} isLoading={isLoading}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Créer mon plan
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Suivant
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}