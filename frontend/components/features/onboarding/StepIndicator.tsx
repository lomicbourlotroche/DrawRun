'use client';

import { CardTitle } from '@/components/ui';
import type { IconType } from 'react-icons';

interface StepIndicatorProps {
  title: string;
  icon: IconType;
  currentStep: number;
  totalSteps: number;
}

export default function StepIndicator({ title, icon: Icon, currentStep, totalSteps }: StepIndicatorProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <>
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
          {title}
        </CardTitle>
        <span className="text-sm text-muted" aria-label={`Étape ${currentStep + 1} sur ${totalSteps}`}>
          Étape {currentStep + 1}/{totalSteps}
        </span>
      </div>
      <div className="mt-4">
        <div
          className="h-2 bg-muted rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} aria-hidden="true" />
        </div>
      </div>
    </>
  );
}
