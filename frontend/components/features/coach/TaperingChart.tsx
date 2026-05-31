'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Card } from '@/components/ui';
import { Zap, Calendar, TrendingDown } from '@/components/ui/icons';

/**
 * Data point for tapering plan chart
 */
interface TaperingPlanPoint {
  daysOut: number;
  volumePercent: number;
  intensity?: number;
  notes?: string;
}

/**
 * Props for TaperingChart component
 */
interface TaperingChartProps {
  data: {
    plan: TaperingPlanPoint[];
    expectedGain: number;
    recommendations: string[];
    reference: string;
  };
}

/**
 * TaperingChart component for displaying training tapering plans.
 * 
 * Features:
 * - Area chart showing volume reduction over time
 * - Strategic recommendations
 * - Explanation of tapering benefits
 * - Responsive design
 * 
 * @param data - Tapering data including plan points, expected gain, recommendations, and reference
 */
export const TaperingChart: React.FC<TaperingChartProps> = ({ data }) => {
  if (!data || !data.plan) return null;

  // Inverser pour l'affichage chronologique (J-14 -> J-0)
  const chartData = [...data.plan].reverse();

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-primary" />
          Plan d&apos;Affûtage (Phase J-14)
        </h3>
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-xs font-bold">
          <Zap className="w-3 h-3" />
          Gain estimé : +{data.expectedGain}%
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis 
              dataKey="daysOut" 
              reversed
              tickFormatter={(val) => `J-${val}`}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              label={{ value: 'Volume (%)', angle: -90, position: 'insideLeft' }}
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              formatter={(value: number) => [`${value}%`, 'Volume']}
              labelFormatter={(label) => `Jours restants : ${label}`}
            />
            <Area 
              type="monotone" 
              dataKey="volumePercent" 
              stroke="var(--primary)" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorVolume)" 
              name="Volume"
            />
            <ReferenceLine x={0} stroke="var(--danger)" strokeDasharray="3 3" label="Jour J" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-bold flex items-center gap-2 text-muted">
            <Calendar className="w-4 h-4" />
            Conseils stratégiques
          </h4>
          <ul className="space-y-2">
            {data.recommendations.map((rec: string, i: number) => (
              <li key={i} className="text-xs flex items-start gap-2 text-muted">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-surface p-4 rounded-2xl space-y-3">
          <h4 className="text-sm font-bold">Pourquoi l&apos;affûtage ?</h4>
          <p className="text-[10px] text-muted leading-relaxed">
            L&apos;affûtage (tapering) permet de dissiper la fatigue accumulée tout en maintenant les adaptations physiologiques. 
            Le modèle de Mujika utilisé ici privilégie une réduction **exponentielle** du volume pour une fraîcheur maximale le jour J.
          </p>
          <div className="pt-2 border-t border-border text-[10px] font-mono text-primary/70">
            Source : {data.reference}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TaperingChart;
