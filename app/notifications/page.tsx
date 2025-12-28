'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import { getCurrentUserAsync, onAuthChange } from '@/lib/supabase/auth';
import { useRouter } from 'next/navigation';
import { useSupabaseNotifications } from '@/hooks/useSupabaseNotifications';
import toast from 'react-hot-toast';

interface Notification {
  notification_id?: string;
  id?: string; // For compatibility
  type: 'success' | 'warning' | 'info' | 'reminder';
  title: string;
  message: string;
  timestamp: string | Date;
  read: boolean;
  url?: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = await getCurrentUserAsync();
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }
      setUser(currentUser);
    };

    checkAuth();

    const unsubscribe = onAuthChange((currentUser) => {
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, [router]);

  const { notifications, loading, unreadCount, markAsRead, deleteNotification } = 
    useSupabaseNotifications(user?.uid || null);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      toast.success('Đã đánh dấu đã đọc');
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      toast.success('Đã xóa thông báo');
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleNotificationClick = (notif: Notification) => {
    if (notif.url) {
      router.push(notif.url);
    }
    const notificationId = notif.notification_id || notif.id;
    if (!notif.read && notificationId) {
      handleMarkAsRead(notificationId);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-primary-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'reminder':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-primary-600" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-primary-50 border-primary-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      case 'reminder':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-white border-dark-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="text-primary-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <header className="bg-white/80 backdrop-blur-md shadow-soft px-4 py-4 border-b border-primary-100">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-dark-800">
            Thông báo {unreadCount > 0 && `(${unreadCount})`}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-primary-600">Đang tải...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-dark-300 mx-auto mb-4" />
            <p className="text-dark-500 mb-4">Chưa có thông báo nào</p>
          </div>
        ) : (
          notifications.map((notif, index) => {
            const notificationId = (notif as any).notification_id || (notif as any).id || '';
            const timestamp = typeof notif.timestamp === 'string' 
              ? new Date(notif.timestamp) 
              : notif.timestamp;
            
            return (
              <motion.div
                key={notificationId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleNotificationClick({ ...notif, id: notificationId, timestamp })}
                className={`bg-white rounded-2xl p-5 shadow-xl border-2 cursor-pointer hover:shadow-2xl transition ${getBgColor(notif.type)} ${
                  !notif.read ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-dark-800 mb-1">{notif.title}</h3>
                        <p className="text-sm text-dark-600 mb-2">{notif.message}</p>
                        <p className="text-xs text-dark-400">
                          {timestamp.toLocaleString('vi-VN', {
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {!notif.read && (
                          <button
                            onClick={() => handleMarkAsRead(notificationId)}
                            className="text-xs text-primary-600 font-semibold hover:underline"
                          >
                            Đánh dấu đã đọc
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notificationId)}
                          className="w-8 h-8 hover:bg-red-50 rounded-lg flex items-center justify-center transition"
                        >
                          <X className="w-4 h-4 text-dark-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </main>
    </div>
  );
}

