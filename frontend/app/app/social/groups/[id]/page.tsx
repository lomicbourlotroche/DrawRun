/**
 * Group Detail Page - Complete group management UI
 * =================================================
 * Tabs: Overview, Members, Activities, Events, Settings
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge, Avatar, Skeleton } from '@/components/ui';
import type { GroupDetail, GroupMember, GroupEvent, Activity } from '@/types';
import {
  Users, Settings, Activity as ActivityIcon, Calendar,
  ChevronLeft, Copy, Trash2, Edit2, UserX, Crown, Shield,
  Plus, Clock, MapPin, Flame, TrendingUp, X, Save,
  Loader2, Eye, MessageCircle, Bell
} from 'lucide-react';
import { toast } from 'sonner';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = parseInt(params.id as string);

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'activities' | 'events' | 'settings'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', isPrivate: false });
  const [eventForm, setEventForm] = useState({ title: '', description: '', location: '', eventDate: '', isOnline: false });

  const loadGroup = useCallback(async () => {
    setIsLoading(true);
    try {
      const [groupData, membersData, activitiesData, eventsData] = await Promise.all([
        api.getGroupDetail(groupId),
        api.getGroupMembers(groupId),
        api.getGroupActivities(groupId, 10),
        api.getGroupEvents(groupId),
      ]);
      setGroup(groupData);
      setMembers(membersData);
      setActivities(activitiesData);
      setEvents(eventsData);
    } catch (e) {
      toast.error('Groupe introuvable');
      router.push('/app/social');
    } finally {
      setIsLoading(false);
    }
  }, [groupId, router]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  const handleEdit = async () => {
    try {
      await api.editGroup(groupId, editForm);
      toast.success('Groupe modifié');
      setShowEditModal(false);
      loadGroup();
    } catch (e) {
      toast.error('Erreur');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer ce groupe ? Cette action est irréversible.')) return;
    try {
      await api.deleteGroup(groupId);
      toast.success('Groupe supprimé');
      router.push('/app/social');
    } catch (e) {
      toast.error('Erreur');
    }
  };

  const handleKick = async (userId: number) => {
    if (!confirm('Exclure ce membre ?')) return;
    try {
      await api.kickMember(groupId, userId);
      toast.success('Membre exclu');
      loadGroup();
    } catch (e) {
      toast.error('Erreur');
    }
  };

  const handlePromote = async (userId: number, newRole: string) => {
    try {
      await api.promoteMember(groupId, userId, newRole);
      toast.success('Rôle modifié');
      loadGroup();
    } catch (e) {
      toast.error('Erreur');
    }
  };

  const handleCreateEvent = async () => {
    try {
      await api.createEvent(groupId, eventForm);
      toast.success('Événement créé');
      setShowEventModal(false);
      setEventForm({ title: '', description: '', location: '', eventDate: '', isOnline: false });
      loadGroup();
    } catch (e) {
      toast.error('Erreur');
    }
  };

  const handleLeave = async () => {
    if (!confirm('Quitter ce groupe ?')) return;
    try {
      await api.leaveGroup(groupId);
      toast.success('Vous avez quitté le groupe');
      router.push('/app/social');
    } catch (e) {
      toast.error('Erreur');
    }
  };

  const copyInvite = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      toast.success('Code copié');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Aperçu', icon: Eye },
    { id: 'members', label: `Membres (${members.length})`, icon: Users },
    { id: 'activities', label: 'Activités', icon: ActivityIcon },
    { id: 'events', label: `Événements (${events.length})`, icon: Calendar },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ] as const;

  const isAdmin = group?.userRole === 'admin';

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.push('/app/social')} className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{group.name}</h1>
            {group.isPrivate ? (
              <Badge variant="default" className="bg-orange-500/10 text-orange-500">Privé</Badge>
            ) : (
              <Badge variant="default" className="bg-green-500/10 text-green-500">Public</Badge>
            )}
          </div>
          {group.description && <p className="text-muted mt-1">{group.description}</p>}
          <div className="flex items-center gap-4 mt-3 text-sm text-muted">
            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {group.memberCount} membres</span>
            {group.userRole && (
              <Badge variant="default" className={`rounded-full ${group.userRole === 'admin' ? 'bg-primary text-white' : 'bg-muted'}`}>
                {group.userRole === 'admin' ? 'Admin' : 'Membre'}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {group.inviteCode && (
            <Button variant="secondary" size="sm" onClick={copyInvite} leftIcon={<Copy className="w-4 h-4" />}>
              Copier le code
            </Button>
          )}
          {!isAdmin && (
            <Button variant="ghost" size="sm" className="text-danger" onClick={handleLeave}>
              Quitter
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-card border border-border text-muted hover:text-foreground hover:border-primary/30'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-card border border-border text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{group.memberCount}</p>
              <p className="text-xs text-muted">Membres</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border text-center">
              <ActivityIcon className="w-6 h-6 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">{activities.length}</p>
              <p className="text-xs text-muted">Activités récentes</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border text-center">
              <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{events.length}</p>
              <p className="text-xs text-muted">Événements</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border text-center">
              <Crown className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold">{group.adminCount || 1}</p>
              <p className="text-xs text-muted">Admins</p>
            </div>
          </div>

          {/* Recent Activities */}
          {activities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activités récentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Flame className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{activity.name}</p>
                          <p className="text-xs text-muted">{activity.type} - {new Date(activity.start_date).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{((activity.distance || 0) / 1000).toFixed(1)} km</p>
                        <p className="text-xs text-muted">{Math.floor((activity.moving_time || 0) / 60)} min</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Events */}
          {events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Événements à venir</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events.slice(0, 3).map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-xs text-muted">{new Date(event.eventDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-blue-500/10 text-blue-500">{event.attendeeCount} participants</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl">
                <div className="flex items-center gap-4">
                  <Avatar name={member.name} size="md" />
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-xs text-muted">Membre depuis {new Date(member.joinedAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {member.role === 'admin' ? (
                    <Badge variant="default" className="bg-primary text-white rounded-full"><Crown className="w-3 h-3 mr-1" /> Admin</Badge>
                  ) : member.role === 'moderator' ? (
                    <Badge variant="default" className="bg-blue-500/10 text-blue-500 rounded-full"><Shield className="w-3 h-3 mr-1" /> Modérateur</Badge>
                  ) : (
                    <Badge variant="default" className="bg-muted rounded-full">Membre</Badge>
                  )}
                  {isAdmin && member.role !== 'admin' && (
                    <div className="flex gap-1">
                      {member.role !== 'moderator' && (
                        <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => handlePromote(member.userId, 'moderator')}>
                          <Shield className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="rounded-lg text-danger" onClick={() => handleKick(member.userId)}>
                        <UserX className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'activities' && (
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <ActivityIcon className="w-12 h-12 mx-auto mb-4 text-muted opacity-30" />
              <p className="text-muted">Aucune activité récente dans le groupe</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="p-4 bg-card border border-border rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{activity.name}</p>
                      <p className="text-sm text-muted">{activity.type} - {new Date(activity.start_date).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{((activity.distance || 0) / 1000).toFixed(1)} km</p>
                      <p className="text-sm text-muted">{Math.floor((activity.moving_time || 0) / 60)} min</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'events' && (
        <div className="space-y-4">
          {isAdmin && (
            <Button className="w-full rounded-xl" onClick={() => setShowEventModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Créer un événement
            </Button>
          )}

          {events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted opacity-30" />
              <p className="text-muted">Aucun événement prévu</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="p-5 bg-card border border-border rounded-2xl">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{event.title}</h4>
                        {event.description && <p className="text-sm text-muted mt-1">{event.description}</p>}
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted">
                          <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(event.eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                          {event.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {event.location}</span>}
                        </div>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-blue-500/10 text-blue-500 rounded-full">{event.attendeeCount} participants</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && isAdmin && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-primary" />
                Modifier le groupe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input label="Nom" value={editForm.name || group.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              <Input label="Description" value={editForm.description || group.description || ''} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                <div>
                  <p className="font-medium text-sm">Groupe privé</p>
                  <p className="text-xs text-muted">Seuls les membres avec code d&apos;invitation peuvent rejoindre</p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.isPrivate ?? (group.isPrivate ?? true)}
                  onChange={(e) => setEditForm({ ...editForm, isPrivate: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1 rounded-xl" onClick={() => setEditForm({ name: group.name, description: group.description || '', isPrivate: group.isPrivate ?? true })}>
                  Réinitialiser
                </Button>
                <Button className="flex-1 rounded-xl" onClick={handleEdit} leftIcon={<Save className="w-4 h-4" />}>
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-danger">
                <Trash2 className="w-4 h-4" />
                Zone de danger
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted mb-4">La suppression du groupe est irréversible. Tous les membres seront retirés.</p>
              <Button variant="ghost" className="text-danger w-full rounded-xl" onClick={handleDelete} leftIcon={<Trash2 className="w-4 h-4" />}>
                Supprimer le groupe
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-card p-6 rounded-3xl w-full max-w-md border border-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Modifier le groupe</h3>
            <div className="space-y-4">
              <Input label="Nom" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              <Input label="Description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowEditModal(false)} className="flex-1 rounded-xl">Annuler</Button>
                <Button onClick={handleEdit} className="flex-1 rounded-xl">Enregistrer</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEventModal(false)}>
          <div className="bg-card p-6 rounded-3xl w-full max-w-md border border-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Créer un événement</h3>
            <div className="space-y-4">
              <Input label="Titre" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
              <Input label="Description" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
              <Input label="Lieu" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} />
              <Input label="Date" type="datetime-local" value={eventForm.eventDate} onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })} />
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowEventModal(false)} className="flex-1 rounded-xl">Annuler</Button>
                <Button onClick={handleCreateEvent} className="flex-1 rounded-xl">Créer</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
