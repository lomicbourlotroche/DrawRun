import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MapLayerSwitcher from '@/components/features/explore/MapLayerSwitcher';

describe('MapLayerSwitcher', () => {
  it('renders all three layer buttons', () => {
    render(<MapLayerSwitcher activeLayer="osm" onLayerChange={vi.fn()} />);
    expect(screen.getByTitle('Carte')).toBeInTheDocument();
    expect(screen.getByTitle('Terrain')).toBeInTheDocument();
    expect(screen.getByTitle('Satellite')).toBeInTheDocument();
  });

  it('highlights the active layer', () => {
    render(<MapLayerSwitcher activeLayer="topo" onLayerChange={vi.fn()} />);
    const activeButton = screen.getByTitle('Terrain');
    expect(activeButton.className).toContain('bg-primary');
  });

  it('does not highlight inactive layers', () => {
    render(<MapLayerSwitcher activeLayer="osm" onLayerChange={vi.fn()} />);
    const inactiveButton = screen.getByTitle('Satellite');
    expect(inactiveButton.className).toContain('text-muted-foreground');
  });

  it('calls onLayerChange with layer id on click', () => {
    const onLayerChange = vi.fn();
    render(<MapLayerSwitcher activeLayer="osm" onLayerChange={onLayerChange} />);
    fireEvent.click(screen.getByTitle('Satellite'));
    expect(onLayerChange).toHaveBeenCalledWith('satellite');
  });
});
