'use client';

import React from 'react';
import { FolderOpen, MapPin, Clock, Calendar, Trash2 } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { formatDuration } from './race-planning.utils';
import type { SavedRacePlan } from '@/lib/api/race-planning.api';

interface SavedPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  savedPlans: SavedRacePlan[];
  onLoadPlan: (_plan: Record<string, unknown>) => void;
  onDeletePlan: (_id: number) => void;
}

export function SavedPlansModal({
  isOpen,
  onClose,
  isLoading,
  savedPlans,
  onLoadPlan,
  onDeletePlan,
}: SavedPlansModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mes plans de course" size="lg">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-sm text-muted">Chargement...</span>
        </div>
      ) : savedPlans.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 mx-auto text-muted mb-3" />
          <p className="text-muted">Aucun plan sauvegardé</p>
          <p className="text-xs text-muted mt-1">Calculez un plan, puis cliquez sur &quot;Enregistrer&quot;</p>
        </div>
      ) : (
        <div className="space-y-3">
          {savedPlans.map((plan) => (
            <div key={plan.id as number} className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{plan.name as string}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {typeof plan.distance === 'number' ? `${plan.distance.toFixed(2)} km` : '-'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {typeof plan.totalTime === 'number' ? formatDuration(plan.totalTime) : '-'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {plan.createdAt
                        ? new Date(plan.createdAt).toLocaleDateString('fr-FR')
                        : '-'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="primary" size="sm" onClick={() => onLoadPlan(plan as unknown as Record<string, unknown>)}>
                    Charger
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDeletePlan(plan.id as number)}>
                    <Trash2 className="w-4 h-4 text-error" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
