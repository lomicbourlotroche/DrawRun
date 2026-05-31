'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { api } from '@/lib/api';
import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Zap, Activity } from '@/components/ui/icons';

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
      /* silencieux */
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse h-20 bg-surface rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.risk === 'unknown') {
    return null;
  }

  const riskColors = {
    low: 'bg-success/10 border-success/20 text-success',
    moderate: 'bg-warning/10 border-warning/20 text-warning',
    high: 'bg-danger/10 border-danger/20 text-danger',
    unknown: 'bg-muted border-border text-muted',
  };

  const riskLabels = {
    low: 'Faible',
    moderate: 'Mod\u00e9r\u00e9',
    high: '\u00c9lev\u00e9',
    unknown: 'Inconnu',
  };

  const riskIcons = {
    low: CheckCircle,
    moderate: AlertTriangle,
    high: AlertTriangle,
    unknown: Activity,
  };

  const RiskIcon = riskIcons[data.risk];

  if (data.risk === 'low') {
    return (
      <Card className="border-success/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
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
    <Card className={`border ${riskColors[data.risk]}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <RiskIcon className={`w-5 h-5 ${riskColors[data.risk].split(' ')[2]}`} />
          Alerte Surentra\u00eenement
          <span className={`text-xs px-2 py-0.5 rounded-full ${riskColors[data.risk]}`}>
            Risque {riskLabels[data.risk]}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted">{data.message}</p>

        {data.acwr && (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-surface border border-border">
              <p className="text-2xl font-bold text-foreground">{data.acwr.toFixed(2)}</p>
              <p className="text-xs text-muted">ACWR</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-surface border border-border">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="w-4 h-4 text-success" />
                <p className="text-2xl font-bold text-success">{data.ctl}</p>
              </div>
              <p className="text-xs text-muted">Fitness (CTL)</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-surface border border-border">
              <div className="flex items-center justify-center gap-1">
                <TrendingDown className="w-4 h-4 text-danger" />
                <p className="text-2xl font-bold text-danger">{data.atl}</p>
              </div>
              <p className="text-xs text-muted">Fatigue (ATL)</p>
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-lg font-semibold">
            <span className={data.tsb > 0 ? 'text-success' : data.tsb < -10 ? 'text-danger' : 'text-warning'}>
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
            <div className="w-2 h-2 rounded-full bg-success" />
            <span>Optimal: 0.8-1.3</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <span>Mod\u00e9r\u00e9: 1.3-1.5</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-danger" />
            <span>Risque: &gt;1.5</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
