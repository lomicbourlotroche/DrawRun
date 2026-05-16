'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Heart, Waves, Gauge, Wind, Timer } from 'lucide-react';
import type { SwimAnalysis } from '@/types';

function toNum(val: unknown): number {
  return typeof val === 'number' ? val : 0;
}

export function SwimAnalysisCards({ analysis }: { analysis: SwimAnalysis }) {
  return (
    <>
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
              {analysis.trimp && (
                <div className="text-center p-3 rounded-lg bg-background border border-border">
                  <p className="text-lg font-bold text-peak/80">{Math.round(toNum(analysis.trimp))}</p>
                  <p className="text-xs text-muted">TRIMP</p>
                </div>
              )}
              {analysis.tss && (
                <div className="text-center p-3 rounded-lg bg-background border border-border">
                  <p className="text-lg font-bold text-purple-400">{Math.round(toNum(analysis.tss))}</p>
                  <p className="text-xs text-muted">TSS</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Swim Metrics */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Waves className="w-4 h-4 text-primary/80" />Métriques Natation</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {analysis.pacePer100m && (
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <p className="text-lg font-bold text-foreground">{analysis.pacePer100m.formatted}</p>
                <p className="text-xs text-muted">Allure /100m</p>
              </div>
            )}
            {analysis.swolf !== null && analysis.swolf !== undefined && (
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <p className={`text-lg font-bold ${analysis.swolf <= 45 ? 'text-success/80' : analysis.swolf <= 55 ? 'text-peak/80' : 'text-danger/80'}`}>
                  {analysis.swolf}
                </p>
                <p className="text-xs text-muted">SWOLF</p>
              </div>
            )}
            {analysis.strokeRate && (
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <p className="text-lg font-bold text-foreground">{analysis.strokeRate} c/min</p>
                <p className="text-xs text-muted">Fréquence de nage</p>
              </div>
            )}
            {analysis.dps && (
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <p className="text-lg font-bold text-foreground">{analysis.dps.toFixed(2)}m</p>
                <p className="text-xs text-muted">Distance/coup</p>
              </div>
            )}
          </div>

          {analysis.estimatedCSS && (
            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-medium text-primary/80 mb-1">CSS (Critical Swim Speed) estimée</p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="text-center p-2 rounded-lg bg-background">
                  <p className="text-sm font-bold text-foreground">{analysis.estimatedCSS.pacePer100m}</p>
                  <p className="text-xs text-muted">Allure /100m</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-background">
                  <p className="text-sm font-bold text-foreground">{analysis.estimatedCSS.speedKmh.toFixed(2)} km/h</p>
                  <p className="text-xs text-muted">Vitesse</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zone Distribution */}
      {analysis.hrDistribution && (
        <Card>
          <CardHeader><CardTitle className="text-base">Répartition zones cardiaques</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              <div className="text-center p-2 rounded-lg bg-gray-500/10"><p className="text-sm font-bold text-gray-400">{analysis.hrDistribution.zone1Percent}%</p><p className="text-xs text-muted">Z1</p></div>
              <div className="text-center p-2 rounded-lg bg-success/10"><p className="text-sm font-bold text-success/80">{analysis.hrDistribution.zone2Percent}%</p><p className="text-xs text-muted">Z2</p></div>
              <div className="text-center p-2 rounded-lg bg-primary/10"><p className="text-sm font-bold text-primary/80">{analysis.hrDistribution.zone3Percent}%</p><p className="text-xs text-muted">Z3</p></div>
              <div className="text-center p-2 rounded-lg bg-peak/10"><p className="text-sm font-bold text-peak/80">{analysis.hrDistribution.zone4Percent}%</p><p className="text-xs text-muted">Z4</p></div>
              <div className="text-center p-2 rounded-lg bg-danger/10"><p className="text-sm font-bold text-danger/80">{analysis.hrDistribution.zone5Percent}%</p><p className="text-xs text-muted">Z5</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TSS Summary */}
      {analysis.tss && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Gauge className="w-4 h-4 text-primary" />Charge d&apos;entraînement</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {analysis.tss && (
                <div className="text-center p-3 rounded-lg bg-background border border-border">
                  <p className="text-lg font-bold text-purple-400">{Math.round(toNum(analysis.tss))}</p>
                  <p className="text-xs text-muted">TSS Natation</p>
                </div>
              )}
              {analysis.intensityFactor && (
                <div className="text-center p-3 rounded-lg bg-background border border-border">
                  <p className="text-lg font-bold text-primary/80">{analysis.intensityFactor.toFixed(2)}</p>
                  <p className="text-xs text-muted">IF</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
