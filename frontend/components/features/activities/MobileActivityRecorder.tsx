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
  Play, Pause, Square, MapPin, Navigation, Mountain, ChevronDown, X, Save,
  Battery, BatteryMedium, BatteryLow, Target, TrendingUp, Footprints, Bike, Waves,
  Heart, Lock, Camera, Sun, CloudSun, Cloud, CloudDrizzle, CloudRain, CloudSnow,
  CloudLightning, Flag, Clock, Zap, BluetoothConnected,
  AlertTriangle, Eye, EyeOff, Gauge,
} from 'lucide-react';
import { createGPSFilter, isSpuriousJump, type FilteredGPSPoint } from '@/lib/gpsFilter';
import { useBluetoothHR } from '@/lib/hooks/useBluetoothHR';
import { useScreenLock, ScreenLockOverlay } from '@/lib/screenLock';
import {
  saveCheckpoint, clearCheckpoint, loadCheckpoint,
  enqueueSave, processSaveQueue, type LapData, type RecordingCheckpoint,
} from '@/lib/offlineQueue';
import { fetchWeather, type WeatherData } from '@/lib/weather';

function LiveMap({ points, height = 'h-48' }: { points: Array<{ gps: { latitude: number; longitude: number } }>; height?: string }) {
  const latlng: [number, number][] = points.map(p => [p.gps.latitude, p.gps.longitude]);
  return <ActivityMap latlng={latlng} className={height} color="#3B82F6" />;
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
    return () => { cleanup(); };
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

  const startRecording = async () => {
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
          } else if (!nowInSegment && activeSegment) {
            const segDuration = (Date.now() - (segmentStartTime || Date.now())) / 1000;
              if ((activeSegment.personalRecord ?? Infinity) > segDuration) {
              setSegments(prevSegments =>
                prevSegments.map(seg =>
                  seg.id === activeSegment.id ? { ...seg, personalRecord: segDuration } : seg
                )
              );
            }
            setActiveSegment(null);
            setSegmentStartTime(null);
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
      setStateAndRef('paused');
      startTimeRef.current = Date.now() - (stats.duration * 1000);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const resumeRecording = () => {
    if (stateRef.current === 'paused') {
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

  const saveActivity = async () => {
    try {
      const name = activityName || `${sport.nameFr} - ${new Date().toLocaleDateString('fr-FR')}`;

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
          ...laps.map(lap =>
            `<wpt lat="${points[Math.min(points.length - 1, Math.floor(lap.distance / (stats.distance / points.length)))].gps.latitude.toFixed(6)}" lon="${points[Math.min(points.length - 1, Math.floor(lap.distance / (stats.distance / points.length)))].gps.longitude.toFixed(6)}"><name>Tour ${lap.number}</name></wpt>`
          ),
          '</trkseg></trk></gpx>',
        ].join('\n');

        try {
          await api.importGpx(name, gpxLines, activityType);
        } catch {
          enqueueSave({ gpxData: gpxLines, name, type: activityType, timestamp: Date.now(), retries: 0 });
          toast.success('Activité mise en file d\'attente (hors-ligne)');
          resetState();
          onSave?.();
          return;
        }
      } else {
        await (api as any).createActivity({
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
      // Load nearby segments based on last known position (if available)
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

  // ── Picker overlays ──
  if (showSportPicker || showRoutePicker || showSegmentPicker) {
    const title = showSportPicker ? 'Choisir un sport' : showRoutePicker ? 'Choisir un parcours' : 'Gérer les segments';
    const onClose = showSportPicker ? () => setShowSportPicker(false) :
                    showRoutePicker ? () => setShowRoutePicker(false) :
                    () => setShowSegmentPicker(false);

    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
        <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5 text-slate-500" />
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
              <div className="space-y-3">
                {loadingRoutes && <p className="text-center text-slate-500">Chargement...</p>}
                {!loadingRoutes && userRoutes.length === 0 && (
                  <p className="text-center text-slate-500 py-8">Aucun parcours enregistré</p>
                )}
                {userRoutes.map(route => (
                  <button
                    key={route.id}
                    onClick={() => { setSelectedRoute(route); setShowRoutePicker(false); toast.info(`Parcours: ${route.name}`); }}
                    className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-colors"
                  >
                    <p className="font-medium text-slate-900 dark:text-white">{route.name}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {formatDistance(route.distance)} · {Math.round(route.elevationGain)}m D+
                    </p>
                  </button>
                ))}
                <Button onClick={onClose} className="w-full">Retour</Button>
              </div>
            )}
            {showSegmentPicker && (
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 mb-3">
                  <input type="checkbox" checked={showSegmentsOnMap} onChange={e => setShowSegmentsOnMap(e.target.checked)} className="rounded" />
                  Afficher les segments sur la carte
                </label>
                {nearbySegments.length === 0 && (
                  <p className="text-center text-slate-500 py-8">Aucun segment à proximité</p>
                )}
                {nearbySegments.map(seg => (
                  <div key={seg.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-900 dark:text-white">{seg.name}</p>
                      {seg.personalRecord && (
                        <span className="text-xs text-green-500 font-mono">{formatDuration(seg.personalRecord)}</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{formatDistance(seg.distance)} · {Math.round(seg.elevationGain)}m D+</p>
                  </div>
                ))}
                {activeSegment && (
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Segment en cours: {activeSegment.name}</p>
                  </div>
                )}
                <Button onClick={onClose} className="w-full">Retour</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Summary/Review Screen ──
  if (state === 'review') {
    return (
      <div className="fixed inset-0 z-40 bg-white dark:bg-slate-950 flex flex-col">
        <div className={`bg-gradient-to-r ${getSportColor()} text-white px-4 pt-12 pb-8`}>
          <h2 className="text-xl font-bold text-center">Résumé de l&apos;activité</h2>
          <p className="text-center text-white/70 text-sm mt-1">{activityName || sport.nameFr}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 text-center">
              <Navigation className="w-5 h-5 mx-auto mb-1 text-blue-500" />
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatDistance(stats.distance)}</div>
              <div className="text-xs text-slate-500">Distance</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 text-center">
              <Clock className="w-5 h-5 mx-auto mb-1 text-purple-500" />
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatDuration(stats.duration)}</div>
              <div className="text-xs text-slate-500">Durée</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 text-center">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-500" />
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.avgSpeed.toFixed(1)}</div>
              <div className="text-xs text-slate-500">km/h moy</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 text-center">
              <Target className="w-5 h-5 mx-auto mb-1 text-orange-500" />
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.avgSpeed > 0 ? formatPace(stats.avgSpeed) : '--:--'}
              </div>
              <div className="text-xs text-slate-500">Allure moy</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {stats.elevationGain > 0 && (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 text-center">
                <Mountain className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                <div className="font-semibold text-slate-900 dark:text-white">+{Math.round(stats.elevationGain)}m</div>
                <div className="text-xs text-slate-500">Dénivelé</div>
              </div>
            )}
            {stats.avgHR && (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 text-center">
                <Heart className="w-4 h-4 mx-auto mb-1 text-red-500" />
                <div className="font-semibold text-slate-900 dark:text-white">{stats.avgHR} bpm</div>
                <div className="text-xs text-slate-500">FC moy</div>
              </div>
            )}
            {stats.maxHR && (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 text-center">
                <Heart className="w-4 h-4 mx-auto mb-1 text-rose-500" />
                <div className="font-semibold text-slate-900 dark:text-white">{stats.maxHR} bpm</div>
                <div className="text-xs text-slate-500">FC max</div>
              </div>
            )}
            {stats.gap && (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 text-center">
                <Gauge className="w-4 h-4 mx-auto mb-1 text-indigo-500" />
                <div className="font-semibold text-slate-900 dark:text-white">{formatPace(60 / (stats.gap / 60))}</div>
                <div className="text-xs text-slate-500">GAP</div>
              </div>
            )}
            {laps.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 text-center">
                <Flag className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                <div className="font-semibold text-slate-900 dark:text-white">{laps.length}</div>
                <div className="text-xs text-slate-500">Tours</div>
              </div>
            )}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 text-center">
              <MapPin className="w-4 h-4 mx-auto mb-1 text-slate-500" />
              <div className="font-semibold text-slate-900 dark:text-white">{points.length}</div>
              <div className="text-xs text-slate-500">Points GPS</div>
            </div>
          </div>

          {/* Laps detail */}
          {laps.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Tours</h3>
              <div className="space-y-1">
                {laps.map(lap => (
                  <div key={lap.number} className="flex items-center justify-between text-sm px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Tour {lap.number}</span>
                    <span className="text-slate-500">{formatDistance(lap.distance)}</span>
                    <span className="text-slate-500 font-mono">{formatDuration(lap.duration)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Photos */}
          {photos.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Photos ({photos.length})</h3>
              <div className="flex gap-2 overflow-x-auto">
                {photos.map((photo, i) => (
                  <img key={i} src={photo} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
                ))}
              </div>
            </div>
          )}

          <input
            type="text"
            value={activityName}
            onChange={(e) => setActivityName(e.target.value)}
            placeholder="Nom de l'activité"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <div className="px-4 pb-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <Button onClick={() => setStateAndRef('finished')} variant="secondary" className="flex-1 h-14">
            <X className="w-5 h-5 mr-2" />Modifier
          </Button>
          <Button onClick={saveActivity} className="flex-1 h-14 bg-gradient-to-r from-blue-600 to-blue-500">
            <Save className="w-5 h-5 mr-2" />Sauvegarder
          </Button>
        </div>
      </div>
    );
  }

  // ── Main recording screen ──
  return (
    <div className="fixed inset-0 z-40 bg-white dark:bg-slate-950 flex flex-col">
      <ScreenLockOverlay isLocked={screenLocked} onUnlock={unlockScreen} />

      {/* Header */}
      <div className={`bg-gradient-to-r ${getSportColor()} text-white px-4 pt-12 pb-4`}>
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
            className="p-2 rounded-xl bg-white/20 active:scale-95 transition-transform"
          >
            {state === 'finished' ? <Save className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2">
            {/* Weather */}
            {weather && (
              <div className="flex items-center gap-1 bg-white/20 px-2.5 py-1.5 rounded-full text-xs">
                {getWeatherIcon()}
                <span>{weather.temperature}°C</span>
              </div>
            )}
            {batteryLevel !== null && (
              <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-full text-sm">
                {getBatteryIcon()}
                <span>{batteryLevel}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Sport + Route picker */}
        <button
          onClick={() => state === 'idle' && setShowSportPicker(true)}
          className="w-full flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-2xl p-3 active:scale-[0.98] transition-transform"
          disabled={state !== 'idle'}
        >
          <div className="w-10 h-10 bg-white/25 rounded-xl flex items-center justify-center shrink-0">
            {getSportIcon()}
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="font-bold truncate">{sport.nameFr}</p>
            <p className="text-xs text-white/80 truncate">
              {selectedRoute ? selectedRoute.name : sport.name}
            </p>
          </div>
          {state === 'idle' && <ChevronDown className="w-4 h-4 text-white/60 shrink-0" />}
        </button>

        {/* Route progress bar */}
        {selectedRoute && state !== 'idle' && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-white/70 mb-1">
              <span>{selectedRoute.name}</span>
              <span>{Math.round(routeProgress)}%</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white/60 rounded-full transition-all duration-500" style={{ width: `${routeProgress}%` }} />
            </div>
          </div>
        )}

        {/* Coach session info */}
        {activeCoachSession && state !== 'idle' && (
          <div className="mt-2 bg-white/10 rounded-xl px-3 py-2 text-xs">
            <p className="font-medium text-white/90">{activeCoachSession.name}</p>
            {activeCoachSession.targetPace && (
              <p className="text-white/70">Allure cible: {formatPace(60 / (activeCoachSession.targetPace / 60))}</p>
            )}
          </div>
        )}

        {/* Auto-pause indicator */}
        {isAutoPaused && (
          <div className="mt-2 flex items-center gap-1.5 text-amber-200 text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Pause automatique — plus de mouvement détecté</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 overflow-y-auto">
        {/* Timer */}
        <div className="text-center mb-4">
          <div className="text-6xl font-mono font-bold text-slate-900 dark:text-white tracking-tight">
            {formatDuration(stats.duration)}
          </div>
          {stats.elapsedTime > stats.duration && (
            <div className="text-xs text-slate-400 font-mono">
              écoulé: {formatDuration(stats.elapsedTime)}
            </div>
          )}
          {state === 'recording' && (
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="text-xs font-medium text-red-500 uppercase tracking-wider">Enregistrement</span>
            </div>
          )}
          {state === 'paused' && (
            <span className="text-xs font-medium text-amber-500 uppercase tracking-wider">
              {isAutoPaused ? 'Pause automatique' : 'En pause'}
            </span>
          )}

          {/* Interval display */}
          {currentInterval && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium">
              <Zap className="w-4 h-4" />
              <span>{currentInterval.phase === 'work' ? 'Effort' : 'Récup'}</span>
              <span className="font-mono">{formatDuration(intervalTimeLeft)}</span>
              <span className="text-indigo-400">| Série {currentInterval.round}/{intervalConfig?.repeats}</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-sm mb-4">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-3 text-center">
            <Navigation className="w-4 h-4 mx-auto mb-1 text-blue-500" />
            <div className="text-lg font-bold text-slate-900 dark:text-white">{formatDistance(stats.distance)}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Distance</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-3 text-center">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-green-500" />
            <div className="text-lg font-bold text-slate-900 dark:text-white">{stats.avgSpeed > 0 ? stats.avgSpeed.toFixed(1) : '--'}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">km/h</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-3 text-center">
            <Target className="w-4 h-4 mx-auto mb-1 text-orange-500" />
            <div className="text-lg font-bold text-slate-900 dark:text-white">{stats.avgSpeed > 0 ? formatPace(stats.avgSpeed) : '--:--'}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">allure</div>
          </div>
        </div>

        {/* Secondary Stats Row */}
        <div className="flex flex-wrap gap-2 justify-center w-full max-w-sm mb-3">
          {stats.elevationGain > 0 && (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-xs">
              <Mountain className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-medium text-slate-700 dark:text-slate-300">+{Math.round(stats.elevationGain)}m</span>
            </div>
          )}
          {currentGPS && (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-xs">
              <MapPin className="w-3.5 h-3.5 text-purple-500" />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {currentGPS.speed ? `${(currentGPS.speed * 3.6).toFixed(1)}` : '--'} km/h
              </span>
            </div>
          )}
          {hrConnected && hrData && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-xs">
              <Heart className="w-3.5 h-3.5 text-red-500" />
              <span className="font-medium text-red-700 dark:text-red-300">{hrData.heartRate} bpm</span>
            </div>
          )}
          {stats.gap && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-xs">
              <Gauge className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-medium text-indigo-700 dark:text-indigo-300">{formatPace(60 / (stats.gap / 60))}</span>
            </div>
          )}
          {laps.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-xs">
              <Flag className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-medium text-amber-700 dark:text-amber-300">{laps.length} tour{(laps.length > 1 ? 's' : '')}</span>
            </div>
          )}
        </div>

        {/* Live Map */}
        {points.length > 1 && state !== 'idle' && (
          <div className="w-full max-w-sm mb-3 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
            <LiveMap points={points} height={state === 'finished' ? 'h-40' : 'h-36'} />
          </div>
        )}

        {/* Activity Name (when finished) */}
        {state === 'finished' && (
          <div className="w-full max-w-sm mb-3">
            <input
              type="text"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              placeholder="Nom de l'activité (optionnel)"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-4 pb-6 pt-3 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-center gap-3 max-w-sm mx-auto">
          {state === 'idle' && (
            <>
              <button
                onClick={() => setShowRoutePicker(true)}
                className="w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/30 flex items-center justify-center active:scale-95 transition-transform"
              >
                <MapPin className="w-6 h-6 fill-white text-white" />
              </button>
              <button
                onClick={startRecording}
                disabled={permissionStatus === 'denied' || permissionStatus === 'unsupported'}
                className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/30 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
              >
                <Play className="w-8 h-8 fill-white text-white ml-1" />
              </button>
              <button
                onClick={() => setShowSegmentPicker(true)}
                className="w-14 h-14 rounded-full bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-500/30 flex items-center justify-center active:scale-95 transition-transform"
              >
                <Target className="w-6 h-6 text-white" />
              </button>
            </>
          )}

          {state === 'recording' && (
            <>
              {/* HR Connect */}
              {!hrConnected ? (
                <button
                  onClick={connectHR}
                  disabled={isScanning}
                  className="w-12 h-12 rounded-full bg-pink-500 hover:bg-pink-600 shadow-lg shadow-pink-500/30 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50 text-xs text-white"
                >
                  <Heart className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={disconnectHR}
                  className="w-12 h-12 rounded-full bg-pink-600 shadow-lg flex items-center justify-center active:scale-95 transition-transform text-xs text-white/80"
                  title={hrData ? `${hrData.heartRate} bpm` : 'Connecté'}
                >
                  <BluetoothConnected className="w-5 h-5" />
                </button>
              )}

              {/* Lap button */}
              <button
                onClick={markLap}
                className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/30 flex items-center justify-center active:scale-95 transition-transform"
              >
                <Flag className="w-5 h-5 text-white" />
              </button>

              {/* Pause */}
              <button
                onClick={pauseRecording}
                className="w-16 h-16 rounded-full bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/30 flex items-center justify-center active:scale-95 transition-transform"
              >
                <Pause className="w-7 h-7 fill-white text-white" />
              </button>

              {/* Stop */}
              <button
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 flex items-center justify-center active:scale-95 transition-transform"
              >
                <Square className="w-7 h-7 fill-white text-white" />
              </button>

              {/* Lock */}
              <button
                onClick={lockScreen}
                className="w-12 h-12 rounded-full bg-slate-500 hover:bg-slate-600 shadow-lg flex items-center justify-center active:scale-95 transition-transform"
              >
                <Lock className="w-5 h-5 text-white" />
              </button>

              {/* Photo */}
              <button
                onClick={takePhoto}
                className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-lg flex items-center justify-center active:scale-95 transition-transform"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>

              {/* Intervals */}
              {!intervalConfig && (
                <button
                  onClick={startIntervalMode}
                  className="w-12 h-12 rounded-full bg-indigo-500 hover:bg-indigo-600 shadow-lg flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Zap className="w-5 h-5 text-white" />
                </button>
              )}
            </>
          )}

          {state === 'paused' && (
            <>
              <button
                onClick={resumeRecording}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg shadow-green-500/30 flex items-center justify-center active:scale-95 transition-transform"
              >
                <Play className="w-7 h-7 fill-white text-white ml-1" />
              </button>
              <button
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 flex items-center justify-center active:scale-95 transition-transform"
              >
                <Square className="w-7 h-7 fill-white text-white" />
              </button>
            </>
          )}

          {state === 'finished' && (
            <>
              <button
                onClick={cancelRecording}
                className="flex-1 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-2 text-sm font-medium active:scale-95 transition-transform"
              >
                <X className="w-4 h-4" />
                Supprimer
              </button>
              <button
                onClick={() => setStateAndRef('review')}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/30 text-white flex items-center justify-center gap-2 text-sm font-medium active:scale-95 transition-transform"
              >
                <Save className="w-4 h-4" />
Voir le résumé
              </button>
            </>
          )}
        </div>

        {/* Extra controls row - only during recording */}
        {state === 'recording' && (
          <div className="flex items-center justify-center gap-4 mt-2">
            <button
              onClick={() => {
                autoPauseEnabledRef.current = !autoPauseEnabledRef.current;
                toast.info(autoPauseEnabledRef.current ? 'Auto-pause activée' : 'Auto-pause désactivée');
              }}
              className={`text-xs flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
                autoPauseEnabledRef.current
                  ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-slate-400'
              }`}
            >
              {autoPauseEnabledRef.current ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              Auto-pause
            </button>
            <span className="text-[10px] text-slate-400">
              {gpsHighAccuracy ? 'GPS haute précision' : 'GPS économie'}
            </span>
          </div>
        )}
      </div>

      {/* GPS Status Bar */}
      {currentGPS && state !== 'idle' && (
        <div className="px-4 py-1.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
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
    </div>
  );
}
