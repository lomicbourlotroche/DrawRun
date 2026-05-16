/* eslint-disable unused-imports/no-unused-vars */
'use client';

import { useState } from 'react';
import { Button, Input, Modal } from '@/components/ui';
import { api } from '@/lib/api';
import { Calendar, Trophy, Plane, AlertCircle, Briefcase, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface ExternalEventFormProps {
  planId: number;
  onEventAdded?: () => void;
}

const eventTypes = [
  { value: 'competition', label: 'Compétition', icon: Trophy, color: 'bg-warning/20 text-yellow-400 border-yellow-500/30' },
  { value: 'vacation', label: 'Vacances', icon: Plane, color: 'bg-primary/20 text-blue-400 border-blue-500/30' },
  { value: 'illness', label: 'Maladie', icon: AlertCircle, color: 'bg-danger/20 text-red-400 border-red-500/30' },
  { value: 'work_trip', label: 'Voyage travail', icon: Briefcase, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'other', label: 'Autre', icon: Calendar, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
];

export default function ExternalEventForm({ planId, onEventAdded }: ExternalEventFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [eventType, setEventType] = useState('competition');
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [affectedSessions, setAffectedSessions] = useState<number[]>([]);

  const handleSubmit = async () => {
    if (!name || !startDate) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.addExternalEvent({
        planId,
        eventType: eventType as 'competition' | 'vacation' | 'illness' | 'work_trip' | 'other',
        name,
        startDate,
        endDate: endDate || undefined,
        notes: notes || undefined,
      });

      setAffectedSessions(result.affectedSessions);
      toast.success(result.message);
      onEventAdded?.();
    } catch {
      toast.error('Erreur lors de l\'ajout');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedType = eventTypes.find(t => t.value === eventType);

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => setIsOpen(true)}
        leftIcon={<Plus className="w-4 h-4" />}
      >
        Ajouter événement
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => { setIsOpen(false); setAffectedSessions([]); }}
        title="Ajouter un événement"
        size="lg"
      >
        <div className="space-y-4">
          {affectedSessions.length === 0 ? (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Type d&apos;événement</label>
                <div className="flex flex-wrap gap-2">
                  {eventTypes.map(type => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setEventType(type.value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                          eventType === type.value
                            ? type.color
                            : 'border-border hover:border-primary/50 text-muted'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Input
                label="Nom de l'événement"
                placeholder="ex: Marathon de Paris, Vacances été..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Date de début</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Date de fin (optionnel)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Notes (optionnel)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informations complémentaires..."
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground min-h-[80px]"
                />
              </div>

              {eventType === 'competition' && (
                <div className="p-3 rounded-lg bg-warning/10 border border-yellow-500/20">
                  <p className="text-sm text-foreground/80">
                    L&apos;entraînement sera automatiquement adapté la semaine précédant la compétition (taper).
                  </p>
                </div>
              )}

              {eventType === 'illness' && (
                <div className="p-3 rounded-lg bg-danger/10 border border-red-500/20">
                  <p className="text-sm text-foreground/80">
                    Le plan sera suspendu et reprendra après votre guérison avec une progression douce.
                  </p>
                </div>
              )}

              {(eventType === 'vacation' || eventType === 'work_trip') && (
                <div className="p-3 rounded-lg bg-primary/10 border border-blue-500/20">
                  <p className="text-sm text-foreground/80">
                    Les séances prévues pendant cette période seront automatiquement supprimées ou décalées.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-success/10 border border-green-500/20">
                <p className="font-medium text-foreground">Événement ajouté avec succès</p>
                <p className="text-sm text-muted mt-1">
                  {affectedSessions.length} séance(s) ont été affectées et le plan a été ajusté.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {affectedSessions.length === 0 && (
              <>
                <Button variant="secondary" onClick={() => setIsOpen(false)} className="flex-1">
                  Annuler
                </Button>
                <Button onClick={handleSubmit} isLoading={isLoading} className="flex-1">
                  Ajouter
                </Button>
              </>
            )}
            {affectedSessions.length > 0 && (
              <Button onClick={() => setIsOpen(false)} className="w-full">
                Fermer
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}