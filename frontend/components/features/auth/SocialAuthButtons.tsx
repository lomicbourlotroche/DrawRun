/**
 * ============================================================
 * SOCIAL AUTH BUTTONS - Boutons Google/Apple
 * ============================================================
 *
 * Composant React qui affiche les boutons de connexion
 * avec Google et Apple.
 *
 * @module components/features/auth/SocialAuthButtons
 */

'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores';
import { loginWithGoogle, loginWithApple } from '@/lib/api/social-auth.api';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Icônes Google et Apple en SVG
export const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export const AppleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M12.15,2.5a5.25,5.25,0,0,0-4.33,2.12A6.83,6.83,0,0,0,5.26,9.19a7,7,0,0,0,2.6,5.42,5.29,5.29,0,0,1-2.23.52,5.38,5.38,0,0,0,4.08,2.81,9.14,9.14,0,0,0,6.4,0,5.38,5.38,0,0,0,4.08-2.81,5.29,5.29,0,0,1-2.23-.52,7,7,0,0,0,2.6-5.42,6.83,6.83,0,0,0-.47-6.67A5.25,5.25,0,0,0,12.15,2.5ZM12,16.13a4.38,4.38,0,1,1,4.38-4.38A4.38,4.38,0,0,1,12,16.13Z"
    />
  </svg>
);

export interface SocialAuthButtonsProps {
  className?: string;
  showDividers?: boolean;
}

/**
 * Composant SocialAuthButtons - Boutons de connexion sociale
 */
export const SocialAuthButtons = ({
  className = '',
  showDividers = true,
}: SocialAuthButtonsProps) => {
  const { login } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<{ google?: boolean; apple?: boolean }>({});
  const [error, setError] = useState<string | null>(null);

  // Gestion de la connexion avec Google
  const handleGoogleLogin = async () => {
    try {
      setIsLoading((prev) => ({ ...prev, google: true }));
      setError(null);

      const response = await loginWithGoogle();
      
      // Stocker le token et l'utilisateur
      if (response.token) {
        login(response.user.email, '', undefined); // Le token est géré par le backend
        router.push('/app');
      }
    } catch (err) {
      console.error('Erreur de connexion avec Google:', err);
      setError(err instanceof Error ? err.message : 'Échec de la connexion avec Google');
    } finally {
      setIsLoading((prev) => ({ ...prev, google: false }));
    }
  };

  // Gestion de la connexion avec Apple
  const handleAppleLogin = async () => {
    try {
      setIsLoading((prev) => ({ ...prev, apple: true }));
      setError(null);

      const response = await loginWithApple();
      
      // Stocker le token et l'utilisateur
      if (response.token) {
        login(response.user.email, '', undefined); // Le token est géré par le backend
        router.push('/app');
      }
    } catch (err) {
      console.error('Erreur de connexion avec Apple:', err);
      setError(err instanceof Error ? err.message : 'Échec de la connexion avec Apple');
    } finally {
      setIsLoading((prev) => ({ ...prev, apple: false }));
    }
  };

  // Style des boutons
  const buttonBaseClass = `
    w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl
    font-medium text-sm transition-all duration-200
    hover:-translate-y-0.5 active:translate-y-0
    disabled:opacity-60 disabled:cursor-not-allowed
  `;

  const googleButtonClass = `
    ${buttonBaseClass}
    bg-white border border-neutral-200 text-neutral-700
    hover:bg-neutral-50 hover:border-primary-300
    shadow-sm
  `;

  const appleButtonClass = `
    ${buttonBaseClass}
    bg-black text-white
    hover:bg-neutral-800
    shadow-sm
  `;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Bouton Google */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoading.google}
        className={googleButtonClass}
        aria-label="Se connecter avec Google"
      >
        {isLoading.google ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        <span>Continuer avec Google</span>
      </button>

      {/* Bouton Apple */}
      <button
        type="button"
        onClick={handleAppleLogin}
        disabled={isLoading.apple}
        className={appleButtonClass}
        aria-label="Se connecter avec Apple"
      >
        {isLoading.apple ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <AppleIcon />
        )}
        <span>Continuer avec Apple</span>
      </button>

      {/* Message d'erreur */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-danger-700 bg-danger-50 border border-danger-200"
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </div>
      )}

      {/* Séparateurs */}
      {showDividers && (
        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-neutral-200" />
          <span className="text-xs text-neutral-400 font-medium">ou</span>
          <div className="flex-1 h-px bg-neutral-200" />
        </div>
      )}
    </div>
  );
};

export default SocialAuthButtons;
