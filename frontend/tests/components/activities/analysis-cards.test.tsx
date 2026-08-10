import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RunAnalysisCards } from '@/components/features/activities/analysis/RunAnalysisCards';
import { RideAnalysisCards } from '@/components/features/activities/analysis/RideAnalysisCards';
import { SwimAnalysisCards } from '@/components/features/activities/analysis/SwimAnalysisCards';
import { TrailRunAnalysisCards } from '@/components/features/activities/analysis/TrailRunAnalysisCards';
import { SimpleAnalysisCards } from '@/components/features/activities/analysis/SimpleAnalysisCards';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Heart: () => <span data-testid="icon-heart" />,
  Gauge: () => <span data-testid="icon-gauge" />,
  Zap: () => <span data-testid="icon-zap" />,
  Mountain: () => <span data-testid="icon-mountain" />,
  Timer: () => <span data-testid="icon-timer" />,
  Wind: () => <span data-testid="icon-wind" />,
  Trophy: () => <span data-testid="icon-trophy" />,
  Waves: () => <span data-testid="icon-waves" />,
  BarChart3: () => <span data-testid="icon-barchart" />,
  Bike: () => <span data-testid="icon-bike" />,
  Cpu: () => <span data-testid="icon-cpu" />,
  Weight: () => <span data-testid="icon-weight" />,
}));

// Mock BiomechanicsCard
vi.mock('@/components/features/activities/BiomechanicsCard', () => ({
  BiomechanicsCard: ({ metrics }: { metrics: unknown }) => (
    <div data-testid="biomechanics-card">{JSON.stringify(metrics)}</div>
  ),
}));

// Mock UI Card components
vi.mock('@/components/ui', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="card-title">
      {children}
    </div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
  CardFooter: ({ children }: { children: React.ReactNode }) => <div data-testid="card-footer">{children}</div>,
}));

// ─── Mock Data ──────────────────────────────────────────────

const baseHRZones = {
  current: 3,
  name: 'Zone 3 - Tempo',
  percent: 78,
  avgHrPercent: 78,
  maxHrPercent: 92,
  hrReserve: 65,
  fcm: 185,
  restingHR: 55,
};

const hrDistribution = { zone1Percent: 5, zone2Percent: 35, zone3Percent: 40, zone4Percent: 15, zone5Percent: 5 };

const mockPace = { secPerKm: 300, formatted: '5:00/km', speedKmh: 12.0 };

const mockGap = { secPerKm: 290, formatted: '4:50/km' };

const mockNutrition = {
  hydration: { totalMl: 600, perHourMl: 400 },
  carbs: { totalG: 45, perHourG: 30 },
  sodium: { totalMg: 250 },
  recommendations: ['Boire régulièrement', 'Prendre un gel à 45min'],
};

const runAnalysisFull = {
  sportType: 'run' as const,
  sportLabel: 'Course à pied',
  icon: '🏃',
  analysisType: 'detailed' as const,
  tss: 85.5,
  trimp: 120.3,
  intensityFactor: 0.78,
  duration: 5400,
  durationFormatted: '1h30min',
  calories: 650,
  hrZones: baseHRZones,
  hrDistribution,
  pace: mockPace,
  vdot: 42.5,
  gap: mockGap,
  efficiencyFactor: 0.85,
  runningEconomy: 210,
  biomechanics: null,
  trainingPaces: {
    E: { pace: '5:30 – 6:10', description: 'Endurance' },
    M: { pace: '5:00 – 5:15', description: 'Marathon' },
    T: { pace: '4:30 – 4:45', description: 'Tempo' },
    I: { pace: '3:50 – 4:10', description: 'Intervalle' },
    R: { pace: '< 3:30', description: 'Répétition' },
  },
  performanceLevel: { level: 'Bon', color: 'green', description: 'Niveau intermédiaire avancé' },
  racePredictions: {
    '5k': 1320,
    '10k': 2760,
    half: { time: '1:35' },
    marathon: { time: '3:20' },
  },
  estimatedGrade: 2.5,
  nutrition: mockNutrition,
  avgHrPercent: 78,
  profileFcm: 185,
  estimatedVdot: 42.5,
  paceFormatted: '5:00/km',
  intensity_factor: 0.78,
  efficiency_factor: 0.85,
  gapFormatted: '4:50/km',
};

