import { cn } from '@/lib/utils';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  if (src) {
    return (
      <Image
        src={src}
        alt={name || 'Avatar'}
        width={64}
        height={64}
        unoptimized
        className={cn('rounded-full object-cover bg-surface', sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-primary/20 text-primary font-medium flex items-center justify-center',
        sizes[size],
        className,
      )}
      role="img"
      aria-label={name || 'Avatar'}
    >
      {initials}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  icon?: React.ReactNode;
  color?: string;
  className?: string;
}

export function StatCard({ label, value, unit, trend, icon, color, className }: StatCardProps) {
  return (
    <div className={cn('bg-surface border border-border rounded-lg p-4', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold text-foreground">{value}</span>
            {unit && <span className="text-sm text-muted">{unit}</span>}
          </div>
          {trend && (
            <p className={cn('text-xs mt-1', trend.direction === 'up' ? 'text-success' : 'text-danger')}>
              {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        {icon && (
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: color ? `${color}20` : 'var(--primary)/20', color: color || 'var(--primary)' }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
