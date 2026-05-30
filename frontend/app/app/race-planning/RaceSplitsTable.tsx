'use client';

import { Heart, Droplets, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';
import { formatDuration, fmtPace } from './race-planning.utils';
import { cn } from '@/lib/utils';
import type { Split } from '@/types';

interface RaceSplitsTableProps {
  splits: Split[];
}

export function RaceSplitsTable({ splits }: RaceSplitsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Splits</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2">KM</th>
                <th className="text-left py-2 px-2">Temps</th>
                <th className="text-left py-2 px-2">Cumulé</th>
                <th className="text-left py-2 px-2">Allure</th>
                <th className="text-left py-2 px-2">Zone FC</th>
                <th className="text-left py-2 px-2">FC</th>
                <th className="hidden md:table-cell text-left py-2 px-2 text-muted" title="Cardiac drift">Dérive</th>
                <th className="hidden md:table-cell text-left py-2 px-2">Pente</th>
                <th className="text-left py-2 px-2">Ravitaillement</th>
              </tr>
            </thead>
            <tbody>
              {splits.map((split: Split) => (
                <tr key={split.km} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-2 px-2 font-medium">{split.km}</td>
                  <td className="py-2 px-2">{formatDuration(split.splitTime)}</td>
                  <td className="py-2 px-2">{formatDuration(split.cumulativeTime)}</td>
                  <td className="py-2 px-2 font-mono font-bold text-primary">{fmtPace(split.pace)}/km</td>
                  <td className="py-2 px-2">
                    <Badge variant="secondary" size="sm">
                      <Heart className="w-3 h-3 mr-1" />
                      {split.hrZone}
                    </Badge>
                  </td>
                  <td className="py-2 px-2 text-muted">{split.hrRange}</td>
                  <td className="hidden md:table-cell py-2 px-2 text-muted text-xs">
                    {split.cardiacDrift !== null && split.cardiacDrift !== undefined ? `+${split.cardiacDrift} bpm` : '-'}
                  </td>
                  <td className="hidden md:table-cell py-2 px-2">
                    {split.grade !== null && split.grade !== undefined ? (
                      <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded-full', split.grade > 2 ? 'bg-danger-50 text-danger-700' : split.grade < -2 ? 'bg-success-50 text-success-700' : 'bg-muted/20 text-muted-foreground')}>
                        {split.grade > 0 ? '+' : ''}{split.grade}%
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex gap-1 flex-wrap">
                      {split.nutrition?.map((nut, idx) => (
                        <Badge key={idx} variant={nut.type === 'water' ? 'secondary' : nut.type === 'gel' ? 'warning' : 'outline'} size="sm">
                          {nut.type === 'water' ? <Droplets className="w-3 h-3 mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
                          {nut.label}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
