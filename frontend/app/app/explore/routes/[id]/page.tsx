'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { Navigation, Heart, ChevronLeft, Share2, Star } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { toast } from 'sonner';

interface RouteDetail {
  id: number;
  name: string;
  description?: string;
  distance: number;
  elevation_gain: number;
  elevation_loss: number;
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
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-100 text-green-700 border-green-300',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  hard: 'bg-red-100 text-red-700 border-red-300',
};

const difficultyLabels: Record<string, string> = {
  easy: 'Facile',
  medium: 'Modéré',
  hard: 'Difficile',
};

export default function RouteDetailPage() {
  const params = useParams();
  const routeId = parseInt(params.id as string);
  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const loadRoute = async () => {
      try {
        const response = await api.getRoute(routeId);
        if (response.success) {
          setRoute(response.route);
          setIsFavorited(response.route.is_favorited || false);
        }
      } catch {
        /* silencieux — route non chargée */
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
      } else {
        await api.addRouteToFavorites(routeId);
        setIsFavorited(true);
      }
    } catch {
      /* silencieux — favorite toggle */
    }
  };

  const handleUseRoute = async () => {
    try {
      await api.useRoute(routeId);
      alert('Parcours ajouté à votre historique !');
    } catch {
      /* silencieux — use route */
    }
  };

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

  if (!route) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Parcours non trouvé</p>
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
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{route.name}</h1>
              {route.difficulty && (
                <Badge 
                  className={difficultyColors[route.difficulty] || 'bg-gray-100'}
                >
                  {difficultyLabels[route.difficulty] || route.difficulty}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">{route.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">{route.activity_type}</Badge>
              <span className="text-sm text-muted-foreground">
                Par {route.creator_name || 'Anonymous'}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={isFavorited ? 'default' : 'outline'} 
              size="sm"
              onClick={handleFavoriteToggle}
            >
              <Heart className={`w-4 h-4 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
              {isFavorited ? 'Favori' : 'Ajouter aux favoris'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              const url = `${window.location.origin}/app/explore/routes/${routeId}`;
              navigator.clipboard.writeText(url);
              toast.success('Lien copié');
            }}>
              <Share2 className="w-4 h-4 mr-2" />
              Partager
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Distance</div>
            <div className="text-2xl font-bold">{(route.distance / 1000).toFixed(2)} km</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Dénivelé</div>
            <div className="text-2xl font-bold">{route.elevation_gain}m</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Durée estimée</div>
            <div className="text-2xl font-bold">
              {route.estimated_duration ? formatDuration(route.estimated_duration) : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Utilisations</div>
            <div className="text-2xl font-bold">{route.usage_count}</div>
          </CardContent>
        </Card>
      </div>

      {/* Rating */}
      {route.avg_rating && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="w-6 h-6 text-warning fill-yellow-500" />
                <span className="text-2xl font-bold">{route.avg_rating.toFixed(1)}</span>
              </div>
              <div className="text-muted-foreground">
                {route.rating_count} avis
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {route.tags && route.tags.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {route.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button size="lg" className="flex-1" onClick={handleUseRoute}>
          <Navigation className="w-5 h-5 mr-2" />
          Utiliser ce parcours
        </Button>
      </div>
    </div>
  );
}
