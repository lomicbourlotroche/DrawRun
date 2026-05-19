/* eslint-disable unused-imports/no-unused-vars */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { SegmentLeaderboardEntry } from '@/lib/api/types';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { Trophy, MapPin, TrendingUp, Users, ChevronRight } from 'lucide-react';
import { formatDuration } from '@/lib/utils';

interface Segment {
  id: number;
  name: string;
  description?: string;
  distance: number;
  elevation_gain: number;
  elevation_loss?: number;
  avg_grade?: number;
  activity_type: string;
  effort_count: number;
  creator_name?: string;
  total_efforts?: number;
  unique_athletes?: number;
  kom?: {
    user_name: string;
    elapsed_time: number;
  };
  qom?: {
    user_name: string;
    elapsed_time: number;
  };
}

interface SegmentListProps {
  segments: Segment[];
  onSegmentClick?: (segment: Segment) => void;
  isLoading?: boolean;
}

export function SegmentList({ segments, onSegmentClick, isLoading }: SegmentListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-24" />
          </Card>
        ))}
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucun segment trouvé</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {segments.map((segment) => (
        <Card
          key={segment.id}
          className="cursor-pointer hover:border-primary/50 transition-all"
          onClick={() => onSegmentClick?.(segment)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">{segment.name}</h3>
                  <Badge variant="secondary" size="sm">
                    {segment.activity_type}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>{(segment.distance / 1000).toFixed(2)} km</span>
                  <span>{segment.elevation_gain}m D+</span>
                  {segment.avg_grade && (
                    <span>{segment.avg_grade}% moy.</span>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-2">
                  {segment.kom && (
                    <div className="flex items-center gap-1 text-xs">
                      <Trophy className="w-3.5 h-3.5 text-warning" />
                      <span className="text-yellow-600">
                        KOM: {segment.kom.user_name} • {formatDuration(segment.kom.elapsed_time)}
                      </span>
                    </div>
                  )}
                  {segment.qom && (
                    <div className="flex items-center gap-1 text-xs">
                      <Trophy className="w-3.5 h-3.5 text-pink-500" />
                      <span className="text-pink-600">
                        QOM: {segment.qom.user_name} • {formatDuration(segment.qom.elapsed_time)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {segment.effort_count || segment.total_efforts || 0} efforts
                  </span>
                  {segment.unique_athletes && (
                    <span>{segment.unique_athletes} athlètes</span>
                  )}
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface SegmentLeaderboardProps {
  segmentId: number;
}

export function SegmentLeaderboard({ segmentId }: SegmentLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<SegmentLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const response = await api.getSegmentLeaderboard(segmentId);
        if (response.success) {
          setLeaderboard(response.leaderboard);
        }
      } catch {
        /* silencieux — leaderboard reste vide */
      } finally {
        setIsLoading(false);
      }
    };
    loadLeaderboard();
  }, [segmentId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-warning" />
          Classement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {leaderboard.map((effort, index) => (
            <div
              key={effort.id}
              className={`flex items-center gap-4 p-3 rounded-lg ${
                effort.is_kom
                  ? 'bg-yellow-50 border border-yellow-200'
                  : effort.is_qom
                  ? 'bg-pink-50 border border-pink-200'
                  : 'bg-muted/50'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : effort.rank}
              </div>

              <div className="flex-1">
                <p className="font-medium">{effort.user_name || 'Anonymous'}</p>
                <p className="text-xs text-muted-foreground">
                  {effort.activity_date ? new Date(effort.activity_date).toLocaleDateString() : ''}
                </p>
              </div>

              <div className="text-right">
                <p className="font-mono font-bold">
                  {formatDuration(effort.elapsed_time)}
                </p>
                {effort.avg_watts && (
                  <p className="text-xs text-muted-foreground">
                    {Math.round(effort.avg_watts)}W
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function useNearbySegments() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNearby = useCallback(async (lat: number, lng: number, radius?: number, type?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getNearbySegments(lat, lng, radius, type);
      if (response.success) {
        setSegments(response.segments);
      }
    } catch (err) {
      setError('Failed to fetch segments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPublic = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getPublicSegments();
      if (response.success) {
        setSegments(response.segments as Segment[]);
      }
    } catch (err) {
      setError('Failed to fetch segments');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { segments, isLoading, error, fetchNearby, fetchPublic };
}
