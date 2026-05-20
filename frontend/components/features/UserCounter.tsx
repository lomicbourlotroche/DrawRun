/**
 * ============================================================
 * USER COUNTER COMPONENT - Compteur d'utilisateurs en temps réel
 * ============================================================
 *
 * Composant React qui affiche le nombre d'utilisateurs actifs
 * et se met à jour en temps réel via WebSocket.
 *
 * @module components/features/UserCounter
 */

'use client';

import { useState, useEffect } from 'react';
import { userCounterApi } from '@/lib/api';

export interface UserCounterProps {
  className?: string;
  showLabel?: boolean;
  label?: string;
}

/**
 * Composant UserCounter - Affiche le nombre d'utilisateurs actifs
 */
export const UserCounter = ({
  className = '',
  showLabel = true,
  label = 'utilisateurs en ligne',
}: UserCounterProps) => {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: () => void;

    const fetchAndSubscribe = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Récupérer le compteur initial et s'abonner aux mises à jour
        const { unsubscribe: unsubscribeFn } = await userCounterApi.getUserCountAndSubscribe(
          (newCount) => {
            setCount(newCount);
          }
        );
        
        unsubscribe = unsubscribeFn;
      } catch (err) {
        console.error('Erreur lors de la récupération du compteur:', err);
        setError('Impossible de charger le compteur');
        // Essayer de récupérer juste le compteur sans WebSocket
        try {
          const response = await userCounterApi.getUserCount();
          setCount(response.count);
        } catch (fallbackError) {
          console.error('Erreur lors de la récupération du compteur (fallback):', fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndSubscribe();

    // Nettoyage
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-4 h-4 rounded-full bg-primary-200 animate-pulse" />
        <span className="text-sm text-muted">Chargement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-sm text-danger-500 ${className}`}>
        {error}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-lg font-bold text-primary-600 tabular-nums">{count.toLocaleString()}</span>
      {showLabel && (
        <span className="text-xs text-muted hidden sm:inline">{label}</span>
      )}
    </div>
  );
};

export default UserCounter;
