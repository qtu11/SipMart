'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Package, Users, AlertTriangle, Plus, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUserAsync, onAuthChange } from '@/lib/supabase/auth';
import { checkIsAdmin, isAdminEmail } from '@/lib/supabase/admin';
import toast from 'react-hot-toast';
import QRCodeDisplay from '@/components/QRCodeDisplay';

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
    storeId: 'store1',
  });
  const router = useRouter();

  const fetchAnalytics = useCallback(async () => {
    try {
      // Use admin credentials from env
      const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || '';
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';
      const email = adminKey.split(',')[0].trim();

      const res = await fetch('/api/admin/analytics', {
        headers: {
          'x-admin-email': email,
          'x-admin-password': adminPassword,
        },
      });
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
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
        console.log('No user found, redirecting to login');
        router.push('/auth/login');
        return;
      }

      try {
        const userEmail = user.email || '';
        const userId = user.id || user.user_id;
        console.log('🔍 Checking admin access for:', userEmail, 'UID:', userId);
        
        // Check email trước (nhanh hơn)
        if (isAdminEmail(userEmail)) {
          console.log('✅ Email is admin email, granting access');
          setAuthorized(true);
          setLoading(false);
          fetchAnalytics();
          interval = setInterval(fetchAnalytics, 30000); // Refresh mỗi 30s
          return;
        }
        
        // Nếu không phải admin email, check Supabase
        console.log('⚠️ Email is not in admin list, checking Supabase...');
        const isAdmin = await checkIsAdmin(userId, userEmail);
        if (!isAdmin) {
          console.log('❌ User is not admin, redirecting...');
          toast.error('Bạn không có quyền truy cập trang admin');
          router.push('/');
          return;
        }
        
        console.log('✅ User is admin from Supabase, granting access');
        setAuthorized(true);
        setLoading(false);
        fetchAnalytics();
        interval = setInterval(fetchAnalytics, 30000); // Refresh mỗi 30s
      } catch (error) {
        console.error('❌ Error checking admin access:', error);
        toast.error('Lỗi khi kiểm tra quyền truy cập');
        setLoading(false);
      }
    };

    // Lắng nghe thay đổi auth state (đợi auth load xong)
    const unsubscribe = onAuthChange(async (user) => {
      console.log('🔔 Auth state changed, user:', user?.email);
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

      if (!adminKey || !adminPassword) {
        toast.error('Admin credentials chưa được cấu hình');
        setIsCreating(false);
        return;
      }

      const res = await fetch('/api/admin/cups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': email,
          'x-admin-password': adminPassword,
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
    } catch (error: any) {
      console.error('Create cups error:', error);
      toast.error(error.message || 'Lỗi khi tạo mã QR');
    } finally {
      setIsCreating(false);
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
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <header className="bg-white shadow-soft px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-dark-800">Admin Dashboard</h1>
          <Link
            href="/admin/users"
            className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Quản lý Users
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Grid */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-4 shadow-soft"
          >
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-primary-500" />
              <span className="text-sm text-dark-500">Ly đã cứu</span>
            </div>
            <div className="text-2xl font-bold text-primary-600">
              {analytics?.totalCupsSaved?.toLocaleString('vi-VN') || '0'}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-4 shadow-soft"
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-primary-500" />
              <span className="text-sm text-dark-500">Người dùng</span>
            </div>
            <div className="text-2xl font-bold text-primary-600">
              {analytics?.totalUsers || 0}
            </div>
            <div className="text-xs text-dark-400">
              {analytics?.activeUsers || 0} hoạt động
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-4 shadow-soft"
          >
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-primary-500" />
              <span className="text-sm text-dark-500">Giao dịch</span>
            </div>
            <div className="text-2xl font-bold text-primary-600">
              {analytics?.ongoingTransactions || 0}
            </div>
            <div className="text-xs text-dark-400">
              {analytics?.overdueTransactions || 0} quá hạn
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-4 shadow-soft"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-dark-500">Nhựa giảm</span>
            </div>
            <div className="text-2xl font-bold text-primary-600">
              {analytics?.totalPlasticReduced ? ((analytics.totalPlasticReduced / 1000).toFixed(1)) : '0.0'}kg
            </div>
          </motion.div>
        </div>
        )}

        {/* Create QR Codes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl p-6 shadow-soft"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark-800">
              Quản lý mã QR
            </h2>
            <button
              onClick={() => setShowCreateCups(!showCreateCups)}
              className="bg-primary-500 text-white rounded-xl px-4 py-2 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tạo mới
            </button>
          </div>

          {showCreateCups && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 pt-4 border-t border-dark-100"
            >
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
              <button
                onClick={handleCreateCups}
                disabled={isCreating}
                className="w-full bg-primary-500 text-white rounded-xl py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Đang tạo...' : 'Tạo mã QR'}
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Store Distribution */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl p-6 shadow-soft"
        >
          <h2 className="text-lg font-semibold text-dark-800 mb-4">
            Phân bổ kho
          </h2>
          <div className="space-y-3">
            {analytics?.storeDistribution?.map((store) => {
              const lowStock = store.available < 5;
              return (
                <div
                  key={store.storeId}
                  className={`p-4 rounded-xl border ${
                    lowStock
                      ? 'border-orange-300 bg-orange-50'
                      : 'border-dark-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-dark-800">
                      {store.storeName}
                    </div>
                    {lowStock && (
                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
                        Sắp hết
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div>
                      <div className="text-dark-500">Có sẵn</div>
                      <div className="font-semibold text-primary-600">
                        {store.available}
                      </div>
                    </div>
                    <div>
                      <div className="text-dark-500">Đang dùng</div>
                      <div className="font-semibold text-dark-800">
                        {store.inUse}
                      </div>
                    </div>
                    <div>
                      <div className="text-dark-500">Vệ sinh</div>
                      <div className="font-semibold text-dark-800">
                        {store.cleaning}
                      </div>
                    </div>
                    <div>
                      <div className="text-dark-500">Tổng</div>
                      <div className="font-semibold text-dark-800">
                        {store.total}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </main>

      {/* QR Codes Display Modal */}
      {showQRCodes && createdQRCodes.length > 0 && (
        <QRCodeDisplay
          qrCodes={createdQRCodes}
          onClose={() => {
            setShowQRCodes(false);
            setCreatedQRCodes([]);
          }}
        />
      )}
    </div>
  );
}

