/**
 * ============================================================
 * USE GROUP DETAIL HOOK
 * ============================================================
 * Hook React pour gérer les détails d'un groupe.
 * 
 * @module hooks/useGroupDetail
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { GroupDetail, GroupMember, Activity } from '@/types';
import type { CreateChallengeParams } from '@/lib/api';
import { toast } from 'sonner';
import { SOCIAL_ERRORS } from '@/constants/social';

type GroupChallenge = {
  id: number;
  title: string;
  description: string;
  type: string;
  target_value: number;
  target_unit: string;
  duration_days: number;
  participant_count: number;
  created_at: string;
  challenge_mode?: string;
  badge_icon?: string;
  sport_type?: string;
  milestones?: string;
  creator_name?: string;
};

interface UseGroupDetailReturn {
  group: GroupDetail | null;
  members: GroupMember[];
  activities: Activity[];
  challenges: GroupChallenge[];
  isLoading: boolean;
  error: string | null;
  editForm: { name: string; description: string; isPrivate: boolean };
  isAdmin: boolean;
  loadGroup: () => Promise<void>;
  handleEdit: () => Promise<void>;
  handleDelete: () => Promise<void>;
  handleKick: (_userId: number) => Promise<void>;
  handlePromote: (_userId: number, _role: string) => Promise<void>;
  handleLeave: () => Promise<void>;
  copyInvite: () => void;
  handleCreateChallenge: (_form: Omit<CreateChallengeParams, 'groupId'> & { is_public?: boolean; end_date?: string }) => Promise<void>;
  handleJoinChallenge: (_challengeId: number) => Promise<void>;
  setEditForm: (_form: { name: string; description: string; isPrivate: boolean }) => void;
  setShowWizard: (_show: boolean) => void;
  showWizard: boolean;
}

export function useGroupDetail(): UseGroupDetailReturn {
  const params = useParams();
  const router = useRouter();
  const groupId = parseInt(params.id as string);

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [challenges, setChallenges] = useState<GroupChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', is_private: false });
  const [showWizard, setShowWizard] = useState(false);

  const isAdmin = group?.user_role === 'admin';

  const loadGroup = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [groupData, membersData, activitiesData, challengesData] = await Promise.all([
        api.getGroupDetail(groupId),
        api.getGroupMembers(groupId),
        api.getGroupActivities(groupId, 10),
        api.getGroupChallenges(groupId).catch(() => []),
      ]);
      setGroup(groupData);
      setMembers(membersData || []);
      setActivities(activitiesData || []);
      setChallenges(challengesData || []);
      setEditForm({
        name: groupData.name,
        description: groupData.description || '',
        is_private: groupData.is_private ?? true,
      });
    } catch {
      setError(SOCIAL_ERRORS.FETCH_GROUPS);
      toast.error('Groupe introuvable');
      router.push('/app/social');
    } finally {
      setIsLoading(false);
    }
  }, [groupId, router]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  const handleEdit = useCallback(async () => {
    try {
      await api.editGroup(groupId, editForm);
      toast.success('Groupe modifié');
      loadGroup();
    } catch {
      toast.error(SOCIAL_ERRORS.CREATE_GROUP);
    }
  }, [groupId, editForm, loadGroup]);

  const handleDelete = useCallback(async () => {
    if (!confirm('Supprimer ce groupe ? Action irréversible.')) return;
    try {
      await api.deleteGroup(groupId);
      toast.success('Groupe supprimé');
      router.push('/app/social');
    } catch {
      toast.error(SOCIAL_ERRORS.CREATE_GROUP);
    }
  }, [groupId, router]);

  const handleKick = useCallback(async (userId: number) => {
    if (!confirm('Exclure ce membre ?')) return;
    try {
      await api.kickMember(groupId, userId);
      toast.success('Membre exclu');
      loadGroup();
    } catch {
      toast.error(SOCIAL_ERRORS.LEAVE_GROUP);
    }
  }, [groupId, loadGroup]);

  const handlePromote = useCallback(async (userId: number, role: string) => {
    try {
      await api.promoteMember(groupId, userId, role);
      toast.success('Rôle modifié');
      loadGroup();
    } catch {
      toast.error(SOCIAL_ERRORS.FETCH_GROUPS);
    }
  }, [groupId, loadGroup]);

  const handleLeave = useCallback(async () => {
    if (!confirm('Quitter ce groupe ?')) return;
    try {
      await api.leaveGroup(groupId);
      toast.success('Groupe quitté');
      router.push('/app/social');
    } catch {
      toast.error(SOCIAL_ERRORS.LEAVE_GROUP);
    }
  }, [groupId, router]);

  const copyInvite = useCallback(() => {
    if (group?.invite_code) {
      navigator.clipboard.writeText(group.invite_code);
      toast.success('Code copié');
    }
  }, [group?.invite_code]);

  const handleCreateChallenge = useCallback(
    async (form: Omit<CreateChallengeParams, 'groupId'> & { is_public?: boolean; end_date?: string }) => {
      const durationDays = form.end_date
        ? Math.max(1, Math.ceil((new Date(form.end_date).getTime() - Date.now()) / 86400000))
        : 30;
      await api.createGroupChallenge(groupId, {
        title: form.title,
        description: form.description,
        type: form.type,
        target_value: Number(form.target_value) || 0,
        duration_days: durationDays,
        challenge_mode: form.challenge_mode,
        badge_icon: form.badge_icon,
        sport_type: form.sport_type,
        weekly_target: form.weekly_target ? Number(form.weekly_target) : undefined,
        weekly_increase_pct: form.weekly_increase_pct ? Number(form.weekly_increase_pct) : undefined,
        streak_days: form.streak_days ? Number(form.streak_days) : undefined,
        frequency_per_week: form.frequency_per_week ? Number(form.frequency_per_week) : undefined,
      } as CreateChallengeParams);
      toast.success('Défi créé ! 🏆');
      setShowWizard(false);
      loadGroup();
    },
    [groupId, loadGroup]
  );

  const handleJoinChallenge = useCallback(async (challengeId: number) => {
    try {
      await api.joinChallenge(challengeId);
      toast.success('Défi rejoint !');
      loadGroup();
    } catch {
      toast.error(SOCIAL_ERRORS.JOIN_CHALLENGE);
    }
  }, [loadGroup]);

  return {
    group,
    members,
    activities,
    challenges,
    isLoading,
    error,
    editForm,
    isAdmin,
    loadGroup,
    handleEdit,
    handleDelete,
    handleKick,
    handlePromote,
    handleLeave,
    copyInvite,
    handleCreateChallenge,
    handleJoinChallenge,
    setEditForm,
    setShowWizard,
    showWizard,
  };
}
