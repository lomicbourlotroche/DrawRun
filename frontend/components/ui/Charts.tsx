/* eslint-disable unused-imports/no-unused-vars */
'use client';

interface ChartProps {
  data: number[];
  labels?: string[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  showGrid?: boolean;
  showDots?: boolean;
  showArea?: boolean;
  unit?: string;
  min?: number;
  max?: number;
  formatValue?: (v: number) => string;
}

function autoScale(data: number[], padding = 0.1): { min: number; max: number; step: number } {
  const rawMin = Math.min(...data);
  const rawMax = Math.max(...data);
  const range = rawMax - rawMin || 1;
  const min = rawMin - range * padding;
  const max = rawMax + range * padding;
  const step = range / 4;
  return { min, max, step };
}

export function MiniChart({
  data,
  width = 300,
  height = 80,
  color = '#007AFF',
  fillColor,
  showArea = true,
  min: propMin,
  max: propMax,
}: ChartProps) {
  if (!data || data.length < 2) return null;

  const { min: autoMin, max: autoMax } = autoScale(data);
  const min = propMin ?? autoMin;
  const max = propMax ?? autoMax;
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });

  const linePath = `M${points.join(' L')}`;
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {showArea && fillColor && (
        <path d={areaPath} fill={fillColor} />
      )}
      <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

export function StreamChart({
  data,
  width = 800,
  height = 150,
  color = '#007AFF',
  fillColor,
  unit = '',
  showGrid = true,
  formatValue,
  min: propMin,
  max: propMax,
}: ChartProps) {
  if (!data || data.length < 2) return null;

  const padding = { top: 20, bottom: 30, left: 50, right: 20 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const { min: autoMin, max: autoMax } = autoScale(data, 0.05);
  const min = propMin ?? autoMin;
  const max = propMax ?? autoMax;
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartW;
    const y = padding.top + chartH - ((v - min) / range) * chartH;
    return { x, y, v };
  });

  const linePath = `M${points.map(p => `${p.x},${p.y}`).join(' L')}`;
  const areaPath = `${linePath} L${padding.left + chartW},${padding.top + chartH} L${padding.left},${padding.top + chartH} Z`;

  // Grid lines
  const gridLines = showGrid ? [0, 0.25, 0.5, 0.75, 1].map(pct => {
    const y = padding.top + chartH * (1 - pct);
    const val = min + range * pct;
    const fmt = formatValue ? formatValue(val) : Math.round(val).toString();
    return (
      <g key={pct}>
        <line x1={padding.left} y1={y} x2={padding.left + chartW} y2={y} stroke="#334155" strokeWidth={0.5} strokeDasharray="4,4" />
        <text x={padding.left - 8} y={y + 4} fill="#94A3B8" fontSize={10} textAnchor="end">{fmt}</text>
      </g>
    );
  }) : null;

  // Time labels (start, middle, end)
  const timeLabels = [
    { x: padding.left, label: '0:00' },
    { x: padding.left + chartW / 2, label: `${Math.floor(data.length / 2 / 60)}:${String(Math.floor(data.length / 2) % 60).padStart(2, '0')}` },
    { x: padding.left + chartW, label: `${Math.floor(data.length / 60)}:${String(data.length % 60).padStart(2, '0')}` },
  ];

  return (
    <div className="w-full">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {gridLines}
        {fillColor && <path d={areaPath} fill={fillColor} />}
        <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
        {timeLabels.map(t => (
          <text key={t.label} x={t.x} y={padding.top + chartH + 18} fill="#94A3B8" fontSize={10} textAnchor="middle">{t.label}</text>
        ))}
      </svg>
      {unit && <p className="text-xs text-muted text-right mt-1">{unit}</p>}
    </div>
  );
}

export function BarChart({
  data,
  labels,
  width = 800,
  height = 150,
  color = '#007AFF',
}: {
  data: number[];
  labels?: string[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (!data || data.length === 0) return null;

  const padding = { top: 10, bottom: 25, left: 10, right: 10 };
  const chartH = height - padding.top - padding.bottom;
  const max = Math.max(...data) || 1;
  const barWidth = Math.max(2, (width - padding.left - padding.right) / data.length - 2);

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      {data.map((v, i) => {
        const barH = (v / max) * chartH;
        const x = padding.left + i * ((width - padding.left - padding.right) / data.length);
        const y = padding.top + chartH - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barH} fill={color} rx={2} />
            {labels && labels[i] && (
              <text x={x + barWidth / 2} y={padding.top + chartH + 14} fill="#94A3B8" fontSize={9} textAnchor="middle">{labels[i]}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
