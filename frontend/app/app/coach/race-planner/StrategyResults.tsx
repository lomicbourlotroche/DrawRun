'use client';

import React from 'react';
import {
  TrendingUp,
  Download,
  Zap,
} from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { GlassCard } from '@/components/ui';
import { TaperingChart } from '@/components/features/coach/TaperingChart';
import StrategyChart from './StrategyChart';

interface StrategyResultsProps {
  strategy: Record<string, unknown>;
  formatTime: (_seconds: number) => string;
  downloadCsv: () => void;
}

export default function StrategyResults({ strategy, formatTime, downloadCsv }: StrategyResultsProps) {
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-4 flex flex-col items-center text-center">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Distance Totale</span>
          <span className="text-2xl font-bold mt-1">{((strategy.summary as Record<string, unknown>).totalDistance as number / 1000).toFixed(2)} km</span>
        </GlassCard>
        <GlassCard className="p-4 flex flex-col items-center text-center border-l-primary/20">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Temps Estimé</span>
          <span className="text-2xl font-bold mt-1 text-primary">{formatTime((strategy.summary as Record<string, unknown>).totalTimeSec as number)}</span>
        </GlassCard>
        <GlassCard className="p-4 flex flex-col items-center text-center">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Dénivelé +</span>
          <span className="text-2xl font-bold mt-1">+{(strategy.summary as Record<string, unknown>).totalElevationGain as number}m</span>
        </GlassCard>
        <GlassCard className="p-4 flex flex-col items-center text-center">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Allure Moyenne</span>
          <span className="text-2xl font-bold mt-1">{(strategy.summary as Record<string, unknown>).averagePace as string} /km</span>
        </GlassCard>
      </div>

      {/* Charts */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Profil d&apos;Allure &amp; Élévation
        </h3>
        <StrategyChart
          segments={(strategy.segments as Array<Record<string, unknown>>) || []}
          segmentsWithGrade={((strategy.strategy as Record<string, unknown>).segments as Array<{ grade: number }> | undefined) || []}
        />
      </Card>

      {/* Tapering Analysis */}
      {Boolean(strategy.taper) && (
        <TaperingChart data={strategy.taper as any} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Split Table */}
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Détails des Splits (km)</h3>
          <div className="overflow-auto max-h-[500px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface border-b">
                <tr className="text-left text-muted-foreground">
                  <th className="pb-3 font-medium">KM</th>
                  <th className="pb-3 font-medium">Allure</th>
                  <th className="pb-3 font-medium">Cumulé</th>
                  <th className="pb-3 font-medium">Pente</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {((strategy.strategy as Record<string, unknown>).segments as Array<{ km: number; targetPace: string; cumulativeTime: number; grade: number }>).map((s: { km: number; targetPace: string; cumulativeTime: number; grade: number }) => (
                  <tr key={s.km} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 font-bold">{s.km}</td>
                    <td className="py-3 font-mono text-primary font-bold">{s.targetPace}</td>
                    <td className="py-3 text-muted-foreground font-mono">{formatTime(s.cumulativeTime)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.grade > 2 ? 'bg-danger-50 text-danger-700' :
                        s.grade < -2 ? 'bg-success-50 text-success-700' :
                        'bg-muted/20 text-muted-foreground'
                      }`}>
                        {s.grade > 0 ? '+' : ''}{s.grade}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Nutrition & Strategy */}
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-primary-600 to-primary-700 text-white border-none shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Stratégie de Nutrition
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/10 rounded-2xl">
                  <p className="text-white/70 text-xs font-medium uppercase">Glucides</p>
                  <p className="text-2xl font-bold">{((strategy.nutrition as Record<string, unknown>).carbs as Record<string, unknown>).totalG as number}g</p>
                  <p className="text-xs mt-1 text-white/80">{((strategy.nutrition as Record<string, unknown>).carbs as Record<string, unknown>).perHourG as number}g / heure</p>
                </div>
                <div className="p-4 bg-white/10 rounded-2xl">
                  <p className="text-white/70 text-xs font-medium uppercase">Hydratation</p>
                  <p className="text-2xl font-bold">{((strategy.nutrition as Record<string, unknown>).hydration as Record<string, unknown>).totalMl as number}ml</p>
                  <p className="text-xs mt-1 text-white/80">{((strategy.nutrition as Record<string, unknown>).hydration as Record<string, unknown>).perHourMl as number}ml / heure</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold border-b border-white/20 pb-2">Recommandations clés</h4>
                <ul className="space-y-2">
                  {((strategy.nutrition as Record<string, unknown>).recommendations as string[]).map((rec: string, i: number) => (
                    <li key={i} className="text-xs flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1 shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold mb-4">Options d&apos;export</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full" onClick={downloadCsv}>
                <Download className="w-4 h-4 mr-2" />
                Format CSV
              </Button>
              <Button variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Format PDF
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
