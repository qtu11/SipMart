'use client';

import { getToken, onMessage, Messaging } from 'firebase/messaging';
import { messaging as messagingInstance } from './config';

// Check if running in browser and service worker is supported
const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator;

const messaging: Messaging | null = messagingInstance;

/**
 * Request notification permission và lấy FCM token
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (!messaging || !isSupported) {
    console.warn('Firebase Messaging is not supported in this browser');
    return null;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    // Get FCM token
    const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY;
    if (!vapidKey) {
      console.warn('FCM VAPID key is not configured');
      return null;
    }

    if (!messaging) {
      console.warn('Messaging is not initialized');
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    });

    if (token) {
      console.log('FCM Token:', token);
      return token;
    } else {
      console.warn('No FCM token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

/**
 * Lắng nghe foreground messages (khi app đang mở)
 */
export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messaging) {
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
}

/**
 * Kiểm tra xem notification permission đã được cấp chưa
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isSupported) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Kiểm tra xem browser có hỗ trợ notifications không
 */
export function isNotificationSupported(): boolean {
  return isSupported && 'Notification' in window;
}

export { messaging };

