'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Package, Users, AlertTriangle, Plus, Download, Sparkles, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserAsync, onAuthChange } from '@/lib/supabase/auth';
import { isAdminEmail } from '@/lib/supabase/admin';
import toast from 'react-hot-toast';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Analytics {
  totalCupsSaved: number;
  totalPlasticReduced: number;
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  ongoingTransactions: number;
  overdueTransactions: number;
  averageReturnTime: number;
  storeDistribution: Array<{
    storeId: string;
    storeName: string;
    available: number;
    inUse: number;
    cleaning: number;
    total: number;
  }>;
}

interface QRCodeData {
  cupId: string;
  material: string;
  qrData: string;
  qrImage?: string;
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [showCreateCups, setShowCreateCups] = useState(false);
  const [createdQRCodes, setCreatedQRCodes] = useState<QRCodeData[]>([]);
  const [showQRCodes, setShowQRCodes] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [cupForm, setCupForm] = useState({
    count: 10,
    material: 'pp_plastic' as 'pp_plastic' | 'bamboo_fiber',
    storeId: '',
  });
  const router = useRouter();

  const fetchAnalytics = useCallback(async () => {
    try {
      // Use admin credentials from env
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

      // Auto-select first store if none selected
      if (data.storeDistribution?.length > 0) {
        setCupForm(prev => ({
          ...prev,
          storeId: prev.storeId || data.storeDistribution[0].storeId
        }));
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error fetching analytics:', error);
      toast.error('Không thể tải dữ liệu analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    // Check admin access
    const checkAdminAccess = async (user: any) => {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      try {
        const userEmail = user.email || '';

        // Use local check only for UI access
        if (isAdminEmail(userEmail)) {
          setAuthorized(true);
          setLoading(false);
          fetchAnalytics();
          interval = setInterval(fetchAnalytics, 30000); // Refresh mỗi 30s
          return;
        }

        toast.error('Bạn không có quyền truy cập trang admin');
        router.push('/');
      } catch (error: unknown) {
        console.error('❌ Error checking admin access:', error);
        setLoading(false);
      }
    };

    // Lắng nghe thay đổi auth state (đợi auth load xong)
    const unsubscribe = onAuthChange(async (user) => {
      await checkAdminAccess(user);
    });

    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [router, fetchAnalytics]);

  const handleCreateCups = async () => {
    try {
      setIsCreating(true);

      // Use admin credentials from env
      const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || '';
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';
      const email = adminKey.split(',')[0].trim();
      const { data: { session } } = await import('@/lib/supabase/client').then(m => m.createClient().auth.getSession());

      const res = await fetch('/api/admin/cups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': email,
          'x-admin-password': adminPassword,
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
        },
        body: JSON.stringify(cupForm),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Đã tạo ${cupForm.count} mã QR thành công`);

        // Lưu QR codes và hiển thị modal
        if (data.qrCodes && data.qrCodes.length > 0) {
          setCreatedQRCodes(data.qrCodes);
          setShowQRCodes(true);
        }

        setShowCreateCups(false);
        fetchAnalytics();
      } else {
        toast.error(data.error || 'Không thể tạo mã QR');
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Create cups error:', error);
      toast.error(err.message || 'Lỗi khi tạo mã QR');
    } finally {
      setIsCreating(false);
    }
  };

  const [loadingStore, setLoadingStore] = useState<string | null>(null);

  const viewStoreCups = async (storeId: string) => {
    try {
      setLoadingStore(storeId);
      // Use admin credentials from env
      const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || '';
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';
      const email = adminKey.split(',')[0].trim();
      const { data: { session } } = await import('@/lib/supabase/client').then(m => m.createClient().auth.getSession());

      const res = await fetch(`/api/admin/cups?storeId=${storeId}`, {
        headers: {
          'x-admin-email': email,
          'x-admin-password': adminPassword,
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
        },
      });

      const data = await res.json();

      if (data.success) {
        if (data.cups && data.cups.length > 0) {
          setCreatedQRCodes(data.cups);
          setShowQRCodes(true);
        } else {
          toast('Kho này chưa có ly nào (hoặc dữ liệu chưa được cập nhật)', { icon: 'ℹ️' });
        }
      } else {
        toast.error(data.error || 'Không thể tải danh sách ly');
      }
    } catch (error) {
      console.error('Error fetching store cups:', error);
      toast.error('Lỗi kết nối');
    } finally {
      setLoadingStore(null);
    }
  };

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="text-primary-600">Đang kiểm tra quyền truy cập...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="text-red-600">Lỗi khi tải dữ liệu</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-primary-50/20 dark:from-dark-950 dark:via-dark-900 dark:to-dark-950">
      {/* Modern Header with Glassmorphism */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl shadow-soft border-b border-dark-100 dark:border-dark-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-dark-800 dark:text-white">Admin Dashboard</h1>
              <p className="text-sm text-dark-500 dark:text-dark-400">Quản lý hệ thống SipMart</p>
            </div>
          </div>
          <Link href="/admin/users">
            <Button variant="primary" size="md" icon=<Users className="w-4 h-4" />>
              Quản lý Users
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Grid với Modern StatCard */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Ly đã cứu"
              value={analytics?.totalCupsSaved || 0}
              subtitle={`${analytics?.totalUsers || 0} người dùng`}
              icon={Package}
              color="primary"
              trend={{ value: 12, isPositive: true }}
              delay={0}
            />
            <StatCard
              title="Người dùng"
              value={analytics?.totalUsers || 0}
              subtitle={`${analytics?.activeUsers || 0} đang hoạt động`}
              icon={Users}
              color="blue"
              trend={{ value: 8, isPositive: true }}
              delay={0.1}
            />
            <StatCard
              title="Giao dịch"
              value={analytics?.ongoingTransactions || 0}
              subtitle={`${analytics?.overdueTransactions || 0} quá hạn`}
              icon={BarChart3}
              color="purple"
              trend={{ value: analytics?.overdueTransactions > 0 ? -5 : 3, isPositive: analytics?.overdueTransactions === 0 }}
              delay={0.2}
            />
            <StatCard
              title="Nhựa giảm"
              value={analytics?.totalPlasticReduced ? `${(analytics.totalPlasticReduced / 1000).toFixed(1)}kg` : '0.0kg'}
              subtitle="Tác động môi trường"
              icon={AlertTriangle}
              color="orange"
              trend={{ value: 15, isPositive: true }}
              delay={0.3}
            />
          </div>
        )}

        {/* Create QR Codes */}
        <Card variant="elevated" className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/40 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                Quản lý mã QR
              </CardTitle>
              <Button
                onClick={() => setShowCreateCups(!showCreateCups)}
                variant="primary"
                size="md"
                icon=<Plus className="w-4 h-4" />
              >
                Tạo mới
              </Button>
            </div>
          </CardHeader>

          {showCreateCups && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pt-4 border-t border-dark-100"
            >
              <div>
                <label className="block text-sm text-dark-600 mb-2">
                  Chọn kho
                </label>
                <select
                  value={cupForm.storeId}
                  onChange={(e) =>
                    setCupForm({ ...cupForm, storeId: e.target.value })
                  }
                  className="w-full border border-dark-200 rounded-xl px-4 py-2 bg-dark-100 text-dark-600"
                >
                  {analytics?.storeDistribution?.map((store) => (
                    <option key={store.storeId} value={store.storeId}>
                      {store.storeName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-dark-600 mb-2">
                  Số lượng ly
                </label>
                <input
                  type="number"
                  min="1"
                  value={cupForm.count}
                  onChange={(e) =>
                    setCupForm({ ...cupForm, count: parseInt(e.target.value) })
                  }
                  className="w-full border border-dark-200 rounded-xl px-4 py-2 bg-dark-100 text-dark-600"
                />
              </div>
              <div>
                <label className="block text-sm text-dark-600 mb-2">
                  Chất liệu
                </label>
                <select
                  value={cupForm.material}
                  onChange={(e) =>
                    setCupForm({
                      ...cupForm,
                      material: e.target.value as 'pp_plastic' | 'bamboo_fiber',
                    })
                  }
                  className="w-full border border-dark-200 rounded-xl px-4 py-2 bg-dark-100 text-dark-600"
                >
                  <option value="pp_plastic">Nhựa PP cao cấp</option>
                  <option value="bamboo_fiber">Sợi tre</option>
                </select>
              </div>
              <Button
                onClick={handleCreateCups}
                disabled={isCreating || !cupForm.storeId}
                loading={isCreating}
                variant="primary"
                size="lg"
                fullWidth
              >
                Tạo mã QR
              </Button>
            </motion.div>
          )}
        </Card>

        {/* Store Distribution */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              Phân bổ kho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.storeDistribution?.map((store) => {
                const lowStock = store.available < 5;
                const isLoading = loadingStore === store.storeId;

                return (
                  <motion.div
                    key={store.storeId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.01 }}
                    className={`p-5 rounded-xl border-2 transition-all ${lowStock
                        ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10'
                        : 'border-dark-100 dark:border-dark-700 bg-dark-50/50 dark:bg-dark-800/30'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-bold text-lg text-dark-800 dark:text-white">
                        {store.storeName}
                      </div>
                      <div className="flex items-center gap-2">
                        {lowStock && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-xs bg-orange-500 text-white px-3 py-1 rounded-full font-semibold shadow-md"
                          >
                            ⚠️ Sắp hết
                          </motion.span>
                        )}
                        <Button
                          onClick={() => viewStoreCups(store.storeId)}
                          disabled={isLoading}
                          loading={isLoading}
                          variant="outline"
                          size="sm"
                        >
                          Chi tiết
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="text-center p-3 bg-white dark:bg-dark-700 rounded-lg border border-dark-100 dark:border-dark-600">
                        <div className="text-xs text-dark-500 dark:text-dark-400 mb-1">Có sẵn</div>
                        <div className="text-xl font-bold text-primary-600 dark:text-primary-400">
                          {store.available}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-dark-700 rounded-lg border border-dark-100 dark:border-dark-600">
                        <div className="text-xs text-dark-500 dark:text-dark-400 mb-1">Đang dùng</div>
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {store.inUse}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-dark-700 rounded-lg border border-dark-100 dark:border-dark-600">
                        <div className="text-xs text-dark-500 dark:text-dark-400 mb-1">Vệ sinh</div>
                        <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                          {store.cleaning}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-dark-700 rounded-lg border border-dark-100 dark:border-dark-600">
                        <div className="text-xs text-dark-500 dark:text-dark-400 mb-1">Tổng</div>
                        <div className="text-xl font-bold text-dark-800 dark:text-white">
                          {store.total}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main >

      {/* QR Codes Display Modal */}
      {
        showQRCodes && createdQRCodes.length > 0 && (
          <QRCodeDisplay
            qrCodes={createdQRCodes}
            onClose={() => {
              setShowQRCodes(false);
              setCreatedQRCodes([]);
            }}
          />
        )
      }
    </div >
  );
}

