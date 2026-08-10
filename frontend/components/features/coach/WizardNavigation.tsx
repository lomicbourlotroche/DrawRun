'use client';

import { Button } from '@/components/ui';
import { CheckCircle2, ChevronRight, ChevronLeft } from '@/components/ui/icons';

interface WizardNavigationProps {
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export default function WizardNavigation({
  isFirstStep,
  isLastStep,
  isSubmitting,
  onPrevious,
  onNext,
  onSubmit,
}: WizardNavigationProps) {
  return (
    <div className="flex justify-between mt-8 pt-4 border-t border-border">
      <Button variant="secondary" onClick={onPrevious} disabled={isFirstStep || isSubmitting}>
        <ChevronLeft className="w-4 h-4 mr-1" />
        Précédent
      </Button>

      {isLastStep ? (
        <Button onClick={onSubmit} isLoading={isSubmitting}>
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Créer mon plan
        </Button>
      ) : (
        <Button onClick={onNext}>
          Suivant
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      )}
    </div>
  );
}
