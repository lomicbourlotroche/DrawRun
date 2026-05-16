/* eslint-disable no-undef, react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { SportPicker } from './SportPicker';
import type { SportType } from '@/types/sports';
import { SPORTS, getSportCategory } from '@/types/sports';
import ActivityMap from '@/components/ui/ActivityMap';
import {
  Play, Pause, Square, MapPin, Navigation, Mountain, ChevronDown, X, Save,
  Battery, BatteryMedium, BatteryLow, Target, TrendingUp, Footprints, Bike, Waves,
  Heart, Lock, Camera, Sun, CloudSun, Cloud, CloudDrizzle, CloudRain, CloudSnow,
  CloudLightning, Flag, Clock, Zap, BluetoothConnected,
  AlertTriangle, Eye, EyeOff, Gauge, ChevronRight, Upload, Ghost, Plus,
} from 'lucide-react';
import { createGPSFilter, isSpuriousJump, type FilteredGPSPoint } from '@/lib/gpsFilter';
import { useBluetoothHR } from '@/lib/hooks/useBluetoothHR';
import { useScreenLock, ScreenLockOverlay } from '@/lib/screenLock';
import {
  saveCheckpoint, clearCheckpoint, loadCheckpoint,
  enqueueSave, processSaveQueue, type LapData, type RecordingCheckpoint,
} from '@/lib/offlineQueue';
import { fetchWeather, type WeatherData } from '@/lib/weather';

const logger = {
  info: (msg: string, data?: any) => console.log(`[INFO] ${msg}`, data),
  error: (msg: string, data?: any) => console.error(`[ERROR] ${msg}`, data),
  warn: (msg: string, data?: any) => console.warn(`[WARN] ${msg}`, data),
};

function LiveMap({ points, height = 'h-32', currentPosition, accuracy, segments }: {
  points: Array<{ gps: { latitude: number; longitude: number } }>;
  height?: string;
  currentPosition?: [number, number] | null;
  accuracy?: number;
  segments?: Array<{ startLat: number; startLng: number; endLat: number; endLng: number; color?: string }>;
}) {
  const latlng: [number, number][] = points.map(p => [p.gps.latitude, p.gps.longitude]);
  return (
    <ActivityMap
      latlng={latlng}
      className={height}
      color="#FC4C02"
      showTrailAnimation
      currentPosition={currentPosition}
      accuracy={accuracy}
      segments={segments}
    />
  );
}

// ── Animated sub-components ──

// ── Simplified Timer ──

function SimpleTimer({ seconds }: { seconds: number }) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const display = hrs > 0
    ? `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <span className="font-mono font-bold tracking-tight">
      {display}
    </span>
  );
}

function IntervalRing({ timeLeft, total, phase }: { timeLeft: number; total: number; phase: 'work' | 'rest' }) {
  const pct = total > 0 ? (timeLeft / total) * 100 : 0;
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (pct / 100) * circumference;
  const color = phase === 'work'
    ? `hsl(${Math.round((timeLeft / total) * 120)}, 80%, 50%)`
    : '#818CF8';

  return (
    <div className="relative w-16 h-16">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-700" />
        <motion.circle
          cx="32" cy="32" r="28" fill="none" strokeWidth="4"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          key={timeLeft}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className="text-xs font-mono font-bold text-white"
        >
          {timeLeft}s
        </motion.span>
      </div>
    </div>
  );
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
  gps: FilteredGPSPoint;
  timestamp: number;
}

interface RecordingStats {
  distance: number;
  duration: number;
  elapsedTime: number;
  avgSpeed: number;
  maxSpeed: number;
  elevationGain: number;
  elevationLoss: number;
  cadence: number | null;
  avgHR: number | null;
  maxHR: number | null;
  currentHR: number | null;
  gap: number | null;
}

interface Route {
  id: string;
  name: string;
  description?: string;
  polyline: string;
  distance: number;
  elevationGain: number;
}

interface CoachSession {
  id: string;
  name: string;
  type: string;
  duration: number;
  distance?: number;
  targetPace?: number;
  targetHeartRateZone?: { min: number; max: number };
  powerTarget?: number;
  intervalStructure?: Array<{ work: number; rest: number; repeats: number }>;
}

interface Segment {
  id: string;
  name: string;
  description?: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  distance: number;
  elevationGain: number;
  personalRecord?: number;
}

interface WorkInterval {
  work: number;
  rest: number;
  repeats: number;
}

interface GPXRoute {
  name: string;
  points: Array<{ latitude: number; longitude: number; elevation?: number }>;
  distance: number;
  elevationGain: number;
  polyline: string;
}

interface GhostState {
  segmentId: string;
  segmentName: string;
  prTime: number;
  currentOffset: number; // seconds ahead (>0) or behind (<0)
  ghostPosition: [number, number] | null;
  progress: number; // 0-100%
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'finished' | 'review';

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
    distance: 0, duration: 0, elapsedTime: 0, avgSpeed: 0, maxSpeed: 0,
    elevationGain: 0, elevationLoss: 0, cadence: null,
    avgHR: null, maxHR: null, currentHR: null, gap: null,
  });
  const [currentGPS, setCurrentGPS] = useState<FilteredGPSPoint | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('checking');
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [activityName, setActivityName] = useState('');

  // Bluetooth HR
  const { hrData, isConnected: hrConnected, isScanning, connect: connectHR, disconnect: disconnectHR } = useBluetoothHR();

  // Screen lock
  const { isLocked: screenLocked, lock: lockScreen, unlock: unlockScreen } = useScreenLock();

  // Weather
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // Route following
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [showRoutePicker, setShowRoutePicker] = useState(false);
  const [routeProgress, setRouteProgress] = useState(0);
  const [userRoutes, setUserRoutes] = useState<Route[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  // Coach session
  const [activeCoachSession, setActiveCoachSession] = useState<CoachSession | null>(null);

  // Segments
  const [segments, setSegments] = useState<Segment[]>([]);
  const [activeSegment, setActiveSegment] = useState<Segment | null>(null);
  const [segmentStartTime, setSegmentStartTime] = useState<number | null>(null);
  const [showSegmentPicker, setShowSegmentPicker] = useState(false);
  const [showSegmentsOnMap, setShowSegmentsOnMap] = useState(true);
  const [nearbySegments, setNearbySegments] = useState<Segment[]>([]);

  // Laps
  const [laps, setLaps] = useState<LapData[]>([]);
  const [lastLapEnd, setLastLapEnd] = useState<number>(0);

  // Intervals
  const [intervalConfig, setIntervalConfig] = useState<WorkInterval | null>(null);
  const [currentInterval, setCurrentInterval] = useState<{ round: number; phase: 'work' | 'rest' } | null>(null);
  const [intervalTimeLeft, setIntervalTimeLeft] = useState<number>(0);

  // Auto-pause
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const stationaryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Photos
  const [photos, setPhotos] = useState<string[]>([]);

  // Adaptive GPS
  const [gpsHighAccuracy, setGpsHighAccuracy] = useState(true);
  const stationaryDurationRef = useRef(0);

  // GPX Upload
  const [showGpxUpload, setShowGpxUpload] = useState(false);
  const [uploadedGpxRoute, setUploadedGpxRoute] = useState<GPXRoute | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Ghost Racing
  const [ghostState, setGhostState] = useState<GhostState | null>(null);
  const [ghostRaceMode, setGhostRaceMode] = useState(false);
  const [selectedRaceSegment, setSelectedRaceSegment] = useState<Segment | null>(null);
  const [segmentEfforts, setSegmentEfforts] = useState<Map<string, { startTime: number; elapsedTime: number; prOffset: number }>>(new Map());

  // Create Segment
  const [showCreateSegment, setShowCreateSegment] = useState(false);
  const [segmentStartIdx, setSegmentStartIdx] = useState<number | null>(null);
  const [segmentEndIdx, setSegmentEndIdx] = useState<number | null>(null);
  const [newSegmentName, setNewSegmentName] = useState('');

  // Refs
  const watchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const originalStartTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const lastPointRef = useRef<FilteredGPSPoint | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const elapsedTimeRef = useRef<number>(0);
  const stateRef = useRef<RecordingState>('idle');
  const setStateAndRef = (s: RecordingState) => { stateRef.current = s; setState(s); };
  const currentGPSRef = useRef<FilteredGPSPoint | null>(null);
  const gpsFilterRef = useRef(createGPSFilter());
  const checkpointIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPauseEnabledRef = useRef(true);
  const isAutoPausedRef = useRef(false);

  const sport = SPORTS[activityType];
  const sportCategory = getSportCategory(activityType);

  // Init
  useEffect(() => {
    checkCapabilities();
    getBatteryLevel();
    checkForCheckpoint();
    processPendingSaves();
    const handleVisibility = () => {
      if (document.hidden && stateRef.current === 'recording') {
        saveCurrentCheckpoint();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (state === 'recording') requestWakeLock();
    else releaseWakeLock();
  }, [state]);

  // Checkpoint every 30s during recording
  useEffect(() => {
    if (state === 'recording') {
      checkpointIntervalRef.current = setInterval(saveCurrentCheckpoint, 30000);
    } else {
      if (checkpointIntervalRef.current) clearInterval(checkpointIntervalRef.current);
    }
    return () => { if (checkpointIntervalRef.current) clearInterval(checkpointIntervalRef.current); };
  }, [state, points, stats, laps]);

  // Weather fetch on first GPS fix
  useEffect(() => {
    if (currentGPS && !weather && state === 'recording') {
      fetchWeather(currentGPS.latitude, currentGPS.longitude).then(setWeather);
    }
  }, [currentGPS, state]);

  // Update HR stats
  useEffect(() => {
    if (hrData) {
      setStats(s => ({
        ...s,
        currentHR: hrData.heartRate,
        avgHR: s.avgHR !== null
          ? Math.round((s.avgHR * (s.duration / 60) + hrData.heartRate) / ((s.duration / 60) + 1))
          : hrData.heartRate,
        maxHR: s.maxHR !== null ? Math.max(s.maxHR, hrData.heartRate) : hrData.heartRate,
      }));
    }
  }, [hrData?.heartRate]);

  // Interval timer
  useEffect(() => {
    if (state !== 'recording' || !currentInterval) return;
    const timer = setInterval(() => {
      setIntervalTimeLeft(prev => {
        if (prev <= 1) {
          if (currentInterval.phase === 'work') {
            if (currentInterval.round < (intervalConfig?.repeats || 1)) {
              setCurrentInterval({ round: currentInterval.round, phase: 'rest' });
              toast.info(`Récupération — Série ${currentInterval.round}/${intervalConfig?.repeats}`);
              return intervalConfig?.rest || 0;
            } else {
              toast.success('Intervalles terminés !');
              setCurrentInterval(null);
              return 0;
            }
          } else {
            const nextRound = currentInterval.round + 1;
            if (nextRound <= (intervalConfig?.repeats || 1)) {
              setCurrentInterval({ round: nextRound, phase: 'work' });
              toast.info(`Série ${nextRound}/${intervalConfig?.repeats} — Allez !`);
              return intervalConfig?.work || 0;
            } else {
              toast.success('Intervalles terminés !');
              setCurrentInterval(null);
              return 0;
            }
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [state, currentInterval, intervalConfig]);

  const cleanup = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    try {
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          battery.removeEventListener('levelchange', updateBatteryLevel);
        });
      }
    } catch { /* silent */ }
    releaseWakeLock();
    if (stationaryTimerRef.current) clearTimeout(stationaryTimerRef.current);
  };

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch { /* silent */ }
  };

  const releaseWakeLock = () => {
    wakeLockRef.current?.release();
    wakeLockRef.current = null;
  };

  const checkCapabilities = () => {
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
    } catch { /* silent */ }
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

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      try {
        if ('getBattery' in navigator) {
          (navigator as any).getBattery().then((battery: any) => {
            battery.removeEventListener('levelchange', updateBatteryLevel);
          });
        }
      } catch { /* silent */ }
      releaseWakeLock();
      disconnectHR();
    };
  }, []);

  const haversine = (p1: { latitude: number; longitude: number }, p2: { latitude: number; longitude: number }): number => {
    const R = 6371e3;
    const φ1 = p1.latitude * Math.PI / 180;
    const φ2 = p2.latitude * Math.PI / 180;
    const Δφ = (p2.latitude - p1.latitude) * Math.PI / 180;
    const Δλ = (p2.longitude - p1.longitude) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const calculateGAP = (paceSecPerKm: number, gradePercent: number): number => {
    // Grade Adjusted Pace based on Daniels' formula
    if (gradePercent === 0) return paceSecPerKm;
    const adjustment = gradePercent > 0
      ? paceSecPerKm * (gradePercent * 0.032) // uphill
      : paceSecPerKm * (Math.abs(gradePercent) * 0.015); // downhill
    return paceSecPerKm + adjustment;
  };

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

  const calculateRouteProgress = (pgps: RecordedPoint[], routePolyline: string): number => {
    if (pgps.length < 2 || !routePolyline) return 0;
    const routePoints = routePolyline.split(';').map(pair => {
      const [lat, lng] = pair.split(',').map(parseFloat);
      return { latitude: lat, longitude: lng };
    });
    if (routePoints.length < 2) return 0;
    const lastPoint = pgps[pgps.length - 1].gps;
    let minDistance = Infinity;
    let closestIndex = 0;
    for (let i = 0; i < routePoints.length; i++) {
      const dist = haversine(lastPoint, { latitude: routePoints[i].latitude, longitude: routePoints[i].longitude });
      if (dist < minDistance) { minDistance = dist; closestIndex = i; }
    }
    return Math.min(100, (closestIndex / (routePoints.length - 1)) * 100);
  };

  const isPointInSegment = (point: FilteredGPSPoint, segment: Segment): boolean => {
    const minLat = Math.min(segment.startLat, segment.endLat);
    const maxLat = Math.max(segment.startLat, segment.endLat);
    const minLng = Math.min(segment.startLng, segment.endLng);
    const maxLng = Math.max(segment.startLng, segment.endLng);
    return point.latitude >= minLat && point.latitude <= maxLat &&
           point.longitude >= minLng && point.longitude <= maxLng;
  };

  // Checkpoint recovery
  const checkForCheckpoint = () => {
    const cp = loadCheckpoint();
    if (cp && cp.points.length > 2) {
      const age = (Date.now() - cp.timestamp) / 1000;
      if (age < 3600) {
        const resume = window.confirm(
          `Enregistrement non terminé trouvé (${(cp.stats.distance / 1000).toFixed(1)}km, il y a ${Math.round(age / 60)}min). Reprendre ?`
        );
        if (resume) {
          setPoints(cp.points.map(p => ({ gps: { ...p.gps, smoothedSpeed: 0, verticalAccuracy: 0 }, timestamp: p.timestamp })));
          setStats(s => ({ ...s, ...cp.stats }));
          setActivityType(cp.activityType as SportType);
          setActivityName(cp.activityName);
          setLaps(cp.laps || []);
          setStateAndRef('finished');
          toast.info('Enregistrement restauré');
          return;
        }
      }
      clearCheckpoint();
    }
  };

  const processPendingSaves = async () => {
    try {
      const result = await processSaveQueue(api.importGpx);
      if (result.success > 0) {
        toast.success(`${result.success} activité(s) synchronisée(s) depuis la file d'attente`);
      }
    } catch { /* silent */ }
  };

  const saveCurrentCheckpoint = () => {
    if (points.length < 2) return;
    const cp: RecordingCheckpoint = {
      points: points.map(p => ({ gps: { ...p.gps, smoothedSpeed: 0, verticalAccuracy: 0 }, timestamp: p.timestamp })),
      stats: {
        distance: stats.distance, duration: stats.duration, elapsedTime: elapsedTimeRef.current,
        elevationGain: stats.elevationGain, elevationLoss: stats.elevationLoss,
      },
      activityType, activityName, laps, timestamp: Date.now(),
    };
    saveCheckpoint(cp);
  };

  const vibrate = (pattern: number | number[]) => {
    try { navigator.vibrate(pattern); } catch { /* silent */ }
  };

  const startRecording = async () => {
    vibrate(50);
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      setPermissionStatus(permission.state);
      if (permission.state === 'denied') {
        toast.error('Permission GPS refusée. Activez la localisation.');
        return;
      }

      gpsFilterRef.current = createGPSFilter();

      await loadUserRoutes();
      await loadUserSegments();
      await loadActiveCoachSession();

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const raw: FilteredGPSPoint = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed,
            heading: position.coords.heading,
            timestamp: position.timestamp,
            smoothedSpeed: 0,
            verticalAccuracy: 0,
          };

          const filtered = gpsFilterRef.current(raw);
          currentGPSRef.current = filtered;
          setCurrentGPS(filtered);

          if (stateRef.current === 'recording' && !isAutoPausedRef.current) {
            addPoint(filtered);
          }
        },
        () => { /* GPS error — silent */ },
        {
          enableHighAccuracy: gpsHighAccuracy,
          maximumAge: gpsHighAccuracy ? 1000 : 3000,
          timeout: gpsHighAccuracy ? 5000 : 10000,
        }
      );

      startTimeRef.current = Date.now();
      originalStartTimeRef.current = Date.now();
      pausedDurationRef.current = 0;
      setStateAndRef('recording');
      updateStatsLoop();
      clearCheckpoint();
    } catch {
      toast.error('Erreur lors du démarrage');
    }
  };

  const addPoint = (gpsData: FilteredGPSPoint) => {
    const newPoint: RecordedPoint = { gps: gpsData, timestamp: Date.now() };

    setPoints(prev => {
      const newPoints = [...prev, newPoint];

      if (lastPointRef.current && gpsData.accuracy < 50) {
        if (isSpuriousJump(lastPointRef.current, gpsData)) {
          return newPoints;
        }

        const distance = haversine(lastPointRef.current, gpsData);
        const speedMs = gpsData.smoothedSpeed > 0 ? gpsData.smoothedSpeed : (gpsData.speed ?? 0);
        const isMoving = speedMs > 0.5 || distance > 5;

        if (isMoving && distance < 150) {
          setStats(s => ({ ...s, distance: s.distance + distance }));

          // Auto-pause — reset timer when moving
          if (autoPauseEnabledRef.current) {
            if (stationaryTimerRef.current) clearTimeout(stationaryTimerRef.current);
            stationaryTimerRef.current = null;
            if (isAutoPausedRef.current) {
              isAutoPausedRef.current = false;
              setIsAutoPaused(false);
              setStateAndRef('recording');
            }
            stationaryDurationRef.current = 0;
          }
        } else if (autoPauseEnabledRef.current && stateRef.current === 'recording') {
          // Not moving — start auto-pause countdown
          stationaryDurationRef.current += (gpsData.timestamp - (lastPointRef.current?.timestamp || gpsData.timestamp)) / 1000;
          if (stationaryDurationRef.current > 8 && !isAutoPausedRef.current) {
            isAutoPausedRef.current = true;
            setIsAutoPaused(true);
            setStateAndRef('paused');
            toast.info('Pause automatique');
          }
        }

        // Elevation
        if (gpsData.altitude !== null && lastPointRef.current?.altitude !== null) {
          const elevationChange = gpsData.altitude - lastPointRef.current.altitude;
          if (elevationChange > 2) setStats(s => ({ ...s, elevationGain: s.elevationGain + elevationChange }));
          else if (elevationChange < -2) setStats(s => ({ ...s, elevationLoss: s.elevationLoss + Math.abs(elevationChange) }));
        }

        // GAP calculation
        if (gpsData.altitude !== null && lastPointRef.current?.altitude !== null && distance > 0) {
          const grade = (gpsData.altitude - lastPointRef.current.altitude) / distance;
          const paceSecPerKm = speedMs > 0 ? (1000 / speedMs) : 0;
          if (paceSecPerKm > 0) {
            const gap = calculateGAP(paceSecPerKm, grade);
            setStats(s => ({ ...s, gap: Math.round(gap) }));
          }
        }

        // Route progress
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
            toast.info(`Segment: ${nowInSegment.name}`);

            // Start ghost race if in race mode
            if (ghostRaceMode && selectedRaceSegment?.id === nowInSegment.id) {
              setSegmentEfforts(prev => new Map(prev).set(nowInSegment.id, {
                startTime: Date.now(),
                elapsedTime: 0,
                prOffset: 0,
              }));
            }
          } else if (!nowInSegment && activeSegment) {
            const segDuration = (Date.now() - (segmentStartTime || Date.now())) / 1000;
            if ((activeSegment.personalRecord ?? Infinity) > segDuration) {
              setSegments(prevSegments =>
                prevSegments.map(seg =>
                  seg.id === activeSegment.id ? { ...seg, personalRecord: segDuration } : seg
                )
              );
            }

            // Save effort if in ghost race mode
            if (ghostRaceMode && selectedRaceSegment?.id === activeSegment.id) {
              setSegmentEfforts(prev => {
                const next = new Map(prev);
                const effort = next.get(activeSegment.id);
                if (effort) {
                  effort.elapsedTime = segDuration;
                  next.set(activeSegment.id, effort);
                }
                return next;
              });
              toast.info(`Segment terminé: ${formatDuration(segDuration)}`);
            }

            setActiveSegment(null);
            setSegmentStartTime(null);
          }
        }

        // Ghost race update
        if (ghostRaceMode && ghostState) {
          updateGhostPosition(gpsData.latitude, gpsData.longitude);

          // Track elapsed time for active ghost segment
          if (activeSegment && ghostRaceMode) {
            setSegmentEfforts(prev => {
              const next = new Map(prev);
              const effort = next.get(activeSegment.id);
              if (effort) {
                effort.elapsedTime = (Date.now() - effort.startTime) / 1000;
                effort.prOffset = effort.elapsedTime - (ghostState.progress / 100) * ghostState.prTime;
                next.set(activeSegment.id, effort);
              }
              return next;
            });
          }
        }

        // Adaptive GPS — switch to low power if stationary for 30s
        if (stationaryDurationRef.current > 30 && gpsHighAccuracy) {
          setGpsHighAccuracy(false);
        } else if (isMoving && !gpsHighAccuracy) {
          setGpsHighAccuracy(true);
        }
      }

      lastPointRef.current = gpsData;
      return newPoints;
    });
  };

  const updateStatsLoop = () => {
    if (stateRef.current !== 'recording' && stateRef.current !== 'paused') return;

    const duration = stateRef.current === 'recording'
      ? (Date.now() - startTimeRef.current) / 1000
      : stats.duration;
    const elpTime = (Date.now() - originalStartTimeRef.current) / 1000;

    setStats(s => {
      const avgSpeed = duration > 0 ? (s.distance / duration) * 3.6 : 0;
      const currentSpeed = currentGPSRef.current?.smoothedSpeed
        ? currentGPSRef.current.smoothedSpeed * 3.6
        : (currentGPSRef.current?.speed ? currentGPSRef.current.speed * 3.6 : 0);
      return {
        ...s,
        duration,
        elapsedTime: elpTime,
        avgSpeed,
        maxSpeed: currentSpeed > s.maxSpeed ? currentSpeed : s.maxSpeed,
      };
    });

    animationFrameRef.current = requestAnimationFrame(updateStatsLoop);
  };

  const pauseRecording = () => {
    if (stateRef.current === 'recording') {
      vibrate(30);
      setStateAndRef('paused');
      startTimeRef.current = Date.now() - (stats.duration * 1000);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const resumeRecording = () => {
    if (stateRef.current === 'paused') {
      vibrate(30);
      if (isAutoPausedRef.current) {
        isAutoPausedRef.current = false;
        setIsAutoPaused(false);
      }
      startTimeRef.current = Date.now() - (stats.duration * 1000);
      setStateAndRef('recording');
      updateStatsLoop();
    }
  };

  const stopRecording = () => {
    vibrate([50, 80, 50]);
    elapsedTimeRef.current = (Date.now() - originalStartTimeRef.current) / 1000;
    setStateAndRef('finished');
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    releaseWakeLock();
    if (stationaryTimerRef.current) clearTimeout(stationaryTimerRef.current);
    clearCheckpoint();
  };

  const markLap = () => {
    if (stateRef.current !== 'recording') return;
    vibrate(100);
    const lapNum = laps.length + 1;
    const lapDistance = stats.distance - lastLapEnd;
    setLaps(prev => [...prev, {
      number: lapNum,
      startTime: lastLapEnd > 0 ? laps[laps.length - 1].startTime : originalStartTimeRef.current,
      endTime: Date.now(),
      distance: lapDistance,
      duration: stats.duration - (laps.length > 0 ? laps.reduce((a, l) => a + l.duration, 0) : 0),
    }]);
    setLastLapEnd(stats.distance);
    toast.success(`Tour ${lapNum} — ${(lapDistance / 1000).toFixed(2)} km`);
  };

  const takePhoto = async () => {
    vibrate(40);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')!.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      stream.getTracks().forEach(t => t.stop());
      setPhotos(prev => [...prev, dataUrl]);
    } catch {
      toast.error('Appareil photo non disponible');
    }
  };

  const startIntervalMode = () => {
    const config: WorkInterval = { work: 60, rest: 30, repeats: 5 };
    setIntervalConfig(config);
    setCurrentInterval({ round: 1, phase: 'work' });
    setIntervalTimeLeft(config.work);
    toast.info(`Intervalles: ${config.work}s effort / ${config.rest}s récupération, ${config.repeats} séries`);
  };

  const uploadPhotos = async (activityId: number) => {
    for (const photo of photos) {
      try {
        await api.addActivityPhoto(activityId, { url: photo });
      } catch {
        toast.error('Erreur lors de l\'upload d\'une photo');
      }
    }
  };

  const saveActivity = async () => {
    try {
      const name = activityName || `${sport.nameFr} - ${new Date().toLocaleDateString('fr-FR')}`;

      let activityId: number | null = null;

      if (points.length > 2) {
        const startTime = new Date(points[0].timestamp).toISOString();
        const gpxLines = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<gpx version="1.1" creator="DrawRun" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">',
          `<metadata><time>${startTime}</time></metadata>`,
          '<trk><name>' + name.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c] ?? c)) + '</name><trkseg>',
          ...points.map((p, i) => {
            const hrTag = hrData && i % 5 === 0 ? `<gpxtpx:hr>${hrData.heartRate}</gpxtpx:hr>` : '';
            return `<trkpt lat="${p.gps.latitude.toFixed(6)}" lon="${p.gps.longitude.toFixed(6)}">` +
              (p.gps.altitude !== null ? `<ele>${p.gps.altitude.toFixed(1)}</ele>` : '') +
              `<time>${new Date(p.timestamp).toISOString()}</time>${hrTag}</trkpt>`;
          }),
          ...(() => {
            let cumulativeDist = 0;
            return laps.map(lap => {
              cumulativeDist += lap.distance;
              const targetDist = cumulativeDist;
              let ptIdx = 0;
              for (let i = 1; i < points.length; i++) {
                const d = haversine(points[0].gps, points[i].gps);
                if (d >= targetDist) { ptIdx = i; break; }
              }
              const pt = points[Math.min(ptIdx, points.length - 1)].gps;
              return `<wpt lat="${pt.latitude.toFixed(6)}" lon="${pt.longitude.toFixed(6)}"><name>Tour ${lap.number}</name></wpt>`;
            });
          })(),
          '</trkseg></trk></gpx>',
        ].join('\n');

        try {
          const result = await api.importGpx(name, gpxLines, activityType);
          activityId = result.id;
        } catch {
          enqueueSave({ gpxData: gpxLines, name, type: activityType, timestamp: Date.now(), retries: 0 });
          toast.success('Activité mise en file d\'attente (hors-ligne)');
          resetState();
          onSave?.();
          return;
        }
      } else {
        const result = await api.createActivity({
          name,
          type: activityType,
          start_date: new Date().toISOString(),
          distance: Math.round(stats.distance),
          moving_time: Math.round(stats.duration),
          elapsed_time: Math.round(elapsedTimeRef.current),
          total_elevation_gain: Math.round(stats.elevationGain),
          average_heartrate: stats.avgHR ?? undefined,
          max_heartrate: stats.maxHR ?? undefined,
          average_speed: stats.duration > 0 ? Math.round((stats.distance / stats.duration) * 100) / 100 : 0,
        } as any);
        activityId = (result as any)?.id ?? null;
      }

      if (activityId && photos.length > 0) {
        await uploadPhotos(activityId);
      }

      // Save segment efforts
      if (activityId && segmentEfforts.size > 0) {
        await saveSegmentEffortToBackend(activityId);
      }

      vibrate([80, 50, 80]);
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
    setStats({ distance: 0, duration: 0, elapsedTime: 0, avgSpeed: 0, maxSpeed: 0, elevationGain: 0, elevationLoss: 0, cadence: null, avgHR: null, maxHR: null, currentHR: null, gap: null });
    setStateAndRef('idle');
    lastPointRef.current = null;
    currentGPSRef.current = null;
    setCurrentGPS(null);
    setActivityName('');
    originalStartTimeRef.current = 0;
    elapsedTimeRef.current = 0;
    setLaps([]);
    setLastLapEnd(0);
    setWeather(null);
    setPhotos([]);
    setIntervalConfig(null);
    setCurrentInterval(null);
    setIsAutoPaused(false);
    isAutoPausedRef.current = false;
    setGpsHighAccuracy(true);
    clearCheckpoint();
    setUploadedGpxRoute(null);
    setGhostState(null);
    setGhostRaceMode(false);
    setSelectedRaceSegment(null);
    setSegmentEfforts(new Map());
    setShowCreateSegment(false);
    setSegmentStartIdx(null);
    setSegmentEndIdx(null);
    setNewSegmentName('');
  };

  const cancelRecording = () => {
    cleanup();
    resetState();
    onCancel?.();
  };

  // Load routes, segments, coach
  const loadUserRoutes = async () => {
    try {
      setLoadingRoutes(true);
      const result = await api.getMyRoutes();
      if (result?.routes) {
        setUserRoutes(result.routes.map((r: any) => ({
          id: String(r.id),
          name: r.name,
          description: r.description,
          polyline: r.polyline || '',
          distance: r.distance || 0,
          elevationGain: r.elevation_gain || 0,
        })));
      }
    } catch {
      setUserRoutes([]);
    } finally {
      setLoadingRoutes(false);
    }
  };

  const loadUserSegments = async () => {
    try {
      if (currentGPS) {
        const result = await api.getNearbySegments(currentGPS.latitude, currentGPS.longitude, 50000);
        if (result?.segments) {
          setNearbySegments(result.segments.map((s: any) => ({
            id: String(s.id),
            name: s.name,
            description: s.description,
            startLat: s.start_lat || 0,
            startLng: s.start_lng || 0,
            endLat: s.end_lat || 0,
            endLng: s.end_lng || 0,
            distance: s.distance || 0,
            elevationGain: s.elevation_gain || 0,
            personalRecord: s.pr_time || undefined,
          })));
        }
      }
    } catch { /* silent */ }
  };

  const loadActiveCoachSession = async () => {
    try {
      const plan = await api.getActivePlan();
      if (plan?.sessions && plan.sessions.length > 0) {
        const session = plan.sessions[0];
        setActiveCoachSession({
          id: String(session.id || plan.planId || ''),
          name: session.name || plan.plan?.name || 'Séance',
          type: session.type || 'run',
          duration: session.estimated_duration || session.duration || 3600,
          distance: session.distance,
          targetPace: session.target_pace,
          targetHeartRateZone: session.target_hr_zone ? { min: session.target_hr_zone.min, max: session.target_hr_zone.max } : undefined,
          intervalStructure: session.interval_structure,
        });
      }
    } catch { /* silent */ }
  };

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  // ── GPX Upload ──
  const parseGPX = (gpxText: string): GPXRoute | null => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(gpxText, 'text/xml');
      const trackPoints = doc.querySelectorAll('trkpt');
      if (trackPoints.length === 0) return null;

      const pts: Array<{ latitude: number; longitude: number; elevation?: number }> = [];
      let totalElevation = 0;
      let totalDistance = 0;

      trackPoints.forEach((pt, i) => {
        const lat = parseFloat(pt.getAttribute('lat') || '0');
        const lon = parseFloat(pt.getAttribute('lon') || '0');
        const ele = pt.querySelector('ele');
        const elevation = ele ? parseFloat(ele.textContent || '0') : undefined;

        if (i > 0) {
          const prev = pts[pts.length - 1];
          totalDistance += haversine(prev, { latitude: lat, longitude: lon });
          if (elevation !== undefined && prev.elevation !== undefined) {
            const diff = elevation - prev.elevation;
            if (diff > 2) totalElevation += diff;
          }
        }

        pts.push({ latitude: lat, longitude: lon, elevation });
      });

      const nameEl = doc.querySelector('name');
      const name = nameEl?.textContent || 'Parcours importé';

      // Simple polyline encoding
      const polyline = pts.map(p => `${p.latitude.toFixed(5)},${p.longitude.toFixed(5)}`).join(';');

      return { name, points: pts, distance: totalDistance, elevationGain: totalElevation, polyline };
    } catch {
      return null;
    }
  };

  const handleGpxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.gpx')) {
      toast.error('Format GPX uniquement');
      return;
    }

    try {
      const text = await file.text();
      const route = parseGPX(text);
      if (route && route.points.length > 2) {
        setUploadedGpxRoute(route);
        setShowGpxUpload(false);

        // Add as a temporary route for following
        const tempRoute: Route = {
          id: `gpx_${Date.now()}`,
          name: route.name,
          polyline: route.polyline,
          distance: route.distance,
          elevationGain: route.elevationGain,
        };
        setSelectedRoute(tempRoute);
        toast.success(`Parcours "${route.name}" importé (${formatDistance(route.distance)})`);
      } else {
        toast.error('Impossible de parser le fichier GPX');
      }
    } catch {
      toast.error('Erreur lors de la lecture du fichier');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Ghost Racing ──
  const startGhostRace = async (segment: Segment) => {
    try {
      const efforts = await api.getMySegmentEfforts(parseInt(segment.id));
      const bestEffort = (efforts?.efforts as any[])?.[0];

      if (!bestEffort) {
        toast.error('Aucun effort enregistré sur ce segment');
        return;
      }

      setSelectedRaceSegment(segment);
      setGhostRaceMode(true);
      setGhostState({
        segmentId: segment.id,
        segmentName: segment.name,
        prTime: bestEffort.elapsed_time,
        currentOffset: 0,
        ghostPosition: [segment.startLat, segment.startLng],
        progress: 0,
      });
      toast.info(`Ghost race: ${segment.name} — PR: ${formatDuration(bestEffort.elapsed_time)}`);
    } catch {
      toast.error('Erreur lors du chargement du PR');
    }
  };

  const updateGhostPosition = (currentLat: number, currentLng: number) => {
    if (!ghostState || !selectedRaceSegment) return;

    // Calculate progress along segment
    const segDist = haversine(
      { latitude: selectedRaceSegment.startLat, longitude: selectedRaceSegment.startLng },
      { latitude: selectedRaceSegment.endLat, longitude: selectedRaceSegment.endLng }
    );
    const userDistFromStart = haversine(
      { latitude: selectedRaceSegment.startLat, longitude: selectedRaceSegment.startLng },
      { latitude: currentLat, longitude: currentLng }
    );
    const progress = Math.min(100, (userDistFromStart / segDist) * 100);

    // Calculate ghost position based on time offset
    const elapsed = (Date.now() - (segmentEfforts.get(ghostState.segmentId)?.startTime || Date.now())) / 1000;
    const ghostProgress = Math.min(100, (elapsed / ghostState.prTime) * 100);

    // Interpolate ghost position
    const ghostLat = selectedRaceSegment.startLat + (selectedRaceSegment.endLat - selectedRaceSegment.startLat) * (ghostProgress / 100);
    const ghostLng = selectedRaceSegment.startLng + (selectedRaceSegment.endLng - selectedRaceSegment.startLng) * (ghostProgress / 100);

    const offset = elapsed - (ghostProgress / 100) * ghostState.prTime;

    setGhostState(prev => prev ? {
      ...prev,
      currentOffset: -offset, // Negative = behind, Positive = ahead
      ghostPosition: [ghostLat, ghostLng],
      progress,
    } : null);
  };

  const saveSegmentEffortToBackend = async (activityId: number) => {
    for (const [segmentId, effort] of segmentEfforts.entries()) {
      try {
        await api.createSegmentEffort({
          segmentId: parseInt(segmentId),
          data: {
            activity_id: activityId,
            elapsed_time: effort.elapsedTime,
            moving_time: effort.elapsedTime,
            start_date: new Date(effort.startTime).toISOString(),
          },
        });
      } catch (err) {
        logger.error('Failed to save segment effort', { segmentId, error: err });
      }
    }
  };

  // ── Create Segment from Activity ──
  const createSegmentFromActivity = async () => {
    if (segmentStartIdx === null || segmentEndIdx === null || points.length === 0) {
      toast.error('Sélectionnez un start et end sur le tracé');
      return;
    }

    const startPt = points[segmentStartIdx].gps;
    const endPt = points[segmentEndIdx].gps;
    const distance = haversine(startPt, endPt);

    if (distance < 100) {
      toast.error('Le segment doit faire au moins 100m');
      return;
    }

    // Calculate elevation gain for the segment
    let elevationGain = 0;
    for (let i = segmentStartIdx; i < segmentEndIdx && i < points.length - 1; i++) {
      const alt1 = points[i].gps.altitude;
      const alt2 = points[i + 1].gps.altitude;
      if (alt1 !== null && alt2 !== null) {
        const diff = alt2 - alt1;
        if (diff > 2) elevationGain += diff;
      }
    }

    // Create polyline for the segment
    const segmentPoints = points.slice(segmentStartIdx, segmentEndIdx + 1);
    const polyline = segmentPoints.map(p => `${p.gps.latitude.toFixed(5)},${p.gps.longitude.toFixed(5)}`).join(';');

    try {
      const result = await api.createSegment({
        name: newSegmentName || `Segment ${sport.nameFr}`,
        description: `Créé depuis une activité ${sport.nameFr}`,
        start_lat: startPt.latitude,
        start_lng: startPt.longitude,
        end_lat: endPt.latitude,
        end_lng: endPt.longitude,
        distance,
        elevation_gain: elevationGain,
        polyline,
        activity_type: sport.name,
      });

      if (result.success) {
        toast.success(`Segment "${newSegmentName || sport.nameFr}" créé !`);
        setShowCreateSegment(false);
        setSegmentStartIdx(null);
        setSegmentEndIdx(null);
        setNewSegmentName('');

        // Reload segments
        await loadUserSegments();
      } else {
        toast.error(result.error || 'Erreur lors de la création du segment');
      }
    } catch {
      toast.error('Erreur lors de la création du segment');
    }
  };

  const getBatteryIcon = () => {
    if (batteryLevel === null) return null;
    if (batteryLevel > 50) return <Battery className="w-4 h-4" />;
    if (batteryLevel > 20) return <BatteryMedium className="w-4 h-4" />;
    return <BatteryLow className="w-4 h-4 text-danger" />;
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

  const getWeatherIcon = () => {
    if (!weather) return null;
    const cls = "w-5 h-5 text-white/80";
    switch (weather.icon) {
      case 'sun': return <Sun className={cls} />;
      case 'cloud-sun': return <CloudSun className={cls} />;
      case 'cloud': return <Cloud className={cls} />;
      case 'clouds': return <Cloud className={cls} />;
      case 'fog': return <Cloud className={cls} />;
      case 'drizzle': return <CloudDrizzle className={cls} />;
      case 'rain': case 'rain-heavy': return <CloudRain className={cls} />;
      case 'snow': case 'sleet': return <CloudSnow className={cls} />;
      case 'thunderstorm': return <CloudLightning className={cls} />;
      default: return <Sun className={cls} />;
    }
  };

  // ── Picker overlays — dark bottom sheet style ──
  if (showSportPicker || showRoutePicker || showSegmentPicker) {
    const title = showSportPicker ? 'Choisir un sport' : showRoutePicker ? 'Choisir un parcours' : 'Gérer les segments';
    const onClose = showSportPicker ? () => setShowSportPicker(false) :
                    showRoutePicker ? () => setShowRoutePicker(false) :
                    () => setShowSegmentPicker(false);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-slate-900 rounded-t-2xl shadow-2xl w-full max-w-[90vw] lg:max-w-lg max-h-[85vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="p-4 overflow-y-auto max-h-[70vh]">
            {showSportPicker && (
              <SportPicker
                selectedSport={activityType}
                onSelect={(sport) => { setActivityType(sport); setShowSportPicker(false); }}
              />
            )}
            {showRoutePicker && (
              <div className="space-y-2">
                {loadingRoutes && <p className="text-center text-slate-500">Chargement...</p>}
                {!loadingRoutes && userRoutes.length === 0 && (
                  <p className="text-center text-slate-500 py-8">Aucun parcours enregistré</p>
                )}
                {userRoutes.map(route => (
                  <button
                    type="button"
                    key={route.id}
                    onClick={() => { setSelectedRoute(route); setShowRoutePicker(false); toast.info(`Parcours: ${route.name}`); }}
                    className="w-full text-left p-3 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <p className="font-medium text-white">{route.name}</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {formatDistance(route.distance)} · {Math.round(route.elevationGain)}m D+
                    </p>
                  </button>
                ))}
                <button onClick={onClose} className="w-full min-w-[120px] h-12 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors">Retour</button>
              </div>
            )}
            {showSegmentPicker && (
              <div className="space-y-2">
                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => { setShowSegmentPicker(false); setShowGpxUpload(true); fileInputRef.current?.click(); }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    <Upload className="w-4 h-4 text-peak-400" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">Importer GPX</p>
                      <p className="text-[10px] text-slate-500">Suivre une trace</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowSegmentPicker(false); setShowCreateSegment(true); }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">Créer segment</p>
                      <p className="text-[10px] text-slate-500">Depuis le tracé</p>
                    </div>
                  </button>
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-300 mb-3">
                  <input type="checkbox" checked={showSegmentsOnMap} onChange={e => setShowSegmentsOnMap(e.target.checked)} className="rounded bg-slate-800 border-slate-700" />
                  Afficher les segments sur la carte
                </label>
                {nearbySegments.length === 0 && (
                  <p className="text-center text-slate-500 py-8">Aucun segment à proximité</p>
                )}
                {nearbySegments.map(seg => (
                  <div
                    key={seg.id}
                    className="p-3 rounded-lg bg-slate-800/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-white">{seg.name}</p>
                      {seg.personalRecord && (
                        <span className="text-xs text-emerald-400 font-mono">{formatDuration(seg.personalRecord)}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{formatDistance(seg.distance)} · {Math.round(seg.elevationGain)}m D+</p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => { setShowSegmentPicker(false); startGhostRace(seg); }}
                        className="flex-1 h-8 rounded-md bg-slate-700 hover:bg-slate-600 text-xs text-slate-300 flex items-center justify-center gap-1 transition-colors"
                      >
                        <Ghost className="w-3 h-3" />
                        Ghost race
                      </button>
                    </div>
                  </div>
                ))}
                {activeSegment && (
                  <div className="p-3 rounded-lg bg-peak/10 border border-peak/20">
                    <p className="text-sm font-medium text-peak-400">Segment en cours: {activeSegment.name}</p>
                  </div>
                )}
                <button type="button" onClick={onClose} className="w-full h-12 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors">Retour</button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ── Summary/Review Screen ──
  const reviewScreen = (
    <motion.div
      key="review"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ type: 'spring', stiffness: 250, damping: 25 }}
      className="fixed inset-0 z-40 bg-slate-950 flex flex-col"
    >
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
            {getSportIcon()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Résumé de l&apos;activité</h2>
            <p className="text-xs text-slate-500">{activityName || sport.nameFr}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Primary Stats — 2x2 grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-1">Distance</div>
            <div className="text-2xl font-bold text-white">{formatDistance(stats.distance)}</div>
          </div>
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-1">Durée</div>
            <div className="text-2xl font-bold text-white">{formatDuration(stats.duration)}</div>
          </div>
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-1">Vitesse moy</div>
            <div className="text-2xl font-bold text-white">{stats.avgSpeed.toFixed(1)} <span className="text-sm text-slate-500">km/h</span></div>
          </div>
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-1">Allure moy</div>
            <div className="text-2xl font-bold text-white">
              {stats.avgSpeed > 0 ? formatPace(stats.avgSpeed) : '--:--'}
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="flex flex-wrap gap-2">
          {stats.elevationGain > 0 && (
            <div className="bg-slate-900 rounded-md px-3 py-2 flex items-center gap-2">
              <Mountain className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-sm font-semibold text-white">+{Math.round(stats.elevationGain)}m</div>
                <div className="text-[10px] text-slate-500">Dénivelé</div>
              </div>
            </div>
          )}
          {stats.avgHR && (
            <div className="bg-slate-900 rounded-md px-3 py-2 flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400" />
              <div>
                <div className="text-sm font-semibold text-white">{stats.avgHR} bpm</div>
                <div className="text-[10px] text-slate-500">FC moy</div>
              </div>
            </div>
          )}
          {stats.maxHR && (
            <div className="bg-slate-900 rounded-md px-3 py-2 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              <div>
                <div className="text-sm font-semibold text-white">{stats.maxHR} bpm</div>
                <div className="text-[10px] text-slate-500">FC max</div>
              </div>
            </div>
          )}
          {stats.gap && (
            <div className="bg-slate-900 rounded-md px-3 py-2 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-indigo-400" />
              <div>
                <div className="text-sm font-semibold text-white">{formatDuration(stats.gap)}</div>
                <div className="text-[10px] text-slate-500">GAP</div>
              </div>
            </div>
          )}
          {laps.length > 0 && (
            <div className="bg-slate-900 rounded-md px-3 py-2 flex items-center gap-2">
              <Flag className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-sm font-semibold text-white">{laps.length}</div>
                <div className="text-[10px] text-slate-500">Tours</div>
              </div>
            </div>
          )}
        </div>

        {/* Laps detail */}
        {laps.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-white mb-2">Tours</h3>
            <div className="space-y-px">
              {laps.map(lap => (
                <div key={lap.number} className="flex items-center justify-between text-sm px-3 py-2.5 bg-slate-900 first:rounded-t-lg last:rounded-b-lg">
                  <span className="text-slate-400">Tour {lap.number}</span>
                  <span className="text-slate-500">{formatDistance(lap.distance)}</span>
                  <span className="text-slate-300 font-mono">{formatDuration(lap.duration)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-white mb-2">Photos ({photos.length})</h3>
            <div className="flex gap-2 overflow-x-auto">
              {photos.map((photo, i) => (
                <img key={i} src={photo} alt={`Photo de l'activité ${i + 1}`} className="w-16 h-16 md:w-24 md:h-24 rounded-lg object-cover shrink-0" />
              ))}
            </div>
          </div>
        )}

        <input
          type="text"
          value={activityName}
          onChange={(e) => setActivityName(e.target.value)}
          placeholder="Nom de l'activité"
          className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
        />
      </div>

      <div className="px-4 pb-8 pt-4 border-t border-slate-900 flex gap-3">
        <button type="button" onClick={() => setStateAndRef('finished')} className="flex-1 min-w-[120px] h-12 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 flex items-center justify-center gap-2 text-sm font-medium transition-colors">
          <X className="w-4 h-4" />Retour
        </button>
        <button type="button" onClick={saveActivity} className="flex-1 h-12 rounded-lg bg-peak hover:bg-peak/90 active:bg-peak/80 text-white flex items-center justify-center gap-2 text-sm font-medium transition-colors">
          <Save className="w-4 h-4" />Sauvegarder
        </button>
      </div>
    </motion.div>
  );

  // ── Main recording screen ──
  const mainScreen = (
    <motion.div
      key="main"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-40 bg-slate-950 flex flex-col"
    >
      <ScreenLockOverlay isLocked={screenLocked} onUnlock={unlockScreen} />

      {/* Header — minimal dark */}
      <div className="px-4 pt-12 pb-3">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => {
              if (state === 'idle') cancelRecording();
              else if (state === 'recording' || state === 'paused') {
                if (window.confirm('Abandonner l\'enregistrement en cours ?')) {
                  stopRecording();
                  setTimeout(() => cancelRecording(), 100);
                }
              } else if (state === 'finished') {
                setStateAndRef('review');
              }
            }}
            className="p-2 rounded-lg hover:bg-slate-800 active:bg-slate-700 transition-colors"
          >
            {state === 'finished' ? <Save className="w-5 h-5 text-slate-300" /> : <X className="w-5 h-5 text-slate-300" />}
          </button>

          <div className="flex items-center gap-3">
            {weather && (
              <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                {getWeatherIcon()}
                <span>{weather.temperature}°C</span>
              </div>
            )}
            {batteryLevel !== null && (
              <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                {getBatteryIcon()}
                <span>{batteryLevel}%</span>
              </div>
            )}
          </div>
        </div>

        {/* GPS Status */}
        {state === 'idle' && permissionStatus === 'checking' && (
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span>Recherche du GPS...</span>
          </div>
        )}
        {state === 'idle' && (permissionStatus === 'denied' || permissionStatus === 'unsupported') && (
          <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span>GPS non disponible — activez la localisation</span>
          </div>
        )}

        {/* Sport selector */}
        <button
          onClick={() => state === 'idle' && setShowSportPicker(true)}
          className="w-full flex items-center gap-3 py-2 active:opacity-80 transition-opacity"
          disabled={state !== 'idle'}
        >
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
            {getSportIcon()}
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="font-semibold text-white truncate">{sport.nameFr}</p>
            <p className="text-xs text-slate-500 truncate">
              {selectedRoute ? selectedRoute.name : 'Appuyez pour changer'}
            </p>
          </div>
          {state === 'idle' && <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />}
        </button>

        {/* Route progress */}
        {selectedRoute && state !== 'idle' && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>{selectedRoute.name}</span>
              <span>{Math.round(routeProgress)}%</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${routeProgress}%` }} />
            </div>
          </div>
        )}

        {/* Coach session */}
        {activeCoachSession && state !== 'idle' && (
          <div className="mt-3 bg-slate-900 rounded-lg px-3 py-2">
            <p className="text-sm font-medium text-slate-300">{activeCoachSession.name}</p>
            {activeCoachSession.targetPace && (
              <p className="text-xs text-slate-500 mt-0.5">Allure cible: {formatPace(60 / (activeCoachSession.targetPace / 60))}</p>
            )}
          </div>
        )}

        {/* Auto-pause */}
        {isAutoPaused && (
          <div className="mt-2 flex items-center gap-1.5 text-amber-400 text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Pause automatique</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 overflow-y-auto">
        {/* Timer */}
        <div className="text-center mb-6">
          <div className={`font-mono font-bold tracking-tight ${
            state === 'recording' ? 'text-6xl text-white' :
            state === 'paused' ? 'text-5xl text-amber-400' :
            'text-4xl text-slate-400'
          }`}>
            <SimpleTimer seconds={stats.duration} />
          </div>
          {state === 'recording' && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                Enregistrement
              </span>
            </div>
          )}
          {state === 'paused' && (
            <span className="text-xs font-medium text-amber-400 uppercase tracking-widest mt-2 block">
              {isAutoPaused ? 'Pause automatique' : 'En pause'}
            </span>
          )}
          {state === 'finished' && (
            <span className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-2 block">
              Terminé
            </span>
          )}

          {/* Interval display */}
          {currentInterval && (
            <div className="mt-3 flex flex-col items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 text-sm font-medium">
                <Zap className="w-4 h-4 text-orange-400" />
                <span className="text-slate-300">{currentInterval.phase === 'work' ? 'Effort' : 'Récup'}</span>
                <span className="text-slate-500">| Série {currentInterval.round}/{intervalConfig?.repeats}</span>
              </div>
              <IntervalRing
                timeLeft={intervalTimeLeft}
                total={currentInterval.phase === 'work' ? (intervalConfig?.work || 60) : (intervalConfig?.rest || 30)}
                phase={currentInterval.phase}
              />
            </div>
          )}
        </div>

        {/* Primary Stats — horizontal row */}
        <div className="w-full max-w-sm mb-4">
          <div className="flex items-center justify-between py-3 border-y border-slate-800">
            <div className="flex-1 text-center">
              <div className="text-3xl font-bold text-white">
                {stats.distance < 1000 ? Math.round(stats.distance) : (stats.distance / 1000).toFixed(2)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{stats.distance < 1000 ? 'mètres' : 'km'}</div>
            </div>
            <div className="w-px h-10 bg-slate-800" />
            <div className="flex-1 text-center">
              <div className="text-3xl font-bold text-white">{formatDuration(stats.duration)}</div>
              <div className="text-xs text-slate-500 mt-0.5">durée</div>
            </div>
            <div className="w-px h-10 bg-slate-800" />
            <div className="flex-1 text-center">
              <div className="text-3xl font-bold text-white">
                {stats.avgSpeed > 0 ? formatPace(stats.avgSpeed) : '--:--'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">allure</div>
            </div>
          </div>
        </div>

        {/* Secondary Stats — compact chips */}
        <div className="flex flex-wrap gap-2 justify-center w-full max-w-sm mb-4">
          {stats.elevationGain > 0 && (
            <div className="bg-slate-900 rounded-md px-2.5 py-1.5 flex items-center gap-1.5 text-xs">
              <Mountain className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300 font-medium">+{Math.round(stats.elevationGain)}m</span>
            </div>
          )}
          {currentGPS && currentGPS.speed && currentGPS.speed > 0 && (
            <div className="bg-slate-900 rounded-md px-2.5 py-1.5 flex items-center gap-1.5 text-xs">
              <TrendingUp className="w-3.5 h-3.5 text-green-400" />
              <span className="text-slate-300 font-medium">{(currentGPS.speed * 3.6).toFixed(1)} km/h</span>
            </div>
          )}
          {hrConnected && hrData && (
            <div className="bg-slate-900 rounded-md px-2.5 py-1.5 flex items-center gap-1.5 text-xs">
              <Heart className="w-3.5 h-3.5 text-red-400" />
              <span className="text-slate-300 font-medium">{hrData.heartRate} bpm</span>
            </div>
          )}
          {stats.gap && (
            <div className="bg-slate-900 rounded-md px-2.5 py-1.5 flex items-center gap-1.5 text-xs">
              <Gauge className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-300 font-medium">{formatDuration(stats.gap)}/km</span>
            </div>
          )}
          {laps.length > 0 && (
            <div className="bg-slate-900 rounded-md px-2.5 py-1.5 flex items-center gap-1.5 text-xs">
              <Flag className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-300 font-medium">{laps.length} tour{(laps.length > 1 ? 's' : '')}</span>
            </div>
          )}
        </div>

        {/* Live Map */}
        {points.length > 1 && state !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-sm mb-3 rounded-lg overflow-hidden"
          >
            <LiveMap
              points={points}
              height={state === 'finished' ? 'h-32' : 'h-28'}
              currentPosition={currentGPS ? [currentGPS.latitude, currentGPS.longitude] : null}
              accuracy={currentGPS?.accuracy}
              segments={showSegmentsOnMap && segments.length > 0 ? segments.map(s => ({
                startLat: s.startLat, startLng: s.startLng,
                endLat: s.endLat, endLng: s.endLng,
                color: '#8B5CF6',
              })) : undefined}
            />
          </motion.div>
        )}

        {/* Activity Name (when finished) */}
        {state === 'finished' && (
          <div className="w-full max-w-sm mb-3">
            <input
              type="text"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              placeholder="Nom de l'activité (optionnel)"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-4 pb-6 pt-3 bg-slate-950 border-t border-slate-900">
        <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div
            key="idle-controls"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center justify-center gap-6"
          >
            <button
              onClick={() => setShowRoutePicker(true)}
              className="w-12 h-12 rounded-full hover:bg-slate-800 active:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <MapPin className="w-5 h-5 text-slate-400" />
            </button>
            <button
              onClick={startRecording}
              disabled={permissionStatus === 'denied' || permissionStatus === 'unsupported'}
              className="w-20 h-20 rounded-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 flex items-center justify-center transition-colors"
            >
              <Play className="w-8 h-8 fill-white text-white ml-1" />
            </button>
            <button
              onClick={() => setShowSegmentPicker(true)}
              className="w-12 h-12 rounded-full hover:bg-slate-800 active:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <Target className="w-5 h-5 text-slate-400" />
            </button>
          </motion.div>
        )}

        {state === 'recording' && (
          <motion.div
            key="recording-controls"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-4"
          >
            {/* HR */}
            {!hrConnected ? (
              <button
                onClick={connectHR}
                disabled={isScanning}
                className="w-10 h-10 rounded-full hover:bg-slate-800 active:bg-slate-700 disabled:opacity-50 flex items-center justify-center transition-colors"
              >
                <Heart className="w-4 h-4 text-slate-400" />
              </button>
            ) : (
              <button
                onClick={disconnectHR}
                className="w-10 h-10 rounded-full hover:bg-slate-800 active:bg-slate-700 flex items-center justify-center transition-colors"
                title={hrData ? `${hrData.heartRate} bpm` : 'Connecté'}
              >
                <BluetoothConnected className="w-4 h-4 text-slate-400" />
              </button>
            )}

            {/* Lap */}
            <button
              onClick={markLap}
              className="w-10 h-10 rounded-full hover:bg-slate-800 active:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <Flag className="w-4 h-4 text-slate-400" />
            </button>

            {/* Pause */}
            <button
              onClick={pauseRecording}
              className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 flex items-center justify-center transition-colors"
            >
              <Pause className="w-6 h-6 fill-white text-white" />
            </button>

            {/* Stop */}
            <button
              onClick={stopRecording}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 flex items-center justify-center transition-colors"
            >
              <Square className="w-6 h-6 fill-white text-white" />
            </button>

            {/* Lock */}
            <button
              onClick={lockScreen}
              className="w-10 h-10 rounded-full hover:bg-slate-800 active:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <Lock className="w-4 h-4 text-slate-400" />
            </button>

            {/* Photo */}
            <button
              onClick={takePhoto}
              className="w-10 h-10 rounded-full hover:bg-slate-800 active:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <Camera className="w-4 h-4 text-slate-400" />
            </button>

            {/* Intervals */}
            {!intervalConfig && (
              <button
                onClick={startIntervalMode}
                className="w-10 h-10 rounded-full hover:bg-slate-800 active:bg-slate-700 flex items-center justify-center transition-colors"
              >
                <Zap className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </motion.div>
        )}

        {state === 'paused' && (
          <motion.div
            key="paused-controls"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center justify-center gap-6"
          >
            <button
              onClick={resumeRecording}
              className="w-16 h-16 rounded-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 flex items-center justify-center transition-colors"
            >
              <Play className="w-7 h-7 fill-white text-white ml-1" />
            </button>
            <button
              onClick={stopRecording}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 active:bg-red-700 flex items-center justify-center transition-colors"
            >
              <Square className="w-7 h-7 fill-white text-white" />
            </button>
          </motion.div>
        )}

        {state === 'finished' && (
          <motion.div
            key="finished-controls"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex items-center justify-center gap-3 w-full max-w-sm"
          >
            <button
              onClick={cancelRecording}
              className="flex-1 h-12 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
            >
              <X className="w-4 h-4" />
              Supprimer
            </button>
            <button
              onClick={() => setStateAndRef('review')}
              className="flex-1 h-12 rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white flex items-center justify-center gap-2 text-sm font-medium transition-colors"
            >
              <Save className="w-4 h-4" />
              Voir le résumé
            </button>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Extra controls */}
        {state === 'recording' && (
          <div className="flex items-center justify-center gap-4 mt-3">
            <button
              onClick={() => {
                autoPauseEnabledRef.current = !autoPauseEnabledRef.current;
                toast.info(autoPauseEnabledRef.current ? 'Auto-pause activée' : 'Auto-pause désactivée');
              }}
              className={`text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-colors ${
                autoPauseEnabledRef.current
                  ? 'text-slate-300 bg-slate-800'
                  : 'text-slate-600'
              }`}
            >
              {autoPauseEnabledRef.current ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              Auto-pause
            </button>
            <span className="text-[10px] text-slate-600">
              {gpsHighAccuracy ? 'GPS haute précision' : 'GPS économie'}
            </span>
          </div>
        )}
      </div>

      {/* GPS Status Bar */}
      {currentGPS && state !== 'idle' && (
        <div className="px-4 py-1.5 bg-slate-900 border-t border-slate-800">
          <div className="flex items-center justify-between text-[10px] text-slate-500 max-w-sm mx-auto">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              <span>±{Math.round(currentGPS.accuracy)}m</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>{points.length} pts</span>
            </div>
            {currentGPS.altitude && (
              <div className="flex items-center gap-1.5">
                <Mountain className="w-3 h-3" />
                <span>{Math.round(currentGPS.altitude)}m</span>
              </div>
            )}
            {selectedRoute && (
              <div className="flex items-center gap-1.5">
                <Navigation className="w-3 h-3" />
                <span>{Math.round(routeProgress)}%</span>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );

  return (
    <>
      {/* Hidden file input for GPX upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".gpx"
        className="hidden"
        onChange={handleGpxUpload}
      />

      {/* Create Segment Modal */}
      {showCreateSegment && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center" onClick={() => setShowCreateSegment(false)}>
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="bg-slate-900 rounded-t-2xl w-full max-w-lg p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Créer un segment</h3>
              <button onClick={() => setShowCreateSegment(false)} className="p-2 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={newSegmentName}
                onChange={(e) => setNewSegmentName(e.target.value)}
                placeholder="Nom du segment"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50"
              />

              <div className="bg-slate-800/50 rounded-lg p-3 text-sm text-slate-400">
                <p>Sélectionnez le start et end sur le tracé :</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      if (points.length > 0) {
                        setSegmentStartIdx(Math.max(0, points.length - 1));
                        toast.info('Start défini à la position actuelle');
                      }
                    }}
                    className="flex-1 h-10 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
                  >
                    Définir Start ici
                  </button>
                  <button
                    onClick={() => {
                      if (points.length > 0) {
                        setSegmentEndIdx(Math.max(0, points.length - 1));
                        toast.info('End défini à la position actuelle');
                      }
                    }}
                    className="flex-1 h-10 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
                  >
                    Définir End ici
                  </button>
                </div>
              </div>

              {segmentStartIdx !== null && segmentEndIdx !== null && (
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-sm text-slate-300">
                    Distance: {formatDistance(haversine(points[segmentStartIdx].gps, points[segmentEndIdx].gps))}
                  </p>
                </div>
              )}

              <button
                onClick={createSegmentFromActivity}
                disabled={segmentStartIdx === null || segmentEndIdx === null}
                className="w-full h-12 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
              >
                Créer le segment
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Ghost Race Indicator */}
      {ghostRaceMode && ghostState && state === 'recording' && (
        <div className="fixed top-20 left-4 right-4 z-40 bg-slate-900/95 backdrop-blur-sm rounded-xl border border-orange-500/30 p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ghost className="w-4 h-4 text-orange-400" />
              <div>
                <p className="text-sm font-medium text-white">{ghostState.segmentName}</p>
                <p className="text-xs text-slate-500">PR: {formatDuration(ghostState.prTime)}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold font-mono ${
                ghostState.currentOffset > 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {ghostState.currentOffset > 0 ? '+' : ''}{ghostState.currentOffset.toFixed(1)}s
              </div>
              <p className="text-[10px] text-slate-500">{ghostState.currentOffset > 0 ? 'en avance' : 'en retard'}</p>
            </div>
          </div>
          <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                ghostState.currentOffset > 0 ? 'bg-emerald-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, 50 + ghostState.currentOffset))}%` }}
            />
          </div>
          <button
            onClick={() => { setGhostRaceMode(false); setGhostState(null); }}
            className="mt-2 text-xs text-slate-500 hover:text-slate-300"
          >
            Quitter le ghost race
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {state === 'review' ? reviewScreen : mainScreen}
      </AnimatePresence>
    </>
  );
}
