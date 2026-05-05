/**
 * ActivitiesContent - Contenu de la page Activités pour lazy loading
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuthStore, useActivitiesStore, useSyncStore } from '@/stores';
import { api } from '@/lib/api';
import { ActivityList, MobileActivityRecorder } from '@/components/features/activities';
import { Button, Modal, Input, Select } from '@/components/ui';
import { RefreshCw, Plus, Upload, FileUp, Play } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { toast } from 'sonner';

export default function ActivitiesContent() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuthStore();
  const { filteredActivities, isLoading, setActivities, setLoading } = useActivitiesStore();
  const { sync, isSyncing } = useSyncStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
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
      const data = await api.getActivities();
      setActivities(data);
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
        setShowImportModal(false);
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
              <Button onClick={() => setShowImportModal(true)} variant="secondary" leftIcon={<Upload className="w-4 h-4" />}>
                GPX
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

      {/* Manual Activity Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Ajouter une activité" size="md">
        <div className="space-y-4">
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

      {/* GPX Import Modal */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Importer un fichier GPX" size="sm">
        <div className="space-y-4 text-center">
          <div className="p-8 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <FileUp className="w-12 h-12 mx-auto mb-4 text-muted" />
            <p className="text-sm text-foreground font-medium">Clique pour sélectionner un fichier .gpx</p>
            <p className="text-xs text-muted mt-1">Le fichier sera analysé automatiquement</p>
          </div>
          <input ref={fileInputRef} type="file" accept=".gpx" className="hidden" onChange={handleGpxImport} />
          {isSubmitting && <p className="text-sm text-muted">Import en cours...</p>}
          <Button variant="secondary" onClick={() => setShowImportModal(false)} className="w-full">Annuler</Button>
        </div>
      </Modal>

      {/* Mobile Activity Recorder Modal */}
      <Modal 
        isOpen={showRecordModal} 
        onClose={() => setShowRecordModal(false)} 
        title="Enregistrer une activité" 
        size="lg"
      >
        <MobileActivityRecorder
          onSave={async () => {
            setShowRecordModal(false);
            await loadActivities();
          }}
        />
      </Modal>
    </div>
  );
}
