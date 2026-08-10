'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { Map, Heart, Clock, TrendingUp, Star, ChevronRight, Navigation } from '@/components/ui/icons';
import { formatDuration } from '@/lib/utils';

interface Route {
  id: number;
  name: string;
  description?: string;
  distance: number;
  elevation_gain: number;
  elevation_loss?: number;
  activity_type: string;
  estimated_duration?: number;
  difficulty?: string;
  tags?: string[];
  avg_rating?: number;
  rating_count?: number;
  usage_count?: number;
  creator_name?: string;
  is_favorited?: boolean;
  polyline: string;
}

interface RouteListProps {
  routes: Route[];
  onRouteClick?: (_route: Route) => void;
  isLoading?: boolean;
  showFavoriteButton?: boolean;
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-success-50 text-success-700',
  medium: 'bg-warning-50 text-warning-700',
  hard: 'bg-danger-50 text-danger-700',
};

const difficultyLabels: Record<string, string> = {
  easy: 'Facile',
  medium: 'Modéré',
  hard: 'Difficile',
};

export function RouteList({ routes, onRouteClick, isLoading, showFavoriteButton = true }: RouteListProps) {
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  const handleFavoriteToggle = async (e: React.MouseEvent, route: Route) => {
    e.stopPropagation();
    try {
      if (route.is_favorited || favorites.has(route.id)) {
        await api.removeRouteFromFavorites(route.id);
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(route.id);
          return next;
        });
      } else {
        await api.addRouteToFavorites(route.id);
        setFavorites(prev => new Set(prev).add(route.id));
      }
    } catch {
      /* silencieux — favorite toggle */
    }
  };

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

  if (routes.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Map className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucun parcours trouvé</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {routes.map((route) => (
        <Card
          key={route.id}
          className="cursor-pointer hover:border-primary/30 hover:shadow-md transition-all duration-200 group"
          onClick={() => onRouteClick?.(route)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success/10 to-success/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                <Navigation className="w-6 h-6 text-success" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate group-hover:text-primary transition-colors duration-200">{route.name}</h3>
                  <Badge variant="secondary" size="sm" className="bg-primary/10 text-primary">
                    {route.activity_type}
                  </Badge>
                  {route.difficulty && (
                    <Badge
                      className={`text-xs ${difficultyColors[route.difficulty] || 'bg-muted/20'}`}
                      size="sm"
                    >
                      {difficultyLabels[route.difficulty] || route.difficulty}
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                  {route.description || 'Aucune description'}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Map className="w-3.5 h-3.5" />
                    {(route.distance / 1000).toFixed(2)} km
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {route.elevation_gain}m D+
                  </span>
                  {route.estimated_duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(route.estimated_duration)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-2">
                  {route.avg_rating && (
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-3.5 h-3.5 text-warning fill-yellow-500" />
                      <span>{route.avg_rating.toFixed(1)} ({route.rating_count})</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {route.usage_count} utilisations
                  </div>
                </div>

                {route.tags && route.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {route.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-2">
                {showFavoriteButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-w-[44px] min-h-[44px] p-0"
                    onClick={(e) => handleFavoriteToggle(e, route)}
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        route.is_favorited || favorites.has(route.id)
                          ? 'fill-red-500 text-danger'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </Button>
                )}
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function useRoutes() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPublicRoutes = useCallback(async (type?: string, difficulty?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getPublicRoutes(type, difficulty);
      if (response.success) {
        setRoutes(response.routes as Route[]);
      }
    } catch (err) {
      setError('Failed to fetch routes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMyRoutes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getMyRoutes();
      if (response.success) {
        setRoutes(response.routes as Route[]);
      }
    } catch (err) {
      setError('Failed to fetch routes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchFavoriteRoutes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getFavoriteRoutes();
      if (response.success) {
        setRoutes(response.routes as Route[]);
      }
    } catch (err) {
      setError('Failed to fetch favorites');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { routes, isLoading, error, fetchPublicRoutes, fetchMyRoutes, fetchFavoriteRoutes };
}
