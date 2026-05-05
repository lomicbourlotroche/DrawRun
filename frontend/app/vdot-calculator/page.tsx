'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/constants';
import {
  ArrowLeft, Calculator, Trophy, Clock, Target, Zap, TrendingUp, Activity, ChevronRight
} from 'lucide-react';

const RACE_PRESETS = [
  { label: '5K', distance: 5000, icon: '🏃' },
  { label: '10K', distance: 10000, icon: '🏃‍♂️' },
  { label: 'Semi-Marathon', distance: 21097, icon: '🏅' },
  { label: 'Marathon', distance: 42195, icon: '🏆' },
];

const TRAINING_ZONES = [
  { name: 'EASY (E)', key: 'E', color: '#22C55E', description: 'Récupération & endurance fondamentale' },
  { name: 'MARATHON (M)', key: 'M', color: '#3B82F6', description: 'Allure marathon' },
  { name: 'THRESHOLD (T)', key: 'T', color: '#A855F7', description: 'Seuil lactique' },
  { name: 'INTERVAL (I)', key: 'I', color: '#EF4444', description: 'VO2max' },
  { name: 'REPETITION (R)', key: 'R', color: '#F59E0B', description: 'Vitesse pure & technique' },
];

interface VDOTResult {
  vdot: number;
  vma: number;
  level: { level: string; color: string; percent: number };
  predictions: {
    marathon: { time: string; pace: string };
    halfMarathon: { time: string; pace: string };
    classicRaces: Array<{ distance: string; time: string; pace: string }>;
  };
  trainingPaces?: Record<string, { min?: string; max?: string; pace?: string }>;
}

function parseTimeToMinutes(hours: number, minutes: number, seconds: number): number {
  return hours * 60 + minutes + seconds / 60;
}

function getVDOTLevelInfo(level: string) {
  const levels: Record<string, { label: string; emoji: string; gradient: string }> = {
    DEBUTANT: { label: 'Débutant', emoji: '🌱', gradient: 'from-gray-400 to-gray-500' },
    INTERMEDIAIRE: { label: 'Intermédiaire', emoji: '🏃', gradient: 'from-blue-400 to-blue-600' },
    AVANCE: { label: 'Avancé', emoji: '⚡', gradient: 'from-purple-400 to-purple-600' },
    EXCELLENT: { label: 'Excellent', emoji: '🏆', gradient: 'from-yellow-400 to-orange-500' },
    ELITE: { label: 'Élite', emoji: '🥇', gradient: 'from-amber-400 to-yellow-500' },
  };
  return levels[level] || { label: level, emoji: '🏃', gradient: 'from-primary to-blue-500' };
}

