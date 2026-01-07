'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Send, Users, Filter, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface BroadcastFormData {
    type: 'info' | 'warning' | 'promotion' | 'maintenance' | 'event';
    title: string;
    message: string;
    imageUrl?: string;
    actionUrl?: string;
    targetAudience: 'all' | 'active' | 'inactive' | 'new' | 'premium';
    targetRank?: 'seed' | 'sprout' | 'sapling' | 'tree' | 'forest';
    priority: number;
    startAt?: string;
    endAt?: string;
}

const notificationTypes = [
    { value: 'info', label: 'ℹ️ Thông tin', color: 'bg-blue-500' },
    { value: 'warning', label: '⚠️ Cảnh báo', color: 'bg-yellow-500' },
    { value: 'promotion', label: '🎁 Khuyến mãi', color: 'bg-green-500' },
    { value: 'maintenance', label: '🔧 Bảo trì', color: 'bg-gray-500' },
    { value: 'event', label: '🎉 Sự kiện', color: 'bg-purple-500' },
];

const targetAudiences = [
    { value: 'all', label: '👥 Tất cả người dùng' },
    { value: 'active', label: '🟢 Đang hoạt động (7 ngày)' },
    { value: 'inactive', label: '💤 Không hoạt động (30 ngày)' },
    { value: 'new', label: '🆕 Người dùng mới (7 ngày)' },
    { value: 'premium', label: '⭐ Premium (Tree/Forest)' },
];

const ranks = [
    { value: '', label: 'Tất cả rank' },
    { value: 'seed', label: '🌱 Seed' },
    { value: 'sprout', label: '🌿 Sprout' },
    { value: 'sapling', label: '🌳 Sapling' },
    { value: 'tree', label: '🌲 Tree' },
    { value: 'forest', label: '🏔️ Forest' },
];

export default function NotificationBroadcast() {
    const [formData, setFormData] = useState<BroadcastFormData>({
        type: 'info',
        title: '',
        message: '',
        targetAudience: 'all',
        priority: 0,
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ usersNotified: number } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.message) {
            toast.error('Vui lòng điền tiêu đề và nội dung');
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/admin/notifications/broadcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN || ''}`,
                },
                body: JSON.stringify({
                    ...formData,
                    targetRank: formData.targetRank || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to broadcast');
            }

            setResult({ usersNotified: data.data.usersNotified });
            toast.success(`Đã gửi thông báo đến ${data.data.usersNotified} người dùng!`);

            // Reset form
            setFormData({
                type: 'info',
                title: '',
                message: '',
                targetAudience: 'all',
                priority: 0,
            });

        } catch (error) {
            toast.error((error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                    <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Gửi Thông Báo Hệ Thống
                    </h2>
                    <p className="text-sm text-gray-500">Broadcast đến người dùng</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Notification Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Loại thông báo
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {notificationTypes.map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, type: type.value as any })}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${formData.type === type.value
                                        ? `${type.color} text-white shadow-lg scale-105`
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                                    }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tiêu đề *
                    </label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="VD: 🎉 Khuyến mãi đặc biệt!"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                    />
                </div>

                {/* Message */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nội dung *
                    </label>
                    <textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Nhập nội dung thông báo..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        required
                    />
                </div>

                {/* Target Audience */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Filter className="w-4 h-4 inline mr-1" />
                        Đối tượng nhận
                    </label>
                    <select
                        value={formData.targetAudience}
                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    >
                        {targetAudiences.map((audience) => (
                            <option key={audience.value} value={audience.value}>
                                {audience.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Target Rank (Optional) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rank cụ thể (tùy chọn)
                    </label>
                    <select
                        value={formData.targetRank || ''}
                        onChange={(e) => setFormData({ ...formData, targetRank: e.target.value as any || undefined })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    >
                        {ranks.map((rank) => (
                            <option key={rank.value} value={rank.value}>
                                {rank.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Optional Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            URL hình ảnh (tùy chọn)
                        </label>
                        <input
                            type="url"
                            value={formData.imageUrl || ''}
                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            placeholder="https://..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Link bấm vào (tùy chọn)
                        </label>
                        <input
                            type="text"
                            value={formData.actionUrl || ''}
                            onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                            placeholder="/rewards hoặc https://..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg'
                        }`}
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Đang gửi...
                        </>
                    ) : (
                        <>
                            <Send className="w-5 h-5" />
                            Gửi Thông Báo
                        </>
                    )}
                </motion.button>
            </form>

            {/* Result */}
            {result && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl"
                >
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <div>
                            <p className="font-semibold text-green-800 dark:text-green-200">
                                Gửi thành công!
                            </p>
                            <p className="text-sm text-green-600 dark:text-green-300">
                                Đã gửi thông báo đến {result.usersNotified} người dùng
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
