import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map, ScanLine, Wallet, UserCircle } from 'lucide-react';

export default function MobileBottomNav() {
    const pathname = usePathname();

    const navItems = [
        { icon: <Home className="w-6 h-6" />, label: 'Home', href: '/' },
        { icon: <Map className="w-6 h-6" />, label: 'Bản đồ', href: '/map' },
        { icon: <ScanLine className="w-6 h-6" />, label: 'Quét', href: '/scan', isCenter: true },
        { icon: <Wallet className="w-6 h-6" />, label: 'Ví', href: '/wallet' },
        { icon: <UserCircle className="w-6 h-6" />, label: 'Hồ sơ', href: '/profile' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg px-6 py-2 md:hidden">
            <div className="flex justify-between items-end">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;

                    if (item.isCenter) {
                        return (
                            <div key={item.href} className="relative -top-8 text-center px-1">
                                <Link href={item.href}>
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${isActive ? 'bg-primary-600 ring-4 ring-primary-100' : 'bg-primary-500'
                                        }`}>
                                        {item.icon}
                                    </div>
                                </Link>
                                <span className="text-xs font-medium text-gray-500 mt-1 block">{item.label}</span>
                            </div>
                        );
                    }

                    return (
                        <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center justify-center py-2 transition-colors">
                            <div className={`mb-1 ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
                                {item.icon}
                            </div>
                            <span className={`text-[10px] font-medium ${isActive ? 'text-primary-600' : 'text-gray-500'}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