export default function VDOTCalculatorPage() {
  const router = useRouter();
  const [distance, setDistance] = useState<number>(10000);
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('39');
  const [seconds, setSeconds] = useState('00');
  const [result, setResult] = useState<VDOTResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateVDOT = async () => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;
    const timeMinutes = parseTimeToMinutes(h, m, s);
    if (timeMinutes <= 0) {
      setError('Veuillez entrer un temps valide');
      return;
    }
    if (!distance || distance <= 0) {
      setError('Veuillez sélectionner une distance');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/vdot?distance=${distance}&time=${timeMinutes}`
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors du calcul');
      }
      const data = await response.json();
      data.trainingPaces = computeTrainingPaces(data.vdot);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const computeTrainingPaces = (vdot: number): Record<string, { min?: string; max?: string; pace?: string }> => {
    const vma = vdot * 0.27;
    const speedToPace = (speedKmh: number): string => {
      if (speedKmh <= 0) return '--:--';
      const secPerKm = 3600 / speedKmh;
      const m = Math.floor(secPerKm / 60);
      const s = Math.round(secPerKm % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
    };
    return {
      E: {
        min: speedToPace(vma * 0.74),
        max: speedToPace(vma * 0.59),
      },
      M: {
        pace: speedToPace(vma * 0.84),
      },
      T: {
        pace: speedToPace(vma * 0.88),
      },
      I: {
        pace: speedToPace(vma * 0.98),
      },
      R: {
        pace: speedToPace(vma * 1.15),
      },
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-xl hover:bg-neutral-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Calculateur VDOT</h1>
              <p className="text-xs text-muted">Jack Daniels VDOT V6.4</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Input Section */}
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Entrez votre performance
          </h2>

          {/* Distance Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium text-neutral-700 mb-3 block">Distance</label>
            <div className="grid grid-cols-4 gap-2">
              {RACE_PRESETS.map((preset) => (
                <button
                  key={preset.distance}
                  onClick={() => setDistance(preset.distance)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    distance === preset.distance
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-neutral-200 hover:border-primary/30'
                  }`}
                >
                  <span className="text-xl">{preset.icon}</span>
                  <p className="text-sm font-semibold mt-1">{preset.label}</p>
                </button>
              ))}
            </div>
            <div className="mt-3">
              <label className="text-xs text-neutral-500 mb-1 block">Distance personnalisée (mètres)</label>
              <input
                type="number"
                value={distance}
                onChange={(e) => setDistance(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 rounded-xl border border-neutral-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                placeholder="Ex: 5000"
              />
            </div>
          </div>

          {/* Time Input */}
          <div className="mb-6">
            <label className="text-sm font-medium text-neutral-700 mb-3 block">Temps réalisé</label>
            <div className="flex items-center justify-center gap-3">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={hours}
                  onChange={(e) => setHours(e.target.value.replace(/\D/g, ''))}
                  className="w-20 h-20 text-center text-3xl font-bold rounded-2xl border-2 border-neutral-200 focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none bg-white"
                />
                <span className="text-xs text-neutral-500 mt-2 font-medium">Heures</span>
              </div>
              <span className="text-3xl font-bold text-neutral-300 mt-[-20px]">:</span>
              {/* Minutes */}
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ''))}
                  className="w-20 h-20 text-center text-3xl font-bold rounded-2xl border-2 border-neutral-200 focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none bg-white"
                />
                <span className="text-xs text-neutral-500 mt-2 font-medium">Minutes</span>
              </div>
              <span className="text-3xl font-bold text-neutral-300 mt-[-20px]">:</span>
              {/* Seconds */}
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={(e) => setSeconds(e.target.value.replace(/\D/g, ''))}
                  className="w-20 h-20 text-center text-3xl font-bold rounded-2xl border-2 border-neutral-200 focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none bg-white"
                />
                <span className="text-xs text-neutral-500 mt-2 font-medium">Secondes</span>
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-3 text-center">Ex: 0h 39min 00s pour un 10km en 39 minutes</p>
          </div>

          {/* Calculate Button */}
          <button
            onClick={calculateVDOT}
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-600 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Calcul en cours...
              </>
            ) : (
              <>
                <Calculator className="w-5 h-5" />
                Calculer mon VDOT
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* VDOT Score Card */}
            <div className={`bg-gradient-to-br ${getVDOTLevelInfo(result.level.level).gradient} rounded-3xl p-6 text-white shadow-lg`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Votre VDOT</p>
                  <p className="text-5xl font-extrabold mt-1">{result.vdot}</p>
                  <p className="text-white/90 text-sm mt-2">
                    {getVDOTLevelInfo(result.level.level).emoji} {result.level.level} — {result.level.percent}ème percentile
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-sm">VMA estimée</p>
                  <p className="text-3xl font-bold">{result.vma} <span className="text-lg">km/h</span></p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-4 bg-white/20 rounded-full h-2">
                <div
                  className="bg-white rounded-full h-2 transition-all duration-1000"
                  style={{ width: `${Math.min(result.level.percent, 100)}%` }}
                />
              </div>
            </div>

            {/* Training Zones */}
            <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Vos zones d'entraînement
              </h3>
              <div className="space-y-3">
                {TRAINING_ZONES.map((zone) => {
                  const zoneData = result.trainingPaces?.[zone.key];
                  const paceDisplay = zoneData
                    ? ('min' in zoneData && zoneData.min
                      ? `${zoneData.min} - ${zoneData.max}`
                      : ('pace' in zoneData ? zoneData.pace : '--:--'))
                    : '--:--';
                  return (
                    <div key={zone.key} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }} />
                        <div>
                          <p className="font-semibold text-sm">{zone.name}</p>
                          <p className="text-xs text-neutral-500">{zone.description}</p>
                        </div>
                      </div>
                      <p className="font-mono font-bold">{paceDisplay} <span className="text-xs text-neutral-400 font-normal">min/km</span></p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Race Predictions */}
            <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-warning" />
                Prédictions de courses
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {result.predictions.classicRaces.map((race) => (
                  <div key={race.distance} className="p-4 bg-gradient-to-br from-neutral-50 to-white border border-neutral-100 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{race.distance}</span>
                      <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-2xl font-bold font-mono">{race.time}</p>
                    <p className="text-xs text-neutral-500 mt-1">Allure: {race.pace} /km</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-primary-600 to-secondary rounded-3xl p-6 text-white text-center">
              <Zap className="w-8 h-8 mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">Poussez votre performance plus loin</h3>
              <p className="text-white/80 text-sm mb-4">Créez un compte pour un suivi personnalisé, un coaching adaptatif et des analyses avancées.</p>
              <button
                onClick={() => router.push('/login?mode=register')}
                className="px-6 py-3 bg-white text-primary-600 font-semibold rounded-xl hover:bg-neutral-100 transition-colors inline-flex items-center gap-2"
              >
                Créer un compte gratuit
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
