import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'highlight' | 'bordered' | 'ghost';
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', hover = false, children, ...props }, ref) => {
    const variants = {
      default: cn(
        'bg-white border border-neutral-200',
        'shadow-card'
      ),
      elevated: cn(
        'bg-white border border-neutral-200',
        'shadow-elevated',
        hover && 'hover:shadow-card-hover hover:-translate-y-1'
      ),
      glass: cn(
        'bg-white/80 backdrop-blur-xl',
        'border border-white/40',
        'shadow-lg'
      ),
      highlight: cn(
        'bg-white border-2 border-primary-400',
        'shadow-card',
        'ring-4 ring-primary-100'
      ),
      bordered: cn(
        'bg-transparent border-2 border-neutral-300',
        hover && 'hover:border-primary-300 hover:bg-neutral-50'
      ),
      ghost: cn(
        'bg-transparent border border-transparent',
        hover && 'hover:bg-neutral-50 hover:border-neutral-200'
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
          'rounded-2xl transition-all duration-200 ease-smooth',
          variants[variant],
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-2 pb-4', className)}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-bold text-neutral-900 tracking-tight', className)}
      {...props}
    />
  )
);

CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-neutral-500 leading-relaxed', className)}
      {...props}
    />
  )
);

CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  )
);

CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-end gap-3 pt-4 mt-auto', className)}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

// New: CardStat for displaying metrics
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
      up: 'text-success-500',
      down: 'text-danger-500',
      neutral: 'text-neutral-500',
    };

    const trendIcons = {
      up: '↑',
      down: '↓',
      neutral: '→',
    };

    return (
      <div ref={ref} className={cn('flex flex-col', className)} {...props}>
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
          {label}
        </span>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold text-neutral-900 tabular-nums">
            {value}
          </span>
          {unit && (
            <span className="text-sm font-medium text-neutral-500">{unit}</span>
          )}
        </div>
        {trend && (
          <div className={cn('flex items-center gap-1 text-xs font-medium mt-1', trendColors[trend])}>
            <span>{trendIcons[trend]}</span>
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    );
  }
);

CardStat.displayName = 'CardStat';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardStat };
