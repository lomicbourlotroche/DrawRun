'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CircularProgress } from '@/components/ui';
import { calculateReadinessColor } from '@/lib/utils';
import type { Readiness } from '@/types';
import { Heart, Brain, Moon, Activity, Plus } from 'lucide-react';
import { useState } from 'react';
import { Modal, Input, Button } from '@/components/ui';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useDashboardStore } from '@/stores';

interface ReadinessCardProps {
  readiness: Readiness | null;
  isLoading?: boolean;
}

export function ReadinessCard({ readiness, isLoading }: ReadinessCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hrvValue, setHrvValue] = useState('');
  const [sleepValue, setSleepValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fetchPmcData } = useDashboardStore();

  const handleLogData = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (hrvValue) await api.logHrv(parseFloat(hrvValue));
      if (sleepValue) await api.logSleep(parseFloat(sleepValue));
      
      toast.success('Données vitales enregistrées');
      setIsModalOpen(false);
      setHrvValue('');
      setSleepValue('');
      
      // Refresh dashboard data
      fetchPmcData();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Readiness</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="w-28 h-28 rounded-full bg-background animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-background rounded animate-pulse" />
              <div className="h-3 w-32 bg-background rounded animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!readiness) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Readiness</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted text-sm">Données non disponibles</p>
        </CardContent>
      </Card>
    );
  }

  const color = calculateReadinessColor(readiness.score);

  const statusLabels = {
    excellent: 'Excellent',
    good: 'Bon',
    fair: 'Moyen',
    poor: 'Faible',
  };

  const factors = [
    { label: 'HRV', value: readiness.factors.hrv, icon: Heart, color: '#FF3B30' },
    { label: 'Sommeil', value: readiness.factors.sleep, icon: Moon, color: '#5856D6' },
    { label: 'FC Repos', value: readiness.factors.restingHR, icon: Activity, color: '#007AFF' },
    { label: 'Stress', value: readiness.factors.stress, icon: Brain, color: '#FF9500' },
  ];

  return (
    <Card className="relative overflow-hidden group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Readiness</CardTitle>
        <button 
          onClick={() => setIsModalOpen(true)}
          type="button"
          className="p-1.5 rounded-full bg-primary-50 text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary-100"
          title="Enregistrer HRV / Sommeil"
        >
          <Plus className="w-4 h-4" />
        </button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <CircularProgress
            value={readiness.score}
            size={112}
            strokeWidth={8}
            variant="default"
            color={color}
            label={statusLabels[readiness.status]}
          />
          
          <div className="flex-1 grid grid-cols-2 gap-3">
            {factors.map((factor) => (
              <div
                key={factor.label}
                className="flex items-center gap-2 p-2 rounded-lg bg-background"
              >
                <factor.icon className="w-4 h-4" style={{ color: factor.color }} />
                <div>
                  <p className="text-xs text-muted">{factor.label}</p>
                  <p className="text-sm font-medium text-foreground">{factor.value}/100</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Enregistrer vos constantes"
        >
          <form onSubmit={handleLogData} className="space-y-4 pt-4">
            <p className="text-sm text-slate-500 mb-2">
              Entrez vos mesures du matin pour affiner votre score de readiness.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="HRV (rmssd)"
                placeholder="ex: 65"
                type="number"
                value={hrvValue}
                onChange={(e) => setHrvValue(e.target.value)}
              />
              <Input
                label="Sommeil (heures)"
                placeholder="ex: 7.5"
                type="number"
                step="0.1"
                value={sleepValue}
                onChange={(e) => setSleepValue(e.target.value)}
              />
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
                Annuler
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                isLoading={isSubmitting}
                disabled={!hrvValue && !sleepValue}
              >
                Enregistrer
              </Button>
            </div>
          </form>
        </Modal>
      </CardContent>
    </Card>
  );
}
