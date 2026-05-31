'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Trophy, Loader2 } from '@/components/ui/icons';

interface DrawButtonProps {
  activityId: number;
  ownerId: number;
  initialDrawCount?: number;
  initialHasDrawn?: boolean;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onDrawChange?: (_hasDrawn: boolean, _count: number) => void;
}

export function DrawButton({
  activityId,
  ownerId,
  initialDrawCount = 0,
  initialHasDrawn = false,
  showCount = true,
  size = 'md',
  className,
  onDrawChange,
}: DrawButtonProps) {
  const [hasDrawn, setHasDrawn] = useState(initialHasDrawn);
  const [drawCount, setDrawCount] = useState(initialDrawCount);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleDraw = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await api.toggleActivityDraw(activityId, ownerId);
      
      if (response.success) {
        setHasDrawn(response.has_drawn);
        setDrawCount(response.draw_count);
        onDrawChange?.(response.has_drawn, response.draw_count);
      }
    } catch {
      /* silencieux — draw toggle */
    } finally {
      setIsLoading(false);
    }
  }, [activityId, ownerId, isLoading, onDrawChange]);

  const sizeClasses = {
    sm: 'h-7 px-2 text-xs gap-1',
    md: 'h-9 px-3 text-sm gap-1.5',
    lg: 'h-11 px-4 text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      onClick={handleToggleDraw}
      disabled={isLoading}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        hasDrawn
          ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90'
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className={cn('animate-spin', iconSizes[size])} />
      ) : (
        <Trophy 
          className={cn(
            iconSizes[size],
            'transition-transform duration-200',
            hasDrawn && 'fill-current'
          )} 
        />
      )}
      {showCount && (
        <span className="tabular-nums">
          {drawCount > 0 ? drawCount : 'Draw'}
        </span>
      )}
    </button>
  );
}

interface ActivityDrawStatsProps {
  activityId: number;
  className?: string;
}

export function ActivityDrawStats({ activityId, className }: ActivityDrawStatsProps) {
  const [stats, setStats] = useState<{
    count: number;
    recent_draws: Array<{
      user_id: number;
      user_name: string;
      created_at: string;
    }>;
    has_drawn: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stats on mount
  useState(() => {
    const loadStats = async () => {
      try {
        const response = await api.getActivityDrawStats(activityId);
        if (response.success) {
          setStats(response);
        }
      } catch {
        /* silencieux */
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  });

  if (isLoading || !stats) return null;

  if (stats.count === 0) return null;

  return (
    <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}>
      <Trophy className="w-3.5 h-3.5" />
      <span>
        {stats.count} draw{stats.count > 1 ? 's' : ''}
        {stats.recent_draws.length > 0 && (
          <span className="ml-1">
            dont {stats.recent_draws.slice(0, 3).map(d => d.user_name).join(', ')}
            {stats.recent_draws.length > 3 && ` et ${stats.recent_draws.length - 3} autres`}
          </span>
        )}
      </span>
    </div>
  );
}
