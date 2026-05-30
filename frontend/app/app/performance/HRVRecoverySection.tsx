'use client';

import { Heart, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Skeleton, Progress } from '@/components/ui';

interface HRVData {
  status: string;
  score: number;
  message: string;
  rmssd: number;
  baselineRmssd?: number;
  ratio: number;
  readiness: number;
  stressScore?: number;
}

export function HRVRecoverySection({ hrv, error }: { hrv: HRVData | null; error: string | null }) {
  if (error) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-danger" />
            HRV &amp; Récupération
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted py-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hrv) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-danger" />
            HRV &amp; Récupération
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusConfig: Record<string, { label: string; color: string; bgColor: string; barColor: string }> = {
    excellent: { label: 'Excellent', color: 'text-success/80', bgColor: 'bg-success/15', barColor: 'bg-success' },
    good:      { label: 'Bon',       color: 'text-primary/80',  bgColor: 'bg-primary/15',  barColor: 'bg-primary'  },
    moderate:  { label: 'Modéré',    color: 'text-warning/80',bgColor: 'bg-warning/15',barColor: 'bg-warning'},
    low:       { label: 'Faible',    color: 'text-peak/80',bgColor: 'bg-peak/15',barColor: 'bg-peak'},
    poor:      { label: 'Mauvais',   color: 'text-danger/80',   bgColor: 'bg-danger/15',   barColor: 'bg-danger'   },
  };

  const cfg = statusConfig[hrv.status] ?? statusConfig['moderate'];
  const readinessPct = Math.min(Math.max(Math.round(hrv.readiness), 0), 100);
  const scorePct = Math.min(Math.max(Math.round(hrv.score), 0), 100);

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-danger" />
          HRV &amp; Récupération <Badge variant="outline" className="text-[10px] ml-1">Estimé</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className={`flex items-center gap-4 p-4 rounded-xl ${cfg.bgColor}`}>
          <div className="text-center min-w-[64px]">
            <p className={`text-4xl font-bold ${cfg.color}`}>{scorePct}</p>
            <p className="text-xs text-muted mt-0.5">Score HRV</p>
          </div>
          <div className="flex-1 space-y-1">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bgColor} ${cfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.barColor}`} />
              {cfg.label}
            </div>
            <p className="text-sm text-foreground">{hrv.message}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-background border border-border text-center">
            <p className="text-xl font-bold text-foreground">{hrv.rmssd}</p>
            <p className="text-xs text-muted mt-0.5">RMSSD (ms) <Badge variant="outline" className="text-[10px] ml-1">Est.</Badge></p>
          </div>
          {hrv.baselineRmssd !== undefined && (
            <div className="p-3 rounded-lg bg-background border border-border text-center">
              <p className="text-xl font-bold text-foreground">{hrv.baselineRmssd}</p>
              <p className="text-xs text-muted mt-0.5">Baseline (ms) <Badge variant="outline" className="text-[10px] ml-1">Est.</Badge></p>
            </div>
          )}
          <div className="p-3 rounded-lg bg-background border border-border text-center">
            <p className="text-xl font-bold text-foreground">{hrv.ratio.toFixed(2)}</p>
            <p className="text-xs text-muted mt-0.5">Ratio HRV <Badge variant="outline" className="text-[10px] ml-1">Est.</Badge></p>
          </div>
          {hrv.stressScore !== undefined && (
            <div className="p-3 rounded-lg bg-background border border-border text-center">
              <p className="text-xl font-bold text-foreground">{hrv.stressScore}</p>
              <p className="text-xs text-muted mt-0.5">Score stress <Badge variant="outline" className="text-[10px] ml-1">Est.</Badge></p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted font-medium">Niveau de récupération <Badge variant="outline" className="text-[10px] ml-1">Estimé</Badge></span>
            <span className="font-semibold text-foreground">{readinessPct}%</span>
          </div>
          <Progress value={readinessPct} className="h-2.5" />
        </div>
      </CardContent>
    </Card>
  );
}
