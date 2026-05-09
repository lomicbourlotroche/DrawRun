/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge, Avatar, Skeleton } from '@/components/ui';
import type { GroupDetail, GroupMember, Activity } from '@/types';
import type { CreateChallengeParams } from '@/lib/api';
import {
  Users, Settings, Activity as ActivityIcon, Trophy,
  ChevronLeft, Copy, Trash2, Edit2, UserX, Crown, Shield,
  Plus, Flame, Save, Eye, Check, Sparkles, Loader2, X
} from 'lucide-react';
import { toast } from 'sonner';

// ── Challenge mode/type constants (same as SocialContent) ──────────────────
const CHALLENGE_MODES = [
  { id: 'quota',       label: 'Quota total',      icon: '🎯', desc: 'Atteindre un objectif cumulé' },
  { id: 'progressive', label: 'Jauge progressive', icon: '📈', desc: 'Objectif croissant chaque semaine' },
  { id: 'streak',      label: 'Streak',            icon: '🔥', desc: 'X jours consécutifs' },
  { id: 'frequency',   label: 'Fréquence',         icon: '📅', desc: 'X sorties par semaine' },
] as const;

const CHALLENGE_TYPES = [
  { id: 'distance',   label: 'Distance',    unit: 'km',      icon: '📏', modes: ['quota','progressive','streak'] },
  { id: 'elevation',  label: 'Dénivelé',    unit: 'm',       icon: '⛰️', modes: ['quota','progressive'] },
  { id: 'time',       label: 'Temps actif', unit: 'min',     icon: '⏱️', modes: ['quota','progressive','streak'] },
  { id: 'activities', label: 'Activités',   unit: 'sorties', icon: '📊', modes: ['quota','frequency','streak'] },
] as const;

const SPORT_TYPES = [
  { id: 'any',  label: 'Tous', icon: '🏅' },
  { id: 'run',  label: 'Course', icon: '🏃' },
  { id: 'bike', label: 'Vélo', icon: '🚴' },
  { id: 'swim', label: 'Natation', icon: '🏊' },
];

const BADGE_ICONS = ['🏆','🔥','⚡','🎯','💪','🌟','🚀','🏅','💎','🦁'];

type ChallengeForm = {
  title: string; description: string; type: string; target_value: string;
  end_date: string; challenge_mode: string; weekly_target: string;
  weekly_increase_pct: string; streak_days: string; frequency_per_week: string;
  sport_type: string; badge_icon: string;
};

