'use client';

import React, { useState } from 'react';
import { Search, Bell, Sun, Moon, User, ChevronDown, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardTopNavProps {
    darkMode?: boolean;
    onToggleDarkMode?: () => void;
    adminName?: string;
    adminEmail?: string;
    notificationCount?: number;
}

export default function DashboardTopNav({
    darkMode = false,
    onToggleDarkMode,
    adminName = 'Admin User',
    adminEmail = 'admin@sipsmart.vn',
    notificationCount = 3,
}: DashboardTopNavProps) {
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    return (
        <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-6 py-3">
                {/* Left: Search */}
                <div className="relative w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm người dùng, giao dịch, tài sản..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                    {/* Dark Mode Toggle */}
                    <button
                        onClick={onToggleDarkMode}
                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        {darkMode ? (
                            <Sun className="w-5 h-5" />
                        ) : (
                            <Moon className="w-5 h-5" />
                        )}
                    </button>

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <Bell className="w-5 h-5" />
                            {notificationCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {notificationCount > 9 ? '9+' : notificationCount}
                                </span>
                            )}
                        </button>

                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                                >
                                    <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                                        <h4 className="font-semibold text-slate-900 dark:text-white">Thông báo</h4>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="p-4 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
                                                <p className="text-sm text-slate-900 dark:text-white font-medium">
                                                    Cảnh báo: 5 xe pin yếu
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1">2 phút trước</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-3 text-center">
                                        <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                                            Xem tất cả
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Profile */}
                    <div className="relative">
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex items-center gap-3 p-1.5 pr-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                                {adminName.charAt(0).toUpperCase()}
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{adminName}</p>
                                <p className="text-xs text-slate-500">Super Admin</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                        </button>

                        <AnimatePresence>
                            {showProfileMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                                >
                                    <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                                        <p className="font-semibold text-slate-900 dark:text-white">{adminName}</p>
                                        <p className="text-sm text-slate-500">{adminEmail}</p>
                                    </div>
                                    <div className="p-2">
                                        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                                            <User className="w-4 h-4" />
                                            Hồ sơ
                                        </button>
                                        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                                            <Settings className="w-4 h-4" />
                                            Cài đặt
                                        </button>
                                    </div>
                                    <div className="p-2 border-t border-slate-200 dark:border-slate-700">
                                        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                            <LogOut className="w-4 h-4" />
                                            Đăng xuất
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
