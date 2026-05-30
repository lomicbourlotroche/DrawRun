'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Heart, Zap, Timer, Wind, Cpu, BarChart3, Bike } from 'lucide-react';
import type { RideAnalysis, PowerCurvePoint } from '@/types';

function toNum(val: unknown): number {
  return typeof val === 'number' ? val : 0;
}

function PowerCurveChart({ curve }: { curve: PowerCurvePoint[] }) {
  if (!curve || curve.length === 0) return null;
  const maxPower = Math.max(...curve.map(p => p.power));
  return (
    <div className="mt-2">
      <div className="flex items-end gap-1 h-24">
        {curve.map((pt, i) => {
          const pct = (pt.power / maxPower) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center group relative">
              <div
                className="w-full bg-peak/60 rounded-t hover:bg-peak/80 transition-colors cursor-pointer"
                style={{ height: `${pct}%`, minHeight: '4px' }}
              />
              <span className="text-[8px] text-muted mt-1 truncate w-full text-center">{pt.durationFormatted}</span>
              <div className="absolute bottom-full mb-1 hidden group-hover:block bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                {pt.power}W
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const powerZoneColors = [
  'bg-muted/10 text-muted',
  'bg-success/10 text-success/80',
  'bg-primary/10 text-primary/80',
  'bg-peak/10 text-peak/80',
  'bg-danger/10 text-danger/80',
  'bg-secondary-50 text-secondary-500',
  'bg-secondary-50 text-secondary-500',
];

function PowerZoneRow({ zone: z }: { zone: { zone: number; name: string; percent: number } }) {
  return (
    <div className="text-center p-1.5 rounded-lg bg-background border border-border">
      <p className={`text-sm font-bold ${powerZoneColors[z.zone - 1]?.split(' ')[1] || 'text-foreground'}`}>
        {z.percent}%
      </p>
      <p className="text-[10px] text-muted truncate">{z.name}</p>
    </div>
  );
}

export function RideAnalysisCards({ analysis }: { analysis: RideAnalysis }) {
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
              {analysis.trimp && (
                <div className="text-center p-3 rounded-lg bg-background border border-border">
                  <p className="text-lg font-bold text-peak/80">{Math.round(toNum(analysis.trimp))}</p>
                  <p className="text-xs text-muted">TRIMP</p>
                </div>
              )}
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <p className="text-lg font-bold text-foreground">{analysis.speedKmh?.toFixed(1) || '-'}</p>
                <p className="text-xs text-muted">km/h moy.</p>
              </div>
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
              <div className="text-center p-2 rounded-lg bg-muted/10"><p className="text-sm font-bold text-muted">{analysis.hrDistribution.zone1Percent}%</p><p className="text-xs text-muted">Z1</p></div>
              <div className="text-center p-2 rounded-lg bg-success/10"><p className="text-sm font-bold text-success/80">{analysis.hrDistribution.zone2Percent}%</p><p className="text-xs text-muted">Z2</p></div>
              <div className="text-center p-2 rounded-lg bg-primary/10"><p className="text-sm font-bold text-primary/80">{analysis.hrDistribution.zone3Percent}%</p><p className="text-xs text-muted">Z3</p></div>
              <div className="text-center p-2 rounded-lg bg-peak/10"><p className="text-sm font-bold text-peak/80">{analysis.hrDistribution.zone4Percent}%</p><p className="text-xs text-muted">Z4</p></div>
              <div className="text-center p-2 rounded-lg bg-danger/10"><p className="text-sm font-bold text-danger/80">{analysis.hrDistribution.zone5Percent}%</p><p className="text-xs text-muted">Z5</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Power Analysis */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="w-4 h-4 text-peak/80" />Analyse de Puissance</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {analysis.avgPower > 0 && (
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <p className="text-lg font-bold text-peak/80">{Math.round(analysis.avgPower)}W</p>
                <p className="text-xs text-muted">Puissance moy.</p>
              </div>
            )}
            {analysis.maxPower && (
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <p className="text-lg font-bold text-peak/80">{Math.round(analysis.maxPower)}W</p>
                <p className="text-xs text-muted">Puissance max</p>
              </div>
            )}
            {analysis.normalizedPower && (
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <p className="text-lg font-bold text-peak/80">{Math.round(analysis.normalizedPower)}W</p>
                <p className="text-xs text-muted">NP</p>
              </div>
            )}
            {analysis.variabilityIndex && (
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <p className="text-lg font-bold text-foreground">{analysis.variabilityIndex.toFixed(2)}</p>
                <p className="text-xs text-muted">VI</p>
              </div>
            )}
          </div>

          {analysis.intensityFactor && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <p className="text-lg font-bold text-primary/80">{analysis.intensityFactor.toFixed(2)}</p>
                <p className="text-xs text-muted">IF</p>
              </div>
              {analysis.tss && (
                <div className="text-center p-3 rounded-lg bg-background border border-border">
                  <p className="text-lg font-bold text-secondary-400">{Math.round(toNum(analysis.tss))}</p>
                  <p className="text-xs text-muted">TSS</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Power Metrics */}
      {(analysis.totalWorkKj || analysis.powerToWeight || analysis.tssPerHour) && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />Métriques Avancées</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {analysis.totalWorkKj && (
                <div className="text-center p-3 rounded-lg bg-background border border-border">
                  <p className="text-lg font-bold text-foreground">{analysis.totalWorkKj.toLocaleString('fr-FR')} kJ</p>
                  <p className="text-xs text-muted">Travail total</p>
                </div>
              )}
              {analysis.powerToWeight && (
                <div className="text-center p-3 rounded-lg bg-background border border-border">
                  <p className="text-lg font-bold text-foreground">{analysis.powerToWeight.toFixed(2)} W/kg</p>
                  <p className="text-xs text-muted">Poids/Puissance</p>
                </div>
              )}
              {analysis.tssPerHour && (
                <div className="text-center p-3 rounded-lg bg-background border border-border">
                  <p className="text-lg font-bold text-secondary-400">{analysis.tssPerHour}</p>
                  <p className="text-xs text-muted">TSS/h</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Power Zone Distribution */}
      {analysis.powerZoneDistribution && analysis.powerZoneDistribution.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bike className="w-4 h-4 text-success/80" />Répartition zones de puissance</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1.5">
              {analysis.powerZoneDistribution.map(z => <PowerZoneRow key={z.zone} zone={z} />)}
            </div>
            <div className="flex justify-between mt-2 text-[9px] text-muted px-1">
              <span>Récup</span>
              <span>Endu</span>
              <span>Tempo</span>
              <span>Seuil</span>
              <span>VO2max</span>
              <span>Anaé</span>
              <span>Neuro</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Best Power Efforts */}
      {analysis.powerEfforts && analysis.powerEfforts.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Timer className="w-4 h-4 text-primary" />Meilleurs Efforts</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {analysis.powerEfforts.map((eff, i) => {
                const label = eff.duration < 60
                  ? `${eff.duration}s`
                  : `${Math.floor(eff.duration / 60)}min`;
                return (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-background border border-border">
                    <span className="text-sm text-muted">{label}</span>
                    <span className="text-sm font-bold text-peak/80">{Math.round(eff.value)}W</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Critical Power */}
      {(analysis.estimatedCP || analysis.estimatedWPrime) && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Cpu className="w-4 h-4 text-primary" />Puissance Critique</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {analysis.estimatedCP && (
                <div className="text-center p-3 rounded-lg bg-background border border-border">
                  <p className="text-lg font-bold text-foreground">{Math.round(analysis.estimatedCP)}W</p>
                  <p className="text-xs text-muted">CP (Puissance Critique)</p>
                </div>
              )}
              {analysis.estimatedWPrime && (
                <div className="text-center p-3 rounded-lg bg-background border border-border">
                  <p className="text-lg font-bold text-foreground">{Math.round(analysis.estimatedWPrime)} kJ</p>
                  <p className="text-xs text-muted">W&apos; (Réserve anaérobie)</p>
                </div>
              )}
            </div>

            {analysis.powerCurve && analysis.powerCurve.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm font-medium text-foreground mb-2">Courbe puissance-durée</p>
                <PowerCurveChart curve={analysis.powerCurve} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Nutrition */}
      {analysis.nutrition && (
        <Card className="border-warning-200 bg-warning-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-warning-600">
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
              <div key={i} className="flex gap-2 text-xs text-warning-700/80 mt-2">
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
