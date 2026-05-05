'use client';

import { Card, CardHeader, CardTitle, CardContent, CircularProgress } from '@/components/ui';
import { cn, calculateReadinessColor } from '@/lib/utils';
import type { Readiness } from '@/types';
import { Heart, Brain, Moon, Activity } from 'lucide-react';

interface ReadinessCardProps {
  readiness: Readiness | null;
  isLoading?: boolean;
}

export function ReadinessCard({ readiness, isLoading }: ReadinessCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Readiness</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="w-28 h-28 rounded-full bg-background animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-background rounded animate-pulse" />
              <div className="h-3 w-32 bg-background rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!readiness) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Readiness</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted text-sm">Données non disponibles</p>
        </CardContent>
      </Card>
    );
  }

  const color = calculateReadinessColor(readiness.score);

  const statusLabels = {
    excellent: 'Excellent',
    good: 'Bon',
    fair: 'Moyen',
    poor: 'Faible',
  };

  const factors = [
    { label: 'HRV', value: readiness.factors.hrv, icon: Heart, color: '#FF3B30' },
    { label: 'Sommeil', value: readiness.factors.sleep, icon: Moon, color: '#5856D6' },
    { label: 'FC Repos', value: readiness.factors.restingHR, icon: Activity, color: '#007AFF' },
    { label: 'Stress', value: readiness.factors.stress, icon: Brain, color: '#FF9500' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Readiness</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <CircularProgress
            value={readiness.score}
            size={112}
            strokeWidth={8}
            variant="default"
            color={color}
            label={statusLabels[readiness.status]}
          />
          
          <div className="flex-1 grid grid-cols-2 gap-3">
            {factors.map((factor) => (
              <div
                key={factor.label}
                className="flex items-center gap-2 p-2 rounded-lg bg-background"
              >
                <factor.icon className="w-4 h-4" style={{ color: factor.color }} />
                <div>
                  <p className="text-xs text-muted">{factor.label}</p>
                  <p className="text-sm font-medium text-foreground">{factor.value}/100</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
