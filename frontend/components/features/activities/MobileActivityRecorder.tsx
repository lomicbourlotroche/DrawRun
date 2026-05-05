'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { SportPicker } from './SportPicker';
import type { SportType } from '@/types/sports';
import { SPORTS } from '@/types/sports';
import { 
  Play, 
  Pause, 
  Square, 
  MapPin, 
  Activity, 
  Navigation, 
  Timer,
  Mountain,
  Zap,
  Smartphone,
  Heart,
  ChevronDown
} from 'lucide-react';

interface GPSData {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

interface MotionData {
  acceleration: { x: number; y: number; z: number } | null;
  accelerationIncludingGravity: { x: number; y: number; z: number } | null;
  rotationRate: { alpha: number; beta: number; gamma: number } | null;
  timestamp: number;
}

interface BarometerData {
  pressure: number;
  relativeAltitude: number;
  timestamp: number;
}

interface RecordedPoint {
  gps: GPSData;
  motion: MotionData | null;
  barometer: BarometerData | null;
  timestamp: number;
}

interface RecordingStats {
  distance: number;
  duration: number;
  avgSpeed: number;
  maxSpeed: number;
  elevationGain: number;
  elevationLoss: number;
  cadence: number | null;
  verticalOscillation: number | null;
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'finished';

interface MobileActivityRecorderProps {
  onSave?: () => void;
}

export function MobileActivityRecorder({ onSave }: MobileActivityRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [activityType, setActivityType] = useState<SportType>('run');
  const [showSportPicker, setShowSportPicker] = useState(false);
  const [points, setPoints] = useState<RecordedPoint[]>([]);
  const [stats, setStats] = useState<RecordingStats>({
    distance: 0,
    duration: 0,
    avgSpeed: 0,
    maxSpeed: 0,
    elevationGain: 0,
    elevationLoss: 0,
    cadence: null,
    verticalOscillation: null,
  });
  const [currentGPS, setCurrentGPS] = useState<GPSData | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('checking');
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  
  const watchIdRef = useRef<number | null>(null);
  const motionHandlerRef = useRef<((event: DeviceMotionEvent) => void) | null>(null);
  const barometerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const lastPointRef = useRef<GPSData | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Check device capabilities on mount
  useEffect(() => {
    checkCapabilities();
    getBatteryLevel();
  }, []);

  const checkCapabilities = async () => {
    const capabilities = {
      gps: 'geolocation' in navigator,
      motion: 'DeviceMotionEvent' in window,
      barometer: 'Barometer' in window || 'AbsoluteOrientationSensor' in window,
      bluetooth: 'bluetooth' in navigator,
    };
    
    if (!capabilities.gps) {
      toast.error('GPS non disponible sur cet appareil');
      setPermissionStatus('unsupported');
    }
  };

  const getBatteryLevel = async () => {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      } catch (e) {
        // Battery API not available on this device — silently ignore
      }
    }
  };

  // Calculate distance between two GPS points (Haversine formula)
  const calculateDistance = (p1: GPSData, p2: GPSData): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = p1.latitude * Math.PI / 180;
    const φ2 = p2.latitude * Math.PI / 180;
    const Δφ = (p2.latitude - p1.latitude) * Math.PI / 180;
    const Δλ = (p2.longitude - p1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Process motion data to estimate cadence and form
  const processMotionData = (motionData: MotionData[]): { cadence: number | null; verticalOscillation: number | null } => {
    if (motionData.length < 10) return { cadence: null, verticalOscillation: null };

    // Detect steps from acceleration peaks (Z-axis)
    const zAccelerations = motionData.map(m => m.accelerationIncludingGravity?.z || 0);
    let stepCount = 0;
    let lastPeak = 0;
    const threshold = 11; // m/s² threshold for step detection
    
    for (let i = 1; i < zAccelerations.length - 1; i++) {
      if (zAccelerations[i] > threshold && zAccelerations[i] > zAccelerations[i-1] && zAccelerations[i] > zAccelerations[i+1]) {
        if (i - lastPeak > 15) { // Minimum 15 samples between steps (anti-bounce)
          stepCount++;
          lastPeak = i;
        }
      }
    }

    // Calculate cadence (steps per minute)
    const timeWindow = (motionData[motionData.length - 1].timestamp - motionData[0].timestamp) / 1000 / 60; // in minutes
    const cadence = timeWindow > 0 ? Math.round(stepCount / timeWindow) : null;

    // Calculate vertical oscillation (variance in Z acceleration)
    const avgZ = zAccelerations.reduce((a, b) => a + b, 0) / zAccelerations.length;
    const variance = zAccelerations.reduce((sum, val) => sum + Math.pow(val - avgZ, 2), 0) / zAccelerations.length;
    const verticalOscillation = Math.sqrt(variance) * 10; // Convert to cm approximation

    return { cadence, verticalOscillation };
  };

  // Start recording
  const startRecording = async () => {
    try {
      // Request GPS permission
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      setPermissionStatus(permission.state);
      
      if (permission.state === 'denied') {
        toast.error('Permission GPS refusée. Activez la localisation.');
        return;
      }

      // Start GPS tracking
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const gpsData: GPSData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: position.timestamp,
          };
          setCurrentGPS(gpsData);
          
          if (state === 'recording') {
            addPoint(gpsData);
          }
        },
        (error) => {
          toast.error(`Erreur GPS: ${error.message}`);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 5000,
        }
      );

