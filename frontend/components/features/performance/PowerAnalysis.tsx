'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import { Zap, TrendingUp, Activity, Battery, Gauge } from '@/components/ui/icons';

interface PowerAnalysisProps {
  activityId?: number;
  wattsData?: number[];
  duration?: number; // in seconds
}

interface PowerZone {
  name: string;
  range: string;
  minPercent: number;
  maxPercent: number;
  color: string;
  description: string;
}

const POWER_ZONES: PowerZone[] = [
  {
    name: 'Récupération active',
    range: '< 55%',
    minPercent: 0,
    maxPercent: 55,
    color: 'var(--success)',
    description: 'Récupération et endurance de base',
  },
  {
    name: 'Endurance',
    range: '56-75%',
    minPercent: 56,
    maxPercent: 75,
    color: 'var(--primary)',
    description: 'Endurance aérobie',
  },
  {
    name: 'Tempo',
    range: '76-90%',
    minPercent: 76,
    maxPercent: 90,
    color: 'var(--peak)',
    description: 'Tempo et endurance lactique',
  },
  {
    name: 'Seuil',
    range: '91-105%',
    minPercent: 91,
    maxPercent: 105,
    color: 'var(--peak)',
    description: 'Seuil anaérobie',
  },
  {
    name: 'VO2 Max',
    range: '106-120%',
    minPercent: 106,
    maxPercent: 120,
    color: 'var(--danger)',
    description: 'VO2 Max et capacité aérobie',
  },
  {
    name: 'Anaérobie',
    range: '121-150%',
    minPercent: 121,
    maxPercent: 150,
    color: 'var(--secondary)',
    description: 'Capacité anaérobie',
  },
  {
    name: 'Neuromusculaire',
    range: '> 150%',
    minPercent: 150,
    maxPercent: 999,
    color: 'var(--danger)',
    description: 'Puissance neuromusculaire',
  },
];