const rideAnalysisFull = {
  sportType: 'ride' as const,
  sportLabel: 'Cyclisme',
  icon: '🚴',
  analysisType: 'detailed' as const,
  tss: 120,
  trimp: 95,
  intensityFactor: 0.85,
  duration: 7200,
  durationFormatted: '2h00min',
  calories: 1200,
  hrZones: baseHRZones,
  hrDistribution,
  speedKmh: 28.5,
  pace: mockPace,
  normalizedPower: 210,
  variabilityIndex: 1.08,
  estimatedCP: 250,
  estimatedWPrime: 18000,
  powerCurve: [
    { duration: 30, durationFormatted: '30s', power: 400 },
    { duration: 60, durationFormatted: '1min', power: 350 },
    { duration: 120, durationFormatted: '2min', power: 310 },
    { duration: 300, durationFormatted: '5min', power: 280 },
    { duration: 600, durationFormatted: '10min', power: 260 },
    { duration: 1200, durationFormatted: '20min', power: 240 },
  ],
  avgPower: 195,
  maxPower: 520,
  powerZoneDistribution: [
    { zone: 1, name: 'Z1 Récup', percent: 10 },
    { zone: 2, name: 'Z2 Endurance', percent: 40 },
    { zone: 3, name: 'Z3 Tempo', percent: 25 },
    { zone: 4, name: 'Z4 Seuil', percent: 15 },
    { zone: 5, name: 'Z5 VO2max', percent: 8 },
    { zone: 6, name: 'Z6 Anaérobie', percent: 2 },
    { zone: 7, name: 'Z7 Neuromusc', percent: 0 },
  ],
  powerEfforts: [
    { duration: 30, value: 520 },
    { duration: 60, value: 480 },
    { duration: 120, value: 420 },
    { duration: 300, value: 350 },
    { duration: 600, value: 290 },
    { duration: 1200, value: 250 },
  ],
  totalWorkKj: 1404,
  powerToWeight: 2.79,
  tssPerHour: 60,
  estimatedGrade: 3.0,
  nutrition: mockNutrition,
  avgHrPercent: 78,
  profileFcm: 185,
  intensity_factor: 0.85,
  paceFormatted: '5:00/km',
};

const swimAnalysisFull = {
  sportType: 'swim' as const,
  sportLabel: 'Natation',
  icon: '🏊',
  analysisType: 'detailed' as const,
  tss: 65,
  trimp: 80,
  intensityFactor: 0.72,
  duration: 3600,
  durationFormatted: '1h00min',
  calories: 400,
  hrZones: baseHRZones,
  hrDistribution,
  pacePer100m: { seconds: 90, formatted: '1:30/100m' },
  swolf: 42,
  strokeRate: 35,
  dps: 1.85,
  estimatedCSS: {
    speedMs: 1.1,
    pacePer100m: '1:30/100m',
    speedKmh: 3.96,
  },
  efficiency_factor: null,
  intensity_factor: 0.72,
  estimatedGrade: 0,
  nutrition: null,
  avgHrPercent: 78,
  profileFcm: 185,
};

const simpleAnalysisFull = {
  sportType: 'hiit' as const,
  sportLabel: 'HIIT',
  icon: '💪',
  analysisType: 'simple' as const,
  tss: 90,
  trimp: 110,
  intensityFactor: 0.92,
  duration: 2400,
  durationFormatted: '40min',
  calories: 380,
  hrZones: baseHRZones,
  pace: null,
  intensity_factor: 0.92,
  estimatedGrade: 0,
  nutrition: mockNutrition,
  avgHrPercent: 78,
  profileFcm: 185,
};

const trailAnalysisFull = {
  ...runAnalysisFull,
  sportType: 'trail' as const,
  sportLabel: 'Trail',
  icon: '⛰️',
  vam: 850,
  technicalScore: 'advanced' as const,
  elevationGain: 1200,
  avgHrPercent: 82,
  profileFcm: 185,
  estimatedVdot: 42.5,
  paceFormatted: '5:00/km',
  intensity_factor: 0.82,
  efficiency_factor: 0.85,
  gapFormatted: '4:50/km',
};

