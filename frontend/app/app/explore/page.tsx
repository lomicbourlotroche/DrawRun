'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle, Button } from '@/components/ui';
import { Map, Route, Trophy, Compass, AlertCircle } from 'lucide-react';
import { SegmentList, useNearbySegments } from '@/components/features/explore/Segments';
import { RouteList, useRoutes } from '@/components/features/explore/Routes';
import { toast } from 'sonner';

export default function ExplorePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('segments');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const { segments, isLoading: segmentsLoading, fetchNearby: fetchNearbySegments, fetchPublic: fetchPublicSegments } = useNearbySegments();
  const { routes, isLoading: routesLoading, fetchPublicRoutes } = useRoutes();

  useEffect(() => {
    fetchPublicSegments();
    fetchPublicRoutes();
  }, [fetchPublicSegments, fetchPublicRoutes]);

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        fetchNearbySegments(latitude, longitude);
        toast.success('Position détectée — segments à proximité chargés');
      },
      () => {
        toast.error('Impossible d\'obtenir votre position');
      }
    );
  }, [fetchNearbySegments]);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <Compass className="w-8 h-8 text-primary" />
          Explorer
        </h1>
        <p className="text-muted-foreground">
          Découvrez les segments et parcours près de chez vous
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="segments" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Segments
          </TabsTrigger>
          <TabsTrigger value="routes" className="flex items-center gap-2">
            <Route className="w-4 h-4" />
            Parcours
          </TabsTrigger>
        </TabsList>

        <TabsContent value="segments" className="space-y-4">
          <GlassCard>
            <GlassCardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <GlassCardTitle className="text-lg flex items-center gap-2">
                  <Map className="w-5 h-5" />
                  Segments à proximité
                  {userLocation && (
                    <span className="text-xs font-normal text-muted ml-1">
                      ({userLocation.lat.toFixed(3)}, {userLocation.lng.toFixed(3)})
                    </span>
                  )}
                </GlassCardTitle>
                <Button onClick={handleLocateMe} size="sm">
                  Me localiser
                </Button>
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              <SegmentList 
                segments={segments} 
                isLoading={segmentsLoading}
                onSegmentClick={(segment) => {
                  router.push(`/app/explore/segments/${segment.id}`);
                }}
              />
            </GlassCardContent>
          </GlassCard>
        </TabsContent>
        
        <TabsContent value="routes" className="space-y-4">
          <GlassCard>
            <GlassCardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <GlassCardTitle className="text-lg flex items-center gap-2">
                  <Route className="w-5 h-5" />
                  Parcours populaires
                </GlassCardTitle>
              </div>
            </GlassCardHeader>
            <GlassCardContent>
              <RouteList 
                routes={routes} 
                isLoading={routesLoading}
                onRouteClick={(route) => {
                  router.push(`/app/explore/routes/${route.id}`);
                }}
              />
            </GlassCardContent>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
