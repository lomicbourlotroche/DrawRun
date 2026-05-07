/* eslint-disable unused-imports/no-unused-vars */
/**
 * ============================================================
 * STORES ZUSTAND - Gestion d'état de l'application
 * ============================================================
 * 
 * Ce fichier contient les stores Zustand qui gèrent
 * l'état global de l'application frontend.
 * 
 * === FONCTIONNEMENT ===
 * - Zustand est une bibliothèque de gestion d'état
 * - Les stores utilisent le pattern "persist" pour
 *   sauvegarder dans sessionStorage (token, utilisateur)
 * - Chaque store exporte des fonctions pour
 *   modifier l'état (login, logout, etc.)
 * 
 * === STORES DÉfinis ===
 * - useAuthStore    : Authentication (user, token, login, logout)
 * - useDashboardStore : Métriques du dashboard
 * - useZonesStore   : Zones d'entraînement
 * - useActivitiesStore : Liste des activités
 * 
 * @module stores/index
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, Readiness, Recommendation, PmcDataPoint, Activity, Zones, SocialNotification } from '@/types';
import { api, SyncStatus } from '@/lib/api';
import { logger } from '@/lib/logger';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  has_strava: boolean;
  has_garmin: boolean;
  has_suunto: boolean;
  has_decathlon: boolean;
  
  login: (email: string, password: string, totpCode?: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updateUser: (data: Partial<User>) => void;
  setSyncStatus: (status: { has_strava: boolean; has_garmin: boolean; has_suunto: boolean; has_decathlon: boolean }) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
      error: null,
      has_strava: false,
      has_garmin: false,
      has_suunto: false,
      has_decathlon: false,

      login: async (email: string, password: string, totpCode?: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.login(email, password, totpCode);

          // Le backend retourne { requires2FA: true } si 2FA activée et code non fourni
          if ((response as unknown as Record<string, unknown>).requires2FA) {
            set({ isLoading: false });
            throw new Error('2FA_REQUIRED');
          }
          api.setToken(response.token);
          if (response.refreshToken) {
            api.setRefreshToken(response.refreshToken);
          }

          const hasStrava =
            response.has_strava !== undefined ? !!response.has_strava : !!response.user?.has_strava;
          const hasGarmin =
            response.has_garmin !== undefined ? !!response.has_garmin : !!response.user?.has_garmin;
          const hasSuunto =
            response.has_suunto !== undefined ? !!response.has_suunto : !!response.user?.has_suunto;
          const hasDecathlon =
            response.has_decathlon !== undefined ? !!response.has_decathlon : !!response.user?.has_decathlon;

          let syncStatus = {
            has_strava: hasStrava,
            has_garmin: hasGarmin,
            has_suunto: hasSuunto,
            has_decathlon: hasDecathlon,
          };

          try {
            const status = await api.getSyncStatus();
            syncStatus = {
              has_strava: hasStrava || !!status.strava_last_sync,
              has_garmin: hasGarmin || !!status.garmin_last_sync,
              has_suunto: hasSuunto || !!status.suunto_last_sync,
              has_decathlon: hasDecathlon || !!status.decathlon_last_sync,
            };
          } catch (syncError) {
            logger.warn('Could not fetch sync status after login', {
              error: syncError instanceof Error ? syncError.message : 'Unknown error',
            });
          }

          const userWithSyncFlags = {
            ...response.user,
            has_strava: syncStatus.has_strava,
            has_garmin: syncStatus.has_garmin,
            has_suunto: syncStatus.has_suunto,
            has_decathlon: syncStatus.has_decathlon,
          };

          set({
            isAuthenticated: true,
            user: userWithSyncFlags,
            token: response.token,
            isLoading: false,
            ...syncStatus,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
          throw error;
        }
      },

      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.register(email, password, name);
          api.setToken(response.token);
          set({
            isAuthenticated: true,
            user: response.user,
            token: response.token,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Registration failed',
          });
          throw error;
        }
      },

      logout: () => {
        api.setToken(null);
        api.setRefreshToken(null);
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          has_strava: false,
          has_garmin: false,
          has_suunto: false,
        });
      },

      clearError: () => set({ error: null }),
      
      updateUser: (data: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...data } });
        }
      },

      setSyncStatus: (status: { has_strava: boolean; has_garmin: boolean; has_suunto: boolean }) => {
        set(status);
      },
    }),
    {
      name: 'drawrun-auth',
      storage: createJSONStorage(() => sessionStorage),
       partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
        has_strava: state.has_strava,
        has_garmin: state.has_garmin,
        has_suunto: state.has_suunto,
        has_decathlon: state.has_decathlon,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          // Vérifier la validité du token (non expiré)
          try {
            const payload = JSON.parse(atob(state.token.split('.')[1]));
            if (payload.exp * 1000 > Date.now()) {
              api.setToken(state.token);
            }
            // Si expiré, le prochain appel API échouera et déclenchera le logout
          } catch {
            // Token invalide - sera géré par le prochain appel API
          }
        }
      },
    }
  )
);

interface DashboardState {
  readiness: Readiness | null;
  recommendation: Recommendation | null;
  pmcData: PmcDataPoint[];
  recentActivities: Activity[];
  isLoading: boolean;
  
  setReadiness: (readiness: Readiness) => void;
  setRecommendation: (rec: Recommendation) => void;
  setPmcData: (data: PmcDataPoint[]) => void;
  setRecentActivities: (activities: Activity[]) => void;
  setLoading: (loading: boolean) => void;
  fetchPmcData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  readiness: null,
  recommendation: null,
  pmcData: [],
  recentActivities: [],
  isLoading: false,

  setReadiness: (readiness) => set({ readiness }),
  setRecommendation: (rec) => set({ recommendation: rec }),
  setPmcData: (data) => set({ pmcData: data }),
  setRecentActivities: (activities) => set({ recentActivities: activities }),
  setLoading: (loading) => set({ isLoading: loading }),
  fetchPmcData: async () => {
    set({ isLoading: true });
    try {
      const data = await api.getPmc();
      set({ pmcData: data });
    } finally {
      set({ isLoading: false });
    }
  },
}));

interface ActivitiesState {
  activities: Activity[];
  filteredActivities: Activity[];
  selectedActivity: Activity | null;
  selectedStream: import('@/types').ActivityStreams | null;
  filter: 'all' | 'run' | 'bike' | 'swim';
  sortBy: 'date' | 'distance' | 'duration';
  isLoading: boolean;
  
  setActivities: (activities: Activity[]) => void;
  setFilteredActivities: (activities: Activity[]) => void;
  setSelectedActivity: (activity: Activity | null) => void;
  setSelectedStream: (stream: import('@/types').ActivityStreams | null) => void;
  setFilter: (filter: 'all' | 'run' | 'bike' | 'swim') => void;
  setSortBy: (sortBy: 'date' | 'distance' | 'duration') => void;
  setLoading: (loading: boolean) => void;
  applyFilterAndSort: () => void;
}

export const useActivitiesStore = create<ActivitiesState>((set, get) => ({
  activities: [],
  filteredActivities: [],
  selectedActivity: null,
  selectedStream: null,
  filter: 'all',
  sortBy: 'date',
  isLoading: false,

  setActivities: (activities) => {
    set({ activities });
    get().applyFilterAndSort();
  },
  
  setFilteredActivities: (activities) => set({ filteredActivities: activities }),
  setSelectedActivity: (activity) => set({ selectedActivity: activity }),
  setSelectedStream: (stream) => set({ selectedStream: stream }),
  setFilter: (filter) => {
    set({ filter });
    get().applyFilterAndSort();
  },
  setSortBy: (sortBy) => {
    set({ sortBy });
    get().applyFilterAndSort();
  },
  setLoading: (loading) => set({ isLoading: loading }),
  
  applyFilterAndSort: () => {
    const { activities, filter, sortBy } = get();
    let filtered = activities;
    
    if (filter !== 'all') {
      filtered = activities.filter((a) => a.type === filter);
    }
    
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'distance':
          return b.distance - a.distance;
        case 'duration':
          return (b.moving_time || 0) - (a.moving_time || 0);
        default:
          return 0;
      }
    });
    
    set({ filteredActivities: filtered });
  },
}));

interface PerformanceState {
  sport: 'run' | 'bike' | 'swim';
  zones: Zones | null;
  isLoading: boolean;
  
  setSport: (sport: 'run' | 'bike' | 'swim') => void;
  setZones: (zones: Zones | null) => void;
  setLoading: (loading: boolean) => void;
}

export const usePerformanceStore = create<PerformanceState>((set) => ({
  sport: 'run',
  zones: null,
  isLoading: false,

  setSport: (sport) => set({ sport }),
  setZones: (zones) => set({ zones }),
  setLoading: (loading) => set({ isLoading: loading }),
}));

interface SyncState {
  status: SyncStatus | null;
  isSyncing: boolean;
  lastError: string | null;
  needsSync: boolean;

  fetchStatus: () => Promise<void>;
  sync: () => Promise<{ success: boolean; message: string }>;
  clearError: () => void;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  status: null,
  isSyncing: false,
  lastError: null,
  needsSync: true,

  fetchStatus: async () => {
    if (!api.isAuthenticated()) {
      return;
    }
    
    try {
      const status = await api.getSyncStatus();
      set({ status });
      
      const lastGarmin = status.garmin_last_sync ? new Date(status.garmin_last_sync).getTime() : 0;
      const lastStrava = status.strava_last_sync ? new Date(status.strava_last_sync).getTime() : 0;
      const lastSuunto = status.suunto_last_sync ? new Date(status.suunto_last_sync).getTime() : 0;
      const lastSync = Math.max(lastGarmin, lastStrava, lastSuunto);
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      set({ needsSync: lastSync < oneDayAgo || status.garmin_status === 'error' || status.strava_status === 'error' || status.suunto_status === 'error' });
    } catch (error) {
      // Silently fail - user may not be authenticated
    }
  },

  sync: async () => {
    if (!api.isAuthenticated()) {
      return { success: false, message: 'Non connecté' };
    }
    
    set({ isSyncing: true, lastError: null });
    try {
      const result = await api.sync();
      
      let message = 'Synchronisation terminée';
      let hasError = false;
      let syncedCount = 0;
      
      if (result.strava) {
        const stravaCount = result.strava.imported ?? result.strava.updated ?? 0;
        if (stravaCount > 0) {
          message += ` • Strava: ${stravaCount} activités`;
          syncedCount += stravaCount;
        }
        if (result.strava.error) {
          hasError = true;
          message = `Erreur Strava: ${result.strava.error}`;
          set({ lastError: result.strava.error });
        }
      }
      if (result.garmin) {
        const garminCount = result.garmin.imported ?? result.garmin.updated ?? 0;
        if (garminCount > 0) {
          message += ` • Garmin: ${garminCount} activités`;
          syncedCount += garminCount;
        }
        if (result.garmin.error) {
          hasError = true;
          message = `Erreur Garmin: ${result.garmin.error}`;
          set({ lastError: result.garmin.error });
        }
      }
      if (result.suunto) {
        const suuntoCount = result.suunto.imported ?? result.suunto.updated ?? 0;
        if (suuntoCount > 0) {
          message += ` • Suunto: ${suuntoCount} activités`;
          syncedCount += suuntoCount;
        }
        if (result.suunto.error) {
          hasError = true;
          message = `Erreur Suunto: ${result.suunto.error}`;
          set({ lastError: result.suunto.error });
        }
      }
      
      // If no providers connected, show a message
      if (!result.strava && !result.garmin && !result.suunto) {
        message = 'Aucun service connecté. Connectez Garmin, Strava ou Suunto pour synchroniser.';
      }
      
      await get().fetchStatus();
      set({ isSyncing: false, needsSync: syncedCount > 0 });
      return { success: !hasError, message };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de synchronisation';
      set({ isSyncing: false, lastError: message });
      return { success: false, message };
    }
  },

  clearError: () => set({ lastError: null }),
}));

interface NotificationsState {
  unreadCount: number;
  notifications: SocialNotification[];
  isLoading: boolean;
  
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  incrementUnread: () => void;
  decrementUnread: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  unreadCount: 0,
  notifications: [],
  isLoading: false,

  fetchNotifications: async () => {
    if (!api.isAuthenticated()) {
      return;
    }
    
    set({ isLoading: true });
    try {
      const data = await api.getNotifications({ limit: 50 });
      const notifications: SocialNotification[] = (data.notifications as SocialNotification[]) ?? [];
      set({ 
        notifications,
        unreadCount: data.unread_count ?? notifications.filter(n => n.unread).length,
        isLoading: false,
      });
    } catch (error) {
      logger.error('Failed to fetch notifications', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      set({ isLoading: false });
    }
  },

  markAsRead: async (notificationId: number) => {
    try {
      await api.markNotificationAsRead(notificationId);
      
      const { notifications, unreadCount } = get();
      const wasUnread = notifications.find(n => n.id === notificationId)?.unread;
      const updatedNotifications = notifications.map(n => 
        n.id === notificationId ? { ...n, unread: false } : n
      );
      set({ 
        notifications: updatedNotifications,
        unreadCount: wasUnread ? Math.max(0, unreadCount - 1) : unreadCount,
      });
    } catch (error) {
      logger.error('Error marking notification as read', { 
        notificationId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  },

  markAllAsRead: async () => {
    try {
      await api.markAllNotificationsAsRead();
      
      const { notifications } = get();
      const updatedNotifications = notifications.map(n => ({ ...n, unread: false }));
      set({ 
        notifications: updatedNotifications,
        unreadCount: 0,
      });
    } catch (error) {
      logger.error('Error marking all notifications as read', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  },

  incrementUnread: () => set((state) => ({ 
    unreadCount: state.unreadCount + 1 
  })),

  decrementUnread: () => set((state) => ({ 
    unreadCount: Math.max(0, state.unreadCount - 1) 
  })),
}));

// ============================================================================
// USER CONSTANTS STORE - Single source of truth for VDOT, zones, etc.
// ============================================================================

import type { UserConstantsResponse, UserProfile, UserZones } from '@/lib/api/user-constants.api';

interface UserConstantsState {
  data: UserConstantsResponse | null;
  isLoading: boolean;
  lastFetched: number | null;
  
  fetchConstants: () => Promise<UserConstantsResponse | null>;
  invalidate: () => void;
  
  // Convenience getters
  profile: UserProfile | null;
  zones: UserZones | null;
  vdot: number | null;
  vma: number | null;
  fcm: number | null;
  ftp: number | null;
}

export const useUserConstantsStore = create<UserConstantsState>()((set, get) => ({
  data: null,
  isLoading: false,
  lastFetched: null,

  fetchConstants: async () => {
    // Cache for 5 minutes
    const { lastFetched } = get();
    if (lastFetched && Date.now() - lastFetched < 5 * 60 * 1000 && get().data) {
      return get().data;
    }

    set({ isLoading: true });
    try {
      const data = await api.getUserConstants();
      set({ data, isLoading: false, lastFetched: Date.now() });
      return data;
    } catch (error) {
      logger.error('Failed to fetch user constants', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      set({ isLoading: false });
      return null;
    }
  },

  invalidate: () => {
    set({ lastFetched: null });
  },

  get profile() {
    return get().data?.profile ?? null;
  },

  get zones() {
    return get().data?.zones ?? null;
  },

  get vdot() {
    return get().data?.profile.vdot ?? null;
  },

  get vma() {
    return get().data?.profile.vma ?? null;
  },

  get fcm() {
    return get().data?.profile.fcm ?? null;
  },

  get ftp() {
    return get().data?.profile.ftp ?? null;
  },
}));
