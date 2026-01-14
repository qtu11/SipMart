'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    Store,
    Package,
    QrCode,
    LogOut,
    Settings,
    ChevronLeft,
    Menu
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Auth Guard
    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        }
        // In real app, check if user is actually a partner via API
    }, [user, loading, router]);

    if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

    // Special layout for registration page
    if (pathname === '/partner/register') {
        return <>{children}</>;
    }

    const menuItems = [
        { icon: LayoutDashboard, label: 'Tổng quan', href: '/partner' },
        { icon: Store, label: 'Cửa hàng', href: '/partner/stores' },
        { icon: Package, label: 'Kho ly', href: '/partner/inventory' },
        { icon: QrCode, label: 'Mã QR', href: '/partner/qr' },
        { icon: Settings, label: 'Cài đặt', href: '/partner/settings' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <AnimatePresence mode="wait">
                {(isSidebarOpen || !isMobile) && (
                    <motion.aside
                        initial={{ x: -280, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -280, opacity: 0 }}
                        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-xl lg:shadow-none`}
                    >
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">P</div>
                                <span className="font-bold text-xl text-gray-800">Partner Portal</span>
                            </div>
                            {isMobile && <button onClick={() => setSidebarOpen(false)}><ChevronLeft /></button>}
                        </div>

                        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                            {menuItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => isMobile && setSidebarOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                            ? 'bg-blue-50 text-blue-600 font-bold shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                            }`}
                                    >
                                        <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="p-4 border-t border-gray-100">
                            <div className="flex items-center gap-3 mb-4 px-4">
                                <Image
                                    src={user?.avatar || "https://ui-avatars.com/api/?name=Partner"}
                                    alt="User"
                                    width={40}
                                    height={40}
                                    className="rounded-full bg-gray-200"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-800 truncate">{user?.displayName || "Đối tác"}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={signOut}
                                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                            >
                                <LogOut className="w-5 h-5" />
                                Đăng xuất
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Mobile Sidebar Overlay */}
            {isMobile && isSidebarOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Top Header for Mobile */}
                <header className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-20">
                    <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg">
                        <Menu className="w-6 h-6 text-gray-600" />
                    </button>
                    <span className="font-bold text-gray-800">Partner Portal</span>
                    <div className="w-8" />
                </header>

                <div className="flex-1 overflow-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
