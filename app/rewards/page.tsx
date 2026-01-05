'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Gift, TrendingUp, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getCurrentUserAsync } from '@/lib/supabase/auth';
import RewardsStore from '@/components/RewardsStore';
import toast from 'react-hot-toast';

interface UserRewardClaim {
    claimId: string;
    rewardName: string;
    rewardImage: string;
    pointsUsed: number;
    status: string;
    claimedAt: string;
    usedAt?: string;
}

export default function RewardsPage() {
    const [activeTab, setActiveTab] = useState<'store' | 'claims' | 'achievements'>('store');
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [userPoints, setUserPoints] = useState(0);
    const [claims, setClaims] = useState<UserRewardClaim[]>([]);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (activeTab === 'claims' && user) {
            fetchUserClaims();
        }
    }, [activeTab, user]);

    const checkAuth = async () => {
        try {
            const currentUser = await getCurrentUserAsync();
            if (!currentUser) {
                toast.error('Vui lòng đăng nhập');
                router.push('/auth/login');
                return;
            }

            setUser(currentUser);

            // Fetch user points
            const res = await fetch(`/api/gamification/points?userId=${currentUser.id}`);
            const data = await res.json();

            if (data.success) {
                setUserPoints(data.currentPoints);
            }
        } catch (error) {
            toast.error('Lỗi khi tải thông tin người dùng');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserClaims = async () => {
        if (!user) return;

        try {
            const res = await fetch(`/api/rewards?userId=${user.id}`);
            const data = await res.json();

            if (data.success) {
                setClaims(data.claims);
            }
        } catch (error) {
            toast.error('Không thể tải lịch sử đổi thưởng');
        }
    };

    const handlePointsUpdate = (newPoints: number) => {
        setUserPoints(newPoints);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="text-dark-500 mt-4">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
            {/* Header */}
            <header className="bg-white shadow-soft px-4 py-4 sticky top-0 z-10">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-2xl font-bold text-dark-800">🎁 Cửa hàng Phần thưởng</h1>
                    <p className="text-dark-500 text-sm mt-1">Đổi điểm lấy quà tặng thú vị</p>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-6">
                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    <button
                        onClick={() => setActiveTab('store')}
                        className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition flex items-center gap-2 ${activeTab === 'store'
                                ? 'bg-primary-500 text-white'
                                : 'bg-white text-dark-600 hover:bg-dark-50 border border-dark-200'
                            }`}
                    >
                        <Gift className="w-5 h-5" />
                        Cửa hàng
                    </button>
                    <button
                        onClick={() => setActiveTab('claims')}
                        className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition flex items-center gap-2 ${activeTab === 'claims'
                                ? 'bg-primary-500 text-white'
                                : 'bg-white text-dark-600 hover:bg-dark-50 border border-dark-200'
                            }`}
                    >
                        <TrendingUp className="w-5 h-5" />
                        Lịch sử đổi thưởng
                    </button>
                    <button
                        onClick={() => setActiveTab('achievements')}
                        className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition flex items-center gap-2 ${activeTab === 'achievements'
                                ? 'bg-primary-500 text-white'
                                : 'bg-white text-dark-600 hover:bg-dark-50 border border-dark-200'
                            }`}
                    >
                        <Award className="w-5 h-5" />
                        Thành tích
                    </button>
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'store' && (
                        <motion.div
                            key="store"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <RewardsStore
                                userId={user.id}
                                userPoints={userPoints}
                                onPointsUpdate={handlePointsUpdate}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'claims' && (
                        <motion.div
                            key="claims"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="space-y-4">
                                {claims.length === 0 ? (
                                    <div className="text-center py-12 bg-white rounded-3xl">
                                        <p className="text-dark-500">Bạn chưa đổi phần thưởng nào</p>
                                    </div>
                                ) : (
                                    claims.map((claim) => (
                                        <motion.div
                                            key={claim.claimId}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-white rounded-2xl p-4 border border-dark-100 hover:border-primary-200 transition"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <Gift className="w-8 h-8 text-primary-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-dark-800">{claim.rewardName}</h3>
                                                    <p className="text-sm text-dark-500">
                                                        Đã dùng: {claim.pointsUsed.toLocaleString('vi-VN')} điểm
                                                    </p>
                                                    <p className="text-xs text-dark-400 mt-1">
                                                        {new Date(claim.claimedAt).toLocaleDateString('vi-VN')}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-medium ${claim.status === 'claimed'
                                                                ? 'bg-green-100 text-green-700'
                                                                : claim.status === 'pending'
                                                                    ? 'bg-yellow-100 text-yellow-700'
                                                                    : 'bg-red-100 text-red-700'
                                                            }`}
                                                    >
                                                        {claim.status === 'claimed'
                                                            ? 'Đã nhận'
                                                            : claim.status === 'pending'
                                                                ? 'Chờ xử lý'
                                                                : 'Hết hạn'}
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'achievements' && (
                        <motion.div
                            key="achievements"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <div className="text-center py-12 bg-white rounded-3xl">
                                <Award className="w-16 h-16 text-primary-500 mx-auto mb-4" />
                                <p className="text-dark-500">Tính năng thành tích đang được phát triển</p>
                                <p className="text-dark-400 text-sm mt-2">Sẽ ra mắt sớm!</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

// AnimatePresence needs to be imported
import { AnimatePresence } from 'framer-motion';
