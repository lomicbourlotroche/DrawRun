'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (_value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Sélectionner...',
  label,
  error,
  disabled,
  className,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('w-full', className)} ref={ref}>
      {label && (
        <label className="block text-sm font-medium text-muted mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center justify-between bg-background border rounded-md px-4 py-3 min-h-[44px] text-left',
            'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
            'transition-all duration-200',
            error ? 'border-danger' : 'border-border',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className={cn(selectedOption ? 'text-foreground' : 'text-muted')}>
            {selectedOption ? (
              <span className="flex items-center gap-2">
                {selectedOption.icon}
                {selectedOption.label}
              </span>
            ) : (
              placeholder
            )}
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-muted transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg animate-slide-down max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-4 py-3 min-h-[44px] text-left hover:bg-background/50 transition-colors',
                  option.value === value && 'bg-primary/10 text-primary'
                )}
              >
                {option.icon}
                <span className="flex-1">{option.label}</span>
                {option.value === value && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}
