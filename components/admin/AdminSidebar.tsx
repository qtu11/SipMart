'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Store,
    ArrowLeftRight,
    Package,
    Settings,
    Menu,
    X,
    Ticket,
    Bell,
    Sparkles,
    Handshake,
    ArrowLeft,
    QrCode,
    Bike,
    DollarSign
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const menuItems = [
    {
        title: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
    },
    {
        title: 'Users',
        href: '/admin/users',
        icon: Users,
    },
    {
        title: 'Stores',
        href: '/admin/stores',
        icon: Store,
    },
    {
        title: 'Giao dịch',
        href: '/admin/transactions',
        icon: ArrowLeftRight,
    },
    {
        title: 'Kho Ly',
        href: '/admin/inventory',
        icon: Package,
    },
    {
        title: 'Quản lý QR',
        href: '/admin/qr-management',
        icon: QrCode,
    },
    {
        title: 'Xe điện',
        href: '/admin/ebike-management',
        icon: Bike,
    },
    {
        title: 'Tài chính',
        href: '/admin/financial-hub',
        icon: DollarSign,
    },
    {
        title: 'Vouchers',
        href: '/admin/vouchers',
        icon: Ticket,
    },
    {
        title: 'Thông báo',
        href: '/admin/notifications',
        icon: Bell,
    },
    {
        title: 'Vệ sinh',
        href: '/admin/hygiene',
        icon: Sparkles,
    },
    {
        title: 'Đối tác',
        href: '/admin/partners',
        icon: Handshake,
    },
    {
        title: 'Cài đặt',
        href: '/admin/settings',
        icon: Settings,
    },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(true);

    useEffect(() => {
        const checkDesktop = () => {
            setIsDesktop(window.innerWidth >= 768);
        };

        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    return (
        <>
            {/* Mobile Menu Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-dark-100 dark:border-dark-700 text-dark-600 dark:text-dark-200"
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <X className="w-6 h-6" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Menu className="w-6 h-6" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Sidebar Container */}
            <motion.aside
                initial={false}
                animate={isDesktop ? { x: 0 } : { x: isOpen ? 0 : '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed md:sticky top-0 left-0 h-screen w-64 bg-white dark:bg-dark-900 border-r border-dark-100 dark:border-dark-800 z-40"
            >
                <div className="h-full flex flex-col">
                    {/* Header với Gradient Logo */}
                    <div className="p-6 border-b border-dark-100 dark:border-dark-800 bg-gradient-to-br from-primary-50 to-white dark:from-dark-900 dark:to-dark-800">
                        <Link href="/admin" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-all duration-300">
                                <Sparkles className="w-6 h-6 text-white animate-pulse" />
                            </div>
                            <div>
                                <span className="font-bold text-xl text-dark-800 dark:text-white block">Admin</span>
                                <span className="text-xs text-dark-500 dark:text-dark-400">SipMart</span>
                            </div>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <motion.div
                                        whileHover={{ x: 4, scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`
                    flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all relative overflow-hidden
                    ${isActive
                                                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                                                : 'text-dark-600 dark:text-dark-300 hover:bg-dark-50 dark:hover:bg-dark-800/50'
                                            }
                  `}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl"
                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                        <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-white' : 'text-dark-400'}`} />
                                        <span className="relative z-10">{item.title}</span>
                                        {isActive && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="ml-auto w-1.5 h-1.5 bg-white rounded-full relative z-10"
                                            />
                                        )}
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-dark-100 dark:border-dark-800 bg-dark-50/50 dark:bg-dark-900/50">
                        <Link href="/">
                            <motion.div
                                whileHover={{ x: -4, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-dark-600 dark:text-dark-300 hover:bg-white dark:hover:bg-dark-800 transition-all"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Về Trang chủ
                            </motion.div>
                        </Link>
                    </div>
                </div>
            </motion.aside>

            {/* Overlay for mobile */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>
        </>
    );
}
