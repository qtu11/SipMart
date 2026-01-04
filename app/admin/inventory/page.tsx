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

interface Cup {
  cup_id: string;
  material: 'pp_plastic' | 'bamboo_fiber';
  status: 'available' | 'in_use' | 'cleaning' | 'lost';
  totalUses: number;
  created_at: string;
}

export default function InventoryPage() {
  const [cups, setCups] = useState<Cup[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });

  const router = useRouter();

  const fetchCups = useCallback(async () => {
    try {
      setLoading(true);
      const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || '';
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';
      const email = adminKey.split(',')[0].trim();

      const query = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '24',
        status: filters.status,
        search: filters.search
      });

      const res = await fetch(`/api/admin/cups?${query}`, {
        headers: {
          'x-admin-email': email,
          'x-admin-password': adminPassword,
        }
      });
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
    } catch (error) {
      toast.error('Không thể tải danh sách ly');
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
    });
    return () => unsubscribe();
  }, [router, fetchCups]);

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
      const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || '';
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';
      const email = adminKey.split(',')[0].trim();

      const res = await fetch('/api/admin/cups/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': email,
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify({ cupId, status: newStatus })
      });

      if (res.ok) {
        toast.success('Cập nhật trạng thái thành công');
        setCups(prev => prev.map(c => c.cup_id === cupId ? { ...c, status: newStatus as any } : c));
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
        <div className="text-primary-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-dark-800">Quản Lý Kho Ly</h1>
            <p className="text-dark-500">Theo dõi toàn bộ ly trong hệ thống</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                placeholder="Tìm ID..."
                className="pl-9 pr-4 py-2 rounded-xl border border-dark-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={filters.search}
                onChange={e => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <select
              className="px-4 py-2 rounded-xl border border-dark-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
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

        {/* Cup Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cups.map((cup) => (
            <div key={cup.cup_id} className="bg-white p-4 rounded-xl shadow-soft border border-dark-100 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-xs text-dark-400">#{cup.cup_id.slice(0, 8)}</span>
                  <div className="font-semibold text-dark-800">
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

              <div className="text-sm text-dark-500">
                Tạo lúc: {new Date(cup.created_at).toLocaleDateString()}
              </div>

              <div className="mt-auto pt-3 border-t border-dark-50 flex gap-2">
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
            className="px-4 py-2 rounded-lg border border-dark-200 disabled:opacity-50 hover:bg-dark-50"
          >
            Prev
          </button>
          <span className="px-4 py-2">Page {pagination.page} of {pagination.totalPages}</span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
            className="px-4 py-2 rounded-lg border border-dark-200 disabled:opacity-50 hover:bg-dark-50"
          >
            Next
          </button>
        </div>

      </div>
    </div>
  );
}