export function PowerAnalysis({ activityId: _activityId, wattsData, duration }: PowerAnalysisProps) {
  const [ftp, setFtp] = useState<number | null>(null);
  const [manualFtp, setManualFtp] = useState('');
  const [showZones, setShowZones] = useState(true);

  const calculateMetrics = useCallback(() => {
    if (!wattsData || wattsData.length === 0) return null;

    const avgPower = wattsData.reduce((a, b) => a + b, 0) / wattsData.length;
    const maxPower = Math.max(...wattsData);
    const minPower = Math.min(...wattsData);

    // Normalized Power (simplified calculation)
    const fourthPower = wattsData.map((w) => Math.pow(w, 4));
    const avgFourthPower = fourthPower.reduce((a, b) => a + b, 0) / fourthPower.length;
    const normalizedPower = Math.pow(avgFourthPower, 0.25);

    // Intensity Factor
    const intensityFactor = ftp ? normalizedPower / ftp : null;

    // TSS (Training Stress Score)
    const tss = ftp && duration ? ((duration / 3600) * normalizedPower * (normalizedPower / ftp)) / (ftp * 0.01) : null;

    // Variability Index
    const variabilityIndex = normalizedPower / avgPower;

    return {
      avgPower: Math.round(avgPower),
      maxPower: Math.round(maxPower),
      minPower: Math.round(minPower),
      normalizedPower: Math.round(normalizedPower),
      intensityFactor: intensityFactor ? intensityFactor.toFixed(2) : null,
      tss: tss ? Math.round(tss) : null,
      variabilityIndex: variabilityIndex.toFixed(2),
    };
  }, [wattsData, ftp, duration]);

  const getZoneDistribution = useCallback(() => {
    if (!wattsData || !ftp) return [];

    const zones = POWER_ZONES.map((zone) => ({
      ...zone,
      count: 0,
      percentage: 0,
    }));

    wattsData.forEach((watt) => {
      const percentOfFtp = (watt / ftp) * 100;
      const zone = zones.find((z) => percentOfFtp >= z.minPercent && percentOfFtp < z.maxPercent);
      if (zone) zone.count++;
    });

    const total = wattsData.length;
    zones.forEach((zone) => {
      zone.percentage = Math.round((zone.count / total) * 100);
    });

    return zones.filter((z) => z.count > 0);
  }, [wattsData, ftp]);

  const metrics = calculateMetrics();
  const zoneDistribution = getZoneDistribution();

  if (!wattsData || wattsData.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Aucune donnée de puissance disponible</p>
          <p className="text-sm mt-2">Connectez un capteur de puissance pour voir l&apos;analyse</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* FTP Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5" />
            FTP (Functional Threshold Power)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              type="number"
              placeholder="Votre FTP en watts"
              value={manualFtp}
              onChange={(e) => setManualFtp(e.target.value)}
              className="w-48"
            />
            <Button onClick={() => setFtp(parseInt(manualFtp) || null)} variant={ftp ? 'outline' : 'default'}>
              {ftp ? 'Modifier' : 'Définir FTP'}
            </Button>
            {ftp && (
              <Button
                variant="ghost"
                onClick={() => {
                  setFtp(null);
                  setManualFtp('');
                }}
              >
                Effacer
              </Button>
            )}
          </div>
          {ftp && (
            <p className="text-sm text-muted mt-2">
              FTP actuelle: <span className="font-bold text-foreground">{ftp}W</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard icon={<Zap className="w-4 h-4" />} label="Puissance moy." value={`${metrics.avgPower}W`} />
          <MetricCard icon={<TrendingUp className="w-4 h-4" />} label="Puissance max." value={`${metrics.maxPower}W`} />
          <MetricCard
            icon={<Activity className="w-4 h-4" />}
            label="Puissance norm."
            value={`${metrics.normalizedPower}W`}
          />
          {metrics.intensityFactor && (
            <MetricCard
              icon={<Gauge className="w-4 h-4" />}
              label="Facteur intensité"
              value={metrics.intensityFactor}
            />
          )}
          {metrics.tss && (
            <MetricCard icon={<Battery className="w-4 h-4" />} label="TSS" value={metrics.tss.toString()} />
          )}
          <MetricCard icon={<Activity className="w-4 h-4" />} label="Var. Index" value={metrics.variabilityIndex} />
        </div>
      )}

      {/* Power Zones */}
      {ftp && zoneDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Distribution par zones
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowZones(!showZones)}>
                {showZones ? 'Masquer' : 'Afficher'}
              </Button>
            </div>
          </CardHeader>
          {showZones && (
            <CardContent>
              <div className="space-y-3">
                {zoneDistribution.map((zone) => (
                  <div key={zone.name} className="flex items-center gap-4">
                    <div className="w-4 h-4 rounded flex-shrink-0" style={{ backgroundColor: zone.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{zone.name}</span>
                        <span className="text-xs text-muted">({zone.range})</span>
                      </div>
                      <p className="text-xs text-muted truncate">{zone.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: zone.color,
                            width: `${Math.max(zone.percentage, 5)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{zone.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Power Zones Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Zones de puissance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {POWER_ZONES.map((zone) => (
              <div
                key={zone.name}
                className="p-3 rounded-lg border border-border"
                style={{ borderLeftColor: zone.color, borderLeftWidth: '4px' }}
              >
                <div className="font-medium text-sm">{zone.name}</div>
                <div className="text-xs text-muted">{zone.range} FTP</div>
                {ftp && (
                  <div className="text-xs mt-1">
                    {Math.round(ftp * (zone.minPercent / 100))} - {Math.round(ftp * (zone.maxPercent / 100))}W
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted mb-1">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <div className="text-xl font-bold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}

// FTP Calculator Component
export function FTPCalculator() {
  const [testPower, setTestPower] = useState('');
  const [testDuration, setTestDuration] = useState('20');
  const [calculatedFTP, setCalculatedFTP] = useState<number | null>(null);

  const calculateFTP = () => {
    const power = parseFloat(testPower);
    const duration = parseInt(testDuration);

    if (!power || !duration) return;

    let ftp: number;
    if (duration === 20) {
      ftp = power * 0.95; // Standard 20-min test
    } else if (duration === 60) {
      ftp = power; // 60-min test = FTP
    } else {
      // Interpolate
      const factor = 0.95 + (0.05 * (60 - duration)) / 40;
      ftp = power * factor;
    }

    setCalculatedFTP(Math.round(ftp));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="w-5 h-5" />
          Calculateur FTP
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Puissance moyenne (W)</label>
              <Input
                type="number"
                value={testPower}
                onChange={(e) => setTestPower(e.target.value)}
                placeholder="Ex: 250"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Durée du test (min)</label>
              <select
                value={testDuration}
                onChange={(e) => setTestDuration(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="20">20 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
          </div>
          <Button onClick={calculateFTP} className="w-full">
            Calculer mon FTP
          </Button>
          {calculatedFTP && (
            <div className="p-4 bg-primary/10 rounded-lg text-center">
              <div className="text-sm text-muted">Votre FTP estimée</div>
              <div className="text-3xl font-bold text-primary">{calculatedFTP}W</div>
              <div className="text-xs text-muted mt-1">
                Basé sur {testPower}W pendant {testDuration} minutes
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
