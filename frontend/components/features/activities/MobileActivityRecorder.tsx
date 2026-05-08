/* eslint-disable no-undef, react-hooks/exhaustive-deps, unused-imports/no-unused-vars */
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { SportPicker } from './SportPicker';
import type { SportType } from '@/types/sports';
import { SPORTS, getSportCategory } from '@/types/sports';
import ActivityMap from '@/components/ui/ActivityMap';
import { 
  Play, Pause, Square, MapPin, Navigation, Mountain, ChevronDown, X, Save, Battery, BatteryMedium, BatteryLow,
  Target, TrendingUp, Footprints, Bike, Waves
} from 'lucide-react';

// ── Lightweight live map wrapper ─────────────────────────────────────────────
function LiveMap({ points }: { points: Array<{ gps: { latitude: number; longitude: number } }> }) {
  const latlng: [number, number][] = points.map(p => [p.gps.latitude, p.gps.longitude]);
  return <ActivityMap latlng={latlng} className="h-48" color="#3B82F6" />;
}

interface GPSData {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

interface RecordedPoint {
  gps: GPSData;
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
}

interface Route {
  id: string;
  name: string;
  description?: string;
  polyline: string; // Format: "lat,lng;lat,lng;..."
  distance: number; // in meters
  elevationGain: number;
  createdAt: string;
}

interface CoachSession {
  id: string;
  name: string;
  type: string;
  duration: number; // in seconds
  distance?: number; // in meters
  targetPace?: number; // in min/km
  targetHeartRateZone?: { min: number; max: number };
  powerTarget?: number; // in watts
}

interface Segment {
  id: string;
  name: string;
  description?: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  distance: number; // in meters
  elevationGain: number;
  createdAt: string;
  personalRecord?: number; // best time in seconds
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'finished';

interface MobileActivityRecorderProps {
  onSave?: () => void;
  onCancel?: () => void;
}

export function MobileActivityRecorder({ onSave, onCancel }: MobileActivityRecorderProps) {
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
  });
  const [currentGPS, setCurrentGPS] = useState<GPSData | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('checking');
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [activityName, setActivityName] = useState('');
  
  // Route following state
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [showRoutePicker, setShowRoutePicker] = useState(false);
  const [routeProgress, setRouteProgress] = useState(0); // Percentage of route completed
  
  // Coach session state
  const [activeCoachSession, setActiveCoachSession] = useState<CoachSession | null>(null);
  const [coachSessionFeedback, setCoachSessionFeedback] = useState<any>(null);
  
  // Segments state
  const [segments, setSegments] = useState<Segment[]>([]);
  const [activeSegment, setActiveSegment] = useState<Segment | null>(null);
  const [segmentStartTime, setSegmentStartTime] = useState<number | null>(null);
  const [showSegmentPicker, setShowSegmentPicker] = useState(false);
  const [showSegmentsOnMap, setShowSegmentsOnMap] = useState(true);
  
  const watchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const lastPointRef = useRef<GPSData | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  // stateRef MUST be declared before addPoint/updateStatsLoop which reference it
  const stateRef = useRef<RecordingState>('idle');
  const setStateAndRef = (s: RecordingState) => { stateRef.current = s; setState(s); };
  // currentGPS ref so updateStatsLoop always sees the latest value without stale closure
  const currentGPSRef = useRef<GPSData | null>(null);

  const sport = SPORTS[activityType];
  const sportCategory = getSportCategory(activityType);

   useEffect(() => {
     checkCapabilities();
     getBatteryLevel();
     return () => { cleanup(); };
   }, []);

   useEffect(() => {
     if (state === 'recording') {
       requestWakeLock();
     } else {
       releaseWakeLock();
     }
   }, [state]);

   // Load active coach session when starting to record
   useEffect(() => {
     if (state === 'recording' && !activeCoachSession) {
       loadActiveCoachSession();
     }
   }, [state, activeCoachSession]);

   // Load user's routes
   useEffect(() => {
     loadUserRoutes();
   }, []);

   // Load user's segments
   useEffect(() => {
     loadUserSegments();
   }, []);

