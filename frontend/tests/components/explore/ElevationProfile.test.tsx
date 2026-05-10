import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ElevationProfile from '@/components/features/explore/ElevationProfile';

const mockData = [
  { distance: 0, elevation: 100 },
  { distance: 500, elevation: 120 },
  { distance: 1000, elevation: 150 },
  { distance: 1500, elevation: 130 },
  { distance: 2000, elevation: 110 },
];

describe('ElevationProfile', () => {
  it('renders the chart when data has 2+ points', () => {
    const { container } = render(<ElevationProfile data={mockData} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('shows empty state when data has fewer than 2 points', () => {
    render(<ElevationProfile data={[]} />);
    expect(screen.getByText("Pas assez de données d'élévation")).toBeInTheDocument();
  });

  it('shows empty state with single point', () => {
    render(<ElevationProfile data={[{ distance: 0, elevation: 100 }]} />);
    expect(screen.getByText("Pas assez de données d'élévation")).toBeInTheDocument();
  });

  it('displays total distance', () => {
    render(<ElevationProfile data={mockData} height={100} />);
    expect(screen.getByText('2.0 km')).toBeInTheDocument();
  });

  it('displays D+ correctly', () => {
    render(<ElevationProfile data={mockData} height={100} />);
    expect(screen.getByText(/D\+/)).toBeInTheDocument();
  });

  it('accepts custom height', () => {
    const { container } = render(<ElevationProfile data={mockData} height={200} />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });

  it('accepts custom color', () => {
    const { container } = render(<ElevationProfile data={mockData} color="#22c55e" />);
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });
});
