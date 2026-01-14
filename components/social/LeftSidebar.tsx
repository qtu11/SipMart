import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Map, Wallet, TreeDeciduous, Trophy, Calendar, ScanLine, Users } from 'lucide-react';
import NextImage from 'next/image';
import { supabase } from '@/lib/supabase';

interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    href: string;
    active?: boolean;
}

const SidebarItem = ({ icon, label, href, active }: SidebarItemProps) => (
    <Link href={href}>
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${active
            ? 'bg-green-50 text-green-700 shadow-sm'
            : 'text-gray-600 hover:bg-gray-50 hover:text-green-600'
            }`}>
            <div className={`${active ? 'text-green-600' : 'text-gray-500'}`}>
                {icon}
            </div>
            <span>{label}</span>
        </div>
    </Link>
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

    const rankEmojis: Record<string, string> = {
        seed: '🌱',
        sprout: '🌿',
        sapling: '🌳',
        tree: '🌲',
        forest: '🌍',
    };

    const rankLabels: Record<string, string> = {
        seed: 'Seed Rank',
        sprout: 'Sprout Rank',
        sapling: 'Sapling Rank',
        tree: 'Tree Rank',
        forest: 'Forest Rank',
    };

    return (
        <div className="space-y-6">
            {/* Short Profile Card */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="relative w-12 h-12 rounded-full border-2 border-green-100 overflow-hidden">
                        <NextImage
                            src={user?.avatar || user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(stats.display_name || user?.displayName || user?.email || 'User')}&background=random`}
                            alt={stats.display_name || "User profile"}
                            fill
                            className="object-cover"
                            unoptimized={true}
                        />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 truncate max-w-[150px]">
                            {stats.display_name || user?.user_metadata?.full_name || 'Sinh viên'}
                        </h3>
                        <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium border border-green-100 uppercase">
                            {rankEmojis[stats.rank_level] || '🌱'} {rankLabels[stats.rank_level] || 'Seed Rank'}
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center text-sm">
                    <div className="bg-gray-50 rounded-lg p-2">
                        <div className="font-bold text-gray-800">{stats.total_cups_saved || 0}</div>
                        <div className="text-[10px] text-gray-500">Ly đã cứu</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                        <div className="font-bold text-gray-800">{stats.green_points || 0}</div>
                        <div className="text-[10px] text-gray-500">Điểm xanh</div>
                    </div>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1">
                <SidebarItem icon={<ScanLine className="w-5 h-5" />} label="Quét QR" href="/scan" />
                <SidebarItem icon={<Map className="w-5 h-5" />} label="Bản đồ Eco" href="/map" />
                <SidebarItem icon={<Wallet className="w-5 h-5" />} label="Ví điện tử" href="/wallet" />
                <SidebarItem icon={<TreeDeciduous className="w-5 h-5" />} label="Vườn cây ảo" href="/garden" />
                <SidebarItem icon={<Trophy className="w-5 h-5" />} label="Thử thách" href="/challenges" />
                <SidebarItem icon={<Calendar className="w-5 h-5" />} label="Sự kiện" href="/events" />
                <SidebarItem icon={<Users className="w-5 h-5" />} label="Đăng ký đối tác" href="/partner/register" />
            </nav>

            {/* Mini Challenge Widget */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden group cursor-pointer">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-all"></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded block">Thử thách ngày</span>
                        <Trophy className="w-4 h-4 text-yellow-300" />
                    </div>
                    <h4 className="font-bold mb-1">
                        {dailyChallenge ? dailyChallenge.name : 'Chưa có thử thách'}
                    </h4>
                    <p className="text-xs opacity-90 mb-3">
                        {dailyChallenge
                            ? `Hoàn thành để nhận +${dailyChallenge.reward_points} điểm`
                            : 'Hãy quay lại vào ngày mai nhé!'}
                    </p>
                    <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-white h-full rounded-full transition-all duration-1000" style={{ width: dailyChallenge ? '0%' : '0%' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
