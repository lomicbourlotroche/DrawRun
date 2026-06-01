/**
 * ============================================================
 * AUTH API - Endpoints d'authentification
 * ============================================================
 * 
 * Ce fichier contient tous les endpoints liés à l'authentification :
 * - Login / Register / Logout
 * - 2FA (Two-Factor Authentication)
 * - Password reset / forgot
 * - Account management
 * 
 * @module lib/api/auth.api
 */

import { client } from './client';
import type { User } from '@/types';

// ============================================================================
// Types spécifiques à l'auth
// ============================================================================

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  userId: number;
  user: User;
  /** Whether the user has Garmin credentials stored (from login response) */
  has_garmin?: boolean;
  has_decathlon?: boolean;
  twofa_enabled?: boolean;
}

export interface RegisterResponse {
  token: string;
  userId: number;
  user: User;
}

export interface Setup2FAResponse {
  secret: string;
  uri: string;
  message: string;
}

// ============================================================================
// Auth Endpoints
// ============================================================================

export const authApi = {
  /**
   * Vérification de santé du serveur
   */
  healthCheck(): Promise<{ status: string; version: string }> {
    return client.request('/health');
  },

  /**
   * Connexion utilisateur (avec support 2FA optionnel)
   */
  async login(email: string, password: string, totpCode?: string): Promise<LoginResponse> {
    const response = await client.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, ...(totpCode ? { totpCode } : {}) }),
    });
    if (response.refreshToken) {
      client.setRefreshToken(response.refreshToken);
    }
    return response;
  },

  /**
   * Inscription utilisateur
   */
  register(email: string, password: string, name?: string): Promise<RegisterResponse> {
    return client.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  },

  /**
   * Mot de passe oublié - envoi code
   */
  forgotPassword(email: string): Promise<{ success: boolean }> {
    return client.request('/api/auth/forgot-password/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Réinitialisation mot de passe avec code
   */
  resetPassword(email: string, code: string, newPassword: string): Promise<{ success: boolean }> {
    return client.request('/api/auth/forgot-password/confirm', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    });
  },

  /**
   * Changement de mot de passe (utilisateur connecté)
   */
  changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    return client.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  /**
   * Configuration 2FA - génération QR code
   */
  setup2FA(): Promise<Setup2FAResponse> {
    return client.request('/api/auth/2fa/setup', { method: 'POST' });
  },

  /**
   * Activation 2FA
   */
  enable2FA(totpCode: string): Promise<{ success: boolean; message?: string }> {
    return client.request('/api/auth/2fa/enable', {
      method: 'POST',
      body: JSON.stringify({ totpCode }),
    });
  },

  /**
   * Désactivation 2FA
   */
  disable2FA(totpCode: string): Promise<{ success: boolean; message?: string }> {
    return client.request('/api/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ totpCode }),
    });
  },

  /**
   * Suppression du compte utilisateur
   */
  deleteAccount(password: string): Promise<{ success: boolean; message?: string }> {
    return client.request('/api/auth/delete-account', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  /**
   * Déconnexion d'un service (Garmin, Decathlon)
   */
  disconnectService(service: string): Promise<{ success: boolean }> {
    const endpoints: Record<string, string> = {
      garmin: '/api/auth/disconnect/garmin',
      decathlon: '/api/auth/disconnect/decathlon',
    };
    const endpoint = endpoints[service.toLowerCase()];
    if (!endpoint) throw new Error(`Unknown service: ${service}`);
    return client.request(endpoint, { method: 'POST' });
  },

  /**
   * Connexion Garmin avec credentials
   */
  connectGarmin(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    return client.request('/api/auth/credentials/garmin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * Sauvegarder les credentials Decathlon (email + mot de passe pour Playwright)
   */
  saveDecathlonCredentials(email: string, password: string): Promise<{ message: string }> {
    return client.request('/api/auth/credentials/decathlon', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * Déconnecter Decathlon
   */
  disconnectDecathlon(): Promise<{ success: boolean; message?: string }> {
    return client.request('/api/auth/disconnect/decathlon', { method: 'POST' });
  },

  /**
   * Connexion Suunto avec credentials
   */
  connectSuunto(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    return client.request('/api/auth/credentials/suunto', {
      method: 'POST',
      body: JSON.stringify({ username: email, password }),
    });
  },

  /**
   * Déconnecter Suunto
   */
  disconnectSuunto(): Promise<{ success: boolean; message?: string }> {
    return client.request('/api/auth/disconnect/suunto', { method: 'POST' });
  },

};
