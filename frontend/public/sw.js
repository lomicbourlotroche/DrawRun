/* eslint-disable no-console, no-undef */
/**
 * DrawRun Service Worker
 * =====================
 * - Push notifications uniquement
 * - PAS de cache des assets Next.js (ils ont leurs propres headers immutables)
 * - Fallback /offline.html si hors ligne pour les pages HTML seulement
 */

// Version incrémentée à chaque déploiement pour forcer le remplacement du SW
const SW_VERSION = 'drawrun-v3';
const _CACHE_NAME = SW_VERSION;

// ============================================================================
// INSTALL — skip waiting immédiatement, pas de pré-cache
// ============================================================================

self.addEventListener('install', (event) => {
  // Prendre le contrôle immédiatement sans attendre
  event.waitUntil(self.skipWaiting());
});

// ============================================================================
// ACTIVATE — supprimer TOUS les anciens caches
// ============================================================================

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          console.log('[SW] Deleting cache:', name);
          return caches.delete(name);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ============================================================================
// PUSH — afficher une notification système
// ============================================================================

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'DrawRun', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'DrawRun';
  const options = {
    body: data.body || '',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: data.data || {},
    vibrate: [200, 100, 200],
    tag: data.tag || 'drawrun-notification',
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ============================================================================
// NOTIFICATIONCLICK — ouvrir l'URL correspondante
// ============================================================================

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notifData = event.notification.data || {};
  let url = '/app';

  if (notifData.type === 'friend_request') {
    url = '/app/social';
  } else if (notifData.activityId) {
    url = `/app/activities/${notifData.activityId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// ============================================================================
// MESSAGE — skip waiting pour mise à jour immédiate
// ============================================================================

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
