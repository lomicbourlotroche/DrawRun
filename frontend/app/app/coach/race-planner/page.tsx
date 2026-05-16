'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Upload, 
  Map as MapIcon, 
  TrendingUp, 
  Thermometer, 
  Droplets, 
  Timer, 
  ChevronRight, 
  Download, 
  Zap,
  Info,
  ChevronLeft
} from 'lucide-react';
import { api } from '@/lib/api';
import { 
  Button, 
  Card, 
  Input 
} from '@/components/ui';
import { GlassCard } from '@/components/ui/GlassCard';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Bar,
  Cell
} from 'recharts';
import { TaperingChart } from '@/components/features/coach/TaperingChart';

export default function RacePlannerPage() {
  const _router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState(1);
  const [_isUploading, _setIsUploading] = useState(false);
  const [gpxData, setGpxData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const [params, setParams] = useState({
    temp: 15,
    humidity: 50,
    goalTime: '', // minutes
  });
  
  const [strategy, setStrategy] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setGpxData(event.target?.result as string);
      setStep(2);
    };
    reader.readAsText(file);
  };

  const calculateStrategy = async () => {
    if (!gpxData) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.calculateRaceStrategy({
        gpxData,
        params: {
          temp: params.temp,
          humidity: params.humidity,
          goalTime: params.goalTime ? parseInt(params.goalTime) : undefined
        }
      });
      setStrategy(response);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du calcul de la stratégie');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPace = (paceStr: string) => {
    return paceStr + ' /km';
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.round(seconds % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  const downloadCsv = () => {
    if (!strategy) return;
    const headers = ['KM', 'Distance (m)', 'Elevation Gain (m)', 'Elevation Loss (m)', 'Grade (%)', 'Target Pace', 'Target Pace (sec)', 'Cumulative Time (sec)'];
    const rows = strategy.segments.map((s: any) => [
      s.km,
      s.distance,
      s.elevGain,
      s.elevLoss,
      s.grade,
      s.targetPace,
      s.targetPaceSec,
      s.cumulativeTime
    ]);
    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `race_strategy_${fileName?.split('.')[0] || 'plan'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary bg-clip-text text-transparent">
            Planificateur de Course 2.0
          </h1>
          <p className="text-muted-foreground mt-1">
            Optimisez votre allure en fonction du relief et de la météo.
          </p>
        </div>
        
        {step > 1 && (
          <Button 
            variant="outline" 
            onClick={() => setStep(step - 1)}
            className="w-fit"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                step >= s ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground'
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div className={`w-12 h-1 rounded-full ${step > s ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <Card className="max-w-2xl mx-auto p-12 border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".gpx" 
            className="hidden" 
          />
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-6 bg-primary/10 rounded-full group-hover:scale-110 transition-transform">
              <Upload className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Importez votre fichier GPX</h2>
              <p className="text-muted-foreground mt-2">
                Glissez-déposez ou cliquez pour sélectionner le parcours de votre course.
              </p>
            </div>
            <Button size="lg" className="rounded-full px-8">
              Sélectionner un fichier
            </Button>
            <p className="text-xs text-muted-foreground">
              Supporte les fichiers GPX standards de Garmin, Strava, Komoot...
            </p>
          </div>
        </Card>
      )}

      {/* Step 2: Params */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 p-6 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <MapIcon className="w-5 h-5 text-secondary" />
              </div>
              <h2 className="text-xl font-bold">Configuration de la course</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-peak" />
                  Température prévue (°C)
                </label>
                <Input 
                  type="number" 
                  value={params.temp} 
                  onChange={(e) => setParams({...params, temp: parseInt(e.target.value)})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-primary" />
                  Humidité relative (%)
                </label>
                <Input 
                  type="number" 
                  value={params.humidity} 
                  onChange={(e) => setParams({...params, humidity: parseInt(e.target.value)})}
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Timer className="w-4 h-4 text-primary" />
                  Objectif de temps (optionnel, en minutes)
                </label>
                <Input 
                  type="number" 
                  placeholder="Laissez vide pour utiliser votre VDOT actuel"
                  value={params.goalTime} 
                  onChange={(e) => setParams({...params, goalTime: e.target.value})}
                />
                <p className="text-xs text-muted-foreground">
                  Si vide, l&apos;allure sera calculée en fonction de votre niveau de performance actuel.
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button 
                size="lg" 
                onClick={calculateStrategy}
                disabled={isLoading}
                className="rounded-full px-12 bg-gradient-to-r from-primary to-secondary"
              >
                {isLoading ? 'Calcul en cours...' : 'Générer ma stratégie'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            
            {error && <p className="text-danger text-sm">{error}</p>}
          </Card>
          
          <Card className="p-6 bg-muted/30">
            <h3 className="font-bold mb-4">Fichier sélectionné</h3>
            <div className="flex items-center gap-3 p-3 bg-white border rounded-xl">
              <div className="p-2 bg-primary/10 rounded-lg text-primary text-xs font-bold">GPX</div>
              <span className="text-sm truncate font-medium">{fileName}</span>
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
                <p className="text-xs text-muted-foreground">
                   L&apos;algorithme analyse le relief mètre par mètre pour ajuster l&apos;effort cible.
                   Une correction de &quot;cardiac drift&quot; est appliqu&eacute;e pour les efforts longs ({'>'}90min).
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && strategy && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <GlassCard className="p-4 flex flex-col items-center text-center">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Distance Totale</span>
              <span className="text-2xl font-bold mt-1">{(strategy.summary.totalDistance / 1000).toFixed(2)} km</span>
            </GlassCard>
            <GlassCard className="p-4 flex flex-col items-center text-center border-l-primary/20">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Temps Estimé</span>
              <span className="text-2xl font-bold mt-1 text-primary">{formatTime(strategy.summary.totalTimeSec)}</span>
            </GlassCard>
            <GlassCard className="p-4 flex flex-col items-center text-center">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Dénivelé +</span>
              <span className="text-2xl font-bold mt-1">+{strategy.summary.totalElevationGain}m</span>
            </GlassCard>
            <GlassCard className="p-4 flex flex-col items-center text-center">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Allure Moyenne</span>
              <span className="text-2xl font-bold mt-1">{strategy.summary.averagePace} /km</span>
            </GlassCard>
          </div>

          {/* Charts */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Profil d&apos;Allure &amp; Élévation
            </h3>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={strategy.segments}>
                  <defs>
                    <linearGradient id="colorElev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="km" 
                    label={{ value: 'Kilomètre', position: 'insideBottomRight', offset: -5 }} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="left" 
                    label={{ value: 'Elev (m)', angle: -90, position: 'insideLeft' }} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    reversed 
                    label={{ value: 'Allure (sec)', angle: 90, position: 'insideRight' }} 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any, name: string) => {
                      if (name === 'targetPaceSec') return [formatPace(`${Math.floor(value / 60)}:${String(Math.round(value % 60)).padStart(2, '0')}`), 'Allure'];
                      if (name === 'elevGain') return [`+${value}m`, 'Dénivelé'];
                      return [value, name];
                    }}
                  />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="elevGain" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorElev)" 
                    name="Elevation"
                  />
                  <Bar 
                    yAxisId="right"
                    dataKey="targetPaceSec" 
                    fill="#f43f5e" 
                    fillOpacity={0.6}
                    name="Allure"
                  >
                    {strategy.segments.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.grade > 1 ? '#f43f5e' : entry.grade < -1 ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Bar>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 text-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-danger/60 rounded-sm"></div>
                <span>Montée (Allure +)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-success/60 rounded-sm"></div>
                <span>Descente (Allure -)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-primary/10 border border-primary/30 rounded-sm"></div>
                <span>Profil Altitude</span>
              </div>
            </div>
          </Card>
          
          {/* Tapering Analysis */}
          {strategy.taper && (
            <TaperingChart data={strategy.taper} />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Split Table */}
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Détails des Splits (km)</h3>
              <div className="overflow-auto max-h-[500px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white border-b">
                    <tr className="text-left text-muted-foreground">
                      <th className="pb-3 font-medium">KM</th>
                      <th className="pb-3 font-medium">Allure</th>
                      <th className="pb-3 font-medium">Cumulé</th>
                      <th className="pb-3 font-medium">Pente</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {strategy.segments.map((s: any) => (
                      <tr key={s.km} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 font-bold">{s.km}</td>
                        <td className="py-3 font-mono text-primary font-bold">{s.targetPace}</td>
                        <td className="py-3 text-muted-foreground font-mono">{formatTime(s.cumulativeTime)}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.grade > 2 ? 'bg-red-100 text-red-700' : 
                            s.grade < -2 ? 'bg-green-100 text-green-700' : 
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {s.grade > 0 ? '+' : ''}{s.grade}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Nutrition & Strategy */}
            <div className="space-y-6">
              <Card className="p-6 bg-gradient-to-br from-primary-600 to-primary-700 text-white border-none shadow-xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Stratégie de Nutrition
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/10 rounded-2xl">
                      <p className="text-white/70 text-xs font-medium uppercase">Glucides</p>
                      <p className="text-2xl font-bold">{strategy.nutrition.carbs.totalG}g</p>
                      <p className="text-xs mt-1 text-white/80">{strategy.nutrition.carbs.perHourG}g / heure</p>
                    </div>
                    <div className="p-4 bg-white/10 rounded-2xl">
                      <p className="text-white/70 text-xs font-medium uppercase">Hydratation</p>
                      <p className="text-2xl font-bold">{strategy.nutrition.hydration.totalMl}ml</p>
                      <p className="text-xs mt-1 text-white/80">{strategy.nutrition.hydration.perHourMl}ml / heure</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold border-b border-white/20 pb-2">Recommandations clés</h4>
                    <ul className="space-y-2">
                      {strategy.nutrition.recommendations.map((rec: string, i: number) => (
                        <li key={i} className="text-xs flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1 shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-bold mb-4">Options d&apos;export</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="w-full" onClick={downloadCsv}>
                    <Download className="w-4 h-4 mr-2" />
                    Format CSV
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Format PDF
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
