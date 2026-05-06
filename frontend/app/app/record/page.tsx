/**
 * Record Activity Page - Mobile-only activity recording
 * =====================================================
 * Page complète pour enregistrer une activité manuellement.
 * Visible uniquement sur mobile (ajoutée à la sidebar pour mobile).
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { SportType } from '@/types';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { 
  Play, MapPin, Clock, Heart, Flame, Mountain, 
  ChevronLeft, Save, X, Zap, Timer, Gauge
} from 'lucide-react';
import { toast } from 'sonner';

const SPORTS = [
  { id: 'run', label: 'Course', icon: '🏃', color: 'from-orange-500 to-red-500' },
  { id: 'ride', label: 'Vélo', icon: '🚴', color: 'from-blue-500 to-cyan-500' },
  { id: 'swim', label: 'Natation', icon: '🏊', color: 'from-cyan-500 to-blue-400' },
  { id: 'hike', label: 'Rando', icon: '🥾', color: 'from-green-500 to-emerald-500' },
  { id: 'walk', label: 'Marche', icon: '🚶', color: 'from-teal-500 to-green-500' },
  { id: 'workout', label: 'Workout', icon: '💪', color: 'from-purple-500 to-pink-500' },
  { id: 'other', label: 'Autre', icon: '🎯', color: 'from-slate-500 to-gray-500' },
];

export default function RecordActivityPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSport, setSelectedSport] = useState('run');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth >= 1024) {
        router.push('/app/activities');
        setIsMobile(false);
      } else {
        setIsMobile(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [router]);

  if (!isMobile) return null;

  const [form, setForm] = useState({
    name: '',
    distance: '',
    duration: '',
    elevation: '',
    avgHR: '',
    maxHR: '',
    calories: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.distance || !form.duration) {
      toast.error('Distance et durée requises');
      return;
    }

    setIsLoading(true);
    try {
      await api.createActivity({
        name: form.name || `${SPORTS.find(s => s.id === selectedSport)?.label} - ${new Date().toLocaleDateString('fr-FR')}`,
        type: selectedSport as SportType,
        start_date: new Date().toISOString(),
        distance: parseFloat(form.distance) * 1000,
        moving_time: parseInt(form.duration) * 60,
        total_elevation_gain: form.elevation ? parseFloat(form.elevation) : undefined,
        average_heartrate: form.avgHR ? parseInt(form.avgHR) : undefined,
        max_heartrate: form.maxHR ? parseInt(form.maxHR) : undefined,
        calories: form.calories ? parseInt(form.calories) : undefined,
        notes: form.notes || undefined,
      });

      toast.success('Activité enregistrée !');
      router.push('/app/activities');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSportData = SPORTS.find(s => s.id === selectedSport);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className={`bg-gradient-to-r ${selectedSportData?.color || 'from-primary to-blue-500'} text-white`}>
        <div className="flex items-center gap-3 p-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl bg-white/20 active:scale-95 transition-transform">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Enregistrer</h1>
            <p className="text-sm text-white/80">Nouvelle activité</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Sport Selector */}
        <div>
          <label className="text-sm font-medium text-slate-600 mb-2 block">Type d&apos;activité</label>
          <div className="grid grid-cols-4 gap-2">
            {SPORTS.map((sport) => (
              <button
                key={sport.id}
                type="button"
                onClick={() => setSelectedSport(sport.id)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  selectedSport === sport.id
                    ? 'border-primary bg-primary/10 scale-105'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span className="text-2xl block">{sport.icon}</span>
                <span className="text-xs font-medium mt-1 block">{sport.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Activity Name */}
        <Input
          label="Nom (optionnel)"
          placeholder="Ex: Sortie matinale"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        {/* Core Metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Gauge className="w-4 h-4 text-primary" />
              Métriques principales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Distance */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500">Distance</label>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    step="0.01"
                    value={form.distance}
                    onChange={(e) => setForm({ ...form, distance: e.target.value })}
                    placeholder="0.00"
                    className="w-full text-2xl font-bold bg-transparent border-none outline-none"
                  />
                  <span className="text-sm text-slate-500">km</span>
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500">Durée</label>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="0"
                    className="w-full text-2xl font-bold bg-transparent border-none outline-none"
                  />
                  <span className="text-sm text-slate-500">min</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Metrics */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
        >
          <span className="text-sm font-medium text-slate-600">Métriques avancées</span>
          <span className={`text-slate-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {showAdvanced && (
          <Card>
            <CardContent className="pt-4 space-y-3">
              {/* Elevation */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Mountain className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-500">Dénivelé</label>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      value={form.elevation}
                      onChange={(e) => setForm({ ...form, elevation: e.target.value })}
                      placeholder="0"
                      className="w-full text-lg font-bold bg-transparent border-none outline-none"
                    />
                    <span className="text-sm text-slate-500">m</span>
                  </div>
                </div>
              </div>

              {/* Avg HR */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-500">FC moyenne</label>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      value={form.avgHR}
                      onChange={(e) => setForm({ ...form, avgHR: e.target.value })}
                      placeholder="0"
                      className="w-full text-lg font-bold bg-transparent border-none outline-none"
                    />
                    <span className="text-sm text-slate-500">bpm</span>
                  </div>
                </div>
              </div>

              {/* Max HR */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-500">FC max</label>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      value={form.maxHR}
                      onChange={(e) => setForm({ ...form, maxHR: e.target.value })}
                      placeholder="0"
                      className="w-full text-lg font-bold bg-transparent border-none outline-none"
                    />
                    <span className="text-sm text-slate-500">bpm</span>
                  </div>
                </div>
              </div>

              {/* Calories */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-500">Calories</label>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      value={form.calories}
                      onChange={(e) => setForm({ ...form, calories: e.target.value })}
                      placeholder="0"
                      className="w-full text-lg font-bold bg-transparent border-none outline-none"
                    />
                    <span className="text-sm text-slate-500">kcal</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <div>
          <label className="text-sm font-medium text-slate-600 mb-2 block">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Comment s'est passée la séance..."
            rows={3}
            className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none text-sm"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            className="flex-1 rounded-xl"
            leftIcon={<X className="w-4 h-4" />}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            className="flex-1 rounded-xl"
            leftIcon={<Save className="w-4 h-4" />}
          >
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}
