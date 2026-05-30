/* eslint-disable @next/next/no-img-element */
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent, Button, Input, Modal } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { api } from '@/lib/api';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useTheme } from '@/components/providers/ThemeProvider';
import type { User as UserType } from '@/types';
import { LogOut, Trash2, AlertTriangle, Lock, Shield, Monitor, Moon, Sun, Globe, Layout, Bell, BellOff, Settings, ChevronLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { language, setLanguage } = useLanguage();
  const { theme: themeCtx, setTheme: setThemeCtx } = useTheme();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [deletePassword, setDeletePassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isLoadingPush, setIsLoadingPush] = useState(false);
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);
  const [theme, setThemeLocal] = useState<'light' | 'dark' | 'auto'>(themeCtx === 'dark' ? 'dark' : 'light');
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [density, setDensity] = useState<'compact' | 'normal' | 'comfortable'>('normal');
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFAQrUri, setTwoFAQrUri] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState<'setup' | 'verify' | 'disable'>('setup');

  const loadPreferences = useCallback(async () => {
    try { const profile = await api.getProfile(); setTwoFAEnabled(!!(profile as UserType).twofa_enabled); } catch { /* silent */ }
    try {
      const prefs = await api.getPreferences();
      if (prefs.theme) { const t = prefs.theme as 'light' | 'dark' | 'auto'; setThemeLocal(t); if (t !== 'auto') setThemeCtx(t); else { const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches; setThemeCtx(isDark ? 'dark' : 'light'); } }
      if (prefs.units) setUnits(prefs.units as 'metric' | 'imperial');
      if ((prefs as Record<string, unknown>).language) setLanguage((prefs as Record<string, unknown>).language as 'fr' | 'en');
      if ((prefs as Record<string, unknown>).density) setDensity((prefs as Record<string, unknown>).density as 'compact' | 'normal' | 'comfortable');
    } catch { /* silent */ }
  }, [setThemeCtx, setLanguage]);

  useEffect(() => { loadPreferences(); }, [loadPreferences]);

  useEffect(() => {
    const check = async () => {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
      try { const reg = await navigator.serviceWorker.ready; const sub = await reg.pushManager.getSubscription(); setPushEnabled(!!sub); setPushSubscription(sub); } catch { /* silent */ }
    };
    check();
  }, []);

  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }
  function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer); let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return window.btoa(binary);
  }

  const enablePushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) { toast.error('Non supporté par votre navigateur'); return; }
    setIsLoadingPush(true);
    try {
      const { publicKey } = await api.getVapidKey();
      if (!publicKey) { toast.error('Service non configuré'); return; }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { toast.error('Permission refusée'); return; }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource });
      await api.subscribePush({ endpoint: subscription.endpoint, keys: { p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!), auth: arrayBufferToBase64(subscription.getKey('auth')!) } });
      setPushEnabled(true); setPushSubscription(subscription); toast.success('Notifications activées');
    } catch { toast.error('Erreur lors de l\'activation'); } finally { setIsLoadingPush(false); }
  };

  const disablePushNotifications = async () => {
    setIsLoadingPush(true);
    try {
      if (pushSubscription) { await pushSubscription.unsubscribe(); await api.unsubscribePush(pushSubscription.endpoint); }
      setPushEnabled(false); setPushSubscription(null); toast.success('Notifications désactivées');
    } catch { toast.error('Erreur'); } finally { setIsLoadingPush(false); }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setThemeLocal(newTheme);
    if (newTheme === 'auto') { const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches; setThemeCtx(isDark ? 'dark' : 'light'); } else { setThemeCtx(newTheme); }
    api.updatePreferences({ theme: newTheme }).catch(() => {});
  };
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage as 'fr' | 'en');
    api.updatePreferences({ language: newLanguage } as Parameters<typeof api.updatePreferences>[0]).catch(() => {});
  };
  const handleUnitsChange = (newUnits: 'metric' | 'imperial') => {
    setUnits(newUnits); api.updatePreferences({ units: newUnits }).catch(() => {});
  };
  const handleDensityChange = (newDensity: 'compact' | 'normal' | 'comfortable') => {
    setDensity(newDensity); document.documentElement.setAttribute('data-density', newDensity);
    api.updatePreferences({ density: newDensity } as Parameters<typeof api.updatePreferences>[0]).catch(() => {});
  };
  const handleLogout = () => { logout(); router.push('/login'); };
  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new) { toast.error('Remplissez tous les champs'); return; }
    if (passwords.new !== passwords.confirm) { toast.error('Les mots de passe ne correspondent pas'); return; }
    if (passwords.new.length < 6) { toast.error('6 caractères minimum'); return; }
    setIsChanging(true);
    try { await api.changePassword(passwords.current, passwords.new); toast.success('Mot de passe modifié'); setShowPasswordModal(false); setPasswords({ current: '', new: '', confirm: '' }); }
    catch { toast.error('Erreur'); } finally { setIsChanging(false); }
  };
  const handleDelete = async () => {
    if (!deletePassword) { toast.error('Mot de passe requis'); return; }
    setIsDeleting(true);
    try { await api.deleteAccount(deletePassword); toast.success('Compte supprimé'); logout(); }
    catch { toast.error('Erreur'); } finally { setIsDeleting(false); }
  };
  const handleSetup2FA = async () => {
    setIs2FALoading(true);
    try { const result = await api.setup2FA(); setTwoFASecret(result.secret); setTwoFAQrUri(result.uri || ''); setTwoFAStep('verify'); setShow2FAModal(true); }
    catch { toast.error('Erreur 2FA'); } finally { setIs2FALoading(false); }
  };
  const handleEnable2FA = async () => {
    if (!twoFACode) { toast.error('Code requis'); return; }
    setIs2FALoading(true);
    try { await api.enable2FA(twoFACode); setTwoFAEnabled(true); setShow2FAModal(false); setTwoFACode(''); toast.success('2FA activée !'); }
    catch { toast.error('Code invalide'); } finally { setIs2FALoading(false); }
  };
  const handleDisable2FA = async () => {
    if (!twoFACode) { toast.error('Code requis'); return; }
    setIs2FALoading(true);
    try { await api.disable2FA(twoFACode); setTwoFAEnabled(false); setShow2FAModal(false); setTwoFACode(''); toast.success('2FA désactivée'); }
    catch { toast.error('Code invalide'); } finally { setIs2FALoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto pb-8">
      <div className="flex items-center gap-3 pt-2">
        <Link href="/app/profile" className="flex items-center gap-2 text-sm text-neutral-500 hover:text-foreground transition-colors duration-200 ease-smooth">
          <ChevronLeft className="w-4 h-4" />Retour au profil
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight"><Settings className="w-6 h-6 text-primary-500" />Paramètres</h1>
        <p className="text-muted-foreground mt-1.5">Configurez votre compte et vos préférences</p>
      </div>

      <GlassCard>
        <GlassCardHeader><GlassCardTitle className="flex items-center gap-2"><Monitor className="w-5 h-5 text-primary" />Apparence</GlassCardTitle></GlassCardHeader>
        <GlassCardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-3 block text-foreground">Thème</label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { id: 'light', label: 'Clair',  Icon: Sun,     ic: 'text-peak/80', pb: 'bg-surface', pbd: 'border-surface' },
                { id: 'dark',  label: 'Sombre', Icon: Moon,    ic: 'text-primary/80',   pb: 'bg-[var(--bg)]', pbd: 'border-[var(--border)]' },
                { id: 'auto',  label: 'Auto',   Icon: Monitor, ic: 'text-muted',      pb: 'bg-gradient-to-br from-white to-[var(--bg)]', pbd: 'border-border' },
              ] as const).map(t => (
                <button key={t.id} onClick={() => handleThemeChange(t.id)} className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${theme === t.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}>
                  {theme === t.id && <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center"><Check className="w-2.5 h-2.5 text-foreground" /></div>}
                  <div className={`w-full h-8 rounded-md border ${t.pb} ${t.pbd} mb-1`} />
                  <t.Icon className={`w-4 h-4 ${t.ic}`} />
                  <p className="text-xs font-medium">{t.label}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-3 block text-foreground">Unités de mesure</label>
            <div className="grid grid-cols-2 gap-3">
              {([{ id: 'metric', label: 'Métrique', sub: 'km · kg · m' }, { id: 'imperial', label: 'Impérial', sub: 'mi · lbs · ft' }] as const).map(u => (
                <button key={u.id} onClick={() => handleUnitsChange(u.id)} className={`p-4 rounded-xl border-2 transition-all text-left ${units === u.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}>
                  <div className="flex items-center justify-between"><div><p className="text-sm font-medium">{u.label}</p><p className="text-xs text-muted mt-0.5">{u.sub}</p></div>{units === u.id && <Check className="w-4 h-4 text-primary" />}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-3 block text-foreground flex items-center gap-2"><Globe className="w-4 h-4 text-muted" />Langue</label>
            <div className="grid grid-cols-2 gap-3">
              {([{ id: 'fr', label: 'Français', flag: '🇫🇷' }, { id: 'en', label: 'English', flag: '🇬🇧' }] as const).map(l => (
                <button key={l.id} onClick={() => handleLanguageChange(l.id)} className={`p-4 rounded-xl border-2 transition-all text-left ${language === l.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}>
                  <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-lg">{l.flag}</span><p className="text-sm font-medium">{l.label}</p></div>{language === l.id && <Check className="w-4 h-4 text-primary" />}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-3 block text-foreground flex items-center gap-2"><Layout className="w-4 h-4 text-muted" />Densité de l&apos;interface</label>
            <div className="grid grid-cols-3 gap-3">
              {([{ id: 'compact', label: 'Compact', sub: "Plus d'infos" }, { id: 'normal', label: 'Normal', sub: 'Équilibré' }, { id: 'comfortable', label: 'Aéré', sub: "Plus d'espace" }] as const).map(d => (
                <button key={d.id} onClick={() => handleDensityChange(d.id)} className={`p-3 rounded-xl border-2 transition-all text-center ${density === d.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}>
                  <p className="text-sm font-medium">{d.label}</p><p className="text-xs text-muted mt-0.5">{d.sub}</p>
                </button>
              ))}
            </div>
          </div>
        </GlassCardContent>
      </GlassCard>

      <GlassCard>
        <GlassCardHeader><GlassCardTitle className="flex items-center gap-2"><Bell className="w-5 h-5 text-primary" />Notifications</GlassCardTitle></GlassCardHeader>
        <GlassCardContent>
          <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${pushEnabled ? 'bg-success/10' : 'bg-border'}`}>{pushEnabled ? <Bell className="w-5 h-5 text-success" /> : <BellOff className="w-5 h-5 text-muted" />}</div>
              <div><p className="font-medium text-sm">Notifications push</p><p className="text-xs text-muted">{pushEnabled ? 'Actives sur cet appareil' : 'Désactivées'}</p></div>
            </div>
            <button onClick={pushEnabled ? disablePushNotifications : enablePushNotifications} disabled={isLoadingPush} className={`w-12 h-6 rounded-full transition-all relative disabled:opacity-50 ${pushEnabled ? 'bg-success' : 'bg-border'}`}>
              <div className={`absolute top-1 w-4 h-4 bg-surface rounded-full shadow transition-all ${pushEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          <p className="text-xs text-muted mt-3">Recevez des alertes en temps réel pour les demandes d&apos;ami, draws et commentaires.</p>
        </GlassCardContent>
      </GlassCard>

      <GlassCard>
        <GlassCardHeader><GlassCardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-primary" />Sécurité</GlassCardTitle></GlassCardHeader>
        <GlassCardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${twoFAEnabled ? 'bg-success/10' : 'bg-border'}`}><Shield className={`w-5 h-5 ${twoFAEnabled ? 'text-success' : 'text-muted'}`} /></div>
              <div><p className="font-medium text-sm">Authentification 2 facteurs</p><p className="text-xs text-muted">{twoFAEnabled ? '✓ Activée' : 'Désactivée'}</p></div>
            </div>
            {twoFAEnabled ? <Button variant="ghost" size="sm" className="text-danger text-xs" onClick={() => { setTwoFAStep('disable'); setTwoFACode(''); setShow2FAModal(true); }}>Désactiver</Button>
              : <Button variant="secondary" size="sm" onClick={handleSetup2FA} isLoading={is2FALoading}>Configurer</Button>}
          </div>
          <button onClick={() => setShowPasswordModal(true)} className="w-full flex items-center gap-3 p-4 rounded-xl bg-background border border-border hover:border-primary/40 transition-all text-left">
            <div className="p-2 rounded-xl bg-border"><Lock className="w-5 h-5 text-muted" /></div>
            <div className="flex-1"><p className="font-medium text-sm">Changer le mot de passe</p><p className="text-xs text-muted">Modifier votre mot de passe de connexion</p></div>
            <ChevronLeft className="w-4 h-4 text-muted rotate-180" />
          </button>
        </GlassCardContent>
      </GlassCard>

      <GlassCard>
        <GlassCardHeader><GlassCardTitle>Compte</GlassCardTitle></GlassCardHeader>
        <GlassCardContent className="space-y-3">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-4 rounded-xl bg-background border border-border hover:border-primary/40 transition-all text-left">
            <div className="p-2 rounded-xl bg-border"><LogOut className="w-5 h-5 text-muted" /></div>
            <p className="font-medium text-sm">Déconnexion</p>
          </button>
          <button onClick={() => setShowDeleteModal(true)} className="w-full flex items-center gap-3 p-4 rounded-xl bg-danger/5 border border-danger/20 hover:border-danger/40 transition-all text-left">
            <div className="p-2 rounded-xl bg-danger/10"><Trash2 className="w-5 h-5 text-danger" /></div>
            <div><p className="font-medium text-sm text-danger">Supprimer le compte</p><p className="text-xs text-muted">Action irréversible</p></div>
          </button>
        </GlassCardContent>
      </GlassCard>

      <Modal isOpen={show2FAModal} onClose={() => { setShow2FAModal(false); setTwoFACode(''); }} title="Authentification 2 facteurs" size="sm">
        <div className="space-y-4">
          {twoFAStep === 'verify' && (<>
            <p className="text-sm text-muted">Scannez ce QR code avec Google Authenticator ou Authy.</p>
            {twoFAQrUri && <div className="p-4 bg-surface rounded-xl text-center"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(twoFAQrUri)}`} alt="QR 2FA" className="mx-auto w-44 h-44" /></div>}
            <div className="p-3 rounded-xl bg-background border border-border"><p className="text-xs text-muted mb-1">Clé secrète</p><p className="text-xs font-mono text-foreground break-all">{twoFASecret}</p></div>
            <Input label="Code (6 chiffres)" type="text" inputMode="numeric" maxLength={6} value={twoFACode} onChange={e => setTwoFACode(e.target.value.replace(/\D/g, ''))} placeholder="123456" leftIcon={<Shield className="w-4 h-4" />} />
            <div className="flex gap-3"><Button variant="secondary" onClick={() => setShow2FAModal(false)} className="flex-1">Annuler</Button><Button onClick={handleEnable2FA} isLoading={is2FALoading} disabled={twoFACode.length !== 6} className="flex-1">Activer</Button></div>
          </>)}
          {twoFAStep === 'disable' && (<>
            <p className="text-sm text-muted">Entrez votre code 2FA pour désactiver.</p>
            <Input label="Code 2FA" type="text" inputMode="numeric" maxLength={6} value={twoFACode} onChange={e => setTwoFACode(e.target.value.replace(/\D/g, ''))} placeholder="123456" leftIcon={<Shield className="w-4 h-4" />} />
            <div className="flex gap-3"><Button variant="secondary" onClick={() => setShow2FAModal(false)} className="flex-1">Annuler</Button><Button variant="danger" onClick={handleDisable2FA} isLoading={is2FALoading} disabled={twoFACode.length !== 6} className="flex-1">Désactiver</Button></div>
          </>)}
        </div>
      </Modal>

      <Modal isOpen={showPasswordModal} onClose={() => { setShowPasswordModal(false); setPasswords({ current: '', new: '', confirm: '' }); }} title="Changer le mot de passe" size="sm">
        <div className="space-y-4">
          <Input label="Mot de passe actuel" type="password" value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} leftIcon={<Lock className="w-4 h-4" />} />
          <Input label="Nouveau mot de passe" type="password" value={passwords.new} onChange={e => setPasswords({ ...passwords, new: e.target.value })} leftIcon={<Lock className="w-4 h-4" />} />
          <Input label="Confirmer" type="password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} leftIcon={<Lock className="w-4 h-4" />} />
          {passwords.new && passwords.confirm && passwords.new !== passwords.confirm && <p className="text-xs text-danger flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Les mots de passe ne correspondent pas</p>}
          <div className="flex gap-3"><Button variant="secondary" onClick={() => setShowPasswordModal(false)} className="flex-1">Annuler</Button><Button onClick={handleChangePassword} isLoading={isChanging} disabled={!passwords.current || !passwords.new || passwords.new !== passwords.confirm} className="flex-1">Enregistrer</Button></div>
        </div>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Supprimer le compte" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-danger/10 border border-danger/30"><AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" /><div><p className="text-sm font-medium text-danger">Action irréversible</p><p className="text-xs text-muted mt-1">Toutes vos données seront définitivement supprimées.</p></div></div>
          <Input label="Confirmez votre mot de passe" type="password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} leftIcon={<Lock className="w-4 h-4" />} />
          <div className="flex gap-3"><Button variant="secondary" onClick={() => setShowDeleteModal(false)} className="flex-1">Annuler</Button><Button variant="danger" onClick={handleDelete} isLoading={isDeleting} disabled={!deletePassword} className="flex-1">Supprimer définitivement</Button></div>
        </div>
      </Modal>
    </div>
  );
}


