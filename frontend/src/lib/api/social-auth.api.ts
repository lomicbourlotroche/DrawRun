/**
 * ============================================================
 * SOCIAL AUTH API - Authentification Google/Apple
 * ============================================================
 *
 * Endpoints pour l'authentification via Google et Apple.
 * Utilise Firebase en frontend et valide les tokens côté backend.
 *
 * @module lib/api/social-auth.api
 */

import { client } from './client';
import { signInWithGoogle, signInWithApple, signOutFromFirebase } from '@/lib/firebase';

// Types pour les réponses d'authentification sociale
export interface SocialAuthResponse {
  token: string;
  refreshToken?: string;
  userId: number;
  user: {
    id: number;
    email: string;
    name?: string;
    provider: 'google' | 'apple';
    avatar?: string;
  };
}

export interface SocialAuthError {
  error: string;
  code?: number;
}

/**
 * Authentification via Google
 * 1. Ouvre le popup Firebase
 * 2. Récupère le token ID
 * 3. L'envoie au backend pour validation et création de session
 */
export const loginWithGoogle = async (): Promise<SocialAuthResponse> => {
  try {
    const { user, token: firebaseToken } = await signInWithGoogle();

    const response = await client.request<SocialAuthResponse>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({
        token: firebaseToken,
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        avatar: user.photoURL,
      }),
    });

    return response;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Échec de la connexion avec Google'
    );
  }
};

/**
 * Authentification via Apple
 * 1. Ouvre le popup Firebase
 * 2. Récupère le token ID
 * 3. L'envoie au backend pour validation et création de session
 */
export const loginWithApple = async (): Promise<SocialAuthResponse> => {
  try {
    const { user, token: firebaseToken } = await signInWithApple();

    const response = await client.request<SocialAuthResponse>('/api/auth/apple', {
      method: 'POST',
      body: JSON.stringify({
        token: firebaseToken,
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        avatar: user.photoURL,
      }),
    });

    return response;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Échec de la connexion avec Apple'
    );
  }
};

/**
 * Déconnexion d'un utilisateur authentifié via un fournisseur social
 */
export const logoutSocial = async (): Promise<{ success: boolean }> => {
  try {
    await signOutFromFirebase();
    const response = await client.request<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
    });
    return response;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Échec de la déconnexion'
    );
  }
};

/**
 * Lier un compte Google/Apple à un compte existant
 */
export const linkSocialAccount = async (
  provider: 'google' | 'apple',
  firebaseToken: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await client.request<{ success: boolean; message?: string }>(
      `/api/auth/link/${provider}`,
      {
        method: 'POST',
        body: JSON.stringify({ token: firebaseToken }),
      }
    );
    return response;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : `Échec de la liaison du compte ${provider}`
    );
  }
};

/**
 * Supprimer la liaison d'un compte social
 */
export const unlinkSocialAccount = async (
  provider: 'google' | 'apple'
): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await client.request<{ success: boolean; message?: string }>(
      `/api/auth/unlink/${provider}`,
      {
        method: 'POST',
      }
    );
    return response;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : `Échec de la suppression de la liaison du compte ${provider}`
    );
  }
};

/**
 * Vérifier si un utilisateur a un compte social lié
 */
export const getLinkedSocialAccounts = async (): Promise<{
  google?: boolean;
  apple?: boolean;
}> => {
  try {
    const response = await client.request<{ google?: boolean; apple?: boolean }>(
      '/api/auth/linked-accounts'
    );
    return response;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Échec de la récupération des comptes liés'
    );
  }
};

// Export de l'API sociale
export const socialAuthApi = {
  loginWithGoogle,
  loginWithApple,
  logoutSocial,
  linkSocialAccount,
  unlinkSocialAccount,
  getLinkedSocialAccounts,
};
