'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Trophy, Droplets, Target, Brain, ArrowRight, Sparkles } from 'lucide-react';
import SocialLayout from '@/components/social/SocialLayout';
import { useAuth } from '@/hooks/useAuth';

export default function GamesHubPage() {
    const { user, loading } = useAuth();

    const games = [
        {
            id: 'tree',
            title: 'Tưới Cây Xanh',
            description: 'Chăm sóc cây ảo mỗi ngày để nhận Green Points và bảo vệ môi trường thật.',
            icon: <Droplets className="w-8 h-8 text-blue-500" />,
            color: 'from-blue-500 to-cyan-400',
            bg: 'bg-blue-50',
            href: '/games/tree-watering',
            status: 'HOT',
            points: '+10/ngày',
        },
        {
            id: 'cup',
            title: 'Hứng Ly Nhựa',
            description: 'Trò chơi phản xạ! Hứng ly sạch, né chai nhựa độc hại.',
            icon: <Target className="w-8 h-8 text-green-500" />,
            color: 'from-green-500 to-emerald-400',
            bg: 'bg-green-50',
            href: '/games/cup-catch',
            status: 'NEW',
            points: 'Top 10: 500 GP',
        },
        {
            id: 'quiz',
            title: 'Eco Quiz',
            description: 'Thử thách kiến thức về môi trường. Bạn có phải là chuyên gia sống xanh?',
            icon: <Brain className="w-8 h-8 text-purple-500" />,
            color: 'from-purple-500 to-pink-400',
            bg: 'bg-purple-50',
            href: '/games/eco-quiz',
            status: 'DAILY',
            points: '+50 GP/quiz',
        },
    ];

    if (loading) return null;

    return (
        <SocialLayout user={user}>
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
                {/* Header */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-green-600 to-teal-500 p-8 text-white shadow-xl">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white opacity-10 blur-3xl" />
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-yellow-400 opacity-20 blur-3xl" />

                    <div className="relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 mb-4"
                        >
                            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Game Center
                            </span>
                        </motion.div>

                        <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
                            Chơi Game <br />
                            <span className="text-yellow-300">Săn Green Points</span>
                        </h1>
                        <p className="text-green-50 max-w-lg text-lg mb-8">
                            Giải trí vơi các trò chơi thú vị, tích lũy điểm thưởng và quy đổi thành quà tặng hấp dẫn.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <Link href="/leaderboard">
                                <button className="bg-white text-green-700 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all flex items-center gap-2">
                                    <Trophy className="w-5 h-5" />
                                    Bảng Xếp Hạng
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Games Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {games.map((game, index) => (
                        <Link href={game.href} key={game.id} className="block group">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 h-full overflow-hidden relative"
                            >
                                {/* Status Badge */}
                                <div className={`absolute top-4 right-4 text-[10px] font-bold px-2 py-1 rounded-lg text-white bg-gradient-to-r ${game.color} shadow-lg z-10`}>
                                    {game.status}
                                </div>

                                <div className={`p-6 ${game.bg} bg-opacity-50 h-32 flex items-center justify-center relative overflow-hidden`}>
                                    <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-10`} />
                                    <div className="bg-white p-4 rounded-2xl shadow-sm z-10 group-hover:scale-110 transition-transform duration-500">
                                        {game.icon}
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-green-600 transition-colors">
                                            {game.title}
                                        </h3>
                                    </div>

                                    <p className="text-gray-500 text-sm mb-6 line-clamp-3">
                                        {game.description}
                                    </p>

                                    <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-100">
                                        <span className="font-semibold text-yellow-600 flex items-center gap-1">
                                            <Sparkles className="w-4 h-4" />
                                            {game.points}
                                        </span>
                                        <span className="text-gray-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                            Chơi ngay <ArrowRight className="w-4 h-4" />
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </SocialLayout>
    );
}
