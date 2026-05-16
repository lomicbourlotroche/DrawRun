'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Heart, Gauge, Zap, Wind } from 'lucide-react';
import type { SimpleAnalysis } from '@/types';

function toNum(val: unknown): number {
  return typeof val === 'number' ? val : 0;
}

export function SimpleAnalysisCards({ analysis }: { analysis: SimpleAnalysis }) {
  return (
    <>
      {/* Basic metrics */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Gauge className="w-4 h-4 text-primary" />Métriques</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {analysis.tss && (
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <p className="text-lg font-bold text-purple-400">{Math.round(toNum(analysis.tss))}</p>
                <p className="text-xs text-muted">TSS</p>
              </div>
            )}
            {analysis.trimp && (
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <p className="text-lg font-bold text-peak/80">{Math.round(toNum(analysis.trimp))}</p>
                <p className="text-xs text-muted">TRIMP</p>
              </div>
            )}
            {analysis.intensityFactor && (
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <p className="text-lg font-bold text-primary/80">{analysis.intensityFactor.toFixed(2)}</p>
                <p className="text-xs text-muted">IF</p>
              </div>
            )}
            {analysis.pace && (
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <p className="text-lg font-bold text-foreground">{analysis.pace.formatted}</p>
                <p className="text-xs text-muted">Allure</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* HR Analysis */}
      {analysis.hrZones && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Heart className="w-4 h-4 text-danger/80" />Analyse Cardiaque</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <p className="text-lg font-bold text-foreground">{analysis.hrZones.avgHrPercent}%</p>
                <p className="text-xs text-muted">FC moy. %FCM</p>
              </div>
              {analysis.hrZones.maxHrPercent && (
                <div className="text-center p-3 rounded-lg bg-background border border-border">
                  <p className="text-lg font-bold text-foreground">{analysis.hrZones.maxHrPercent}%</p>
                  <p className="text-xs text-muted">FC max %FCM</p>
                </div>
              )}
              {analysis.hrZones.hrReserve && (
                <div className="text-center p-3 rounded-lg bg-background border border-border">
                  <p className="text-lg font-bold text-foreground">{analysis.hrZones.hrReserve}%</p>
                  <p className="text-xs text-muted">HR Reserve</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nutrition */}
      {analysis.nutrition && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-amber-600">
              <Wind className="w-4 h-4" />
              Ravitaillement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-xs text-muted uppercase font-semibold">Hydratation</p>
                <p className="text-2xl font-bold text-foreground">{analysis.nutrition.hydration.totalMl}</p>
                <p className="text-xs text-muted">{analysis.nutrition.hydration.perHourMl} ml/h</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted uppercase font-semibold">Glucides</p>
                <p className="text-2xl font-bold text-foreground">{analysis.nutrition.carbs.totalG}</p>
                <p className="text-xs text-muted">{analysis.nutrition.carbs.perHourG} g/h</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted uppercase font-semibold">Sodium</p>
                <p className="text-2xl font-bold text-foreground">{analysis.nutrition.sodium.totalMg}</p>
                <p className="text-xs text-muted">mg</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
