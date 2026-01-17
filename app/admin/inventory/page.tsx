'use client';

import { useState, useEffect, useCallback } from 'react';
import { Package, Plus, RefreshCw, Search, Filter, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthChange } from '@/lib/supabase/auth';
import { isAdminEmail } from '@/lib/supabase/admin';
import toast from 'react-hot-toast';
import StatsCard from '@/components/StatsCard';
import { Users, TrendingUp, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import FallingLeaves from '@/components/FallingLeaves';

interface Cup {
  cup_id: string;
  material: 'pp_plastic' | 'bamboo_fiber';
  status: 'available' | 'in_use' | 'cleaning' | 'lost';
  totalUses: number;
  created_at: string;
}

export default function InventoryPage() {
  const [cups, setCups] = useState<Cup[]>([]);
  const [storeDistribution, setStoreDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });

  const router = useRouter();

  const getAuthHeaders = async () => {
    const { data: { session } } = await import('@/lib/supabase/client').then(m => m.createClient().auth.getSession());
    const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || '';
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';
    const email = adminKey ? adminKey.split(',')[0].trim() : '';

    const headers: HeadersInit = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    if (email && adminPassword) {
      headers['x-admin-email'] = email;
      headers['x-admin-password'] = adminPassword;
    }
    return headers;
  };

  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/analytics', { headers });
      if (res.ok) {
        const data = await res.json();
        setStoreDistribution(data.storeDistribution || []);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const fetchCups = useCallback(async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();

      const query = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '24',
        status: filters.status,
        search: filters.search
      });

      const res = await fetch(`/api/admin/cups?${query}`, { headers });

      if (!res.ok) {
        try {
          const errData = await res.json();
          throw new Error(errData.error || res.statusText);
        } catch (e) {
          throw new Error(`Failed to load cups (${res.status})`);
        }
      }

      const data = await res.json();

      if (data.cups) {
        setCups(data.cups);
        if (data.pagination) {
          setPagination(prev => ({
            ...prev,
            totalPages: data.pagination.totalPages,
            total: data.pagination.total
          }));
        }
      }
    } catch (error: any) {
      console.error('Fetch Inventory Error:', error);
      toast.error(error.message || 'Không thể tải danh sách ly');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, filters]);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        router.push('/auth/login');
        return;
      }
      const isAdmin = isAdminEmail(user.email || '');
      if (!isAdmin) {
        router.push('/');
        return;
      }
      setAuthorized(true);
      fetchCups();
      fetchAnalytics();
    });
    return () => unsubscribe();
  }, [router, fetchCups, fetchAnalytics]);

  useEffect(() => {
    if (authorized) {
      const timeout = setTimeout(() => {
        fetchCups();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [filters, authorized, fetchCups]);

  const updateCupStatus = async (cupId: string, newStatus: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/admin/cups/status', {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ cupId, status: newStatus })
      });

      if (res.ok) {
        toast.success('Cập nhật trạng thái thành công');
        setCups(prev => prev.map(c => c.cup_id === cupId ? { ...c, status: newStatus as any } : c));
        fetchAnalytics(); // Refresh stats
      } else {
        toast.error('Lỗi khi cập nhật trạng thái');
      }
    } catch (error) {
      toast.error('Lỗi kết nối');
    }
  };

  if (loading && !cups.length) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <FallingLeaves />
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dark-800 dark:text-white">Quản Lý Kho Ly</h1>
            <p className="text-dark-500 dark:text-dark-400">Theo dõi phân bổ và tình trạng ly toàn hệ thống</p>
          </div>
          {/* Controls */}
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                placeholder="Tìm ID..."
                className="pl-9 pr-4 py-2 rounded-xl border border-dark-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <select
              className="px-4 py-2 rounded-xl border border-dark-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="available">Có sẵn</option>
              <option value="in_use">Đang dùng</option>
              <option value="cleaning">Vệ sinh</option>
              <option value="lost">Mất</option>
            </select>
          </div>
        </div>

        {/* Store Distribution Stats */}
        {!analyticsLoading && storeDistribution.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {storeDistribution.map((store) => {
              const lowStock = store.available < 5;
              return (
                <div
                  key={store.storeId}
                  className={`p-6 rounded-2xl border transition-all bg-white dark:bg-dark-800 shadow-sm
                      ${lowStock ? 'border-orange-200 dark:border-orange-900/50' : 'border-gray-100 dark:border-dark-700'}
                    `}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-bold text-lg text-dark-800 dark:text-white truncate pr-2">
                      {store.storeName}
                    </div>
                    {lowStock && (
                      <span className="shrink-0 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold border border-orange-200">
                        Sắp hết
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-gray-50 dark:bg-dark-700/50">
                      <div className="text-xs text-gray-500 mb-1">Có sẵn</div>
                      <div className="font-bold text-lg text-green-600">{store.available}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-gray-50 dark:bg-dark-700/50">
                      <div className="text-xs text-gray-500 mb-1">Đang dùng</div>
                      <div className="font-bold text-lg text-blue-600">{store.inUse}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-gray-50 dark:bg-dark-700/50">
                      <div className="text-xs text-gray-500 mb-1">Vệ sinh</div>
                      <div className="font-bold text-lg text-purple-600">{store.cleaning}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-gray-50 dark:bg-dark-700/50">
                      <div className="text-xs text-gray-500 mb-1">Tổng</div>
                      <div className="font-bold text-lg text-gray-800 dark:text-gray-200">{store.total}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cup Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cups.map((cup) => (
            <div key={cup.cup_id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700 dark:bg-dark-800 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-xs text-gray-400">#{cup.cup_id?.slice(0, 8) || 'N/A'}</span>
                  <div className="font-semibold text-gray-800 dark:text-gray-200">
                    {cup.material === 'bamboo_fiber' ? 'Sợi Tre' : 'Nhựa PP'}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${cup.status === 'available' ? 'bg-green-100 text-green-700' :
                  cup.status === 'in_use' ? 'bg-blue-100 text-blue-700' :
                    cup.status === 'cleaning' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                  }`}>
                  {cup.status}
                </span>
              </div>

              <div className="text-sm text-gray-500">
                Tạo lúc: {new Date(cup.created_at).toLocaleDateString()}
              </div>

              <div className="mt-auto pt-3 border-t border-gray-100 dark:border-dark-700 flex gap-2">
                {cup.status !== 'available' && (
                  <button
                    onClick={() => updateCupStatus(cup.cup_id, 'available')}
                    className="flex-1 py-1.5 bg-green-50 text-green-600 rounded-lg text-xs font-semibold hover:bg-green-100"
                  >
                    Set Available
                  </button>
                )}
                {cup.status !== 'lost' && (
                  <button
                    onClick={() => updateCupStatus(cup.cup_id, 'lost')}
                    className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100"
                  >
                    Lost
                  </button>
                )}
                {cup.status !== 'cleaning' && (
                  <button
                    onClick={() => updateCupStatus(cup.cup_id, 'cleaning')}
                    className="px-3 py-1.5 bg-yellow-50 text-yellow-600 rounded-lg text-xs font-semibold hover:bg-yellow-100"
                  >
                    Clean
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center gap-2 mt-6">
          <button
            disabled={pagination.page <= 1}
            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white disabled:opacity-50 hover:bg-gray-50"
          >
            Prev
          </button>
          <span className="px-4 py-2 text-gray-600">Page {pagination.page} of {pagination.totalPages}</span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>

      </div>
    </div>
  );
}
