'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { SportType } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const ACTIVITY_TYPES = [
  { value: 'run', label: 'Course à pied' },
  { value: 'racewalk', label: 'Marche rapide' },
  { value: 'ride', label: 'Vélo' },
  { value: 'swim', label: 'Natation' },
  { value: 'hike', label: 'Randonnée' },
  { value: 'workout', label: 'Entraînement' },
  { value: 'other', label: 'Autre' },
];

export default function NewActivityPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const activityData = {
        name: form.name,
        type: form.type as SportType,
        start_date: form.start_date,
        distance: form.distance ? parseFloat(form.distance) : undefined,
        moving_time: form.moving_time ? parseInt(form.moving_time) * 60 : undefined,
        average_speed: form.average_speed ? parseFloat(form.average_speed) : undefined,
        average_heartrate: form.average_heartrate ? parseInt(form.average_heartrate) : undefined,
        max_heartrate: form.max_heartrate ? parseInt(form.max_heartrate) : undefined,
        calories: form.calories ? parseInt(form.calories) : undefined,
        total_elevation_gain: form.total_elevation_gain ? parseFloat(form.total_elevation_gain) : undefined,
        notes: form.notes || undefined,
      };

      await api.createActivity(activityData);
      router.push('/app/activities');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erreur lors de l\'enregistrement');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Enregistrer une activité</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
           <label className="block text-sm font-medium mb-1">Nom de l&apos;activité</label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Morning Run"
            required
          />
        </div>

        <div>
           <label className="block text-sm font-medium mb-1">Type d&apos;activité</label>
          <Select
            value={form.type}
            onChange={(value) => setForm({ ...form, type: value })}
            options={ACTIVITY_TYPES}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date et heure</label>
          <Input
            type="datetime-local"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Distance (km)</label>
            <Input
              type="number"
              step="0.01"
              value={form.distance}
              onChange={(e) => setForm({ ...form, distance: e.target.value })}
              placeholder="5.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Durée (minutes)</label>
            <Input
              type="number"
              value={form.moving_time}
              onChange={(e) => setForm({ ...form, moving_time: e.target.value })}
              placeholder="30"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Vitesse moyenne (km/h)</label>
            <Input
              type="number"
              step="0.1"
              value={form.average_speed}
              onChange={(e) => setForm({ ...form, average_speed: e.target.value })}
              placeholder="10.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Dénivelé (m)</label>
            <Input
              type="number"
              value={form.total_elevation_gain}
              onChange={(e) => setForm({ ...form, total_elevation_gain: e.target.value })}
              placeholder="100"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">FC moyenne</label>
            <Input
              type="number"
              value={form.average_heartrate}
              onChange={(e) => setForm({ ...form, average_heartrate: e.target.value })}
              placeholder="150"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">FC max</label>
            <Input
              type="number"
              value={form.max_heartrate}
              onChange={(e) => setForm({ ...form, max_heartrate: e.target.value })}
              placeholder="175"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Calories</label>
          <Input
            type="number"
            value={form.calories}
            onChange={(e) => setForm({ ...form, calories: e.target.value })}
            placeholder="300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full p-2 border rounded-lg"
            rows={3}
             placeholder="Notes sur l&apos;activité..."
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" isLoading={isLoading}>
            Enregistrer
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}