  const cleanup = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    // Cleanup battery listener
    try {
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          battery.removeEventListener('levelchange', updateBatteryLevel);
        });
      }
    } catch { /* silent */ }
    releaseWakeLock();
  };

   const requestWakeLock = async () => {
     try {
       if ('wakeLock' in navigator) {
         wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
       }
     } catch {
       // Wake Lock not available — silently ignore
     }
   };

   // Load user's routes
   const loadUserRoutes = async () => {
     try {
       // Routes loading not yet implemented — placeholder
     } catch { /* silent */ }
   };

   // Load user's segments
   const loadUserSegments = async () => {
     try {
       // Segments loading not yet implemented — placeholder
     } catch { /* silent */ }
   };

   // Load active coach session
   const loadActiveCoachSession = async () => {
     try {
       // Coach session loading not yet implemented — placeholder
     } catch { /* silent */ }
   };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  const checkCapabilities = async () => {
    if (!('geolocation' in navigator)) {
      toast.error('GPS non disponible sur cet appareil');
      setPermissionStatus('unsupported');
    }
  };

  const getBatteryLevel = async () => {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        setBatteryLevel(Math.round(battery.level * 100));
        battery.removeEventListener('levelchange', updateBatteryLevel);
        battery.addEventListener('levelchange', updateBatteryLevel);
      }
    } catch {
      // Battery API not available
    }
  };

  const updateBatteryLevel = () => {
    try {
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      }
    } catch { /* silent */ }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      // Cleanup battery listeners
      try {
        if ('getBattery' in navigator) {
          (navigator as any).getBattery().then((battery: any) => {
            battery.removeEventListener('levelchange', updateBatteryLevel);
          });
        }
      } catch { /* silent */ }
      releaseWakeLock();
    };
  }, []);

   const calculateDistance = (p1: GPSData, p2: GPSData): number => {
     const R = 6371e3;
     const φ1 = p1.latitude * Math.PI / 180;
     const φ2 = p2.latitude * Math.PI / 180;
     const Δφ = (p2.latitude - p1.latitude) * Math.PI / 180;
     const Δλ = (p2.longitude - p1.longitude) * Math.PI / 180;
     const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
               Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
     return R * c;
   };

   // Calculate distance from a point to a line segment (for route deviation detection)
   const distanceToRouteSegment = (point: { latitude: number; longitude: number }, segStart: { latitude: number; longitude: number }, segEnd: { latitude: number; longitude: number }): number => {
     const x = point.longitude, y = point.latitude;
     const x1 = segStart.longitude, y1 = segStart.latitude;
     const x2 = segEnd.longitude, y2 = segEnd.latitude;
     const A = x - x1, B = y - y1, C = x2 - x1, D = y2 - y1;
     const dot = A * C + B * D;
     const len_sq = C * C + D * D;
     const param = len_sq !== 0 ? dot / len_sq : -1;
     const xx = param < 0 ? x1 : param > 1 ? x2 : x1 + param * C;
     const yy = param < 0 ? y1 : param > 1 ? y2 : y1 + param * D;
     return Math.sqrt((x - xx) ** 2 + (y - yy) ** 2) * 111000;
   };
     if (points.length < 2 || !routePolyline) return 0;
     
     // Parse route polyline
     const routePoints = routePolyline.split(';').map(pair => {
       const [lat, lng] = pair.split(',').map(parseFloat);
       return { latitude: lat, longitude: lng };
     });
     
     if (routePoints.length < 2) return 0;
     
     // Find the closest point on the route to our current position
     const lastPoint = points[points.length - 1].gps;
     let minDistance = Infinity;
     let closestIndex = 0;
     
     for (let i = 0; i < routePoints.length; i++) {
       const dist = calculateDistance(lastPoint, {
         latitude: routePoints[i].latitude,
         longitude: routePoints[i].longitude,
         altitude: 0,
         accuracy: 0,
         speed: 0,
         heading: 0,
         timestamp: 0
       });
       if (dist < minDistance) {
         minDistance = dist;
         closestIndex = i;
       }
     }
     
     // Calculate progress as percentage along the route
     return Math.min(100, (closestIndex / (routePoints.length - 1)) * 100);
   };

   // Check if we're inside a segment
   const isPointInSegment = (point: GPSData, segment: Segment): boolean => {
     // Simple bounding box check for now (can be improved with precise geometry)
     const minLat = Math.min(segment.startLat, segment.endLat);
     const maxLat = Math.max(segment.startLat, segment.endLat);
     const minLng = Math.min(segment.startLng, segment.endLng);
     const maxLng = Math.max(segment.startLng, segment.endLng);
     
     return (
       point.latitude >= minLat &&
       point.latitude <= maxLat &&
       point.longitude >= minLng &&
       point.longitude <= maxLng
     );
   };

   const startRecording = async () => {
     try {
       const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
       setPermissionStatus(permission.state);
       
       if (permission.state === 'denied') {
         toast.error('Permission GPS refusée. Activez la localisation.');
         return;
       }
 
       // Load data before starting
       await loadUserRoutes();
       await loadUserSegments();
       await loadActiveCoachSession();
 
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
           currentGPSRef.current = gpsData;
           setCurrentGPS(gpsData);
           
           if (stateRef.current === 'recording') {
             addPoint(gpsData);
           }
         },
         (error) => {
           // GPS error — silently continue
         },
         { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
       );

       startTimeRef.current = Date.now();
       pausedDurationRef.current = 0;
       setStateAndRef('recording');
       updateStatsLoop();
     } catch {
       toast.error('Erreur lors du démarrage');
     }
   };

    const addPoint = (gpsData: GPSData) => {
      const newPoint: RecordedPoint = { gps: gpsData, timestamp: Date.now() };

      setPoints(prev => {
        const newPoints = [...prev, newPoint];

        if (lastPointRef.current && gpsData.accuracy < 50) {
          const distance = calculateDistance(lastPointRef.current, gpsData);
          const speedMs = gpsData.speed !== null ? gpsData.speed : 0;
          const isMoving = speedMs > 0.5 || distance > 5;

          if (isMoving && distance < 100) {
            setStats(s => ({ ...s, distance: s.distance + distance }));
          }

          if (gpsData.altitude !== null && lastPointRef.current.altitude !== null) {
            const elevationChange = gpsData.altitude - lastPointRef.current.altitude;
            if (elevationChange > 2) {
              setStats(s => ({ ...s, elevationGain: s.elevationGain + elevationChange }));
            } else if (elevationChange < -2) {
              setStats(s => ({ ...s, elevationLoss: s.elevationLoss + Math.abs(elevationChange) }));
            }
          }

          // Route progress — use newPoints (not stale closure)
          if (selectedRoute) {
            const progress = calculateRouteProgress(newPoints, selectedRoute.polyline);
            setRouteProgress(progress);
          }

          // Segment detection
          if (showSegmentsOnMap && segments.length > 0) {
            const nowInSegment = segments.find(segment => isPointInSegment(gpsData, segment));
            if (nowInSegment && !activeSegment) {
              setActiveSegment(nowInSegment);
              setSegmentStartTime(Date.now());
            } else if (!nowInSegment && activeSegment) {
              const segmentDuration = (Date.now() - (segmentStartTime || Date.now())) / 1000;
              if (activeSegment.personalRecord === null || segmentDuration < activeSegment.personalRecord!) {
                setSegments(prevSegments =>
                  prevSegments.map(seg =>
                    seg.id === activeSegment!.id ? { ...seg, personalRecord: segmentDuration } : seg
                  )
                );
              }
              setActiveSegment(null);
              setSegmentStartTime(null);
            }
          }
        }

        lastPointRef.current = gpsData;
        return newPoints;
      });
    };

  // Use a ref for recording state so the rAF loop always sees the current value
  // (stateRef and setStateAndRef are declared above near the other refs)

  const updateStatsLoop = () => {
    if (stateRef.current !== 'recording') return;

    const duration = (Date.now() - startTimeRef.current) / 1000;
    setStats(s => {
      const avgSpeed = duration > 0 ? (s.distance / duration) * 3.6 : 0;
      // Use ref to avoid stale closure on currentGPS
      const currentSpeed = currentGPSRef.current?.speed ? currentGPSRef.current.speed * 3.6 : 0;
      return { ...s, duration, avgSpeed, maxSpeed: currentSpeed > s.maxSpeed ? currentSpeed : s.maxSpeed };
    });

    animationFrameRef.current = requestAnimationFrame(updateStatsLoop);
  };

  const pauseRecording = () => {
    if (stateRef.current === 'recording') {
      setStateAndRef('paused');
      // Freeze the start reference so duration doesn't advance while paused
      startTimeRef.current = Date.now() - (stats.duration * 1000);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const resumeRecording = () => {
    if (stateRef.current === 'paused') {
      // Restore start reference so duration continues from where it left off
      startTimeRef.current = Date.now() - (stats.duration * 1000);
      setStateAndRef('recording');
      updateStatsLoop();
    }
  };

  const stopRecording = () => {
    setStateAndRef('finished');
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    releaseWakeLock();
  };

  const saveActivity = async () => {
    try {
      const name = activityName || `${sport.nameFr} - ${new Date().toLocaleDateString('fr-FR')}`;

      if (points.length > 2) {
        // Build a GPX from recorded points and import via the GPX endpoint
        // This stores GPS streams, polyline, elevation properly
        const startTime = new Date(points[0].timestamp).toISOString();
        const gpxLines = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<gpx version="1.1" creator="DrawRun">',
          `<metadata><time>${startTime}</time></metadata>`,
          '<trk><name>' + name.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c] ?? c)) + '</name><trkseg>',
          ...points.map(p =>
            `<trkpt lat="${p.gps.latitude.toFixed(6)}" lon="${p.gps.longitude.toFixed(6)}">` +
            (p.gps.altitude != null ? `<ele>${p.gps.altitude.toFixed(1)}</ele>` : '') +
            `<time>${new Date(p.timestamp).toISOString()}</time></trkpt>`
          ),
          '</trkseg></trk></gpx>',
        ];
        await api.importGpx(name, gpxLines.join('\n'), activityType);
      } else {
        // No GPS points — save as manual activity
        await api.addManualActivity({
          name,
          type: activityType,
          date: new Date().toISOString(),
          distance: Math.round(stats.distance),
          duration: Math.round(stats.duration),
          elevation: Math.round(stats.elevationGain),
        });
      }

      toast.success('Activité sauvegardée !');
      resetState();
      onSave?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      toast.error(msg);
    }
  };

  const resetState = () => {
    setPoints([]);
    setStats({ distance: 0, duration: 0, avgSpeed: 0, maxSpeed: 0, elevationGain: 0, elevationLoss: 0, cadence: null });
    setStateAndRef('idle');
    lastPointRef.current = null;
    currentGPSRef.current = null;
    setCurrentGPS(null);
    setActivityName('');
  };

  const cancelRecording = () => {
    cleanup();
    resetState();
    onCancel?.();
  };

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(2)} km`;
  };

  const formatPace = (speedKmh: number): string => {
    if (speedKmh <= 0) return '--:--';
    const paceMinPerKm = 60 / speedKmh;
    const mins = Math.floor(paceMinPerKm);
    const secs = Math.round((paceMinPerKm - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getBatteryIcon = () => {
    if (batteryLevel === null) return null;
    if (batteryLevel > 50) return <Battery className="w-4 h-4" />;
    if (batteryLevel > 20) return <BatteryMedium className="w-4 h-4" />;
    return <BatteryLow className="w-4 h-4 text-red-500" />;
  };

  const getSportIcon = () => {
    if (sportCategory.category === 'water') return <Waves className="w-6 h-6" />;
    if (['bike', 'mountain_bike', 'gravel_bike', 'indoor_cycling', 'virtual_ride'].includes(activityType)) return <Bike className="w-6 h-6" />;
    return <Footprints className="w-6 h-6" />;
  };

  const getSportColor = () => {
    switch (sportCategory.category) {
      case 'endurance': return 'from-blue-600 to-cyan-500';
      case 'water': return 'from-cyan-600 to-blue-400';
      case 'winter': return 'from-slate-600 to-blue-300';
      case 'strength': return 'from-orange-600 to-red-500';
      case 'team': return 'from-green-600 to-emerald-400';
      case 'racket': return 'from-yellow-600 to-orange-400';
      default: return 'from-slate-600 to-gray-400';
    }
  };

   if (showSportPicker) {
     return (
       <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
         <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden">
           <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
             <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Choisir un sport</h3>
             <button
               onClick={() => setShowSportPicker(false)}
               className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
             >
               <X className="w-5 h-5 text-slate-500" />
             </button>
           </div>
           <div className="p-4 overflow-y-auto max-h-[70vh]">
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
     );
   }

   if (showRoutePicker) {
     return (
       <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
         <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden">
           <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
             <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Choisir un parcours</h3>
             <button
               onClick={() => setShowRoutePicker(false)}
               className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
             >
               <X className="w-5 h-5 text-slate-500" />
             </button>
           </div>
           <div className="p-4 overflow-y-auto max-h-[70vh]">
             {/* Route picker content would go here */}
             <div className="space-y-4">
               <p className="text-center text-slate-500">Sélecteur de parcours à implémenter</p>
               <Button onClick={() => setShowRoutePicker(false)} className="w-full">
                 Retour
               </Button>
             </div>
           </div>
         </div>
       </div>
     );
   }

   if (showSegmentPicker) {
     return (
       <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
         <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden">
           <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
             <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Gérer les segments</h3>
             <button
               onClick={() => setShowSegmentPicker(false)}
               className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
             >
               <X className="w-5 h-5 text-slate-500" />
             </button>
           </div>
           <div className="p-4 overflow-y-auto max-h-[70vh]">
             {/* Segment picker content would go here */}
             <div className="space-y-4">
               <p className="text-center text-slate-500">Gestionnaire de segments à implémenter</p>
               <Button onClick={() => setShowSegmentPicker(false)} className="w-full">
                 Retour
               </Button>
             </div>
           </div>
         </div>
       </div>
     );
   }

  return (
    <div className="fixed inset-0 z-40 bg-white dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <div className={`bg-gradient-to-r ${getSportColor()} text-white px-4 pt-12 pb-6`}>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              if (state === 'idle') {
                cancelRecording();
              } else if (state === 'recording' || state === 'paused') {
                if (window.confirm('Abandonner l\'enregistrement en cours ?')) {
                  stopRecording();
                  setTimeout(() => cancelRecording(), 100);
                }
              }
            }}
            className="p-2 rounded-xl bg-white/20 active:scale-95 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>
          {batteryLevel !== null && (
            <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full text-sm">
              {getBatteryIcon()}
              <span>{batteryLevel}%</span>
            </div>
          )}
        </div>

        <button
          onClick={() => state === 'idle' && setShowSportPicker(true)}
          className="w-full flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-2xl p-4 active:scale-[0.98] transition-transform"
          disabled={state !== 'idle'}
        >
          <div className="w-12 h-12 bg-white/25 rounded-xl flex items-center justify-center">
            {getSportIcon()}
          </div>
          <div className="text-left flex-1">
            <p className="text-lg font-bold">{sport.nameFr}</p>
            <p className="text-sm text-white/80">{sport.name}</p>
          </div>
          {state === 'idle' && <ChevronDown className="w-5 h-5 text-white/60" />}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Timer */}
        <div className="text-center mb-8">
          <div className="text-7xl font-mono font-bold text-slate-900 dark:text-white tracking-tight">
            {formatDuration(stats.duration)}
          </div>
          {state === 'recording' && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-sm font-medium text-red-500 uppercase tracking-wider">Enregistrement</span>
            </div>
          )}
          {state === 'paused' && (
            <span className="text-sm font-medium text-amber-500 uppercase tracking-wider">En pause</span>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-sm mb-8">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 text-center">
            <Navigation className="w-5 h-5 mx-auto mb-2 text-blue-500" />
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {formatDistance(stats.distance)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Distance</div>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-2 text-green-500" />
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {stats.avgSpeed > 0 ? `${stats.avgSpeed.toFixed(1)}` : '--'}
            </div>
            <div className="text-xs text-slate-500 mt-1">km/h moy</div>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 text-center">
            <Target className="w-5 h-5 mx-auto mb-2 text-orange-500" />
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {stats.avgSpeed > 0 ? formatPace(stats.avgSpeed) : '--:--'}
            </div>
            <div className="text-xs text-slate-500 mt-1">allure</div>
          </div>
        </div>

        {/* Secondary Stats */}
        {(stats.elevationGain > 0 || currentGPS) && (
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-8">
            {stats.elevationGain > 0 && (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 flex items-center gap-3">
                <Mountain className="w-5 h-5 text-emerald-500" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">+{Math.round(stats.elevationGain)} m</div>
                  <div className="text-xs text-slate-500">Dénivelé +</div>
                </div>
              </div>
            )}
            {currentGPS && (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-purple-500" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {currentGPS.speed ? `${(currentGPS.speed * 3.6).toFixed(1)}` : '--'} km/h
                  </div>
                  <div className="text-xs text-slate-500">Vitesse actuelle</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live GPS Map — shown during recording/paused/finished when we have points */}
        {points.length > 1 && (state === 'recording' || state === 'paused' || state === 'finished') && (
          <div className="w-full max-w-sm mb-6 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
            {/* Dynamic import to avoid SSR issues */}
            <LiveMap points={points} />
          </div>
        )}

        {/* Activity Name (when finished) */}
        {state === 'finished' && (
          <div className="w-full max-w-sm mb-6">
            <input
              type="text"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              placeholder="Nom de l'activité (optionnel)"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
          </div>
        )}
      </div>

       {/* Controls */}
       <div className="px-6 pb-8 pt-4 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
         <div className="flex items-center justify-center gap-4 max-w-sm mx-auto">
           {state === 'idle' && (
             <>
               <Button 
                 onClick={() => setShowRoutePicker(true)}
                 className="w-16 h-16 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/30"
               >
                 <MapPin className="w-7 h-7 fill-white" />
                 Parcours
               </Button>
               <Button 
                 onClick={startRecording} 
                 className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/30"
                 disabled={permissionStatus === 'denied' || permissionStatus === 'unsupported'}
               >
                 <Play className="w-8 h-8 fill-white" />
               </Button>
               <Button 
                 onClick={() => setShowSegmentPicker(true)}
                 className="w-16 h-16 rounded-full bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-500/30"
               >
                 <Target className="w-7 h-7 fill-white" />
                 Segments
               </Button>
             </>
           )}
           
           {state === 'recording' && (
             <>
               <Button 
                 onClick={pauseRecording} 
                 className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/30"
               >
                 <Pause className="w-7 h-7 fill-white" />
               </Button>
               <Button 
                 onClick={stopRecording} 
                 className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30"
               >
                 <Square className="w-7 h-7 fill-white" />
               </Button>
             </>
           )}
           
           {state === 'paused' && (
             <>
               <Button 
                 onClick={resumeRecording} 
                 className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/30"
               >
                 <Play className="w-7 h-7 fill-white" />
               </Button>
               <Button 
                 onClick={stopRecording} 
                 className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30"
               >
                 <Square className="w-7 h-7 fill-white" />
               </Button>
             </>
           )}
           
           {state === 'finished' && (
             <>
               <Button 
                 onClick={cancelRecording} 
                 className="flex-1 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
               >
                 <X className="w-5 h-5 mr-2" />
                 Supprimer
               </Button>
               <Button 
                 onClick={saveActivity} 
                 className="flex-1 h-14 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/30"
               >
                 <Save className="w-5 h-5 mr-2" />
                 Sauvegarder
               </Button>
             </>
           )}
         </div>
       </div>

      {/* GPS Status Bar */}
      {currentGPS && state !== 'idle' && (
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 max-w-sm mx-auto">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>±{Math.round(currentGPS.accuracy)}m</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>{points.length} points</span>
            </div>
            {currentGPS.altitude && (
              <div className="flex items-center gap-1.5">
                <Mountain className="w-3.5 h-3.5" />
                <span>{Math.round(currentGPS.altitude)}m</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
