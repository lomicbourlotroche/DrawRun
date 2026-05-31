'use client';

import { CardTitle } from '@/components/ui';
import { Target, Sparkles } from '@/components/ui/icons';

interface WizardHeaderProps {
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  activitiesAnalyzed: number;
  autoFilledFieldsCount: number;
}

export default function WizardHeader({
  title,
  description,
  currentStep,
  totalSteps,
  activitiesAnalyzed,
  autoFilledFieldsCount,
}: WizardHeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            {title}
          </CardTitle>
          <p className="text-sm text-muted mt-1">{description}</p>
        </div>
        <span className="text-sm text-muted tabular-nums">
          {currentStep + 1} / {totalSteps}
        </span>
      </div>

      <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {activitiesAnalyzed > 0 && autoFilledFieldsCount > 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-primary bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            <strong>{activitiesAnalyzed} activité{activitiesAnalyzed > 1 ? 's' : ''}</strong> analysée{activitiesAnalyzed > 1 ? 's' : ''} —
            les champs marqués <strong>Auto</strong> sont pré-remplis depuis vos données
          </span>
        </div>
      )}
    </>
  );
}
