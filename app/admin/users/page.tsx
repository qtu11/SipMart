'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Ban, CheckCircle, Mail, Wallet, Award, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getCurrentUserAsync, onAuthChange } from '@/lib/supabase/auth';
import { checkIsAdmin, isAdminEmail } from '@/lib/supabase/admin';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface User {
  userId: string;
  email: string;
  displayName?: string;
  walletBalance: number;
  greenPoints: number;
  rankLevel: string;
  totalCupsSaved: number;
  totalPlasticReduced: number;
  isBlacklisted: boolean;
  blacklistReason?: string;
  blacklistCount: number;
  createdAt: Date;
  lastActivity: Date;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  // State for Edit Modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    displayName: '',
    walletBalance: 0,
    greenPoints: 0,
    rankLevel: 'seed',
    totalCupsSaved: 0
  });

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
      displayName: user.displayName || '',
      walletBalance: user.walletBalance,
      greenPoints: user.greenPoints,
      rankLevel: user.rankLevel,
      totalCupsSaved: user.totalCupsSaved
    });
  };

  const handleUpdate = async () => {
    if (!editingUser) return;

    try {
      const { data: { session } } = await import('@/lib/supabase/client').then(m => m.createClient().auth.getSession());

      const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || '';
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';
      const email = adminKey ? adminKey.split(',')[0].trim() : '';

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      if (email && adminPassword) {
        headers['x-admin-email'] = email;
        headers['x-admin-password'] = adminPassword;
      }

      const res = await fetch(`/api/admin/users/${editingUser.userId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(editForm)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update user');
      }

      toast.success('Cập nhật thành công');
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Lỗi cập nhật');
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      // Try to get admin credentials from user session first
      const { data: { session } } = await import('@/lib/supabase/client').then(m => m.createClient().auth.getSession());

      // Use admin credentials from env if available (fallback/legacy)
      const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || '';
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';
      const email = adminKey ? adminKey.split(',')[0].trim() : '';

      // We need EITHER session OR admin keys
      if (!session?.access_token && (!adminKey || !adminPassword)) {
        throw new Error('Missing Admin Credentials (Login or Env Vars)');
      }

      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      if (email && adminPassword) {
        headers['x-admin-email'] = email;
        headers['x-admin-password'] = adminPassword;
      }

      const res = await fetch('/api/admin/users', { headers });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch users (${res.status})`);
      }

      const data = await res.json();
      setUsers(data.users || []);
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error fetching users:', error);
      toast.error(`Lỗi tải danh sách: ${err.message}`);
    } finally {
      setLoading(false);
    }

  }, []);

  useEffect(() => {
    // Check admin access
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const userId = (user as any).id || (user as any).user_id || (user as any).uid;
      // Use local check only for UI access - strict server check is done in API
      const isAdmin = isAdminEmail(user.email || '');
      if (!isAdmin) {
        toast.error('Bạn không có quyền truy cập trang này');
        router.push('/');
        return;
      }

      setCurrentUser(user);
      setAuthorized(true);
      fetchUsers();
    });

    return () => unsubscribe();
  }, [router, fetchUsers]);

  const handleBlacklist = async (userId: string, reason: string) => {
    try {
      // Use admin credentials from env
      const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || '';
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';
      const email = adminKey.split(',')[0].trim();

      const res = await fetch('/api/admin/users/blacklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': email,
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify({ userId, reason }),
      });

      if (!res.ok) throw new Error('Failed to blacklist user');

      toast.success('Đã blacklist user');
      fetchUsers();
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Blacklist error:', error);
      toast.error('Không thể blacklist user');
    }
  };

  const handleUnblacklist = async (userId: string) => {
    try {
      // Use admin credentials from env
      const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || '';
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';
      const email = adminKey.split(',')[0].trim();

      const res = await fetch('/api/admin/users/unblacklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': email,
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) throw new Error('Failed to unblacklist user');

      toast.success('Đã gỡ blacklist user');
      fetchUsers();
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Unblacklist error:', error);
      toast.error('Không thể gỡ blacklist user');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const rankEmojis: Record<string, string> = {
    seed: '🌱',
    sprout: '🌿',
    sapling: '🌳',
    tree: '🌲',
    forest: '🌍',
  };

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="text-primary-600">Đang kiểm tra quyền truy cập...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <header className="bg-white/80 backdrop-blur-md shadow-soft px-4 py-4 border-b border-primary-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-primary-600 hover:underline mb-2 inline-block">
              ← Quay lại Dashboard
            </Link>
            <h1 className="text-xl font-semibold text-dark-800">Quản lý Người dùng</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo email, tên, hoặc ID..."
            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-primary-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-4 shadow-soft"
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-primary-500" />
              <span className="text-sm text-dark-500">Tổng users</span>
            </div>
            <div className="text-2xl font-bold text-primary-600">{users.length}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-4 shadow-soft"
          >
            <div className="flex items-center gap-2 mb-2">
              <Ban className="w-5 h-5 text-red-500" />
              <span className="text-sm text-dark-500">Blacklisted</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {users.filter(u => u.isBlacklisted).length}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-4 shadow-soft"
          >
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-primary-500" />
              <span className="text-sm text-dark-500">Tổng điểm</span>
            </div>
            <div className="text-2xl font-bold text-primary-600">
              {users.reduce((sum, u) => sum + u.greenPoints, 0).toLocaleString('vi-VN')}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-4 shadow-soft"
          >
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-primary-500" />
              <span className="text-sm text-dark-500">Tổng ví</span>
            </div>
            <div className="text-2xl font-bold text-primary-600">
              {users.reduce((sum, u) => sum + u.walletBalance, 0).toLocaleString('vi-VN')}đ
            </div>
          </motion.div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-dark-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dark-800">User</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dark-800">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dark-800">Ví</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dark-800">Điểm</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dark-800">Hạng</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dark-800">Ly cứu</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dark-800">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-dark-800">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-dark-500">
                      {searchQuery ? 'Không tìm thấy user nào' : 'Chưa có user nào'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user.userId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`hover:bg-primary-50/50 transition ${user.isBlacklisted ? 'bg-red-50/50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-bold text-sm">
                              {(user.displayName || user.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-dark-800 text-sm">
                              {user.displayName || 'Chưa có tên'}
                            </p>
                            <p className="text-xs text-dark-400">{user.userId.substring(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-dark-400" />
                          <span className="text-dark-700">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Wallet className="w-4 h-4 text-primary-500" />
                          <span className="font-semibold text-primary-600">
                            {user.walletBalance.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Award className="w-4 h-4 text-yellow-500" />
                          <span className="font-semibold text-dark-800">
                            {user.greenPoints.toLocaleString('vi-VN')}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-lg">{rankEmojis[user.rankLevel] || '🌱'}</span>
                        <span className="ml-2 text-sm text-dark-600 capitalize">{user.rankLevel}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-primary-600">
                          {user.totalCupsSaved}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.isBlacklisted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-semibold">
                            <Ban className="w-3 h-3" />
                            Blacklisted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-xs font-semibold">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition"
                          >
                            Sửa
                          </button>
                          {user.isBlacklisted ? (
                            <button
                              onClick={() => handleUnblacklist(user.userId)}
                              className="px-3 py-1 bg-primary-500 text-white rounded-lg text-xs font-semibold hover:bg-primary-600 transition"
                            >
                              Gỡ Blacklist
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const reason = prompt('Lý do blacklist:');
                                if (reason) {
                                  handleBlacklist(user.userId, reason);
                                }
                              }}
                              className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition"
                            >
                              Blacklist
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl"
          >
            <h2 className="text-xl font-bold text-dark-800">Sửa thông tin User</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-dark-600">Tên hiển thị</label>
                <input
                  className="w-full px-3 py-2 border rounded-lg"
                  value={editForm.displayName}
                  onChange={e => setEditForm({ ...editForm, displayName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-dark-600">Ví (VNĐ)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={editForm.walletBalance}
                    onChange={e => setEditForm({ ...editForm, walletBalance: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-600">Điểm (GreenPoint)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={editForm.greenPoints}
                    onChange={e => setEditForm({ ...editForm, greenPoints: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-dark-600">Hạng</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg"
                    value={editForm.rankLevel}
                    onChange={e => setEditForm({ ...editForm, rankLevel: e.target.value })}
                  >
                    <option value="seed">Seed</option>
                    <option value="sprout">Sprout</option>
                    <option value="sapling">Sapling</option>
                    <option value="tree">Tree</option>
                    <option value="forest">Forest</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-dark-600">Ly cứu</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={editForm.totalCupsSaved}
                    onChange={e => setEditForm({ ...editForm, totalCupsSaved: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-dark-600 hover:bg-dark-50 rounded-lg"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-semibold"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}


