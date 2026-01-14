'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
    User,
    Mail,
    GraduationCap,
    Award,
    Leaf,
    TrendingUp,
    Calendar,
    Lock,
    Edit,
    ArrowLeft,
    MessageSquare,
    UserPlus,
    Camera,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase/auth';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const params = useParams();
    const router = useRouter();
    const userId = params?.userId as string;

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        displayName: '',
        bio: '',
        isEmailPublic: false,
        isStudentIdPublic: false,
    });

    const loadProfile = useCallback(async () => {
        try {
            const res = await fetch(`/api/profile/${userId}`);
            const data = await res.json();

            if (data.success) {
                setProfile(data.profile);
                setEditData({
                    displayName: data.profile.displayName,
                    bio: data.profile.bio,
                    isEmailPublic: data.profile.isEmailPublic || false,
                    isStudentIdPublic: data.profile.isStudentIdPublic || false,
                });
            } else {
                toast.error('Không thể tải profile');
            }
        } catch (error) {
            toast.error('Lỗi khi tải profile');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleSaveProfile = async () => {
        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData),
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Đã cập nhật profile');
                setIsEditing(false);
                loadProfile();
            } else {
                toast.error('Không thể cập nhật');
            }
        } catch (error) {
            toast.error('Lỗi khi cập nhật');
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const uploadToast = toast.loading('Đang upload avatar...');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/profile/avatar', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (data.success) {
                toast.dismiss(uploadToast);
                toast.success('Đã cập nhật avatar');
                loadProfile();
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            toast.dismiss(uploadToast);
            toast.error(error.message || 'Upload thất bại');
        }
    };

    const handleSendMessage = async () => {
        try {
            const res = await fetch('/api/messaging/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otherUserId: userId }),
            });

            const data = await res.json();

            if (data.success) {
                router.push(`/messages?conversationId=${data.conversationId}`);
            }
        } catch (error) {
            toast.error('Không thể mở chat');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center">
                <div className="text-primary-600">Đang tải...</div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-dark-600">Không tìm thấy người dùng</p>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-xl"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    const getRankColor = (rank: string) => {
        const colors: Record<string, string> = {
            seed: 'text-gray-600',
            sprout: 'text-green-600',
            sapling: 'text-green-700',
            tree: 'text-green-800',
            forest: 'text-emerald-900',
        };
        return colors[rank] || 'text-gray-600';
    };

    const getRankEmoji = (rank: string) => {
        const emojis: Record<string, string> = {
            seed: '🌱',
            sprout: '🌿',
            sapling: '🌳',
            tree: '🌲',
            forest: '🌍',
        };
        return emojis[rank] || '🌱';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md shadow-soft sticky top-0 z-40 border-b border-primary-100">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Quay lại</span>
                    </button>
                    {profile.isOwnProfile && !isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition"
                        >
                            <Edit className="w-4 h-4" />
                            <span className="hidden sm:inline">Chỉnh sửa</span>
                        </button>
                    )}
                    {isEditing && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveProfile}
                                className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition"
                            >
                                Lưu
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8 pb-24 md:pb-8">
                {/* Avatar & Basic Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-soft p-6 sm:p-8 mb-6"
                >
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        {/* Avatar */}
                        <div className="relative group">
                            <Image
                                src={profile.avatar}
                                alt={profile.displayName}
                                width={120}
                                height={120}
                                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-primary-100"
                            />
                            {profile.isOwnProfile && (
                                <label className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600 transition shadow-lg">
                                    <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarUpload}
                                    />
                                </label>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 text-center sm:text-left">
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={editData.displayName}
                                    onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                                    className="text-2xl sm:text-3xl font-bold text-dark-900 mb-2 border-b-2 border-primary-300 focus:outline-none focus:border-primary-500 w-full"
                                />
                            ) : (
                                <h1 className="text-2xl sm:text-3xl font-bold text-dark-900 mb-2">
                                    {profile.displayName}
                                </h1>
                            )}

                            <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
                                <span className={`text-xl sm:text-2xl ${getRankColor(profile.rankLevel)}`}>
                                    {getRankEmoji(profile.rankLevel)}
                                </span>
                                <span className={`font-semibold ${getRankColor(profile.rankLevel)} capitalize`}>
                                    {profile.rankLevel}
                                </span>
                            </div>

                            {isEditing ? (
                                <textarea
                                    value={editData.bio}
                                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                                    placeholder="Viết vài dòng về bạn..."
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    rows={3}
                                />
                            ) : (
                                profile.bio && (
                                    <p className="text-dark-600 text-sm sm:text-base mb-4">
                                        {profile.bio}
                                    </p>
                                )
                            )}

                            {/* Action Buttons (for other users) */}
                            {!profile.isOwnProfile && (
                                <div className="flex gap-3 mt-4 justify-center sm:justify-start">
                                    <button
                                        onClick={handleSendMessage}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        Nhắn tin
                                    </button>
                                    {!profile.isFriend && (
                                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-dark-700 rounded-xl hover:bg-gray-300 transition">
                                            <UserPlus className="w-4 h-4" />
                                            Kết bạn
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Privacy Info */}
                    {isEditing && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <h3 className="font-semibold text-dark-900 mb-3">Cài đặt riêng tư</h3>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editData.isEmailPublic}
                                        onChange={(e) => setEditData({ ...editData, isEmailPublic: e.target.checked })}
                                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-dark-700">Hiển thị email công khai</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editData.isStudentIdPublic}
                                        onChange={(e) => setEditData({ ...editData, isStudentIdPublic: e.target.checked })}
                                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-dark-700">Hiển thị MSSV công khai</span>
                                </label>
                                <p className="text-xs text-dark-500">
                                    <Lock className="w-3 h-3 inline mr-1" />
                                    Nếu không chọn, chỉ bạn bè mới thấy thông tin này
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Contact Info (with privacy) */}
                    {!isEditing && (
                        <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                            {profile.emailVisible && (
                                <div className="flex items-center gap-3 text-sm text-dark-600">
                                    <Mail className="w-4 h-4 text-primary-500" />
                                    <span>{profile.emailVisible}</span>
                                </div>
                            )}
                            {profile.studentId && (
                                <div className="flex items-center gap-3 text-sm text-dark-600">
                                    <GraduationCap className="w-4 h-4 text-primary-500" />
                                    <span>MSSV: {profile.studentId}</span>
                                </div>
                            )}
                            {!profile.emailVisible && !profile.studentId && !profile.isOwnProfile && (
                                <div className="flex items-center gap-2 text-sm text-dark-400">
                                    <Lock className="w-4 h-4" />
                                    <span>Thông tin liên hệ ẩn</span>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-xl shadow-soft p-4 sm:p-6"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <Leaf className="w-5 h-5 text-primary-500" />
                            <span className="text-xs sm:text-sm text-dark-600 font-medium">Green Points</span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-primary-600">
                            {profile.greenPoints.toLocaleString()}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-xl shadow-soft p-4 sm:p-6"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <Award className="w-5 h-5 text-primary-500" />
                            <span className="text-xs sm:text-sm text-dark-600 font-medium">Ly đã cứu</span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-primary-600">
                            {profile.totalCupsSaved}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-xl shadow-soft p-4 sm:p-6"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="w-5 h-5 text-primary-500" />
                            <span className="text-xs sm:text-sm text-dark-600 font-medium">Streak hiện tại</span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-primary-600">
                            {profile.greenStreak} ngày
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-xl shadow-soft p-4 sm:p-6"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="w-5 h-5 text-primary-500" />
                            <span className="text-xs sm:text-sm text-dark-600 font-medium">Streak tốt nhất</span>
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-primary-600">
                            {profile.bestStreak} ngày
                        </p>
                    </motion.div>
                </div>

                {/* Achievements Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-2xl shadow-soft p-6 mb-6"
                >
                    <h2 className="text-lg sm:text-xl font-bold text-dark-900 mb-4">Thành tựu</h2>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                        {/* Placeholder achievements */}
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-2xl sm:text-3xl opacity-30 hover:opacity-100 transition cursor-pointer"
                            >
                                🏆
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Recent Posts Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white rounded-2xl shadow-soft p-6"
                >
                    <h2 className="text-lg sm:text-xl font-bold text-dark-900 mb-4">Bài viết gần đây</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {/* Placeholder posts */}
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center"
                            >
                                <span className="text-dark-400">Chưa có bài viết</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
