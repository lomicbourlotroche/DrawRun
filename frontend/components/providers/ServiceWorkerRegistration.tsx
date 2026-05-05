'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * ServiceWorkerRegistration
 * =========================
 * Enregistre le Service Worker et gère les mises à jour
 * Affiche un toast quand une nouvelle version est disponible
 */
export function ServiceWorkerRegistration() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    let registration: ServiceWorkerRegistration | null = null;

    const registerSW = async () => {
      try {
        registration = await navigator.serviceWorker.register('/sw.js');
        
        console.log('[SW] Service Worker registered:', registration.scope);

        // Écouter les mises à jour
        registration.addEventListener('updatefound', () => {
          const newWorker = registration?.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nouvelle version disponible
              setWaitingWorker(newWorker);
              toast.success(
                'Nouvelle version disponible',
                {
                  description: 'Rechargez la page pour utiliser la dernière version.',
                  duration: 0,
                  action: {
                    label: 'Recharger',
                    onClick: () => {
                      newWorker.postMessage({ type: 'SKIP_WAITING' });
                      window.location.reload();
                    },
                  },
                }
              );
            }
          });
        });

        // Vérifier les mises à jour périodiquement (toutes les heures)
        setInterval(() => {
          registration?.update();
        }, 60 * 60 * 1000);

      } catch (error) {
        console.error('[SW] Service Worker registration failed:', error);
      }
    };

    registerSW();

    // Écouter le message de contrôleur changé
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (waitingWorker) {
        window.location.reload();
      }
    });

    return () => {
      // Cleanup si nécessaire
    };
  }, [waitingWorker]);

  return null; // Composant sans rendu visuel
}
