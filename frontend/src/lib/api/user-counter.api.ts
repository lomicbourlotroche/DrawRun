/**
 * ============================================================
 * USER COUNTER API - Compteur d'utilisateurs en temps réel
 * ============================================================
 *
 * Ce module gère le compteur d'utilisateurs actifs en temps réel.
 * Utilise WebSocket pour recevoir les mises à jour depuis le backend.
 *
 * @module lib/api/user-counter.api
 */
/* eslint-disable no-console */

import { client } from './client';

// Type pour la réponse du compteur
export interface UserCountResponse {
  count: number;
  lastUpdated: string;
}

// Type pour les messages WebSocket
export interface UserCountWebSocketMessage {
  type: 'user_count_update';
  data: UserCountResponse;
}

// Singleton pour la connexion WebSocket
let socket: WebSocket | null = null;
let subscribers: Array<(_count: number) => void> = [];

/**
 * Récupère le nombre d'utilisateurs actifs (méthode HTTP)
 */
export const getUserCount = async (): Promise<UserCountResponse> => {
  try {
    const response = await client.request<UserCountResponse>('/api/stats/users');
    return response;
  } catch (error) {
    console.error('Erreur lors de la récupération du compteur utilisateurs:', error);
    // Retourner une valeur par défaut en cas d'erreur
    return { count: 0, lastUpdated: new Date().toISOString() };
  }
};

/**
 * Abonnement aux mises à jour en temps réel du compteur
 * @param callback Fonction appelée à chaque mise à jour du compteur
 * @returns Fonction pour se désabonner
 */
export const subscribeToUserCount = (
  callback: (_count: number) => void
): (() => void) => {
  // Ajouter le callback à la liste des abonnés
  subscribers.push(callback);

  // Si le socket n'est pas connecté, le créer
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    connectWebSocket();
  }

  // Retourner une fonction pour se désabonner
  return () => {
    subscribers = subscribers.filter((sub) => sub !== callback);
    // Si plus d'abonnés, fermer le socket
    if (subscribers.length === 0 && socket) {
      socket.close();
      socket = null;
    }
  };
};

/**
 * Connexion au serveur WebSocket pour recevoir les mises à jour
 */
const connectWebSocket = (): void => {
  // Récupérer l'URL du serveur WebSocket depuis les variables d'environnement
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const wsUrl = `${protocol}//${host}/api/stats/users/ws`;

  try {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connecté pour le compteur utilisateurs');
    };

    socket.onmessage = (event) => {
      try {
        const message: UserCountWebSocketMessage = JSON.parse(event.data);
        if (message.type === 'user_count_update') {
          // Notifier tous les abonnés
          subscribers.forEach((callback) => callback(message.data.count));
        }
      } catch (error) {
        console.error('Erreur lors du traitement du message WebSocket:', error);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket déconnecté');
      // Tentative de reconnexion après 5 secondes
      setTimeout(connectWebSocket, 5000);
    };

    socket.onerror = (error) => {
      console.error('Erreur WebSocket:', error);
    };
  } catch (error) {
    console.error('Impossible de créer la connexion WebSocket:', error);
  }
};

/**
 * Récupère le compteur et s'abonne aux mises à jour en une seule opération
 * @param callback Fonction appelée à chaque mise à jour
 * @returns Promesse avec le compteur initial et fonction de désabonnement
 */
export const getUserCountAndSubscribe = async (
  callback: (_count: number) => void
): Promise<{ count: number; unsubscribe: () => void }> => {
  // Récupérer le compteur initial
  const initialCount = await getUserCount();

  // S'abonner aux mises à jour
  const unsubscribe = subscribeToUserCount(callback);

  // Appeler le callback avec le compteur initial
  callback(initialCount.count);

  return {
    count: initialCount.count,
    unsubscribe,
  };
};

// Export de l'API du compteur
export const userCounterApi = {
  getUserCount,
  subscribeToUserCount,
  getUserCountAndSubscribe,
};
