'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Mountain } from 'lucide-react';
import { RunAnalysisCards } from './RunAnalysisCards';
import type { TrailRunAnalysis } from '@/types';

export function TrailRunAnalysisCards({ analysis }: { analysis: TrailRunAnalysis }) {
  return (
    <>
      {/* Trail-specific metrics */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Mountain className="w-4 h-4 text-green-400" />Métriques Trail</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {analysis.vam && (
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <p className="text-lg font-bold text-green-400">{analysis.vam} m/h</p>
                <p className="text-xs text-muted">VAM</p>
              </div>
            )}
            {analysis.technicalScore && (
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <p className={`text-lg font-bold capitalize ${
                  analysis.technicalScore === 'expert' ? 'text-red-400'
                  : analysis.technicalScore === 'advanced' ? 'text-orange-400'
                  : analysis.technicalScore === 'moderate' ? 'text-yellow-400'
                  : 'text-green-400'
                }`}>
                  {analysis.technicalScore}
                </p>
                <p className="text-xs text-muted">Niveau technique</p>
              </div>
            )}
            {analysis.elevationGain > 0 && (
              <div className="text-center p-3 rounded-lg bg-background border border-border">
                <p className="text-lg font-bold text-foreground">+{Math.round(analysis.elevationGain)}m</p>
                <p className="text-xs text-muted">Dénivelé total</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Run analysis */}
      <RunAnalysisCards analysis={analysis} />
    </>
  );
}
