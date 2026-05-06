'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { api } from '@/lib/api';
import { TrendingUp, Zap } from 'lucide-react';

interface ProgressData {
  planId: number;
  totalSessions: number;
  completedSessions: number;
  missedSessions: number;
  currentStreak: number;
  longestStreak: number;
  weeklyVolume: { week: number; volume: number }[];
  intensityDistribution: { low: number; moderate: number; high: number };
  averageRpe: number;
  completionRate: number;
  phaseProgress: { phase: string; progress: number }[];
}

interface ProgressChartProps {
  planId: number;
}

export default function ProgressChart({ planId }: ProgressChartProps) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProgress = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getPlanProgress(planId);
      setProgress(data);
    } catch {
      /* silencieux — progress reste null, composant retourne null */
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progress) return null;

  const maxVolume = Math.max(...progress.weeklyVolume.map(w => w.volume), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Progression
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <p className="text-2xl font-bold text-green-400">{progress.completedSessions}</p>
            <p className="text-xs text-muted">Complétées</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-2xl font-bold text-red-400">{progress.missedSessions}</p>
            <p className="text-xs text-muted">Manquées</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-2xl font-bold text-blue-400">{progress.currentStreak}</p>
            <p className="text-xs text-muted">Série actuelle</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-2xl font-bold text-yellow-400">{Math.round(progress.completionRate)}%</p>
            <p className="text-xs text-muted">Taux</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Volume hebdomadaire</span>
            <span className="text-foreground">{progress.weeklyVolume[progress.weeklyVolume.length - 1]?.volume || 0} km</span>
          </div>
          <div className="h-24 flex items-end gap-1">
            {progress.weeklyVolume.map((week, i) => (
              <div
                key={i}
                className="flex-1 bg-primary/80 rounded-t transition-all hover:bg-primary"
                style={{ height: `${(week.volume / maxVolume) * 100}%` }}
                title={`Semaine ${week.week}: ${week.volume} km`}
              />
            ))}
          </div>
          <div className="flex text-xs text-muted">
            {progress.weeklyVolume.map((week, i) => (
              <div key={i} className="flex-1 text-center">S{week.week}</div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Distribution d&apos;intensité</p>
          <div className="flex gap-1 h-4 rounded-lg overflow-hidden">
            <div
              className="bg-green-500 transition-all"
              style={{ width: `${progress.intensityDistribution.low}%` }}
              title={`Low: ${progress.intensityDistribution.low}%`}
            />
            <div
              className="bg-yellow-500 transition-all"
              style={{ width: `${progress.intensityDistribution.moderate}%` }}
              title={`Moderate: ${progress.intensityDistribution.moderate}%`}
            />
            <div
              className="bg-red-500 transition-all"
              style={{ width: `${progress.intensityDistribution.high}%` }}
              title={`High: ${progress.intensityDistribution.high}%`}
            />
          </div>
          <div className="flex justify-between text-xs text-muted">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Low {progress.intensityDistribution.low}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              Mod {progress.intensityDistribution.moderate}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              High {progress.intensityDistribution.high}%
            </span>
          </div>
        </div>

        {progress.phaseProgress.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Phases</p>
            {progress.phaseProgress.map((phase, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted">{phase.phase}</span>
                  <span className="text-foreground">{Math.round(phase.progress)}%</span>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${phase.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {progress.averageRpe > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <Zap className="w-5 h-5 text-orange-400" />
            <div>
              <p className="text-sm font-medium text-foreground">RPE moyen</p>
              <p className="text-xs text-muted">{progress.averageRpe.toFixed(1)}/10</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}