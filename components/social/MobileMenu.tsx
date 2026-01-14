'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scan, Map, Wallet, TreePine, Trophy, Calendar, UserPlus, Users, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
}

const menuItems = [
    { icon: Scan, label: 'Quét QR', href: '/scan', color: 'text-green-600' },
    { icon: Map, label: 'Bản đồ Eco', href: '/stores', color: 'text-blue-600' },
    { icon: Wallet, label: 'Ví điện tử', href: '/wallet', color: 'text-purple-600' },
    { icon: TreePine, label: 'Vườn cây ảo', href: '/tree', color: 'text-green-500' },
    { icon: Trophy, label: 'Thử thách', href: '/challenges', color: 'text-yellow-600' },
    { icon: Calendar, label: 'Sự kiện', href: '/events', color: 'text-pink-600' },
    { icon: UserPlus, label: 'Đăng ký đối tác', href: '/partner', color: 'text-indigo-600' },
    { icon: Users, label: 'Bạn bè', href: '/friends', color: 'text-cyan-600' },
    { icon: Settings, label: 'Cài đặt', href: '/profile', color: 'text-gray-600' },
];

export default function MobileMenu({ isOpen, onClose, user }: MobileMenuProps) {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await supabase.auth.signOut();
            router.push('/login');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsLoggingOut(false);
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-[60] md:hidden"
                    />

                    {/* Menu Panel */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 h-full w-[280px] bg-white shadow-2xl z-[70] flex flex-col md:hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-500 to-green-600">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-white font-bold text-lg">Danh mục</h2>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            {/* User Info */}
                            <div className="flex items-center gap-3 text-white">
                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                                    {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold truncate text-sm">
                                        {user?.displayName || user?.name || 'Người dùng'}
                                    </div>
                                    <div className="text-xs text-white/80 truncate">
                                        {user?.email}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="flex-1 overflow-y-auto py-2">
                            {menuItems.map((item, index) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onClose}
                                    className="block"
                                >
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                                    >
                                        <div className={`w-10 h-10 rounded-xl ${item.color.replace('text-', 'bg-')}/10 flex items-center justify-center`}>
                                            <item.icon className={`w-5 h-5 ${item.color}`} />
                                        </div>
                                        <span className="font-medium text-gray-700">{item.label}</span>
                                    </motion.div>
                                </Link>
                            ))}

                            {/* Logout Button */}
                            <motion.button
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: menuItems.length * 0.05 }}
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 active:bg-red-100 transition-colors mt-2 disabled:opacity-50"
                            >
                                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                                    <LogOut className="w-5 h-5 text-red-600" />
                                </div>
                                <span className="font-medium text-red-600">
                                    {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                </span>
                            </motion.button>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-200 text-center text-xs text-gray-500">
                            SipMart © 2026
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
