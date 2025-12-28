'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserAsync, onAuthChange } from '@/lib/supabase/auth';
import { checkIsAdmin, isAdminEmail } from '@/lib/supabase/admin';
import toast from 'react-hot-toast';
import InventoryTable from '@/components/admin/InventoryTable';
import StatsCard from '@/components/StatsCard';
import { Users, TrendingUp, AlertTriangle } from 'lucide-react';

interface Cup {
  cupId: string;
  material: 'pp_plastic' | 'bamboo_fiber';
  status: 'available' | 'in_use' | 'cleaning' | 'lost';
  totalUses: number;
  createdAt: Date;
  lastCleanedAt?: Date;
}

export default function InventoryPage() {
  const [cups, setCups] = useState<Cup[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAccess = async (user: any) => {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      try {
        const userEmail = user.email || '';
        const userId = user.id || user.user_id;

        if (isAdminEmail(userEmail)) {
          setAuthorized(true);
          fetchCups();
          return;
        }

        const isAdmin = await checkIsAdmin(userId, userEmail);
        if (!isAdmin) {
          toast.error('Bạn không có quyền truy cập');
          router.push('/');
          return;
        }

        setAuthorized(true);
        fetchCups();
      } catch (error) {
        console.error('Error checking admin access:', error);
        toast.error('Lỗi khi kiểm tra quyền truy cập');
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthChange(async (user) => {
      await checkAdminAccess(user);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchCups = async () => {
    try {
      // TODO: Implement API endpoint to fetch all cups
      // const res = await fetch('/api/admin/cups/list');
      // const data = await res.json();
      // setCups(data.cups || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cups:', error);
      toast.error('Không thể tải danh sách ly');
      setLoading(false);
    }
  };

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="text-primary-600">Đang tải...</div>
      </div>
    );
  }

  const stats = {
    total: cups.length,
    available: cups.filter((c) => c.status === 'available').length,
    inUse: cups.filter((c) => c.status === 'in_use').length,
    cleaning: cups.filter((c) => c.status === 'cleaning').length,
    lost: cups.filter((c) => c.status === 'lost').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">Quản Lý Kho</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchCups}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Làm mới
            </button>
            <Link
              href="/admin"
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              <Plus className="w-4 h-4" />
              Tạo Mã QR
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Tổng số ly"
            value={stats.total}
            icon={Package}
            color="blue"
          />
          <StatsCard
            title="Có sẵn"
            value={stats.available}
            icon={Users}
            color="green"
          />
          <StatsCard
            title="Đang dùng"
            value={stats.inUse}
            icon={TrendingUp}
            color="yellow"
          />
          <StatsCard
            title="Đã mất"
            value={stats.lost}
            icon={AlertTriangle}
            color="red"
          />
        </div>

        {/* Inventory Table */}
        <InventoryTable cups={cups} onRefresh={fetchCups} />
      </div>
    </div>
  );
}

