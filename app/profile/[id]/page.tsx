'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    User, Mail, GraduationCap, Calendar, Shield, CheckCircle, Leaf, Droplets, Zap, Lock, MapPin, Phone
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/supabase/users'; // Using the client-safe wrapper or invoking server action if available
// Note: getUser in 'lib/supabase/users.ts' uses getAdmin() which is server-side only. 
// We need to fetch this via API or ensure we use a client-side fetch.
// Given the pattern, we'll fetch via API.

import SocialLayout from '@/components/social/SocialLayout';
import UserAvatar from '@/components/ui/UserAvatar';
import { supabase } from '@/lib/supabase';

export default function PublicProfilePage({ params }: { params: { id: string } }) {
    const [profileUser, setProfileUser] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const profileId = params.id;

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // 1. Get current logged in user
                const { data: { user } } = await supabase.auth.getUser();
                setCurrentUser(user);

                // 2. Fetch the target profile data
                // We'll call a new public API endpoint or use the existing structure
                // Since we don't have a public profile API yet, let's look at how we can get this.
                // Actually, we should probably create a specific API route for public profile fetching 
                // that respects the `is_profile_public` flag. 
                // For now, let's try to fetch via a new API endpoint we will create: /api/user/public-profile/[id]

                const res = await fetch(`/api/user/public-profile/${profileId}`);

                if (!res.ok) {
                    if (res.status === 404) {
                        setProfileUser(null); // Not found
                    } else {
                        throw new Error('Failed to fetch profile');
                    }
                } else {
                    const data = await res.json();
                    setProfileUser(data);
                }
            } catch (error) {
                console.error('Error fetching public profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [profileId]);


    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!profileUser) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy người dùng</h1>
                <p className="text-gray-500 mb-6">Người dùng này không tồn tại hoặc đã bị khóa.</p>
                <button
                    onClick={() => router.push('/')}
                    className="px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition"
                >
                    Quay lại trang chủ
                </button>
            </div>
        );
    }

    // Check visibility
    const isOwner = currentUser?.id === profileUser.userId;
    const isPublic = profileUser.isProfilePublic;

    if (!isPublic && !isOwner) {
        return (
            <SocialLayout user={currentUser}>
                <div className="max-w-4xl mx-auto py-12 px-4 text-center">
                    <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                        <Lock className="w-10 h-10 text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Hồ sơ này là riêng tư</h2>
                    <p className="text-gray-500">Người dùng này đã giới hạn quyền xem hồ sơ.</p>
                </div>
            </SocialLayout>
        );
    }

    return (
        <SocialLayout user={currentUser}>
            <div className="max-w-4xl mx-auto space-y-6 pb-20">

                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-primary-600 to-teal-600 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden"
                >
                    {/* Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <pattern id="leaf-pattern-public" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                                    <path d="M20 0C10 0 0 10 0 20s10 20 20 20 20-10 20-20S30 0 20 0zm0 30c-5.5 0-10-4.5-10-10s4.5-10 10-10 10 4.5 10 10-4.5 10-10 10z" fill="currentColor" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#leaf-pattern-public)" />
                        </svg>
                    </div>

                    <div className="relative flex flex-col md:flex-row items-center gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-28 h-28 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/30 shadow-lg overflow-hidden">
                                <UserAvatar
                                    user={profileUser}
                                    className="w-full h-full"
                                />
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                <h2 className="text-3xl font-bold">
                                    {profileUser.displayName || profileUser.fullName || 'Người dùng'}
                                </h2>
                                {profileUser.kycVerified && (
                                    <Shield className="w-6 h-6 text-green-300 fill-current" />
                                )}
                            </div>

                            {/* Only show email/phone if public or owner? Usually keep private details hidden unless explicitly allowed */}
                            {/* For simplicity now, we hide email/phone on public profile unless we add specific settings */}
                            {/* <p className="text-primary-100 mb-4 font-medium">{profileUser.email}</p> */}

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                                <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 flex items-center gap-2">
                                    <span className="text-xl">
                                        {profileUser.rankLevel === 'seed' ? '🌱' :
                                            profileUser.rankLevel === 'sprout' ? '🌿' :
                                                profileUser.rankLevel === 'sapling' ? '🌳' :
                                                    profileUser.rankLevel === 'tree' ? '🌲' : '🌍'}
                                    </span>
                                    <span className="font-semibold capitalize text-sm">{profileUser.rankLevel || 'Seed'} Rank</span>
                                </div>
                                <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 flex items-center gap-2">
                                    <Leaf className="w-4 h-4" />
                                    <span className="font-bold">{profileUser.greenPoints || 0}</span>
                                    <span className="text-sm opacity-90">Points</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatsCard
                        icon={<Leaf className="w-6 h-6 text-green-600" />}
                        label="Ly đã cứu"
                        value={profileUser.totalCupsSaved || 0}
                        subtext="Tương đương cây xanh"
                        color="green"
                        delay={0.1}
                    />
                    <StatsCard
                        icon={<Droplets className="w-6 h-6 text-blue-600" />}
                        label="Nhựa giảm thiểu"
                        value={`${profileUser.totalPlasticReduced || 0}g`}
                        subtext="Bảo vệ đại dương"
                        color="blue"
                        delay={0.2}
                    />
                    {/* Hide Streak for others if not available? Keep it generic */}
                    <StatsCard
                        icon={<Zap className="w-6 h-6 text-amber-600" />}
                        label="Chuỗi ngày xanh"
                        value="---" // We might need to calculate this
                        subtext="Ngày liên tiếp"
                        color="amber"
                        delay={0.3}
                    />
                </div>

                {/* Public Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Thông tin công khai</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 py-2 border-b border-gray-50">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Ngày tham gia</p>
                                <p className="font-medium text-gray-900">
                                    {profileUser.createdAt ? new Date(profileUser.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Show Department/School/Province if available and appropriate? */}
                        {profileUser.province && (
                            <div className="flex items-center gap-4 py-2 border-b border-gray-50">
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Khu vực</p>
                                    <p className="font-medium text-gray-900">{profileUser.province}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

            </div>
        </SocialLayout>
    );
}

function StatsCard({ icon, label, value, subtext, color, delay }: any) {
    const bgColors: any = {
        green: 'bg-green-50 border-green-100',
        blue: 'bg-blue-50 border-blue-100',
        amber: 'bg-amber-50 border-amber-100',
    };
    const iconBgColors: any = {
        green: 'bg-green-100',
        blue: 'bg-blue-100',
        amber: 'bg-amber-100',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className={`rounded-2xl p-5 border ${bgColors[color] || 'bg-white border-gray-100'}`}
        >
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${iconBgColors[color]} flex items-center justify-center`}>
                    {icon}
                </div>
            </div>
            <div>
                <p className="text-gray-500 text-sm font-medium">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                <p className="text-xs text-gray-500 mt-2">{subtext}</p>
            </div>
        </motion.div>
    );
}
