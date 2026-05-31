'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Activity, Info, Zap } from '@/components/ui/icons';

interface BiomechanicsMetrics {
  verticalOscillation: number;
  groundContactTime: number;
  stiffness: number;
  verticalRatio: number;
  stepLength: number;
  cadence: number;
  advice: Array<{
    type: string;
    message: string;
    detail: string;
    priority: 'high' | 'moderate' | 'low';
  }>;
}

interface BiomechanicsCardProps {
  metrics: BiomechanicsMetrics;
}

export const BiomechanicsCard: React.FC<BiomechanicsCardProps> = ({ metrics }) => {
  const getGctColor = (gct: number) => {
    if (gct < 210) return 'text-success';
    if (gct < 250) return 'text-peak';
    return 'text-danger';
  };

  const getVoColor = (vo: number) => {
    if (vo < 8) return 'text-success';
    if (vo < 11) return 'text-peak';
    return 'text-danger';
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30 pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Analyse de Foulée (Biomécanique)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Main Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted uppercase font-medium">Oscillation Vert.</p>
            <p className={`text-2xl font-bold ${getVoColor(metrics.verticalOscillation)}`}>
              {metrics.verticalOscillation} <span className="text-sm font-normal text-muted">cm</span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted uppercase font-medium">Temps de Contact</p>
            <p className={`text-2xl font-bold ${getGctColor(metrics.groundContactTime)}`}>
              {metrics.groundContactTime} <span className="text-sm font-normal text-muted">ms</span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted uppercase font-medium">Raideur (Stiffness)</p>
            <p className="text-2xl font-bold text-primary">
              {metrics.stiffness} <span className="text-sm font-normal text-muted">kN/m</span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted uppercase font-medium">Ratio Vertical</p>
            <p className="text-2xl font-bold text-secondary">
              {metrics.verticalRatio} <span className="text-sm font-normal text-muted">%</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
           <div className="p-3 bg-muted/20 rounded-xl flex items-center justify-between">
              <span className="text-sm text-muted">Longueur de foulée</span>
              <span className="font-bold">{metrics.stepLength}m</span>
           </div>
           <div className="p-3 bg-muted/20 rounded-xl flex items-center justify-between">
              <span className="text-sm text-muted">Cadence moyenne</span>
              <span className="font-bold">{metrics.cadence} ppm</span>
           </div>
        </div>

        {/* Coach Advice */}
        {metrics.advice && metrics.advice.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-warning" />
              Conseils Techniques du Coach
            </h4>
            <div className="space-y-2">
              {metrics.advice.map((adv, i) => (
                <div key={i} className={`p-3 rounded-xl border-l-4 ${
                  adv.priority === 'high' ? 'bg-danger/5 border-danger' : 
                  adv.priority === 'moderate' ? 'bg-warning/5 border-warning' : 
                  'bg-primary/5 border-primary'
                }`}>
                  <p className="text-sm font-bold">{adv.message}</p>
                  <p className="text-xs text-muted mt-1">{adv.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl text-[10px] text-primary/70">
          <Info className="w-3 h-3 shrink-0" />
          <p>Ces métriques sont des estimations algorithmiques basées sur la vitesse et la cadence. Elles visent à identifier des tendances techniques majeures.</p>
        </div>
      </CardContent>
    </Card>
  );
};
