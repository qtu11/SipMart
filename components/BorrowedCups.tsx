'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Clock, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { authFetch } from '@/lib/supabase/authFetch';
import Link from 'next/link';

interface BorrowedCup {
    transactionId: string;
    cupId: string;
    borrowStoreId: string;
    storeName: string;
    borrowTime: string;
    dueTime: string;
    depositAmount: number;
    status: 'ongoing' | 'completed' | 'overdue';
    borrowStoreName?: string;
}

export default function BorrowedCups() {
    const [borrowed, setBorrowed] = useState<BorrowedCup[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBorrowed = async () => {
            try {
                const res = await authFetch('/api/user/borrowed-cups');
                if (res.ok) {
                    const data = await res.json();
                    setBorrowed(data.borrowedCups || []);
                }
            } catch (error) {
                console.error('Error fetching borrowed cups:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBorrowed();
        // Refresh every 30s
        const interval = setInterval(fetchBorrowed, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return null;
    if (borrowed.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-primary-50 to-white rounded-2xl p-3 md:p-4 shadow-sm border border-primary-100 mb-4 md:mb-6"
        >
            <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                        <Coffee className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm md:text-base">Ly đang mượn</h3>
                        <p className="text-xs text-gray-500">
                            {borrowed.length} ly cần trả
                        </p>
                    </div>
                </div>
                <Link
                    href="/profile"
                    className="text-xs text-primary-600 font-semibold hover:text-primary-700"
                >
                    Xem tất cả →
                </Link>
            </div>

            <div className="space-y-2 md:space-y-3">
                <AnimatePresence>
                    {borrowed.slice(0, 3).map((cup) => {
                        const timeLeft = new Date(cup.dueTime).getTime() - Date.now();
                        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                        const isOverdue = timeLeft < 0;
                        const isNearDue = hoursLeft < 3 && hoursLeft >= 0;

                        return (
                            <motion.div
                                key={cup.transactionId}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className={`bg-white rounded-xl p-2 md:p-3 border-2 ${isOverdue
                                    ? 'border-red-200 bg-red-50/30'
                                    : isNearDue
                                        ? 'border-yellow-200 bg-yellow-50/30'
                                        : 'border-gray-100'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2 flex-wrap">
                                            <span className="font-mono text-xs md:text-sm font-bold text-gray-900 truncate">
                                                {cup.cupId}
                                            </span>
                                            {isOverdue ? (
                                                <span className="bg-red-100 text-red-700 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full font-semibold flex items-center gap-0.5 md:gap-1 flex-shrink-0">
                                                    <AlertCircle className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                                    Quá hạn
                                                </span>
                                            ) : isNearDue ? (
                                                <span className="bg-yellow-100 text-yellow-700 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full font-semibold flex items-center gap-0.5 md:gap-1 flex-shrink-0">
                                                    <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                                    Sắp đến hạn
                                                </span>
                                            ) : (
                                                <span className="bg-green-100 text-green-700 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full font-semibold flex items-center gap-0.5 md:gap-1 flex-shrink-0">
                                                    <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                                    Bình thường
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-600 mb-0.5 md:mb-1">
                                            <MapPin className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" />
                                            <span className="truncate">{cup.borrowStoreName || cup.storeName || 'Cửa hàng'}</span>
                                        </div>

                                        <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-500">
                                            <Clock className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" />
                                            <span>
                                                {isOverdue
                                                    ? `Quá hạn ${Math.abs(hoursLeft)}h`
                                                    : `Còn ${hoursLeft}h`}
                                            </span>
                                        </div>
                                    </div>

                                    <Link
                                        href="/scan"
                                        className="bg-primary-500 text-white text-[10px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 rounded-lg hover:bg-primary-600 font-semibold transition-colors whitespace-nowrap flex-shrink-0 h-fit"
                                    >
                                        Trả ly
                                    </Link>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {borrowed.length > 3 && (
                <Link
                    href="/profile"
                    className="block text-center text-xs text-primary-600 font-semibold mt-3 hover:text-primary-700"
                >
                    +{borrowed.length - 3} ly khác
                </Link>
            )}
        </motion.div>
    );
}
