'use client';

import { Card, CardHeader, CardTitle, CardContent, CircularProgress } from '@/components/ui';
import { calculateReadinessColor } from '@/lib/utils';
import { TrendingUp, Zap, Activity, Heart } from '@/components/ui/icons';

interface PerformanceMetricsProps {
  sport: 'run' | 'bike' | 'swim';
  metrics: {
    vma?: number;
    vdot?: number;
    vo2max?: number;
    endurance?: number;
    ftp?: number;
    wkg?: number;
    css?: number;
    records?: {
      km1?: number;
      km5?: number;
      km10?: number;
      semi?: number;
      marathon?: number;
    };
  };
  readiness?: {
    score: number;
    status: string;
    color: string;
    label: string;
    advice: string;
  };
  isLoading?: boolean;
}

export function PerformanceMetrics({ sport, metrics, readiness, isLoading }: PerformanceMetricsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Métriques clés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-background rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const safeToFixed = (val: unknown, digits: number = 1): string => {
    const n = typeof val === 'number' ? val : parseFloat(String(val || ''));
    return !isNaN(n) && isFinite(n) ? n.toFixed(digits) : '-';
  };

  const getMetricsForSport = () => {
    switch (sport) {
      case 'run':
        return [
          { label: 'VMA', value: safeToFixed(metrics.vma), unit: 'km/h', icon: Zap, color: 'var(--primary)' },
          { label: 'VDOT', value: safeToFixed(metrics.vdot), unit: '', icon: Activity, color: 'var(--success)' },
          { label: 'VO2 Max', value: safeToFixed(metrics.vo2max, 0), unit: 'ml/kg/min', icon: Heart, color: 'var(--danger)' },
          { label: 'Endurance', value: safeToFixed(metrics.endurance, 0), unit: '%', icon: TrendingUp, color: 'var(--secondary)' },
        ];
      case 'bike':
        return [
          { label: 'FTP', value: metrics.ftp ? String(metrics.ftp) : '-', unit: 'W', icon: Zap, color: 'var(--peak)' },
          { label: 'W/Kg', value: safeToFixed(metrics.wkg), unit: 'W/kg', icon: Activity, color: 'var(--success)' },
          { label: 'VO2 Max', value: safeToFixed(metrics.vo2max, 0), unit: 'ml/kg/min', icon: Heart, color: 'var(--danger)' },
          { label: 'Endurance', value: safeToFixed(metrics.endurance, 0), unit: '%', icon: TrendingUp, color: 'var(--secondary)' },
        ];
      case 'swim':
        return [
          { label: 'CSS', value: safeToFixed(metrics.css, 0), unit: 'min/km', icon: Activity, color: 'var(--secondary)' },
          { label: 'VO2 Aqua', value: safeToFixed(metrics.vo2max, 0), unit: 'ml/kg/min', icon: Heart, color: 'var(--danger)' },
          { label: 'SWOLF', value: '-', unit: '', icon: Activity, color: 'var(--success)' },
          { label: 'Endurance', value: safeToFixed(metrics.endurance, 0), unit: '%', icon: TrendingUp, color: 'var(--primary)' },
        ];
      default:
        return [];
    }
  };

  const mainMetrics = getMetricsForSport();
  const records = metrics.records || {};

  const recordDistances = [
    { label: '1km', value: records.km1 },
    { label: '5km', value: records.km5 },
    { label: '10km', value: records.km10 },
    { label: 'Semi', value: records.semi },
    { label: 'Marathon', value: records.marathon },
  ].filter((r) => r.value !== undefined);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Métriques clés - {sport === 'run' ? 'Course' : sport === 'bike' ? 'Vélo' : 'Natation'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mainMetrics.map((metric) => (
              <div
                key={metric.label}
                className="p-4 rounded-lg bg-background text-center"
              >
                <div
                  className="w-10 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center"
                  style={{ backgroundColor: `${metric.color}20`, color: metric.color }}
                >
                  <metric.icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {metric.value}
                  {metric.unit && <span className="text-sm text-muted ml-1">{metric.unit}</span>}
                </p>
                <p className="text-sm text-muted mt-1">{metric.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {recordDistances.length > 0 && sport === 'run' && (
        <Card>
          <CardHeader>
            <CardTitle>Records personnels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {recordDistances.map((record) => (
                <div key={record.label} className="text-center p-4 rounded-lg bg-background">
                  <p className="text-2xl font-bold text-foreground">{record.value}</p>
                  <p className="text-sm text-muted">{record.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Forme du jour</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <CircularProgress
                value={readiness?.score ?? 0}
                size={160}
                strokeWidth={12}
                variant={readiness?.status === 'excellent' ? 'success' : readiness?.status === 'good' ? 'primary' : readiness?.status === 'moderate' ? 'warning' : 'danger'}
                color={calculateReadinessColor(readiness?.score ?? 0)}
              />
              <p className="mt-4 text-lg font-medium text-foreground">{readiness?.label ?? 'Non calculé'}</p>
              <p className="text-sm text-muted">{readiness?.advice ?? 'Données de forme non disponibles'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
