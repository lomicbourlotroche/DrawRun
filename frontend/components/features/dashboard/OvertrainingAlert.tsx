'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import { Card, CardContent } from '@/components/ui';
import { AlertTriangle, CheckCircle, Info, TrendingDown, Activity, Heart } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

interface OvertrainingData {
  risk: 'low' | 'moderate' | 'high' | 'unknown';
  acwr: number | null;
  ctl: number;
  atl: number;
  tsb: number;
  message: string;
  recommendation?: string;
}

export default function OvertrainingAlert() {
  const [data, setData] = useState<OvertrainingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await api.checkOvertraining();
      setData(result as OvertrainingData);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error('Failed to load overtraining data', { error: errMsg });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="h-16 rounded-xl bg-card border border-border overflow-hidden">
        <div className="h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-muted/20 to-transparent bg-[length:200%_100%]" />
      </div>
    );
  }

  if (!data || data.risk === 'unknown') {
    return null;
  }

  if (data.risk === 'low') {
    return (
      <div className="bg-success/10 border border-success/20 text-success text-sm rounded-xl px-4 py-2 flex items-center gap-2 w-fit">
        <CheckCircle className="w-4 h-4" />
        <span>Tout va bien</span>
      </div>
    );
  }

  if (data.risk === 'moderate') {
    return (
      <div className="animate-slide-down bg-warning/10 border border-warning/30 text-warning rounded-xl px-5 py-3 flex items-start gap-3">
        <Info className="w-5 h-5 mt-0.5 shrink-0" />
        <p className="text-sm">{data.message}</p>
      </div>
    );
  }

  return (
    <div className="animate-slide-down bg-danger/10 border-2 border-danger/30 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-6 h-6 text-danger animate-breathe shrink-0" />
        <div>
          <h3 className="font-bold text-foreground">Risque de surentraînement détecté</h3>
          <p className="text-sm text-muted mt-0.5">{data.message}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MetricBadge
          icon={<TrendingDown className="w-4 h-4" />}
          label="Fatigue"
          value={data.atl.toFixed(1)}
          color="text-danger"
        />
        <MetricBadge
          icon={<Activity className="w-4 h-4" />}
          label="Fitness"
          value={data.ctl.toFixed(1)}
          color="text-success"
        />
        <MetricBadge
          icon={<Heart className="w-4 h-4" />}
          label="Forme (TSB)"
          value={`${data.tsb > 0 ? '+' : ''}${data.tsb.toFixed(1)}`}
          color={data.tsb > 0 ? 'text-success' : data.tsb < -10 ? 'text-danger' : 'text-warning'}
        />
      </div>

      {data.acwr !== null && data.acwr !== undefined && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">
            ACWR: <strong className="text-foreground">{data.acwr.toFixed(2)}</strong>
          </span>
          <div className="flex gap-2 text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success" /> Bon
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-warning" /> Modéré
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-danger" /> Risque
            </span>
          </div>
        </div>
      )}

      {data.recommendation && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-foreground">Recommandation coach</p>
            <p className="text-xs text-muted mt-0.5">{data.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricBadge({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg bg-background/50 border border-border/50 p-3">
      <div className={cn('flex items-center gap-1', color)}>
        {icon}
        <span className="text-lg font-bold">{value}</span>
      </div>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}
