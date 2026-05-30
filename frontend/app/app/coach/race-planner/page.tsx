'use client';

import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';
import UploadStep from './UploadStep';
import ConfigStep from './ConfigStep';
import StrategyResults from './StrategyResults';

export default function RacePlannerPage() {
  const [step, setStep] = useState(1);
  const [gpxData, setGpxData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const [params, setParams] = useState({
    temp: 15,
    humidity: 50,
    goalTime: '',
  });

  const [strategy, setStrategy] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (data: string, name: string) => {
    setGpxData(data);
    setFileName(name);
    setStep(2);
  };

  const calculateStrategy = async () => {
    if (!gpxData) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await (api.calculateRaceStrategy as (..._args: unknown[]) => Promise<unknown>)({
        gpxData,
        params: {
          temp: params.temp,
          humidity: params.humidity,
          goalTime: params.goalTime ? parseInt(params.goalTime) : undefined
        }
      });
      setStrategy(response as Record<string, unknown>);
      setStep(3);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors du calcul de la stratégie');
    } finally {
      setIsLoading(false);
    }
  };

  const _formatPace = (paceStr: string) => {
    return paceStr + ' /km';
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.round(seconds % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  const downloadCsv = () => {
    if (!strategy) return;
    const headers = ['KM', 'Distance (m)', 'Elevation Gain (m)', 'Elevation Loss (m)', 'Grade (%)', 'Target Pace', 'Target Pace (sec)', 'Cumulative Time (sec)'];
    const rows = ((strategy.strategy as Record<string, unknown>).segments as Array<Record<string, unknown>>).map((s: Record<string, unknown>) => [
      s.km,
      s.distance,
      s.elevGain,
      s.elevLoss,
      s.grade,
      s.targetPace,
      s.targetPaceSec,
      s.cumulativeTime
    ]);
    const csvContent = [headers.join(','), ...(rows as unknown[][]).map((r: unknown[]) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `race_strategy_${fileName?.split('.')[0] || 'plan'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary bg-clip-text text-transparent">
            Planificateur de Course 2.0
          </h1>
          <p className="text-muted-foreground mt-1">
            Optimisez votre allure en fonction du relief et de la météo.
          </p>
        </div>

        {step > 1 && (
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            className="w-fit"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                step >= s ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground'
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div className={`w-12 h-1 rounded-full ${step > s ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <UploadStep onFileSelected={handleFileUpload} />
      )}

      {/* Step 2: Params */}
      {step === 2 && (
        <ConfigStep
          params={params}
          setParams={setParams}
          onCalculate={calculateStrategy}
          isLoading={isLoading}
          error={error}
          fileName={fileName}
        />
      )}

      {/* Step 3: Results */}
      {step === 3 && strategy && (
        <StrategyResults
          strategy={strategy}
          formatTime={formatTime}
          downloadCsv={downloadCsv}
        />
      )}
    </div>
  );
}
