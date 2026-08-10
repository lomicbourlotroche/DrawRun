/**
 * ============================================================
 * USE USER COUNTER - Hook pour le compteur d'utilisateurs
 * ============================================================
 *
 * Hook React qui récupère et met à jour le nombre d'utilisateurs actifs
 * via polling HTTP (pas besoin de WebSocket).
 *
 * @module hooks/useUserCounter
 */

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface UseUserCounterResult {
  count: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook pour récupérer et mettre à jour le compteur d'utilisateurs
 * @param pollInterval Intervalle de polling en ms (par défaut: 30000 = 30 secondes)
 * @returns Objet avec count, isLoading et error
 */
export const useUserCounter = (pollInterval: number = 30000): UseUserCounterResult => {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserCount = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Récupérer le compteur depuis le backend
      const response = await api.getUserCount();
      setCount(response.count || 0);
    } catch (err) {
      console.error('Erreur lors de la récupération du compteur utilisateurs:', err);
      setError(err instanceof Error ? err.message : 'Impossible de charger le compteur');
      // En cas d'erreur, on garde l'ancienne valeur ou on met 0
      setCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Récupération initiale
    fetchUserCount();

    // Mise à jour périodique
    const intervalId = setInterval(fetchUserCount, pollInterval);

    // Nettoyage
    return () => {
      clearInterval(intervalId);
    };
  }, [pollInterval]);

  return {
    count,
    isLoading,
    error,
  };
};

export default useUserCounter;