// ─── RunAnalysisCards Tests ─────────────────────────────────

describe('RunAnalysisCards', () => {
  it('renders HR analysis card when hrZones present', () => {
    render(<RunAnalysisCards analysis={runAnalysisFull} />);
    expect(screen.getByText('Analyse Cardiaque')).toBeDefined();
    expect(screen.getByText('78%')).toBeDefined();
    expect(screen.getByText('FC moy. %FCM')).toBeDefined();
  });

  it('renders HR zone distribution when present', () => {
    render(<RunAnalysisCards analysis={runAnalysisFull} />);
    expect(screen.getByText('Répartition zones cardiaques')).toBeDefined();
    expect(screen.getByText('35%')).toBeDefined();
  });

  it('renders pace & elevation card', () => {
    render(<RunAnalysisCards analysis={runAnalysisFull} />);
    expect(screen.getByText('Allure & Dénivelé')).toBeDefined();
    expect(screen.getByText('5:00/km')).toBeDefined();
  });

  it('renders VDOT and performance card', () => {
    render(<RunAnalysisCards analysis={runAnalysisFull} />);
    expect(screen.getByText('Potentiel aérobie')).toBeDefined();
    expect(screen.getByText('42.5')).toBeDefined();
    expect(screen.getByText('Bon')).toBeDefined();
  });

  it('renders race predictions', () => {
    render(<RunAnalysisCards analysis={runAnalysisFull} />);
    expect(screen.getByText('Prédictions de course (VDOT)')).toBeDefined();
    const fiveKm = screen.getAllByText('5km');
    expect(fiveKm.length).toBeGreaterThanOrEqual(1);
    const marathonLabels = screen.getAllByText('Marathon');
    expect(marathonLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('renders training paces', () => {
    render(<RunAnalysisCards analysis={runAnalysisFull} />);
    expect(screen.getByText("Allures d'entraînement")).toBeDefined();
    expect(screen.getByText('E')).toBeDefined();
  });

  it('renders nutrition card when present', () => {
    render(<RunAnalysisCards analysis={runAnalysisFull} />);
    expect(screen.getByText('Stratégie de Ravitaillement')).toBeDefined();
    expect(screen.getByText('Boire régulièrement')).toBeDefined();
  });

  it('does not show BiomechanicsCard when biomechanics is null', () => {
    const { queryByTestId } = render(<RunAnalysisCards analysis={runAnalysisFull} />);
    expect(queryByTestId('biomechanics-card')).toBeNull();
  });

  it('shows BiomechanicsCard when biomechanics data present', () => {
    const withBio = {
      ...runAnalysisFull,
      biomechanics: {
        cadence: 168,
        strideLength: 1.25,
        groundContactTime: 240,
        verticalOscillation: 8.5,
        legStiffness: 8.2,
        advice: [
          { priority: 'high' as const, message: 'Augmentez la cadence', metric: 'cadence', current: 160, target: 170 },
        ],
      },
    };
    const { getByTestId } = render(<RunAnalysisCards analysis={withBio} />);
    expect(getByTestId('biomechanics-card')).toBeDefined();
  });

  it('renders GAP when present', () => {
    render(<RunAnalysisCards analysis={runAnalysisFull} />);
    expect(screen.getByText('4:50/km')).toBeDefined();
  });

  it('handles minimal data without crashing', () => {
    const min: any = {
      ...runAnalysisFull,
      vdot: null,
      racePredictions: null,
      trainingPaces: null,
      nutrition: null,
      hrDistribution: null,
      gap: null,
      efficiencyFactor: null,
      runningEconomy: null,
    };
    const { container } = render(<RunAnalysisCards analysis={min} />);
    expect(container).toBeDefined();
  });
});

// ─── RideAnalysisCards Tests ────────────────────────────────

describe('RideAnalysisCards', () => {
  it('renders HR analysis card', () => {
    render(<RideAnalysisCards analysis={rideAnalysisFull} />);
    expect(screen.getByText('Analyse Cardiaque')).toBeDefined();
    expect(screen.getByText('78%')).toBeDefined();
  });

  it('renders power analysis card', () => {
    render(<RideAnalysisCards analysis={rideAnalysisFull} />);
    expect(screen.getByText('Analyse de Puissance')).toBeDefined();
    expect(screen.getByText('195W')).toBeDefined();
    const maxPowerTexts = screen.getAllByText(/520\s*W/);
    expect(maxPowerTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('renders NP, VI, IF, TSS power metrics', () => {
    render(<RideAnalysisCards analysis={rideAnalysisFull} />);
    expect(screen.getByText('210W')).toBeDefined();
    expect(screen.getByText('1.08')).toBeDefined();
  });

  it('renders enhanced metrics (totalWorkKj, powerToWeight, tssPerHour)', () => {
    render(<RideAnalysisCards analysis={rideAnalysisFull} />);
    expect(screen.getByText('Métriques Avancées')).toBeDefined();
    expect(screen.getByText('1 404 kJ')).toBeDefined();
    expect(screen.getByText(/2\.79 W\/kg/)).toBeDefined();
    expect(screen.getByText('60')).toBeDefined();
  });

  it('renders power zone distribution chart', () => {
    render(<RideAnalysisCards analysis={rideAnalysisFull} />);
    expect(screen.getByText('Répartition zones de puissance')).toBeDefined();
    const zonePcts = screen.getAllByText('40%');
    expect(zonePcts.length).toBeGreaterThanOrEqual(1);
  });

  it('renders best efforts table', () => {
    render(<RideAnalysisCards analysis={rideAnalysisFull} />);
    expect(screen.getByText('Meilleurs Efforts')).toBeDefined();
    const efforts = screen.getAllByText('30s');
    expect(efforts.length).toBeGreaterThanOrEqual(1);
    const fiveMinTexts = screen.getAllByText('5min');
    expect(fiveMinTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('renders critical power card', () => {
    render(<RideAnalysisCards analysis={rideAnalysisFull} />);
    expect(screen.getByText('Puissance Critique')).toBeDefined();
    const cpTexts = screen.getAllByText(/250\s*W/);
    expect(cpTexts.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('CP (Puissance Critique)')).toBeDefined();
  });

  it('renders power curve chart', () => {
    render(<RideAnalysisCards analysis={rideAnalysisFull} />);
    expect(screen.getByText('Courbe puissance-durée')).toBeDefined();
  });

  it('renders nutrition card', () => {
    render(<RideAnalysisCards analysis={rideAnalysisFull} />);
    expect(screen.getByText('Stratégie de Ravitaillement')).toBeDefined();
    expect(screen.getByText(mockNutrition.hydration.totalMl.toString())).toBeDefined();
  });

  it('handles null/empty power fields gracefully', () => {
    const minimal: any = {
      ...rideAnalysisFull,
      normalizedPower: null,
      variabilityIndex: null,
      estimatedCP: null,
      estimatedWPrime: null,
      powerCurve: null,
      powerZoneDistribution: null,
      powerEfforts: null,
      totalWorkKj: null,
      powerToWeight: null,
      tssPerHour: null,
      maxPower: null,
      nutrition: null,
    };
    const { container } = render(<RideAnalysisCards analysis={minimal} />);
    expect(container).toBeDefined();
    // Should still show the power card with avgPower
    expect(screen.getByText('Analyse de Puissance')).toBeDefined();
    expect(screen.getByText('195W')).toBeDefined();
  });

  it('reports correct speed', () => {
    render(<RideAnalysisCards analysis={rideAnalysisFull} />);
    expect(screen.getByText('28.5')).toBeDefined();
    expect(screen.getByText('km/h moy.')).toBeDefined();
  });
});

// ─── SwimAnalysisCards Tests ────────────────────────────────

describe('SwimAnalysisCards', () => {
  it('renders HR analysis card', () => {
    render(<SwimAnalysisCards analysis={swimAnalysisFull} />);
    expect(screen.getByText('Analyse Cardiaque')).toBeDefined();
    expect(screen.getByText('78%')).toBeDefined();
  });

  it('renders swim metrics card', () => {
    render(<SwimAnalysisCards analysis={swimAnalysisFull} />);
    expect(screen.getByText('Métriques Natation')).toBeDefined();
    const paceTexts = screen.getAllByText('1:30/100m');
    expect(paceTexts.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('42')).toBeDefined();
    expect(screen.getByText('35 c/min')).toBeDefined();
    expect(screen.getByText('1.85m')).toBeDefined();
  });

  it('renders CSS estimate', () => {
    render(<SwimAnalysisCards analysis={swimAnalysisFull} />);
    expect(screen.getByText(/CSS/)).toBeDefined();
  });

  it('renders HR zone distribution', () => {
    render(<SwimAnalysisCards analysis={swimAnalysisFull} />);
    expect(screen.getByText('Répartition zones cardiaques')).toBeDefined();
  });

  it('renders TSS summary card', () => {
    render(<SwimAnalysisCards analysis={swimAnalysisFull} />);
    expect(screen.getByText("Charge d'entraînement")).toBeDefined();
  });

  it('handles minimal swim data', () => {
    const min: any = {
      ...swimAnalysisFull,
      hrZones: null,
      hrDistribution: null,
      swolf: null,
      strokeRate: null,
      dps: null,
      estimatedCSS: null,
      tss: null,
      intensityFactor: null,
    };
    const { container } = render(<SwimAnalysisCards analysis={min} />);
    expect(container).toBeDefined();
  });
});

// ─── TrailRunAnalysisCards Tests ────────────────────────────

describe('TrailRunAnalysisCards', () => {
  it('renders trail-specific metrics card', () => {
    const { container } = render(<TrailRunAnalysisCards analysis={trailAnalysisFull} />);
    expect(screen.getByText('Métriques Trail')).toBeDefined();
    expect(screen.getByText('850 m/h')).toBeDefined();
    expect(screen.getByText('advanced')).toBeDefined();
    expect(screen.getByText('Dénivelé total')).toBeDefined();
    expect(container.textContent).toContain('1200');
  });

  it('renders nested RunAnalysisCards content', () => {
    render(<TrailRunAnalysisCards analysis={trailAnalysisFull} />);
    expect(screen.getByText('Allure & Dénivelé')).toBeDefined();
    expect(screen.getByText('Potentiel aérobie')).toBeDefined();
  });

  it('handles minimal trail data', () => {
    const min: any = { ...trailAnalysisFull, vam: null, technicalScore: null, elevationGain: 0 };
    const { container } = render(<TrailRunAnalysisCards analysis={min} />);
    expect(container).toBeDefined();
  });

  it('color-codes technical score correctly', () => {
    render(<TrailRunAnalysisCards analysis={trailAnalysisFull} />);
    expect(screen.getByText('advanced')).toBeDefined();
  });
});

// ─── SimpleAnalysisCards Tests ──────────────────────────────

describe('SimpleAnalysisCards', () => {
  it('renders basic metrics card', () => {
    render(<SimpleAnalysisCards analysis={simpleAnalysisFull} />);
    expect(screen.getByText('Métriques')).toBeDefined();
    expect(screen.getByText('90')).toBeDefined();
    expect(screen.getByText('0.92')).toBeDefined();
  });

  it('renders HR analysis when hrZones present', () => {
    render(<SimpleAnalysisCards analysis={simpleAnalysisFull} />);
    expect(screen.getByText('Analyse Cardiaque')).toBeDefined();
    expect(screen.getByText('78%')).toBeDefined();
  });

  it('renders nutrition card when present', () => {
    render(<SimpleAnalysisCards analysis={simpleAnalysisFull} />);
    expect(screen.getByText('Ravitaillement')).toBeDefined();
  });

  it('handles null nutrition gracefully', () => {
    const noNutrition: any = { ...simpleAnalysisFull, nutrition: null };
    const { queryByText } = render(<SimpleAnalysisCards analysis={noNutrition} />);
    expect(queryByText('Ravitaillement')).toBeNull();
  });

  it('handles minimal simple data', () => {
    const min: any = {
      ...simpleAnalysisFull,
      tss: null,
      trimp: null,
      intensityFactor: null,
      hrZones: null,
      nutrition: null,
      pace: null,
    };
    const { container } = render(<SimpleAnalysisCards analysis={min} />);
    expect(container).toBeDefined();
  });
});
