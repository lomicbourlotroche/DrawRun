'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { api, exploreApi } from '@/lib/api';
import { Button, Input, Badge } from '@/components/ui';
import { X, Undo2, Save, Trash2, Map, Navigation, Repeat, Redo2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { encodePolyline } from '@/lib/utils';
import ElevationProfile from './ElevationProfile';

interface Waypoint {
  lat: number;
  lng: number;
}

interface RoutePlannerProps {
  waypoints: Waypoint[];
  onWaypointsChange: (_waypoints: Waypoint[]) => void;
  onClose: () => void;
  isLoop?: boolean;
  onLoopChange?: (_loop: boolean) => void;
}

function haversineDistance(a: Waypoint, b: Waypoint): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export default function RoutePlanner({
  waypoints,
  onWaypointsChange,
  onClose,
  isLoop = false,
  onLoopChange,
}: RoutePlannerProps) {
  const [history, setHistory] = useState<Waypoint[][]>([waypoints]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [activityType, setActivityType] = useState('Run');
  const [difficulty, setDifficulty] = useState('medium');
  const [isSaving, setIsSaving] = useState(false);
  const [elevationData, setElevationData] = useState<{ distance: number; elevation: number }[]>([]);
  const [elevationStats, setElevationStats] = useState({ total_gain: 0, max_elevation: 0, min_elevation: 0 });
  const [elevationLoading, setElevationLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const pushHistory = useCallback((wps: Waypoint[]) => {
    setHistory((prev) => {
      const next = prev.slice(0, historyIdx + 1);
      next.push([...wps]);
      return next;
    });
    setHistoryIdx((prev) => prev + 1);
  }, [historyIdx]);

  const handleUndo = useCallback(() => {
    if (historyIdx > 0) {
      const newIdx = historyIdx - 1;
      setHistoryIdx(newIdx);
      onWaypointsChange([...history[newIdx]]);
    }
  }, [historyIdx, history, onWaypointsChange]);

  const handleRedo = useCallback(() => {
    if (historyIdx < history.length - 1) {
      const newIdx = historyIdx + 1;
      setHistoryIdx(newIdx);
      onWaypointsChange([...history[newIdx]]);
    }
  }, [historyIdx, history, onWaypointsChange]);

  const handleRemoveLast = useCallback(() => {
    if (waypoints.length === 0) return;
    const next = waypoints.slice(0, -1);
    onWaypointsChange(next);
    pushHistory(next);
  }, [waypoints, onWaypointsChange, pushHistory]);

  const handleClear = useCallback(() => {
    onWaypointsChange([]);
    pushHistory([]);
  }, [onWaypointsChange, pushHistory]);

  // Fetch real elevation data from API
  useEffect(() => {
    if (waypoints.length < 2) {
      setElevationData([]);
      setElevationStats({ total_gain: 0, max_elevation: 0, min_elevation: 0 });
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setElevationLoading(true);
      try {
        const res = await exploreApi.getElevationProfile(waypoints);
        if (res.success) {
          setElevationData(res.profile);
          setElevationStats(res.stats);
        }
      } catch {
        const totalDist = waypoints.slice(1).reduce((sum, wp, i) =>
          sum + haversineDistance(waypoints[i], wp), 0);
        const numPoints = Math.max(10, waypoints.length * 3);
        const fallback: { distance: number; elevation: number }[] = [];
        for (let i = 0; i <= numPoints; i++) {
          const frac = i / numPoints;
          fallback.push({
            distance: totalDist * frac,
            elevation: 50 + Math.sin(frac * Math.PI * 4) * 20 + Math.random() * 5,
          });
        }
        setElevationData(fallback);
      } finally {
        setElevationLoading(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [waypoints]); // eslint-disable-line react-hooks/exhaustive-deps

  const stats = useMemo(() => {
    let totalDist = 0;
    for (let i = 1; i < waypoints.length; i++) {
      totalDist += haversineDistance(waypoints[i - 1], waypoints[i]);
    }
    if (isLoop && waypoints.length >= 3) {
      totalDist += haversineDistance(waypoints[waypoints.length - 1], waypoints[0]);
    }
    return {
      distance: totalDist,
      elevationGain: elevationStats.total_gain,
    };
  }, [waypoints, isLoop, elevationStats.total_gain]);

  const handleToggleLoop = useCallback(() => {
    const next = !isLoop;
    onLoopChange?.(next);
    if (next && waypoints.length >= 2) {
      pushHistory(waypoints);
    }
  }, [isLoop, onLoopChange, waypoints, pushHistory]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Veuillez donner un nom au parcours');
      return;
    }
    if (waypoints.length < 2) {
      toast.error('Ajoutez au moins 2 points sur la carte');
      return;
    }
    if (isLoop && waypoints.length < 3) {
      toast.error('Ajoutez au moins 3 points pour une boucle');
      return;
    }

    setIsSaving(true);
    try {
      const rawPoints = waypoints.map((w) => [w.lat, w.lng] as [number, number]);
      const polyPoints = isLoop ? [...rawPoints, rawPoints[0]] : rawPoints;
      const polyline = encodePolyline(polyPoints);

      const result = await api.createRoute({
        name: name.trim(),
        description: description.trim(),
        polyline,
        distance: Math.round(stats.distance),
        elevation_gain: Math.round(elevationStats.total_gain),
        elevation_loss: 0,
        activity_type: activityType,
        difficulty,
        estimated_duration: Math.round(stats.distance / 1000 / 10 * 3600), // rough: 10 km/h
        is_public: true,
      });

      if (result.success) {
        toast.success('Parcours créé avec succès !');
        onClose();
      } else {
        toast.error(result.error || 'Erreur lors de la création');
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[600] bg-surface/95 backdrop-blur-md border-t border-border rounded-t-xl shadow-xl overflow-y-auto pb-[env(safe-area-inset-bottom,0px)]"
         style={{ maxHeight: 'min(60dvh, 50vh)' }}>
      <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-surface/95 z-10">
        <h3 className="font-bold flex items-center gap-2">
          <Map className="w-5 h-5 text-primary" />
          Créer un parcours
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={historyIdx <= 0}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-surface transition-colors disabled:opacity-30"
            title="Annuler"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIdx >= history.length - 1}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-surface transition-colors disabled:opacity-30"
            title="Refaire"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRemoveLast}
            disabled={waypoints.length === 0}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-surface transition-colors disabled:opacity-30"
            title="Supprimer dernier point"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleClear}
            disabled={waypoints.length === 0}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-surface transition-colors disabled:opacity-30"
            title="Tout effacer"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-surface transition-colors ml-2"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats bar */}
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Navigation className="w-4 h-4" />
            <span className="font-semibold text-foreground">
              {(stats.distance / 1000).toFixed(2)} km
            </span>
          </div>
          {isLoop && (
            <Badge className="bg-primary-50 text-primary-700 border-primary-300">
              <Repeat className="w-3 h-3 mr-1" />
              Boucle
            </Badge>
          )}
          <Badge variant="secondary">
            {waypoints.length} point{waypoints.length > 1 ? 's' : ''}
          </Badge>
          {waypoints.length >= 2 && (
            <Badge variant="secondary">
              ~{Math.round(stats.distance / 1000 / 10 * 60)} min
            </Badge>
          )}
          <span className="text-xs text-muted-foreground ml-auto hidden sm:inline">
            Cliquez sur la carte pour ajouter des points
          </span>
        </div>

        {/* Loop toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleLoop}
            disabled={waypoints.length < 2}
            className={`flex items-center gap-2 px-3 min-h-[44px] rounded-lg text-sm font-medium transition-all border ${
              isLoop
                ? 'bg-primary-50 text-primary-700 border-primary-300 shadow-sm'
                : 'bg-background text-muted-foreground border-border hover:border-primary-300 hover:text-primary'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            <Repeat className={`w-4 h-4 ${isLoop ? 'text-primary' : ''}`} />
            {isLoop ? 'Boucle activée' : 'Générer une boucle'}
          </button>
          {isLoop && waypoints.length >= 3 && (
            <span className="text-xs text-muted-foreground">
              +{haversineDistance(waypoints[waypoints.length - 1], waypoints[0]).toFixed(0)}m de retour
            </span>
          )}
        </div>

        {/* Elevation profile */}
        <div className="bg-muted/20 rounded-lg p-3 min-h-[60px]">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground font-medium">Profil d&apos;élévation</p>
            {elevationLoading && (
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
            )}
            {!elevationLoading && elevationStats.total_gain > 0 && (
              <span className="text-xs font-semibold text-success">
                D+ {elevationStats.total_gain} m
              </span>
            )}
          </div>
          {elevationData.length > 0 ? (
            <ElevationProfile data={elevationData} height={100} />
          ) : (
            <div className="flex items-center justify-center text-xs text-muted-foreground" style={{ height: 100 }}>
              {waypoints.length < 2 ? 'Ajoutez au moins 2 points' : 'Chargement...'}
            </div>
          )}
        </div>

        {/* Save form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Input
              placeholder="Nom du parcours *"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              placeholder="Description (optionnelle)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
          >
            <option value="Run">Course à pied</option>
            <option value="Bike">Vélo</option>
            <option value="Swim">Natation</option>
            <option value="Hike">Randonnée</option>
          </select>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
          >
            <option value="easy">Facile</option>
            <option value="medium">Modéré</option>
            <option value="hard">Difficile</option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || waypoints.length < 2 || !name.trim()}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </div>
  );
}
