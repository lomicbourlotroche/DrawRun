/* eslint-disable no-console */
'use client';

import { useEffect, useState } from 'react';
import { Download } from '@/components/ui/icons';
import { Button } from '@/components/ui/Button';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

/**
 * InstallPrompt
 * =============
 * Affiche un bouton "Installer l'app" quand l'appli peut être installée
 * Capture l'événement beforeinstallprompt pour le déclencher au clic
 */
// Module-level flag to only suppress the default prompt once per session
let hasSuppressedDefaultPrompt = false;

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Vérifier si l'app est déjà en mode standalone
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as { standalone?: boolean }).standalone === true;
      setIsStandalone(standalone);
    };

    checkStandalone();

    // Capturer l'événement beforeinstallprompt une seule fois par session
    const handleBeforeInstallPrompt = (e: Event) => {
      if (!hasSuppressedDefaultPrompt) {
        e.preventDefault();
        hasSuppressedDefaultPrompt = true;
      }
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Écouter le changement de display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkStandalone);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      mediaQuery.removeEventListener('change', checkStandalone);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      // Afficher le prompt d'installation
      await deferredPrompt.prompt();

      // Attendre la réponse de l'utilisateur
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
      } else {
        console.log('[PWA] User dismissed the install prompt');
      }

      // Réinitialiser le prompt différé
      setDeferredPrompt(null);
      setIsVisible(false);
    } catch (error) {
      console.error('[PWA] Error showing install prompt:', error);
    }
  };

  // Ne pas afficher si déjà en mode standalone ou pas de prompt disponible
  if (isStandalone || !isVisible) return null;

  return (
    <Button
      onClick={handleInstall}
      variant="outline"
      size="sm"
      className="gap-2"
      aria-label="Installer l'application DrawRun"
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Installer l&apos;app</span>
      <span className="sm:hidden">Installer</span>
    </Button>
  );
}
