'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Badge, ActivitySkeleton } from '@/components/ui';
import { cn, formatDate, formatDistance, formatDuration, getSportColor } from '@/lib/utils';
import type { Activity } from '@/types';
import { MapPin, Clock, Heart } from 'lucide-react';

interface RecentActivitiesProps {
  activities: Activity[];
  isLoading?: boolean;
}

export function RecentActivities({ activities, isLoading }: RecentActivitiesProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activités récentes</CardTitle>
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
          <CardTitle>Activités récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted text-sm text-center py-4">
            Aucune activité récente. Synchronisez avec Strava ou Garmin.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sportIcons: Record<string, string> = {
    run: '🏃',
    bike: '🚴',
    swim: '🏊',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Activités récentes</CardTitle>
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
            className="flex items-center gap-4 p-3 rounded-lg bg-background hover:bg-background/80 transition-colors"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
              style={{ backgroundColor: `${getSportColor(activity.type)}20` }}
            >
              {sportIcons[activity.type] || '🏃'}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-foreground truncate">{activity.title}</h4>
                <Badge variant="default" size="sm">{activity.type}</Badge>
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
