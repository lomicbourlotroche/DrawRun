import { cn } from '@/lib/utils';
import { getZoneColor } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'zone' | 'outline';
  zone?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', zone, size = 'sm', className }: BadgeProps) {
  const variants = {
    default: 'bg-surface border border-border text-text-secondary',
    primary: 'bg-primary/20 text-primary border border-primary/30',
    secondary: 'bg-neutral-100 border border-neutral-200 text-neutral-700',
    success: 'bg-success/20 text-success border border-success/30',
    warning: 'bg-warning/20 text-warning border border-warning/30',
    danger: 'bg-danger/20 text-danger border border-danger/30',
    zone: 'text-white border',
    outline: 'bg-transparent border border-primary text-primary',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  const bgColor = variant === 'zone' && zone ? getZoneColor(zone) : undefined;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        variants[variant],
        sizes[size],
        className
      )}
      style={bgColor ? { backgroundColor: `${bgColor}20`, borderColor: `${bgColor}50`, color: bgColor } : undefined}
    >
      {children}
    </span>
  );
}