      // Start motion tracking
      if (window.DeviceMotionEvent) {
        motionHandlerRef.current = (event: DeviceMotionEvent) => {
          if (state === 'recording') {
            const motionData: MotionData = {
              acceleration: event.acceleration ? {
                x: event.acceleration.x || 0,
                y: event.acceleration.y || 0,
                z: event.acceleration.z || 0,
              } : null,
              accelerationIncludingGravity: event.accelerationIncludingGravity ? {
                x: event.accelerationIncludingGravity.x || 0,
                y: event.accelerationIncludingGravity.y || 0,
                z: event.accelerationIncludingGravity.z || 0,
              } : null,
              rotationRate: event.rotationRate ? {
                alpha: event.rotationRate.alpha || 0,
                beta: event.rotationRate.beta || 0,
                gamma: event.rotationRate.gamma || 0,
              } : null,
              timestamp: Date.now(),
            };
            // Store motion data with last GPS point
            if (points.length > 0) {
              points[points.length - 1].motion = motionData;
            }
          }
        };
        window.addEventListener('devicemotion', motionHandlerRef.current);
      }

      // Try to start barometer
      if ('Barometer' in window) {
        try {
          barometerRef.current = new (window as any).Barometer({ frequency: 1 });
          barometerRef.current.addEventListener('reading', () => {
            if (state === 'recording' && points.length > 0) {
              points[points.length - 1].barometer = {
                pressure: barometerRef.current.pressure,
                relativeAltitude: 0, // Calculate from pressure change
                timestamp: Date.now(),
              };
            }
          });
          barometerRef.current.start();
        } catch (e) {
          // Barometer not available on this device — silently ignore
        }
      }

      startTimeRef.current = Date.now();
      setState('recording');
      toast.success('Enregistrement démarré !');
      
