/**
 * ============================================================
 * NOTIFICATIONS API - Push Notifications Web Push
 * ============================================================
 * 
 * Gestion des notifications push via Web Push API / VAPID
 * 
 * @module lib/api/notifications.api
 */

import { client } from './client';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface VapidKeyResponse {
  publicKey: string;
}

export interface SubscribeResponse {
  success: boolean;
  message: string;
}

export interface UnsubscribeResponse {
  success: boolean;
  message: string;
}

/**
 * Get VAPID public key for push subscription
 * @returns Promise with VAPID public key
 */
async function getVapidKey(): Promise<VapidKeyResponse> {
  return client.get<VapidKeyResponse>('/api/notifications/vapid-key');
}

/**
 * Subscribe to push notifications
 * @param subscription PushSubscription object from PushManager
 * @returns Promise with subscription result
 */
async function subscribePush(subscription: PushSubscription): Promise<SubscribeResponse> {
  return client.post<SubscribeResponse>('/api/notifications/subscribe', { subscription });
}

/**
 * Unsubscribe from push notifications
 * @param endpoint Subscription endpoint URL
 * @returns Promise with unsubscription result
 */
async function unsubscribePush(endpoint: string): Promise<UnsubscribeResponse> {
  return client.delete<UnsubscribeResponse>('/api/notifications/unsubscribe', { endpoint });
}

/**
 * Send a test push notification (for debugging)
 * @param title Notification title
 * @param body Notification body
 * @returns Promise with test result
 */
async function sendTestNotification(title?: string, body?: string): Promise<{ success: boolean; sent: number; failed: number; message: string }> {
  return client.post('/api/notifications/test', { title, body });
}

export const notificationsApi = {
  getVapidKey,
  subscribePush,
  unsubscribePush,
  sendTestNotification,
};
