'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface ElevationPoint {
  distance: number;
  elevation: number;
}

interface ElevationProfileProps {
  data: ElevationPoint[];
  height?: number;
  color?: string;
}

function formatDist(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
  return `${Math.round(m)} m`;
}

export default function ElevationProfile({
  data,
  height = 120,
  color = '#3b82f6',
}: ElevationProfileProps) {
  const chartData = useMemo(() => {
    return data.map((pt) => ({
      dist: pt.distance,
      elev: Math.round(pt.elevation * 10) / 10,
    }));
  }, [data]);

  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-xs text-muted-foreground bg-muted/30 rounded-lg"
        style={{ height }}
      >
        Pas assez de données d&apos;élévation
      </div>
    );
  }

  const maxElev = Math.max(...data.map((d) => d.elevation));
  const minElev = Math.min(...data.map((d) => d.elevation));
  const range = maxElev - minElev || 10;
  const yMin = Math.max(0, minElev - range * 0.1);
  const yMax = maxElev + range * 0.1;

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <defs>
            <linearGradient id={`elevation-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="dist"
            tickFormatter={formatDist}
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            type="number"
            domain={['dataMin', 'dataMax']}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            domain={[Math.floor(yMin), Math.ceil(yMax)]}
            width={35}
          />
          <Tooltip
            formatter={(value: number) => [`${value} m`, 'Altitude']}
            labelFormatter={(label: number) => formatDist(label)}
            contentStyle={{
              background: 'rgba(255,255,255,0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Area
            type="monotone"
            dataKey="elev"
            stroke={color}
            strokeWidth={2}
            fill={`url(#elevation-grad-${color.replace('#', '')})`}
            dot={false}
            activeDot={{ r: 3, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
        <span>D+ {Math.round(maxElev - (chartData[0]?.elev || 0))} m</span>
        <span>{formatDist(chartData[chartData.length - 1]?.dist || 0)}</span>
      </div>
    </div>
  );
}
