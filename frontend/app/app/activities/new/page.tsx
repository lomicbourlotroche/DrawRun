/* eslint-disable no-undef */
'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { SportType } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import ActivityMap from '@/components/ui/ActivityMap';
import { Upload, FileText, X } from 'lucide-react';
import { toast } from 'sonner';

const ACTIVITY_TYPES = [
  { value: 'run',      label: 'Course à pied' },
  { value: 'racewalk', label: 'Marche rapide' },
  { value: 'ride',     label: 'Vélo' },
  { value: 'swim',     label: 'Natation' },
  { value: 'hike',     label: 'Randonnée' },
  { value: 'workout',  label: 'Entraînement' },
  { value: 'other',    label: 'Autre' },
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

  // ── GPX parsing (client-side preview) ──────────────────────────────────────
  const parseGpxPreview = useCallback((xml: string, fileName: string) => {
    const getAttr = (s: string, a: string) => { const m = s.match(new RegExp(`${a}="([^"]+)"`)); return m ? m[1] : null; };
    const getTag  = (s: string, t: string) => { const m = s.match(new RegExp(`<${t}[^>]*>([^<]*)</${t}>`, 'i')); return m ? m[1].trim() : null; };

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

    let dist = 0, elevGain = 0;
    const latlng: [number, number][] = [[pts[0].lat, pts[0].lon]];
    for (let i = 1; i < pts.length; i++) {
      const R = 6371000;
      const dLat = (pts[i].lat - pts[i-1].lat) * Math.PI / 180;
      const dLon = (pts[i].lon - pts[i-1].lon) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(pts[i-1].lat*Math.PI/180)*Math.cos(pts[i].lat*Math.PI/180)*Math.sin(dLon/2)**2;
      dist += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      if (pts[i].ele > pts[i-1].ele) elevGain += pts[i].ele - pts[i-1].ele;
      latlng.push([pts[i].lat, pts[i].lon]);
    }

    const durationSec = pts[0].time && pts[pts.length-1].time
      ? (pts[pts.length-1].time!.getTime() - pts[0].time!.getTime()) / 1000
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

  const handleGpxFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const xml = ev.target?.result as string;
      const preview = parseGpxPreview(xml, file.name);
      if (!preview) { toast.error('Fichier GPX invalide'); return; }
      setGpxPreview(preview);
      // Pre-fill form from GPX
      setForm(f => ({
        ...f,
        name: f.name || file.name.replace('.gpx', ''),
        distance: String(preview.distanceKm),
        moving_time: preview.durationMin > 0 ? String(preview.durationMin) : f.moving_time,
        total_elevation_gain: String(preview.elevGain),
      }));
      toast.success(`GPX chargé : ${preview.distanceKm} km, ${preview.elevGain}m D+`);
    };
    reader.readAsText(file);
  }, [parseGpxPreview]);

  // Auto-compute average_speed from distance and moving_time
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

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setError('');

    const speedValue = form.average_speed || computedAvgSpeed;

    try {
      if (gpxMode && gpxPreview) {
        // Import via GPX endpoint — stores streams + polyline automatically
        const result = await api.importGpx(form.name, gpxPreview.raw, form.type);
        toast.success('Activité importée depuis GPX !');
        router.push(result?.id ? `/app/activities/${result.id}` : '/app/activities');
      } else {
        // Manual entry
        const result = await api.createActivity({
          name: form.name,
          type: form.type as SportType,
          start_date: form.start_date,
          distance: form.distance ? parseFloat(form.distance) * 1000 : undefined, // km → m
          moving_time: form.moving_time ? parseInt(form.moving_time) * 60 : undefined,
          average_speed: speedValue ? parseFloat(speedValue) / 3.6 : undefined, // km/h → m/s
          average_heartrate: form.average_heartrate ? parseInt(form.average_heartrate) : undefined,
          max_heartrate: form.max_heartrate ? parseInt(form.max_heartrate) : undefined,
          calories: form.calories ? parseInt(form.calories) : undefined,
          total_elevation_gain: form.total_elevation_gain ? parseFloat(form.total_elevation_gain) : undefined,
          notes: form.notes || undefined,
        } as any);
        toast.success('Activité enregistrée !');
        router.push((result as any)?.id ? `/app/activities/${(result as any).id}` : '/app/activities');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Enregistrer une activité</h1>
        {/* Toggle manual / GPX */}
        <div className="flex bg-muted p-1 rounded-xl text-sm">
          <button
            type="button"
            onClick={() => { setGpxMode(false); setGpxPreview(null); }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${!gpxMode ? 'bg-white text-primary shadow-sm' : 'text-muted'}`}
          >
            Manuel
          </button>
          <button
            type="button"
            onClick={() => setGpxMode(true)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 ${gpxMode ? 'bg-white text-primary shadow-sm' : 'text-muted'}`}
          >
            <Upload className="w-3.5 h-3.5" />
            Import GPX
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* GPX Upload Zone */}
      {gpxMode && (
        <div className="space-y-4">
          {!gpxPreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-10 text-center cursor-pointer transition-all"
            >
              <Upload className="w-10 h-10 mx-auto mb-3 text-muted" />
              <p className="font-medium">Cliquez pour importer un fichier GPX</p>
              <p className="text-xs text-muted mt-1">Garmin, Strava, Komoot, Suunto…</p>
              <input ref={fileInputRef} type="file" accept=".gpx" className="hidden" onChange={handleGpxFile} />
            </div>
          ) : (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="font-medium text-sm">{gpxPreview.fileName}</span>
                </div>
                <button type="button" onClick={() => { setGpxPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                  <X className="w-4 h-4 text-muted hover:text-foreground" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                <div className="bg-white dark:bg-slate-800 rounded-lg p-2"><p className="font-bold text-lg">{gpxPreview.distanceKm}</p><p className="text-muted">km</p></div>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-2"><p className="font-bold text-lg">{gpxPreview.durationMin}</p><p className="text-muted">min</p></div>
                <div className="bg-white dark:bg-slate-800 rounded-lg p-2"><p className="font-bold text-lg text-success dark:text-success/80">+{gpxPreview.elevGain}m</p><p className="text-muted">D+</p></div>
              </div>
              {/* Map preview */}
              {gpxPreview.latlng.length > 0 && (
                <div className="rounded-lg overflow-hidden border border-border">
                  <ActivityMap latlng={gpxPreview.latlng} className="h-48" color="#3B82F6" />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nom de l&apos;activité *</label>
          <Input
            value={form.name}
            onChange={e => { setForm({ ...form, name: e.target.value }); setFieldErrors(f => ({ ...f, name: '' })); }}
            placeholder="Morning Run"
            required
            className={fieldErrors.name ? 'border-danger' : ''}
          />
          {fieldErrors.name && <p className="text-xs text-danger mt-1">{fieldErrors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Type d&apos;activité</label>
          <Select value={form.type} onChange={v => setForm({ ...form, type: v })} options={ACTIVITY_TYPES} />
        </div>

        {!gpxMode && (
          <div>
            <label className="block text-sm font-medium mb-1">Date et heure</label>
            <Input type="datetime-local" value={form.start_date} onChange={e => { setForm({ ...form, start_date: e.target.value }); setFieldErrors(f => ({ ...f, start_date: '' })); }} required className={fieldErrors.start_date ? 'border-danger' : ''} />
            {fieldErrors.start_date && <p className="text-xs text-danger mt-1">{fieldErrors.start_date}</p>}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Distance (km)</label>
            <Input type="number" step="0.01" value={form.distance} onChange={e => setForm({ ...form, distance: e.target.value })} placeholder="5.0" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Durée (minutes)</label>
            <Input type="number" value={form.moving_time} onChange={e => setForm({ ...form, moving_time: e.target.value })} placeholder="30" />
          </div>
        </div>

        {!gpxMode && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Vitesse moyenne (km/h)</label>
                <Input type="number" step="0.1" value={form.average_speed} onChange={e => setForm({ ...form, average_speed: e.target.value })} placeholder="10.0" />
                {computedAvgSpeed && !form.average_speed && (
                  <p className="text-xs text-primary mt-1">Auto-calculée: {computedAvgSpeed} km/h</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dénivelé (m)</label>
                <Input type="number" value={form.total_elevation_gain} onChange={e => setForm({ ...form, total_elevation_gain: e.target.value })} placeholder="100" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">FC moyenne</label>
                <Input type="number" value={form.average_heartrate} onChange={e => setForm({ ...form, average_heartrate: e.target.value })} placeholder="150" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">FC max</label>
                <Input type="number" value={form.max_heartrate} onChange={e => setForm({ ...form, max_heartrate: e.target.value })} placeholder="175" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Calories</label>
              <Input type="number" value={form.calories} onChange={e => setForm({ ...form, calories: e.target.value })} placeholder="300" />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            className="w-full p-2 border rounded-lg bg-background text-foreground resize-none"
            rows={3}
            placeholder="Notes sur l'activité..."
          />
        </div>

        <div className="flex gap-4 pt-2">
          <Button type="submit" isLoading={isLoading} className="flex-1">
            {gpxMode ? 'Importer l\'activité GPX' : 'Enregistrer'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
