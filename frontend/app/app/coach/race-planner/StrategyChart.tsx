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
  Bar,
  Cell,
} from 'recharts';

interface StrategyChartProps {
  segments: Array<Record<string, unknown>>;
  segmentsWithGrade: Array<{ grade: number }>;
}

export default function StrategyChart({ segments, segmentsWithGrade }: StrategyChartProps) {
  const formatPace = (paceStr: string) => {
    return paceStr + ' /km';
  };

  return (
    <>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={segments}>
            <defs>
              <linearGradient id="colorElev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary-400)" stopOpacity={0.1} />
                <stop offset="95%" stopColor="var(--primary-400)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="km"
              label={{ value: 'Kilomètre', position: 'insideBottomRight', offset: -5 }}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              yAxisId="left"
              label={{ value: 'Elev (m)', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              reversed
              label={{ value: 'Allure (sec)', angle: 90, position: 'insideRight' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              formatter={(value: number, name: string) => {
                if (name === 'targetPaceSec') return [formatPace(`${Math.floor(value / 60)}:${String(Math.round(value % 60)).padStart(2, '0')}`), 'Allure'];
                if (name === 'elevGain') return [`+${value}m`, 'Dénivelé'];
                return [value, name];
              }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="elevGain"
              stroke="var(--primary-400)"
              fillOpacity={1}
              fill="url(#colorElev)"
              name="Elevation"
            />
            <Bar
              yAxisId="right"
              dataKey="targetPaceSec"
              fill="var(--danger)"
              fillOpacity={0.6}
              name="Allure"
            >
              {segmentsWithGrade.map((entry: { grade: number }, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.grade > 1 ? 'var(--danger)' : entry.grade < -1 ? 'var(--success)' : 'var(--danger)'} />
              ))}
            </Bar>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-4 text-xs font-medium text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-danger/60 rounded-sm"></div>
          <span>Montée (Allure +)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-success/60 rounded-sm"></div>
          <span>Descente (Allure -)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-primary/10 border border-primary/30 rounded-sm"></div>
          <span>Profil Altitude</span>
        </div>
      </div>
    </>
  );
}
