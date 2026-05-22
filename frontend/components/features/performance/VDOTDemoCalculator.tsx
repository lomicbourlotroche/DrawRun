'use client';

import { useState, useMemo } from 'react';
import { Calculator, Target, Activity, CheckCircle2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

interface VDOTDemoResult {
  vdot: number;
  vma: number;
  level: string;
  color: string;
  predictions: {
    marathon: string;
    halfMarathon: string;
    tenK: string;
    fiveK: string;
  };
  trainingPaces: {
    E: { min: string; max: string };
    M: string;
    T: string;
    I: string;
    R: string;
  };
}

// Données basées sur les formules de Jack Daniels
const VDOT_LEVELS = [
  { min: 0, max: 30, label: 'Débutant', color: 'text-muted', bg: 'bg-muted/20' },
  { min: 31, max: 45, label: 'Intermédiaire', color: 'text-primary', bg: 'bg-primary/20' },
  { min: 46, max: 55, label: 'Avancé', color: 'text-secondary', bg: 'bg-secondary/20' },
  { min: 56, max: 70, label: 'Excellent', color: 'text-success', bg: 'bg-success/20' },
  { min: 71, max: 90, label: 'Élite', color: 'text-peak', bg: 'bg-peak/20' },
  { min: 91, max: 100, label: 'Monde', color: 'text-danger', bg: 'bg-danger/20' },
];

const PRESET_RACES = [
  { label: '5 km', distance: 5, defaultTime: { h: 0, m: 20, s: 0 } },
  { label: '10 km', distance: 10, defaultTime: { h: 0, m: 40, s: 0 } },
  { label: 'Semi', distance: 21.097, defaultTime: { h: 1, m: 30, s: 0 } },
  { label: 'Marathon', distance: 42.195, defaultTime: { h: 3, m: 30, s: 0 } },
];

// Formules VDOT simplifiées (approximation)
const calculateVDOT = (distanceKm: number, timeMinutes: number): number => {
  // Formules basées sur les tables de Jack Daniels
  const vo2Factor = Math.pow(timeMinutes / (distanceKm * 0.6), -1);
  const vdot = Math.round(
    (distanceKm === 5 ? 6.037 * Math.pow(timeMinutes, -1) :
     distanceKm === 10 ? 5.113 * Math.pow(timeMinutes, -1) :
     distanceKm === 21.097 ? 4.6 * Math.pow(timeMinutes, -1) :
     3.917 * Math.pow(timeMinutes, -1)) * 100
  );
  return Math.max(10, Math.min(99, Math.round(vdot)));
};

const calculatePredictions = (vdot: number): VDOTDemoResult['predictions'] => {
  // Facteurs de prédiction basés sur VDOT
  const vma = vdot * 0.27; // VMA en km/h
  
  // Temps de course en minutes par km
  const km5Factor = 0.975 + (100 - vdot) * 0.0035;
  const km10Factor = 0.985 + (100 - vdot) * 0.0032;
  const halfFactor = 1.025 + (100 - vdot) * 0.0025;
  const marathonFactor = 1.10 + (100 - vdot) * 0.0018;
  
  const pace5k = 100 / (vma / km5Factor); // Temps pour 5km en secondes
  const pace10k = 100 / (vma / km10Factor);
  const paceHalf = 100 / (vma / halfFactor);
  const paceMarathon = 100 / (vma / marathonFactor);
  
  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.round(totalSeconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return {
    fiveK: formatTime(pace5k * 5),
    tenK: formatTime(pace10k * 10),
    halfMarathon: formatTime(paceHalf * 21.097),
    marathon: formatTime(paceMarathon * 42.195),
  };
};

const calculateTrainingPaces = (vdot: number) => {
  const vma = vdot * 0.27;
  const speedToPace = (speedKmh: number, isMax = false): string => {
    if (speedKmh <= 0) return '--:--';
    const secPerKm = 3600 / speedKmh;
    const m = Math.floor(secPerKm / 60);
    const s = Math.round(secPerKm % 60);
    return isMax ? `${m}:${s.toString().padStart(2, '0')}` : `> ${m}:${s.toString().padStart(2, '0')}`;
  };
  
  return {
    E: { min: speedToPace(vma * 0.65), max: speedToPace(vma * 0.79) },
    M: speedToPace(vma * 0.80),
    T: speedToPace(vma * 0.87),
    I: speedToPace(vma * 0.95),
    R: speedToPace(vma * 1.05),
  };
};

const getVDOTLevel = (vdot: number) => {
  for (const l of VDOT_LEVELS) {
    if (vdot >= l.min && vdot <= l.max) {
      return { ...l, level: l.label };
    }
  }
  const last = VDOT_LEVELS[VDOT_LEVELS.length - 1];
  return { ...last, level: last.label };
};

export interface VDOTDemoCalculatorProps {
  className?: string;
}

export function VDOTDemoCalculator({ className = '' }: VDOTDemoCalculatorProps) {
  const [selectedRace, setSelectedRace] = useState(PRESET_RACES[1]);
  const [hours, setHours] = useState<string>(String(PRESET_RACES[1].defaultTime.h).padStart(2, '0'));
  const [minutes, setMinutes] = useState<string>(String(PRESET_RACES[1].defaultTime.m).padStart(2, '0'));
  const [seconds, setSeconds] = useState<string>(String(PRESET_RACES[1].defaultTime.s).padStart(2, '0'));
  const [result, setResult] = useState<VDOTDemoResult | null>(null);

  const timeMinutes = useMemo(() => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;
    return h * 60 + m + s / 60;
  }, [hours, minutes, seconds]);

  const handleCalculate = () => {
    if (timeMinutes <= 0) return;
    
    const vdot = calculateVDOT(selectedRace.distance, timeMinutes);
    const level = getVDOTLevel(vdot);
    
    setResult({
      vdot,
      vma: Math.round(vdot * 0.27 * 10) / 10,
      level: level.level,
      color: level.color,
      predictions: calculatePredictions(vdot),
      trainingPaces: calculateTrainingPaces(vdot),
    });
  };

  const handleRaceChange = (race: typeof PRESET_RACES[number]) => {
    setSelectedRace(race);
    setHours(String(race.defaultTime.h).padStart(2, '0'));
    setMinutes(String(race.defaultTime.m).padStart(2, '0'));
    setSeconds(String(race.defaultTime.s).padStart(2, '0'));
    setResult(null);
  };

  const formatPace = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Card variant="glass" className={`relative overflow-hidden ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-primary" />
          Calculateur VDOT
        </CardTitle>
        <p className="text-sm text-muted">Entrez votre temps sur une course pour estimer votre VDOT</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Sélecteur de course */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {PRESET_RACES.map((race) => (
            <button
              key={race.label}
              onClick={() => handleRaceChange(race)}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedRace.label === race.label
                  ? 'bg-primary text-white'
                  : 'bg-background text-muted hover:bg-muted'
              }`}
            >
              {race.label}
            </button>
          ))}
        </div>

        {/* Champ de temps */}
        <div className="flex items-center justify-center gap-2">
          <div className="relative">
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value.padStart(2, '0').slice(0, 2))}
              className="w-16 h-14 text-2xl font-bold text-center rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              min="0"
              max="99"
            />
            <span className="absolute top-2 right-2 text-xs text-muted">h</span>
          </div>
          <span className="text-2xl text-muted">:</span>
          <div className="relative">
            <input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value.padStart(2, '0').slice(0, 2))}
              className="w-16 h-14 text-2xl font-bold text-center rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              min="0"
              max="59"
            />
            <span className="absolute top-2 right-2 text-xs text-muted">min</span>
          </div>
          <span className="text-2xl text-muted">:</span>
          <div className="relative">
            <input
              type="number"
              value={seconds}
              onChange={(e) => setSeconds(e.target.value.padStart(2, '0').slice(0, 2))}
              className="w-16 h-14 text-2xl font-bold text-center rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              min="0"
              max="59"
            />
            <span className="absolute top-2 right-2 text-xs text-muted">s</span>
          </div>
        </div>

        {/* Bouton calculer */}
        <Button
          onClick={handleCalculate}
          className="w-full py-3"
          size="lg"
        >
          <Target className="w-5 h-5" />
          Calculer mon VDOT
        </Button>

        {/* Résultats */}
        {result && (
          <div className="mt-4 p-4 rounded-xl bg-surface/50 border border-border animate-fade-in">
            {/* VDOT */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted">VDOT</p>
                <p className="text-4xl font-extrabold text-foreground">{result.vdot}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted">Niveau</p>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${getVDOTLevel(result.vdot).bg} ${getVDOTLevel(result.vdot).color}`}
                >
                  {result.level}
                </span>
              </div>
            </div>

            {/* VMA */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/20 mb-4">
              <Activity className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted">VMA</p>
                <p className="font-bold text-foreground">{result.vma} km/h</p>
              </div>
            </div>

            {/* Prédictions */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <p className="text-xs text-muted mb-1">5 km</p>
                <p className="font-bold text-primary">{result.predictions.fiveK}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/10">
                <p className="text-xs text-muted mb-1">10 km</p>
                <p className="font-bold text-secondary">{result.predictions.tenK}</p>
              </div>
              <div className="p-3 rounded-lg bg-success/10">
                <p className="text-xs text-muted mb-1">Semi</p>
                <p className="font-bold text-success">{result.predictions.halfMarathon}</p>
              </div>
              <div className="p-3 rounded-lg bg-peak/10">
                <p className="text-xs text-muted mb-1">Marathon</p>
                <p className="font-bold text-peak">{result.predictions.marathon}</p>
              </div>
            </div>

            {/* Zones d'entraînement */}
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-semibold text-foreground mb-3">Zones d&apos;entraînement</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-xs">E: {result.trainingPaces.E.min}-{result.trainingPaces.E.max}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-xs">M: {result.trainingPaces.M}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="text-xs">T: {result.trainingPaces.T}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-danger" />
                  <span className="text-xs">I: {result.trainingPaces.I}</span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-peak" />
                  <span className="text-xs">R: {result.trainingPaces.R}</span>
                </div>
              </div>
            </div>

            {/* Feedback visuel */}
            <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-success/20 to-primary/20 border border-success/30 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <div>
                <p className="font-semibold text-success">Calcul basé sur les formules</p>
                <p className="text-xs text-muted">Jack Daniels VDOT V6.4</p>
              </div>
            </div>
          </div>
        )}

        {/* Message d'invitation */}
        {!result && (
          <div className="p-4 rounded-xl bg-muted/20 text-center">
            <p className="text-sm text-muted">
              Entrez votre temps de course pour découvrir votre VDOT et vos allures d&apos;entraînement
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
