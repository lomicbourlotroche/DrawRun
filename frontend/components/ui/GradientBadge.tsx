'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface GradientBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  dot?: boolean;
  dotColor?: string;
  children: ReactNode;
}

/**
 * GradientBadge - Badge avec style landing page DrawRun
 * Inspiré des badges de la section Hero
 */
const GradientBadge = forwardRef<HTMLSpanElement, GradientBadgeProps>(
  (
    { className, variant = 'primary', size = 'md', icon: Icon, dot = false, dotColor, children, ...props },
    ref
  ) => {
    const variantStyles = {
      primary: 'bg-primary-100/80 text-primary-700 border-primary-200',
      success: 'bg-success-100/80 text-success-700 border-success-200',
      warning: 'bg-warning-100/80 text-warning-700 border-warning-200',
      danger: 'bg-danger-100/80 text-danger-700 border-danger-200',
      info: 'bg-primary-100/80 text-primary-700 border-primary-200',
      neutral: 'bg-neutral-100/80 text-neutral-700 border-neutral-200',
    };

    const sizeStyles = {
      sm: 'px-2 py-0.5 text-xs gap-1',
      md: 'px-3 py-1.5 text-xs gap-1.5',
      lg: 'px-4 py-2 text-sm gap-2',
    };

    const iconSizes = {
      sm: 'w-3 h-3',
      md: 'w-3.5 h-3.5',
      lg: 'w-4 h-4',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-semibold rounded-full border',
          'transition-all duration-200',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'w-2 h-2 rounded-full animate-pulse',
              dotColor || 'bg-current'
            )}
          />
        )}
        {Icon && <Icon className={cn('flex-shrink-0', iconSizes[size])} />}
        {children}
      </span>
    );
  }
);

GradientBadge.displayName = 'GradientBadge';

/**
 * StatusBadge - Badge de statut avec indicateur
 */
interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: 'online' | 'offline' | 'busy' | 'away' | 'active' | 'inactive';
  children: ReactNode;
  size?: 'sm' | 'md';
}

const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, status, children, size = 'md', ...props }, ref) => {
    const statusConfig = {
      online: { variant: 'success' as const, dotColor: 'bg-success-500' },
      offline: { variant: 'neutral' as const, dotColor: 'bg-neutral-400' },
      busy: { variant: 'danger' as const, dotColor: 'bg-danger-500' },
      away: { variant: 'warning' as const, dotColor: 'bg-warning-500' },
      active: { variant: 'success' as const, dotColor: 'bg-success-500' },
      inactive: { variant: 'neutral' as const, dotColor: 'bg-neutral-400' },
    };

    const config = statusConfig[status];

    return (
      <GradientBadge
        ref={ref}
        variant={config.variant}
        size={size}
        dot
        dotColor={config.dotColor}
        className={className}
        {...props}
      >
        {children}
      </GradientBadge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

export { GradientBadge, StatusBadge };
