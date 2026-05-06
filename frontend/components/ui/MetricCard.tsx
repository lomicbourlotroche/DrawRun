/* eslint-disable no-undef */
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface MetricCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral' | 'positive' | 'negative';
  trendValue?: string;
  color?: 'primary' | 'success' | 'recovery' | 'warning' | 'danger' | 'peak' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass' | 'bordered';
}

const MetricCard = forwardRef<HTMLDivElement, MetricCardProps>(
  ({ 
    className, 
    label, 
    value, 
    unit, 
    icon, 
    trend, 
    trendValue,
    color = 'neutral',
    size = 'md',
    variant = 'default',
    ...props 
  }, ref) => {
    const colorStyles = {
      primary: {
        icon: 'bg-primary-100 text-primary-600',
        glow: 'shadow-glow-primary',
        trend: { up: 'text-primary-600', down: 'text-danger-500', neutral: 'text-neutral-500' }
      },
      success: {
        icon: 'bg-success-100 text-success-600',
        glow: 'shadow-glow-success',
        trend: { up: 'text-success-500', down: 'text-danger-500', neutral: 'text-neutral-500' }
      },
      recovery: {
        icon: 'bg-recovery-100 text-recovery-600',
        glow: 'shadow-glow-recovery',
        trend: { up: 'text-recovery-500', down: 'text-danger-500', neutral: 'text-neutral-500' }
      },
      warning: {
        icon: 'bg-warning-100 text-warning-600',
        glow: '',
        trend: { up: 'text-warning-500', down: 'text-danger-500', neutral: 'text-neutral-500' }
      },
      danger: {
        icon: 'bg-danger-100 text-danger-600',
        glow: '',
        trend: { up: 'text-danger-500', down: 'text-success-500', neutral: 'text-neutral-500' }
      },
      peak: {
        icon: 'bg-peak-100 text-peak-600',
        glow: 'shadow-glow-peak',
        trend: { up: 'text-peak-500', down: 'text-danger-500', neutral: 'text-neutral-500' }
      },
      neutral: {
        icon: 'bg-neutral-100 text-neutral-600',
        glow: '',
        trend: { up: 'text-neutral-600', down: 'text-neutral-600', neutral: 'text-neutral-500' }
      },
    };

    const sizes = {
      sm: {
        card: 'p-3',
        value: 'text-xl',
        unit: 'text-xs',
        label: 'text-xs',
        icon: 'w-8 h-8',
      },
      md: {
        card: 'p-4 md:p-5',
        value: 'text-2xl md:text-3xl',
        unit: 'text-sm',
        label: 'text-sm',
        icon: 'w-10 h-10',
      },
      lg: {
        card: 'p-5 md:p-6',
        value: 'text-3xl md:text-4xl',
        unit: 'text-base',
        label: 'text-base',
        icon: 'w-12 h-12',
      },
    };

    const trendMap: Record<string, 'up' | 'down' | 'neutral'> = {
      positive: 'up',
      negative: 'down',
      up: 'up',
      down: 'down',
      neutral: 'neutral',
    };

    const mappedTrend = trend ? trendMap[trend] : undefined;
    const styles = colorStyles[color];
    const sizeStyles = sizes[size];

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl transition-all duration-200',
          variant === 'default' && 'bg-white border border-neutral-200 shadow-card hover:shadow-card-hover',
          variant === 'glass' && 'bg-white/80 backdrop-blur-xl border border-white/40',
          variant === 'bordered' && 'bg-transparent border-2 border-neutral-200',
          sizeStyles.card,
          styles.glow,
          'hover:-translate-y-0.5',
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <span className={cn(
              'font-semibold text-neutral-400 uppercase tracking-wider',
              sizeStyles.label
            )}>
              {label}
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className={cn(
                'font-bold text-neutral-900 tabular-nums tracking-tight',
                sizeStyles.value
              )}>
                {value}
              </span>
              {unit && (
                <span className={cn('font-medium text-neutral-500', sizeStyles.unit)}>
                  {unit}
                </span>
              )}
            </div>
            {mappedTrend && trendValue && (
              <div className={cn(
                'flex items-center gap-1 text-sm font-medium mt-1',
                styles.trend[mappedTrend]
              )}>
                <span>
                  {mappedTrend === 'up' && '↑'}
                  {mappedTrend === 'down' && '↓'}
                  {mappedTrend === 'neutral' && '→'}
                </span>
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          {icon && (
            <div className={cn(
              'flex items-center justify-center rounded-xl shrink-0',
              sizeStyles.icon,
              styles.icon
            )}>
              {icon}
            </div>
          )}
        </div>
      </div>
    );
  }
);

MetricCard.displayName = 'MetricCard';

export { MetricCard };
