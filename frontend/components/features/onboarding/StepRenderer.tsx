'use client';

import type { Field, OnboardingFormData } from './types';

interface StepRendererProps {
  fields: Field[];
  formData: OnboardingFormData;
  onChange: (_name: string, _value: string) => void;
  onSubmit: (_e: React.FormEvent) => void;
}

export default function StepRenderer({ fields, formData, onChange, onSubmit }: StepRendererProps) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <label className="block text-sm font-medium text-foreground" htmlFor={`field-${field.name}`}>
            {field.label}
            {field.required && (
              <span className="text-danger/80 ml-1" aria-label="obligatoire">
                *
              </span>
            )}
          </label>
          {field.type === 'text' && (
            <input
              id={`field-${field.name}`}
              type="text"
              value={formData[field.name as keyof OnboardingFormData] || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
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
              onChange={(e) => onChange(field.name, e.target.value)}
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
              onChange={(e) => onChange(field.name, e.target.value)}
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
  );
}
