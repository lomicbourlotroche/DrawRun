'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent, Button, Input, Avatar } from '@/components/ui';
import { useAuthStore, useUserConstantsStore } from '@/stores';
import { api } from '@/lib/api';
import { User, Mail, Scale, Heart, RotateCcw, Zap, Camera, ToggleLeft, ToggleRight, RefreshCw, Gift } from '@/components/ui/icons';
import { toast } from 'sonner';

export function ProfileTab({ isNewUser }: { isNewUser: boolean }) {
  const { user, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(isNewUser);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ name: '', weight: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isSavingConstants, setIsSavingConstants] = useState(false);
  const [constForm, setConstForm] = useState({ fcm: '', vma: '', vdot: '', vo2max: '' });
  const { data: constantsData, fetchConstants, invalidate } = useUserConstantsStore();

  useEffect(() => {
    if (user) {
      fetchConstants();
      setAutoUpdate(user.auto_update !== false);
      api.getProfile().then((profile) => {
        if (profile.name) updateUser({ name: profile.name });
        setForm({
          name: profile.name || user.name || '',
          weight: (profile.weight || user.weight)?.toString() || '',
        });
        if ((profile as { avatar_url?: string }).avatar_url) {
          setAvatarUrl((profile as unknown as { avatar_url: string }).avatar_url);
        }
      }).catch(() => {
        setForm({ name: user.name || '', weight: user.weight?.toString() || '' });
      });
    }
  }, [user, fetchConstants, updateUser]);

  useEffect(() => {
    if (constantsData) {
      setConstForm({
        fcm: constantsData.profile.fcm?.toString() || '',
        vma: constantsData.profile.vma?.toString() || '',
        vdot: constantsData.profile.vdot?.toString() || '',
        vo2max: constantsData.profile.vo2max?.toString() || '',
      });
    }
  }, [constantsData]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop volumineuse (max 5MB)');
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const result = await api.uploadAvatar(base64);
        if (result.success) {
          setAvatarUrl(result.avatar_url);
          updateUser({
            profile_data: {
              ...(user?.profile_data || {}),
              avatar_url: result.avatar_url
            }
          });
          toast.success('Photo de profil mise à jour');
        }
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateProfile({ name: form.name, weight: parseFloat(form.weight) || undefined });
      updateUser({ name: form.name, weight: parseFloat(form.weight) || undefined });
      setIsEditing(false);
      toast.success('Profil mis à jour');
    } catch { toast.error('Erreur'); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-6">
      {isNewUser && (
        <div className="bg-gradient-to-r from-primary/20 to-blue-500/20 border border-primary/30 rounded-xl p-4 flex items-start gap-3">
          <Gift className="w-6 h-6 text-primary flex-shrink-0" />
          <div>
            <h2 className="font-medium">Bienvenue sur DrawRun !</h2>
            <p className="text-sm text-muted mt-1">Configurez votre profil pour commencer.</p>
          </div>
        </div>
      )}

      <GlassCard>
        <GlassCardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={user?.name || 'Avatar'}
                    width={64}
                    height={64}
                    unoptimized
                    className="w-16 h-16 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                <Avatar name={user?.name} size="xl" />
              )}
              <label
                className={`absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity ${isUploading ? 'pointer-events-none' : ''}`}
              >
                {isUploading ? (
                  <RefreshCw className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user?.name}</h2>
              <p className="text-sm text-muted">{user?.email}</p>
              <p className="text-xs text-primary mt-1 cursor-pointer hover:underline" onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}>
                {avatarUrl ? 'Changer la photo' : 'Ajouter une photo'}
              </p>
            </div>
          </div>
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setForm({ name: user?.name || '', weight: user?.weight?.toString() || '' })}>Annuler</Button>
              <Button size="sm" onClick={handleSave} isLoading={isSaving}>Enregistrer</Button>
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>Modifier</Button>
          )}
        </GlassCardHeader>
        <GlassCardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={!isEditing} leftIcon={<User className="w-4 h-4" />} />
            <Input label="Email" value={user?.email || ''} disabled leftIcon={<Mail className="w-4 h-4" />} />
            <Input label="Poids (kg)" type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} disabled={!isEditing} leftIcon={<Scale className="w-4 h-4" />} />
          </div>
        </GlassCardContent>
      </GlassCard>

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Constantes physiologiques
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'fcm' as const, label: 'FCM', source: constantsData?.sources.fcm, unit: 'bpm', placeholder: '185' },
              { key: 'vma' as const, label: 'VMA', source: constantsData?.sources.vma, unit: 'km/h', placeholder: '15' },
              { key: 'vdot' as const, label: 'VDOT', source: constantsData?.sources.vdot, unit: '', placeholder: '45' },
              { key: 'vo2max' as const, label: 'VO2max', source: constantsData?.sources.vo2max, unit: 'ml/kg/min', placeholder: '50', readOnly: true },
            ].map((item: { key: 'fcm' | 'vma' | 'vdot' | 'vo2max'; label: string; source?: string; unit: string; placeholder: string; readOnly?: boolean }) => {
              const src = item.source || 'estimated';
              const isEditable = !autoUpdate;
              const badgeColor = src === 'manual' ? 'bg-success/15 text-success/80' : src === 'computed' ? 'bg-primary/15 text-primary/80' : 'bg-warning/15 text-warning/80';
              const badgeLabel = src === 'manual' ? 'Manuel' : src === 'computed' ? 'Auto' : 'Estimé';
              return (
                <div key={item.key} className={`p-3 rounded-xl bg-card border ${isEditable ? 'border-primary/30' : 'border-border'} text-center`}>
                  <p className="text-xs text-muted mb-1">{item.label}</p>
                  {isEditable ? (
                    <input
                      type="number"
                      value={constForm[item.key]}
                      onChange={e => !item.readOnly && setConstForm(prev => ({ ...prev, [item.key]: e.target.value }))}
                      placeholder={item.placeholder}
                      readOnly={item.readOnly}
                      className={`w-full text-center text-xl font-bold bg-transparent border-b py-1 ${item.readOnly ? 'border-muted cursor-not-allowed opacity-60' : 'border-primary/30 focus:outline-none focus:border-primary'}`}
                    />
                  ) : (
                    <p className={`text-2xl font-bold ${item.source ? 'text-foreground' : 'text-muted'}`}>
                      {constantsData?.profile[item.key] ?? '--'}
                      {item.unit && <span className="text-sm text-muted font-normal ml-1">{item.unit}</span>}
                    </p>
                  )}
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${badgeColor}`}>
                    {badgeLabel}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              {autoUpdate ? (
                <ToggleRight className="w-5 h-5 text-primary" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-muted" />
              )}
              <div>
                <p className="text-sm font-medium">Mise à jour automatique</p>
                <p className="text-xs text-muted">Recalculer automatiquement depuis les activités</p>
              </div>
            </div>
            <button
              onClick={async () => {
                const next = !autoUpdate;
                setAutoUpdate(next);
                try {
                  await api.updateProfile({ auto_update: next } as Record<string, unknown>);
                  updateUser({ auto_update: next });
                  invalidate();
                } catch { /* silencieux */ }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoUpdate ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoUpdate ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {autoUpdate ? (
            <Button
              variant="secondary"
              className="w-full"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              isLoading={isRecalculating}
              onClick={async () => {
                setIsRecalculating(true);
                try {
                  await api.recalculateMetrics();
                  invalidate();
                  await fetchConstants();
                  toast.success('Constantes recalculées');
                } catch {
                  toast.error('Erreur de calcul');
                } finally {
                  setIsRecalculating(false);
                }
              }}
            >
              Recalculer depuis les activités
            </Button>
          ) : (
            <Button
              className="w-full"
              leftIcon={<Heart className="w-4 h-4" />}
              isLoading={isSavingConstants}
              onClick={async () => {
                setIsSavingConstants(true);
                try {
                  const payload: Record<string, number> = {};
                  if (constForm.fcm) payload.fcm = parseInt(constForm.fcm);
                  if (constForm.vma) payload.vma = parseFloat(constForm.vma);
                  if (constForm.vdot) payload.vdot = parseFloat(constForm.vdot);
                  if (Object.keys(payload).length > 0) {
                    await api.updateProfile({ ...payload, auto_update: false } as Record<string, unknown>);
                    updateUser({ ...payload, auto_update: false });
                    invalidate();
                    await fetchConstants();
                    toast.success('Constantes mises à jour');
                  }
                } catch {
                  toast.error('Erreur');
                } finally {
                  setIsSavingConstants(false);
                }
              }}
            >
              Enregistrer les valeurs manuelles
            </Button>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