      // Start stats update loop
      updateStatsLoop();

    } catch {
      toast.error('Erreur lors du démarrage');
    }
  };

  const addPoint = (gpsData: GPSData) => {
    const newPoint: RecordedPoint = {
      gps: gpsData,
      motion: null,
      barometer: null,
      timestamp: Date.now(),
    };
    
    setPoints(prev => {
      const newPoints = [...prev, newPoint];
      
      // Calculate distance
      if (lastPointRef.current) {
        const distance = calculateDistance(lastPointRef.current, gpsData);
        setStats(s => ({
          ...s,
          distance: s.distance + distance,
        }));
        
        // Calculate elevation change
        if (gpsData.altitude !== null && lastPointRef.current.altitude !== null) {
          const elevationChange = gpsData.altitude - lastPointRef.current.altitude;
          if (elevationChange > 0) {
            setStats(s => ({ ...s, elevationGain: s.elevationGain + elevationChange }));
          } else {
            setStats(s => ({ ...s, elevationLoss: s.elevationLoss + Math.abs(elevationChange) }));
          }
        }
      }
      
      lastPointRef.current = gpsData;
      return newPoints;
    });
  };

  const updateStatsLoop = () => {
    if (state !== 'recording') return;
    
    const duration = (Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000;
    setStats(s => {
      const avgSpeed = duration > 0 ? (s.distance / duration) * 3.6 : 0; // km/h
      const currentSpeed = currentGPS?.speed ? currentGPS.speed * 3.6 : 0; // km/h
      
      return {
        ...s,
        duration,
        avgSpeed,
        maxSpeed: currentSpeed > s.maxSpeed ? currentSpeed : s.maxSpeed,
      };
    });
    
    // Process motion data for cadence
    const recentMotionData = points.slice(-50).map(p => p.motion).filter(Boolean) as MotionData[];
    const { cadence, verticalOscillation } = processMotionData(recentMotionData);
    
    if (cadence !== null) setStats(s => ({ ...s, cadence }));
    if (verticalOscillation !== null) setStats(s => ({ ...s, verticalOscillation }));
    
    animationFrameRef.current = requestAnimationFrame(updateStatsLoop);
  };

  const pauseRecording = () => {
    if (state === 'recording') {
      setState('paused');
      pausedDurationRef.current += Date.now() - startTimeRef.current;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      toast.info('Enregistrement en pause');
    }
  };

  const resumeRecording = () => {
    if (state === 'paused') {
      setState('recording');
      startTimeRef.current = Date.now() - pausedDurationRef.current;
      updateStatsLoop();
      toast.info('Enregistrement repris');
    }
  };

  const stopRecording = async () => {
    setState('finished');
    
    // Stop all tracking
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    if (motionHandlerRef.current) {
      window.removeEventListener('devicemotion', motionHandlerRef.current);
    }
    if (barometerRef.current) {
      barometerRef.current.stop();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    toast.success('Enregistrement terminé !');
  };

  const saveActivity = async () => {
    try {
      // Generate GPX-like data
      const gpxTrack = points.map(p => ({
        lat: p.gps.latitude,
        lng: p.gps.longitude,
        ele: p.gps.altitude || 0,
        time: new Date(p.timestamp).toISOString(),
      }));
      
      // Calculate average heart rate if available (mock for now, would need Bluetooth HR monitor)
      const avgHR = 150; // Placeholder
      
      await api.addManualActivity({
        name: `${activityType} - ${new Date().toLocaleDateString()}`,
        type: activityType,
        date: new Date().toISOString(),
        distance: Math.round(stats.distance),
        duration: Math.round(stats.duration),
        avg_hr: avgHR,
        elevation: Math.round(stats.elevationGain),
      });
      
      toast.success('Activité sauvegardée !');
      
      // Reset
      setPoints([]);
      setStats({
        distance: 0,
        duration: 0,
        avgSpeed: 0,
        maxSpeed: 0,
        elevationGain: 0,
        elevationLoss: 0,
        cadence: null,
        verticalOscillation: null,
      });
      setState('idle');
      lastPointRef.current = null;

      // Notify parent to refresh and close
      onSave?.();
      
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(2)}km`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (motionHandlerRef.current) {
        window.removeEventListener('devicemotion', motionHandlerRef.current);
      }
      if (barometerRef.current) {
        barometerRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Render UI
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Enregistrement Mobile
          </h2>
          {batteryLevel !== null && (
            <Badge variant={batteryLevel < 20 ? 'danger' : 'default'}>
              🔋 {batteryLevel}%
            </Badge>
          )}
        </div>

        {/* Activity Type Selector */}
        {state === 'idle' && !showSportPicker && (
          <button
            onClick={() => setShowSportPicker(true)}
            className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-border hover:border-primary/30 hover:bg-muted/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">{SPORTS[activityType]?.nameFr || 'Course à pied'}</p>
                <p className="text-xs text-muted-foreground">{SPORTS[activityType]?.name || 'Run'}</p>
              </div>
            </div>
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </button>
        )}

        {/* Sport Picker Modal */}
        {state === 'idle' && showSportPicker && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-bold">Choisir un sport</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowSportPicker(false)}>
                  Fermer
                </Button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                <SportPicker
                  selectedSport={activityType}
                  onSelect={(sport) => {
                    setActivityType(sport);
                    setShowSportPicker(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Status Badge */}
        <div className="flex justify-center">
          <Badge 
            variant={state === 'recording' ? 'danger' : state === 'paused' ? 'warning' : 'default'}
            className="text-lg px-4 py-1"
          >
            {state === 'idle' && 'Prêt'}
            {state === 'recording' && '● ENREGISTREMENT'}
            {state === 'paused' && '⏸ PAUSE'}
            {state === 'finished' && '✓ Terminé'}
          </Badge>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary/10 rounded-lg p-3 text-center">
            <Timer className="w-5 h-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold font-mono">
              {formatDuration(stats.duration)}
            </div>
            <div className="text-xs text-muted-foreground">Durée</div>
          </div>
          
          <div className="bg-primary/10 rounded-lg p-3 text-center">
            <Navigation className="w-5 h-5 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold">
              {formatDistance(stats.distance)}
            </div>
            <div className="text-xs text-muted-foreground">Distance</div>
          </div>
          
          <div className="bg-secondary/10 rounded-lg p-3 text-center">
            <Zap className="w-5 h-5 mx-auto mb-1 text-secondary" />
            <div className="text-xl font-bold">
              {stats.avgSpeed.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">km/h (moy)</div>
          </div>
          
          <div className="bg-secondary/10 rounded-lg p-3 text-center">
            <Activity className="w-5 h-5 mx-auto mb-1 text-secondary" />
            <div className="text-xl font-bold">
              {currentGPS?.speed ? (currentGPS.speed * 3.6).toFixed(1) : '--'}
            </div>
            <div className="text-xs text-muted-foreground">km/h (actuel)</div>
          </div>
        </div>

        {/* Advanced Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted rounded-lg p-2">
            <Mountain className="w-4 h-4 mx-auto mb-1" />
            <div className="font-bold">+{Math.round(stats.elevationGain)}m</div>
            <div className="text-xs text-muted-foreground">D+</div>
          </div>
          
          <div className="bg-muted rounded-lg p-2">
            <Activity className="w-4 h-4 mx-auto mb-1" />
            <div className="font-bold">{stats.cadence || '--'}</div>
            <div className="text-xs text-muted-foreground">ppm</div>
          </div>
          
          <div className="bg-muted rounded-lg p-2">
            <MapPin className="w-4 h-4 mx-auto mb-1" />
            <div className="font-bold">{points.length}</div>
            <div className="text-xs text-muted-foreground">points</div>
          </div>
        </div>

        {/* GPS Status */}
        {currentGPS && (
          <div className="text-xs text-center text-muted-foreground space-y-1">
            <div>
              GPS: {currentGPS.latitude.toFixed(6)}, {currentGPS.longitude.toFixed(6)}
            </div>
            <div>
              Précision: ±{Math.round(currentGPS.accuracy)}m | 
              Altitude: {currentGPS.altitude ? Math.round(currentGPS.altitude) + 'm' : 'N/A'}
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          {state === 'idle' && (
            <Button 
              onClick={startRecording} 
              className="flex-1 h-14 text-lg"
              disabled={permissionStatus === 'denied' || permissionStatus === 'unsupported'}
            >
              <Play className="w-5 h-5 mr-2" />
              DÉMARRER
            </Button>
          )}
          
          {state === 'recording' && (
            <>
              <Button 
                onClick={pauseRecording} 
                variant="secondary"
                className="flex-1 h-14"
              >
                <Pause className="w-5 h-5 mr-2" />
                PAUSE
              </Button>
              <Button 
                onClick={stopRecording} 
                variant="danger"
                className="flex-1 h-14"
              >
                <Square className="w-5 h-5 mr-2" />
                ARRÊT
              </Button>
            </>
          )}
          
          {state === 'paused' && (
            <>
              <Button 
                onClick={resumeRecording} 
                className="flex-1 h-14"
              >
                <Play className="w-5 h-5 mr-2" />
                REPRENDRE
              </Button>
              <Button 
                onClick={stopRecording} 
                variant="danger"
                className="flex-1 h-14"
              >
                <Square className="w-5 h-5 mr-2" />
                ARRÊT
              </Button>
            </>
          )}
          
          {state === 'finished' && (
            <>
              <Button 
                onClick={() => setState('idle')} 
                variant="secondary"
                className="flex-1 h-14"
              >
                Annuler
              </Button>
              <Button 
                onClick={saveActivity} 
                className="flex-1 h-14"
              >
                Sauvegarder
              </Button>
            </>
          )}
        </div>

        {/* Permission Warning */}
        {permissionStatus === 'denied' && (
          <div className="text-sm text-destructive text-center">
            ⚠️ Permission GPS refusée. Activez-la dans les paramètres de votre navigateur.
          </div>
        )}

        {/* Tips */}
        <div className="text-xs text-muted-foreground text-center">
          💡 Pour de meilleurs résultats, gardez l'écran allumé et l'appareil dans une poche ou brassard.
        </div>
      </CardContent>
    </Card>
  );
}
