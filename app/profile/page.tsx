'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, GraduationCap, Calendar, Award, Edit2, Camera } from 'lucide-react';
import { getCurrentUserAsync, onAuthChange } from '@/lib/supabase/auth';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/supabase/users';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
        
        // Fetch user data từ Supabase
        try {
          const userId = (currentUser as any).id || (currentUser as any).user_id;
          const data = await getUser(userId);
          setUserData(data);
        } catch (error: unknown) {
      const err = error as Error;
          console.error('Error fetching user data:', error);
        } finally {
          setLoading(false);
        }
      } catch (error: unknown) {
      const err = error as Error;
        console.error('Error checking auth:', error);
        router.push('/auth/login');
        setLoading(false);
      }
    };

    checkAuth();
    
    // Also listen to auth changes
    const unsubscribe = onAuthChange(async (currentUser) => {
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }
      setUser(currentUser);
      
      try {
        const userId = (currentUser as any).id || (currentUser as any).user_id;
        const data = await getUser(userId);
        setUserData(data);
      } catch (error: unknown) {
      const err = error as Error;
        console.error('Error fetching user data:', error);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [router]);

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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-soft px-4 py-4 border-b border-primary-100">
        <h1 className="text-xl font-semibold text-dark-800">Hồ sơ</h1>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
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
            <div className="relative">
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30">
                <User className="w-12 h-12" />
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white text-primary-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition">
                <Camera className="w-4 h-4" />
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
      </main>
    </div>
  );
}

