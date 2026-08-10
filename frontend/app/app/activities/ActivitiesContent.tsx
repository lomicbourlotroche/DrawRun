'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuthStore, useActivitiesStore, useSyncStore } from '@/stores';
import { api } from '@/lib/api';
import { Card, CardContent, Button, Modal, Input, Select, Badge } from '@/components/ui';
import { cn, formatDistance, formatDuration, formatDate, getSportColor } from '@/lib/utils';
import { RefreshCw, Plus, FileUp, Play, Clock, TrendingUp, Heart, Mountain, Bike, Waves, Footprints, Dumbbell, Route, Loader2, Activity as ActivityIcon, Search } from '@/components/ui/icons';
import { MobileActivityRecorder } from '@/components/features/activities';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { toast } from 'sonner';
import type { Activity } from '@/types';

const PAGE_SIZE = 20;

const FILTER_TABS = [
  { id: 'all', label: 'Toutes' },
  { id: 'run', label: 'Course', icon: Footprints },
  { id: 'ride', label: 'V\u00e9lo', icon: Bike },
  { id: 'swim', label: 'Natation', icon: Waves },
  { id: 'hike', label: 'Rando', icon: Mountain },
  { id: 'workout', label: 'Training', icon: Dumbbell },
];

function getSportIcon(type: string) {
  const t = (type || '').toLowerCase();
  if (t.startsWith('run')) return Footprints;
  if (t.startsWith('ride') || t.startsWith('bike') || t === 'cycling') return Bike;
  if (t.startsWith('swim')) return Waves;
  if (t.startsWith('hike') || t.startsWith('walk')) return Mountain;
  if (t === 'workout' || t === 'training') return Dumbbell;
  return ActivityIcon;
}

