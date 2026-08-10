'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { SportType } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import ActivityMap from '@/components/ui/ActivityMap';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Upload, FileText, X, Activity, AlertCircle } from '@/components/ui/icons';
import { toast } from 'sonner';

const ACTIVITY_TYPES = [
  { value: 'run', label: 'Course \u00e0 pied' },
  { value: 'racewalk', label: 'Marche rapide' },
  { value: 'ride', label: 'V\u00e9lo' },
  { value: 'swim', label: 'Natation' },
  { value: 'hike', label: 'Randonn\u00e9e' },
  { value: 'workout', label: 'Entra\u00eenement' },
  { value: 'other', label: 'Autre' },
];

interface GpxPreview {
  fileName: string;
  raw: string;
  distanceKm: number;
  durationMin: number;
  elevGain: number;
  latlng: [number, number][];
}

export default function NewActivityPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [gpxMode, setGpxMode] = useState(false);
  const [gpxPreview, setGpxPreview] = useState<GpxPreview | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    type: 'run',
    start_date: new Date().toISOString().slice(0, 16),
    distance: '',
    moving_time: '',
    average_speed: '',
    average_heartrate: '',
    max_heartrate: '',
    calories: '',
    total_elevation_gain: '',
    notes: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const parseGpxPreview = useCallback((xml: string, fileName: string) => {
    const getAttr = (s: string, a: string) => {
      const m = s.match(new RegExp(`${a}="([^"]+)"`));
      return m ? m[1] : null;
    };
    const getTag = (s: string, t: string) => {
      const m = s.match(new RegExp(`<${t}[^>]*>([^<]*)</${t}>`, 'i'));
      return m ? m[1].trim() : null;
    };

    const trkptRe = /<trkpt([^>]*)>([\s\S]*?)<\/trkpt>/gi;
    const pts: { lat: number; lon: number; ele: number; time: Date | null }[] = [];
    let m;
    while ((m = trkptRe.exec(xml)) !== null) {
      const lat = parseFloat(getAttr(m[1], 'lat') ?? 'NaN');
      const lon = parseFloat(getAttr(m[1], 'lon') ?? 'NaN');
      const ele = parseFloat(getTag(m[2], 'ele') ?? '0');
      const timeStr = getTag(m[2], 'time');
      if (!isNaN(lat) && !isNaN(lon)) pts.push({ lat, lon, ele, time: timeStr ? new Date(timeStr) : null });
    }
    if (pts.length < 2) return null;

    let dist = 0,
      elevGain = 0;
    const latlng: [number, number][] = [[pts[0].lat, pts[0].lon]];
    for (let i = 1; i < pts.length; i++) {
      const R = 6371000;
      const dLat = ((pts[i].lat - pts[i - 1].lat) * Math.PI) / 180;
      const dLon = ((pts[i].lon - pts[i - 1].lon) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((pts[i - 1].lat * Math.PI) / 180) * Math.cos((pts[i].lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
      dist += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (pts[i].ele > pts[i - 1].ele) elevGain += pts[i].ele - pts[i - 1].ele;
      latlng.push([pts[i].lat, pts[i].lon]);
    }

    const durationSec =
      pts[0].time && pts[pts.length - 1].time
        ? (pts[pts.length - 1].time!.getTime() - pts[0].time!.getTime()) / 1000
        : 0;

    return {
      fileName,
      raw: xml,
      distanceKm: Math.round(dist / 10) / 100,
      durationMin: Math.round(durationSec / 60),
      elevGain: Math.round(elevGain),
      latlng,
    };
  }, []);

  const handleGpxFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const xml = ev.target?.result as string;
        const preview = parseGpxPreview(xml, file.name);
        if (!preview) {
          toast.error('Fichier GPX invalide');
          return;
        }
        setGpxPreview(preview);
        setForm((f) => ({
          ...f,
          name: f.name || file.name.replace('.gpx', ''),
          distance: String(preview.distanceKm),
          moving_time: preview.durationMin > 0 ? String(preview.durationMin) : f.moving_time,
          total_elevation_gain: String(preview.elevGain),
        }));
        toast.success(`GPX charg\u00e9 : ${preview.distanceKm} km, ${preview.elevGain}m D+`);
      };
      reader.readAsText(file);
    },
    [parseGpxPreview],
  );

  const computedAvgSpeed = (() => {
    const dist = parseFloat(form.distance);
    const time = parseInt(form.moving_time);
    if (!isNaN(dist) && !isNaN(time) && time > 0) {
      return ((dist * 1000) / (time * 60)).toFixed(1);
    }
    return '';
  })();

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Le nom est requis';
    if (!gpxMode) {
      if (!form.start_date) errors.start_date = 'La date est requise';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setError('');

    const speedValue = form.average_speed || computedAvgSpeed;

    try {
      if (gpxMode && gpxPreview) {
        const result = await api.importGpx(form.name, gpxPreview.raw, form.type);
        toast.success('Activit\u00e9 import\u00e9e depuis GPX !');
        router.push(result?.id ? `/app/activities/${result.id}` : '/app/activities');
      } else {
        const result = await api.createActivity({
          name: form.name,
          type: form.type as SportType,
          start_date: form.start_date,
          distance: form.distance ? parseFloat(form.distance) * 1000 : undefined,
          moving_time: form.moving_time ? parseInt(form.moving_time) * 60 : undefined,
          avgSpeed: speedValue ? parseFloat(speedValue) / 3.6 : undefined,
          average_heartrate: form.average_heartrate ? parseInt(form.average_heartrate) : undefined,
          max_heartrate: form.max_heartrate ? parseInt(form.max_heartrate) : undefined,
          calories: form.calories ? parseInt(form.calories) : undefined,
          total_elevation_gain: form.total_elevation_gain ? parseFloat(form.total_elevation_gain) : undefined,
          notes: form.notes || undefined,
        } as any);
        toast.success('Activit\u00e9 enregistr\u00e9e !');
        router.push(result?.id ? `/app/activities/${result.id}` : '/app/activities');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'enregistrement";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl mx-auto space-y-5">
      {/* Hero header */}
      <Card variant="glass" padding="lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Nouvelle activit\u00e9</h1>
              <p className="text-sm text-muted">Enregistrez ou importez une s\u00e9ance</p>
            </div>
          </div>
          <div className="flex bg-surface p-0.5 rounded-xl text-sm">
            <button
              type="button"
              onClick={() => {
                setGpxMode(false);
                setGpxPreview(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${!gpxMode ? 'bg-surface text-primary shadow-sm' : 'text-muted'}`}
            >
              Manuel
            </button>
            <button
              type="button"
              onClick={() => setGpxMode(true)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 ${gpxMode ? 'bg-surface text-primary shadow-sm' : 'text-muted'}`}
            >
              <Upload className="w-3.5 h-3.5" />
              Import GPX
            </button>
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Card variant="glass" accent="danger" padding="sm">
          <div className="flex items-center gap-2 text-danger">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        </Card>
      )}

      {/* GPX upload / preview */}
      {gpxMode && (
        <Card variant="glass" accent="info" padding="lg">
          {!gpxPreview ? (
            <>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-10 text-center cursor-pointer transition-all"
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-muted" />
                <p className="font-medium text-foreground">Cliquez pour importer un fichier GPX</p>
                <p className="text-xs text-muted mt-1">Garmin, Strava, Komoot, Suunto\u2026</p>
                <input ref={fileInputRef} type="file" accept=".gpx" className="hidden" onChange={handleGpxFile} />
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="font-medium text-sm text-foreground">{gpxPreview.fileName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGpxPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  <X className="w-4 h-4 text-muted hover:text-foreground" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                <div className="bg-surface/60 backdrop-blur-sm rounded-lg p-2">
                  <p className="font-bold text-lg text-foreground">{gpxPreview.distanceKm}</p>
                  <p className="text-muted">km</p>
                </div>
                <div className="bg-surface/60 backdrop-blur-sm rounded-lg p-2">
                  <p className="font-bold text-lg text-foreground">{gpxPreview.durationMin}</p>
                  <p className="text-muted">min</p>
                </div>
                <div className="bg-surface/60 backdrop-blur-sm rounded-lg p-2">
                  <p className="font-bold text-lg text-success">+{gpxPreview.elevGain}m</p>
                  <p className="text-muted">D+</p>
                </div>
              </div>
              {gpxPreview.latlng.length > 0 && (
                <div className="rounded-lg overflow-hidden border border-border">
                  <ActivityMap latlng={gpxPreview.latlng} className="h-48" color="var(--primary)" />
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Card variant="glass" accent="primary" padding="lg">
          <div className="space-y-4">
            {/* Name + Type */}
            <Card variant="glass-subtle" accent="primary" padding="md">
              <CardTitle className="text-sm flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-primary" />
                Informations
              </CardTitle>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Nom de l&apos;activit\u00e9 *
                  </label>
                  <Input
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      setFieldErrors((f) => ({ ...f, name: '' }));
                    }}
                    placeholder="Morning Run"
                    required
                    className={fieldErrors.name ? 'border-danger' : ''}
                  />
                  {fieldErrors.name && <p className="text-xs text-danger mt-1">{fieldErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Type d&apos;activit\u00e9</label>
                  <Select value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={ACTIVITY_TYPES} />
                </div>
              </div>
            </Card>

            {/* Date */}
            {!gpxMode && (
              <Card variant="glass-subtle" accent="info" padding="md">
                <CardTitle className="text-sm mb-3">Date et heure</CardTitle>
                <div>
                  <Input
                    type="datetime-local"
                    value={form.start_date}
                    onChange={(e) => {
                      setForm({ ...form, start_date: e.target.value });
                      setFieldErrors((f) => ({ ...f, start_date: '' }));
                    }}
                    required
                    className={fieldErrors.start_date ? 'border-danger' : ''}
                  />
                  {fieldErrors.start_date && <p className="text-xs text-danger mt-1">{fieldErrors.start_date}</p>}
                </div>
              </Card>
            )}

            {/* Distance + Duration */}
            <Card variant="glass-subtle" accent="success" padding="md">
              <CardTitle className="text-sm mb-3">Performance</CardTitle>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Distance (km)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.distance}
                    onChange={(e) => setForm({ ...form, distance: e.target.value })}
                    placeholder="5.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Dur\u00e9e (minutes)</label>
                  <Input
                    type="number"
                    value={form.moving_time}
                    onChange={(e) => setForm({ ...form, moving_time: e.target.value })}
                    placeholder="30"
                  />
                </div>
              </div>
            </Card>

            {/* Speed + Elevation */}
            {!gpxMode && (
              <Card variant="glass-subtle" accent="warning" padding="md">
                <CardTitle className="text-sm mb-3">D\u00e9tails</CardTitle>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Vitesse moyenne (km/h)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={form.average_speed}
                      onChange={(e) => setForm({ ...form, average_speed: e.target.value })}
                      placeholder="10.0"
                    />
                    {computedAvgSpeed && !form.average_speed && (
                      <p className="text-xs text-primary mt-1">Auto-calcul\u00e9e: {computedAvgSpeed} km/h</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">D\u00e9nivel\u00e9 (m)</label>
                    <Input
                      type="number"
                      value={form.total_elevation_gain}
                      onChange={(e) => setForm({ ...form, total_elevation_gain: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Heart rate */}
            {!gpxMode && (
              <Card variant="glass-subtle" accent="danger" padding="md">
                <CardTitle className="text-sm mb-3">Fr\u00e9quence cardiaque</CardTitle>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">FC moyenne</label>
                    <Input
                      type="number"
                      value={form.average_heartrate}
                      onChange={(e) => setForm({ ...form, average_heartrate: e.target.value })}
                      placeholder="150"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">FC max</label>
                    <Input
                      type="number"
                      value={form.max_heartrate}
                      onChange={(e) => setForm({ ...form, max_heartrate: e.target.value })}
                      placeholder="175"
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Calories */}
            {!gpxMode && (
              <Card variant="glass-subtle" accent="peak" padding="md">
                <CardTitle className="text-sm mb-3">D\u00e9pense \u00e9nerg\u00e9tique</CardTitle>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Calories</label>
                  <Input
                    type="number"
                    value={form.calories}
                    onChange={(e) => setForm({ ...form, calories: e.target.value })}
                    placeholder="300"
                  />
                </div>
              </Card>
            )}

            {/* Notes */}
            <Card variant="glass-subtle" padding="md">
              <CardTitle className="text-sm mb-3">Notes</CardTitle>
              <div>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg bg-surface text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  rows={3}
                  placeholder="Notes sur l'activit\u00e9..."
                />
              </div>
            </Card>
          </div>
        </Card>

        {/* Submit area */}
        <Card variant="glass" padding="lg">
          <div className="flex gap-4">
            <Button type="submit" isLoading={isLoading} className="flex-1">
              {gpxMode ? "Importer l'activit\u00e9 GPX" : 'Enregistrer'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Annuler
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
