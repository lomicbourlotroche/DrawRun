'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Skeleton, GlassCard, GlassCardContent } from '@/components/ui';
import { api } from '@/lib/api';
import { Trophy, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  getModeInfo, getTypeInfo, getMilestones, getProgressColor, formatDaysLeft,
} from './challenge-constants';
import ChallengeWizard from '../modals/ChallengeWizard';

export default function ChallengesTab() {
  const [publicChallenges, setPublicChallenges] = useState<Array<{
    id: number; title: string; description?: string; type: string;
    target_value: number; target_unit?: string; duration_days: number;
    participant_count: number; created_at: string; challenge_mode?: string;
    badge_icon?: string; sport_type?: string; milestones?: string;
    weekly_target?: number; weekly_increase_pct?: number;
    streak_days?: number; frequency_per_week?: number; creator_name?: string;
  }>>([]);
  const [myChallenges, setMyChallenges] = useState<Array<{
    id: number; title: string; description?: string; type: string;
    target_value: number; target_unit?: string; progress: number;
    user_status: string; start_date: string; end_date: string;
    challenge_mode?: string; badge_icon?: string; milestones?: string;
    streak_current?: number; streak_best?: number;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pub, mine] = await Promise.all([
        api.getPublicChallenges().catch(() => []),
        api.getUserChallenges().catch(() => []),
      ]);
      setPublicChallenges((pub as typeof publicChallenges) || []);
      setMyChallenges((mine as typeof myChallenges) || []);
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (form: { title: string; description: string; type: string; target_value: string; end_date: string; challenge_mode: string; weekly_target: string; weekly_increase_pct: string; streak_days: string; frequency_per_week: string; sport_type: string; badge_icon: string; is_public: boolean }) => {
    const durationDays = form.end_date
      ? Math.max(1, Math.ceil((new Date(form.end_date).getTime() - Date.now()) / 86400000))
      : 30;
    await api.createChallenge({
      title: form.title,
      description: form.description,
      type: form.type,
      target_value: parseFloat(form.target_value) || 0,
      duration_days: durationDays,
      is_public: form.is_public,
      challenge_mode: form.challenge_mode,
      badge_icon: form.badge_icon,
      sport_type: form.sport_type,
      weekly_target: form.weekly_target ? parseFloat(form.weekly_target) : undefined,
      weekly_increase_pct: form.weekly_increase_pct ? parseFloat(form.weekly_increase_pct) : undefined,
      streak_days: form.streak_days ? parseInt(form.streak_days) : undefined,
      frequency_per_week: form.frequency_per_week ? parseInt(form.frequency_per_week) : undefined,
    });
    toast.success('Défi créé ! 🏆');
    setShowCreate(false);
    load();
  };

  const handleJoin = async (id: number) => {
    try {
      const res = await api.joinChallenge(id);
      if (res.success) { toast.success('Défi rejoint ! 🎯'); load(); }
      else toast.error(res.error || 'Erreur');
    } catch { toast.error('Erreur'); }
  };

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Trophy className="w-5 h-5 text-warning" />
          Défis
        </h3>
        <Button size="sm" onClick={() => setShowCreate(true)} className="rounded-xl gap-1">
          <Sparkles className="w-4 h-4" /> Créer un défi
        </Button>
      </div>

      {myChallenges.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted uppercase tracking-wide">Mes défis</p>
          {myChallenges.map(c => {
            const pct = Math.min(100, c.progress || 0);
            const milestones = getMilestones(c);
            const nextMilestone = milestones.find((m: {pct: number}) => m.pct > pct);
            const mode = getModeInfo(c.challenge_mode || 'quota');
            return (
              <GlassCard key={c.id} padding="sm">
                <GlassCardContent>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-2xl">{c.badge_icon || '🏆'}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{c.title}</p>
                          <p className="text-xs text-muted">{mode.icon} {mode.label} · {getTypeInfo(c.type).icon} {c.target_value} {c.target_unit}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${c.user_status === 'completed' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                        {c.user_status === 'completed' ? '✓ Terminé' : formatDaysLeft(c.end_date)}
                      </span>
                    </div>
                    {c.challenge_mode === 'streak' && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1"><span className="text-orange-400">🔥</span><span className="font-bold">{c.streak_current || 0}</span><span className="text-muted text-xs">actuel</span></div>
                        <div className="flex items-center gap-1"><span className="text-yellow-400">⭐</span><span className="font-bold">{c.streak_best || 0}</span><span className="text-muted text-xs">record</span></div>
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="relative w-full bg-border rounded-full h-3">
                        <div className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(pct)}`} style={{ width: `${pct}%` }} />
                        {milestones.map((m: {pct: number}) => (
                          <div key={m.pct} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2" style={{ left: `${m.pct}%` }}>
                            <div className={`w-0.5 h-4 rounded-full ${pct >= m.pct ? 'bg-white/80' : 'bg-muted/40'}`} />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-muted">
                        <span className="font-medium text-foreground">{pct.toFixed(0)}%</span>
                        {nextMilestone && <span>{(nextMilestone as {icon: string}).icon} {(nextMilestone as {label: string}).label} à {(nextMilestone as {pct: number}).pct}%</span>}
                        <span>{c.target_value} {c.target_unit}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {milestones.map((m: {pct: number; label: string; icon: string}) => (
                        <div key={m.pct} className={`flex-1 text-center py-1 rounded-lg text-xs transition-all ${pct >= m.pct ? 'bg-warning/20 text-yellow-600 font-medium' : 'bg-border/50 text-muted'}`}>
                          {m.icon} {m.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCardContent>
              </GlassCard>
            );
          })}
        </div>
      )}

      <div className="space-y-3">
        <p className="text-sm font-medium text-muted uppercase tracking-wide">Défis publics</p>
        {publicChallenges.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-muted opacity-30" />
            <p className="text-muted text-sm">Aucun défi public pour l&apos;instant</p>
            <p className="text-xs text-muted mt-1">Soyez le premier à en créer un !</p>
          </div>
        ) : publicChallenges.map(c => {
          const alreadyJoined = myChallenges.some(m => m.id === c.id);
          const mode = getModeInfo(c.challenge_mode || 'quota');
          return (
            <GlassCard key={c.id} padding="sm">
              <GlassCardContent>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="text-2xl shrink-0">{c.badge_icon || '🏆'}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{c.title}</p>
                      {c.description && <p className="text-xs text-muted mb-1 line-clamp-1">{c.description}</p>}
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">{mode.icon} {mode.label}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-border text-muted">{getTypeInfo(c.type).icon} {c.target_value} {c.target_unit}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-border text-muted">⏳ {c.duration_days}j</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-border text-muted">👥 {c.participant_count || 0}</span>
                      </div>
                      {c.creator_name && <p className="text-xs text-muted mt-1">par {c.creator_name}</p>}
                    </div>
                  </div>
                  {!alreadyJoined ? (
                    <Button size="sm" variant="secondary" onClick={() => handleJoin(c.id)} className="rounded-xl shrink-0">Rejoindre</Button>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success font-medium shrink-0">✓ Rejoint</span>
                  )}
                </div>
              </GlassCardContent>
            </GlassCard>
          );
        })}
      </div>

      {showCreate && (
        <ChallengeWizard
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
