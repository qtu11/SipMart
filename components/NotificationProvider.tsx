'use client';

import { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

/**
 * Provider component để initialize notifications
 * Nên được đặt ở root layout
 */
export function NotificationProvider() {
  const { permission, requestPermission, isSupported } = useNotifications();

  // Auto request permission sau 2s nếu chưa có
  useEffect(() => {
    if (isSupported && permission === 'default') {
      const timer = setTimeout(() => {
        // Có thể tự động request hoặc để user click
        // requestPermission();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, permission]);

  return null;
}

