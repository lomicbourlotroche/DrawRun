'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, Badge, Button } from '@/components/ui';
import { Navigation, Heart, ChevronLeft, Share2, Star, MapPin, Clock, TrendingUp } from '@/components/ui/icons';
import { formatDuration } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import type { Direction } from '@/lib/api';

const RouteMap = dynamic(() => import('@/components/features/explore/RouteMap'), { ssr: false });

interface RouteDetail {
  id: number;
  name: string;
  description?: string;
  distance: number;
  elevation_gain?: number;
  elevation_loss?: number;
  activity_type: string;
  estimated_duration?: number;
  difficulty?: string;
  tags?: string[];
  avg_rating?: number;
  rating_count: number;
  usage_count: number;
  polyline: string;
  creator_name?: string;
  is_favorited?: boolean;
  waypoints?: string;
  directions?: string;
}

const difficultyConfig: Record<string, { label: string; color: string; bg: string }> = {
  easy: { label: 'Facile', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  medium: { label: 'Modéré', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  hard: { label: 'Difficile', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
};

function getDirectionIcon(type: string, modifier: string): string {
  const icons: Record<string, string> = {
    'turn-left': '←',
    'turn-right': '→',
    'turn-slight-left': '↖',
    'turn-slight-right': '↗',
    'turn-sharp-left': '↰',
    'turn-sharp-right': '↱',
    straight: '↑',
    uturn: '↩',
    'fork-left': '↙',
    'fork-right': '↘',
    'ramp-left': '↙',
    'ramp-right': '↘',
    roundabout: '⟳',
    'roundabout-turn': '⟳',
    arrive: '📍',
    depart: '🏁',
    merge: '⇉',
    continue: '↑',
    end: '🏁',
  };
  const key = modifier ? `${type}-${modifier}` : type;
  return icons[key] || icons[type] || '↑';
}

export default function RouteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const routeId = parseInt(params.id as string);
  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  // Parse directions from stored JSON
  const directions: Direction[] = useMemo(() => {
    if (!route?.directions) return [];
    try {
      return JSON.parse(route.directions);
    } catch {
      return [];
    }
  }, [route?.directions]);

  useEffect(() => {
    const loadRoute = async () => {
      try {
        const response = await api.getRoute(routeId);
        if (response.success) {
          setRoute(response.route);
          setIsFavorited(response.route.is_favorited || false);
        }
      } catch {
        /* silencieux */
      } finally {
        setIsLoading(false);
      }
    };
    loadRoute();
  }, [routeId]);

  const handleFavoriteToggle = async () => {
    try {
      if (isFavorited) {
        await api.removeRouteFromFavorites(routeId);
        setIsFavorited(false);
        toast.success('Retiré des favoris');
      } else {
        await api.addRouteToFavorites(routeId);
        setIsFavorited(true);
        toast.success('Ajouté aux favoris');
      }
    } catch {
      toast.error('Erreur');
    }
  };

  const handleUseRoute = async () => {
    try {
      await api.useRoute(routeId);
      toast.success('Parcours ajouté à votre historique !');
    } catch {
      toast.error('Erreur');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="h-[300px] bg-muted animate-pulse" />
        <div className="max-w-4xl mx-auto p-6 space-y-4">
          <div className="h-8 bg-muted rounded-xl w-1/3 animate-pulse" />
          <div className="h-32 bg-muted rounded-xl animate-pulse" />
          <div className="h-48 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-lg font-bold text-foreground mb-2">Parcours introuvable</h2>
            <p className="text-sm text-muted-foreground mb-4">Ce parcours n&apos;existe pas ou a été supprimé.</p>
            <Button onClick={() => router.push('/app/explore')}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Retour à l&apos;explorateur
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const difficulty = route.difficulty ? difficultyConfig[route.difficulty] : null;
  const hasDirections = directions.length > 0;

  return (
    <div className="min-h-screen bg-surface">
      {/* Back button */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/30 hover:bg-white transition-all"
          aria-label="Retour"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Map section */}
      <div className="h-[320px] sm:h-[400px] relative bg-muted">
        {route.polyline ? (
          <RouteMap polyline={route.polyline} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
            <MapPin className="w-16 h-16" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto -mt-8 relative z-10 px-4 sm:px-6 pb-12">
        {/* Hero card */}
        <Card className="rounded-3xl shadow-2xl shadow-black/5 border-0 overflow-hidden mb-6">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-tight">
                    {route.name}
                  </h1>
                  {difficulty && (
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full border ${difficulty.bg} ${difficulty.color}`}
                    >
                      {difficulty.label}
                    </span>
                  )}
                </div>
                {route.description && (
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{route.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary" className="text-xs font-semibold">
                    {route.activity_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Par <strong className="text-foreground">{route.creator_name || 'Anonyme'}</strong>
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  variant={isFavorited ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleFavoriteToggle}
                  className="rounded-xl"
                >
                  <Heart className={`w-4 h-4 mr-1.5 ${isFavorited ? 'fill-current' : ''}`} />
                  {isFavorited ? 'Favori' : 'Favori'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/app/explore/routes/${routeId}`);
                    toast.success('Lien copié');
                  }}
                >
                  <Share2 className="w-4 h-4 mr-1.5" />
                  Partager
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats grid - Magazine style */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Navigation, label: 'Distance', value: `${(route.distance / 1000).toFixed(2)}`, unit: 'km' },
            { icon: TrendingUp, label: 'Dénivelé +', value: `${route.elevation_gain || 0}`, unit: 'm' },
            {
              icon: Clock,
              label: 'Durée estimée',
              value: route.estimated_duration ? formatDuration(route.estimated_duration) : 'N/A',
              unit: '',
            },
            { icon: MapPin, label: 'Utilisations', value: `${route.usage_count}`, unit: 'fois' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card key={i} className="rounded-2xl border-border/50 hover:border-border transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {stat.label}
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-foreground">
                    {stat.value}
                    {stat.unit && <span className="text-sm font-medium text-muted-foreground ml-0.5">{stat.unit}</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Rating */}
        {route.avg_rating && route.avg_rating > 0 && (
          <Card className="rounded-2xl border-border/50 mb-6">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span className="text-xl font-black text-foreground">{route.avg_rating.toFixed(1)}</span>
              </div>
              <span className="text-sm text-muted-foreground">{route.rating_count} avis</span>
            </CardContent>
          </Card>
        )}

        {/* Tags */}
        {route.tags && route.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {route.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 text-xs font-semibold bg-muted/50 border border-border rounded-full text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Directions section */}
        {hasDirections && (
          <Card className="rounded-2xl border-border/50 mb-6 overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/20">
              <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
                Directions — {directions.length} étapes
              </h2>
            </div>
            <div className="divide-y divide-border/50">
              {directions.map((dir, idx) => (
                <div
                  key={dir.index || idx}
                  className="flex items-start gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors"
                >
                  <div
                    className={`
                    flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base
                    ${idx === 0 ? 'bg-primary/10 text-primary' : idx === directions.length - 1 ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}
                  `}
                  >
                    {getDirectionIcon(dir.type, dir.modifier)}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-sm font-semibold text-foreground leading-tight">{dir.instruction}</p>
                    {dir.street && <p className="text-xs text-muted-foreground mt-0.5">{dir.street}</p>}
                  </div>
                  <span className="text-xs font-bold text-primary whitespace-nowrap flex-shrink-0 pt-1.5">
                    {dir.distance_formatted}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Action */}
        <div className="flex gap-3">
          <Button
            size="lg"
            className="flex-1 rounded-2xl text-base font-bold gap-2 shadow-xl shadow-primary/25"
            onClick={handleUseRoute}
          >
            <Navigation className="w-5 h-5" />
            Utiliser ce parcours
          </Button>
        </div>
      </div>
    </div>
  );
}
