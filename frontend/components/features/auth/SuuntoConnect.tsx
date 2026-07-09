'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores';
import { api } from '@/lib/api';
import { Button, Modal, Input } from '@/components/ui';
import { Watch, CheckCircle, XCircle, Mail, Lock, Eye, EyeOff, Loader2 } from '@/components/ui/icons';
import { toast } from 'sonner';

export type SuuntoStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';

interface SuuntoConnectProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

// SVG icon for Suunto (simplified logo)
function SuuntoIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v6h-2zm0 8h2v2h-2z" />
      <text x="12" y="16" fontSize="8" textAnchor="middle" fill="currentColor">
        S
      </text>
    </svg>
  );
}

export function SuuntoConnect({ onSuccess, onError }: SuuntoConnectProps) {
  const [status, setStatus] = useState<SuuntoStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { user } = useAuthStore();

  // Check if already connected on mount
  useEffect(() => {
    if (user?.has_suunto) {
      setStatus('connected');
    }
  }, [user]);

  const handleConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!email || !password) {
      toast.error('Veuillez entrer votre email et mot de passe Suunto');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      await api.connectSuunto(email, password);

      setStatus('connected');
      setShowModal(false);
      setEmail('');
      setPassword('');
      setShowPassword(false);

      toast.success('Suunto connecté !');
      onSuccess?.();
    } catch (err) {
      setStatus('error');
      const message = err instanceof Error ? err.message : 'Échec de la connexion à Suunto';
      setErrorMessage(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setStatus('connecting');
      setErrorMessage(null);

      await api.disconnectSuunto();

      setStatus('idle');
      toast.success('Suunto déconnecté');
      onSuccess?.();
    } catch (err) {
      setStatus('error');
      const message = err instanceof Error ? err.message : 'Échec de la déconnexion de Suunto';
      setErrorMessage(message);
      onError?.(message);
    }
  };

  const renderButton = () => {
    switch (status) {
      case 'connected':
        return (
          <Button
            variant="outline"
            size="lg"
            onClick={handleDisconnect}
            disabled={isLoading}
            className="w-full max-w-xs flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5 text-danger" />
            Déconnecter Suunto
          </Button>
        );
      case 'connecting':
        return (
          <Button
            variant="secondary"
            size="lg"
            disabled
            className="w-full max-w-xs flex items-center justify-center gap-2"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            Connexion en cours...
          </Button>
        );
      default:
        return (
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setShowModal(true)}
            disabled={isLoading}
            className="w-full max-w-xs flex items-center justify-center gap-2"
          >
            <SuuntoIcon className="w-5 h-5" />
            Connecter Suunto
          </Button>
        );
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {renderButton()}

      {status === 'connected' && <p className="text-xs text-success text-center">✓ Compte Suunto connecté</p>}

      {errorMessage && status !== 'connected' && <p className="text-xs text-danger text-center">{errorMessage}</p>}

      <p className="text-xs text-muted text-center max-w-xs">
        Connectez votre compte Suunto pour synchroniser vos activités
      </p>

      {/* Credential Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Connecter Suunto" size="sm">
        <form onSubmit={handleConnect} className="space-y-4">
          <p className="text-sm text-muted">Entrez vos identifiants Suunto App pour synchroniser vos activités.</p>

          <Input
            label="Email"
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            autoComplete="username"
          />

          <div className="relative">
            <Input
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" isLoading={isLoading} className="flex-1">
              Connecter
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default SuuntoConnect;
