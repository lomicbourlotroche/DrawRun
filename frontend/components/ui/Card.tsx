'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'highlight' | 'bordered' | 'ghost' | 'glass-subtle' | 'glass-elevated';
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  accent?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'peak' | 'none';
}

const accentBorder: Record<string, string> = {
  primary: 'before:bg-primary',
  success: 'before:bg-success',
  warning: 'before:bg-warning',
  danger: 'before:bg-danger',
  info: 'before:bg-peak',
  peak: 'before:bg-peak',
  none: '',
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', hover = false, accent, children, ...props }, ref) => {
    const variants = {
      default: cn(
        'bg-surface border border-border',
        'shadow-card rounded-xl',
        'transition-all duration-200 ease-smooth',
      ),
      elevated: cn(
        'bg-surface border border-border',
        'shadow-elevated rounded-xl',
        hover && 'hover:shadow-card-hover hover:-translate-y-0.5',
        'transition-all duration-200 ease-smooth',
      ),
      glass: cn(
        'bg-surface/70 backdrop-blur-md',
        'border border-border',
        'shadow-sm rounded-xl',
        hover && 'hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5',
        'transition-all duration-200 ease-smooth',
      ),
      'glass-subtle': cn(
        'bg-surface/50 backdrop-blur-sm',
        'border border-border/60',
        'shadow-sm rounded-xl',
        'transition-all duration-200 ease-smooth',
      ),
      'glass-elevated': cn(
        'bg-surface/80 backdrop-blur-md',
        'border border-border',
        'shadow-md rounded-xl',
        hover && 'hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5',
        'transition-all duration-200 ease-smooth',
      ),
      highlight: cn(
        'bg-surface border-2 border-primary',
        'shadow-card rounded-xl',
        'ring-2 ring-primary/10',
        'transition-all duration-200 ease-smooth',
      ),
      bordered: cn(
        'bg-transparent border-2 border-border',
        'rounded-xl',
        hover && 'hover:border-primary/30 hover:bg-surface',
        'transition-all duration-200 ease-smooth',
      ),
      ghost: cn(
        'bg-transparent border border-transparent',
        'rounded-xl',
        hover && 'hover:bg-surface hover:border-border',
        'transition-all duration-200 ease-smooth',
      ),
    };

    const paddings = {
      none: '',
      xs: 'p-2',
      sm: 'p-3',
      md: 'p-4 md:p-5',
      lg: 'p-5 md:p-6',
      xl: 'p-6 md:p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl transition-all duration-200 ease-smooth relative',
          accent &&
            accent !== 'none' && [
              'before:absolute before:top-0 before:left-3 before:right-3 before:h-[3px] before:rounded-t-xl before:rounded-full',
              accentBorder[accent],
            ],
          variants[variant],
          paddings[padding],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-2 pb-4', className)} {...props} />
));

CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn('text-lg font-bold text-foreground tracking-tight', className)} {...props} />
));

CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted leading-relaxed', className)} {...props} />
  ),
);

CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
));

CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center justify-end gap-3 pt-4 mt-auto', className)} {...props} />
));

CardFooter.displayName = 'CardFooter';

interface CardStatProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

const CardStat = forwardRef<HTMLDivElement, CardStatProps>(
  ({ className, label, value, unit, trend, trendValue, ...props }, ref) => {
    const trendColors = {
      up: 'text-success',
      down: 'text-danger',
      neutral: 'text-muted',
    };

    const trendIcons = {
      up: '↑',
      down: '↓',
      neutral: '→',
    };

    return (
      <div ref={ref} className={cn('flex flex-col', className)} {...props}>
        <span className="text-xs font-semibold text-muted uppercase tracking-wider">{label}</span>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold text-foreground tabular-nums">{value}</span>
          {unit && <span className="text-sm font-medium text-muted">{unit}</span>}
        </div>
        {trend && (
          <div className={cn('flex items-center gap-1 text-xs font-medium mt-1', trendColors[trend])}>
            <span>{trendIcons[trend]}</span>
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    );
  },
);

CardStat.displayName = 'CardStat';

/* ===== Backward-compatible GlassCard aliases ===== */

const GlassCard = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', hover = true, children, ...props }, ref) => {
    const glassVariants: Record<string, string> = {
      default: 'bg-surface/90 backdrop-blur-md border border-surface/60 shadow-sm',
      elevated:
        'bg-surface/90 backdrop-blur-md border border-surface/60 shadow-md hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5',
      subtle: 'bg-surface/70 backdrop-blur-md border border-surface/40 shadow-sm',
    };

    const paddings = {
      none: '',
      xs: 'p-2',
      sm: 'p-3',
      md: 'p-4 md:p-5',
      lg: 'p-5 md:p-6',
      xl: 'p-6 md:p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl transition-all duration-300 ease-smooth',
          glassVariants[variant] || glassVariants.default,
          hover && variant === 'default' && 'hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5',
          paddings[padding],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

GlassCard.displayName = 'GlassCard';

const GlassCardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-1.5 pb-4 border-b border-surface/50', className)} {...props} />
));

GlassCardHeader.displayName = 'GlassCardHeader';

const GlassCardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold tracking-tight text-foreground', className)} {...props} />
  ),
);

GlassCardTitle.displayName = 'GlassCardTitle';

const GlassCardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted leading-relaxed', className)} {...props} />
  ),
);

GlassCardDescription.displayName = 'GlassCardDescription';

const GlassCardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('pt-4', className)} {...props} />
));

GlassCardContent.displayName = 'GlassCardContent';

const GlassCardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center justify-between pt-4 mt-4 border-t border-surface/50', className)}
    {...props}
  />
));

GlassCardFooter.displayName = 'GlassCardFooter';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardStat,
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
};
