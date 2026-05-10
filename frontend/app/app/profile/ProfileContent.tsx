/* eslint-disable unused-imports/no-unused-vars, no-undef, @next/next/no-img-element, react/no-unescaped-entities */
/**
 * ProfileContent - Contenu de la page Profil pour lazy loading
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent, Button, Input, GradientBadge, Avatar, Modal } from '@/components/ui';
import { useAuthStore, useSyncStore, useUserConstantsStore } from '@/stores';
import { api } from '@/lib/api';
import { useLanguage } from '@/components/providers/LanguageProvider';
import type { User as UserType } from '@/types';
import {
  User, Mail, Scale, Heart, LogOut, RefreshCw, CheckCircle, XCircle,
  Trash2, AlertTriangle, Gift, Watch, Lock, Eye, EyeOff, Shield, Monitor, Moon, Sun,
  Globe, Layout, Bell, BellOff, Camera, Zap, ToggleLeft, ToggleRight, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// SERVICE CARD COMPONENT
// ============================================================================

   function ServiceCard({ 
    service, 
    isConnected, 
    lastSync, 
    onConnect, 
    onDisconnect, 
    isDisconnecting, 
  }: {
    service: 'strava' | 'garmin' | 'suunto' | 'decathlon';
    isConnected: boolean; 
    lastSync: string | null; 
    onConnect: () => void; 
    onDisconnect: () => void; 
    isDisconnecting: boolean; 
  }) {
  const config = {
    strava: { name: 'Strava', color: 'orange' },
    garmin: { name: 'Garmin', color: 'blue' },
    suunto: { name: 'Suunto', color: 'green' },
    decathlon: { name: 'Decathlon', color: 'red' },
  };

  const c = config[service];

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl bg-${c.color}-500/20 flex items-center justify-center`}>
          <Watch className={`w-6 h-6 text-${c.color}-500`} />
        </div>
        <div>
          <h3 className="font-medium">{c.name}</h3>
          <p className="text-sm text-muted">
            {isConnected && lastSync
              ? `Sync: ${new Date(lastSync).toLocaleDateString('fr-FR')}`
              : isConnected ? 'Connecté' : 'Non connecté'}
          </p>
        </div>
      </div>
      {isConnected ? (
        <div className="flex items-center gap-2">
          <GradientBadge variant="success" size="sm"><CheckCircle className="w-3 h-3" />Connecté</GradientBadge>
          <Button variant="ghost" size="sm" onClick={onDisconnect} isLoading={isDisconnecting}>
            <XCircle className="w-4 h-4 text-danger" />
          </Button>
        </div>
      ) : (
        <Button variant="secondary" size="sm" onClick={onConnect}>
          Connecter
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// CREDENTIALS MODAL
// ============================================================================

function CredentialModal({ 
  isOpen, 
  onClose, 
  service, 
  onConnect 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  service: 'strava' | 'garmin' | 'suunto'; 
  onConnect: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEmail(''); setPassword(''); setShowPassword(false);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!email || !password) { toast.error('Veuillez remplir tous les champs'); return; }
    setIsLoading(true);
    try { await onConnect(email, password); onClose(); } 
    catch { /* handled by parent */ } 
    finally { setIsLoading(false); }
  };

  const titles = {
    strava: 'Connecter Strava',
    garmin: 'Connecter Garmin',
    suunto: 'Connecter Suunto',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titles[service]} size="sm">
      <div className="space-y-4">
        <p className="text-sm text-muted">Entrez vos identifiants pour synchroniser vos activités.</p>
        <Input label="Email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} leftIcon={<Mail className="w-4 h-4" />} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
        <div className="relative">
          <Input label="Mot de passe" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} leftIcon={<Lock className="w-4 h-4" />} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
          <button type="button" className="absolute right-3 top-9 text-muted hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Annuler</Button>
          <Button onClick={handleSubmit} isLoading={isLoading} className="flex-1">Connecter</Button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================================
// PROFILE TAB
// ============================================================================

