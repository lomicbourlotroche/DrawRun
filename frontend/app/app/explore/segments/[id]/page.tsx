'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { Trophy, Timer, ChevronLeft, Share2 } from '@/components/ui/icons';
import { toast } from 'sonner';
import { formatDuration } from '@/lib/utils';
import { SegmentLeaderboard } from '@/components/features/explore/Segments';
import { SegmentMap } from '@/components/features/explore/Map';

interface SegmentDetail {
  id: number;
  name: string;
  description?: string;
  distance: number;
  elevation_gain?: number;
  elevation_loss?: number;
  avg_grade?: number;
  max_grade?: number;
  activity_type: string;
  polyline?: string;
  creator_name?: string;
  total_efforts?: number;
  unique_athletes?: number;
  start_lat?: number;
  start_lng?: number;
  end_lat?: number;
  end_lng?: number;
  kom?: {
    user_name?: string;
    elapsed_time?: number;
  };
  qom?: {
    user_name?: string;
    elapsed_time?: number;
  };
}

interface SegmentEffort {
  id: number;
  segment_id: number;
  activity_id: number;
  elapsed_time: number;
  moving_time?: number;
  start_date: string;
  avg_watts?: number;
  max_watts?: number;
  avg_heartrate?: number;
  max_heartrate?: number;
  activity_name?: string;
}

export default function SegmentDetailPage() {
  const params = useParams();
  const segmentId = parseInt(params.id as string);
  const [segment, setSegment] = useState<SegmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [myEfforts, setMyEfforts] = useState<SegmentEffort[]>([]);

  useEffect(() => {
    const loadSegment = async () => {
      try {
        const response = await api.getSegment(segmentId);
        if (response.success) {
          setSegment(response.segment);
        }
      } catch {
        /* silencieux — segment non chargé */
      } finally {
        setIsLoading(false);
      }
    };

    const loadMyEfforts = async () => {
      try {
        const response = await api.getMySegmentEfforts(segmentId);
        if (response.success) {
          setMyEfforts(response.efforts);
        }
      } catch {
        /* silencieux — efforts non chargés */
      }
    };

    loadSegment();
    loadMyEfforts();
  }, [segmentId]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!segment) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Segment non trouvé</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => window.history.back()}
          aria-label="Retour à la page précédente"
        >
          <ChevronLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          Retour
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{segment.name}</h1>
            <p className="text-muted-foreground">{segment.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{segment.activity_type}</Badge>
              <span className="text-sm text-muted-foreground">
                Créé par {segment.creator_name || 'Anonymous'}
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => {
            const url = `${window.location.origin}/app/explore/segments/${segmentId}`;
            navigator.clipboard.writeText(url);
            toast.success('Lien copié');
          }} aria-label="Partager ce segment">
            <Share2 className="w-4 h-4 mr-2" aria-hidden="true" />
            Partager
          </Button>
        </div>
      </div>

      {/* Map */}
      {segment.polyline && (
        <Card className="mb-6">
          <CardContent className="p-0">
            <SegmentMap
              polyline={segment.polyline}
              startLat={segment.start_lat || 0}
              startLng={segment.start_lng || 0}
              endLat={segment.end_lat || 0}
              endLng={segment.end_lng || 0}
              height="300px"
            />
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Distance</div>
            <div className="text-2xl font-bold">{(segment.distance / 1000).toFixed(2)} km</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Dénivelé</div>
            <div className="text-2xl font-bold">{segment.elevation_gain}m</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Pente moy.</div>
            <div className="text-2xl font-bold">{segment.avg_grade}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Athlètes</div>
            <div className="text-2xl font-bold">{segment.unique_athletes}</div>
          </CardContent>
        </Card>
      </div>

      {/* KOM/QOM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {segment.kom && (
          <Card className="bg-warning-50 border-warning-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-warning-700">
                <Trophy className="w-4 h-4" />
                KOM (King of the Mountain)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{segment.kom.user_name}</p>
              <p className="text-2xl font-bold text-warning-600">
                {formatDuration(segment.kom.elapsed_time || 0)}
              </p>
            </CardContent>
          </Card>
        )}

        {segment.qom && (
          <Card className="bg-secondary-50 border-secondary-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-secondary-700">
                <Trophy className="w-4 h-4" />
                QOM (Queen of the Mountain)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{segment.qom.user_name}</p>
              <p className="text-2xl font-bold text-secondary-600">
                {formatDuration(segment.qom.elapsed_time || 0)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* My Efforts */}
      {myEfforts.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              Mes efforts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {myEfforts.map((effort) => (
                <div 
                  key={effort.id} 
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">{effort.activity_name || 'Activité'}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(effort.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold">
                      {formatDuration(effort.elapsed_time)}
                    </p>
                    {effort.avg_watts && (
                      <p className="text-sm text-muted-foreground">
                        {Math.round(effort.avg_watts)}W
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <SegmentLeaderboard segmentId={segmentId} />
    </div>
  );
}
