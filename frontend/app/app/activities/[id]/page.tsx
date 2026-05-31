'use client'

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Skeleton } from '@/components/ui';
import { StreamChart } from '@/components/ui/Charts';
import ActivityMap from '@/components/ui/ActivityMap';
import { api } from '@/lib/api';
import type { ActivityDetail as ActivityDetailType, ActivityStreams, ActivityAnalysisResponse } from '@/types';
import { isRunAnalysis, isRideAnalysis, isSwimAnalysis, isTrailRunAnalysis } from '@/types';
import type { SplitData, SplitSummary } from '@/types';
import { ArrowLeft, Heart, Timer, Gauge, Mountain, Activity as ActivityIcon, Zap, Wind, MapPin, Clock, Pencil, Check, X, Cpu, Flag } from '@/components/ui/icons';
import { toast } from 'sonner';
import { ShareSettingsPanel } from '@/components/features/activities';
import { RunAnalysisCards, RideAnalysisCards, SwimAnalysisCards, SimpleAnalysisCards, TrailRunAnalysisCards } from '@/components/features/activities/analysis';

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
  const [analysis, setAnalysis] = useState<ActivityAnalysisResponse | null>(null);
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
      toast.success('Notes sauvegard\u00e9es');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSavingNotes(false);
    }
  };

  if (isLoading) return <div className="space-y-6 max-w-4xl mx-auto"><Skeleton className="h-10 w-48" /><Skeleton className="h-32 w-full" /><Skeleton className="h-40 w-full" /></div>;
  if (!activity) return <div className="text-center py-12"><ActivityIcon className="w-12 h-12 mx-auto mb-4 text-muted opacity-50" /><p className="text-muted">Activit\u00e9 non trouv\u00e9e</p><Button variant="secondary" onClick={() => router.push('/app/activities')} className="mt-4">Retour</Button></div>;

  const src = activity.source || 'manual';
  const srcLabel = src === 'garmin' ? 'Garmin' : src === 'strava' ? 'Strava' : 'Manuel';
  const srcColor: 'primary' | 'warning' | 'default' = src === 'garmin' ? 'primary' : src === 'strava' ? 'warning' : 'default';

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

  const latlngData = streams?.latlng && Array.isArray(streams.latlng)
    ? streams.latlng as [number, number][]
    : null;

  const avgHR = activity.average_heartrate;
  const maxHR = activity.max_heartrate;
  const fcm = (analysis?.profileFcm as number) || (avgHR ? Math.round(avgHR / 0.85) : null);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/app/activities')} className="mt-1"><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={srcColor}>{srcLabel}</Badge>
            <Badge variant="default">{activity.type}</Badge>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{activity.name}</h1>
          <p className="text-muted">{activity.start_date_local?.split('T')[0]} {'\u2022'} {activity.start_date_local?.split(' ')[1] || ''}</p>
        </div>
      </div>

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
              <p className="text-xs mt-1">L&apos;activit\u00e9 ne contient pas de donn\u00e9es de parcours</p>
              <p className="text-xs text-muted mt-1">Cette activit\u00e9 n&apos;a pas \u00e9t\u00e9 synchronis\u00e9e avec GPS ou le service ne fournit pas de trace</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-border">
          <div className="flex items-center gap-2 mb-1"><Gauge className="w-4 h-4 text-primary" /><span className="text-xs text-muted uppercase">Distance</span></div>
          <p className="text-xl font-bold text-foreground">{activity.distance > 1000 ? `${(activity.distance / 1000).toFixed(2)} km` : `${Math.round(activity.distance)} m`}</p>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-border">
          <div className="flex items-center gap-2 mb-1"><Timer className="w-4 h-4 text-primary" /><span className="text-xs text-muted uppercase">Dur\u00e9e</span></div>
          <p className="text-xl font-bold text-foreground">{fmt(activity.moving_time)}</p>
          {activity.elapsed_time && activity.elapsed_time > activity.moving_time && <p className="text-xs text-muted">Temps: {fmt(activity.elapsed_time)}</p>}
        </div>
        <div className="p-4 rounded-xl bg-surface border border-border">
          <div className="flex items-center gap-2 mb-1"><Zap className="w-4 h-4 text-primary" /><span className="text-xs text-muted uppercase">Allure moy.</span></div>
          <p className="text-xl font-bold text-foreground">{pace(activity.average_speed)}</p>
          <p className="text-xs text-muted">/km</p>
        </div>
        {avgHR && <div className="p-4 rounded-xl bg-surface border border-border">
          <div className="flex items-center gap-2 mb-1"><Heart className="w-4 h-4 text-danger" /><span className="text-xs text-muted uppercase">FC moy.</span></div>
          <p className="text-xl font-bold text-foreground">{Math.round(avgHR)}</p>
          <p className="text-xs text-muted">{maxHR ? `Max: ${Math.round(maxHR)} bpm` : 'bpm'}</p>
        </div>}
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {activity.max_speed && <div className="text-center p-3 rounded-lg bg-surface border border-border"><p className="text-sm font-bold text-foreground">{pace(activity.max_speed)}</p><p className="text-xs text-muted">Allure max</p></div>}
        {activity.max_heartrate && <div className="text-center p-3 rounded-lg bg-surface border border-border"><p className="text-sm font-bold text-danger">{Math.round(activity.max_heartrate)}</p><p className="text-xs text-muted">FC max</p></div>}
        {activity.total_elevation_gain && <div className="text-center p-3 rounded-lg bg-surface border border-border"><p className="text-sm font-bold text-success">+{Math.round(activity.total_elevation_gain)}m</p><p className="text-xs text-muted">D\u00e9nivel\u00e9</p></div>}
        {activity.tss && <div className="text-center p-3 rounded-lg bg-surface border border-border"><p className="text-sm font-bold text-primary">{Math.round(activity.tss)}</p><p className="text-xs text-muted">TSS</p></div>}
        {activity.calories && <div className="text-center p-3 rounded-lg bg-surface border border-border"><p className="text-sm font-bold text-warning">{Math.round(activity.calories)}</p><p className="text-xs text-muted">kcal</p></div>}
        {activity.average_cadence && <div className="text-center p-3 rounded-lg bg-surface border border-border"><p className="text-sm font-bold text-foreground">{Math.round(activity.average_cadence)}</p><p className="text-xs text-muted">Cadence</p></div>}
      </div>

      {hrData && Array.isArray(hrData) && hrData.length > 10 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Heart className="w-4 h-4 text-danger" />Fr\u00e9quence Cardiaque</CardTitle></CardHeader>
          <CardContent>
            <StreamChart data={hrData} color="#EF4444" fillColor="rgba(239,68,68,0.1)" unit="bpm" min={fcm ? fcm * 0.5 : undefined} max={fcm || undefined} formatValue={v => `${Math.round(v)}`} />
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div className="p-2 rounded-lg bg-danger/10"><p className="text-sm font-bold text-danger">{Math.round(avgHR || 0)}</p><p className="text-xs text-muted">Moyenne</p></div>
              <div className="p-2 rounded-lg bg-danger/10"><p className="text-sm font-bold text-danger">{Math.round(maxHR || 0)}</p><p className="text-xs text-muted">Max</p></div>
              <div className="p-2 rounded-lg bg-danger/10"><p className="text-sm font-bold text-danger">{Math.min(...hrData)}</p><p className="text-xs text-muted">Min</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {spdData && Array.isArray(spdData) && spdData.length > 10 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="w-4 h-4 text-primary" />Vitesse</CardTitle></CardHeader>
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

      {altData && Array.isArray(altData) && altData.length > 10 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Mountain className="w-4 h-4 text-success" />Altitude</CardTitle></CardHeader>
          <CardContent>
            <StreamChart data={altData} color="#22C55E" fillColor="rgba(34,197,94,0.1)" unit="m" formatValue={v => `${Math.round(v)}m`} />
          </CardContent>
        </Card>
      )}

      {cadData && Array.isArray(cadData) && cadData.length > 10 && (
        <Card>
          <CardHeader>            <CardTitle className="text-base flex items-center gap-2"><Wind className="w-4 h-4 text-muted" />Cadence</CardTitle></CardHeader>
          <CardContent>
            <StreamChart data={cadData} color="#A855F7" fillColor="rgba(168,85,247,0.1)" unit="spm" formatValue={v => `${Math.round(v)}`} />
          </CardContent>
        </Card>
      )}

      {wattsData && Array.isArray(wattsData) && wattsData.length > 10 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="w-4 h-4 text-peak" />Puissance</CardTitle></CardHeader>
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
                <div className="p-2 rounded-lg bg-peak/10">
                  <p className="text-sm font-bold text-peak">{Math.round(activity.average_watts || activity.average_power || 0)}W</p>
                  <p className="text-xs text-muted">Moyenne</p>
                </div>
              )}
              {(activity.normalized_power || activity.np) && (
                <div className="p-2 rounded-lg bg-peak/10">
                  <p className="text-sm font-bold text-peak">{Math.round(activity.normalized_power || activity.np || 0)}W</p>
                  <p className="text-xs text-muted">NP</p>
                </div>
              )}
              {activity.variability_index && (
                <div className="p-2 rounded-lg bg-peak/10">
                  <p className="text-sm font-bold text-peak">{toNum(activity.variability_index).toFixed(2)}</p>
                  <p className="text-xs text-muted">VI</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {analysis && (
        isRunAnalysis(analysis) ? (
          <RunAnalysisCards analysis={analysis} />
        ) : isRideAnalysis(analysis) ? (
          <RideAnalysisCards analysis={analysis} />
        ) : isSwimAnalysis(analysis) ? (
          <SwimAnalysisCards analysis={analysis} />
        ) : isTrailRunAnalysis(analysis) ? (
          <TrailRunAnalysisCards analysis={analysis} />
        ) : (
          <SimpleAnalysisCards analysis={analysis} />
        )
      )}

      {(activity.elev_high !== null || activity.elev_low !== null || activity.running_index !== null || activity.hrv_rmssd !== null || activity.is_race || activity.is_commute || activity.device_name) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              M\u00e9triques avanc\u00e9es
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {activity.elev_low !== null && activity.elev_high !== null && (
                <div className="text-center p-3 rounded-lg bg-surface border border-border">
                  <p className="text-lg font-bold text-foreground">{Math.round(toNum(activity.elev_low))}m {'\u2013'} {Math.round(toNum(activity.elev_high))}m</p>
                  <p className="text-xs text-muted">Altitude min {'\u2013'} max</p>
                </div>
              )}
              {activity.running_index !== null && (
                <div className="text-center p-3 rounded-lg bg-surface border border-border">
                  <p className="text-lg font-bold text-foreground">{toNum(activity.running_index).toFixed(1)}</p>
                  <p className="text-xs text-muted">Running Index</p>
                </div>
              )}
              {activity.hrv_rmssd !== null && (
                <div className="text-center p-3 rounded-lg bg-surface border border-border">
                  <p className="text-lg font-bold text-foreground">{toNum(activity.hrv_rmssd).toFixed(1)} ms</p>
                  <p className="text-xs text-muted">HRV (RMSSD)</p>
                </div>
              )}
              {activity.device_name && (
                <div className="text-center p-3 rounded-lg bg-surface border border-border">
                  <p className="text-sm font-bold text-foreground truncate">{toStr(activity.device_name)}</p>
                  <p className="text-xs text-muted">Appareil</p>
                </div>
              )}
            </div>
            {(activity.is_race || activity.is_commute) && (
              <div className="flex gap-2 mt-3">
                {!!activity.is_race && <span className="px-2 py-1 rounded-full text-xs font-medium bg-warning/20 text-warning flex items-center gap-1"><Flag className="w-3 h-3" /> Course</span>}
                {!!activity.is_commute && <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary flex items-center gap-1"><ActivityIcon className="w-3 h-3" /> Trajet</span>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
                className="w-full p-3 rounded-lg border border-border bg-surface text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                rows={4}
                placeholder="Ajouter des notes sur cette activit\u00e9\u2026"
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
                : <span className="italic opacity-50">Aucune note {'\u2014'} cliquez sur Modifier pour en ajouter.</span>
              }
            </p>
          )}
        </CardContent>
      </Card>

      {splits && splits.splits && splits.splits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Splits ({splits.summary.unit === 'mi' ? 'miles' : 'kilom\u00e8tres'})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4 p-3 bg-surface rounded-lg text-sm">
              <div><span className="text-muted">D\u00e9nivel\u00e9:</span> <span className="font-medium">{splits.summary.elevationGain || 0}m</span></div>
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
                    <th className="py-2 text-right">D\u00e9nivel\u00e9</th>
                    <th className="py-2 text-right">Pente %</th>
                    <th className="py-2 text-right">Cad</th>
                    {splits.splits[0]?.avgWatts !== null && <th className="py-2 text-right">Watts</th>}
                  </tr>
                </thead>
                <tbody>
                  {splits.splits.map((split) => {
                    const paceColor = split.pace && split.pace < 300 ? 'text-success' : split.pace && split.pace > 360 ? 'text-danger' : 'text-foreground';
                    const gradientColor = split.gradient > 2 ? 'text-peak' : split.gradient < -2 ? 'text-primary' : 'text-muted';
                    return (
                      <tr key={split.split} className="border-b border-border/50 hover:bg-surface">
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
                        <td className={`py-2 text-right ${split.elevationChange > 0 ? 'text-success' : split.elevationChange < 0 ? 'text-danger' : 'text-muted'}`}>
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

      {(!streams || (!hrData && !spdData && !altData)) && (
        <Card>
          <CardContent className="p-6 text-center text-muted">
            <p>Aucune donn\u00e9e de stream disponible pour cette activit\u00e9</p>
            <p className="text-xs mt-1">Les graphiques apparaissent apr\u00e8s synchronisation avec Strava ou Garmin</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            Partage social
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ShareSettingsPanel activityId={Number(id)} onSave={() => toast.success('Param\u00e8tres de partage mis \u00e0 jour')} />
        </CardContent>
      </Card>
    </div>
  );
}
