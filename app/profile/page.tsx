'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, GraduationCap, Calendar, Award, Edit2, Camera, LogOut } from 'lucide-react';
import Image from 'next/image';
import { getCurrentUserAsync, onAuthChange, signOutUser } from '@/lib/supabase/auth';
import { UserProfile } from '@/lib/types/api';
import { logger } from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { getUser, updateUser } from '@/lib/supabase/users';
import { uploadAvatar } from '@/lib/supabase/storage';
import toast from 'react-hot-toast';
import SocialLayout from '@/components/social/SocialLayout';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUserAsync();
        if (!currentUser) {
          router.push('/auth/login');
          return;
        }

        setUser(currentUser);

        // Fetch user data từ API (Server-side)
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;

          if (!token) {
            console.warn('No access token found');
            return;
          }

          const response = await fetch('/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setUserData(data);
          } else {
            console.error('Failed to fetch profile:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('Error fetching user data endpoint', error);
        } finally {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking auth', error);
        router.push('/auth/login');
        setLoading(false);
      }
    };

    checkAuth();

    // Listen to auth changes
    const unsubscribe = onAuthChange(async (currentUser) => {
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }
      setUser(currentUser);

      // Re-fetch profile on auth change
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (token) {
          const response = await fetch('/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setUserData(data);
          }
        }
      } catch (error) {
        console.error('Error re-fetching profile:', error);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOutUser();
      toast.success('Đã đăng xuất thành công');
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Đăng xuất thất bại');
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    try {
      setUploading(true);
      const userId = (user as any).id || (user as any).user_id;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      const publicUrl = data.avatarUrl;

      // Update local state
      setUserData((prev: any) => ({ ...prev, avatar: publicUrl }));

      toast.success('Cập nhật ảnh đại diện thành công');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Có lỗi xảy ra khi cập nhật ảnh đại diện');
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="text-primary-600">Đang tải...</div>
      </div>
    );
  }

  const rankEmojis: Record<string, string> = {
    seed: '🌱',
    sprout: '🌿',
    sapling: '🌳',
    tree: '🌲',
    forest: '🌍',
  };

  return (
    <SocialLayout user={user}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />

          <div className="relative flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30 overflow-hidden">
                {userData?.avatar ? (
                  <Image
                    src={userData.avatar}
                    alt="Avatar"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12" />
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              <button
                onClick={handleAvatarClick}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-8 h-8 bg-white text-primary-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition cursor-pointer disabled:opacity-70"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">
                {userData?.displayName || user?.displayName || 'Người dùng'}
              </h2>
              <p className="text-primary-100 mb-4">{user?.email}</p>

              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                  <div className="text-2xl mb-1">{rankEmojis[userData?.rankLevel || 'seed']}</div>
                  <div className="text-xs opacity-90">{userData?.rankLevel || 'seed'}</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                  <div className="text-xl font-bold">{userData?.greenPoints || 0}</div>
                  <div className="text-xs opacity-90">Green Points</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="absolute top-0 right-0 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5 text-white" />
            </button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-xl border-2 border-primary-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-dark-500">Ly đã cứu</p>
                <p className="text-2xl font-bold text-primary-600">{userData?.totalCupsSaved || 0}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-xl border-2 border-blue-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-dark-500">Tham gia</p>
                <p className="text-sm font-semibold text-dark-800">
                  {userData?.createdAt
                    ? new Date(userData.createdAt).toLocaleDateString('vi-VN')
                    : 'Mới đây'}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-xl border-2 border-purple-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-dark-500">Nhựa giảm</p>
                <p className="text-2xl font-bold text-purple-600">
                  {userData?.totalPlasticReduced || 0}g
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-xl border-2 border-dark-100"
        >
          <h3 className="text-lg font-bold text-dark-800 mb-4">Thông tin cá nhân</h3>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Mail className="w-5 h-5 text-dark-400" />
              <div className="flex-1">
                <p className="text-sm text-dark-500">Email</p>
                <p className="font-semibold text-dark-800">{user?.email}</p>
              </div>
            </div>

            {userData?.studentId && (
              <div className="flex items-center gap-4">
                <GraduationCap className="w-5 h-5 text-dark-400" />
                <div className="flex-1">
                  <p className="text-sm text-dark-500">Mã sinh viên</p>
                  <p className="font-semibold text-dark-800">{userData.studentId}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <Award className="w-5 h-5 text-dark-400" />
              <div className="flex-1">
                <p className="text-sm text-dark-500">Hạng hiện tại</p>
                <p className="font-semibold text-dark-800 capitalize">
                  {rankEmojis[userData?.rankLevel || 'seed']} {userData?.rankLevel || 'seed'}
                </p>
              </div>
            </div>
          </div>

          <button className="mt-6 w-full bg-primary-500 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 hover:bg-primary-600 transition">
            <Edit2 className="w-5 h-5" />
            Chỉnh sửa hồ sơ
          </button>
        </motion.div>
      </div>
    </SocialLayout>
  );
}
