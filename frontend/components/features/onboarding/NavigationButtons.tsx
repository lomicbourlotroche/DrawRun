'use client';

import { ChevronLeft, ChevronRight, CheckCircle2 } from '@/components/ui/icons';
import { Button } from '@/components/ui';

interface NavigationButtonsProps {
  isFirstStep: boolean;
  isLastStep: boolean;
  stepRequired: boolean;
  isLoading: boolean;
  onPrev: () => void;
  onSkip: () => void;
  onSave: () => void;
}

export default function NavigationButtons({
  isFirstStep,
  isLastStep,
  stepRequired,
  isLoading,
  onPrev,
  onSkip,
  onSave,
}: NavigationButtonsProps) {
  return (
    <div className="flex justify-between mt-8">
      {!isFirstStep && (
        <Button
          variant="secondary"
          onClick={onPrev}
          disabled={isLoading}
          aria-label="Aller à l'étape précédente"
        >
          <ChevronLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          Précédent
        </Button>
      )}
      <div className="flex gap-2 ml-auto">
        {!stepRequired && (
          <Button
            variant="ghost"
            onClick={onSkip}
            disabled={isLoading}
            aria-label="Passer cette étape"
          >
            Passer
          </Button>
        )}
        {isLastStep ? (
          <Button
            onClick={onSave}
            disabled={isLoading}
            aria-label="Terminer l'onboarding"
            aria-busy={isLoading}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" aria-hidden="true" />
            Terminer
          </Button>
        ) : (
          <Button
            onClick={onSave}
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
  );
}
