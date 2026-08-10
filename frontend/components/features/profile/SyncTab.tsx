'use client';

import { useState, useEffect } from 'react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent, Button, GradientBadge, Modal, Input } from '@/components/ui';
import { useAuthStore, useSyncStore } from '@/stores';
import { api } from '@/lib/api';
import { SuuntoConnect } from '@/components/features/auth';
import { Watch, CheckCircle, XCircle, Mail, Lock, Eye, EyeOff, RefreshCw } from '@/components/ui/icons';
import { toast } from 'sonner';

export function ServiceCard({
  service,
  isConnected,
  lastSync,
  onConnect,
  onDisconnect,
  isDisconnecting,
  children,
}: {
  service: 'garmin' | 'decathlon' | 'suunto';
  isConnected: boolean;
  lastSync: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  isDisconnecting: boolean;
  children?: React.ReactNode;
}) {
  const config = {
    garmin: { name: 'Garmin', color: 'blue', icon: Watch },
    decathlon: { name: 'Decathlon Coach', color: 'purple', icon: null },
    suunto: { name: 'Suunto', color: 'green', icon: null },
  };

  const c = config[service];
  const Icon = c.icon;

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${service === 'decathlon' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : service === 'suunto' ? 'bg-gradient-to-br from-green-500 to-emerald-500' : `bg-${c.color}-500/20`} flex items-center justify-center`}>
          {service === 'decathlon' ? (
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          ) : service === 'suunto' ? (
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v6h-2zm0 8h2v2h-2z" />
              <text x="12" y="16" fontSize="8" textAnchor="middle" fill="currentColor">S</text>
            </svg>
          ) : Icon && (
            <Icon className={`w-6 h-6 text-${c.color}-500`} />
          )}
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
      {children || (
        isConnected ? (
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
        )
      )}
    </div>
  );
}

export function CredentialModal({
  isOpen,
  onClose,
  service,
  onConnect
}: {
  isOpen: boolean;
  onClose: () => void;
  service: 'garmin' | 'decathlon' | 'suunto';
  onConnect: (_email: string, _password: string) => Promise<void>;
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
    garmin: 'Connecter Garmin',
    decathlon: 'Connecter Decathlon Coach',
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

export function SyncTab() {
  const { status: syncStatus, sync, isSyncing, fetchStatus } = useSyncStore();
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [showGarminModal, setShowGarminModal] = useState(false);
  const [showDecathlonModal, setShowDecathlonModal] = useState(false);

  const { has_garmin, has_decathlon, has_suunto } = useAuthStore();

  // Check both auth store flags and sync status
  const garminConnected = has_garmin || !!syncStatus?.garmin?.configured || !!syncStatus?.garmin_last_sync;
  const decathlonConnected = has_decathlon || !!syncStatus?.decathlon?.configured || !!syncStatus?.decathlon_last_sync;
  const suuntoConnected = has_suunto || !!syncStatus?.suunto?.configured || !!syncStatus?.suunto_last_sync;

  const handleConnect = async (email: string, password: string) => {
    try {
      await api.connectGarmin(email, password);
      toast.success('Garmin connecté');
      fetchStatus();
    } catch { toast.error('Erreur connexion Garmin'); }
  };

  const handleConnectDecathlon = async (email: string, password: string) => {
    try {
      await api.saveDecathlonCredentials(email, password);
      toast.success('Decathlon connecté');
      fetchStatus();
    } catch { toast.error('Erreur connexion Decathlon'); }
  };

  const handleDisconnect = async (service: string) => {
    setDisconnecting(service);
    try {
      if (service === 'garmin') {
        await api.disconnectGarmin();
        toast.success('Garmin déconnecté');
      } else if (service === 'decathlon') {
        await api.disconnectDecathlon();
        toast.success('Decathlon déconnecté');
      } else if (service === 'suunto') {
        await api.disconnectSuunto();
        toast.success('Suunto déconnecté');
      }
      fetchStatus();
    } catch {
      const serviceName = service === 'garmin' ? 'Garmin' : service === 'decathlon' ? 'Decathlon' : 'Suunto';
      toast.error(`Erreur déconnexion ${serviceName}`);
    } finally {
      setDisconnecting(null);
    }
  };

  const handleSync = async () => {
    const result = await sync();
    toast.success(result.success ? 'Synchronisé !' : 'Erreur');
  };

  // Determine last sync date from any connected service
  const lastSyncDate = syncStatus?.garmin_last_sync || syncStatus?.decathlon_last_sync || syncStatus?.suunto_last_sync;
  const lastSync = lastSyncDate ? new Date(lastSyncDate).toLocaleString('fr-FR') : 'Jamais';

  const isSyncingGarmin = syncStatus?.garmin_status === 'syncing';

  return (
    <div className="space-y-6">
      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <RefreshCw className={`w-5 h-5 ${isSyncingGarmin ? 'animate-spin text-primary' : 'text-muted'}`} />
            Synchronisation
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 mb-4">
            <div>
              <p className="font-medium">Dernière sync</p>
              <p className="text-sm text-muted">{lastSync}</p>
            </div>
            <Button onClick={handleSync} isLoading={isSyncing} disabled={!garminConnected && !decathlonConnected && !suuntoConnected}>
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="space-y-3">
            <ServiceCard
              service="garmin"
              isConnected={garminConnected}
              lastSync={syncStatus?.garmin_last_sync || null}
              onConnect={() => setShowGarminModal(true)}
              onDisconnect={() => handleDisconnect('garmin')}
              isDisconnecting={disconnecting === 'garmin'}
            />

            <ServiceCard
              service="decathlon"
              isConnected={decathlonConnected}
              lastSync={syncStatus?.decathlon_last_sync || null}
              onConnect={() => setShowDecathlonModal(true)}
              onDisconnect={() => handleDisconnect('decathlon')}
              isDisconnecting={disconnecting === 'decathlon'}
            />

            <ServiceCard
              service="suunto"
              isConnected={suuntoConnected}
              lastSync={syncStatus?.suunto_last_sync || null}
              onConnect={() => {}}
              onDisconnect={() => handleDisconnect('suunto')}
              isDisconnecting={disconnecting === 'suunto'}
            >
              <SuuntoConnect
                onSuccess={() => { fetchStatus(); }}
                onError={(err) => toast.error(err)}
              />
            </ServiceCard>
          </div>
        </GlassCardContent>
      </GlassCard>

      <CredentialModal isOpen={showGarminModal} onClose={() => setShowGarminModal(false)} service="garmin" onConnect={handleConnect} />
      <CredentialModal isOpen={showDecathlonModal} onClose={() => setShowDecathlonModal(false)} service="decathlon" onConnect={handleConnectDecathlon} />
    </div>
  );
}
