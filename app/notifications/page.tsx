'use client';

import { useState, useEffect } from 'react';
import { Bell, BellDot, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Notification {
  recipient_id: string;
  notification_id: string;
  type: string;
  title: string;
  message: string;
  content_html: string | null;
  emoji: string | null;
  image_url: string | null;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  received_at: string;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.error('Fetch notifications error:', error);
      toast.error('Không thể tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (recipientId: string) => {
    try {
      const res = await fetch(`/api/notifications/${recipientId}/read`, {
        method: 'POST'
      });

      if (!res.ok) throw new Error('Failed to mark as read');

      // Update local state
      setNotifications(notifications.map(n =>
        n.recipient_id === recipientId
          ? { ...n, is_read: true, read_at: new Date().toISOString() }
          : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const displayNotifications = notifications.filter(n =>
    filter === 'all' ? true : !n.is_read
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary-500 to-primary-600 flex items-center justify-center relative">
              <Bell className="w-6 h-6 text-white" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-dark-900">Thông báo</h1>
              <p className="text-dark-600">
                {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Không có thông báo mới'}
              </p>
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-white text-dark-700 border border-dark-200'
                }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'unread'
                ? 'bg-primary-500 text-white'
                : 'bg-white text-dark-700 border border-dark-200'
                }`}
            >
              Chưa đọc
            </button>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-12 text-dark-600">Đang tải...</div>
        ) : displayNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-dark-300 mx-auto mb-3" />
            <p className="text-dark-600">
              {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayNotifications.map((notif) => (
              <NotificationCard
                key={notif.recipient_id}
                notification={notif}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationCard({
  notification,
  onMarkAsRead
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'promotion':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'event':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'maintenance':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-soft border transition-all cursor-pointer ${notification.is_read ? 'border-dark-200' : 'border-primary-300 bg-primary-50/30'
        }`}
      onClick={() => {
        setExpanded(!expanded);
        if (!notification.is_read) {
          onMarkAsRead(notification.recipient_id);
        }
      }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon/Emoji */}
          <div className="flex-shrink-0">
            {notification.emoji ? (
              <div className="text-3xl">{notification.emoji}</div>
            ) : notification.is_read ? (
              <Bell className="w-6 h-6 text-dark-400" />
            ) : (
              <BellDot className="w-6 h-6 text-primary-500" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-dark-900">{notification.title}</h3>
              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getTypeColor(notification.type)}`}>
                {notification.type}
              </span>
            </div>

            {/* Preview or Full Content */}
            {expanded ? (
              notification.content_html ? (
                <div
                  className="prose prose-sm max-w-none mt-2"
                  dangerouslySetInnerHTML={{ __html: notification.content_html }}
                />
              ) : (
                <p className="text-sm text-dark-700 mt-2 whitespace-pre-wrap">{notification.message}</p>
              )
            ) : (
              <p className="text-sm text-dark-600 line-clamp-2">
                {notification.content_html
                  ? notification.content_html.replace(/<[^>]*>/g, '').substring(0, 100) + '...'
                  : notification.message}
              </p>
            )}

            {/* Image */}
            {expanded && notification.image_url && (
              <img
                src={notification.image_url}
                alt={notification.title}
                className="mt-3 rounded-lg max-w-full h-auto"
              />
            )}

            {/* Action Button */}
            {expanded && notification.action_url && (
              <a
                href={notification.action_url}
                onClick={(e) => e.stopPropagation()}
                className="inline-block mt-3 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600"
              >
                Xem chi tiết →
              </a>
            )}

            {/* Footer */}
            <div className="flex items-center gap-3 mt-2 text-xs text-dark-500">
              <span>{new Date(notification.created_at).toLocaleString('vi-VN')}</span>
              {notification.is_read && (
                <>
                  <span>•</span>
                  <CheckCircle className="w-3.5 h-3.5 inline" />
                  <span>Đã đọc</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
