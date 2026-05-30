'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Activity, ArrowLeft, Eye, EyeOff, Zap, TrendingUp, Heart, Target } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

const features = [
  { icon: Zap, title: 'Analyse Scientifique', desc: 'TSS, CTL, ATL, TSB, PMC' },
  { icon: Heart, title: 'Physiologique', desc: 'VDOT, VMA, FCM, VO2max' },
  { icon: TrendingUp, title: 'Suivi Performance', desc: 'Charge, forme, fatigue' },
  { icon: Target, title: 'Plans Adaptatifs', desc: 'Entraînement personnalisé' },
];

function InputField({ label, type, value, onChange, placeholder, icon: Icon, error }: {
  label: string; type: string; value: string; onChange: (_: string) => void;
  placeholder?: string; icon?: React.ElementType; error?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2.5 ${Icon ? 'pl-10' : ''} rounded-xl border border-border bg-surface text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all ${error ? 'border-danger' : ''}`}
        />
      </div>
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}

function PasswordField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (_: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 pr-10 rounded-xl border border-border bg-surface text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function FeaturePanel() {
  return (
    <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-neutral-900 to-neutral-800 p-12 flex-col justify-between">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(77,151,247,0.15),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(77,151,247,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">DR</span>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">DrawRun</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium mb-8">
          <Zap className="w-3 h-3" /> Science Engine
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight leading-tight mb-3">
          Dominez vos limites
        </h2>
        <p className="text-white/60 text-sm leading-relaxed max-w-md">
          Analyse scientifique, plans adaptatifs et suivi de performance pour dépasser vos objectifs.
        </p>
      </div>
      <div className="relative z-10 space-y-5">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{title}</p>
              <p className="text-xs text-white/50">{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="relative z-10 flex gap-6 pt-8 border-t border-white/10 mt-8">
        {[{ value: '15+', label: 'Métriques' }, { value: '2500+', label: 'Athlètes' }, { value: '99%', label: 'Précision' }].map((s) => (
          <div key={s.label}>
            <p className="text-lg font-bold text-white tabular-nums">{s.value}</p>
            <p className="text-xs text-white/50">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LoginForm() {
  const { login, register } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const getMode = (): AuthMode => {
    const m = searchParams.get('mode');
    if (m === 'register') return 'register';
    if (m === 'forgot') return 'forgot';
    if (m === 'reset') return 'reset';
    return 'login';
  };

  const [mode, setMode] = useState<AuthMode>(getMode());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const m = getMode();
    setMode(m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const isLoading = false; // will be managed by store

  const handleLoginRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email) { setError('Email requis'); return; }
    if (!password) { setError('Mot de passe requis'); return; }
    if (mode === 'register') {
      if (!name) { setError('Nom requis'); return; }
      if (password.length < 6) { setError('6 caractères minimum'); return; }
      if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }
      try {
        await register(email, password, name);
        setSuccessMessage('Compte créé !');
        setTimeout(() => router.push('/app'), 500);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erreur');
      }
      return;
    }

    try {
      const result = await login(email, password, totpCode || undefined);
      if (result.requires2FA) {
        setRequires2FA(true);
        return;
      }
      router.push('/app');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Email requis'); return; }
    try {
      setSuccessMessage('Code de réinitialisation envoyé !');
    } catch { setError('Erreur'); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otpCode || !password) { setError('Tous les champs requis'); return; }
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return; }
    try {
      setSuccessMessage('Mot de passe réinitialisé !');
      setTimeout(() => router.push('/login'), 2000);
    } catch { setError('Erreur'); }
  };

  const switchMode = () => {
    const next = mode === 'login' ? 'register' : 'login';
    setMode(next);
    setError('');
    setSuccessMessage('');
    setRequires2FA(false);
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'register') params.set('mode', 'register');
    else params.delete('mode');
    router.replace(`/login${params.toString() ? '?' + params.toString() : ''}`);
  };

  const isLogin = mode === 'login';

  return (
    <div className="min-h-screen w-full flex">
      <FeaturePanel />

      <div className="flex-1 lg:max-w-[480px] bg-bg relative">
        {/* Back link */}
        {(mode === 'forgot' || mode === 'reset') && (
          <Link
            href="/login"
            onClick={() => setMode('login')}
            className="absolute top-5 left-5 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-muted hover:text-foreground bg-surface hover:border-border transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
        )}

        <div className="flex flex-col justify-center min-h-screen px-6 py-12 max-w-sm mx-auto">
          {/* Mobile brand */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center mb-3">
              <span className="text-white font-bold text-xl">DR</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">DrawRun</h1>
            <p className="text-sm text-muted mt-1">Votre coach sportif intelligent</p>
          </div>

          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            {mode === 'login' && 'Connexion'}
            {mode === 'register' && 'Créer un compte'}
            {mode === 'forgot' && 'Mot de passe oublié'}
            {mode === 'reset' && 'Réinitialiser'}
          </h2>
          <p className="text-sm text-muted mt-1.5 mb-6">
            {mode === 'login' && 'Accédez à votre tableau de bord'}
            {mode === 'register' && 'Rejoignez la communauté DrawRun'}
            {mode === 'forgot' && 'Entrez votre email pour recevoir un code'}
            {mode === 'reset' && 'Entrez le code et votre nouveau mot de passe'}
          </p>

          {error && (
            <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger mb-4">{error}</div>
          )}
          {successMessage && (
            <div className="p-3 rounded-xl bg-success/10 border border-success/20 text-sm text-success mb-4">{successMessage}</div>
          )}

          <form onSubmit={mode === 'forgot' ? handleForgotPassword : mode === 'reset' ? handleResetPassword : handleLoginRegister} className="space-y-4">
            {requires2FA && (
              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-3">
                <p className="text-sm font-medium">Code 2FA</p>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  placeholder="000000"
                  className="w-full text-center text-2xl font-bold tracking-[0.5em] px-4 py-3 rounded-xl border border-primary/30 bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                  maxLength={6}
                />
              </div>
            )}

            {!requires2FA && (
              <>
                {mode === 'register' && (
                  <InputField label="Nom" type="text" value={name} onChange={setName} placeholder="Jean Dupont" icon={Activity} />
                )}
                {mode === 'reset' && (
                  <InputField label="Code de réinitialisation" type="text" value={otpCode} onChange={setOtpCode} placeholder="123456" />
                )}
                <InputField label="Email" type="email" value={email} onChange={setEmail} placeholder="email@example.com" icon={Activity} />
                {mode !== 'forgot' && (
                  <PasswordField label="Mot de passe" value={password} onChange={setPassword} placeholder="••••••••" />
                )}
                {mode === 'register' && (
                  <PasswordField label="Confirmer le mot de passe" value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••••" />
                )}
                {mode === 'reset' && (
                  <>
                    <PasswordField label="Nouveau mot de passe" value={password} onChange={setPassword} placeholder="••••••••" />
                    <PasswordField label="Confirmer" value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••••" />
                  </>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-primary-500 text-white font-semibold text-sm hover:bg-primary-600 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isLoading ? 'Chargement...' : isLogin ? 'Se connecter' : mode === 'register' ? 'Créer mon compte' : mode === 'forgot' ? 'Envoyer' : 'Réinitialiser'}
            </button>

            {mode === 'login' && (
              <Link href="/login?mode=forgot" onClick={() => setMode('forgot')} className="block text-center text-sm text-primary hover:underline">
                Mot de passe oublié ?
              </Link>
            )}
          </form>

          <div className="mt-6 text-center">
            <button onClick={switchMode} className="text-sm text-primary hover:underline font-medium">
              {isLogin ? 'Créer un compte' : 'Déjà un compte ? Se connecter'}
            </button>
          </div>

          <div className="mt-8 flex justify-center gap-4 text-[11px] text-muted">
            <span>🔒 Sécurisé SSL</span>
            <span>🇫🇷 Hébergé en France</span>
            <span>🎯 Gratuit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
