/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { SportPicker } from './SportPicker';
import type { SportType } from '@/types/sports';
import { SPORTS, getSportCategory } from '@/types/sports';
import { LiveMap } from './LiveMap';
import { SimpleTimer } from './SimpleTimer';
import { IntervalRing } from './IntervalRing';
import { RecordingStatsPanel } from './RecordingStatsPanel';
import { RecordingControls } from './RecordingControls';
import { CoachSessionBanner } from './CoachSessionBanner';
import { LapListSheet } from './LapListSheet';
import { RouteSelectionSheet } from './RouteSelectionSheet';
import { SegmentRacingPanel } from './SegmentRacingPanel';
import { logger } from '@/lib/logger';
interface WakeLockSentinel {
  release: () => Promise<void>;
  type: string;
  released: boolean;
}
import {
  MapPin, Navigation, Mountain, X, Save,
  Battery, BatteryMedium, BatteryLow, Footprints, Bike, Waves,
  Heart, Sun, CloudSun, Cloud, CloudDrizzle, CloudRain, CloudSnow,
  CloudLightning, Flag, Zap,
  AlertTriangle, Gauge, ChevronRight, Ghost,
} from '@/components/ui/icons';
import { createGPSFilter, isSpuriousJump, type FilteredGPSPoint } from '@/lib/gpsFilter';
import { useBluetoothHR } from '@/lib/hooks/useBluetoothHR';
import { useScreenLock, ScreenLockOverlay } from '@/lib/screenLock';
import {
  saveCheckpoint, clearCheckpoint, loadCheckpoint,
  enqueueSave, processSaveQueue, type LapData, type RecordingCheckpoint,
} from '@/lib/offlineQueue';
import { fetchWeather, type WeatherData } from '@/lib/weather';
/**
 * Logger utility for recording activity data
 */

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
  startTime: number; // timestamp when ghost race started
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
      const nav = navigator as any;
      if ('getBattery' in navigator && nav.getBattery) {
        nav.getBattery().then((battery: any) => {
          battery.removeEventListener('levelchange', updateBatteryLevel);
        });
      }
    } catch { /* silent */ }
    releaseWakeLock();
    if (stationaryTimerRef.current) clearTimeout(stationaryTimerRef.current);
  };
  const requestWakeLock = async () => {
    try {
      if ((navigator as any).wakeLock) {
        (navigator as any).wakeLock.request('screen').then((lock: any) => { wakeLockRef.current = lock; });
      }
    } catch { /* silent */ }
  };
  const releaseWakeLock = () => {
    (wakeLockRef.current as any)?.release();
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
      const nav = navigator as any;
      if (nav.getBattery) {
        const battery = await nav.getBattery();
        setBatteryLevel(Math.round(battery.level * 100));
        battery.removeEventListener('levelchange', updateBatteryLevel);
        battery.addEventListener('levelchange', updateBatteryLevel);
      }
    } catch { /* silent */ }
  };
  const updateBatteryLevel = () => {
    try {
      const nav = navigator as any;
      if (nav.getBattery) {
        nav.getBattery().then((battery: any) => {
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
        const nav = navigator as any;
        if (nav.getBattery) {
          nav.getBattery().then((battery: any) => {
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
          avgSpeed: stats.duration > 0 ? Math.round((stats.distance / stats.duration) * 100) / 100 : 0,
        } as any);
        activityId = result?.id ?? null;
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
        setUserRoutes(result.routes.map((r) => ({
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
          setNearbySegments((result.segments as unknown as Array<Record<string, unknown>>).map((s) => ({
            id: String(s.id),
            name: String(s.name || ''),
            description: s.description as string | undefined,
            startLat: Number(s.start_lat) || 0,
            startLng: Number(s.start_lng) || 0,
            endLat: Number(s.end_lat) || 0,
            endLng: Number(s.end_lng) || 0,
            distance: Number(s.distance) || 0,
            elevationGain: Number(s.elevation_gain) || 0,
            personalRecord: s.pr_time ? Number(s.pr_time) : undefined,
          })));
        }
      }
    } catch { /* silent */ }
  };
  const loadActiveCoachSession = async () => {
    try {
      const plan = await api.getActivePlan();
      if (plan?.sessions && plan.sessions.length > 0) {
        const session = plan.sessions[0] as unknown as Record<string, unknown>;
        setActiveCoachSession({
          id: String((session.id as number) || plan.planId || ''),
          name: (session.name as string) || (plan.plan?.name as string) || 'Séance',
          type: (session.type as string) || 'run',
          duration: (session.estimated_duration as number) || (session.duration as number) || 3600,
          distance: session.distance as number | undefined,
          targetPace: session.target_pace as number | undefined,
          targetHeartRateZone: session.target_hr_zone ? { min: (session.target_hr_zone as { min: number }).min, max: (session.target_hr_zone as { max: number }).max } : undefined,
          intervalStructure: session.interval_structure as Array<{ work: number; rest: number; repeats: number }> | undefined,
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
      const bestEffort = efforts?.efforts?.[0];
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
        startTime: Date.now(),
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
    // Calculate ghost position based on time elapsed since start
    const elapsed = (Date.now() - ghostState.startTime) / 1000;
    const ghostProgress = Math.min(100, (elapsed / ghostState.prTime) * 100);
    // Interpolate ghost position
    const ghostLat = selectedRaceSegment.startLat + (selectedRaceSegment.endLat - selectedRaceSegment.startLat) * (ghostProgress / 100);
    const ghostLng = selectedRaceSegment.startLng + (selectedRaceSegment.endLng - selectedRaceSegment.startLng) * (ghostProgress / 100);
    // Calculate time offset: positive if user is ahead, negative if behind
    const userExpectedTime = (progress / 100) * ghostState.prTime;
    const offset = userExpectedTime - elapsed;
    setGhostState(prev => prev ? {
      ...prev,
      currentOffset: offset, // Positive = ahead, Negative = behind
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
  const getWeatherIcon = () => {
    if (!weather) return null;
    const cls = "w-5 h-5 text-foreground/80";
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
        className="fixed inset-0 z-modal-backdrop bg-foreground/70 flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-background rounded-t-2xl shadow-2xl w-full max-w-[90vw] lg:max-w-lg max-h-[85vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-4 border-b border-surface flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-surface transition-colors">
              <X className="w-5 h-5 text-muted" />
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
              <RouteSelectionSheet
                userRoutes={userRoutes}
                loadingRoutes={loadingRoutes}
                onSelect={(route) => { setSelectedRoute(route); setShowRoutePicker(false); toast.info(`Parcours: ${route.name}`); }}
                onClose={() => setShowRoutePicker(false)}
                formatDistance={formatDistance}
              />
            )}
            {showSegmentPicker && (
              <SegmentRacingPanel
                nearbySegments={nearbySegments}
                showSegmentsOnMap={showSegmentsOnMap}
                activeSegment={activeSegment}
                onToggleShowOnMap={setShowSegmentsOnMap}
                onGhostRace={(seg) => { setShowSegmentPicker(false); startGhostRace(seg); }}
                onImportGpx={() => { setShowSegmentPicker(false); fileInputRef.current?.click(); }}
                onCreateSegment={() => { setShowSegmentPicker(false); setShowCreateSegment(true); }}
                onClose={() => setShowSegmentPicker(false)}
                formatDistance={formatDistance}
                formatDuration={formatDuration}
              />
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
      className="fixed inset-0 z-modal bg-background flex flex-col"
    >
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
            {getSportIcon()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Résumé de l&apos;activité</h2>
            <p className="text-xs text-muted">{activityName || sport.nameFr}</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Primary Stats — 2x2 grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface rounded-lg p-4">
            <div className="text-xs text-muted mb-1">Distance</div>
            <div className="text-2xl font-bold text-foreground">{formatDistance(stats.distance)}</div>
          </div>
          <div className="bg-surface rounded-lg p-4">
            <div className="text-xs text-muted mb-1">Durée</div>
            <div className="text-2xl font-bold text-foreground">{formatDuration(stats.duration)}</div>
          </div>
          <div className="bg-surface rounded-lg p-4">
            <div className="text-xs text-muted mb-1">Vitesse moy</div>
            <div className="text-2xl font-bold text-foreground">{stats.avgSpeed.toFixed(1)} <span className="text-sm text-muted">km/h</span></div>
          </div>
          <div className="bg-surface rounded-lg p-4">
            <div className="text-xs text-muted mb-1">Allure moy</div>
            <div className="text-2xl font-bold text-foreground">
              {stats.avgSpeed > 0 ? formatPace(stats.avgSpeed) : '--:--'}
            </div>
          </div>
        </div>
        {/* Secondary Stats */}
        <div className="flex flex-wrap gap-2">
          {stats.elevationGain > 0 && (
            <div className="bg-surface rounded-md px-3 py-2 flex items-center gap-2">
              <Mountain className="w-4 h-4 text-success" />
              <div>
                <div className="text-sm font-semibold text-foreground">+{Math.round(stats.elevationGain)}m</div>
                <div className="text-[10px] text-muted">Dénivelé</div>
              </div>
            </div>
          )}
          {stats.avgHR && (
            <div className="bg-surface rounded-md px-3 py-2 flex items-center gap-2">
              <Heart className="w-4 h-4 text-danger/80" />
              <div>
                <div className="text-sm font-semibold text-foreground">{stats.avgHR} bpm</div>
                <div className="text-[10px] text-muted">FC moy</div>
              </div>
            </div>
          )}
          {stats.maxHR && (
            <div className="bg-surface rounded-md px-3 py-2 flex items-center gap-2">
              <Heart className="w-4 h-4 text-danger-400" />
              <div>
                <div className="text-sm font-semibold text-foreground">{stats.maxHR} bpm</div>
                <div className="text-[10px] text-muted">FC max</div>
              </div>
            </div>
          )}
          {stats.gap && (
            <div className="bg-surface rounded-md px-3 py-2 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-secondary" />
              <div>
                <div className="text-sm font-semibold text-foreground">{formatDuration(stats.gap)}</div>
                <div className="text-[10px] text-muted">GAP</div>
              </div>
            </div>
          )}
          {laps.length > 0 && (
            <div className="bg-surface rounded-md px-3 py-2 flex items-center gap-2">
              <Flag className="w-4 h-4 text-warning" />
              <div>
                <div className="text-sm font-semibold text-foreground">{laps.length}</div>
                <div className="text-[10px] text-muted">Tours</div>
              </div>
            </div>
          )}
        </div>
        <LapListSheet
          laps={laps}
          formatDistance={formatDistance}
          formatDuration={formatDuration}
        />
        {/* Photos */}
        {photos.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Photos ({photos.length})</h3>
            <div className="flex gap-2 overflow-x-auto">
              {photos.map((photo, i) => (
                /* eslint-disable-next-line @next/next/no-img-element */
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
          className="w-full px-4 py-3 bg-surface border border-surface rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-peak/50 focus:ring-1 focus:ring-peak/20"
        />
      </div>
      <div className="px-4 pb-8 pt-4 border-t border-surface flex gap-3">
        <button type="button" onClick={() => setStateAndRef('finished')} className="flex-1 min-w-[120px] h-12 rounded-lg bg-surface hover:bg-surface-hover active:bg-muted text-foreground flex items-center justify-center gap-2 text-sm font-medium transition-colors">
          <X className="w-4 h-4" />Retour
        </button>
        <button type="button" onClick={saveActivity} className="flex-1 h-12 rounded-lg bg-peak hover:bg-peak/90 active:bg-peak/80 text-foreground flex items-center justify-center gap-2 text-sm font-medium transition-colors">
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
      className="fixed inset-0 z-modal bg-background flex flex-col"
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
            className="p-2 rounded-lg hover:bg-surface active:bg-surface-hover transition-colors"
          >
            {state === 'finished' ? <Save className="w-5 h-5 text-foreground" /> : <X className="w-5 h-5 text-foreground" />}
          </button>
          <div className="flex items-center gap-3">
            {weather && (
              <div className="flex items-center gap-1.5 text-muted text-sm">
                {getWeatherIcon()}
                <span>{weather.temperature}°C</span>
              </div>
            )}
            {batteryLevel !== null && (
              <div className="flex items-center gap-1.5 text-muted text-sm">
                {getBatteryIcon()}
                <span>{batteryLevel}%</span>
              </div>
            )}
          </div>
        </div>
        {/* GPS Status */}
        {state === 'idle' && permissionStatus === 'checking' && (
          <div className="flex items-center gap-2 text-muted text-sm mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-warning" />
            </span>
            <span>Recherche du GPS...</span>
          </div>
        )}
        {state === 'idle' && (permissionStatus === 'denied' || permissionStatus === 'unsupported') && (
          <div className="flex items-center gap-2 text-danger/80 text-sm mb-2">
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
          <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center shrink-0">
            {getSportIcon()}
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate">{sport.nameFr}</p>
            <p className="text-xs text-muted truncate">
              {selectedRoute ? selectedRoute.name : 'Appuyez pour changer'}
            </p>
          </div>
          {state === 'idle' && <ChevronRight className="w-4 h-4 text-muted shrink-0" />}
        </button>
        {/* Route progress */}
        {selectedRoute && state !== 'idle' && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted mb-1">
              <span>{selectedRoute.name}</span>
              <span>{Math.round(routeProgress)}%</span>
            </div>
            <div className="h-1 bg-surface rounded-full overflow-hidden">
              <div className="h-full bg-peak rounded-full transition-all duration-500" style={{ width: `${routeProgress}%` }} />
            </div>
          </div>
        )}
        {/* Coach session */}
        {activeCoachSession && state !== 'idle' && (
          <CoachSessionBanner session={activeCoachSession} formatPace={formatPace} />
        )}
        {/* Auto-pause */}
        {isAutoPaused && (
          <div className="mt-2 flex items-center gap-1.5 text-warning text-xs">
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
            state === 'recording' ? 'text-6xl text-foreground' :
            state === 'paused' ? 'text-5xl text-warning' :
            'text-4xl text-muted'
          }`}>
            <SimpleTimer seconds={stats.duration} />
          </div>
          {state === 'recording' && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-danger" />
              </span>
              <span className="text-xs font-medium text-muted uppercase tracking-widest">
                Enregistrement
              </span>
            </div>
          )}
          {state === 'paused' && (
            <span className="text-xs font-medium text-warning uppercase tracking-widest mt-2 block">
              {isAutoPaused ? 'Pause automatique' : 'En pause'}
            </span>
          )}
          {state === 'finished' && (
            <span className="text-xs font-medium text-muted uppercase tracking-widest mt-2 block">
              Terminé
            </span>
          )}
          {/* Interval display */}
          {currentInterval && (
            <div className="mt-3 flex flex-col items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface text-sm font-medium">
                <Zap className="w-4 h-4 text-peak/80" />
                <span className="text-foreground">{currentInterval.phase === 'work' ? 'Effort' : 'Récup'}</span>
                <span className="text-muted">| Série {currentInterval.round}/{intervalConfig?.repeats}</span>
              </div>
              <IntervalRing
                timeLeft={intervalTimeLeft}
                total={currentInterval.phase === 'work' ? (intervalConfig?.work || 60) : (intervalConfig?.rest || 30)}
                phase={currentInterval.phase}
              />
            </div>
          )}
        </div>
        <RecordingStatsPanel
          stats={stats}
          currentGPS={currentGPS}
          hrConnected={hrConnected}
          hrData={hrData}
          laps={laps}
          formatPace={formatPace}
          formatDuration={formatDuration}
        />
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
                color: 'var(--secondary)',
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
              className="w-full px-4 py-3 bg-surface border border-surface rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-peak/50 focus:ring-1 focus:ring-peak/20"
            />
          </div>
        )}
      </div>
      <RecordingControls
        state={state}
        permissionStatus={permissionStatus}
        isScanning={isScanning}
        hrConnected={hrConnected}
        intervalConfig={intervalConfig}
        gpsHighAccuracy={gpsHighAccuracy}
        autoPauseEnabled={autoPauseEnabledRef.current}
        onStart={startRecording}
        onPause={pauseRecording}
        onResume={resumeRecording}
        onStop={stopRecording}
        onMarkLap={markLap}
        onTakePhoto={takePhoto}
        onConnectHR={connectHR}
        onDisconnectHR={disconnectHR}
        onLockScreen={lockScreen}
        onStartInterval={startIntervalMode}
        onCancel={cancelRecording}
        onReview={() => setStateAndRef('review')}
        onShowRoutePicker={() => setShowRoutePicker(true)}
        onShowSegmentPicker={() => setShowSegmentPicker(true)}
        onToggleAutoPause={() => {
          autoPauseEnabledRef.current = !autoPauseEnabledRef.current;
          toast.info(autoPauseEnabledRef.current ? 'Auto-pause activée' : 'Auto-pause désactivée');
        }}
      />
      {/* GPS Status Bar */}
      {currentGPS && state !== 'idle' && (
        <div className="px-4 py-1.5 bg-surface border-t border-surface">
          <div className="flex items-center justify-between text-[10px] text-muted max-w-sm mx-auto">
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
        <div className="fixed inset-0 z-50 bg-foreground/70 flex items-end justify-center" onClick={() => setShowCreateSegment(false)}>
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="bg-surface rounded-t-2xl w-full max-w-lg p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Créer un segment</h3>
              <button onClick={() => setShowCreateSegment(false)} className="p-2 rounded-lg hover:bg-surface">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={newSegmentName}
                onChange={(e) => setNewSegmentName(e.target.value)}
                placeholder="Nom du segment"
                className="w-full px-4 py-3 bg-surface border border-surface rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-peak/50"
              />
              <div className="bg-surface/50 rounded-lg p-3 text-sm text-muted">
                <p>Sélectionnez le start et end sur le tracé :</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      if (points.length > 0) {
                        setSegmentStartIdx(Math.max(0, points.length - 1));
                        toast.info('Start défini à la position actuelle');
                      }
                    }}
                    className="flex-1 h-10 rounded-md bg-success hover:bg-success/90 text-foreground text-sm font-medium transition-colors"
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
                    className="flex-1 h-10 rounded-md bg-danger hover:bg-danger/90 text-foreground text-sm font-medium transition-colors"
                  >
                    Définir End ici
                  </button>
                </div>
              </div>
              {segmentStartIdx !== null && segmentEndIdx !== null && (
                <div className="bg-surface rounded-lg p-3">
                  <p className="text-sm text-foreground">
                    Distance: {formatDistance(haversine(points[segmentStartIdx].gps, points[segmentEndIdx].gps))}
                  </p>
                </div>
              )}
              <button
                onClick={createSegmentFromActivity}
                disabled={segmentStartIdx === null || segmentEndIdx === null}
                className="w-full h-12 rounded-lg bg-peak hover:bg-peak/90 disabled:opacity-50 disabled:cursor-not-allowed text-foreground font-medium transition-colors"
              >
                Créer le segment
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Ghost Race Indicator */}
      {ghostRaceMode && ghostState && state === 'recording' && (
        <div className="fixed top-20 left-4 right-4 z-40 bg-surface/95 backdrop-blur-sm rounded-xl border border-peak/30 p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ghost className="w-4 h-4 text-peak/80" />
              <div>
                <p className="text-sm font-medium text-foreground">{ghostState.segmentName}</p>
                <p className="text-xs text-muted">PR: {formatDuration(ghostState.prTime)}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold font-mono ${
                ghostState.currentOffset > 0 ? 'text-success/80' : 'text-danger/80'
              }`}>
                {ghostState.currentOffset > 0 ? '+' : ''}{ghostState.currentOffset.toFixed(1)}s
              </div>
              <p className="text-[10px] text-muted">{ghostState.currentOffset > 0 ? 'en avance' : 'en retard'}</p>
            </div>
          </div>
          <div className="mt-2 h-1.5 bg-surface rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                ghostState.currentOffset > 0 ? 'bg-success' : 'bg-danger'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, 50 + ghostState.currentOffset))}%` }}
            />
          </div>
          <button
            onClick={() => { setGhostRaceMode(false); setGhostState(null); }}
            className="mt-2 text-xs text-muted hover:text-foreground"
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
