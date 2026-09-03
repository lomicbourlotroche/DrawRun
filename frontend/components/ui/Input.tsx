import React from 'react';
import { forwardRef, cloneElement, isValidElement, useState, useEffect, type InputHTMLAttributes, type ReactNode, useId } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, X } from '@/components/ui/icons';
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  clearable?: boolean;
}
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, leftIcon, rightIcon, id, clearable = false, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") + "-" + generatedId : generatedId);
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const [value, setValue] = useState(props.value || props.defaultValue || '');
    const handleClear = () => {
      setValue('');
      if (props.onChange) {
        const event = { target: { value: '', name: props.name } } as React.ChangeEvent<HTMLInputElement>;
        props.onChange(event);
      }
    };
    useEffect(() => {
      if (props.value !== undefined) {
        setValue(props.value || '');
      }
    }, [props.value]);
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-muted-foreground mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            isValidElement(leftIcon)
              ? cloneElement(leftIcon as React.ReactElement<{ className?: string }>, {
                  className: cn((leftIcon as React.ReactElement<{ className?: string }>).props?.className, 'absolute left-3 top-1/2 -translate-y-1/2 text-muted'),
                })
              : <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">{leftIcon}</div>
          )}
          <input
            type={type}
            id={inputId}
            ref={ref}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              props.onChange?.(e);
            }}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : (hint ? hintId : undefined)}
            className={cn(
              'w-full bg-surface border rounded-lg px-4 py-2.5 text-foreground',
              'placeholder:text-muted',
              'focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400',
              'transition-all duration-200 ease-smooth',
              'hover:border-border',
              leftIcon && 'pl-10',
              rightIcon && !clearable && 'pr-10',
              rightIcon && clearable && 'pr-16',
              error ? 'border-danger-400 focus:ring-danger-200' : 'border-border',
              className
            )}
            {...props}
          />
          {rightIcon && !clearable && (
            isValidElement(rightIcon)
              ? cloneElement(rightIcon as React.ReactElement<{ className?: string }>, {
                  className: cn((rightIcon as React.ReactElement<{ className?: string }>).props?.className, 'absolute right-3 top-1/2 -translate-y-1/2 text-muted'),
                })
              : <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">{rightIcon}</div>
          )}
          {clearable && value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
              aria-label="Clear"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-danger flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-muted">{hint}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
export { Input };
