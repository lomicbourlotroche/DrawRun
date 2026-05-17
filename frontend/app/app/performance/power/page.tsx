/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { PowerAnalysis, FTPCalculator } from '@/components/features/performance/PowerAnalysis';
import { api } from '@/lib/api';
import type { ActivityStreams } from '@/types';
import { Zap, Gauge, Activity, Loader2, Bike, ChevronDown } from 'lucide-react';

interface ActivityWithPower {
  id: number;
  name: string;
  type: string;
  start_date_local: string;
  distance: number;
  moving_time: number;
  average_watts?: number;
  max_watts?: number;
  has_power_meter: boolean;
}

export default function PowerAnalysisPage() {
  const [activities, setActivities] = useState<ActivityWithPower[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null);
  const [wattsData, setWattsData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showActivityList, setShowActivityList] = useState(false);

  const loadActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getActivities();
      const allActivities = Array.isArray(data) ? data : (data?.data || []);
      const withPower = allActivities.filter(
        (a: ActivityWithPower) => a.has_power_meter || a.average_watts
      );
      setActivities(withPower);
    } catch {
      /* silencieux */
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const loadActivityStreams = async (activityId: number) => {
    setIsLoading(true);
    try {
      const streams = await api.getActivityStreams(activityId);
      if (streams?.watts) {
        const wattsArr = Array.isArray(streams.watts) ? streams.watts : (streams.watts.data || []);
        if (wattsArr.length > 0) {
          setWattsData(wattsArr);
          setSelectedActivity(activityId);
        }
      }
    } catch {
      /* silencieux */
    } finally {
      setIsLoading(false);
    }
    setShowActivityList(false);
  };

  const selected = activities.find(a => a.id === selectedActivity);

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <Zap className="w-8 h-8 text-warning" />
          Analyse de Puissance
        </h1>
        <p className="text-muted-foreground">
          Analysez vos données de puissance et calculez votre FTP pour optimiser vos entraînements
        </p>
      </div>

      <Tabs defaultValue="analysis">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Analyse d'activité
          </TabsTrigger>
          <TabsTrigger value="ftp" className="flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            Calculateur FTP
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis">
          {/* Activity Selector */}
          <div className="relative mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setShowActivityList(!showActivityList)}
                className="flex-1 flex items-center justify-between px-4 py-3 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
              >
                {selected ? (
                  <div className="flex items-center gap-3">
                    <Bike className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <p className="font-medium text-sm">{selected.name}</p>
                      <p className="text-xs text-muted">
                        {new Date(selected.start_date_local).toLocaleDateString('fr-FR')} — {selected.average_watts}W moy.
                      </p>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Sélectionner une activité avec power meter...</span>
                )}
                <ChevronDown className="w-4 h-4 text-muted" />
              </button>
              <Button onClick={loadActivities} disabled={isLoading} variant="outline">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Actualiser'}
              </Button>
            </div>

            {/* Dropdown */}
            {showActivityList && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Chargement...
                  </div>
                ) : activities.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    Aucune activité avec power meter trouvée
                  </div>
                ) : (
                  activities.map((activity) => (
                    <button
                      key={activity.id}
                      onClick={() => loadActivityStreams(activity.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left border-b border-border last:border-b-0"
                    >
                      <Bike className="w-5 h-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{activity.name}</p>
                        <p className="text-xs text-muted">
                          {new Date(activity.start_date_local).toLocaleDateString('fr-FR')} — {activity.average_watts}W moy.
                        </p>
                      </div>
                      {activity.average_watts && (
                        <Badge variant="default" className="bg-primary/10 text-primary">{activity.average_watts}W</Badge>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Analysis */}
          {selected && wattsData.length > 0 ? (
            <PowerAnalysis activityId={selected.id} wattsData={wattsData} duration={selected.moving_time} />
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Sélectionnez une activité pour voir l'analyse</p>
                <p className="text-sm mt-2">Les activités avec capteur de puissance (Garmin, Wahoo, etc.) affichent ici les données de puissance détaillées</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ftp">
          <FTPCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
