'use client';

import { Card, CardContent, StatCard } from '@/components/ui';
import { TrendingUp, TrendingDown, Activity, Target } from '@/components/ui/icons';

interface QuickStatsProps {
  stats: {
    ctl?: number;
    atl?: number;
    tsb?: number;
    acwr?: number;
  };
  isLoading?: boolean;
}

export function QuickStats({ stats, isLoading }: QuickStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="h-16 bg-surface rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getTsbTrend = () => {
    if (!stats.tsb) return { direction: 'down' as const, value: 0 };
    if (stats.tsb >= 25) return { direction: 'up' as const, value: 15 };
    if (stats.tsb >= 0) return { direction: 'up' as const, value: 5 };
    return { direction: 'down' as const, value: 10 };
  };

  const acwrStatus = stats.acwr
    ? stats.acwr >= 0.8 && stats.acwr <= 1.3
      ? 'optimal'
      : stats.acwr < 0.8
      ? 'low'
      : 'high'
    : 'unknown';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="CTL (Fitness)"
        value={stats.ctl?.toFixed(1) || '-'}
        icon={<TrendingUp className="w-5 h-5" />}
        color="var(--primary)"
      />

      <StatCard
        label="ATL (Fatigue)"
        value={stats.atl?.toFixed(1) || '-'}
        icon={<Activity className="w-5 h-5" />}
        color="var(--danger)"
      />

      <StatCard
        label="TSB (Forme)"
        value={stats.tsb?.toFixed(1) || '-'}
        trend={getTsbTrend()}
        icon={stats.tsb && stats.tsb >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
        color={stats.tsb && stats.tsb >= 0 ? 'var(--success)' : 'var(--danger)'}
      />

      <StatCard
        label="ACWR"
        value={stats.acwr?.toFixed(2) || '-'}
        icon={<Target className="w-5 h-5" />}
        color={acwrStatus === 'optimal' ? 'var(--success)' : acwrStatus === 'low' ? 'var(--peak)' : 'var(--danger)'}
      />
    </div>
  );
}
