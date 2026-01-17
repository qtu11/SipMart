'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  DollarSign,
  Leaf,
  Package,
  AlertTriangle,
  Bike,
  Coffee,
} from 'lucide-react';
import { onAuthChange } from '@/lib/supabase/auth';
import { isAdminEmail } from '@/lib/supabase/admin';
import toast from 'react-hot-toast';

// Dynamic imports for charts (client-side only)
const KpiCard = dynamic(() => import('@/components/admin/KpiCard'), { ssr: false });
const RevenueChart = dynamic(() => import('@/components/admin/RevenueChart'), { ssr: false });
const InventoryDonut = dynamic(() => import('@/components/admin/InventoryDonut'), { ssr: false });
const TransactionsTable = dynamic(() => import('@/components/admin/TransactionsTable'), { ssr: false });
const DashboardTopNav = dynamic(() => import('@/components/admin/DashboardTopNav'), { ssr: false });
const HeatmapWidget = dynamic(() => import('@/components/admin/HeatmapWidget'), { ssr: false });

interface Analytics {
  totalCupsSaved: number;
  totalPlasticReduced: number;
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  ongoingTransactions: number;
  overdueTransactions: number;
  averageReturnTime: number;
  storeDistribution: {
    storeId: string;
    storeName: string;
    available: number;
    inUse: number;
    cleaning: number;
    total: number;
  }[];
  recentTransactions?: {
    id: string;
    type: 'cup' | 'bike' | 'bus' | 'wallet';
    user: string;
    amount: number;
    status: string;
    time: string;
  }[];
  totalBikes?: number;
  activeBikes?: number;
  totalRevenue?: number;
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();

  const fetchAnalytics = useCallback(async () => {
    try {
      const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || '';
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';
      const email = adminKey.split(',')[0].trim();

      const { data: { session } } = await import('@/lib/supabase/client').then(m => m.createClient().auth.getSession());

      const res = await fetch('/api/admin/analytics', {
        headers: {
          'x-admin-email': email,
          'x-admin-password': adminPassword,
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
        },
      });
      const data = await res.json();
      setAnalytics(data);
    } catch (error: unknown) {
      console.error('Error fetching analytics:', error);
      toast.error('Không thể tải dữ liệu analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const checkAdminAccess = async (user: any) => {
      if (!user) {
        router.push('/auth/login');
        return;
      }
      try {
        const userEmail = user.email || '';
        if (isAdminEmail(userEmail)) {
          setAuthorized(true);
          setLoading(false);
          fetchAnalytics();
          interval = setInterval(fetchAnalytics, 30000);
          return;
        }
        router.push('/');
      } catch (error: unknown) {
        setLoading(false);
      }
    };
    const unsubscribe = onAuthChange(async (user) => {
      await checkAdminAccess(user);
    });
    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [router, fetchAnalytics]);

  // Calculate aggregated data for charts
  const inventoryData = analytics?.storeDistribution?.reduce(
    (acc, store) => ({
      inUse: acc.inUse + store.inUse,
      available: acc.available + store.available,
      cleaning: acc.cleaning + store.cleaning,
      lost: acc.lost,
    }),
    { inUse: 0, available: 0, cleaning: 0, lost: 0 }
  );

  // Generate sparkline data (random for demo)
  const generateSparkline = () => Array.from({ length: 14 }, () => Math.random() * 100);

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400">Đang tải Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors ${darkMode ? 'dark' : ''}`}>
      {/* Top Navigation */}
      <DashboardTopNav
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        adminName="Chủ tịch"
        adminEmail="admin@sipsmart.vn"
        notificationCount={5}
      />

      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        <section>
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
            Tổng quan Hệ thống
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard
              title="Tổng Doanh thu"
              value={analytics?.totalRevenue ? `${(analytics.totalRevenue / 1000000).toFixed(1)} Tr VNĐ` : '0 VNĐ'}
              subtitle="Từ thanh toán hoàn tất"
              icon={DollarSign}
              color="green"
              trend={{ value: 12, isPositive: true }}
              sparklineData={generateSparkline()}
              delay={0}
            />
            <KpiCard
              title="Tác động ESG"
              value={`${((analytics?.totalPlasticReduced || 0) / 1000).toFixed(1)} kg Nhựa`}
              subtitle={`& ${analytics?.totalCupsSaved || 0} ly đã cứu`}
              icon={Leaf}
              color="blue"
              trend={{ value: 18, isPositive: true }}
              sparklineData={generateSparkline()}
              delay={0.1}
            />
            <KpiCard
              title="Tài sản Hoạt động"
              value={`${analytics?.ongoingTransactions || 0} Ly / ${analytics?.activeBikes || 0} Xe`}
              subtitle="Đang được sử dụng"
              icon={Package}
              color="purple"
              trend={{ value: 5, isPositive: true }}
              sparklineData={generateSparkline()}
              delay={0.2}
            />
            <KpiCard
              title="Cảnh báo Vận hành"
              value={`${analytics?.overdueTransactions || 0} cảnh báo`}
              subtitle={`${analytics?.overdueTransactions || 0} ly quá hạn`}
              icon={AlertTriangle}
              color={(analytics?.overdueTransactions ?? 0) > 0 ? 'red' : 'orange'}
              trend={{ value: analytics?.overdueTransactions ?? 0, isPositive: (analytics?.overdueTransactions ?? 0) === 0 }}
              sparklineData={generateSparkline()}
              delay={0.3}
            />
          </div>
        </section>

        {/* Main Charts Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart - Takes 2 columns */}
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>

          {/* Inventory Donut */}
          <div className="lg:col-span-1">
            <InventoryDonut data={inventoryData} />
          </div>
        </section>

        {/* Heatmap & Quick Stats */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Heatmap */}
          <div className="lg:col-span-1">
            <HeatmapWidget />
          </div>

          {/* Additional Stats Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <Bike className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs text-emerald-600 font-semibold bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">
                  +8% tuần
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{analytics?.totalBikes ?? 0}</h3>
              <p className="text-sm text-slate-500">Tổng xe đạp điện</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                  <Coffee className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs text-amber-600 font-semibold bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-lg">
                  +12% tuần
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {analytics?.totalCupsSaved?.toLocaleString() ?? '0'}
              </h3>
              <p className="text-sm text-slate-500">Tổng ly đã cứu</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs text-blue-600 font-semibold bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-lg">
                  Healthy
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {analytics?.totalUsers?.toLocaleString() || '0'}
              </h3>
              <p className="text-sm text-slate-500">Người dùng đăng ký</p>
            </div>
          </div>
        </section>

        {/* Transactions Table */}
        <section>
          <TransactionsTable transactions={analytics?.recentTransactions as any} />
        </section>
      </main>
    </div>
  );
}
