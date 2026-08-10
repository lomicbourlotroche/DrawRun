'use client';

import React from 'react';
import { Map as MapIcon, Thermometer, Droplets, Timer, ChevronRight, Info } from '@/components/ui/icons';
import { Button, Card, Input } from '@/components/ui';

interface ConfigStepProps {
  params: {
    temp: number;
    humidity: number;
    goalTime: string;
  };
  setParams: (_params: { temp: number; humidity: number; goalTime: string }) => void;
  onCalculate: () => void;
  isLoading: boolean;
  error: string | null;
  fileName: string | null;
}

export default function ConfigStep({ params, setParams, onCalculate, isLoading, error, fileName }: ConfigStepProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2 p-6 space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-secondary/10 rounded-lg">
            <MapIcon className="w-5 h-5 text-secondary" />
          </div>
          <h2 className="text-xl font-bold">Configuration de la course</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-peak" />
              Température prévue (°C)
            </label>
            <Input
              type="number"
              value={params.temp}
              onChange={(e) => setParams({ ...params, temp: parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Droplets className="w-4 h-4 text-primary" />
              Humidité relative (%)
            </label>
            <Input
              type="number"
              value={params.humidity}
              onChange={(e) => setParams({ ...params, humidity: parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Timer className="w-4 h-4 text-primary" />
              Objectif de temps (optionnel, en minutes)
            </label>
            <Input
              type="number"
              placeholder="Laissez vide pour utiliser votre VDOT actuel"
              value={params.goalTime}
              onChange={(e) => setParams({ ...params, goalTime: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Si vide, l&apos;allure sera calculée en fonction de votre niveau de performance actuel.
            </p>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button
            size="lg"
            onClick={onCalculate}
            disabled={isLoading}
            className="rounded-full px-12 bg-gradient-to-r from-primary to-secondary"
          >
            {isLoading ? 'Calcul en cours...' : 'Générer ma stratégie'}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}
      </Card>

      <Card className="p-6 bg-muted/30">
        <h3 className="font-bold mb-4">Fichier sélectionné</h3>
        <div className="flex items-center gap-3 p-3 bg-surface border rounded-xl">
          <div className="p-2 bg-primary/10 rounded-lg text-primary text-xs font-bold">GPX</div>
          <span className="text-sm truncate font-medium">{fileName}</span>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
            <p className="text-xs text-muted-foreground">
              L&apos;algorithme analyse le relief mètre par mètre pour ajuster l&apos;effort cible. Une correction de
              &quot;cardiac drift&quot; est appliqu&eacute;e pour les efforts longs ({'>'}90min).
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
