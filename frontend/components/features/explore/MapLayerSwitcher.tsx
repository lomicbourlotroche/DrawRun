'use client';

import { Map, Mountain, Satellite } from 'lucide-react';

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
    <div className="flex flex-col gap-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-1">
      {LAYERS.map((layer) => {
        const Icon = layer.icon;
        const isActive = activeLayer === layer.id;
        return (
          <button
            key={layer.id}
            onClick={() => onLayerChange(layer.id)}
            title={layer.label}
            className={`flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md transition-all ${
              isActive
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}
