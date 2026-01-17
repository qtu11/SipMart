import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Map, Wallet, TreeDeciduous, Trophy, Calendar, ScanLine, Users, ChevronRight, Sparkles, Zap } from 'lucide-react';
import NextImage from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import UserAvatar from '@/components/ui/UserAvatar';

interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    href: string;
    active?: boolean;
    badge?: string;
    delay?: number;
}

const SidebarItem = ({ icon, label, href, active, badge, delay = 0 }: SidebarItemProps) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: delay * 0.05, duration: 0.3 }}
    >
        <Link href={href}>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium group relative overflow-hidden ${active
                ? 'bg-gradient-to-r from-green-500/10 to-teal-500/10 text-green-700 shadow-sm border border-green-200/50'
                : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50/50 hover:text-green-600'
                }`}>
                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 to-teal-400/0 group-hover:from-green-400/5 group-hover:to-teal-400/5 transition-all duration-300" />

                <div className={`relative z-10 p-2 rounded-lg transition-all ${active
                    ? 'bg-gradient-to-br from-green-500 to-teal-500 text-white shadow-md shadow-green-500/25'
                    : 'bg-gray-100 text-gray-500 group-hover:bg-green-100 group-hover:text-green-600'}`}>
                    {icon}
                </div>
                <span className="relative z-10 flex-1">{label}</span>
                {badge && (
                    <span className="relative z-10 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {badge}
                    </span>
                )}
                <ChevronRight className={`w-4 h-4 relative z-10 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 ${active ? 'opacity-100' : ''}`} />
            </div>
        </Link>
    </motion.div>
);

export default function LeftSidebar({ user }: { user: any }) {
    const [stats, setStats] = useState({
        total_cups_saved: 0,
        green_points: 0,
        rank_level: 'seed',
        display_name: ''
    });

    useEffect(() => {
        const fetchUserStats = async () => {
            if (!user?.id) return;

            const { data, error } = await supabase
                .from('users')
                .select('total_cups_saved, green_points, rank_level, display_name')
                .eq('user_id', user.id)
                .single();

            if (data && !error) {
                setStats(data);
            }
        };

        fetchUserStats();
    }, [user?.id]);

    const [dailyChallenge, setDailyChallenge] = useState<any>(null);

    useEffect(() => {
        const fetchChallenge = async () => {
            const { data } = await supabase
                .from('challenges')
                .select('*')
                .eq('is_active', true)
                .eq('type', 'daily')
                .gt('end_date', new Date().toISOString())
                .limit(1)
                .maybeSingle();

            if (data) setDailyChallenge(data);
        };

        fetchChallenge();
    }, []);

    const rankConfig: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
        seed: { emoji: '🌱', label: 'Seed Rank', color: 'text-green-600', bg: 'bg-green-50' },
        sprout: { emoji: '🌿', label: 'Sprout Rank', color: 'text-emerald-600', bg: 'bg-emerald-50' },
        sapling: { emoji: '🌳', label: 'Sapling Rank', color: 'text-teal-600', bg: 'bg-teal-50' },
        tree: { emoji: '🌲', label: 'Tree Rank', color: 'text-cyan-600', bg: 'bg-cyan-50' },
        forest: { emoji: '🌍', label: 'Forest Rank', color: 'text-blue-600', bg: 'bg-blue-50' },
    };

    const currentRank = rankConfig[stats.rank_level] || rankConfig.seed;

    return (
        <div className="space-y-6">
            {/* Profile Card - Premium Design */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative bg-gradient-to-br from-white to-green-50/30 rounded-2xl p-5 shadow-lg shadow-green-500/5 border border-gray-100 overflow-hidden"
            >
                {/* Decorative elements */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-green-400/20 to-teal-400/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-5 -left-5 w-20 h-20 bg-gradient-to-br from-teal-400/15 to-cyan-400/15 rounded-full blur-xl" />

                <div className="relative z-10">
                    {/* Avatar & Name */}
                    <div className="flex items-center gap-4 mb-5">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="relative"
                        >
                            <UserAvatar
                                user={user}
                                name={stats.display_name}
                                className="w-14 h-14 rounded-2xl border-2 border-green-200 shadow-md shadow-green-500/20 bg-white"
                                showRankEmoji={false}
                            />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-lg flex items-center justify-center border-2 border-white text-[10px] z-10">
                                {currentRank.emoji}
                            </div>
                        </motion.div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 truncate text-lg">
                                {stats.display_name || user?.user_metadata?.full_name || 'Sinh viên'}
                            </h3>
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className={`inline-flex items-center gap-1 text-xs font-semibold ${currentRank.color} ${currentRank.bg} px-2.5 py-1 rounded-lg border border-green-200/50 uppercase tracking-wide`}
                            >
                                <Sparkles className="w-3 h-3" />
                                {currentRank.label}
                            </motion.span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <motion.div
                            whileHover={{ scale: 1.02, y: -2 }}
                            className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-100 shadow-sm cursor-default"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                                    <span className="text-sm">🥤</span>
                                </div>
                                <span className="text-[10px] text-gray-500 uppercase font-medium tracking-wide">Ly đã cứu</span>
                            </div>
                            <div className="font-black text-2xl text-gray-900">{stats.total_cups_saved || 0}</div>
                        </motion.div>
                        <motion.div
                            whileHover={{ scale: 1.02, y: -2 }}
                            className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-gray-100 shadow-sm cursor-default"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 bg-teal-100 rounded-lg flex items-center justify-center">
                                    <Zap className="w-3 h-3 text-teal-600" />
                                </div>
                                <span className="text-[10px] text-gray-500 uppercase font-medium tracking-wide">Điểm xanh</span>
                            </div>
                            <div className="font-black text-2xl text-gray-900">{stats.green_points || 0}</div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Navigation Menu - Animated */}
            <nav className="space-y-1">
                <SidebarItem icon={<ScanLine className="w-5 h-5" />} label="Quét QR" href="/scan" delay={0} />
                <SidebarItem icon={<Map className="w-5 h-5" />} label="Bản đồ Eco" href="/map" delay={1} />
                <SidebarItem icon={<Wallet className="w-5 h-5" />} label="Ví điện tử" href="/wallet" delay={2} />
                <SidebarItem icon={<TreeDeciduous className="w-5 h-5" />} label="Vườn cây ảo" href="/garden" delay={3} />
                <SidebarItem icon={<Trophy className="w-5 h-5" />} label="Thử thách" href="/challenges" delay={4} />
                <SidebarItem icon={<Calendar className="w-5 h-5" />} label="Sự kiện" href="/events" delay={5} />
                <SidebarItem icon={<Users className="w-5 h-5" />} label="Đăng ký đối tác" href="/partner/register" delay={6} />
            </nav>

            {/* Daily Challenge Widget - Premium */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="relative bg-gradient-to-br from-green-500 via-green-600 to-teal-600 rounded-2xl p-5 text-white shadow-xl shadow-green-500/30 overflow-hidden cursor-pointer group"
            >
                {/* Animated background elements */}
                <motion.div
                    animate={{
                        y: [0, -10, 0],
                        x: [0, 5, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"
                />
                <motion.div
                    animate={{
                        y: [0, 10, 0],
                        x: [0, -5, 0],
                        scale: [1, 1.15, 1]
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-0 left-0 w-24 h-24 bg-teal-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"
                />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Thử thách ngày
                        </span>
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Trophy className="w-5 h-5 text-yellow-300" />
                        </motion.div>
                    </div>
                    <h4 className="font-bold text-lg mb-1 leading-tight">
                        {dailyChallenge ? dailyChallenge.name : 'Chưa có thử thách'}
                    </h4>
                    <p className="text-sm text-white/80 mb-4">
                        {dailyChallenge
                            ? `Hoàn thành để nhận +${dailyChallenge.reward_points} điểm`
                            : 'Hãy quay lại vào ngày mai nhé!'}
                    </p>

                    {/* Progress bar */}
                    <div className="relative">
                        <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: dailyChallenge ? '0%' : '0%' }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="bg-gradient-to-r from-yellow-300 to-yellow-400 h-full rounded-full shadow-sm shadow-yellow-400/50"
                            />
                        </div>
                        <div className="flex justify-between mt-1 text-[10px] text-white/60 font-medium">
                            <span>0%</span>
                            <span>Bắt đầu thôi!</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