export default function ActivitiesContent() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuthStore();
  const { filteredActivities, isLoading, setActivities, setLoading } = useActivitiesStore();
  const { sync, isSyncing } = useSyncStore();
  const [isMobile, setIsMobile] = useState(false);
  const [filter, setFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    type: 'run',
    date: new Date().toISOString().split('T')[0],
    distance: '',
    duration: '',
    avg_hr: '',
  });

  const loadActivities = useCallback(async () => {
    if (!api.isAuthenticated()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await api.getActivities();
      setActivities(result.data);
    } catch (error: unknown) {
      const apiError = error as { status?: number };
      if (apiError.status !== 401) {
        toast.error('Erreur lors du chargement des activit\u00e9s');
      }
    } finally {
      setLoading(false);
    }
  }, [setActivities, setLoading]);

  useEffect(() => {
    if (api.isAuthenticated()) {
      loadActivities();
    }
  }, [loadActivities]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const filteredAndSorted = useMemo(() => {
    let items = filteredActivities;
    if (filter !== 'all') {
      items = items.filter((a) => {
        const t = (a.type as string).toLowerCase();
        return t === filter || t.startsWith(filter);
      });
    }
    return [...items].sort(
      (a, b) =>
        new Date(b.date || b.start_date || 0).getTime() -
        new Date(a.date || a.start_date || 0).getTime()
    );
  }, [filteredActivities, filter]);

  const visibleActivities = filteredAndSorted.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAndSorted.length;

  const handleSync = async () => {
    const result = await sync();
    if (result.success) {
      toast.success(result.message);
      await loadActivities();
    } else {
      toast.error(result.message);
    }
  };

  const handleAddActivity = async () => {
    if (!form.name || !form.distance || !form.duration) {
      toast.error('Nom, distance et dur\u00e9e requis');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.addManualActivity({
        name: form.name,
        type: form.type,
        date: form.date,
        distance: parseFloat(form.distance),
        duration: parseFloat(form.duration),
        avg_hr: form.avg_hr ? parseFloat(form.avg_hr) : undefined,
      });
      toast.success('Activit\u00e9 ajout\u00e9e');
      setShowAddModal(false);
      setForm({ name: '', type: 'run', date: new Date().toISOString().split('T')[0], distance: '', duration: '', avg_hr: '' });
      await loadActivities();
    } catch (e) {
      toast.error('Erreur lors de l\'ajout');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGpxImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const gpxData = ev.target?.result as string;
      setIsSubmitting(true);
      try {
        const result = await api.importGpx(file.name.replace('.gpx', ''), gpxData);
        toast.success(`Import\u00e9 : ${(result.distance / 1000).toFixed(1)}km en ${Math.round(result.duration / 60)}min`);
        setShowAddModal(false);
        await loadActivities();
      } catch (err) {
        toast.error('Erreur lors de l\'import GPX');
      } finally {
        setIsSubmitting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <Card variant="glass" accent="primary" padding="lg" className="animate-slide-up">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
            <Route className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {t.activities.title}
            </h1>
            <p className="text-muted mt-1">
              {filteredAndSorted.length} activit\u00e9{filteredAndSorted.length > 1 ? 's' : ''} enregistr\u00e9e{filteredAndSorted.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {isAuthenticated && (
              <>
                {isMobile && (
                  <Button onClick={() => setShowRecordModal(true)} variant="primary" size="sm" leftIcon={<Play className="w-4 h-4" />}>
                    Enregistrer
                  </Button>
                )}
                <Button onClick={() => setShowAddModal(true)} variant="glass" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  Ajouter
                </Button>
                <Button onClick={handleSync} isLoading={isSyncing} variant="glass" size="sm" leftIcon={<RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />}>
                  Sync
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {isAuthenticated && filteredAndSorted.length > 0 && (
        <div className="animate-slide-up delay-100">
          <div className="bg-surface/50 backdrop-blur-sm border border-border rounded-xl p-1 inline-flex flex-wrap gap-1">
            {FILTER_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setFilter(tab.id); setVisibleCount(PAGE_SIZE); }}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted hover:text-foreground hover:bg-surface/50'
                  )}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up delay-200">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-surface/50 backdrop-blur-sm border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : visibleActivities.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleActivities.map((activity, idx) => {
              const distanceM = activity.distance ?? 0;
              const durationS = activity.moving_time ?? activity.elapsed_time ?? 0;
              const elevation = activity.total_elevation_gain;
              const avgHR = activity.avgHR || activity.average_heartrate || 0;
              const SportIcon = getSportIcon(activity.type);
              const sportColor = getSportColor(activity.type);

              return (
                <Link
                  key={activity.id}
                  href={`/app/activities/${activity.id}`}
                  className={cn(
                    'group block animate-slide-up',
                    idx === 0 ? 'delay-100' : idx === 1 ? 'delay-150' : idx === 2 ? 'delay-200' : idx === 3 ? 'delay-250' : ''
                  )}
                >
                  <Card variant="glass" accent="primary" hover padding="md" className="relative overflow-hidden">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${sportColor}15` }}
                      >
                        <SportIcon className="w-5 h-5" style={{ color: sportColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {activity.title || activity.name || 'Activit\u00e9'}
                            </h3>
                            <p className="text-xs text-muted mt-0.5">
                              {formatDate(activity.date || activity.start_date || '')}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-3">
                          {distanceM > 0 && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <TrendingUp className="w-3.5 h-3.5 text-primary" />
                              <span className="font-semibold text-foreground tabular-nums">{formatDistance(distanceM)}</span>
                            </div>
                          )}
                          {durationS > 0 && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              <span className="font-semibold text-foreground tabular-nums">{formatDuration(durationS)}</span>
                            </div>
                          )}
                          {avgHR > 0 && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Heart className="w-3.5 h-3.5 text-danger" />
                              <span className="font-semibold text-foreground tabular-nums">{Math.round(avgHR)} bpm</span>
                            </div>
                          )}
                          {elevation !== null && elevation !== undefined && elevation > 0 && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Mountain className="w-3.5 h-3.5 text-success" />
                              <span className="font-semibold text-foreground tabular-nums">+{Math.round(elevation)}m</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-2 animate-slide-up">
              <Button
                variant="glass"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                leftIcon={<Search className="w-4 h-4" />}
              >
                Charger {Math.min(PAGE_SIZE, filteredAndSorted.length - visibleCount)} activit\u00e9s de plus
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card variant="glass" padding="xl" className="text-center animate-slide-up delay-200">
          <div className="py-8">
            <div className="w-16 h-16 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Aucune activit\u00e9</h3>
            <p className="text-sm text-muted max-w-sm mx-auto mb-6">
              Synchronisez avec Strava ou Garmin pour importer vos activit\u00e9s, ou ajoutez-en une manuellement.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={() => setShowAddModal(true)} variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                Ajouter une activit\u00e9
              </Button>
              <Button onClick={handleSync} isLoading={isSyncing} variant="glass" leftIcon={<RefreshCw className="w-4 h-4" />}>
                Synchroniser
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Link
        href="/app/record"
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-button-primary flex items-center justify-center active:scale-90 transition-all duration-200 z-40 hover:bg-primary/80"
      >
        <Plus className="w-6 h-6" />
      </Link>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Ajouter une activit\u00e9" size="md">
        <div className="space-y-4">
          <div
            className="p-4 rounded-xl border-2 border-dashed border-border bg-surface/30 hover:bg-surface/50 hover:border-primary/50 transition-all cursor-pointer text-center"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp className="w-8 h-8 mx-auto mb-2 text-muted" />
            <p className="text-sm font-medium text-foreground">Importer un fichier GPX</p>
            <p className="text-xs text-muted mt-1">Le fichier sera analys\u00e9 automatiquement</p>
          </div>
          <input ref={fileInputRef} type="file" accept=".gpx" className="hidden" onChange={handleGpxImport} />

          {isSubmitting && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
              Import en cours...
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-2 text-muted">Ou saisie manuelle</span>
            </div>
          </div>

          <Input label="Nom" placeholder="Ex: Course du matin" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select label="Type" options={[
            { value: 'run', label: 'Course' },
            { value: 'bike', label: 'V\u00e9lo' },
            { value: 'swim', label: 'Natation' },
          ]} value={form.type} onChange={(v) => setForm({ ...form, type: v })} />
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Distance (m\u00e8tres)" type="number" placeholder="10000" value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} />
          <Input label="Dur\u00e9e (secondes)" type="number" placeholder="3600" hint="ex: 3600 = 1h" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          <Input label="FC moyenne (optionnel)" type="number" placeholder="145" value={form.avg_hr} onChange={(e) => setForm({ ...form, avg_hr: e.target.value })} />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowAddModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={handleAddActivity} isLoading={isSubmitting} className="flex-1">Ajouter</Button>
          </div>
        </div>
      </Modal>

      {showRecordModal && (
        <MobileActivityRecorder
          onSave={async () => {
            setShowRecordModal(false);
            await loadActivities();
          }}
          onCancel={() => setShowRecordModal(false)}
        />
      )}
    </div>
  );
}
