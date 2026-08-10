'use client';

import { TrendingUp } from '@/components/ui/icons';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { fmtPace } from './race-planning.utils';
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  Line,
  ReferenceLine,
  Legend,
} from 'recharts';
import type { Split } from '@/types';

interface RaceChartProps {
  splits: Split[];
  strategyBias?: number;
  elevationAutoDetected?: boolean;
}

export function RaceChart({ splits, strategyBias, elevationAutoDetected }: RaceChartProps) {
  const chartData = splits.map((s: Split) => ({
    km: s.km,
    pace: s.pace,
    elevation: (s as { elevChange?: number }).elevChange ?? 0,
    grade: (s as { grade?: number }).grade ?? 0,
    hr: s.hrRange ? parseInt(s.hrRange.split('-')[0]) : null,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Courbe de Stratégie d&apos;Allure
          {elevationAutoDetected && (
            <span className="text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-2">
              Terrain auto-détecté depuis GPX
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56 sm:h-72 lg:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis
                dataKey="km"
                stroke="var(--muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                label={{ value: 'km', position: 'insideBottomRight', offset: -5, fontSize: 11 }}
              />
              <YAxis
                yAxisId="pace"
                orientation="left"
                reversed
                stroke="var(--primary)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => fmtPace(v)}
                label={{ value: 'Allure', angle: -90, position: 'insideLeft', fill: 'var(--primary)', fontSize: 10 }}
              />
              <YAxis
                yAxisId="elev"
                orientation="right"
                stroke="var(--primary)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}m`}
                label={{ value: 'Dénivelé', angle: 90, position: 'insideRight', fill: 'var(--primary)', fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'pace') return [fmtPace(Number(value)) + '/km', 'Allure'];
                  if (name === 'elevation') return [`${Number(value) > 0 ? '+' : ''}${value}m`, 'Dénivelé'];
                  if (name === 'grade') return [`${value}%`, 'Pente'];
                  return [value, name];
                }}
              />
              <Legend formatter={(v) => (v === 'pace' ? 'Allure' : v === 'elevation' ? 'Dénivelé' : 'Pente')} />
              <ReferenceLine yAxisId="elev" y={0} stroke="var(--muted)" strokeDasharray="3 3" />
              <Area
                yAxisId="elev"
                type="monotone"
                dataKey="elevation"
                stroke="var(--primary)"
                fill="var(--primary)"
                fillOpacity={0.15}
                strokeWidth={1.5}
                name="elevation"
              />
              <Line
                yAxisId="pace"
                type="monotone"
                dataKey="pace"
                stroke="var(--primary)"
                strokeWidth={3}
                dot={false}
                name="pace"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-indigo-400 rounded" />
            <span>Allure cible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 bg-primary/80/20 border border-blue-400/40 rounded-sm" />
            <span>Dénivelé</span>
          </div>
          {strategyBias !== undefined && (
            <div className="ml-auto text-xs font-medium text-primary">
              Stratégie :{' '}
              {strategyBias < -0.1 ? '⬇ Negative split' : strategyBias > 0.1 ? '⬆ Positive split' : '➡ Régulier'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
