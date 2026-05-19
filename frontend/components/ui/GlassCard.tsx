'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'elevated' | 'subtle';
}

/**
 * GlassCard - Carte avec effet glassmorphism
 * Inspirée du style de la landing page DrawRun
 */
const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, hover = true, padding = 'md', variant = 'default', children, ...props }, ref) => {
    const baseStyles = cn(
      'rounded-2xl transition-all duration-300 ease-smooth',
      // Glassmorphism base - backdrop-blur-md pour plus de profondeur
      'bg-white/90 backdrop-blur-md',
      // Border subtile
      'border border-neutral-200/60',
      // Shadow doux
      'shadow-sm'
    );

    const variantStyles = {
      default: '',
      elevated: 'shadow-md',
      subtle: 'bg-white/70 border-neutral-200/40',
    };

    const hoverStyles = hover
      ? 'hover:shadow-md hover:border-primary-200/50 hover:-translate-y-0.5'
      : '';

    const paddingStyles = {
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
        className={cn(baseStyles, variantStyles[variant], hoverStyles, paddingStyles[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

/**
 * GlassCardHeader - En-tête de carte avec séparateur subtil
 */
const GlassCardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 pb-4 border-b border-neutral-100/50', className)}
      {...props}
    />
  )
);

GlassCardHeader.displayName = 'GlassCardHeader';

/**
 * GlassCardTitle - Titre avec style landing page
 */
const GlassCardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold tracking-tight text-foreground', className)}
      {...props}
    />
  )
);

GlassCardTitle.displayName = 'GlassCardTitle';

/**
 * GlassCardDescription - Description subtile
 */
const GlassCardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted leading-relaxed', className)}
      {...props}
    />
  )
);

GlassCardDescription.displayName = 'GlassCardDescription';

/**
 * GlassCardContent - Contenu principal
 */
const GlassCardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('pt-4', className)} {...props} />
  )
);

GlassCardContent.displayName = 'GlassCardContent';

/**
 * GlassCardFooter - Pied de carte avec actions
 */
const GlassCardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-between pt-4 mt-4 border-t border-neutral-100/50', className)}
      {...props}
    />
  )
);

GlassCardFooter.displayName = 'GlassCardFooter';

export { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent, GlassCardFooter };
