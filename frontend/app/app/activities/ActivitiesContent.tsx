/* eslint-disable no-undef */
/**
 * ActivitiesContent - Contenu de la page Activités pour lazy loading
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuthStore, useActivitiesStore, useSyncStore } from '@/stores';
import { api } from '@/lib/api';
import { ActivityList, MobileActivityRecorder } from '@/components/features/activities';
import { Button, Modal, Input, Select } from '@/components/ui';
import { RefreshCw, Plus, FileUp, Play } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { toast } from 'sonner';

export default function ActivitiesContent() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuthStore();
  const { filteredActivities, isLoading, setActivities, setLoading } = useActivitiesStore();
  const { sync, isSyncing } = useSyncStore();

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
        toast.error('Erreur lors du chargement des activités');
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
      toast.error('Nom, distance et durée requis');
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
      toast.success('Activité ajoutée');
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
        toast.success(`Importé : ${(result.distance / 1000).toFixed(1)}km en ${Math.round(result.duration / 60)}min`);
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.activities.title}</h1>
          <p className="text-muted mt-1">{filteredActivities.length} {t.activities.title.toLowerCase()}</p>
        </div>
        <div className="flex gap-2">
          {isAuthenticated && (
            <>
              <Button onClick={() => setShowRecordModal(true)} variant="primary" leftIcon={<Play className="w-4 h-4" />}>
                Enregistrer
              </Button>
              <Button onClick={() => setShowAddModal(true)} variant="secondary" leftIcon={<Plus className="w-4 h-4" />}>
                Ajouter
              </Button>
              <Button onClick={handleSync} isLoading={isSyncing} leftIcon={<RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />}>
                Sync
              </Button>
            </>
          )}
        </div>
      </div>

      <ActivityList
        activities={filteredActivities}
        isLoading={isLoading}
        onRefresh={loadActivities}
      />

      {/* Mobile FAB - Record Activity */}
      <Link
        href="/app/record"
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-primary to-blue-600 text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center active:scale-90 transition-transform z-40"
      >
        <Plus className="w-6 h-6" />
      </Link>

       {/* Manual Activity Modal - with GPX import option */}
       <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Ajouter une activité" size="md">
         <div className="space-y-4">
           {/* GPX Import Option */}
           <div className="p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer text-center"
                onClick={() => fileInputRef.current?.click()}>
             <FileUp className="w-8 h-8 mx-auto mb-2 text-muted" />
             <p className="text-sm font-medium text-foreground">Importer un fichier GPX</p>
             <p className="text-xs text-muted mt-1">Le fichier sera analysé automatiquement</p>
           </div>
           <input ref={fileInputRef} type="file" accept=".gpx" className="hidden" onChange={handleGpxImport} />
           
           {isSubmitting && <p className="text-sm text-muted text-center">Import en cours...</p>}
           
           <div className="relative">
             <div className="absolute inset-0 flex items-center">
               <div className="w-full border-t border-border" />
             </div>
             <div className="relative flex justify-center text-xs uppercase">
               <span className="bg-surface px-2 text-muted">Ou saisie manuelle</span>
             </div>
           </div>
           
           {/* Manual Form */}
           <Input label="Nom" placeholder="Ex: Course du matin" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
           <Select label="Type" options={[
             { value: 'run', label: 'Course' },
             { value: 'bike', label: 'Vélo' },
             { value: 'swim', label: 'Natation' },
           ]} value={form.type} onChange={(v) => setForm({ ...form, type: v })} />
           <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
           <Input label="Distance (mètres)" type="number" placeholder="10000" value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} />
           <Input label="Durée (secondes)" type="number" placeholder="3600" hint="ex: 3600 = 1h" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
           <Input label="FC moyenne (optionnel)" type="number" placeholder="145" value={form.avg_hr} onChange={(e) => setForm({ ...form, avg_hr: e.target.value })} />
           <div className="flex gap-3 pt-2">
             <Button variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">Annuler</Button>
             <Button onClick={handleAddActivity} isLoading={isSubmitting} className="flex-1">Ajouter</Button>
           </div>
         </div>
       </Modal>

      {/* Mobile Activity Recorder — fullscreen, not wrapped in Modal */}
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
