'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, Menu, ScanLine, Wallet, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface MobileBottomNavProps {
    onMenuClick?: () => void;
}

export default function MobileBottomNav({ onMenuClick }: MobileBottomNavProps = {}) {
    const pathname = usePathname();
    const router = useRouter();

    const navItems = [
        {
            label: 'Trang chủ',
            icon: Home,
            href: '/',
            active: pathname === '/',
        },
        {
            label: 'Ví',
            icon: Wallet,
            href: '/wallet',
            active: pathname === '/wallet',
        },
        {
            label: 'Quét', // Updated label
            icon: ScanLine,
            href: '/scan',
            active: pathname === '/scan',
            primary: true, // Center elevated button
        },
        {
            label: 'Cá nhân',
            icon: User,
            href: '/profile',
            active: pathname === '/profile',
        },
    ];

    return (
        <>
            {/* Spacer to prevent content from being hidden behind fixed nav */}
            <div className="h-20 md:hidden" />

            {/* Bottom Navigation - Only visible on mobile */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden z-50">
                {/* GRID 5 COLUMNS for perfect centering */}
                <div className="grid grid-cols-5 items-end justify-items-center px-1 py-2 safe-area-bottom w-full">
                    {navItems.map((item) => {
                        const Icon = item.icon;

                        if (item.primary) {
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => router.push(item.href)}
                                    className="relative flex flex-col items-center justify-end -mt-8 gap-1"
                                >
                                    {/* Elevated circular button */}
                                    <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform mb-1">
                                        <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                                    </div>
                                    <span className="text-xs font-medium text-gray-700">
                                        {item.label}
                                    </span>
                                </button>
                            );
                        }

                        return (
                            <button
                                key={item.label}
                                onClick={() => router.push(item.href)}
                                className={`relative flex flex-col items-center gap-1 px-1 py-2 rounded-xl transition-all w-full ${item.active
                                    ? 'text-primary-600'
                                    : 'text-gray-500 hover:text-primary-500 active:bg-gray-100'
                                    }`}
                            >
                                <div className="relative">
                                    <Icon
                                        className={`w-6 h-6 transition-all ${item.active ? 'scale-110' : 'scale-100'}`}
                                        strokeWidth={item.active ? 2.5 : 2}
                                    />
                                </div>
                                <span className={`text-xs font-medium ${item.active ? 'font-semibold' : ''}`}>
                                    {item.label}
                                </span>
                                {item.active && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full"
                                    />
                                )}
                            </button>
                        );
                    })}

                    {/* Menu Button */}
                    <button
                        onClick={onMenuClick}
                        className="relative flex flex-col items-center gap-1 px-1 py-2 rounded-xl transition-all text-gray-500 hover:text-primary-500 active:bg-gray-100 w-full"
                    >
                        <Menu className="w-6 h-6" strokeWidth={2} />
                        <span className="text-xs font-medium">Menu</span>
                    </button>
                </div>
            </nav>
        </>
    );
}
