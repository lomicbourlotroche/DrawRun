import type { IconType } from 'react-icons';

export interface Field {
  name: string;
  type: 'text' | 'number' | 'select' | 'checkbox';
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: IconType;
  fields: Field[];
  completed: boolean;
  required: boolean;
}

export interface OnboardingFormData {
  name: string;
  fcm: string;
  vma: string;
  restingHR: string;
  sex: string;
  weeklyKm: string;
  goal: string;
  vdot?: string;
}

export interface OnboardingStepStatus {
  profile: boolean;
  fcm: boolean;
  vma: boolean;
  plan: boolean;
  first_activity: boolean;
  sync: boolean;
}
