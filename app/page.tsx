'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Wallet, Trophy, Leaf, ArrowRight, LogIn, Sparkles, TrendingUp, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';
import { onAuthChange } from '@/lib/supabase/auth';
import { authFetch } from '@/lib/supabase/authFetch';
import { logger } from '@/lib/logger';
import ChatAI from '@/components/ChatAI';
import Scene3D from '@/components/Scene3D';
import ProfileMenu from '@/components/ProfileMenu';
import LoadingSpinner from '@/components/LoadingSpinner';
import FallingLeaves from '@/components/FallingLeaves';

// Social Components
import SocialLayout from '@/components/social/SocialLayout';
import Feed from '@/components/social/Feed';

export default function Home() {
  const [stats, setStats] = useState({
    totalCupsSaved: 0,
    totalPlasticReduced: 0,
    greenPoints: 0,
    rankLevel: 'seed',
  });
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lắng nghe thay đổi auth state
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Fetch user stats with Auth Header
        authFetch('/api/wallet')
          .then(res => {
            if (res.status === 401) return null; // Handle unauthorized gracefully
            return res.json();
          })
          .then(data => {
            if (data && data.walletBalance !== undefined) {
              setStats({
                totalCupsSaved: data.totalCupsSaved || 0,
                totalPlasticReduced: data.totalPlasticReduced || 0,
                greenPoints: data.greenPoints || 0,
                rankLevel: data.rankLevel || 'seed',
              });
            }
          })
          .catch(err => logger.error('Error fetching stats', { error: err }));
      }
    });

    return () => unsubscribe();
  }, []);

  const rankEmojis: Record<string, string> = {
    seed: '🌱',
    sprout: '🌿',
    sapling: '🌳',
    tree: '🌲',
    forest: '🌍',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <FallingLeaves />
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // ✅ IF LOGGED IN: RENDER SOCIAL DASHBOARD
  if (user) {
    return (
      <SocialLayout user={user}>
        <Feed user={user} />
        {/* ChatAI is floating, so it can stay */}
        <ChatAI />
      </SocialLayout>
    );
  }

  // ❌ IF NOT LOGGED IN: RENDER LANDING PAGE
  return (
    <div className="bg-gradient-to-br from-primary-50 via-white to-primary-50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Header */}
      <header className="relative z-50 bg-white/80 backdrop-blur-md shadow-soft px-4 py-4 border-b border-primary-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-medium">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                CupSipMart
              </h1>
              <p className="text-xs text-dark-500">Mượn ly, Cứu hành tinh</p>
            </div>
          </motion.div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-medium hover:shadow-lg transition-all hover:scale-105"
            >
              <LogIn className="w-4 h-4" />
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section với 3D */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 gap-6 items-center"
        >
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-semibold"
            >
              <Sparkles className="w-4 h-4" />
              Sống xanh, Kiếm điểm, Cứu hành tinh
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-dark-800 leading-tight">
              Mỗi ly bạn mượn là{' '}
              <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                một bước tiến
              </span>{' '}
              cho tương lai xanh
            </h2>
            <p className="text-dark-600 text-lg">
              Tham gia cộng đồng Gen Z sống xanh, kiếm Green Points và thi đua trên bảng xếp hạng
            </p>
          </div>
          <div className="hidden md:block">
            <Scene3D />
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-white to-primary-50 rounded-2xl p-6 shadow-medium border border-primary-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <Leaf className="w-6 h-6 text-primary-600" />
              </div>
              <span className="text-sm text-dark-500 font-medium">Ly đã cứu</span>
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
              {stats.totalCupsSaved}
            </div>
            <div className="text-xs text-dark-400 mt-2">
              {stats.totalPlasticReduced}g nhựa giảm
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-white to-yellow-50 rounded-2xl p-6 shadow-medium border border-yellow-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-sm text-dark-500 font-medium">Green Points</span>
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-400 bg-clip-text text-transparent">
              {stats.greenPoints}
            </div>
            <div className="text-xs text-dark-400 mt-2">
              Rank: {stats.rankLevel}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 shadow-medium border border-blue-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-dark-500 font-medium">Tác động</span>
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              {Math.round(stats.totalPlasticReduced / 1000 * 10) / 10}kg
            </div>
            <div className="text-xs text-dark-400 mt-2">
              Nhựa đã giảm
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-white to-purple-50 rounded-2xl p-6 shadow-medium border border-purple-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-dark-500 font-medium">Thời gian</span>
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
              {stats.totalCupsSaved * 450}
            </div>
            <div className="text-xs text-dark-400 mt-2">
              Năm ô nhiễm ngăn chặn
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
            <div className="relative text-center">
              <p className="font-bold text-xl mb-3">Chưa đăng nhập?</p>
              <p className="text-primary-100 mb-4">Đăng nhập để bắt đầu hành trình sống xanh</p>
              <Link
                href="/auth/login"
                className="inline-block bg-white text-primary-600 px-8 py-3 rounded-xl font-bold hover:bg-primary-50 transition-all hover:scale-105 shadow-lg"
              >
                Đăng nhập ngay →
              </Link>
            </div>
          </motion.div>
        )}
      </main>

      {/* Chat AI */}
      <ChatAI />
    </div>
  );
}
