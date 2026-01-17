'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Leaf, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { onAuthChange } from '@/lib/supabase/auth';
import { authFetch } from '@/lib/supabase/authFetch';
import { logger } from '@/lib/logger';
import ChatAI from '@/components/ChatAI';
import LoadingSpinner from '@/components/LoadingSpinner';
import FallingLeaves from '@/components/FallingLeaves';

// Landing Components
import HeroSection from '@/components/landing/HeroSection';
import AboutSection from '@/components/landing/AboutSection';
import FeatureShowcase from '@/components/landing/FeatureShowcase';
import ImpactStats from '@/components/landing/ImpactStats';
import FAQSection from '@/components/landing/FAQSection';

// Social Components
import SocialLayout from '@/components/social/SocialLayout';
import Feed from '@/components/social/Feed';

function HomeContent() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle success notifications from borrow/return
  useEffect(() => {
    const borrowSuccess = searchParams.get('borrowSuccess');
    const returnSuccess = searchParams.get('returnSuccess');

    if (borrowSuccess === 'true') {
      toast.success('🌟 Mượn ly thành công! Bạn vừa giúp giảm 1 ly nhựa!');
      router.replace('/');
    }

    if (returnSuccess === 'true') {
      toast.success('✅ Trả ly thành công! Cảm ơn bạn đã bảo vệ môi trường!');
      router.replace('/');
    }
  }, [searchParams, router]);

  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Fetch fresh profile data
        authFetch('/api/user/profile')
          .then(res => {
            if (res.ok) return res.json();
            return null;
          })
          .then(profile => {
            if (profile) {
              setUser((prev: any) => ({ ...prev, ...profile }));
            }
          })
          .catch(err => console.error('Error fetching profile on home', err));
      }
    });

    return () => unsubscribe();
  }, []);

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
        <ChatAI />
      </SocialLayout>
    );
  }

  // ❌ IF NOT LOGGED IN: RENDER NEW LANDING PAGE
  return (
    <div className="bg-white relative overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-primary-500/30 transition-shadow">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-heading bg-gradient-to-r from-primary-600 to-teal-500 bg-clip-text text-transparent">
                SipSmart
              </h1>
              <p className="text-[10px] text-dark-400 font-medium tracking-wide uppercase">Save Earth, Sip Smart</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-dark-600">
            <Link href="/about" className="hover:text-primary-600 transition-colors">Về dự án</Link>
            <Link href="/features" className="hover:text-primary-600 transition-colors">Tính năng</Link>
            <Link href="/map" className="hover:text-primary-600 transition-colors">Bản đồ</Link>
            <Link href="/support" className="hover:text-primary-600 transition-colors">Hỗ trợ</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="bg-dark-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:shadow-xl hover:bg-dark-800 transition-all hover:-translate-y-0.5"
            >
              <LogIn className="w-4 h-4" />
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>

      {/* Main Sections */}
      <main>
        <HeroSection />
        <AboutSection />
        <FeatureShowcase />
        <ImpactStats />
        <FAQSection />

        {/* Final CTA */}
        <section className="py-24 bg-gradient-to-br from-primary-500 to-primary-700 relative overflow-hidden text-center text-white">
          <div className="absolute inset-0 opacity-20 bg-[url('/patterns/grid.svg')]"></div>
          <div className="max-w-4xl mx-auto px-6 relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Sẵn sàng sống xanh ngay hôm nay?</h2>
            <p className="text-lg md:text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
              Chỉ mất 30 giây để tạo tài khoản và bắt đầu hành trình bảo vệ môi trường cùng hàng nghìn bạn trẻ khác.
            </p>
            <Link
              href="/auth/register"
              className="inline-block bg-white text-primary-700 px-10 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:bg-gray-50 transition-transform hover:scale-105"
            >
              Đăng ký miễn phí
            </Link>
          </div>
        </section>
      </main>

      <ChatAI />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

