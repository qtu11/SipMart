'use client';

import React, { useState, useEffect } from 'react';
import { getCurrentUser, onAuthChange } from '@/lib/supabase/auth';
import { useRouter } from 'next/navigation';
import SocialLayout from '@/components/social/SocialLayout';
import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/LoadingSpinner';
import { motion } from 'framer-motion';

// Dynamically import SmartMapClient to avoid SSR issues with Leaflet
const SmartMapClient = dynamic(() => import('@/components/map/SmartMapClient'), {
  ssr: false,
  loading: () => (
    <div className="h-[60vh] w-full bg-gradient-to-br from-primary-50 to-green-50 rounded-2xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="md" />
        <p className="text-primary-600 animate-pulse font-medium">Đang tải bản đồ thông minh...</p>
      </div>
    </div>
  ),
});

export default function EcoMapPage() {
  const [user, setUser] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
        const unsubscribe = onAuthChange((user) => {
          if (user) {
            setUser(user);
          } else {
            router.push('/auth/login');
          }
        });
        return () => unsubscribe();
      }
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await fetch('/api/stores?activeOnly=true');
        const data = await res.json();
        if (data.data?.stores) {
          setStores(data.data.stores);
        } else if (data.stores) {
          setStores(data.stores);
        }
      } catch (error) {
        console.error("Failed to fetch stores", error);
      }
    };
    fetchStores();
  }, []);

  if (!user) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );

  return (
    <SocialLayout user={user}>
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-500 to-green-500 p-5 rounded-2xl shadow-lg text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">🗺️ Bản Đồ Thông Minh</h1>
              <p className="text-sm text-white/90">Tìm trạm CupSipMart gần bạn - Xem đường đi chi tiết</p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                <p className="text-xs text-white/80">Tổng trạm</p>
                <p className="text-2xl font-bold">{stores.length || '...'}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-2 rounded-2xl shadow-2xl border border-primary-100 overflow-hidden"
        >
          <SmartMapClient />
        </motion.div>
      </div>
    </SocialLayout>
  );
}
