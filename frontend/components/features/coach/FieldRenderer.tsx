'use client';

import { Sparkles } from 'lucide-react';

export interface Field {
  name: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'multiselect' | 'distance';
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  condition?: (_formData: Record<string, unknown>) => boolean;
}

interface FieldRendererProps {
  field: Field;
  formData: Record<string, unknown>;
  autoFilledFields: Set<string>;
  onUpdateField: (_name: string, _value: unknown) => void;
  onMultiSelect: (_name: string, _value: string) => void;
}

export default function FieldRenderer({
  field,
  formData,
  autoFilledFields,
  onUpdateField,
  onMultiSelect,
}: FieldRendererProps) {
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
        <div className="space-y-1.5">
          <label className="flex items-center text-sm font-medium text-foreground">
            {field.label}{autoFilledBadge}
          </label>
          <input
            type="text"
            value={(formData[field.name] as string) || ''}
            onChange={e => onUpdateField(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={inputClass}
          />
        </div>
      );

    case 'number':
    case 'distance':
      return (
        <div className="space-y-1.5">
          <label className="flex items-center text-sm font-medium text-foreground">
            {field.label}{autoFilledBadge}
          </label>
          <input
            type="number"
            step={field.type === 'distance' ? '0.1' : '1'}
            value={(formData[field.name] as string | number) || ''}
            onChange={e => onUpdateField(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={inputClass}
          />
        </div>
      );

    case 'select':
      return (
        <div className="space-y-1.5">
          <label className="flex items-center text-sm font-medium text-foreground">
            {field.label}{autoFilledBadge}
          </label>
          <select
            value={(formData[field.name] as string) || ''}
            onChange={e => onUpdateField(field.name, e.target.value)}
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
        <div className="space-y-1.5">
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
                  onClick={() => onMultiSelect(field.name, opt.value)}
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
        <div className="flex items-center gap-2.5">
          <input
            type="checkbox"
            id={field.name}
            checked={(formData[field.name] as boolean) || false}
            onChange={e => onUpdateField(field.name, e.target.checked)}
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
}
