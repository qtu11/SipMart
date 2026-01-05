import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

interface Notification {
  notification_id: string;
  user_id: string;
  type: 'success' | 'warning' | 'info' | 'reminder';
  title: string;
  message: string;
  url?: string;
  data?: any;
  read: boolean;
  timestamp: string;
}

export function useSupabaseNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let channel: RealtimeChannel | null = null;

    async function fetchNotifications() {
      try {
        const { data, error: fetchError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false })
          .limit(50);

        if (fetchError) throw fetchError;

        setNotifications(data || []);
        setUnreadCount(data?.filter((n) => !n.read).length || 0);
        setLoading(false);

        // Setup Realtime subscription
        channel = supabase
          .channel(`notifications_${userId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setNotifications((prev) => [payload.new as Notification, ...prev]);
                if (!payload.new.read) {
                  setUnreadCount((prev) => prev + 1);
                }
              } else if (payload.eventType === 'UPDATE') {
                setNotifications((prev) =>
                  prev.map((n) =>
                    n.notification_id === payload.new.notification_id
                      ? (payload.new as Notification)
                      : n
                  )
                );
                if (payload.new.read && !payload.old.read) {
                  setUnreadCount((prev) => Math.max(0, prev - 1));
                }
              } else if (payload.eventType === 'DELETE') {
                setNotifications((prev) =>
                  prev.filter((n) => n.notification_id !== payload.old.notification_id)
                );
                if (!payload.old.read) {
                  setUnreadCount((prev) => Math.max(0, prev - 1));
                }
              }
            }
          )
          .subscribe();

        // Channel subscription is async, state will update automatically
      } catch (err) {
        logger.error('Error fetching notifications', { error: err });
        setError(err as Error);
        setLoading(false);
      }
    }

    fetchNotifications();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('notification_id', notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      logger.error('Error marking notification as read', { error: err });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('notification_id', notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.filter((n) => n.notification_id !== notificationId)
      );
      const notification = notifications.find((n) => n.notification_id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      logger.error('Error deleting notification', { error: err });
    }
  };

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    deleteNotification,
  };
}

