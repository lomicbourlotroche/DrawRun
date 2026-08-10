'use client';

import { TrendingUp, TrendingDown } from '@/components/ui/icons';

const labels = [
  { v: -1, label: 'Très négatif', desc: 'Départ très lent, accélération forte' },
  { v: -0.5, label: 'Négatif', desc: 'Départ conservateur' },
  { v: 0, label: 'Régulier', desc: 'Allure constante' },
  { v: 0.5, label: 'Positif', desc: 'Départ rapide, gestion' },
  { v: 1, label: 'Très positif', desc: 'Départ à fond, résistance' },
];

export function StrategySlider({ value, onChange }: { value: number; onChange: (_v: number) => void }) {
  const current = labels.reduce((a, b) => (Math.abs(b.v - value) < Math.abs(a.v - value) ? b : a), labels[0]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Stratégie d&apos;allure</label>
        <span className="text-xs font-semibold text-primary px-2 py-0.5 bg-primary/10 rounded-full">
          {current.label}
        </span>
      </div>
      <input
        type="range"
        min="-1"
        max="1"
        step="0.1"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-primary"
      />
      <div className="flex justify-between text-xs text-muted">
        <span className="flex items-center gap-1">
          <TrendingDown className="w-3 h-3" />
          Negative split
        </span>
        <span>Régulier</span>
        <span className="flex items-center gap-1">
          Positive split
          <TrendingUp className="w-3 h-3" />
        </span>
      </div>
      <p className="text-xs text-muted italic">{current.desc}</p>
    </div>
  );
}