type GroupChallenge = {
  id: number; title: string; description: string; type: string;
  target_value: number; target_unit: string; duration_days: number;
  participant_count: number; created_at: string; challenge_mode?: string;
  badge_icon?: string; sport_type?: string; milestones?: string;
  creator_name?: string;
};

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = parseInt(params.id as string);

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [challenges, setChallenges] = useState<GroupChallenge[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'activities' | 'challenges' | 'settings'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [editForm, setEditForm] = useState({ name: '', description: '', isPrivate: false });
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<ChallengeForm>({
    title: '', description: '', type: 'distance', target_value: '',
    end_date: '', challenge_mode: 'quota', weekly_target: '',
    weekly_increase_pct: '10', streak_days: '', frequency_per_week: '3',
    sport_type: 'any', badge_icon: '🏆',
  });

  const loadGroup = useCallback(async () => {
    setIsLoading(true);
    try {
      const [groupData, membersData, activitiesData, challengesData] = await Promise.all([
        api.getGroupDetail(groupId),
        api.getGroupMembers(groupId),
        api.getGroupActivities(groupId, 10),
        (api as any).getGroupChallenges(groupId).catch(() => []),
      ]);
      setGroup(groupData);
      setMembers(membersData || []);
      setActivities(activitiesData || []);
      setChallenges(challengesData || []);
      setEditForm({ name: groupData.name, description: groupData.description || '', isPrivate: groupData.isPrivate ?? true });
    } catch {
      toast.error('Groupe introuvable');
      router.push('/app/social');
    } finally {
      setIsLoading(false);
    }
  }, [groupId, router]);

  useEffect(() => { loadGroup(); }, [loadGroup]);

  const handleEdit = async () => {
    try { await api.editGroup(groupId, editForm); toast.success('Groupe modifié'); loadGroup(); }
    catch { toast.error('Erreur'); }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer ce groupe ? Action irréversible.')) return;
    try { await api.deleteGroup(groupId); toast.success('Groupe supprimé'); router.push('/app/social'); }
    catch { toast.error('Erreur'); }
  };

  const handleKick = async (userId: number) => {
    if (!confirm('Exclure ce membre ?')) return;
    try { await api.kickMember(groupId, userId); toast.success('Membre exclu'); loadGroup(); }
    catch { toast.error('Erreur'); }
  };

  const handlePromote = async (userId: number, role: string) => {
    try { await api.promoteMember(groupId, userId, role); toast.success('Rôle modifié'); loadGroup(); }
    catch { toast.error('Erreur'); }
  };

  const handleLeave = async () => {
    if (!confirm('Quitter ce groupe ?')) return;
    try { await api.leaveGroup(groupId); toast.success('Groupe quitté'); router.push('/app/social'); }
    catch { toast.error('Erreur'); }
  };

  const copyInvite = () => {
    if (group?.inviteCode) { navigator.clipboard.writeText(group.inviteCode); toast.success('Code copié'); }
  };

  const handleCreateChallenge = async () => {
    if (!form.title.trim()) return;
    setIsCreating(true);
    try {
      const durationDays = form.end_date
        ? Math.max(1, Math.ceil((new Date(form.end_date).getTime() - Date.now()) / 86400000))
        : 30;
      await (api as any).createGroupChallenge(groupId, {
        title: form.title, description: form.description, type: form.type,
        target_value: parseFloat(form.target_value) || 0, duration_days: durationDays,
        challenge_mode: form.challenge_mode, badge_icon: form.badge_icon,
        sport_type: form.sport_type,
        weekly_target: form.weekly_target ? parseFloat(form.weekly_target) : undefined,
        weekly_increase_pct: form.weekly_increase_pct ? parseFloat(form.weekly_increase_pct) : undefined,
        streak_days: form.streak_days ? parseInt(form.streak_days) : undefined,
        frequency_per_week: form.frequency_per_week ? parseInt(form.frequency_per_week) : undefined,
      } as CreateChallengeParams);
      toast.success('Défi créé ! 🏆');
      setShowWizard(false);
      setWizardStep(1);
      setForm({ title: '', description: '', type: 'distance', target_value: '', end_date: '', challenge_mode: 'quota', weekly_target: '', weekly_increase_pct: '10', streak_days: '', frequency_per_week: '3', sport_type: 'any', badge_icon: '🏆' });
      loadGroup();
    } catch { toast.error('Erreur lors de la création'); }
    finally { setIsCreating(false); }
  };

  const handleJoinChallenge = async (challengeId: number) => {
    try { await api.joinChallenge(challengeId); toast.success('Défi rejoint !'); loadGroup(); }
    catch { toast.error('Erreur'); }
  };

  const getModeInfo = (mode: string) => CHALLENGE_MODES.find(m => m.id === mode) || CHALLENGE_MODES[0];
  const getTypeInfo = (type: string) => CHALLENGE_TYPES.find(t => t.id === type) || CHALLENGE_TYPES[0];

  const isAdmin = group?.userRole === 'admin';

  const tabs = [
    { id: 'overview',    label: 'Aperçu',                          icon: Eye },
    { id: 'members',     label: `Membres (${members.length})`,     icon: Users },
    { id: 'activities',  label: 'Activités',                       icon: ActivityIcon },
    { id: 'challenges',  label: `Défis (${challenges.length})`,    icon: Trophy },
    { id: 'settings',    label: 'Paramètres',                      icon: Settings },
  ] as const;

  if (isLoading) return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Skeleton className="h-48 rounded-3xl" />
      <Skeleton className="h-12 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );

  if (!group) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-8">
      {/* ── HEADER ── */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.push('/app/social')} className="p-2 rounded-xl bg-card border border-border hover:bg-border transition-colors mt-1">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold truncate">{group.name}</h1>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${group.isPrivate ? 'bg-orange-500/10 text-orange-500' : 'bg-green-500/10 text-green-500'}`}>
              {group.isPrivate ? '🔒 Privé' : '🌍 Public'}
            </span>
            {group.userRole && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${group.userRole === 'admin' ? 'bg-primary/10 text-primary' : 'bg-border text-muted'}`}>
                {group.userRole === 'admin' ? '👑 Admin' : 'Membre'}
              </span>
            )}
          </div>
          {group.description && <p className="text-muted mt-1 text-sm">{group.description}</p>}
          <p className="text-xs text-muted mt-2">{group.memberCount} membres · {challenges.length} défis</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {group.inviteCode && (
            <Button variant="secondary" size="sm" onClick={copyInvite} leftIcon={<Copy className="w-4 h-4" />}>Code</Button>
          )}
          {!isAdmin && (
            <Button variant="ghost" size="sm" className="text-danger" onClick={handleLeave}>Quitter</Button>
          )}
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-1 overflow-x-auto pb-2 border-b border-border">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-card border border-border text-muted hover:text-foreground hover:border-primary/30'
            }`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users, color: 'text-primary', bg: 'bg-primary/10', val: group.memberCount, label: 'Membres' },
              { icon: ActivityIcon, color: 'text-orange-500', bg: 'bg-orange-500/10', val: activities.length, label: 'Activités' },
              { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/10', val: challenges.length, label: 'Défis' },
              { icon: Crown, color: 'text-yellow-500', bg: 'bg-yellow-500/10', val: group.adminCount || 1, label: 'Admins' },
            ].map(s => (
              <div key={s.label} className="p-4 rounded-xl bg-card border border-border text-center">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mx-auto mb-2`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold">{s.val}</p>
                <p className="text-xs text-muted">{s.label}</p>
              </div>
            ))}
          </div>

          {activities.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Activités récentes</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {activities.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><Flame className="w-4 h-4 text-primary" /></div>
                      <div><p className="font-medium text-sm">{a.name || a.type}</p><p className="text-xs text-muted">{new Date(a.start_date).toLocaleDateString('fr-FR')}</p></div>
                    </div>
                    <div className="text-right"><p className="text-sm font-medium">{((a.distance || 0) / 1000).toFixed(1)} km</p><p className="text-xs text-muted">{Math.floor((a.moving_time || 0) / 60)} min</p></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {challenges.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-500" />Défis actifs</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {challenges.slice(0, 3).map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{c.badge_icon || '🏆'}</span>
                      <div><p className="font-medium text-sm">{c.title}</p><p className="text-xs text-muted">{getModeInfo(c.challenge_mode || 'quota').label} · {c.target_value} {c.target_unit}</p></div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{c.participant_count || 0} participants</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── MEMBERS ── */}
      {activeTab === 'members' && (
        <div className="space-y-2">
          {members.map(member => (
            <div key={member.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl">
              <div className="flex items-center gap-3">
                <Avatar name={member.name} size="md" />
                <div>
                  <p className="font-semibold text-sm">{member.name}</p>
                  <p className="text-xs text-muted">Depuis {new Date(member.joinedAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {member.role === 'admin' ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1"><Crown className="w-3 h-3" />Admin</span>
                ) : member.role === 'moderator' ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 font-medium flex items-center gap-1"><Shield className="w-3 h-3" />Modo</span>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full bg-border text-muted font-medium">Membre</span>
                )}
                {isAdmin && member.role !== 'admin' && (
                  <div className="flex gap-1">
                    {member.role !== 'moderator' && (
                      <button onClick={() => handlePromote(member.userId, 'moderator')} className="p-1.5 rounded-lg hover:bg-border transition-colors" title="Promouvoir modérateur">
                        <Shield className="w-4 h-4 text-blue-500" />
                      </button>
                    )}
                    <button onClick={() => handleKick(member.userId)} className="p-1.5 rounded-lg hover:bg-danger/10 transition-colors" title="Exclure">
                      <UserX className="w-4 h-4 text-danger" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ACTIVITIES ── */}
      {activeTab === 'activities' && (
        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="text-center py-16">
              <ActivityIcon className="w-12 h-12 mx-auto mb-3 text-muted opacity-30" />
              <p className="text-muted text-sm">Aucune activité partagée dans ce groupe</p>
              <p className="text-xs text-muted mt-1">Les membres doivent partager leurs activités avec ce groupe</p>
            </div>
          ) : activities.map((a: any) => (
            <div key={a.id} className="p-4 bg-card border border-border rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{a.name || a.type}</p>
                  <p className="text-xs text-muted">{a.type} · {new Date(a.start_date).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{((a.distance || 0) / 1000).toFixed(1)} km</p>
                  <p className="text-xs text-muted">{Math.floor((a.moving_time || 0) / 60)} min</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CHALLENGES TAB ── */}
      {activeTab === 'challenges' && (
        <div className="space-y-4">
          {isAdmin && (
            <Button className="w-full rounded-xl gap-2" onClick={() => { setShowWizard(true); setWizardStep(1); }}>
              <Sparkles className="w-4 h-4" /> Créer un défi de groupe
            </Button>
          )}

          {challenges.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-muted opacity-30" />
              <p className="text-muted text-sm">Aucun défi dans ce groupe</p>
              {isAdmin && <p className="text-xs text-muted mt-1">Créez le premier défi pour motiver les membres !</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {challenges.map(c => (
                <div key={c.id} className="p-4 bg-card border border-border rounded-2xl">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span className="text-2xl shrink-0">{c.badge_icon || '🏆'}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{c.title}</p>
                        {c.description && <p className="text-xs text-muted line-clamp-1 mt-0.5">{c.description}</p>}
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="text-xs px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">{getModeInfo(c.challenge_mode || 'quota').icon} {getModeInfo(c.challenge_mode || 'quota').label}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-md bg-border text-muted">{getTypeInfo(c.type).icon} {c.target_value} {c.target_unit}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-md bg-border text-muted">⏳ {c.duration_days}j</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-md bg-border text-muted">👥 {c.participant_count || 0}</span>
                        </div>
                        {c.creator_name && <p className="text-xs text-muted mt-1">par {c.creator_name}</p>}
                      </div>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => handleJoinChallenge(c.id)} className="rounded-xl shrink-0">
                      Rejoindre
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SETTINGS ── */}
      {activeTab === 'settings' && isAdmin && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Edit2 className="w-4 h-4 text-primary" />Modifier le groupe</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input label="Nom" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              <div>
                <label className="text-xs font-medium text-muted uppercase tracking-wide mb-1 block">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:border-primary outline-none resize-none" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                <div><p className="text-sm font-medium">Groupe privé</p><p className="text-xs text-muted">Accès par code d&apos;invitation uniquement</p></div>
                <button onClick={() => setEditForm(p => ({ ...p, isPrivate: !p.isPrivate }))} className={`w-12 h-6 rounded-full transition-all relative ${editForm.isPrivate ? 'bg-primary' : 'bg-border'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${editForm.isPrivate ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              {group.inviteCode && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
                  <div className="flex-1"><p className="text-xs text-muted">Code d&apos;invitation</p><p className="font-mono font-bold text-lg tracking-widest">{group.inviteCode}</p></div>
                  <Button size="sm" variant="secondary" onClick={copyInvite} leftIcon={<Copy className="w-4 h-4" />}>Copier</Button>
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1 rounded-xl" onClick={() => setEditForm({ name: group.name, description: group.description || '', isPrivate: group.isPrivate ?? true })}>Réinitialiser</Button>
                <Button className="flex-1 rounded-xl" onClick={handleEdit} leftIcon={<Save className="w-4 h-4" />}>Enregistrer</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2 text-danger"><Trash2 className="w-4 h-4" />Zone de danger</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted mb-4">La suppression est irréversible. Tous les membres seront retirés et les défis supprimés.</p>
              <Button variant="ghost" className="text-danger w-full rounded-xl" onClick={handleDelete} leftIcon={<Trash2 className="w-4 h-4" />}>Supprimer le groupe</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── WIZARD CRÉATION DÉFI ── */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" />Défi de groupe</h3>
                <button onClick={() => { setShowWizard(false); setWizardStep(1); }} className="p-2 rounded-xl hover:bg-border transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex gap-1">{[1,2,3].map(s => <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= wizardStep ? 'bg-primary' : 'bg-border'}`} />)}</div>
              <p className="text-xs text-muted mt-2">{wizardStep === 1 && 'Étape 1 — Mode du défi'}{wizardStep === 2 && 'Étape 2 — Objectif'}{wizardStep === 3 && 'Étape 3 — Personnaliser'}</p>
            </div>

            <div className="px-6 py-5 max-h-[65vh] overflow-y-auto space-y-4">
              {wizardStep === 1 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted uppercase font-medium tracking-wide">Mode du défi</p>
                  {CHALLENGE_MODES.map(m => (
                    <button key={m.id} onClick={() => setForm(p => ({ ...p, challenge_mode: m.id }))} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${form.challenge_mode === m.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/30'}`}>
                      <span className="text-xl">{m.icon}</span>
                      <div className="flex-1"><p className="text-sm font-medium">{m.label}</p><p className="text-xs text-muted">{m.desc}</p></div>
                      {form.challenge_mode === m.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted uppercase font-medium tracking-wide mb-2">Sport</p>
                    <div className="flex flex-wrap gap-2">
                      {SPORT_TYPES.map(s => (
                        <button key={s.id} onClick={() => setForm(p => ({ ...p, sport_type: s.id }))} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border transition-all ${form.sport_type === s.id ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:border-primary/30'}`}>
                          {s.icon} {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted uppercase font-medium tracking-wide mb-2">Métrique</p>
                    <div className="grid grid-cols-2 gap-2">
                      {CHALLENGE_TYPES.filter(t => (t.modes as readonly string[]).includes(form.challenge_mode)).map(t => (
                        <button key={t.id} onClick={() => setForm(p => ({ ...p, type: t.id }))} className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${form.type === t.id ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:border-primary/30'}`}>
                          <span>{t.icon}</span><div className="text-left"><p className="text-sm">{t.label}</p><p className="text-xs text-muted">{t.unit}</p></div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {form.challenge_mode !== 'streak' && form.challenge_mode !== 'frequency' && (
                    <Input label={`Objectif (${getTypeInfo(form.type).unit})`} type="number" value={form.target_value} onChange={e => setForm(p => ({ ...p, target_value: e.target.value }))} placeholder="Ex: 100" />
                  )}
                  {form.challenge_mode === 'progressive' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Input label={`Départ sem. 1 (${getTypeInfo(form.type).unit})`} type="number" value={form.weekly_target} onChange={e => setForm(p => ({ ...p, weekly_target: e.target.value }))} placeholder="Ex: 20" />
                      <Input label="Augmentation/sem. (%)" type="number" value={form.weekly_increase_pct} onChange={e => setForm(p => ({ ...p, weekly_increase_pct: e.target.value }))} placeholder="Ex: 10" />
                    </div>
                  )}
                  {form.challenge_mode === 'streak' && (
                    <Input label="Jours consécutifs" type="number" value={form.streak_days} onChange={e => setForm(p => ({ ...p, streak_days: e.target.value, target_value: e.target.value }))} placeholder="Ex: 30" />
                  )}
                  {form.challenge_mode === 'frequency' && (
                    <Input label="Sorties par semaine" type="number" value={form.frequency_per_week} onChange={e => setForm(p => ({ ...p, frequency_per_week: e.target.value }))} placeholder="Ex: 3" />
                  )}
                  <Input label="Date de fin" type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} />
                </div>
              )}

              {wizardStep === 3 && (
                <div className="space-y-4">
                  <Input label="Nom du défi *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: 100km en juin" />
                  <div>
                    <label className="text-xs font-medium text-muted uppercase tracking-wide mb-1 block">Description</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Décrivez le défi..." rows={3} className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:border-primary outline-none resize-none" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Badge</p>
                    <div className="flex flex-wrap gap-2">
                      {BADGE_ICONS.map(icon => (
                        <button key={icon} onClick={() => setForm(p => ({ ...p, badge_icon: icon }))} className={`w-10 h-10 text-xl rounded-xl border transition-all ${form.badge_icon === icon ? 'border-primary bg-primary/10 scale-110' : 'border-border hover:border-primary/30'}`}>{icon}</button>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                    <p className="text-sm font-semibold">{form.badge_icon} {form.title || 'Mon défi'}</p>
                    <p className="text-xs text-muted">{getModeInfo(form.challenge_mode).icon} {getModeInfo(form.challenge_mode).label} · {getTypeInfo(form.type).icon} {form.target_value || '?'} {getTypeInfo(form.type).unit}</p>
                    {form.end_date && <p className="text-xs text-muted">⏳ Jusqu&apos;au {new Date(form.end_date).toLocaleDateString('fr-FR')}</p>}
                    <p className="text-xs text-muted">👥 Défi privé — membres du groupe uniquement</p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-border flex gap-3">
              {wizardStep > 1 && <Button variant="secondary" onClick={() => setWizardStep(s => s - 1)} className="rounded-xl">← Retour</Button>}
              {wizardStep < 3 ? (
                <Button onClick={() => setWizardStep(s => s + 1)} className="flex-1 rounded-xl" disabled={wizardStep === 2 && !form.target_value && form.challenge_mode !== 'frequency'}>Suivant →</Button>
              ) : (
                <Button onClick={handleCreateChallenge} disabled={isCreating || !form.title.trim()} className="flex-1 rounded-xl">
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : '🏆 Créer le défi'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
