/* eslint-disable unused-imports/no-unused-vars */
'use client';

import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Recommendation } from '@/types';
import { TRAINING_TYPES } from '@/lib/constants';
import { ChevronRight, Activity, TrendingUp, Zap } from 'lucide-react';

interface RecommendationCardProps {
  recommendation: Recommendation | null;
  isLoading?: boolean;
  onViewDetails?: () => void;
}

const getIntensityColor = (intensity: string) => {
  switch (intensity) {
    case 'rest': return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' };
    case 'easy': return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
    case 'moderate': return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
    case 'threshold': return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' };
    case 'hard': return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
    case 'varied': return { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' };
    default: return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' };
  }
};

export function RecommendationCard({ recommendation, isLoading, onViewDetails }: RecommendationCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Entraînement recommandé</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-8 w-32 bg-background rounded animate-pulse" />
            <div className="h-4 w-48 bg-background rounded animate-pulse" />
            <div className="h-4 w-full bg-background rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Entraînement recommandé</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted text-sm">Aucune recommandation disponible</p>
        </CardContent>
      </Card>
    );
  }

  const typeInfo = TRAINING_TYPES[recommendation.type as keyof typeof TRAINING_TYPES] || TRAINING_TYPES.REST;
  const intensityStyle = getIntensityColor(recommendation.intensity);

  return (
    <Card className="group cursor-pointer hover:border-primary/50 transition-all duration-300" onClick={onViewDetails}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Entraînement recommandé</CardTitle>
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
              <span className="w-5 h-5 rounded-full bg-background flex items-center justify-center text-xs text-muted flex-shrink-0">
                {index + 1}
              </span>
              <span className="text-text-secondary">{step}</span>
            </div>
          ))}
          {recommendation.structure.length > 3 && (
            <p className="text-xs text-muted pl-7">+{recommendation.structure.length - 3} autres étapes</p>
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
          <span className="text-sm text-muted">Voir les détails</span>
          <ChevronRight className="w-4 h-4 text-muted group-hover:translate-x-1 transition-transform" />
        </div>
      </CardContent>
    </Card>
  );
}
