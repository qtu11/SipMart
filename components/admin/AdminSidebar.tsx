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
    Handshake
} from 'lucide-react';
import { useState } from 'react';
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

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-lg shadow-soft text-dark-600"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Sidebar Container */}
            <aside
                className={`
          fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-dark-100 z-40 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="p-6 border-b border-dark-100">
                        <Link href="/admin" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold">
                                A
                            </div>
                            <span className="font-bold text-xl text-dark-800">Admin</span>
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
                                    className={`
                    flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors
                    ${isActive
                                            ? 'bg-primary-50 text-primary-600'
                                            : 'text-dark-600 hover:bg-dark-50 hover:text-dark-900'
                                        }
                  `}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary-500' : 'text-dark-400'}`} />
                                    {item.title}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-dark-100">
                        <Link
                            href="/"
                            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-dark-600 hover:bg-dark-50"
                        >
                            Back to App
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-black/20 z-30 md:hidden backdrop-blur-sm"
                />
            )}
        </>
    );
}
