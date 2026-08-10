'use client';

import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Recommendation } from '@/types';
import { ChevronRight, Activity, TrendingUp, Zap } from '@/components/ui/icons';

interface RecommendationCardProps {
  recommendation: Recommendation | null;
  isLoading?: boolean;
  onViewDetails?: () => void;
}

const getIntensityColor = (intensity: string) => {
  switch (intensity) {
    case 'rest': return { bg: 'bg-muted/20', text: 'text-muted-foreground', border: 'border-border' };
    case 'easy': return { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' };
    case 'moderate': return { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' };
    case 'threshold': return { bg: 'bg-peak/10', text: 'text-peak', border: 'border-peak/20' };
    case 'hard': return { bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/20' };
    case 'varied': return { bg: 'bg-secondary/10', text: 'text-secondary', border: 'border-secondary/20' };
    default: return { bg: 'bg-muted/20', text: 'text-muted-foreground', border: 'border-border' };
  }
};

export function RecommendationCard({ recommendation, isLoading, onViewDetails }: RecommendationCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Entra\u00eenement recommand\u00e9</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-8 w-32 bg-surface rounded animate-pulse" />
            <div className="h-4 w-48 bg-surface rounded animate-pulse" />
            <div className="h-4 w-full bg-surface rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Entra\u00eenement recommand\u00e9</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted text-sm">Aucune recommandation disponible</p>
        </CardContent>
      </Card>
    );
  }

  const intensityStyle = getIntensityColor(recommendation.intensity);

  return (
    <Card className="group cursor-pointer hover:border-primary/50 transition-all duration-300" onClick={onViewDetails}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Entra\u00eenement recommand\u00e9</CardTitle>
          <div
            className={cn('px-2.5 py-1 rounded-full text-xs font-medium', intensityStyle.bg, intensityStyle.text)}
          >
            {recommendation.intensity}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <h3 className="text-xl font-semibold text-foreground mb-2">{recommendation.title}</h3>
        <p className="text-muted text-sm mb-4">{recommendation.subtitle}</p>

        {recommendation.metrics && (recommendation.metrics.acwr || recommendation.metrics.readiness) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {recommendation.metrics.acwr && (
              <Badge variant="default" className="gap-1">
                <TrendingUp className="w-3 h-3" />
                ACWR: {recommendation.metrics.acwr.toFixed(2)}
              </Badge>
            )}
            {recommendation.metrics.readiness && (
              <Badge variant="default" className="gap-1">
                <Activity className="w-3 h-3" />
                Forme: {recommendation.metrics.readiness}%
              </Badge>
            )}
            {recommendation.metrics.polarizationIndex > 0 && (
              <Badge variant="default" className="gap-1">
                <Zap className="w-3 h-3" />
                Polarisation: {recommendation.metrics.polarizationIndex}%
              </Badge>
            )}
          </div>
        )}

        <div className="space-y-2 mb-4">
          {recommendation.structure.slice(0, 3).map((step, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-surface flex items-center justify-center text-xs text-muted flex-shrink-0">
                {index + 1}
              </span>
              <span className="text-muted">{step}</span>
            </div>
          ))}
          {recommendation.structure.length > 3 && (
            <p className="text-xs text-muted pl-7">+{recommendation.structure.length - 3} autres \u00e9tapes</p>
          )}
        </div>

        {recommendation.physiologicalGain && (
          <div className="text-xs text-muted mb-4 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Gain physiologique: {recommendation.physiologicalGain}
          </div>
        )}

        <p className="text-sm text-muted mb-4">{recommendation.advice}</p>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <span className="text-sm text-muted">Voir les d\u00e9tails</span>
          <ChevronRight className="w-4 h-4 text-muted group-hover:translate-x-1 transition-transform" />
        </div>
      </CardContent>
    </Card>
  );
}
