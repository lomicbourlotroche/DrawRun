/* eslint-disable unused-imports/no-unused-vars */
'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { Map, Route, Trophy, Compass } from 'lucide-react';
import { SegmentList, useNearbySegments } from '@/components/features/explore/Segments';
import { RouteList, useRoutes } from '@/components/features/explore/Routes';

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState('segments');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const { segments, isLoading: segmentsLoading, fetchNearby: fetchNearbySegments, fetchPublic: fetchPublicSegments } = useNearbySegments();
  const { routes, isLoading: routesLoading, fetchPublicRoutes } = useRoutes();

  useEffect(() => {
    // Load public data initially
    fetchPublicSegments();
    fetchPublicRoutes();
  }, [fetchPublicSegments, fetchPublicRoutes]);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          fetchNearbySegments(latitude, longitude);
        },
        (error) => {
          /* géolocalisation refusée ou indisponible */
          alert('Impossible d\'obtenir votre position');
        }
      );
    } else {
      alert('La géolocalisation n\'est pas supportée par votre navigateur');
    }
  };

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
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Map className="w-5 h-5" />
                  Segments à proximité
                </CardTitle>
                <Button onClick={handleLocateMe} size="sm">
                  Me localiser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <SegmentList 
                segments={segments} 
                isLoading={segmentsLoading}
                onSegmentClick={(segment) => {
                  // Navigate to segment detail
                  window.location.href = `/app/explore/segments/${segment.id}`;
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Route className="w-5 h-5" />
                  Parcours populaires
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <RouteList 
                routes={routes} 
                isLoading={routesLoading}
                onRouteClick={(route) => {
                  // Navigate to route detail
                  window.location.href = `/app/explore/routes/${route.id}`;
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
