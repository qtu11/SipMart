'use client';

import { motion } from 'framer-motion';
import { Leaf, Droplets, Wind, Scale } from 'lucide-react';
import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/supabase/authFetch';

export default function ImpactStats() {
    const [stats, setStats] = useState({
        users: 1205,
        cups: 8540,
        plastic: 128.1, // kg
        co2: 450, // kg (estimated)
    });

    // Mock auto-increment for "live" feel
    useEffect(() => {
        const interval = setInterval(() => {
            setStats(prev => ({
                ...prev,
                cups: prev.cups + 1,
                plastic: prev.plastic + 0.015,
                co2: prev.co2 + 0.05
            }));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="py-24 bg-dark-900 text-white relative overflow-hidden">
            {/* Background patterns */}
            <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                    <div>
                        <motion.h2
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 leading-tight pt-10 sm:pt-0"
                        >
                            Tác động nhỏ <br />
                            <span className="text-primary-400">Thay đổi lớn</span>
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-gray-300 text-sm sm:text-lg mb-6 sm:mb-8 max-w-xl leading-relaxed"
                        >
                            Mỗi chiếc ly nhựa bạn từ chối sử dụng là một lời hứa với Trái đất.
                            Cộng đồng SipSmart đang nỗ lực từng giờ để giảm thiểu hàng tấn rác thải nhựa.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="grid grid-cols-2 gap-3 sm:gap-6 mb-8 sm:mb-0"
                        >
                            <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10">
                                <div className="text-xl sm:text-3xl font-bold text-primary-400 mb-1">{stats.cups.toLocaleString()}</div>
                                <div className="text-xs sm:text-sm text-gray-300 flex items-center gap-2">
                                    <Leaf className="w-3 h-3 sm:w-4 sm:h-4" /> Ly đã được mượn
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10">
                                <div className="text-xl sm:text-3xl font-bold text-teal-400 mb-1">{stats.plastic.toFixed(2)} kg</div>
                                <div className="text-xs sm:text-sm text-gray-300 flex items-center gap-2">
                                    <Scale className="w-3 h-3 sm:w-4 sm:h-4" /> Rác thải nhựa giảm
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-6">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="bg-gradient-to-br from-primary-600 to-primary-800 p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] text-center"
                        >
                            <div className="w-10 h-10 sm:w-16 sm:h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                                <Droplets className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
                            </div>
                            <h3 className="text-base sm:text-2xl font-bold mb-1 sm:mb-2">Tiết kiệm nước</h3>
                            <p className="text-xs sm:text-sm opacity-80 leading-snug">Quy trình rửa ly thông minh tiết kiệm 40% nước.</p>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="bg-gradient-to-br from-teal-600 to-teal-800 p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] text-center md:mt-8"
                        >
                            <div className="w-10 h-10 sm:w-16 sm:h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                                <Wind className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
                            </div>
                            <h3 className="text-base sm:text-2xl font-bold mb-1 sm:mb-2">Giảm CO2</h3>
                            <p className="text-xs sm:text-sm opacity-80 leading-snug">Giảm thiểu khí thải carbon từ sản xuất ly nhựa.</p>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
