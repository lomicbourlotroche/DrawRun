'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { PowerAnalysis, FTPCalculator } from '@/components/features/performance/PowerAnalysis';
import { api } from '@/lib/api';
import { Zap, Gauge, Activity, Bike, ChevronDown } from '@/components/ui/icons';

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

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
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
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Zap className="w-6 h-6 text-warning" />
          Analyse de Puissance
        </h1>
        <p className="text-muted">
          Analysez vos donn\u00e9es de puissance et calculez votre FTP pour optimiser vos entra\u00eenements
        </p>
      </div>

      <Tabs defaultValue="analysis">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Analyse d&apos;activit\u00e9
          </TabsTrigger>
          <TabsTrigger value="ftp" className="flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            Calculateur FTP
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis">
          <div className="relative mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setShowActivityList(!showActivityList)}
                className="flex-1 flex items-center justify-between px-4 py-3 bg-surface border border-border rounded-xl hover:border-primary/50 transition-colors"
              >
                {selected ? (
                  <div className="flex items-center gap-3">
                    <Bike className="w-5 h-5 text-primary" />
                    <div className="text-left">
                      <p className="font-medium text-sm text-foreground">{selected.name}</p>
                      <p className="text-xs text-muted">
                        {new Date(selected.start_date_local).toLocaleDateString('fr-FR')} {'\u2014'} {selected.average_watts}W moy.
                      </p>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted">S\u00e9lectionner une activit\u00e9 avec power meter...</span>
                )}
                <ChevronDown className="w-4 h-4 text-muted" />
              </button>
              <Button onClick={loadActivities} disabled={isLoading} variant="outline">
                {isLoading ? <Spinner /> : 'Actualiser'}
              </Button>
            </div>

            {showActivityList && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center text-muted">
                    <Spinner />
                    <p className="text-sm mt-2">Chargement...</p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="p-4 text-center text-muted text-sm">
                    Aucune activit\u00e9 avec power meter trouv\u00e9e
                  </div>
                ) : (
                  activities.map((activity) => (
                    <button
                      key={activity.id}
                      onClick={() => loadActivityStreams(activity.id)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-surface transition-colors text-left border-b border-border last:border-b-0"
                    >
                      <Bike className="w-5 h-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{activity.name}</p>
                        <p className="text-xs text-muted">
                          {new Date(activity.start_date_local).toLocaleDateString('fr-FR')} {'\u2014'} {activity.average_watts}W moy.
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

          {selected && wattsData.length > 0 ? (
            <PowerAnalysis activityId={selected.id} wattsData={wattsData} duration={selected.moving_time} />
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted">
                <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium text-foreground">S\u00e9lectionnez une activit\u00e9 pour voir l&apos;analyse</p>
                <p className="text-sm mt-2">Les activit\u00e9s avec capteur de puissance (Garmin, Wahoo, etc.) affichent ici les donn\u00e9es de puissance d\u00e9taill\u00e9es</p>
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
