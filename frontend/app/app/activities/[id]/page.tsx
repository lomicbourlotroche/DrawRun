'use client'

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Skeleton } from '@/components/ui';
import { StreamChart } from '@/components/ui/Charts';
import ActivityMap from '@/components/ui/ActivityMap';
import { api } from '@/lib/api';
import type { ActivityDetail as ActivityDetailType, ActivityStreams } from '@/types';
import type { SplitData, SplitSummary } from '@/types';
import { ArrowLeft, Heart, Timer, Gauge, Mountain, Activity as ActivityIcon, Zap, Wind, MapPin, Clock, Pencil, Check, X, Dumbbell, Cpu } from 'lucide-react';
import { toast } from 'sonner';
import { BiomechanicsCard } from '@/components/features/activities/BiomechanicsCard';
import { ShareSettingsPanel } from '@/components/features/activities';

function fmt(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function toNum(val: unknown): number {
  return typeof val === 'number' ? val : 0;
}

function toStr(val: unknown): string {
  return String(val ?? '');
}

function pace(ms: number) {
  if (!ms || ms <= 0) return '-';
  const s = 1000 / ms;
  return `${Math.floor(s / 60)}'${String(Math.round(s % 60)).padStart(2, '0')}`;
}

function paceFromMs(ms: number) {
  if (!ms || ms <= 0) return null;
  return 1000 / ms;
}

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activity, setActivity] = useState<ActivityDetailType | null>(null);
  const [streams, setStreams] = useState<ActivityStreams | null>(null);
  const [analysis, setAnalysis] = useState<Record<string, number | null> | null>(null);
  const [splits, setSplits] = useState<{ splits: SplitData[]; summary: SplitSummary } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const id = params.id as string;

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [a, s, an, sp] = await Promise.all([
        api.getActivity(Number(id)).catch(() => null),
        api.getActivityStreams(Number(id)).catch(() => null),
        api.getActivityAnalysis(Number(id)).catch(() => null),
        api.getActivitySplits(Number(id)).catch(() => null),
      ]);
      setActivity(a);
      if (a) setNotesValue(a.notes || a.description || '');
      setStreams(s);
      setAnalysis(an);
      setSplits(sp);
    } catch { toast.error('Erreur de chargement'); }
    finally { setIsLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const saveNotes = async () => {
    if (!activity) return;
    setSavingNotes(true);
    try {
      await api.updateActivity(Number(id), { notes: notesValue });
      setActivity(prev => prev ? { ...prev, notes: notesValue } : prev);
      setEditingNotes(false);
      toast.success('Notes sauvegardées');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSavingNotes(false);
    }
  };

  if (isLoading) return <div className="space-y-6 max-w-4xl mx-auto"><Skeleton className="h-10 w-48" /><Skeleton className="h-32 w-full" /><Skeleton className="h-40 w-full" /></div>;
  if (!activity) return <div className="text-center py-12"><ActivityIcon className="w-12 h-12 mx-auto mb-4 text-muted opacity-50" /><p className="text-muted">Activité non trouvée</p><Button variant="secondary" onClick={() => router.push('/app/activities')} className="mt-4">Retour</Button></div>;

  const src = activity.source || 'manual';
  const srcLabel = src === 'garmin' ? 'Garmin' : src === 'strava' ? 'Strava' : 'Manuel';
  const srcColor: 'primary' | 'warning' | 'default' = src === 'garmin' ? 'primary' : src === 'strava' ? 'warning' : 'default';

  // Extract stream arrays
  const extractData = (stream: unknown): number[] | null => {
    if (!stream) return null;
    if (Array.isArray(stream)) return stream as number[];
    if (typeof stream === 'object' && stream !== null && 'data' in stream) {
      const data = (stream as { data: unknown }).data;
      if (Array.isArray(data)) return data as number[];
    }
    return null;
  };
  const hrData = extractData(streams?.heartrate);
  const spdData = extractData(streams?.velocity_smooth);
  const altData = extractData(streams?.altitude);
  const cadData = extractData(streams?.cadence);
  const wattsData = extractData(streams?.watts);
  
  // Extract latlng for map
  const latlngData = streams?.latlng && Array.isArray(streams.latlng) 
    ? streams.latlng as [number, number][]
    : null;

  // HR zones coloring - use analysis data if available
  const avgHR = activity.average_heartrate;
  const maxHR = activity.max_heartrate;
  const fcm = (analysis?.profileFcm as number) || (avgHR ? Math.round(avgHR / 0.85) : null);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/app/activities')} className="mt-1"><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={srcColor}>{srcLabel}</Badge>
            <Badge variant="default">{activity.type}</Badge>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{activity.name}</h1>
          <p className="text-muted">{activity.start_date_local?.split('T')[0]} • {activity.start_date_local?.split(' ')[1] || ''}</p>
        </div>
      </div>

      {/* Map - Affichée uniquement s'il y a une trace GPX */}
      {(activity.map_polyline || (latlngData && latlngData.length > 0)) ? (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />Parcours</CardTitle></CardHeader>
          <CardContent>
            <ActivityMap 
              polyline={activity.map_polyline || undefined} 
              latlng={latlngData || undefined}
              className="h-64"
              color="#3B82F6"
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4 text-muted" />Parcours</CardTitle></CardHeader>
          <CardContent className="p-8 text-center">
            <div className="text-muted">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucune trace GPS disponible</p>
              <p className="text-xs mt-1">L&apos;activité ne contient pas de données de parcours</p>
              <p className="text-xs text-muted mt-1">Cette activité n&apos;a pas été synchronisée avec GPS ou le service ne fournit pas de trace</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-background border border-border">
          <div className="flex items-center gap-2 mb-1"><Gauge className="w-4 h-4 text-primary" /><span className="text-xs text-muted uppercase">Distance</span></div>
          <p className="text-xl font-bold text-foreground">{activity.distance > 1000 ? `${(activity.distance / 1000).toFixed(2)} km` : `${Math.round(activity.distance)} m`}</p>
        </div>
        <div className="p-4 rounded-xl bg-background border border-border">
          <div className="flex items-center gap-2 mb-1"><Timer className="w-4 h-4 text-primary" /><span className="text-xs text-muted uppercase">Durée</span></div>
          <p className="text-xl font-bold text-foreground">{fmt(activity.moving_time)}</p>
          {activity.elapsed_time && activity.elapsed_time > activity.moving_time && <p className="text-xs text-muted">Temps: {fmt(activity.elapsed_time)}</p>}
        </div>
        <div className="p-4 rounded-xl bg-background border border-border">
          <div className="flex items-center gap-2 mb-1"><Zap className="w-4 h-4 text-primary" /><span className="text-xs text-muted uppercase">Allure moy.</span></div>
          <p className="text-xl font-bold text-foreground">{pace(activity.average_speed)}</p>
          <p className="text-xs text-muted">/km</p>
        </div>
        {avgHR && <div className="p-4 rounded-xl bg-background border border-border">
          <div className="flex items-center gap-2 mb-1"><Heart className="w-4 h-4 text-red-400" /><span className="text-xs text-muted uppercase">FC moy.</span></div>
          <p className="text-xl font-bold text-foreground">{Math.round(avgHR)}</p>
          <p className="text-xs text-muted">{maxHR ? `Max: ${Math.round(maxHR)} bpm` : 'bpm'}</p>
        </div>}
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {activity.max_speed && <div className="text-center p-3 rounded-lg bg-background border border-border"><p className="text-sm font-bold text-foreground">{pace(activity.max_speed)}</p><p className="text-xs text-muted">Allure max</p></div>}
        {activity.max_heartrate && <div className="text-center p-3 rounded-lg bg-background border border-border"><p className="text-sm font-bold text-red-400">{Math.round(activity.max_heartrate)}</p><p className="text-xs text-muted">FC max</p></div>}
        {activity.total_elevation_gain && <div className="text-center p-3 rounded-lg bg-background border border-border"><p className="text-sm font-bold text-green-400">+{Math.round(activity.total_elevation_gain)}m</p><p className="text-xs text-muted">Dénivelé</p></div>}
        {activity.tss && <div className="text-center p-3 rounded-lg bg-background border border-border"><p className="text-sm font-bold text-blue-400">{Math.round(activity.tss)}</p><p className="text-xs text-muted">TSS</p></div>}
        {activity.calories && <div className="text-center p-3 rounded-lg bg-background border border-border"><p className="text-sm font-bold text-yellow-400">{Math.round(activity.calories)}</p><p className="text-xs text-muted">kcal</p></div>}
        {activity.average_cadence && <div className="text-center p-3 rounded-lg bg-background border border-border"><p className="text-sm font-bold text-foreground">{Math.round(activity.average_cadence)}</p><p className="text-xs text-muted">Cadence</p></div>}
      </div>

      {/* HR Chart */}
      {hrData && Array.isArray(hrData) && hrData.length > 10 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Heart className="w-4 h-4 text-red-400" />Fréquence Cardiaque</CardTitle></CardHeader>
          <CardContent>
            <StreamChart data={hrData} color="#EF4444" fillColor="rgba(239,68,68,0.1)" unit="bpm" min={fcm ? fcm * 0.5 : undefined} max={fcm || undefined} formatValue={v => `${Math.round(v)}`} />
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div className="p-2 rounded-lg bg-red-500/10"><p className="text-sm font-bold text-red-400">{Math.round(avgHR || 0)}</p><p className="text-xs text-muted">Moyenne</p></div>
              <div className="p-2 rounded-lg bg-red-500/10"><p className="text-sm font-bold text-red-400">{Math.round(maxHR || 0)}</p><p className="text-xs text-muted">Max</p></div>
              <div className="p-2 rounded-lg bg-red-500/10"><p className="text-sm font-bold text-red-400">{Math.min(...hrData)}</p><p className="text-xs text-muted">Min</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Speed Chart */}
      {spdData && Array.isArray(spdData) && spdData.length > 10 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="w-4 h-4 text-blue-400" />Vitesse</CardTitle></CardHeader>
          <CardContent>
            <StreamChart
              data={spdData.map((v: number) => paceFromMs(v) || 0).filter((v: number) => v > 0)}
              color="#3B82F6"
              fillColor="rgba(59,130,246,0.1)"
              unit="min/km"
              formatValue={v => `${Math.floor(v)}'${String(Math.round((v % 1) * 60)).padStart(2, '0')}`}
            />
          </CardContent>
        </Card>
      )}

      {/* Elevation Chart */}
      {altData && Array.isArray(altData) && altData.length > 10 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Mountain className="w-4 h-4 text-green-400" />Altitude</CardTitle></CardHeader>
          <CardContent>
            <StreamChart data={altData} color="#22C55E" fillColor="rgba(34,197,94,0.1)" unit="m" formatValue={v => `${Math.round(v)}m`} />
          </CardContent>
        </Card>
      )}

      {/* Cadence Chart */}
      {cadData && Array.isArray(cadData) && cadData.length > 10 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Wind className="w-4 h-4 text-purple-400" />Cadence</CardTitle></CardHeader>
          <CardContent>
            <StreamChart data={cadData} color="#A855F7" fillColor="rgba(168,85,247,0.1)" unit="spm" formatValue={v => `${Math.round(v)}`} />
          </CardContent>
        </Card>
      )}

      {/* Power Chart */}
      {wattsData && Array.isArray(wattsData) && wattsData.length > 10 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="w-4 h-4 text-orange-400" />Puissance</CardTitle></CardHeader>
          <CardContent>
            <StreamChart
              data={wattsData}
              color="#F97316"
              fillColor="rgba(249,115,22,0.1)"
              unit="W"
              min={Math.max(0, Math.min(...wattsData) - 20)}
              max={Math.max(...wattsData) + 20}
              formatValue={v => `${Math.round(v)}W`}
            />
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              {(activity.average_watts || activity.average_power) && (
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <p className="text-sm font-bold text-orange-400">{Math.round(activity.average_watts || activity.average_power || 0)}W</p>
                  <p className="text-xs text-muted">Moyenne</p>
                </div>
              )}
              {(activity.normalized_power || activity.np) && (
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <p className="text-sm font-bold text-orange-400">{Math.round(activity.normalized_power || activity.np || 0)}W</p>
                  <p className="text-xs text-muted">NP</p>
                </div>
              )}
              {activity.variability_index && (
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <p className="text-sm font-bold text-orange-400">{toNum(activity.variability_index).toFixed(2)}</p>
                  <p className="text-xs text-muted">VI</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Analysis from API */}
      {analysis && (
        <>
          {/* HR Analysis */}
          {(analysis.avgHrPercent || analysis.hrReserve) && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Heart className="w-4 h-4 text-red-400" />Analyse FC</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {analysis.avgHrPercent && <div className="text-center p-3 rounded-lg bg-background border border-border"><p className="text-lg font-bold text-foreground">{String(Number(analysis.avgHrPercent))}%</p><p className="text-xs text-muted">FC moy. %FCM</p></div>}
                  {analysis.maxHrPercent && <div className="text-center p-3 rounded-lg bg-background border border-border"><p className="text-lg font-bold text-foreground">{String(Number(analysis.maxHrPercent))}%</p><p className="text-xs text-muted">FC max %FCM</p></div>}
                  {analysis.hrReserve && <div className="text-center p-3 rounded-lg bg-background border border-border"><p className="text-lg font-bold text-foreground">{String(Number(analysis.hrReserve))}%</p><p className="text-xs text-muted">HR Reserve</p></div>}
                  {analysis.trimp && <div className="text-center p-3 rounded-lg bg-background border border-border"><p className="text-lg font-bold text-orange-400">{Math.round(Number(analysis.trimp))}</p><p className="text-xs text-muted">TRIMP</p></div>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Training Zones Distribution */}
          {(analysis.zone1Percent || analysis.zone2Percent) && (
            <Card>
              <CardHeader><CardTitle className="text-base">Distribution des zones d&apos;entraînement</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  <div className="text-center p-2 rounded-lg bg-gray-500/10"><p className="text-sm font-bold text-gray-400">{String(Number(analysis.zone1Percent) || 0)}%</p><p className="text-xs text-muted">Z1</p></div>
                  <div className="text-center p-2 rounded-lg bg-green-500/10"><p className="text-sm font-bold text-green-400">{String(Number(analysis.zone2Percent) || 0)}%</p><p className="text-xs text-muted">Z2</p></div>
                  <div className="text-center p-2 rounded-lg bg-blue-500/10"><p className="text-sm font-bold text-blue-400">{String(Number(analysis.zone3Percent) || 0)}%</p><p className="text-xs text-muted">Z3</p></div>
                  <div className="text-center p-2 rounded-lg bg-orange-500/10"><p className="text-sm font-bold text-orange-400">{String(Number(analysis.zone4Percent) || 0)}%</p><p className="text-xs text-muted">Z4</p></div>
                  <div className="text-center p-2 rounded-lg bg-red-500/10"><p className="text-sm font-bold text-red-400">{String(Number(analysis.zone5Percent) || 0)}%</p><p className="text-xs text-muted">Z5</p></div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Elevation Analysis */}
          {(analysis.elevMin || analysis.elevMax) && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Mountain className="w-4 h-4 text-green-400" />Analyse dénivelé</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {analysis.elevMin && <div className="text-center p-3 rounded-lg bg-background border border-border"><p className="text-lg font-bold text-foreground">{Math.round(Number(analysis.elevMin))}m</p><p className="text-xs text-muted">Altitude min</p></div>}
                  {analysis.elevMax && <div className="text-center p-3 rounded-lg bg-background border border-border"><p className="text-lg font-bold text-foreground">{Math.round(Number(analysis.elevMax))}m</p><p className="text-xs text-muted">Altitude max</p></div>}
                  {analysis.estimatedGrade && <div className="text-center p-3 rounded-lg bg-background border border-border"><p className="text-lg font-bold text-foreground">{Number(analysis.estimatedGrade).toFixed(1)}%</p><p className="text-xs text-muted">Pente moy.</p></div>}
                  {analysis.gradeAdjustedPaceFormatted && <div className="text-center p-3 rounded-lg bg-background border border-border"><p className="text-lg font-bold text-green-400">{String(analysis.gradeAdjustedPaceFormatted)}</p><p className="text-xs text-muted">Allure ajustée</p></div>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* VDOT & Predictions */}
          {(analysis.estimatedVdot || analysis.paceFormatted) && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Gauge className="w-4 h-4 text-primary" />Performances</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {analysis.estimatedVdot && <div className="text-center p-3 rounded-lg bg-background border border-border"><p className="text-lg font-bold text-green-400">{toNum(analysis.estimatedVdot).toFixed(1)}</p><p className="text-xs text-muted">VDOT estimé</p></div>}
                  {analysis.paceFormatted && <div className="text-center p-3 rounded-lg bg-background border border-border"><p className="text-lg font-bold text-foreground">{toStr(analysis.paceFormatted)}</p><p className="text-xs text-muted">Allure</p></div>}
                  {analysis.intensity_factor && <div className="text-center p-3 rounded-lg bg-background border border-border"><p className="text-lg font-bold text-blue-400">{toNum(analysis.intensity_factor).toFixed(2)}</p><p className="text-xs text-muted">IF</p></div>}
                  {(analysis.efficiency_factor || activity.efficiency_factor) && (
                     <div className="text-center p-3 rounded-lg bg-background border border-border">
                       <p className="text-lg font-bold text-amber-500">{toNum(analysis.efficiency_factor || activity.efficiency_factor).toFixed(2)}</p>
                       <p className="text-xs text-muted">EF (Aérobie)</p>
                     </div>
                   )}
                  {analysis.tss && <div className="text-center p-3 rounded-lg bg-background border border-border"><p className="text-lg font-bold text-purple-400">{Math.round(toNum(analysis.tss))}</p><p className="text-xs text-muted">TSS</p></div>}
                </div>
                
                {/* Race Predictions */}
                {(analysis.predicted5k || analysis.predicted10k || analysis.predictedMarathon) && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm font-medium text-foreground mb-2">Prédictions de course</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {analysis.predicted5k && <div className="text-center p-2 rounded-lg bg-background"><p className="text-sm font-bold text-foreground">{Math.floor(toNum(analysis.predicted5k) / 60)}:{String(Math.round(toNum(analysis.predicted5k) % 60)).padStart(2, '0')}</p><p className="text-xs text-muted">5km</p></div>}
                      {analysis.predicted10k && <div className="text-center p-2 rounded-lg bg-background"><p className="text-sm font-bold text-foreground">{Math.floor(toNum(analysis.predicted10k) / 60)}:{String(Math.round(toNum(analysis.predicted10k) % 60)).padStart(2, '0')}</p><p className="text-xs text-muted">10km</p></div>}
                      {analysis.predictedHalfMarathon && typeof analysis.predictedHalfMarathon === 'object' && <div className="text-center p-2 rounded-lg bg-background"><p className="text-sm font-bold text-foreground">{(analysis.predictedHalfMarathon as {time: string}).time}</p><p className="text-xs text-muted">Semi</p></div>}
                      {analysis.predictedMarathon && typeof analysis.predictedMarathon === 'object' && <div className="text-center p-2 rounded-lg bg-background"><p className="text-sm font-bold text-foreground">{(analysis.predictedMarathon as {time: string}).time}</p><p className="text-xs text-muted">Marathon</p></div>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Biomechanics Analysis */}
          {analysis.biomechanics && (
            <BiomechanicsCard metrics={analysis.biomechanics as any} />
          )}

          {/* Nutrition Strategy */}
          {analysis.nutrition && (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-amber-600">
                  <Wind className="w-4 h-4" />
                  Stratégie de Ravitaillement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-xs text-muted uppercase font-semibold">Hydratation</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-bold text-foreground">{(analysis.nutrition as any).hydration.totalMl}</p>
                      <p className="text-sm text-muted">ml total</p>
                    </div>
                    <p className="text-xs text-muted">Cible: {(analysis.nutrition as any).hydration.perHourMl} ml/h</p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-muted uppercase font-semibold">Glucides (CHO)</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-bold text-foreground">{(analysis.nutrition as any).carbs.totalG}</p>
                      <p className="text-sm text-muted">g total</p>
                    </div>
                    <p className="text-xs text-muted">Cible: {(analysis.nutrition as any).carbs.perHourG} g/h</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted uppercase font-semibold">Sodium</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-bold text-foreground">{(analysis.nutrition as any).sodium.totalMg}</p>
                      <p className="text-sm text-muted">mg</p>
                    </div>
                  </div>
                </div>

                {Array.isArray((analysis.nutrition as any).recommendations) && (
                  <div className="mt-4 space-y-1">
                    {(analysis.nutrition as any).recommendations.map((rec: string, i: number) => (
                      <div key={i} className="flex gap-2 text-xs text-amber-700/80">
                        <span className="shrink-0">•</span>
                        <p>{rec}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Advanced Metrics (elev_high/low, running_index, HRV, flags) */}
      {(activity.elev_high != null || activity.elev_low != null || activity.running_index != null || activity.hrv_rmssd != null || activity.is_race || activity.is_commute || activity.device_name) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              Métriques avancées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {activity.elev_low != null && activity.elev_high != null && (
                <div className="text-center p-3 rounded-lg bg-background border border-border">
                  <p className="text-lg font-bold text-foreground">{Math.round(toNum(activity.elev_low))}m – {Math.round(toNum(activity.elev_high))}m</p>
                  <p className="text-xs text-muted">Altitude min – max</p>
                </div>
              )}
              {activity.running_index != null && (
                <div className="text-center p-3 rounded-lg bg-background border border-border">
                  <p className="text-lg font-bold text-cyan-400">{toNum(activity.running_index).toFixed(1)}</p>
                  <p className="text-xs text-muted">Running Index</p>
                </div>
              )}
              {activity.hrv_rmssd != null && (
                <div className="text-center p-3 rounded-lg bg-background border border-border">
                  <p className="text-lg font-bold text-teal-400">{toNum(activity.hrv_rmssd).toFixed(1)} ms</p>
                  <p className="text-xs text-muted">HRV (RMSSD)</p>
                </div>
              )}
              {activity.device_name && (
                <div className="text-center p-3 rounded-lg bg-background border border-border">
                  <p className="text-sm font-bold text-foreground truncate">{toStr(activity.device_name)}</p>
                  <p className="text-xs text-muted">Appareil</p>
                </div>
              )}
            </div>
            {(activity.is_race || activity.is_commute) && (
              <div className="flex gap-2 mt-3">
                {!!activity.is_race && <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-600">🏆 Course</span>}
                {!!activity.is_commute && <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-600">🚴 Trajet</span>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Pencil className="w-4 h-4 text-muted" />
              Notes
            </CardTitle>
            {!editingNotes && (
              <Button variant="ghost" size="sm" onClick={() => { setNotesValue(activity.notes || activity.description || ''); setEditingNotes(true); }}>
                <Pencil className="w-3.5 h-3.5 mr-1" />
                Modifier
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingNotes ? (
            <div className="space-y-3">
              <textarea
                value={notesValue}
                onChange={e => setNotesValue(e.target.value)}
                className="w-full p-3 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                rows={4}
                placeholder="Ajouter des notes sur cette activité…"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setEditingNotes(false)} disabled={savingNotes}>
                  <X className="w-3.5 h-3.5 mr-1" />
                  Annuler
                </Button>
                <Button size="sm" onClick={saveNotes} isLoading={savingNotes}>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Sauvegarder
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted whitespace-pre-wrap">
              {activity.notes || activity.description
                ? (activity.notes || activity.description)
                : <span className="italic opacity-50">Aucune note — cliquez sur Modifier pour en ajouter.</span>
              }
            </p>
          )}
        </CardContent>
      </Card>

      {/* Splits / Kilometers Table */}
      {splits && splits.splits && splits.splits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Splits ({splits.summary.unit === 'mi' ? 'miles' : 'kilomètres'})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Summary row */}
            <div className="flex flex-wrap gap-4 mb-4 p-3 bg-muted/30 rounded-lg text-sm">
              <div><span className="text-muted">Dénivelé:</span> <span className="font-medium">{splits.summary.elevationGain || 0}m</span></div>
              <div><span className="text-muted">FC moy:</span> <span className="font-medium">{splits.summary.averageHR || '-'}</span></div>
              {splits.summary.maxHR && <div><span className="text-muted">FC max:</span> <span className="font-medium">{splits.summary.maxHR}</span></div>}
              {splits.summary.averageCadence && <div><span className="text-muted">Cadence:</span> <span className="font-medium">{splits.summary.averageCadence}</span></div>}
              {splits.summary.averageWatts && <div><span className="text-muted">Watts:</span> <span className="font-medium">{splits.summary.averageWatts}</span></div>}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="py-2 text-left">Km</th>
                    <th className="py-2 text-right">Temps</th>
                    <th className="py-2 text-right">Allure</th>
                    <th className="py-2 text-right text-primary">GAP</th>
                    <th className="py-2 text-right">Vitesse</th>
                    <th className="py-2 text-right">FC moy</th>
                    <th className="py-2 text-right">Dénivelé</th>
                    <th className="py-2 text-right">Pente %</th>
                    <th className="py-2 text-right">Cad</th>
                    {splits.splits[0]?.avgWatts !== null && <th className="py-2 text-right">Watts</th>}
                  </tr>
                </thead>
                <tbody>
                  {splits.splits.map((split) => {
                    const paceColor = split.pace && split.pace < 300 ? 'text-green-400' : split.pace && split.pace > 360 ? 'text-red-400' : 'text-foreground';
                    const gradientColor = split.gradient > 2 ? 'text-orange-400' : split.gradient < -2 ? 'text-blue-400' : 'text-muted';
                    return (
                      <tr key={split.split} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 font-medium">
                          {split.split}
                          {split.isPartial && <span className="text-xs text-muted ml-1">(partiel)</span>}
                        </td>
                        <td className="py-2 text-right font-mono">{fmt(split.duration)}</td>
                        <td className={`py-2 text-right font-mono ${paceColor}`}>
                          {split.pace ? `${Math.floor(split.pace / 60)}'${String(Math.round(split.pace % 60)).padStart(2, '0')}` : '-'}
                        </td>
                        <td className="py-2 text-right font-mono font-bold text-primary">
                          {split.gap ? `${Math.floor(split.gap / 60)}'${String(Math.round(split.gap % 60)).padStart(2, '0')}` : '-'}
                        </td>
                        <td className="py-2 text-right font-mono">{split.speed.toFixed(1)} km/h</td>
                        <td className="py-2 text-right">{split.avgHR || '-'}</td>
                        <td className={`py-2 text-right ${split.elevationChange > 0 ? 'text-green-400' : split.elevationChange < 0 ? 'text-red-400' : 'text-muted'}`}>
                          {split.elevationChange > 0 ? '+' : ''}{split.elevationChange || '-'}m
                        </td>
                        <td className={`py-2 text-right ${gradientColor}`}>
                          {split.gradient > 0 ? '+' : ''}{split.gradient || 0}%
                        </td>
                        <td className="py-2 text-right">{split.avgCadence || '-'}</td>
                        {split.avgWatts !== null && <td className="py-2 text-right">{split.avgWatts || '-'}</td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No streams message */}
      {(!streams || (!hrData && !spdData && !altData)) && (
        <Card>
          <CardContent className="p-6 text-center text-muted">
            <p>Aucune donnée de stream disponible pour cette activité</p>
            <p className="text-xs mt-1">Les graphiques apparaissent après synchronisation avec Strava ou Garmin</p>
          </CardContent>
        </Card>
      )}

      {/* Share Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            Partage social
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ShareSettingsPanel activityId={Number(id)} onSave={() => toast.success('Paramètres de partage mis à jour')} />
        </CardContent>
      </Card>
    </div>
  );
}
