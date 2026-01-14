'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Gift, Award, X, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface Reward {
    rewardId: string;
    name: string;
    description: string;
    image: string;
    pointsCost: number;
    stock: number;
    category: 'voucher' | 'merchandise' | 'privilege' | 'charity';
    validUntil?: string;
}

interface RewardsStoreProps {
    userId: string;
    userPoints: number;
    onPointsUpdate?: (newPoints: number) => void;
}

export default function RewardsStore({ userId, userPoints, onPointsUpdate }: RewardsStoreProps) {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const [claiming, setClaiming] = useState(false);
    const [filter, setFilter] = useState<'all' | Reward['category']>('all');

    const fetchRewards = useCallback(async () => {
        try {
            const categoryParam = filter !== 'all' ? `?category=${filter}` : '';
            const res = await fetch(`/api/rewards${categoryParam}`);
            const data = await res.json();

            if (data.success) {
                setRewards(data.rewards);
            }
        } catch (error) {
            toast.error('Không thể tải danh sách phần thưởng');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchRewards();
    }, [fetchRewards]);

    const handleClaimReward = async (reward: Reward) => {
        if (userPoints < reward.pointsCost) {
            toast.error(`Bạn cần ${reward.pointsCost - userPoints} điểm nữa`);
            return;
        }

        if (reward.stock <= 0) {
            toast.error('Phần thưởng đã hết');
            return;
        }

        setClaiming(true);
        try {
            const res = await fetch('/api/rewards/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    rewardId: reward.rewardId,
                }),
            });

            const data = await res.json();

            if (data.success) {
                toast.success(`🎁 Đã đổi ${reward.name}!`);
                setSelectedReward(null);

                // Update user points
                if (onPointsUpdate) {
                    onPointsUpdate(data.remainingPoints);
                }

                // Refresh rewards to update stock
                fetchRewards();
            } else {
                toast.error(data.error || 'Không thể đổi thưởng');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
        } finally {
            setClaiming(false);
        }
    };

    const getCategoryIcon = (category: Reward['category']) => {
        switch (category) {
            case 'voucher':
                return '🎫';
            case 'merchandise':
                return '🎁';
            case 'privilege':
                return '👑';
            case 'charity':
                return '🌳';
            default:
                return '🎁';
        }
    };

    const getCategoryColor = (category: Reward['category']) => {
        switch (category) {
            case 'voucher':
                return 'from-yellow-50 to-yellow-100 border-yellow-200';
            case 'merchandise':
                return 'from-purple-50 to-purple-100 border-purple-200';
            case 'privilege':
                return 'from-pink-50 to-pink-100 border-pink-200';
            case 'charity':
                return 'from-green-50 to-green-100 border-green-200';
            default:
                return 'from-gray-50 to-gray-100 border-gray-200';
        }
    };

    const filteredRewards = rewards;

    return (
        <div className="space-y-6">
            {/* Header with Points Balance */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-3xl p-6 text-white"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm opacity-90">Điểm của bạn</p>
                        <h2 className="text-4xl font-bold mt-1 flex items-center gap-2">
                            <Sparkles className="w-8 h-8" />
                            {userPoints.toLocaleString('vi-VN')}
                        </h2>
                    </div>
                    <Gift className="w-16 h-16 opacity-20" />
                </div>
            </motion.div>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {(['all', 'voucher', 'merchandise', 'privilege', 'charity'] as const).map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition ${filter === cat
                            ? 'bg-primary-500 text-white'
                            : 'bg-white text-dark-600 hover:bg-dark-50 border border-dark-200'
                            }`}
                    >
                        {cat === 'all' ? 'Tất cả' : cat === 'voucher' ? 'Voucher' : cat === 'merchandise' ? 'Quà tặng' : cat === 'privilege' ? 'Đặc quyền' : 'Từ thiện'}
                    </button>
                ))}
            </div>

            {/* Rewards Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="text-dark-500 mt-4">Đang tải...</p>
                </div>
            ) : filteredRewards.length === 0 ? (
                <div className="text-center py-12 bg-dark-50 rounded-3xl">
                    <p className="text-dark-500">Chưa có phần thưởng nào</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRewards.map((reward) => {
                        const canAfford = userPoints >= reward.pointsCost;
                        const outOfStock = reward.stock <= 0;

                        return (
                            <motion.div
                                key={reward.rewardId}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: outOfStock ? 1 : 1.02 }}
                                className={`bg-gradient-to-br ${getCategoryColor(reward.category)} rounded-2xl p-4 border-2 cursor-pointer transition relative overflow-hidden ${outOfStock ? 'opacity-50' : ''
                                    }`}
                                onClick={() => !outOfStock && setSelectedReward(reward)}
                            >
                                {/* Out of stock badge */}
                                {outOfStock && (
                                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                        Hết hàng
                                    </div>
                                )}

                                {/* Category icon */}
                                <div className="text-3xl mb-2">{getCategoryIcon(reward.category)}</div>

                                {/* Image placeholder */}
                                <div className="bg-white rounded-xl h-32 mb-3 flex items-center justify-center overflow-hidden">
                                    {reward.image ? (
                                        <Image
                                            src={reward.image}
                                            alt={reward.name}
                                            width={150}
                                            height={128}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <span className="text-4xl">{getCategoryIcon(reward.category)}</span>
                                    )}
                                </div>

                                {/* Reward info */}
                                <h3 className="font-bold text-dark-800 text-lg mb-1">{reward.name}</h3>
                                <p className="text-dark-600 text-sm mb-3 line-clamp-2">{reward.description}</p>

                                {/* Points cost */}
                                <div className="flex items-center justify-between">
                                    <div className={`flex items-center gap-1 ${canAfford ? 'text-primary-600' : 'text-red-600'}`}>
                                        <Sparkles className="w-4 h-4" />
                                        <span className="font-bold">{reward.pointsCost.toLocaleString('vi-VN')}</span>
                                    </div>
                                    <div className="text-xs text-dark-500">
                                        Còn: {reward.stock}
                                    </div>
                                </div>

                                {/* Afford indicator */}
                                {!canAfford && !outOfStock && (
                                    <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Thiếu {(reward.pointsCost - userPoints).toLocaleString('vi-VN')} điểm
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Claim Confirmation Modal */}
            <AnimatePresence>
                {selectedReward && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                        onClick={() => !claiming && setSelectedReward(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl p-6 max-w-md w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close button */}
                            <button
                                onClick={() => !claiming && setSelectedReward(null)}
                                className="absolute top-4 right-4 p-2 hover:bg-dark-100 rounded-full transition"
                                disabled={claiming}
                            >
                                <X className="w-6 h-6" />
                            </button>

                            {/* Reward image */}
                            <div className="text-center mb-4">
                                <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-6 mx-auto w-fit">
                                    <span className="text-6xl">{getCategoryIcon(selectedReward.category)}</span>
                                </div>
                            </div>

                            {/* Reward details */}
                            <h3 className="text-2xl font-bold text-dark-800 text-center mb-2">
                                {selectedReward.name}
                            </h3>
                            <p className="text-dark-600 text-center mb-6">
                                {selectedReward.description}
                            </p>

                            {/* Points info */}
                            <div className="bg-dark-50 rounded-xl p-4 mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-dark-600">Giá:</span>
                                    <span className="font-bold text-primary-600 flex items-center gap-1">
                                        <Sparkles className="w-4 h-4" />
                                        {selectedReward.pointsCost.toLocaleString('vi-VN')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-dark-600">Điểm hiện tại:</span>
                                    <span className="font-bold">{userPoints.toLocaleString('vi-VN')}</span>
                                </div>
                                <div className="border-t border-dark-200 pt-2 mt-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-dark-600">Còn lại sau khi đổi:</span>
                                        <span className="font-bold text-lg">
                                            {(userPoints - selectedReward.pointsCost).toLocaleString('vi-VN')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedReward(null)}
                                    disabled={claiming}
                                    className="flex-1 bg-dark-100 text-dark-800 rounded-xl py-3 font-semibold hover:bg-dark-200 transition disabled:opacity-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={() => handleClaimReward(selectedReward)}
                                    disabled={claiming || userPoints < selectedReward.pointsCost}
                                    className="flex-1 bg-primary-500 text-white rounded-xl py-3 font-semibold hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {claiming ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-5 h-5" />
                                            Đổi thưởng
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
