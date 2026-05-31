'use client';

import { BarChart3, AlertCircle } from '@/components/ui/icons';
import { Card, CardHeader, CardTitle, CardContent, Skeleton } from '@/components/ui';

interface PolarizationData {
  index: number;
  distribution: { low: number; moderate: number; high: number };
  classification: { type: string; label: string; optimal: boolean };
  recommendation: { type: string; message: string };
  target: { low: number; moderate: number; high: number };
}

export function IntensityDistributionSection({ polarization, error }: { polarization: PolarizationData | null; error: string | null }) {
  if (error) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Distribution d&apos;intensité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted py-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!polarization) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Distribution d&apos;intensité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const zones: Array<{
    key: keyof PolarizationData['distribution'];
    label: string;
    targetKey: keyof PolarizationData['target'];
    color: string;
    bgColor: string;
  }> = [
    { key: 'low', label: 'Faible intensité (Z1–Z2)', targetKey: 'low', color: 'bg-success', bgColor: 'bg-success/10' },
    { key: 'moderate', label: 'Intensité modérée (Z3)', targetKey: 'moderate', color: 'bg-warning', bgColor: 'bg-warning/10' },
    { key: 'high', label: 'Haute intensité (Z4–Z5)', targetKey: 'high', color: 'bg-danger', bgColor: 'bg-danger/10' },
  ];

  const isOptimal = polarization.classification.optimal;

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Distribution d&apos;intensité
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          isOptimal ? 'bg-success/15 text-success/80' : 'bg-warning/15 text-warning/80'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isOptimal ? 'bg-success/80' : 'bg-warning/80'}`} />
          {polarization.classification.label}
        </div>

        <div className="space-y-4">
          {zones.map(({ key, label, targetKey, color, bgColor }) => {
            const actual = Math.round(polarization.distribution[key]);
            const target = Math.round(polarization.target[targetKey]);
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">{label}</span>
                  <div className="flex items-center gap-2 text-muted">
                    <span className="font-semibold text-foreground">{actual}%</span>
                    <span className="text-xs">cible {target}%</span>
                  </div>
                </div>
                <div className={`relative h-3 rounded-full ${bgColor} overflow-hidden`}>
                  <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(actual, 100)}%` }} />
                  <div className="absolute top-0 bottom-0 w-0.5 bg-surface/60" style={{ left: `${Math.min(target, 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm text-muted">Indice de polarisation</span>
          <span className="text-lg font-bold text-foreground">{polarization.index.toFixed(2)}</span>
        </div>

        {polarization.recommendation.message && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-foreground">{polarization.recommendation.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
