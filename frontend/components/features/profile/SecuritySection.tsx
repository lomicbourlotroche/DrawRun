'use client';

import { useState, useEffect } from 'react';
import { GlassCard, GlassCardContent, Button, Input, Modal } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { api } from '@/lib/api';
import { Shield, LogOut, Trash2, AlertTriangle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import type { User as UserType } from '@/types';

export function SecuritySection() {
  const { logout } = useAuthStore();
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState<'setup' | 'verify' | 'disable'>('setup');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [isChanging, setIsChanging] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await api.getProfile();
        setTwoFAEnabled(!!(profile as UserType).twofa_enabled);
      } catch { /* silencieux */ }
    };
    load();
  }, []);

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

  const handleLogout = () => { logout(); window.location.href = '/login'; };

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

  return (
    <>
      <GlassCard>
        <GlassCardContent className="space-y-3">
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

      <Modal isOpen={show2FAModal} onClose={() => { setShow2FAModal(false); setTwoFACode(''); }} title="Authentification 2 facteurs" size="sm">
        <div className="space-y-4">
          {twoFAStep === 'verify' && (
            <>
              <p className="text-sm text-muted">Scannez ce QR code avec votre application d&apos;authentification (Google Authenticator, Authy...).</p>
              <div className="p-4 bg-white rounded-lg text-center">
                <p className="text-xs text-muted break-all font-mono">{twoFASecret}</p>
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
    </>
  );
}