function ProfileTab({ isNewUser }: { isNewUser: boolean }) {
  const { user, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(isNewUser);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ name: '', weight: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const { data: constantsData, fetchConstants } = useUserConstantsStore();

  useEffect(() => {
    if (user) {
      fetchConstants();
      setAutoUpdate((user as any).auto_update !== false);
      api.getProfile().then((profile) => {
        if (profile.name) updateUser({ name: profile.name });
        setForm({
          name: profile.name || user.name || '',
          weight: (profile.weight || user.weight)?.toString() || '',
        });
        if ((profile as any).avatar_url) setAvatarUrl((profile as any).avatar_url);
      }).catch(() => {
        setForm({ name: user.name || '', weight: user.weight?.toString() || '' });
      });
    }
  }, [user]);

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
          updateUser({ profile_data: { ...((user as any)?.profile_data || {}), avatar_url: result.avatar_url } } as any);
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
      {/* Welcome Banner */}
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

      {/* Constantes physiologiques */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Constantes physiologiques
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'FCM', value: constantsData?.profile.fcm, source: constantsData?.sources.fcm, unit: 'bpm' },
              { label: 'VMA', value: constantsData?.profile.vma, source: constantsData?.sources.vma, unit: 'km/h' },
              { label: 'VDOT', value: constantsData?.profile.vdot, source: constantsData?.sources.vdot, unit: '' },
            ].map(item => {
              const src = item.source || 'estimated';
              const badgeColor = src === 'manual' ? 'bg-green-500/15 text-green-400' : src === 'computed' ? 'bg-blue-500/15 text-blue-400' : 'bg-yellow-500/15 text-yellow-400';
              const badgeLabel = src === 'manual' ? 'Manuel' : src === 'computed' ? 'Auto' : 'Estimé';
              return (
                <div key={item.label} className="p-3 rounded-xl bg-card border border-border text-center">
                  <p className="text-xs text-muted mb-1">{item.label}</p>
                  <p className={`text-2xl font-bold ${item.value ? 'text-foreground' : 'text-muted'}`}>
                    {item.value ?? '--'}
                    {item.unit && <span className="text-sm text-muted font-normal ml-1">{item.unit}</span>}
                  </p>
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
                  await api.updateProfile({ auto_update: next } as any);
                } catch { /* silencieux */ }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoUpdate ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoUpdate ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <Button
            variant="secondary"
            className="w-full"
            leftIcon={<RotateCcw className="w-4 h-4" />}
            isLoading={isRecalculating}
            onClick={async () => {
              setIsRecalculating(true);
              try {
                await api.recalculateMetrics();
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
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}

// ============================================================================
// SYNC TAB
// ============================================================================

function SyncTab() {
  const { status: syncStatus, sync, isSyncing, fetchStatus } = useSyncStore();
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [modalService, setModalService] = useState<'strava' | 'garmin' | 'suunto' | null>(null);

  // Check if services are connected (have credentials stored)
  const { has_strava, has_garmin, has_suunto } = useAuthStore();
  const stravaConnected = has_strava || !!syncStatus?.strava?.configured || !!syncStatus?.strava_last_sync;
  const garminConnected = has_garmin || !!syncStatus?.garmin?.configured || !!syncStatus?.garmin_last_sync;
  const suuntoConnected = has_suunto || !!syncStatus?.suunto?.configured || !!syncStatus?.suunto_last_sync;
  const decathlonConnected = !!syncStatus?.decathlon?.configured || !!syncStatus?.decathlon_last_sync;

  // Gérer le retour du callback OAuth Decathlon (?decathlon=connected)
  const searchParams = useSearchParams();
  useEffect(() => {
    const decathlonStatus = searchParams.get('decathlon');
    if (decathlonStatus === 'connected') {
      toast.success('Decathlon connecté avec succès !');
      fetchStatus();
    } else if (decathlonStatus === 'error') {
      const reason = searchParams.get('reason');
      toast.error(`Erreur connexion Decathlon${reason ? ` (${reason})` : ''}`);
    }
  }, [searchParams, fetchStatus]);

  const handleConnect = async (service: 'strava' | 'garmin' | 'suunto' | 'decathlon', email: string, password: string) => {
    try {
      if (service === 'strava') await api.connectStrava(email, password);
      else if (service === 'garmin') await api.connectGarmin(email, password);
      else if (service === 'suunto') await api.connectSuunto(email, password);
      else if (service === 'decathlon') {
        const { url } = await api.getDecathlonUrl();
        window.location.href = url;
        return;
      }
      toast.success(`${service} connecté`);
      fetchStatus();
    } catch { toast.error(`Erreur connexion ${service}`); }
  };

  const handleDisconnect = async (service: 'strava' | 'garmin' | 'suunto' | 'decathlon') => {
    setDisconnecting(service);
    try {
      if (service === 'strava') await api.disconnectStrava();
      else if (service === 'garmin') await api.disconnectGarmin();
      else if (service === 'suunto') await api.disconnectSuunto();
      else if (service === 'decathlon') await api.disconnectDecathlon();
      toast.success(`${service} déconnecté`);
      fetchStatus();
    } catch { toast.error(`Erreur déconnexion ${service}`); }
    finally { setDisconnecting(null); }
  };

  const handleSync = async () => {
    const result = await sync();
    toast.success(result.success ? 'Synchronisé !' : 'Erreur');
  };

  const lastSync = (() => {
    const dates = [syncStatus?.strava_last_sync, syncStatus?.garmin_last_sync, syncStatus?.suunto_last_sync].filter(Boolean);
    return dates.length > 0 ? new Date(dates.sort().pop()!).toLocaleString('fr-FR') : 'Jamais';
  })();

  const isAnySyncing = syncStatus?.strava_status === 'syncing' || syncStatus?.garmin_status === 'syncing';

  return (
    <div className="space-y-6">
      {/* Sync Status */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <RefreshCw className={`w-5 h-5 ${isAnySyncing ? 'animate-spin text-primary' : 'text-muted'}`} />
            Synchronisation
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 mb-4">
            <div>
              <p className="font-medium">Dernière sync</p>
              <p className="text-sm text-muted">{lastSync}</p>
            </div>
            <Button onClick={handleSync} isLoading={isSyncing} disabled={!stravaConnected && !garminConnected && !suuntoConnected}>
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="space-y-3">
            <ServiceCard service="strava" isConnected={stravaConnected} lastSync={syncStatus?.strava_last_sync || null} onConnect={() => setModalService('strava')} onDisconnect={() => handleDisconnect('strava')} isDisconnecting={disconnecting === 'strava'} />
            <ServiceCard service="garmin" isConnected={garminConnected} lastSync={syncStatus?.garmin_last_sync || null} onConnect={() => setModalService('garmin')} onDisconnect={() => handleDisconnect('garmin')} isDisconnecting={disconnecting === 'garmin'} />
            <ServiceCard service="suunto" isConnected={suuntoConnected} lastSync={syncStatus?.suunto_last_sync || null} onConnect={() => setModalService('suunto')} onDisconnect={() => handleDisconnect('suunto')} isDisconnecting={disconnecting === 'suunto'} />
            <ServiceCard service="decathlon" isConnected={decathlonConnected} lastSync={syncStatus?.decathlon_last_sync || null} onConnect={() => handleConnect('decathlon', '', '')} onDisconnect={() => handleDisconnect('decathlon')} isDisconnecting={disconnecting === 'decathlon'} />
          </div>
        </GlassCardContent>
      </GlassCard>

      <CredentialModal isOpen={modalService === 'strava'} onClose={() => setModalService(null)} service="strava" onConnect={(e, p) => handleConnect('strava', e, p)} />
      <CredentialModal isOpen={modalService === 'garmin'} onClose={() => setModalService(null)} service="garmin" onConnect={(e, p) => handleConnect('garmin', e, p)} />
      <CredentialModal isOpen={modalService === 'suunto'} onClose={() => setModalService(null)} service="suunto" onConnect={(e, p) => handleConnect('suunto', e, p)} />
    </div>
  );
}

// ============================================================================
// SETTINGS TAB
// ============================================================================

function SettingsTab() {
  const { logout } = useAuthStore();
  const { t, language, setLanguage } = useLanguage();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [deletePassword, setDeletePassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Push notifications state
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isLoadingPush, setIsLoadingPush] = useState(false);
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);

  // Interface customization state
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [density, setDensity] = useState<'compact' | 'normal' | 'comfortable'>('normal');
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState<'setup' | 'verify' | 'disable'>('setup');

  // Load preferences and 2FA status from backend
  useEffect(() => {
    const loadPreferences = async () => {
      // Load 2FA status from profile
      try {
        const profile = await api.getProfile();
        setTwoFAEnabled(!!(profile as UserType).twofa_enabled);
      } catch {
        // Silently ignore — don't block UI
      }

      // 13.1 — Load interface preferences from backend
      try {
        const prefs = await api.getPreferences();
        if (prefs.theme) setTheme(prefs.theme as 'light' | 'dark' | 'auto');
        if (prefs.units) setUnits(prefs.units as 'metric' | 'imperial');
      } catch {
        // Silently ignore — don't block UI
      }
    };
    loadPreferences();
  }, []);

  // Check push notification permission on mount
  useEffect(() => {
    const checkPushStatus = async () => {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
      
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setPushEnabled(!!subscription);
        setPushSubscription(subscription);
      } catch {
        // Silently ignore
      }
    };
    checkPushStatus();
  }, []);

  // Enable push notifications
  const enablePushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('Les notifications push ne sont pas supportées par votre navigateur');
      return;
    }

    setIsLoadingPush(true);
    try {
      // Get VAPID public key
      const { publicKey } = await api.getVapidKey();
      
      if (!publicKey) {
        toast.error('Service de notifications non configuré');
        return;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Permission de notification refusée');
        return;
      }

      // Subscribe to push
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
      });

      // Send subscription to backend
      await api.subscribePush({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(subscription.getKey('auth')!),
        },
      });

      setPushEnabled(true);
      setPushSubscription(subscription);
      toast.success('Notifications push activées');
    } catch (error) {
      console.error('Push subscription error:', error);
      toast.error('Erreur lors de l\'activation des notifications');
    } finally {
      setIsLoadingPush(false);
    }
  };

  // Disable push notifications
  const disablePushNotifications = async () => {
    setIsLoadingPush(true);
    try {
      if (pushSubscription) {
        // Unsubscribe from push
        await pushSubscription.unsubscribe();
        
        // Notify backend
        await api.unsubscribePush(pushSubscription.endpoint);
      }

      setPushEnabled(false);
      setPushSubscription(null);
      toast.success('Notifications push désactivées');
    } catch (error) {
      console.error('Push unsubscription error:', error);
      toast.error('Erreur lors de la désactivation');
    } finally {
      setIsLoadingPush(false);
    }
  };

  // Helper: Convert base64 to Uint8Array for VAPID key
  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Helper: Convert ArrayBuffer to base64
  function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  const savePreferences = async () => {
    setIsSavingPreferences(true);
    try {
      await api.updatePreferences({
        theme,
        units,
        density,
        language
      });
      toast.success('Préférences sauvegardées');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde des préférences');
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
    // Apply theme immediately
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // Auto: respect system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    // 13.2 — Persist theme change to backend
    api.updatePreferences({ theme: newTheme }).catch(() => {
      // Silently ignore — don't block UI
    });
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage as 'fr' | 'en' | 'es' | 'de' | 'it' | 'pt');
  };

  // 13.2 — Persist units change to backend
  const handleUnitsChange = (newUnits: 'metric' | 'imperial') => {
    setUnits(newUnits);
    api.updatePreferences({ units: newUnits }).catch(() => {
      // Silently ignore — don't block UI
    });
  };

  const handleLogout = () => { logout(); window.location.href = '/login'; };

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new) { toast.error('Veuillez remplir tous les champs'); return; }
    if (passwords.new !== passwords.confirm) { toast.error('Les mots de passe ne correspondent pas'); return; }
    if (passwords.new.length < 6) { toast.error('6 caractères minimum'); return; }
    setIsChanging(true);
    try {
      await api.changePassword(passwords.current, passwords.new);
      toast.success('Mot de passe modifié');
      setShowPasswordModal(false);
      setPasswords({ current: '', new: '', confirm: '' });
    } catch { toast.error('Erreur'); }
    finally { setIsChanging(false); }
  };

  const handleDelete = async () => {
    if (!deletePassword) { toast.error('Mot de passe requis'); return; }
    setIsDeleting(true);
    try {
      await api.deleteAccount(deletePassword);
      toast.success('Compte supprimé');
      logout();
    } catch { toast.error('Erreur'); }
    finally { setIsDeleting(false); }
  };

  // Setup 2FA handler
  const handleSetup2FA = async () => {
    setIs2FALoading(true);
    try {
      const result = await api.setup2FA();
      setTwoFASecret(result.secret);
      setTwoFAStep('verify');
      setShow2FAModal(true);
    } catch { toast.error('Erreur lors de la configuration 2FA'); }
    finally { setIs2FALoading(false); }
  };

  // Enable 2FA handler
  const handleEnable2FA = async () => {
    if (!twoFACode) { toast.error('Code requis'); return; }
    setIs2FALoading(true);
    try {
      await api.enable2FA(twoFACode);
      setTwoFAEnabled(true);
      setShow2FAModal(false);
      setTwoFACode('');
      toast.success('2FA activée !');
    } catch { toast.error('Code invalide'); }
    finally { setIs2FALoading(false); }
  };

  // Disable 2FA handler
  const handleDisable2FA = async () => {
    if (!twoFACode) { toast.error('Code requis'); return; }
    setIs2FALoading(true);
    try {
      await api.disable2FA(twoFACode);
      setTwoFAEnabled(false);
      setShow2FAModal(false);
      setTwoFACode('');
      toast.success('2FA désactivée');
    } catch { toast.error('Code invalide'); }
    finally { setIs2FALoading(false); }
  };

  return (
    <div className="space-y-4">
      {/* Interface Customization */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-primary" />
            Personnalisation de l'interface
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-6">
          {/* Theme Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block">Thème</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  theme === 'light' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Sun className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                <p className="text-xs">Clair</p>
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  theme === 'dark' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Moon className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                <p className="text-xs">Sombre</p>
              </button>
              <button
                onClick={() => handleThemeChange('auto')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  theme === 'auto' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Monitor className="w-5 h-5 mx-auto mb-1 text-gray-500" />
                <p className="text-xs">Auto</p>
              </button>
            </div>
          </div>

          {/* Units Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block">Unités</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleUnitsChange('metric')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  units === 'metric' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="text-sm font-medium">Métrique</p>
                <p className="text-xs text-muted">km, kg, m</p>
              </button>
              <button
                onClick={() => handleUnitsChange('imperial')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  units === 'imperial' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="text-sm font-medium">Impérial</p>
                <p className="text-xs text-muted">mi, lbs, ft</p>
              </button>
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Langue
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleLanguageChange('fr')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  language === 'fr' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="text-sm font-medium">Français</p>
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  language === 'en' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="text-sm font-medium">English</p>
              </button>
            </div>
          </div>

          {/* Density Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Densité de l'interface
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setDensity('compact')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  density === 'compact' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="text-sm font-medium">Compact</p>
                <p className="text-xs text-muted">Moins d'espace</p>
              </button>
              <button
                onClick={() => setDensity('normal')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  density === 'normal' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="text-sm font-medium">Normal</p>
                <p className="text-xs text-muted">Équilibré</p>
              </button>
              <button
                onClick={() => setDensity('comfortable')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  density === 'comfortable' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="text-sm font-medium">Confort</p>
                <p className="text-xs text-muted">Plus d'espace</p>
              </button>
            </div>
          </div>

          <Button 
            onClick={savePreferences} 
            isLoading={isSavingPreferences}
            className="w-full"
          >
            Sauvegarder les préférences
          </Button>
        </GlassCardContent>
      </GlassCard>

      {/* Push Notifications */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifications push
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3">
              {pushEnabled ? (
                <Bell className="w-5 h-5 text-success" />
              ) : (
                <BellOff className="w-5 h-5 text-muted" />
              )}
              <div>
                <p className="font-medium">Notifications push</p>
                <p className="text-sm text-muted">
                  {pushEnabled 
                    ? 'Recevez des notifications sur cet appareil' 
                    : 'Activez pour recevoir des notifications'}
                </p>
              </div>
            </div>
            {pushEnabled ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-danger"
                onClick={disablePushNotifications}
                isLoading={isLoadingPush}
              >
                Désactiver
              </Button>
            ) : (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={enablePushNotifications}
                isLoading={isLoadingPush}
              >
                Activer
              </Button>
            )}
          </div>
          <p className="text-xs text-muted mt-3">
            Les notifications push vous alertent en temps réel des nouvelles demandes d&apos;ami, 
            draws et commentaires sur vos activités.
          </p>
        </GlassCardContent>
      </GlassCard>

      <GlassCard>
        <GlassCardContent className="space-y-3">
          {/* 2FA Section */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Authentification 2 facteurs</p>
                  <p className="text-sm text-muted">{twoFAEnabled ? 'Activée' : 'Désactivée'}</p>
                </div>
              </div>
              {twoFAEnabled ? (
                <Button variant="ghost" size="sm" className="text-danger" onClick={() => { setTwoFAStep('disable'); setTwoFACode(''); setShow2FAModal(true); }}>
                  Désactiver
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={handleSetup2FA} isLoading={is2FALoading}>
                  Configurer
                </Button>
              )}
            </div>
          </div>

          <Button variant="secondary" className="w-full justify-start" leftIcon={<Lock className="w-4 h-4" />} onClick={() => setShowPasswordModal(true)}>
            Changer le mot de passe
          </Button>
          <Button variant="secondary" className="w-full justify-start" leftIcon={<LogOut className="w-4 h-4" />} onClick={handleLogout}>
            Déconnexion
          </Button>
          <Button variant="ghost" className="w-full justify-start text-danger hover:bg-danger/10" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDeleteModal(true)}>
            Supprimer le compte
          </Button>
        </GlassCardContent>
      </GlassCard>

      {/* 2FA Modal */}
      <Modal isOpen={show2FAModal} onClose={() => { setShow2FAModal(false); setTwoFACode(''); }} title="Authentification 2 facteurs" size="sm">
        <div className="space-y-4">
          {twoFAStep === 'verify' && (
            <>
              <p className="text-sm text-muted">Scannez ce QR code avec votre application d&apos;authentification (Google Authenticator, Authy...).</p>
              <div className="p-4 bg-white rounded-lg text-center">
                <p className="text-xs text-neutral-500 break-all font-mono">{twoFASecret}</p>
                <p className="text-xs text-muted mt-2">Clé secrète (si vous ne pouvez pas scanner)</p>
              </div>
              <Input label="Code de vérification" type="text" inputMode="numeric" value={twoFACode} onChange={(e) => setTwoFACode(e.target.value)} placeholder="123456" leftIcon={<Shield className="w-4 h-4" />} />
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setShow2FAModal(false)} className="flex-1">Annuler</Button>
                <Button onClick={handleEnable2FA} isLoading={is2FALoading} className="flex-1">Activer</Button>
              </div>
            </>
          )}
          {twoFAStep === 'disable' && (
            <>
              <p className="text-sm text-muted">Entrez votre code 2FA pour désactiver l&apos;authentification à deux facteurs.</p>
              <Input label="Code 2FA" type="text" inputMode="numeric" value={twoFACode} onChange={(e) => setTwoFACode(e.target.value)} placeholder="123456" leftIcon={<Shield className="w-4 h-4" />} />
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setShow2FAModal(false)} className="flex-1">Annuler</Button>
                <Button variant="danger" onClick={handleDisable2FA} isLoading={is2FALoading} className="flex-1">Désactiver</Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Password Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Changer le mot de passe" size="sm">
        <div className="space-y-4">
          <Input label="Mot de passe actuel" type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} leftIcon={<Lock className="w-4 h-4" />} />
          <Input label="Nouveau mot de passe" type="password" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} leftIcon={<Lock className="w-4 h-4" />} />
          <Input label="Confirmer" type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} leftIcon={<Lock className="w-4 h-4" />} />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowPasswordModal(false)} className="flex-1">Annuler</Button>
            <Button onClick={handleChangePassword} isLoading={isChanging} className="flex-1">Enregistrer</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Supprimer le compte" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-danger/10 border border-danger/30">
            <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0" />
            <p className="text-sm text-muted">Action irréversible. Toutes vos données seront supprimées.</p>
          </div>
          <Input label="Confirmer mot de passe" type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} leftIcon={<Lock className="w-4 h-4" />} />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} className="flex-1">Annuler</Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting} className="flex-1">Supprimer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function ProfilePageContent() {
  const searchParams = useSearchParams();
  const isNewUser = searchParams.get('new') === 'true';
  const [activeTab, setActiveTab] = useState<'profile' | 'sync'>('profile');

  useEffect(() => {
    if (api.isAuthenticated()) {
      useSyncStore.getState().fetchStatus();
    }
  }, []);

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'sync', label: 'Sync', icon: RefreshCw },
  ] as const;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          Profil DrawRun
        </h1>
        <p className="text-muted mt-1">Gérez votre compte et vos données</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'text-muted hover:text-foreground hover:bg-muted'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'profile' && <ProfileTab isNewUser={isNewUser} />}
      {activeTab === 'sync' && <SyncTab />}
    </div>
  );
}

export default function ProfileContent() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <ProfilePageContent />
    </Suspense>
  );
}
