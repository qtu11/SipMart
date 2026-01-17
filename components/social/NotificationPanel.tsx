'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Bell, MessageCircle, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/supabase/authFetch';
import Link from 'next/link';

interface NotificationPanelProps {
    userId: string;
    onClose: () => void;
}

export default function NotificationPanel({ userId, onClose }: NotificationPanelProps) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        try {
            console.log('[NotificationPanel] Fetching notifications for user:', userId);
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20);

            console.log('[NotificationPanel] Result:', { data, error });

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchNotifications();

        // Realtime subscription
        const channel = supabase
            .channel('notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, fetchNotifications]);



    const markAsRead = async (notificationId: string) => {
        try {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('notification_id', notificationId);

            setNotifications((prev) =>
                prev.map((n) => (n.notification_id === notificationId ? { ...n, read: true } : n))
            );
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', userId)
                .eq('read', false);

            fetchNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'message':
                return <MessageCircle className="w-5 h-5 text-blue-500" />;
            case 'achievement':
                return <Award className="w-5 h-5 text-yellow-500" />;
            default:
                return <Bell className="w-5 h-5 text-green-500" />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 md:absolute md:inset-auto md:top-16 md:right-4 lg:right-8 w-full md:w-96 bg-white md:rounded-2xl shadow-2xl border-t md:border border-gray-200 z-50 max-h-screen md:max-h-[600px] flex flex-col"
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
                <h3 className="font-bold text-gray-900 text-lg">Thông báo</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={markAllAsRead}
                        className="text-xs text-green-600 hover:text-green-700 font-semibold"
                    >
                        Đánh dấu tất cả đã đọc
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Đang tải...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>Chưa có thông báo nào</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notifications.map((notif) => (
                            <motion.div
                                key={notif.notification_id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.read ? 'bg-green-50/30' : ''
                                    }`}
                                onClick={() => {
                                    if (!notif.read) markAsRead(notif.notification_id);
                                    if (notif.url) {
                                        onClose();
                                        window.location.href = notif.url;
                                    }
                                }}
                            >
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 mt-1">
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4
                                                className={`text-sm font-semibold ${!notif.read ? 'text-gray-900' : 'text-gray-700'
                                                    }`}
                                            >
                                                {notif.title}
                                            </h4>
                                            {!notif.read && (
                                                <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1.5"></span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                            {notif.message}
                                        </p>
                                        <span className="text-xs text-gray-400 mt-1 inline-block">
                                            {new Date(notif.created_at).toLocaleString('vi-VN', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                day: '2-digit',
                                                month: '2-digit',
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
