'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Shield, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface InjuryRiskCardProps {
  acwr: number;
  trend?: 'up' | 'down' | 'stable';
}

export const InjuryRiskCard: React.FC<InjuryRiskCardProps> = ({ acwr, trend }) => {
  const getStatus = (value: number) => {
    if (value < 0.8) return {
      label: 'Sous-entraînement',
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/20',
      icon: <TrendingDown className="w-5 h-5" />,
      message: 'Votre charge est faible. Augmentez progressivement pour progresser.',
      risk: 'Faible'
    };
    if (value <= 1.3) return {
      label: 'Zone Optimale',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      borderColor: 'border-emerald-400/20',
      icon: <CheckCircle className="w-5 h-5" />,
      message: 'Excellent équilibre ! Vous progressez sans risque excessif.',
      risk: 'Minimal'
    };
    if (value <= 1.5) return {
      label: 'Surcharge Modérée',
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
      borderColor: 'border-amber-400/20',
      icon: <AlertTriangle className="w-5 h-5" />,
      message: 'Attention, votre charge augmente vite. Surveillez votre fatigue.',
      risk: 'Modéré'
    };
    return {
      label: 'DANGER !',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      icon: <AlertTriangle className="w-5 h-5" />,
      message: 'Risque de blessure très élevé (3-4x). Repos impératif.',
      risk: 'Critique'
    };
  };

  const status = getStatus(acwr);
  const isDanger = acwr > 1.5;

  return (
    <Card className={`p-5 relative overflow-hidden border ${status.borderColor} ${status.bgColor} backdrop-blur-md ${isDanger ? 'animate-pulse ring-2 ring-red-500/50' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-1">Prévention Blessure</h3>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${status.color}`}>
              {acwr.toFixed(2)}
            </span>
            <span className="text-xs text-gray-500">ACWR</span>
            {trend === 'up' && <TrendingUp className="w-3 h-3 text-red-400" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3 text-emerald-400" />}
          </div>
        </div>
        <div className={`p-2 rounded-lg ${status.bgColor} ${status.color}`}>
          <Shield className="w-6 h-6" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${status.color}`}>
            {status.label}
          </span>
          <div className="h-1.5 flex-1 bg-gray-800 rounded-full overflow-hidden relative">
            {/* Optimal Range Highlight */}
            <div className="absolute left-[40%] right-[35%] h-full bg-emerald-500/20" title="Zone Optimale (0.8 - 1.3)" />
            <div 
              className={`h-full ${status.color.replace('text-', 'bg-')} transition-all duration-1000 relative z-10`}
              style={{ width: `${Math.min((acwr / 2) * 100, 100)}%` }}
            />
          </div>
        </div>
        
        <p className="text-xs text-gray-300 leading-relaxed italic">
          "{status.message}"
        </p>

        <div className="flex justify-between items-center pt-2 border-t border-white/5">
          <div className="text-[10px] uppercase tracking-wider text-gray-500">Niveau de Risque</div>
          <div className={`text-[10px] font-bold uppercase tracking-wider ${status.color}`}>
            {status.risk}
          </div>
        </div>
      </div>

      {/* Decorative gradient background */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 blur-3xl opacity-20 rounded-full ${status.color.replace('text-', 'bg-')}`} />
    </Card>
  );
};
