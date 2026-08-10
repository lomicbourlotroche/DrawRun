'use client';

import React from 'react';
import { Card } from '@/components/ui';
import { Shield, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from '@/components/ui/icons';

interface InjuryRiskCardProps {
  acwr: number;
  trend?: 'up' | 'down' | 'stable';
}

export const InjuryRiskCard: React.FC<InjuryRiskCardProps> = ({ acwr, trend }) => {
  const getStatus = (value: number) => {
    if (value < 0.8) {
      return {
        label: 'Sous-entra\u00eenement',
        color: 'text-primary',
        bgColor: 'bg-primary/10',
        borderColor: 'border-primary/20',
        icon: <TrendingDown className="w-5 h-5" />,
        message: 'Votre charge est faible. Augmentez progressivement pour progresser.',
        risk: 'Faible',
        barColor: 'bg-primary/50',
      };
    }
    if (value <= 1.3) {
      return {
        label: 'Zone Optimale',
        color: 'text-success',
        bgColor: 'bg-success/10',
        borderColor: 'border-success/20',
        icon: <CheckCircle className="w-5 h-5" />,
        message: 'Excellent \u00e9quilibre ! Vous progressez sans risque excessif.',
        risk: 'Minimal',
        barColor: 'bg-success/50',
      };
    }
    if (value <= 1.5) {
      return {
        label: 'Surcharge Mod\u00e9r\u00e9e',
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        borderColor: 'border-warning/20',
        icon: <AlertTriangle className="w-5 h-5" />,
        message: 'Attention, votre charge augmente vite. Surveillez votre fatigue.',
        risk: 'Mod\u00e9r\u00e9',
        barColor: 'bg-warning/50',
      };
    }
    return {
      label: 'DANGER !',
      color: 'text-danger',
      bgColor: 'bg-danger/10',
      borderColor: 'border-danger/20',
      icon: <AlertTriangle className="w-5 h-5" />,
      message: 'Risque de blessure tr\u00e8s \u00e9lev\u00e9 (3-4x). Repos imp\u00e9ratif.',
      risk: 'Critique',
      barColor: 'bg-danger/50',
    };
  };

  const status = getStatus(acwr);
  const isDanger = acwr > 1.5;

  return (
    <Card
      className={`relative overflow-hidden border ${status.borderColor} ${status.bgColor} ${isDanger ? 'ring-2 ring-danger/50' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-medium text-muted mb-1">Pr\u00e9vention Blessure</h3>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${status.color}`}>{acwr.toFixed(2)}</span>
            <span className="text-xs text-muted">ACWR</span>
            {trend === 'up' && <TrendingUp className="w-3 h-3 text-danger/80" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3 text-success" />}
          </div>
        </div>
        <div className={`p-2 rounded-lg ${status.bgColor} ${status.color}`}>
          <Shield className="w-6 h-6" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${status.color}`}>{status.label}</span>
          <div className="h-1.5 flex-1 bg-surface rounded-full overflow-hidden relative">
            <div className="absolute left-[40%] right-[35%] h-full bg-success/20" title="Zone Optimale (0.8 - 1.3)" />
            <div
              className={`h-full ${status.barColor} transition-all duration-1000 relative z-10`}
              style={{ width: `${Math.min((acwr / 2) * 100, 100)}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-muted/80 leading-relaxed italic">{status.message}</p>

        <div className="flex justify-between items-center pt-2 border-t border-border/50">
          <div className="text-[10px] uppercase tracking-wider text-muted">Niveau de Risque</div>
          <div className={`text-[10px] font-bold uppercase tracking-wider ${status.color}`}>{status.risk}</div>
        </div>
      </div>

      <div className={`absolute -right-4 -bottom-4 w-24 h-24 blur-3xl opacity-20 rounded-full ${status.barColor}`} />
    </Card>
  );
};
