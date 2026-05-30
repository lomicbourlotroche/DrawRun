'use client';

import { TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import type { Activity as ActivityType } from '@/types';

export function EliteAnalyticsSection({ activities }: { activities: ActivityType[] }) {
  const efData = activities
    .filter(a => a.efficiency_factor)
    .map(a => ({
      date: a.date || a.start_date || '',
      ef: a.efficiency_factor
    }))
    .reverse();

  const trailActivities = activities.filter(a => a.gap && a.total_elevation_gain && a.total_elevation_gain > 50);

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Efficacité Aérobie (EF) <Badge variant="outline" className="text-[10px] ml-1">Données avancées</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted mb-6">
          L&apos;Efficiency Factor (EF) mesure votre vitesse ajustée à la pente (GAP) par rapport à votre fréquence cardiaque moyenne.
          Une hausse de l&apos;EF sur le long terme indique une amélioration de votre condition aérobie.
        </p>

        <div className="h-48 relative">
          {efData.length >= 2 ? (
            <div className="w-full h-full flex flex-col justify-end gap-1">
              <div className="flex-1 flex items-end gap-1 px-2">
                {efData.slice(-15).map((d, i) => {
                  const h = Math.min(100, (d.ef || 0) * 40);
                  return (
                    <div key={i} className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t-sm transition-all group relative" style={{ height: `${h}%` }}>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-surface text-foreground text-[10px] py-0.5 px-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none z-10">
                        {d.ef}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="h-px bg-border w-full" />
              <div className="flex justify-between text-[10px] text-muted pt-1">
                <span>{efData.length > 0 ? new Date(efData[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}</span>
                <span>{efData.length > 0 ? new Date(efData[efData.length - 1].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}</span>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center border border-dashed border-border rounded-xl">
              <p className="text-sm text-muted">Pas assez de données pour le graphique EF</p>
            </div>
          )}
        </div>

        {trailActivities.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border text-xs text-muted uppercase tracking-wider">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium text-right">Pace</th>
                  <th className="pb-2 font-medium text-right text-primary">GAP</th>
                  <th className="pb-2 font-medium text-right">Gain</th>
                </tr>
              </thead>
              <tbody>
                {trailActivities.slice(0, 6).map(a => (
                  <tr key={a.id} className="border-b border-border/50 last:border-0 hover:bg-muted/5 transition-colors">
                    <td className="py-2.5 text-muted">{new Date(a.date || a.start_date || '').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</td>
                    <td className="py-2.5 text-right font-medium">{a.pace}/km</td>
                    <td className="py-2.5 text-right font-bold text-primary">{a.gap}/km</td>
                    <td className="py-2.5 text-right text-xs">+{a.total_elevation_gain}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
