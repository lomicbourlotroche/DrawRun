import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaperingChart } from '@/components/features/coach/TaperingChart';

// Mock Recharts — JSDOM has no SVG rendering engine
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ReferenceLine: () => null,
  defs: () => null,
  linearGradient: () => null,
  stop: () => null,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Zap: () => <span data-testid="icon-zap" />,
  Calendar: () => <span data-testid="icon-calendar" />,
  TrendingDown: () => <span data-testid="icon-trending-down" />,
}));

// Mock the Card UI component
vi.mock('@/components/ui', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

const mockTaperData = {
  plan: [
    { daysOut: 14, volumePercent: 100, intensityPercent: 100 },
    { daysOut: 7, volumePercent: 75, intensityPercent: 100 },
    { daysOut: 3, volumePercent: 55, intensityPercent: 100 },
    { daysOut: 1, volumePercent: 45, intensityPercent: 100 },
    { daysOut: 0, volumePercent: 40, intensityPercent: 100 },
  ],
  expectedGain: 3.5,
  reference: 'Mujika & Padilla (2003). MSSE.',
  recommendations: [
    'Maintenez 2 séances courtes et intenses par semaine.',
    'Dormez 8-9h par nuit cette semaine.',
    'Chargez en glucides les 3 derniers jours.',
  ],
};

describe('TaperingChart', () => {
  it('renders without crashing with valid data', () => {
    const { container } = render(<TaperingChart data={mockTaperData} />);
    expect(container).toBeDefined();
  });

  it('renders the plan title', () => {
    render(<TaperingChart data={mockTaperData} />);
    // The component renders "Plan d'Affûtage (Phase J-14)"
    expect(screen.getByText(/Plan d'Affûtage/i)).toBeDefined();
  });

  it('displays the expected gain percentage', () => {
    render(<TaperingChart data={mockTaperData} />);
    expect(screen.getByText(/\+3\.5%/)).toBeDefined();
  });

  it('renders the "Pourquoi l\'affûtage" section', () => {
    render(<TaperingChart data={mockTaperData} />);
    // Uses &apos; entity which renders as apostrophe
    const heading = screen.getByText(/Pourquoi l.affûtage/i);
    expect(heading).toBeDefined();
  });

  it('displays strategic recommendations', () => {
    render(<TaperingChart data={mockTaperData} />);
    expect(screen.getByText(/Maintenez 2 séances/i)).toBeDefined();
    expect(screen.getByText(/Dormez 8-9h/i)).toBeDefined();
  });

  it('shows the science reference', () => {
    render(<TaperingChart data={mockTaperData} />);
    expect(screen.getByText(/Mujika & Padilla/i)).toBeDefined();
  });

  it('returns null when data is null', () => {
    const { container } = render(<TaperingChart data={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when data has no plan', () => {
    const { container } = render(<TaperingChart data={{ expectedGain: 3 } as any} />);
    expect(container.firstChild).toBeNull();
  });
});
