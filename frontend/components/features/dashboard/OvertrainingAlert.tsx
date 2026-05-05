'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { api } from '@/lib/api';
import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Zap, Activity } from 'lucide-react';

interface OvertrainingData {
  risk: 'low' | 'moderate' | 'high' | 'unknown';
  acwr: number | null;
  ctl: number;
  atl: number;
  tsb: number;
  message: string;
  recommendation?: string;
}

export default function OvertrainingAlert() {
  const [data, setData] = useState<OvertrainingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await api.checkOvertraining();
      setData(result as OvertrainingData);
    } catch {
      /* silencieux — overtraining data non disponible */
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.risk === 'unknown') {
    return null;
  }

  const riskColors = {
    low: 'bg-green-500/10 border-green-500/20 text-green-400',
    moderate: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    high: 'bg-red-500/10 border-red-500/20 text-red-400',
    unknown: 'bg-muted border-border text-muted'
  };

  const riskLabels = {
    low: 'Faible',
    moderate: 'Modéré',
    high: 'Élevé',
    unknown: 'Inconnu'
  };

  const riskIcons = {
    low: CheckCircle,
    moderate: AlertTriangle,
    high: AlertTriangle,
    unknown: Activity
  };

  const RiskIcon = riskIcons[data.risk];

  if (data.risk === 'low') {
    return (
      <Card className="border-green-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="font-medium text-foreground">Charge optimale</p>
              <p className="text-sm text-muted">{data.message}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border ${riskColors[data.risk].split(' ')[1]}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <RiskIcon className={`w-5 h-5 ${riskColors[data.risk].split(' ')[2]}`} />
          Alerte Surentraînement
          <span className={`text-xs px-2 py-0.5 rounded-full ${riskColors[data.risk]}`}>
            Risque {riskLabels[data.risk]}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted">{data.message}</p>

        {data.acwr && (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-background border border-border">
              <p className="text-2xl font-bold text-foreground">{data.acwr.toFixed(2)}</p>
              <p className="text-xs text-muted">ACWR</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background border border-border">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <p className="text-2xl font-bold text-green-400">{data.ctl}</p>
              </div>
              <p className="text-xs text-muted">Fitness (CTL)</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background border border-border">
              <div className="flex items-center justify-center gap-1">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <p className="text-2xl font-bold text-red-400">{data.atl}</p>
              </div>
              <p className="text-xs text-muted">Fatigue (ATL)</p>
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-lg font-semibold">
            <span className={data.tsb > 0 ? 'text-green-400' : data.tsb < -10 ? 'text-red-400' : 'text-yellow-400'}>
              {data.tsb > 0 ? '+' : ''}{data.tsb}
            </span>
          </p>
          <p className="text-xs text-muted">Forme (TSB)</p>
        </div>

        {data.recommendation && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Recommandation</p>
                <p className="text-sm text-muted mt-1">{data.recommendation}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 text-xs text-muted">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span>Optimal: 0.8-1.3</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <span>Modéré: 1.3-1.5</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span>Risque: {'>'}1.5</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}