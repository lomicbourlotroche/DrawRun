'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { BiomechanicsCard } from '@/components/features/activities/BiomechanicsCard';
import { Heart, Gauge, Zap, Mountain, Timer, Wind, Trophy } from 'lucide-react';
import type { RunAnalysis, TrailRunAnalysis } from '@/types';

function toNum(val: unknown): number {
  return typeof val === 'number' ? val : 0;
}

function toStr(val: unknown): string {
  return String(val ?? '');
}

export function RunAnalysisCards({ analysis }: { analysis: RunAnalysis | TrailRunAnalysis }) {
  return (
    <>
      {/* HR Analysis */}
      {analysis.hrZones && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Heart className="w-4 h-4 text-danger/80" />Analyse Cardiaque</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
              {analysis.trimp && (
                <div className="text-center p-3 rounded-lg bg-background border border-border">
                  <p className="text-lg font-bold text-peak/80">{Math.round(toNum(analysis.trimp))}</p>
                  <p className="text-xs text-muted">TRIMP</p>
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-muted text-center">
              Zone prédominante : <span className="font-medium text-foreground">{analysis.hrZones.name}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* HR Zone Distribution */}
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

      {/* Pace & Elevation */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Gauge className="w-4 h-4 text-primary" />Allure & Dénivelé</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {analysis.pace && (
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <p className="text-lg font-bold text-foreground">{analysis.pace.formatted}</p>
                <p className="text-xs text-muted">Allure /km</p>
              </div>
            )}
            {analysis.gap && (
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <p className="text-lg font-bold text-success/80">{analysis.gap.formatted}</p>
                <p className="text-xs text-muted">GAP (ajusté)</p>
              </div>
            )}
            {analysis.estimatedGrade > 0 && (
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <p className="text-lg font-bold text-foreground">{analysis.estimatedGrade}%</p>
                <p className="text-xs text-muted">Pente moyenne</p>
              </div>
            )}
            {analysis.efficiencyFactor && (
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <p className="text-lg font-bold text-amber-500">{analysis.efficiencyFactor.toFixed(2)}</p>
                <p className="text-xs text-muted">Eff. aérobie (EF)</p>
              </div>
            )}
          </div>
          {analysis.runningEconomy && (
            <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm text-primary/80"><span className="font-bold">{analysis.runningEconomy}</span> ml/kg/km — Économie de course</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* VDOT & Performance */}
      {(analysis.vdot || analysis.performanceLevel) && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="w-4 h-4 text-primary" />Potentiel aérobie</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {analysis.vdot && (
                <div className="text-center p-3 rounded-lg bg-background border border-border">
                  <p className="text-lg font-bold text-success/80">{analysis.vdot.toFixed(1)}</p>
                  <p className="text-xs text-muted">VDOT (Daniels)</p>
                </div>
              )}
              {analysis.intensityFactor && (
                <div className="text-center p-3 rounded-lg bg-background border border-border">
                  <p className="text-lg font-bold text-primary/80">{analysis.intensityFactor.toFixed(2)}</p>
                  <p className="text-xs text-muted">IF</p>
                </div>
              )}
              {analysis.tss && (
                <div className="text-center p-3 rounded-lg bg-background border border-border">
                  <p className="text-lg font-bold text-purple-400">{Math.round(toNum(analysis.tss))}</p>
                  <p className="text-xs text-muted">TSS</p>
                </div>
              )}
              {analysis.performanceLevel && (
                <div className={`text-center p-3 rounded-lg bg-background border border-${analysis.performanceLevel.color}-500/30`}>
                  <p className={`text-lg font-bold text-${analysis.performanceLevel.color}-400 uppercase`}>{analysis.performanceLevel.level}</p>
                  <p className="text-xs text-muted">Niveau</p>
                </div>
              )}
            </div>

            {/* Race Predictions */}
            {analysis.racePredictions && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm font-medium text-foreground mb-2">Prédictions de course (VDOT)</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {analysis.racePredictions['5k'] && (
                    <div className="text-center p-2 rounded-lg bg-background">
                      <p className="text-sm font-bold text-foreground">
                        {Math.floor(toNum(analysis.racePredictions['5k']) / 60)}:{String(Math.round(toNum(analysis.racePredictions['5k']) % 60)).padStart(2, '0')}
                      </p>
                      <p className="text-xs text-muted">5km</p>
                    </div>
                  )}
                  {analysis.racePredictions['10k'] && (
                    <div className="text-center p-2 rounded-lg bg-background">
                      <p className="text-sm font-bold text-foreground">
                        {Math.floor(toNum(analysis.racePredictions['10k']) / 60)}:{String(Math.round(toNum(analysis.racePredictions['10k']) % 60)).padStart(2, '0')}
                      </p>
                      <p className="text-xs text-muted">10km</p>
                    </div>
                  )}
                  {analysis.racePredictions.half && (
                    <div className="text-center p-2 rounded-lg bg-background">
                      <p className="text-sm font-bold text-foreground">{analysis.racePredictions.half.time}</p>
                      <p className="text-xs text-muted">Semi</p>
                    </div>
                  )}
                  {analysis.racePredictions.marathon && (
                    <div className="text-center p-2 rounded-lg bg-background">
                      <p className="text-sm font-bold text-foreground">{analysis.racePredictions.marathon.time}</p>
                      <p className="text-xs text-muted">Marathon</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Training Paces */}
      {analysis.trainingPaces && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Timer className="w-4 h-4 text-primary" />Allures d&apos;entraînement</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              {Object.entries(analysis.trainingPaces).map(([key, val]) => {
                const colors: Record<string, string> = { E: 'bg-success/10 border-success/30 text-success/80', M: 'bg-primary/10 border-primary/30 text-primary/80', T: 'bg-peak/10 border-peak/30 text-peak/80', I: 'bg-danger/10 border-danger/30 text-danger/80', R: 'bg-purple-500/10 border-purple-500/30 text-purple-400' };
                return (
                  <div key={key} className={`text-center p-2 rounded-lg border ${colors[key] || 'bg-background border-border'}`}>
                    <p className="text-xs uppercase font-bold">{key}</p>
                    <p className="text-sm font-bold">{'pace' in val ? val.pace : `${val.min} – ${val.max}`}</p>
                    <p className="text-xs text-muted">{val.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Biomechanics */}
      {analysis.biomechanics && (
        <BiomechanicsCard metrics={analysis.biomechanics} />
      )}

      {/* Nutrition */}
      {analysis.nutrition && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-amber-600">
              <Wind className="w-4 h-4" />
              Stratégie de Ravitaillement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-xs text-muted uppercase font-semibold">Hydratation</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-foreground">{analysis.nutrition.hydration.totalMl}</p>
                  <p className="text-sm text-muted">ml total</p>
                </div>
                <p className="text-xs text-muted">{analysis.nutrition.hydration.perHourMl} ml/h</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted uppercase font-semibold">Glucides</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-foreground">{analysis.nutrition.carbs.totalG}</p>
                  <p className="text-sm text-muted">g total</p>
                </div>
                <p className="text-xs text-muted">{analysis.nutrition.carbs.perHourG} g/h</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted uppercase font-semibold">Sodium</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-foreground">{analysis.nutrition.sodium.totalMg}</p>
                  <p className="text-sm text-muted">mg</p>
                </div>
              </div>
            </div>
            {analysis.nutrition.recommendations.map((rec, i) => (
              <div key={i} className="flex gap-2 text-xs text-amber-700/80 mt-2">
                <span className="shrink-0">•</span>
                <p>{rec}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}
