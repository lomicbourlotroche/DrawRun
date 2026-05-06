/* eslint-disable react-hooks/exhaustive-deps, no-undef */
'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Activity, ArrowLeft, Eye, EyeOff, Zap, TrendingUp, Heart, Target } from 'lucide-react';
import { api } from '@/lib/api';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

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
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMode(getMode());
    setError('');
    setSuccessMessage('');
  }, [searchParams]);

  const isLogin = mode === 'login';

  // ── Login / Register ──────────────────────────────────────────────────────
  const handleLoginRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      router.push('/app');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Forgot password ───────────────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await api.forgotPassword(email);
      setSuccessMessage('Code envoyé ! Vérifiez votre email.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Reset password ────────────────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setIsLoading(true);
    try {
      await api.resetPassword(email, otpCode, password);
      setSuccessMessage('Mot de passe réinitialisé !');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setSuccessMessage('');
    setEmail('');
    setPassword('');
    setName('');
  };

  const features = [
    { icon: Zap,        label: 'ScienceEngine™',  sub: '15+ métriques avancées' },
    { icon: TrendingUp, label: 'PMC Tracking',     sub: 'CTL, ATL, TSB en temps réel' },
    { icon: Target,     label: 'VDOT Dynamique',   sub: 'Jack Daniels V6.4' },
    { icon: Heart,      label: 'Garmin Sync',      sub: 'Synchronisation native' },
  ];

  // ── Shared UI helpers ─────────────────────────────────────────────────────
  const inputClass =
    'w-full px-4 py-3.5 rounded-xl border-2 border-neutral-200 bg-white text-neutral-900 text-base placeholder-neutral-400 outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-100';

  const labelClass =
    'block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5';

  const submitButtonContent = isLoading ? (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  ) : null;

  const SubmitButton = ({ label }: { label: string }) => (
    <button
      type="submit"
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-base font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
      style={{
        background: 'linear-gradient(135deg, #0066FF 0%, #5856D6 100%)',
        boxShadow: '0 4px 14px rgba(0, 102, 255, 0.35)',
        minHeight: '52px',
      }}
    >
      {isLoading ? submitButtonContent : label}
    </button>
  );

  const ErrorAlert = () =>
    error ? (
      <div
        role="alert"
        className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium text-red-700 bg-red-50 border border-red-200"
      >
        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        {error}
      </div>
    ) : null;

  const SuccessAlert = ({ message }: { message: string }) => (
    <div
      role="status"
      className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium text-green-700 bg-green-50 border border-green-200"
    >
      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      {message}
    </div>
  );

  const BackToLoginLink = () => (
    <p className="text-center text-sm text-neutral-500">
      <Link
        href="/login"
        className="font-semibold text-primary-600 hover:text-primary-700 hover:underline transition-colors"
      >
        ← Retour à la connexion
      </Link>
    </p>
  );

  return (
    <div className="min-h-screen w-full flex">

      {/* ═══════════════════════════════════════════════
          LEFT PANEL — dark gradient, same as landing
          ═══════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden flex-col justify-between p-12"
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F172A 100%)',
        }}
      >
        {/* Background glow blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #0066FF 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }} />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #5856D6 0%, transparent 70%)', transform: 'translate(30%, 30%)' }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        {/* Top — brand */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0066FF, #5856D6)' }}>
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight">
              DRAW<span className="text-primary-400">RUN</span>
            </span>
          </Link>
        </div>

        {/* Middle — hero copy */}
        <div className="relative z-10 space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold"
            style={{ background: 'rgba(0,102,255,0.15)', borderColor: 'rgba(0,102,255,0.3)', color: '#4C9AFF' }}>
            <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
            v3.42 Elite • ScienceEngine™
          </div>

          <div>
            <h1 className="text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
              DOMINEZ VOS
              <br />
              <span style={{ background: 'linear-gradient(135deg, #007AFF, #5856D6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                LIMITES
              </span>
            </h1>
            <p className="mt-4 text-lg text-neutral-400 leading-relaxed max-w-sm">
              L&apos;application de performance ultime intégrant le moteur{' '}
              <span className="text-white font-semibold">Jack Daniels VDOT V6.4</span>{' '}
              et 15+ métriques avancées.
            </p>
          </div>

          {/* Feature list */}
          <div className="grid grid-cols-1 gap-3">
            {features.map(({ icon: Icon, label, sub }) => (
              <div key={label}
                className="flex items-center gap-4 p-4 rounded-2xl border transition-colors"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,102,255,0.2)' }}>
                  <Icon className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-neutral-500">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — stats */}
        <div className="relative z-10 flex items-center gap-8 pt-8 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {[
            { value: '15+',      label: 'Métriques' },
            { value: '2 500+',   label: 'Athlètes' },
            { value: '99%',      label: 'Précision' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-extrabold text-primary-400">{s.value}</p>
              <p className="text-xs text-neutral-500 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          RIGHT PANEL — form
          ═══════════════════════════════════════════════ */}
      <div className="flex-1 lg:max-w-[480px] flex flex-col bg-neutral-50 relative">

        {/* Back link */}
        <div className="absolute top-5 left-5 z-10">
          <Link href="/"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-neutral-500 hover:text-neutral-900 hover:bg-white border border-transparent hover:border-neutral-200 transition-all">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Retour</span>
          </Link>
        </div>

        {/* Mobile brand (visible only on small screens) */}
        <div className="lg:hidden flex items-center justify-center gap-3 pt-16 pb-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #0066FF, #5856D6)' }}>
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-extrabold text-neutral-900 tracking-tight">
            DRAW<span className="text-primary-600">RUN</span>
          </span>
        </div>

        {/* Form card */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-sm">

            {/* ── FORGOT PASSWORD MODE ─────────────────────────────────── */}
            {mode === 'forgot' && (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                    Mot de passe oublié
                  </h2>
                  <p className="mt-1.5 text-sm text-neutral-500">
                    Entrez votre email pour recevoir un code de réinitialisation.
                  </p>
                </div>

                {successMessage ? (
                  <div className="space-y-6">
                    <SuccessAlert message={successMessage} />
                    <BackToLoginLink />
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} noValidate className="space-y-4">
                    <div>
                      <label htmlFor="email" className={labelClass}>Email</label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                        autoComplete="email"
                        inputMode="email"
                        required
                        className={inputClass}
                        style={{ fontSize: '16px' }}
                      />
                    </div>

                    <ErrorAlert />

                    <SubmitButton label="Envoyer le code" />

                    <div className="flex items-center gap-3 my-2">
                      <div className="flex-1 h-px bg-neutral-200" />
                    </div>

                    <BackToLoginLink />
                  </form>
                )}
              </>
            )}

            {/* ── RESET PASSWORD MODE ──────────────────────────────────── */}
            {mode === 'reset' && (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                    Réinitialiser le mot de passe
                  </h2>
                  <p className="mt-1.5 text-sm text-neutral-500">
                    Entrez le code reçu par email et choisissez un nouveau mot de passe.
                  </p>
                </div>

                {successMessage ? (
                  <div className="space-y-6">
                    <SuccessAlert message={successMessage} />
                    <p className="text-center text-sm text-neutral-500">
                      Redirection vers la connexion…
                    </p>
                    <BackToLoginLink />
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} noValidate className="space-y-4">
                    {/* Email */}
                    <div>
                      <label htmlFor="reset-email" className={labelClass}>Email</label>
                      <input
                        id="reset-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                        autoComplete="email"
                        inputMode="email"
                        required
                        className={inputClass}
                        style={{ fontSize: '16px' }}
                      />
                    </div>

                    {/* OTP code */}
                    <div>
                      <label htmlFor="otp-code" className={labelClass}>Code de vérification</label>
                      <input
                        id="otp-code"
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="123456"
                        autoComplete="one-time-code"
                        inputMode="numeric"
                        required
                        className={inputClass}
                        style={{ fontSize: '16px' }}
                      />
                    </div>

                    {/* New password */}
                    <div>
                      <label htmlFor="new-password" className={labelClass}>Nouveau mot de passe</label>
                      <div className="relative">
                        <input
                          id="new-password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          required
                          minLength={6}
                          className={`${inputClass} pr-12`}
                          style={{ fontSize: '16px' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors p-1"
                          aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm password */}
                    <div>
                      <label htmlFor="confirm-password" className={labelClass}>Confirmer le mot de passe</label>
                      <div className="relative">
                        <input
                          id="confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          required
                          minLength={6}
                          className={`${inputClass} pr-12`}
                          style={{ fontSize: '16px' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors p-1"
                          aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <ErrorAlert />

                    <SubmitButton label="Réinitialiser le mot de passe" />

                    <div className="flex items-center gap-3 my-2">
                      <div className="flex-1 h-px bg-neutral-200" />
                    </div>

                    <BackToLoginLink />
                  </form>
                )}
              </>
            )}

            {/* ── LOGIN / REGISTER MODE ────────────────────────────────── */}
            {(mode === 'login' || mode === 'register') && (
              <>
                {/* Header */}
                <div className="mb-8">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                    {isLogin ? 'Bon retour 👋' : 'Créer un compte'}
                  </h2>
                  <p className="mt-1.5 text-sm text-neutral-500">
                    {isLogin
                      ? 'Connectez-vous pour accéder à votre tableau de bord.'
                      : 'Rejoignez 2 500+ athlètes qui utilisent DrawRun.'}
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleLoginRegister} noValidate className="space-y-4">

                  {/* Name (register only) */}
                  {!isLogin && (
                    <div>
                      <label htmlFor="name" className={labelClass}>Nom</label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Votre nom"
                        autoComplete="name"
                        required
                        className={inputClass}
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className={labelClass}>Email</label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      autoComplete="email"
                      inputMode="email"
                      required
                      className={inputClass}
                      style={{ fontSize: '16px' }}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className={labelClass}>Mot de passe</label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                        required
                        minLength={6}
                        className={`${inputClass} pr-12`}
                        style={{ fontSize: '16px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors p-1"
                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <ErrorAlert />

                  {/* Forgot password */}
                  {isLogin && (
                    <div className="flex justify-end">
                      <Link href="/login?mode=forgot"
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline transition-colors">
                        Mot de passe oublié ?
                      </Link>
                    </div>
                  )}

                  <SubmitButton label={isLogin ? 'Se connecter' : 'Créer mon compte'} />
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-neutral-200" />
                  <span className="text-xs text-neutral-400 font-medium">ou</span>
                  <div className="flex-1 h-px bg-neutral-200" />
                </div>

                {/* Switch mode */}
                <p className="text-center text-sm text-neutral-500">
                  {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
                  {' '}
                  <button
                    type="button"
                    onClick={switchMode}
                    className="font-semibold text-primary-600 hover:text-primary-700 hover:underline transition-colors"
                  >
                    {isLogin ? "S'inscrire gratuitement" : 'Se connecter'}
                  </button>
                </p>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-5 mt-8 pt-6 border-t border-neutral-200">
                  {['🔒 Sécurisé SSL', '🇫🇷 Hébergé en France', '✓ Gratuit'].map((badge) => (
                    <span key={badge} className="text-xs text-neutral-400 font-medium">{badge}</span>
                  ))}
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
