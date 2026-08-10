'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Badge, ActivitySkeleton } from '@/components/ui';
import { formatDate, formatDistance, formatDuration, getSportColor } from '@/lib/utils';
import type { Activity } from '@/types';
import { Clock, Heart, Activity as ActivityIcon, TrendingUp, BarChart3 } from '@/components/ui/icons';

interface RecentActivitiesProps {
  activities: Activity[];
  isLoading?: boolean;
}

function getActivityIcon(type: string) {
  const t = type?.toLowerCase() ?? '';
  if (t.includes('run') || t.includes('course') || t.includes('trail')) return <ActivityIcon className="w-5 h-5" />;
  if (t.includes('bike') || t.includes('velo') || t.includes('cycling')) return <TrendingUp className="w-5 h-5" />;
  if (t.includes('swim') || t.includes('natation')) return <BarChart3 className="w-5 h-5" />;
  return <ActivityIcon className="w-5 h-5" />;
}

export function RecentActivities({ activities, isLoading }: RecentActivitiesProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activit\u00e9s r\u00e9centes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <ActivitySkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activit\u00e9s r\u00e9centes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted text-sm text-center py-4">
            Aucune activit\u00e9 r\u00e9cente. Synchronisez avec Strava ou Garmin.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Activit\u00e9s r\u00e9centes</CardTitle>
          <Link href="/app/activities" className="text-sm text-primary hover:underline">
            Voir tout
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.slice(0, 5).map((activity) => (
          <Link
            key={activity.id}
            href={`/app/activities/${activity.id}`}
            className="flex items-center gap-4 p-3 rounded-lg bg-surface hover:bg-surface/80 transition-colors group"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-primary transition-colors"
              style={{ backgroundColor: `${getSportColor(activity.type)}20` }}
            >
              {getActivityIcon(activity.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-foreground truncate">{activity.title}</h4>
                <Badge variant="default" size="sm">
                  {activity.type}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(activity.date)}
                </span>
                {activity.avgHR > 0 && (
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" />
                    {activity.avgHR} bpm
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="font-semibold text-foreground">{formatDistance(activity.distance)}</p>
              <p className="text-sm text-muted">{activity.pace || formatDuration(activity.moving_time || 0)}</p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
