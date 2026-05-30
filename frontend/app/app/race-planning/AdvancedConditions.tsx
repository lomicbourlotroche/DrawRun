'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui';

interface AdvancedConditionsProps {
  showAdvanced: boolean;
  onToggle: () => void;
  temperature: number;
  onTemperatureChange: (_v: number) => void;
  humidity: number;
  onHumidityChange: (_v: number) => void;
  altitude: number;
  onAltitudeChange: (_v: number) => void;
  windSpeed: number;
  onWindSpeedChange: (_v: number) => void;
}

export function AdvancedConditions({
  showAdvanced,
  onToggle,
  temperature,
  onTemperatureChange,
  humidity,
  onHumidityChange,
  altitude,
  onAltitudeChange,
  windSpeed,
  onWindSpeedChange,
}: AdvancedConditionsProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
      >
        {showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        Conditions météo
      </button>
      {showAdvanced && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <Input
            type="number"
            value={temperature}
            onChange={(e) => onTemperatureChange(parseFloat(e.target.value) || 15)}
            label="Température (°C)"
          />
          <Input
            type="number"
            value={humidity}
            onChange={(e) => onHumidityChange(parseFloat(e.target.value) || 50)}
            label="Humidité (%)"
          />
          <Input
            type="number"
            value={altitude}
            onChange={(e) => onAltitudeChange(parseFloat(e.target.value) || 0)}
            label="Altitude (m)"
          />
          <Input
            type="number"
            value={windSpeed}
            onChange={(e) => onWindSpeedChange(parseFloat(e.target.value) || 0)}
            label="Vent (km/h)"
          />
        </div>
      )}
    </div>
  );
}
