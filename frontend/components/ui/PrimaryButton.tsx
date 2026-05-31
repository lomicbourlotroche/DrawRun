'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode, type ComponentType } from 'react';
import { cn } from '@/lib/utils';
import type { IconProps } from '@/components/ui/icons';

export interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: ComponentType<IconProps>;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

/**
 * PrimaryButton - Boutons avec style landing page DrawRun
 * Inspirés des CTA de la section Hero
 */
const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      icon: Icon,
      iconPosition = 'left',
      loading = false,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center gap-2 font-semibold',
      'rounded-xl transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      // Hover lift effect
      'hover:-translate-y-0.5',
      // Disabled state
      (disabled || loading) && 'opacity-60 cursor-not-allowed hover:translate-y-0'
    );

    const variantStyles = {
      primary: cn(
        'bg-gradient-to-r from-primary-600 to-primary-500',
        'text-primary-foreground shadow-button-primary',
        'hover:shadow-button-primary-hover',
        'focus:ring-primary-500',
        'active:translate-y-0 active:shadow-none'
      ),
      secondary: cn(
        'bg-surface border-2 border-border',
        'text-foreground',
        'hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700',
        'focus:ring-primary-500',
        'active:bg-background'
      ),
      outline: cn(
        'bg-transparent border-2 border-primary-500',
        'text-primary-600',
        'hover:bg-primary-50',
        'focus:ring-primary-500',
        'active:bg-primary-100'
      ),
      ghost: cn(
        'bg-transparent',
        'text-muted',
        'hover:bg-background hover:text-foreground',
        'focus:ring-neutral-500',
        'active:bg-surface'
      ),
      danger: cn(
        'bg-gradient-to-r from-danger-600 to-danger-500',
        'text-danger-foreground shadow-md',
        'hover:shadow-lg',
        'focus:ring-danger-500',
        'active:translate-y-0 active:shadow-none'
      ),
    };

    const sizeStyles = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-7 py-4 text-base',
    };

    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-5 h-5',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className={cn('animate-spin', iconSizes[size])}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && Icon && iconPosition === 'left' && (
          <Icon className={cn('flex-shrink-0', iconSizes[size])} />
        )}
        {children}
        {!loading && Icon && iconPosition === 'right' && (
          <Icon className={cn('flex-shrink-0', iconSizes[size])} />
        )}
      </button>
    );
  }
);

PrimaryButton.displayName = 'PrimaryButton';

/**
 * LinkButton - Bouton style lien avec icône
 */
interface LinkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ComponentType<IconProps>;
  children: ReactNode;
}

const LinkButton = forwardRef<HTMLButtonElement, LinkButtonProps>(
  ({ className, icon: Icon, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 text-sm font-medium',
          'text-primary-600 hover:text-primary-700',
          'transition-colors duration-200',
          'focus:outline-none focus:underline',
          className
        )}
        {...props}
      >
        {children}
        {Icon && <Icon className="w-4 h-4" />}
      </button>
    );
  }
);

LinkButton.displayName = 'LinkButton';

export { PrimaryButton, LinkButton };
