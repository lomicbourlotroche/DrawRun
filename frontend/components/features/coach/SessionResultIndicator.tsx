'use client';

import type { JSX } from 'react';
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, Minus, Clock } from '@/components/ui/icons';

interface SessionResultIndicatorProps {
  result: 'success' | 'failed' | 'partial' | 'skipped' | 'on-time' | 'delayed';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

// Couleurs basées sur les tokens métiers
const resultStyles: Record<string, { icon: JSX.Element; color: string; bgColor: string; label: string; description: string }> = {
  success: {
    icon: <CheckCircle2 className="w-full h-full" />,
    color: 'text-success',
    bgColor: 'bg-success/20',
    label: 'Réussie',
    description: 'Objectifs atteints',
  },
  failed: {
    icon: <XCircle className="w-full h-full" />,
    color: 'text-danger',
    bgColor: 'bg-danger/20',
    label: 'Échouée',
    description: 'Objectifs non atteints',
  },
  partial: {
    icon: <AlertCircle className="w-full h-full" />,
    color: 'text-peak',
    bgColor: 'bg-peak/20',
    label: 'Partielle',
    description: 'Objectifs partiellement atteints',
  },
  skipped: {
    icon: <Minus className="w-full h-full" />,
    color: 'text-muted',
    bgColor: 'bg-muted/20',
    label: 'Sautée',
    description: 'Séance non effectuée',
  },
  'on-time': {
    icon: <TrendingUp className="w-full h-full" />,
    color: 'text-success',
    bgColor: 'bg-success/20',
    label: 'À l\'heure',
    description: 'Séance terminée à temps',
  },
  delayed: {
    icon: <Clock className="w-full h-full" />,
    color: 'text-peak',
    bgColor: 'bg-peak/20',
    label: 'Reportée',
    description: 'Séance terminée en retard',
  },
};

const sizeClasses = {
  sm: { container: 'w-5 h-5', icon: 'w-3 h-3', label: 'text-xs' },
  md: { container: 'w-8 h-8', icon: 'w-4 h-4', label: 'text-sm' },
  lg: { container: 'w-12 h-12', icon: 'w-6 h-6', label: 'text-base' },
};

export default function SessionResultIndicator({
  result,
  size = 'md',
  showLabel = false,
  className = '',
}: SessionResultIndicatorProps) {
  const style = resultStyles[result];
  const sizes = sizeClasses[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`
          ${sizes.container} rounded-full flex items-center justify-center
          ${style.bgColor} ${style.color}
          ring-2 ring-current ring-opacity-30
        `}
        aria-label={style.description}
        role="status"
      >
        <span className={sizes.icon}>{style.icon}</span>
      </div>
      {showLabel && (
        <span className={`font-medium ${style.color} ${sizes.label}`}>
          {style.label}
        </span>
      )}
    </div>
  );
}
