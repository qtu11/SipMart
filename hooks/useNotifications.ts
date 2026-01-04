'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, onAuthChange } from '@/lib/firebase/auth';
import { 
  requestNotificationPermission, 
  onForegroundMessage,
  getNotificationPermission,
  isNotificationSupported 
} from '@/lib/firebase/messaging';
import { doc, setDoc, getDoc, collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'reminder';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  url?: string;
}

/**
 * Hook để quản lý push notifications
 */
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Check permission on mount
  useEffect(() => {
    if (!isNotificationSupported()) {
      setLoading(false);
      return;
    }

    setPermission(getNotificationPermission());

    // Listen for auth changes
    const unsubscribeAuth = onAuthChange(async (user) => {
      if (user) {
        // Request permission and get token
        const token = await requestNotificationPermission();
        if (token) {
          setFcmToken(token);
          // Save token to Firestore
          await saveFCMToken(user.uid, token);
        }
        // Load notifications
        loadNotifications(user.uid);
      } else {
        setFcmToken(null);
        setNotifications([]);
        setLoading(false);
      }
    });

    // Listen for foreground messages
    const unsubscribeMessage = onForegroundMessage((payload) => {
      const notification = payload.notification;
      if (notification) {
        toast.success(notification.title || 'Thông báo mới', {
          duration: 4000,
        });

        // Add to local notifications list
        const newNotification: Notification = {
          id: payload.data?.notificationId || Date.now().toString(),
          type: (payload.data?.type as any) || 'info',
          title: notification.title || '',
          message: notification.body || '',
          timestamp: new Date(),
          read: false,
          url: payload.data?.url,
        };

        setNotifications(prev => [newNotification, ...prev]);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeMessage();
    };
  }, []);

  /**
   * Save FCM token to Firestore
   */
  const saveFCMToken = async (userId: string, token: string) => {
    try {
      await setDoc(doc(db, 'users', userId), {
        fcmToken: token,
        fcmTokenUpdatedAt: new Date(),
      }, { merge: true });
      
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  };

  /**
   * Load notifications from Firestore
   */
  const loadNotifications = (userId: string) => {
    setLoading(true);
    
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = snapshot.docs
        .filter(doc => !doc.data().deleted) // Filter deleted
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: (data.type as any) || 'info',
            title: data.title || '',
            message: data.message || '',
            timestamp: data.timestamp?.toDate?.() || (data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date()),
            read: data.read || false,
            url: data.url,
          };
        });
      setNotifications(notifs);
      setLoading(false);
    }, (error) => {
      console.error('Error loading notifications:', error);
      setLoading(false);
    });

    return unsubscribe;
  };

  /**
   * Request notification permission manually
   */
  const requestPermission = async () => {
    if (!isNotificationSupported()) {
      toast.error('Trình duyệt không hỗ trợ notifications');
      return false;
    }

    const token = await requestNotificationPermission();
    if (token) {
      setFcmToken(token);
      setPermission('granted');
      
      const user = getCurrentUser();
      if (user) {
        await saveFCMToken(user.uid, token);
      }
      
      toast.success('Đã bật thông báo thành công!');
      return true;
    } else {
      setPermission('denied');
      toast.error('Bạn đã từ chối thông báo');
      return false;
    }
  };

  return {
    permission,
    fcmToken,
    notifications,
    loading,
    requestPermission,
    isSupported: isNotificationSupported(),
  };
}

