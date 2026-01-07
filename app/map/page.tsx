'use client';

import React, { useState, useEffect } from 'react';
import { getCurrentUser, onAuthChange } from '@/lib/supabase/auth';
import { useRouter } from 'next/navigation';
import SocialLayout from '@/components/social/SocialLayout';
import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/LoadingSpinner';

// Dynamically import MapClient to avoid SSR issues with Leaflet
const MapClient = dynamic(() => import('@/components/map/MapClient'), {
  ssr: false,
  loading: () => (
    <div className="h-[60vh] w-full bg-gray-100 rounded-2xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="md" />
        <p className="text-gray-500 animate-pulse">Đang tải bản đồ...</p>
      </div>
    </div>
  ),
});

export default function EcoMapPage() {
  const [user, setUser] = useState<any>(null);
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

  if (!user) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );

  return (
    <SocialLayout user={user}>
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Bản đồ Eco</h1>
            <p className="text-sm text-gray-500">Tìm trạm CupSipMart gần bạn</p>
          </div>
        </div>

        <div className="bg-white p-2 rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <MapClient />
        </div>
      </div>
    </SocialLayout>
  );
}
