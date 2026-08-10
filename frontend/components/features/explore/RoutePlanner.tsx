'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Navigation, MapPin, Plus, X, Trash2, Loader2, Settings, ArrowRight, Check, ChevronLeft } from '@/components/ui/icons';
import DirectionsPanel from './DirectionsPanel';
import type { Direction, GeneratedRouteResponse } from '@/lib/api';

interface Waypoint {
  lat: number;
  lng: number;
}

interface RoutePlannerProps {
  waypoints: Waypoint[];
  onWaypointsChange: (waypoints: Waypoint[]) => void;
  onClose: () => void;
  isLoop: boolean;
  onLoopChange: (isLoop: boolean) => void;
  onRouteCreated?: () => void;
}

const ACTIVITY_TYPES = ['Run', 'Bike', 'Walk', 'Hike', 'Trail Run'];
const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Facile' },
  { value: 'medium', label: 'Modéré' },
  { value: 'hard', label: 'Difficile' },
];

export default function RoutePlanner({
  waypoints,
  onWaypointsChange,
  onClose,
  isLoop,
  onLoopChange,
  onRouteCreated,
}: RoutePlannerProps) {
  const [step, setStep] = useState<'plan' | 'generating' | 'result'>('plan');
  const [routeName, setRouteName] = useState('');
  const [activityType, setActivityType] = useState('Run');
  const [difficulty, setDifficulty] = useState('medium');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<GeneratedRouteResponse | null>(null);

  const removeWaypoint = useCallback((index: number) => {
    if (waypoints.length <= 2) {
      toast.error('Il faut au moins 2 points');
      return;
    }
    onWaypointsChange(waypoints.filter((_, i) => i !== index));
  }, [waypoints, onWaypointsChange]);

  const clearWaypoints = useCallback(() => {
    onWaypointsChange([]);
  }, [onWaypointsChange]);

  const handleGenerate = useCallback(async () => {
    if (waypoints.length < 2) {
      toast.error('Ajoutez au moins 2 points sur la carte');
      return;
    }
    if (!routeName.trim()) {
      toast.error('Donnez un nom au parcours');
      return;
    }

    setStep('generating');
    try {
      const response = await api.generateRoute({
        waypoints,
        activity_type: activityType,
        name: routeName.trim(),
        description: description.trim(),
        difficulty,
        is_public: true,
      });

      if (response.success) {
        setResult(response);
        setStep('result');
        toast.success(`Parcours généré ! ${response.directions_count} directions`);
        onRouteCreated?.();
      } else {
        toast.error(response.error || 'Erreur lors de la génération');
        setStep('plan');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur de connexion';
      toast.error(message);
      setStep('plan');
    }
  }, [waypoints, routeName, activityType, description, difficulty, onRouteCreated]);

  const resetPlanner = useCallback(() => {
    setStep('plan');
    setResult(null);
    setRouteName('');
    setDescription('');
  }, []);

  // Step 3: Show directions
  if (step === 'result' && result) {
    return (
      <div className="fixed inset-0 z-[600] bg-surface flex flex-col">
        <DirectionsPanel
          directions={result.directions}
          totalDistance={result.distance_formatted}
          totalDuration={result.duration_formatted}
          elevationGain={result.elevation_gain}
          routeName={routeName}
          onBack={resetPlanner}
          onClose={onClose}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[600] sm:left-auto sm:right-4 sm:w-[420px] sm:bottom-4 sm:rounded-2xl sm:max-h-[80vh]">
      <div className="bg-surface border-t sm:border border-border sm:shadow-2xl sm:rounded-2xl flex flex-col max-h-[70vh] sm:max-h-[75vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {step === 'generating' ? 'Génération...' : 'Nouveau parcours'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {waypoints.length} point{waypoints.length > 1 ? 's' : ''} placé{waypoints.length > 1 ? 's' : ''}
                {isLoop ? ' — Boucle' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {waypoints.length > 0 && (
              <button
                onClick={clearWaypoints}
                className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-danger hover:bg-danger/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Effacer
              </button>
            )}
          </div>
        </div>

        {step === 'generating' ? (
          /* Loading state */
          <div className="flex flex-col items-center justify-center py-16 px-8">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-sm font-medium text-foreground">Génération du parcours...</p>
            <p className="text-xs text-muted-foreground mt-1">Calcul de l&apos;itinéraire via OSRM</p>
          </div>
        ) : (
          <>
            {/* Waypoints list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Points du parcours
              </p>
              {waypoints.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Cliquez sur la carte pour ajouter des points</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">Minimum 2 points requis</p>
                </div>
              ) : (
                waypoints.map((wp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {wp.lat.toFixed(5)}, {wp.lng.toFixed(5)}
                      </p>
                      {idx === 0 && (
                        <span className="text-[10px] text-success font-semibold">Départ</span>
                      )}
                      {idx === waypoints.length - 1 && idx > 0 && (
                        <span className="text-[10px] text-danger font-semibold">Arrivée</span>
                      )}
                    </div>
                    <button
                      onClick={() => removeWaypoint(idx)}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg hover:bg-danger/10 text-muted-foreground hover:text-danger flex items-center justify-center transition-all"
                      aria-label={`Retirer le point ${idx + 1}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Route settings */}
            <div className="px-4 pb-2 space-y-3 border-t border-border pt-3">
              <div>
                <input
                  type="text"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  placeholder="Nom du parcours *"
                  className="w-full px-3 py-2.5 text-sm bg-muted/30 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description (optionnelle)"
                  className="w-full px-3 py-2.5 text-sm bg-muted/30 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Activité
                  </label>
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-muted/30 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none"
                  >
                    {ACTIVITY_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Difficulté
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-muted/30 border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none"
                  >
                    {DIFFICULTY_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => onLoopChange(!isLoop)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${isLoop ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${isLoop ? 'left-5.5' : 'left-0.5'}`} />
                  </div>
                  <span className="text-xs font-medium text-foreground">Parcours en boucle</span>
                </label>
              </div>
            </div>

            {/* Generate button */}
            <div className="p-4 pt-2">
              <button
                onClick={handleGenerate}
                disabled={waypoints.length < 2 || !routeName.trim()}
                className="w-full py-3 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <Navigation className="w-4 h-4" />
                Générer le parcours
              </button>
              <p className="text-[10px] text-center text-muted-foreground mt-2">
                Itinéraire calculé via OSRM — données OpenStreetMap
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
