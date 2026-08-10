'use client';

import { Map, Mountain, Satellite } from '@/components/ui/icons';

interface MapLayerSwitcherProps {
  activeLayer: string;
  onLayerChange: (_layer: string) => void;
}

const LAYERS = [
  { id: 'osm', label: 'Carte', icon: Map },
  { id: 'topo', label: 'Terrain', icon: Mountain },
  { id: 'satellite', label: 'Satellite', icon: Satellite },
];

export default function MapLayerSwitcher({ activeLayer, onLayerChange }: MapLayerSwitcherProps) {
  return (
    <div
      className="flex flex-col gap-1 bg-surface/90 backdrop-blur-sm rounded-lg shadow-md p-1"
      role="group"
      aria-label="Sélection des calques de carte"
    >
      {LAYERS.map((layer) => {
        const Icon = layer.icon;
        const isActive = activeLayer === layer.id;
        return (
          <button
            key={layer.id}
            onClick={() => onLayerChange(layer.id)}
            title={layer.label}
            aria-label={isActive ? `Calque ${layer.label} activé` : `Activer le calque ${layer.label}`}
            aria-pressed={isActive}
            className={`flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md transition-all ${
              isActive
                ? 'bg-primary text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
            }`}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
