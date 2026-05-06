import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SegmentList } from '@/components/features/explore/Segments';

const mockSegments = [
  {
    id: 1,
    name: 'Montée de la Tour Eiffel',
    distance: 1200,
    elevation_gain: 45,
    avg_grade: 3.5,
    activity_type: 'Run',
    effort_count: 128,
    total_efforts: 128,
    unique_athletes: 45,
    kom: { user_name: 'John Doe', elapsed_time: 245 },
    qom: { user_name: 'Jane Smith', elapsed_time: 278 },
  },
  {
    id: 2,
    name: 'Sprint Champs-Élysées',
    distance: 800,
    elevation_gain: 5,
    avg_grade: 0.5,
    activity_type: 'Run',
    effort_count: 256,
    total_efforts: 256,
    unique_athletes: 89,
  },
];

describe('SegmentList', () => {
  it('renders list of segments', () => {
    render(<SegmentList segments={mockSegments} />);

    expect(screen.getByText('Montée de la Tour Eiffel')).toBeInTheDocument();
    expect(screen.getByText('Sprint Champs-Élysées')).toBeInTheDocument();
  });

  it('displays segment metrics correctly', () => {
    render(<SegmentList segments={mockSegments} />);

    expect(screen.getByText('1.20 km')).toBeInTheDocument();
    expect(screen.getByText('45m D+')).toBeInTheDocument();
    expect(screen.getByText('3.5% moy.')).toBeInTheDocument();
  });

  it('shows KOM and QOM information', () => {
    render(<SegmentList segments={mockSegments} />);

    expect(screen.getByText(/KOM:/)).toBeInTheDocument();
    expect(screen.getByText(/QOM:/)).toBeInTheDocument();
  });

  it('displays effort counts', () => {
    render(<SegmentList segments={mockSegments} />);

    expect(screen.getByText('128 efforts')).toBeInTheDocument();
    expect(screen.getByText('45 athlètes')).toBeInTheDocument();
  });

  it('calls onSegmentClick when segment clicked', () => {
    const onSegmentClick = vi.fn();
    render(<SegmentList segments={mockSegments} onSegmentClick={onSegmentClick} />);

    const segmentCard = screen.getByText('Montée de la Tour Eiffel').closest('.cursor-pointer');
    fireEvent.click(segmentCard!);

    expect(onSegmentClick).toHaveBeenCalledWith(mockSegments[0]);
  });

  it('shows empty state when no segments', () => {
    render(<SegmentList segments={[]} />);

    expect(screen.getByText('Aucun segment trouvé')).toBeInTheDocument();
  });

  it('shows loading skeleton when isLoading', () => {
    render(<SegmentList segments={[]} isLoading={true} />);

    // Check for skeleton elements
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
