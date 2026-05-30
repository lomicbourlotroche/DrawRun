'use client';

import { useState, useEffect } from 'react';
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent, Button } from '@/components/ui';
import { api } from '@/lib/api';
import { Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function NotificationSection() {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isLoadingPush, setIsLoadingPush] = useState(false);
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    const check = async () => {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setPushEnabled(!!subscription);
        setPushSubscription(subscription);
      } catch { /* silencieux */ }
    };
    check();
  }, []);

  const enablePushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('Les notifications push ne sont pas supportées par votre navigateur');
      return;
    }

    setIsLoadingPush(true);
    try {
      const { publicKey } = await api.getVapidKey();

      if (!publicKey) {
        toast.error('Service de notifications non configuré');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Permission de notification refusée');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
      });

      await api.subscribePush({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(subscription.getKey('auth')!),
        },
      });

      setPushEnabled(true);
      setPushSubscription(subscription);
      toast.success('Notifications push activées');
    } catch (error) {
      console.error('Push subscription error:', error);
      toast.error('Erreur lors de l\'activation des notifications');
    } finally {
      setIsLoadingPush(false);
    }
  };

  const disablePushNotifications = async () => {
    setIsLoadingPush(true);
    try {
      if (pushSubscription) {
        await pushSubscription.unsubscribe();

        await api.unsubscribePush(pushSubscription.endpoint);
      }

      setPushEnabled(false);
      setPushSubscription(null);
      toast.success('Notifications push désactivées');
    } catch (error) {
      console.error('Push unsubscription error:', error);
      toast.error('Erreur lors de la désactivation');
    } finally {
      setIsLoadingPush(false);
    }
  };

  return (
    <GlassCard>
      <GlassCardHeader>
        <GlassCardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notifications push
        </GlassCardTitle>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3">
            {pushEnabled ? (
              <Bell className="w-5 h-5 text-success" />
            ) : (
              <BellOff className="w-5 h-5 text-muted" />
            )}
            <div>
              <p className="font-medium">Notifications push</p>
              <p className="text-sm text-muted">
                {pushEnabled
                  ? 'Recevez des notifications sur cet appareil'
                  : 'Activez pour recevoir des notifications'}
              </p>
            </div>
          </div>
          {pushEnabled ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-danger"
              onClick={disablePushNotifications}
              isLoading={isLoadingPush}
            >
              Désactiver
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={enablePushNotifications}
              isLoading={isLoadingPush}
            >
              Activer
            </Button>
          )}
        </div>
        <p className="text-xs text-muted mt-3">
          Les notifications push vous alertent en temps réel des nouvelles demandes d&apos;ami,
          draws et commentaires sur vos activités.
        </p>
      </GlassCardContent>
    </GlassCard>
  );
}
