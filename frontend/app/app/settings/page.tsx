/* eslint-disable unused-imports/no-unused-vars, no-undef, @next/next/no-img-element, react/no-unescaped-entities */
/**
 * Settings Page - Page dédiée des paramètres
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent, Button, Input, Modal } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { api } from '@/lib/api';
import { useLanguage } from '@/components/providers/LanguageProvider';
import type { User as UserType } from '@/types';
import {
  LogOut, Trash2, AlertTriangle, Lock, Eye, EyeOff, Shield, Monitor, Moon, Sun,
  Globe, Layout, Bell, BellOff, Settings, ChevronLeft
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { language, setLanguage } = useLanguage();
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

      // Load interface preferences from backend
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
    // Persist theme change to backend
    api.updatePreferences({ theme: newTheme }).catch(() => {
      // Silently ignore — don't block UI
    });
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage as 'fr' | 'en' | 'es' | 'de' | 'it' | 'pt');
  };

  // Persist units change to backend
  const handleUnitsChange = (newUnits: 'metric' | 'imperial') => {
    setUnits(newUnits);
    api.updatePreferences({ units: newUnits }).catch(() => {
      // Silently ignore — don't block UI
    });
  };

  const handleLogout = () => { logout(); router.push('/login'); };

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
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/app/profile"
          className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Retour au profil
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Paramètres
        </h1>
        <p className="text-muted mt-1">Configurez votre compte et vos préférences</p>
      </div>

      {/* Interface Customization */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-primary" />
            Personnalisation de l&apos;interface
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
              Densité de l&apos;interface
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
              </button>
              <button
                onClick={() => setDensity('comfortable')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  density === 'comfortable'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="text-sm font-medium">Confortable</p>
              </button>
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Push Notifications */}
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent className="space-y-4">
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

      {/* Security */}
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
