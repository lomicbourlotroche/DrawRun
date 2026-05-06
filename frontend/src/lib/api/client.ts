/* eslint-disable unused-imports/no-unused-vars, no-undef */
/**
 * ============================================================
 * CLIENT API - Base HTTP Client pour DrawRun
 * ============================================================
 * 
 * Ce fichier contient le client HTTP de base avec gestion
 * automatique des tokens JWT, refresh token et retry sur 401.
 * 
 * @module lib/api/client
 */

import { API_BASE_URL } from '@/lib/constants';
import { ApiError } from './types';
import { logger } from '@/lib/logger';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private isRefreshing = false;
  private refreshQueue: Array<{ resolve: (token: string) => void; reject: (err: Error) => void }> = [];

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // ============================================================================
  // Gestion des tokens
  // ============================================================================

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      // Keep token scoped to browser session to reduce persistence risk.
      if (token) {
        sessionStorage.setItem('drawrun_token', token);
        localStorage.removeItem('drawrun_token');
      } else {
        sessionStorage.removeItem('drawrun_token');
        localStorage.removeItem('drawrun_token');
        this.setRefreshToken(null); // Clear refresh token on logout
      }
    }
  }

  setRefreshToken(token: string | null): void {
    if (typeof window !== 'undefined') {
      if (token) {
        sessionStorage.setItem('drawrun_refresh_token', token);
      } else {
        sessionStorage.removeItem('drawrun_refresh_token');
      }
    }
  }

  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('drawrun_refresh_token');
    }
    return null;
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = sessionStorage.getItem('drawrun_token') || localStorage.getItem('drawrun_token');
      if (this.token) {
        sessionStorage.setItem('drawrun_token', this.token);
        localStorage.removeItem('drawrun_token');
      }
    }
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  clearToken(): void {
    this.setToken(null);
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  // ============================================================================
  // Méthodes HTTP privées
  // ============================================================================

  private async refreshAccessToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) throw new ApiError('No refresh token', 401);

    const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new ApiError('Refresh failed', response.status);
    }

    const data = await response.json();
    this.setToken(data.token);
    this.setRefreshToken(data.refreshToken);
    return data.token;
  }

  private drainRefreshQueue(token: string | null, error?: Error): void {
    const queue = this.refreshQueue.splice(0);
    for (const { resolve, reject } of queue) {
      if (error || !token) {
        reject(error || new Error('Refresh failed'));
      } else {
        resolve(token);
      }
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (process.env.NODE_ENV === 'development') {
      logger.debug(`API Request: ${options.method || 'GET'} ${this.baseUrl}${endpoint}`);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          const isAuthEndpoint =
            endpoint === '/api/auth/login' || endpoint === '/api/auth/refresh';

          if (isAuthEndpoint) {
            throw new ApiError('Unauthorized', 401);
          }

          const refreshToken = this.getRefreshToken();
          if (!refreshToken) {
            // No refresh token — logout and redirect
            const { useAuthStore } = await import('@/stores');
            useAuthStore.getState().logout();
            if (typeof window !== 'undefined') window.location.href = '/login';
            throw new ApiError('Unauthorized', 401);
          }

          if (this.isRefreshing) {
            // Queue this request and await the refresh
            return new Promise<T>((resolve, reject) => {
              this.refreshQueue.push({
                resolve: (newToken: string) => {
                  const newHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
                  fetch(`${this.baseUrl}${endpoint}`, { ...options, headers: newHeaders })
                    .then((r) => {
                      if (!r.ok) {
                        r.json()
                          .catch(() => ({}))
                          .then((errData: Record<string, string>) => {
                            reject(new ApiError(errData.error || `HTTP error ${r.status}`, r.status));
                          });
                      } else {
                        r.json().then(resolve).catch(reject);
                      }
                    })
                    .catch(reject);
                },
                reject,
              });
            });
          }

          // Start refresh
          this.isRefreshing = true;
          try {
            const newToken = await this.refreshAccessToken();
            this.drainRefreshQueue(newToken);
            this.isRefreshing = false;
            // Retry original request with new token
            const retryHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
            const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
              ...options,
              headers: retryHeaders,
            });
            if (!retryResponse.ok) {
              const errorData = await retryResponse.json().catch(() => ({}));
              throw new ApiError(
                errorData.error || `HTTP error ${retryResponse.status}`,
                retryResponse.status
              );
            }
            return retryResponse.json();
          } catch (refreshError) {
            this.isRefreshing = false;
            const err =
              refreshError instanceof Error ? refreshError : new Error('Refresh failed');
            this.drainRefreshQueue(null, err);
            const { useAuthStore } = await import('@/stores');
            useAuthStore.getState().logout();
            if (typeof window !== 'undefined') window.location.href = '/login';
            throw new ApiError('Unauthorized', 401);
          }
        }

        const errorData = await response.json().catch(() => ({}));
        const error = new ApiError(
          errorData.error || `HTTP error ${response.status}`,
          response.status
        );
        throw error;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Network error', 0);
    }
  }

  // ============================================================================
  // Méthodes HTTP publiques (convenience)
  // ============================================================================

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string, body?: Record<string, unknown>): Promise<T> {
    const options: RequestInit = { method: 'DELETE' };
    if (body) {
      options.body = JSON.stringify(body);
    }
    return this.request<T>(endpoint, options);
  }
}

// Export singleton instance
export const client = new ApiClient();

// Export class for testing or custom instances
export { ApiClient };
