import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RouteDetailPopup from '@/components/features/explore/RouteDetailPopup';

const mockRoute = {
  id: 1,
  name: 'Boucle du Mont Blanc',
  description: 'Un superbe parcours en montagne avec des vues imprenables.',
  distance: 12500,
  elevation_gain: 450,
  elevation_loss: 430,
  activity_type: 'Run',
  estimated_duration: 5400,
  difficulty: 'hard',
  avg_rating: 4.5,
  rating_count: 12,
  usage_count: 48,
  creator_name: 'Jean Dupont',
};

describe('RouteDetailPopup', () => {
  it('renders the route name', () => {
    render(<RouteDetailPopup route={mockRoute} onClose={vi.fn()} onViewDetails={vi.fn()} />);
    expect(screen.getByText('Boucle du Mont Blanc')).toBeInTheDocument();
  });

  it('displays distance correctly', () => {
    render(<RouteDetailPopup route={mockRoute} onClose={vi.fn()} onViewDetails={vi.fn()} />);
    expect(screen.getByText('12.5 km')).toBeInTheDocument();
  });

  it('displays elevation gain', () => {
    render(<RouteDetailPopup route={mockRoute} onClose={vi.fn()} onViewDetails={vi.fn()} />);
    expect(screen.getByText('D+ 450 m')).toBeInTheDocument();
  });

  it('displays estimated duration', () => {
    render(<RouteDetailPopup route={mockRoute} onClose={vi.fn()} onViewDetails={vi.fn()} />);
    expect(screen.getByText('1h30')).toBeInTheDocument();
  });

  it('displays difficulty badge', () => {
    render(<RouteDetailPopup route={mockRoute} onClose={vi.fn()} onViewDetails={vi.fn()} />);
    expect(screen.getByText('Difficile')).toBeInTheDocument();
  });

  it('shows easy badge for easy routes', () => {
    render(<RouteDetailPopup route={{ ...mockRoute, difficulty: 'easy' }} onClose={vi.fn()} onViewDetails={vi.fn()} />);
    expect(screen.getByText('Facile')).toBeInTheDocument();
  });

  it('shows medium badge for medium routes', () => {
    render(<RouteDetailPopup route={{ ...mockRoute, difficulty: 'medium' }} onClose={vi.fn()} onViewDetails={vi.fn()} />);
    expect(screen.getByText('Modéré')).toBeInTheDocument();
  });

  it('displays the description', () => {
    render(<RouteDetailPopup route={mockRoute} onClose={vi.fn()} onViewDetails={vi.fn()} />);
    expect(screen.getByText('Un superbe parcours en montagne avec des vues imprenables.')).toBeInTheDocument();
  });

  it('displays the creator name', () => {
    render(<RouteDetailPopup route={mockRoute} onClose={vi.fn()} onViewDetails={vi.fn()} />);
    expect(screen.getByText('par Jean Dupont')).toBeInTheDocument();
  });

  it('calls onViewDetails when Détails button clicked', () => {
    const onViewDetails = vi.fn();
    render(<RouteDetailPopup route={mockRoute} onClose={vi.fn()} onViewDetails={onViewDetails} />);
    fireEvent.click(screen.getByText('Détails'));
    expect(onViewDetails).toHaveBeenCalledOnce();
  });

  it('calls onClose when X button clicked', () => {
    const onClose = vi.fn();
    render(<RouteDetailPopup route={mockRoute} onClose={onClose} onViewDetails={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onUseRoute when Utiliser button clicked', () => {
    const onUseRoute = vi.fn();
    render(<RouteDetailPopup route={mockRoute} onClose={vi.fn()} onViewDetails={vi.fn()} onUseRoute={onUseRoute} />);
    fireEvent.click(screen.getByText('Utiliser'));
    expect(onUseRoute).toHaveBeenCalledOnce();
  });

  it('shows usage count', () => {
    render(<RouteDetailPopup route={mockRoute} onClose={vi.fn()} onViewDetails={vi.fn()} />);
    expect(screen.getByText('48× utilisé')).toBeInTheDocument();
  });

  it('shows average rating', () => {
    render(<RouteDetailPopup route={mockRoute} onClose={vi.fn()} onViewDetails={vi.fn()} />);
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });

  it('hides Utiliser button when onUseRoute is not provided', () => {
    render(<RouteDetailPopup route={mockRoute} onClose={vi.fn()} onViewDetails={vi.fn()} />);
    expect(screen.queryByText('Utiliser')).not.toBeInTheDocument();
  });

  it('shows empty state for missing optional fields', () => {
    const minimalRoute = {
      id: 2,
      name: 'Petite balade',
      distance: 3000,
      elevation_gain: 30,
      activity_type: 'Run',
      usage_count: 0,
    };
    render(<RouteDetailPopup route={minimalRoute} onClose={vi.fn()} onViewDetails={vi.fn()} />);
    expect(screen.getByText('Petite balade')).toBeInTheDocument();
    expect(screen.getByText('3.0 km')).toBeInTheDocument();
    expect(screen.getByText('D+ 30 m')).toBeInTheDocument();
  });
});
