'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Avatar, Skeleton } from '@/components/ui';
import type { Activity } from '@/types';
import {
  Users, Settings, Activity as ActivityIcon, Trophy,
  ChevronLeft, Copy, Trash2, Edit2, UserX, Crown, Shield, Flame, Save, Eye, Sparkles
} from 'lucide-react';
import ChallengeWizard from '../../modals/ChallengeWizard';
import { getModeInfo, getTypeInfo } from '../../tabs/challenge-constants';
import { useGroupDetail } from '@/hooks/useGroupDetail';

type GroupChallenge = {
  id: number; title: string; description: string; type: string;
  target_value: number; target_unit: string; duration_days: number;
  participant_count: number; created_at: string; challenge_mode?: string;
  badge_icon?: string; sport_type?: string; milestones?: string;
  creator_name?: string;
};

export default function GroupDetailPage() {
  const {
    group,
    members,
    activities,
    challenges,
    isLoading,
    error,
    editForm,
    isAdmin,
    showWizard,
    setEditForm,
    setShowWizard,
    loadGroup,
    handleEdit,
    handleDelete,
    handleKick,
    handlePromote,
    handleLeave,
    copyInvite,
    handleCreateChallenge,
    handleJoinChallenge,
  } = useGroupDetail();

  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'activities' | 'challenges' | 'settings'>('overview');

  // Show errors
  useEffect(() => {
    if (error) {
      // Error is already handled in the hook with toast
    }
  }, [error]);

  const tabs = [
    { id: 'overview',    label: 'Aperçu',                          icon: Eye },
    { id: 'members',     label: `Membres (${members.length})`,     icon: Users },
    { id: 'activities',  label: 'Activités',                       icon: ActivityIcon },
    { id: 'challenges',  label: `Défis (${challenges.length})`,    icon: Trophy },
    { id: 'settings',    label: 'Paramètres',                      icon: Settings },
  ] as const;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-12 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-8">
      {/* ── HEADER ── */}
      <div className="flex items-start gap-4">
        <button onClick={() => window.history.back()} className="p-2 rounded-xl bg-card border border-border hover:bg-border transition-colors mt-1" aria-label="Retour">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold truncate">{group.name}</h1>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${group.isPrivate ? 'bg-peak/10 text-peak' : 'bg-success/10 text-success'}`}>
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
            <Button variant="secondary" size="sm" onClick={copyInvite} leftIcon={<Copy className="w-4 h-4" />} aria-label="Copier le code d'invitation">
              Code
            </Button>
          )}
          {!isAdmin && (
            <Button variant="ghost" size="sm" className="text-danger" onClick={handleLeave} aria-label="Quitter le groupe">
              Quitter
            </Button>
          )}
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-1 overflow-x-auto pb-2 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            aria-label={`Aller à l'onglet ${tab.label}`}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-card border border-border text-muted hover:text-foreground hover:border-primary/30'
            }`}
          >
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
              { icon: ActivityIcon, color: 'text-peak', bg: 'bg-peak/10', val: activities.length, label: 'Activités' },
              { icon: Trophy, color: 'text-warning', bg: 'bg-warning/10', val: challenges.length, label: 'Défis' },
              { icon: Crown, color: 'text-warning', bg: 'bg-warning/10', val: group.adminCount || 1, label: 'Admins' },
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
                {activities.slice(0, 5).map((a: Activity) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><Flame className="w-4 h-4 text-primary" /></div>
                      <div><p className="font-medium text-sm">{a.name || a.type}</p><p className="text-xs text-muted">{a.start_date ? new Date(a.start_date).toLocaleDateString('fr-FR') : ''}</p></div>
                    </div>
                    <div className="text-right"><p className="text-sm font-medium">{((a.distance || 0) / 1000).toFixed(1)} km</p><p className="text-xs text-muted">{Math.floor((a.moving_time || 0) / 60)} min</p></div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {challenges.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Trophy className="w-4 h-4 text-warning" />Défis actifs</CardTitle></CardHeader>
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
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1"><Shield className="w-3 h-3" />Modo</span>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full bg-border text-muted font-medium">Membre</span>
                )}
                {isAdmin && member.role !== 'admin' && (
                  <div className="flex gap-1">
                    {member.role !== 'moderator' && (
                      <button onClick={() => handlePromote(member.userId, 'moderator')} className="p-1.5 rounded-lg hover:bg-border transition-colors" title="Promouvoir modérateur" aria-label="Promouvoir modérateur">
                        <Shield className="w-4 h-4 text-primary" />
                      </button>
                    )}
                    <button onClick={() => handleKick(member.userId)} className="p-1.5 rounded-lg hover:bg-danger/10 transition-colors" title="Exclure" aria-label="Exclure le membre">
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
          ) : activities.map((a: Activity) => (
            <div key={a.id} className="p-4 bg-card border border-border rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{a.name || a.type}</p>
                  <p className="text-xs text-muted">{a.type} · {a.start_date ? new Date(a.start_date).toLocaleDateString('fr-FR') : ''}</p>
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
            <Button className="w-full rounded-xl gap-2" onClick={() => setShowWizard(true)} aria-label="Créer un défi de groupe">
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
                    <Button size="sm" variant="secondary" onClick={() => handleJoinChallenge(c.id)} className="rounded-xl shrink-0" aria-label="Rejoindre le défi">
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
              <Input label="Nom" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} aria-required="true" />
              <div>
                <label className="text-xs font-medium text-muted uppercase tracking-wide mb-1 block">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} aria-label="Description du groupe" className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:border-primary outline-none resize-none" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                <div><p className="text-sm font-medium">Groupe privé</p><p className="text-xs text-muted">Accès par code d&apos;invitation uniquement</p></div>
                <button onClick={() => setEditForm({ ...editForm, isPrivate: !editForm.isPrivate })} aria-label={editForm.isPrivate ? 'Passer en groupe public' : 'Passer en groupe privé'} className={`w-12 h-6 rounded-full transition-all relative ${editForm.isPrivate ? 'bg-primary' : 'bg-border'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${editForm.isPrivate ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              {group.inviteCode && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
                  <div className="flex-1"><p className="text-xs text-muted">Code d&apos;invitation</p><p className="font-mono font-bold text-lg tracking-widest">{group.inviteCode}</p></div>
                  <Button size="sm" variant="secondary" onClick={copyInvite} leftIcon={<Copy className="w-4 h-4" />} aria-label="Copier le code">Copier</Button>
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1 rounded-xl" onClick={() => setEditForm({ name: group.name, description: group.description || '', isPrivate: group.isPrivate ?? true })} aria-label="Réinitialiser le formulaire">
                  Réinitialiser
                </Button>
                <Button className="flex-1 rounded-xl" onClick={handleEdit} leftIcon={<Save className="w-4 h-4" />} aria-label="Enregistrer les modifications">
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2 text-danger"><Trash2 className="w-4 h-4" />Zone de danger</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted mb-4">La suppression est irréversible. Tous les membres seront retirés et les défis supprimés.</p>
              <Button variant="ghost" className="text-danger w-full rounded-xl" onClick={handleDelete} leftIcon={<Trash2 className="w-4 h-4" />} aria-label="Supprimer le groupe">
                Supprimer le groupe
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── WIZARD CRÉATION DÉFI ── */}
      {showWizard && (
        <ChallengeWizard
          title="Défi de groupe"
          showPresets={false}
          showPublicToggle={false}
          onClose={() => setShowWizard(false)}
          onCreate={handleCreateChallenge as unknown as (form: import('../../tabs/challenge-constants').ChallengeForm) => Promise<void>}
        />
      )}
    </div>
  );
}
