import React, { useState, useEffect } from 'react';
import { Search, Bell, MessageCircle, User, Leaf, UserSearch } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface SocialHeaderProps {
    user: any;
    onSearch: (query: string) => void;
    onNotificationClick?: () => void;
    onMessagesClick?: () => void;
    onFriendSearchClick?: () => void;
}

export default function SocialHeader({ user, onSearch, onNotificationClick, onMessagesClick, onFriendSearchClick }: SocialHeaderProps) {
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user?.id) return;
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('read', false);

            if (!error && count !== null) {
                setUnreadNotifications(count);
            }
        };

        fetchNotifications();
    }, [user?.id]);
    return (
        <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo & Search */}
                <div className="flex items-center gap-8 flex-1">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Leaf className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent hidden sm:block">
                            SipMart
                        </span>
                    </Link>

                    <div className="relative max-w-md w-full hidden md:block">
                        <input
                            type="text"
                            placeholder="Tìm bạn bè bằng MSSV hoặc tên..."
                            className="w-full bg-gray-100 border-none rounded-full py-2.5 pl-12 pr-4 focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                            onChange={(e) => onSearch(e.target.value)}
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                </div>

                {/* Navigation Actions */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Friend Search Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onFriendSearchClick}
                        className="md:hidden w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-green-50 text-gray-600 hover:text-green-600 transition-colors"
                        title="Tìm bạn bè"
                    >
                        <UserSearch className="w-5 h-5" />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onMessagesClick}
                        className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-green-50 text-gray-600 hover:text-green-600 transition-colors relative"
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onNotificationClick}
                        className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-green-50 text-gray-600 hover:text-green-600 transition-colors relative"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadNotifications > 0 && (
                            <span className="absolute top-2 right-2 min-w-[10px] h-[10px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white">
                                {unreadNotifications > 9 ? '' : ''}
                            </span>
                        )}
                    </motion.button>

                    <Link href="/profile">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                        >
                            <Image
                                src={user?.avatar || user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || user?.name || user?.email || 'User')}&background=random`}
                                alt="Avatar"
                                width={32}
                                height={32}
                                className="rounded-full object-cover border border-gray-200"
                                unoptimized={true}
                            />
                        </motion.div>
                    </Link>
                </div>
            </div>
        </header>
    );
}
