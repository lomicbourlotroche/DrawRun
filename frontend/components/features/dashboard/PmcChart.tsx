'use client';

import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { cn, formatDateShort } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import type { PmcDataPoint } from '@/types';
import { TrendingUp, TrendingDown } from '@/components/ui/icons';

interface PmcChartProps {
  data: PmcDataPoint[];
  isLoading?: boolean;
}

const getACWRColor = (acwr: number) => {
  if (acwr < 0.8) return { bg: 'bg-primary/10', text: 'text-primary', label: 'Sous-entrainement' };
  if (acwr < 1.3) return { bg: 'bg-success/10', text: 'text-success', label: 'Optimal' };
  if (acwr < 1.5) return { bg: 'bg-warning/10', text: 'text-warning', label: 'Surveillance' };
  return { bg: 'bg-danger/10', text: 'text-danger', label: 'Risque' };
};

export function PmcChart({ data, isLoading }: PmcChartProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const chartData = useMemo(() => {
    return data.map((point) => ({
      ...point,
      dateLabel: formatDateShort(point.date),
      tsbColor: point.tsb >= 0 ? 'var(--success)' : 'var(--danger)',
    }));
  }, [data]);

  const latest = data[data.length - 1] || { ctl: 0, atl: 0, tsb: 0, acwr: 1, monotony: 1, strain: 0 };
  const acwrInfo = getACWRColor(latest.acwr || 1);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-surface rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const getFormStatus = (tsb: number) => {
    if (tsb < -15) return { label: 'Surentrainement', color: 'text-danger' };
    if (tsb < -5) return { label: 'Fatigu\u00e9', color: 'text-peak' };
    if (tsb < 5) return { label: 'Neutre', color: 'text-muted' };
    if (tsb < 25) return { label: 'Bonne forme', color: 'text-success' };
    return { label: 'Optimale', color: 'text-primary' };
  };

  const formStatus = getFormStatus(latest.tsb);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Performance Management</CardTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                showAdvanced ? 'bg-primary text-primary-foreground' : 'bg-surface text-muted hover:text-foreground',
              )}
            >
              {showAdvanced ? 'Vue simple' : 'Vue avanc\u00e9e'}
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted text-sm">CTL</span>
            <span className="font-semibold text-foreground">{latest.ctl}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-danger" />
            <span className="text-muted text-sm">ATL</span>
            <span className="font-semibold text-foreground">{latest.atl}</span>
          </div>
          <div className="flex items-center gap-2">
            {latest.tsb >= 0 ? (
              <TrendingUp className="w-4 h-4 text-success" />
            ) : (
              <TrendingDown className="w-4 h-4 text-danger" />
            )}
            <span className="text-muted text-sm">TSB</span>
            <span className={cn('font-semibold', latest.tsb >= 0 ? 'text-success' : 'text-danger')}>{latest.tsb}</span>
          </div>
          <div className={cn('flex items-center gap-2 rounded-lg px-2 py-1', acwrInfo.bg)}>
            <span className="text-muted text-sm">ACWR</span>
            <span className={cn('font-semibold', acwrInfo.text)}>{(latest.acwr || 1).toFixed(2)}</span>
          </div>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-3 bg-surface rounded-lg">
            <div>
              <span className="text-muted text-xs">Forme</span>
              <p className={cn('font-semibold', formStatus.color)}>{formStatus.label}</p>
            </div>
            <div>
              <span className="text-muted text-xs">Monotonie</span>
              <p
                className={cn(
                  'font-semibold',
                  (latest.monotony || 1) > 2
                    ? 'text-danger'
                    : (latest.monotony || 1) > 1.5
                      ? 'text-peak'
                      : 'text-foreground',
                )}
              >
                {(latest.monotony || 1).toFixed(2)}
              </p>
            </div>
            <div>
              <span className="text-muted text-xs">Strain</span>
              <p className="font-semibold text-foreground">{latest.strain || 0}</p>
            </div>
            <div>
              <span className="text-muted text-xs">SB</span>
              <p className="font-semibold text-foreground">{latest.sb || 0}</p>
            </div>
          </div>
        )}

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="ctlGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="atlGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--danger)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="tsbGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" />
              <XAxis dataKey="dateLabel" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
              <ReferenceLine y={0} stroke="var(--muted)" strokeDasharray="3 3" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                }}
                labelStyle={{ color: 'var(--foreground)' }}
                formatter={(value: number, name: string) => [value.toFixed(1), name]}
              />
              <Area
                type="monotone"
                dataKey="ctl"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#ctlGradient)"
                name="CTL (Fitness)"
              />
              <Area
                type="monotone"
                dataKey="atl"
                stroke="var(--danger)"
                strokeWidth={2}
                fill="url(#atlGradient)"
                name="ATL (Fatigue)"
              />
              {showAdvanced && (
                <Area
                  type="monotone"
                  dataKey="tsb"
                  stroke="var(--success)"
                  strokeWidth={1}
                  fill="url(#tsbGradient)"
                  fillOpacity={0.1}
                  name="TSB (Forme)"
                />
              )}
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
