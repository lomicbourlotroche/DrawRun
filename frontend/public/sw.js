/**
 * DrawRun Service Worker
 * =====================
 * - Cache First pour les assets statiques
 * - Fallback /offline.html si hors ligne
 * - Handler push notifications
 * - Handler notificationclick
 */

const CACHE_NAME = 'drawrun-v1';
const STATIC_ASSETS = [
  '/',
  '/app',
  '/login',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/offline.html',
];

// ============================================================================
// INSTALL — mise en cache des assets statiques
// ============================================================================

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        // Certains assets peuvent ne pas exister encore — ignorer silencieusement
        console.warn('[SW] Some assets could not be cached:', err.message);
      });
    }).then(() => self.skipWaiting())
  );
});

// ============================================================================
// ACTIVATE — nettoyage des anciens caches
// ============================================================================

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ============================================================================
// FETCH — Cache First + fallback offline
// ============================================================================

self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET et les requêtes API
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Mettre en cache les nouvelles ressources statiques
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Hors ligne — retourner la page offline pour les requêtes HTML
        if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/offline.html');
        }
        return new Response('', { status: 503, statusText: 'Service Unavailable' });
      });
    })
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
      // Focaliser une fenêtre existante si possible
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Sinon ouvrir une nouvelle fenêtre
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
