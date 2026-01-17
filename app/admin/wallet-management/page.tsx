'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Wallet, Search, Filter, Lock, Unlock, Plus, Minus,
    Users, TrendingUp, AlertTriangle, Download, RefreshCw,
    ChevronLeft, ChevronRight, Eye, MoreVertical
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isAdminEmail } from '@/lib/supabase/admin-auth';
import toast from 'react-hot-toast';

interface WalletUser {
    userId: string;
    email: string;
    displayName: string;
    balance: number;
    frozen: boolean;
    frozenReason?: string;
    createdAt: string;
}

interface WalletStats {
    totalUsers: number;
    totalBalance: number;
    frozenWallets: number;
    todayTopups: number;
    todayWithdrawals: number;
}

export default function WalletManagementPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [wallets, setWallets] = useState<WalletUser[]>([]);
    const [stats, setStats] = useState<WalletStats | null>(null);
    const [search, setSearch] = useState('');
    const [frozenOnly, setFrozenOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedUser, setSelectedUser] = useState<WalletUser | null>(null);
    const [actionModal, setActionModal] = useState<'freeze' | 'adjust' | null>(null);

    // Auth check
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session || !isAdminEmail(session.user.email || '')) {
                router.replace('/admin');
            }
        };
        checkAuth();
    }, [router, supabase]);

    // Fetch wallets
    const fetchWallets = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(search && { search }),
                ...(frozenOnly && { frozen: 'true' }),
            });

            const res = await fetch(`/api/admin/wallets?${params}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            const data = await res.json();

            if (data.success) {
                setWallets(data.data.wallets);
                setStats(data.data.stats);
                setTotalPages(data.data.pagination.totalPages);
            }
        } catch (error) {
            console.error('Error fetching wallets:', error);
            toast.error('Không thể tải danh sách ví');
        } finally {
            setLoading(false);
        }
    }, [page, search, frozenOnly, supabase]);

    useEffect(() => {
        fetchWallets();
    }, [fetchWallets]);

    // Handle freeze/unfreeze
    const handleFreezeToggle = async (user: WalletUser, reason: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('Vui lòng đăng nhập lại');
                return;
            }

            const res = await fetch('/api/admin/wallets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    action: user.frozen ? 'unfreeze' : 'freeze',
                    userId: user.userId,
                    reason,
                }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success(user.frozen ? 'Đã mở khóa ví' : 'Đã đóng băng ví');
                fetchWallets();
            } else {
                toast.error(data.error || 'Thao tác thất bại');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
        }
        setActionModal(null);
        setSelectedUser(null);
    };

    // Handle balance adjustment
    const handleAdjustBalance = async (userId: string, amount: number, type: 'add' | 'subtract', reason: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('Vui lòng đăng nhập lại');
                return;
            }

            const res = await fetch('/api/admin/wallets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    action: 'adjust',
                    userId,
                    amount,
                    type,
                    reason,
                }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success(`Đã ${type === 'add' ? 'cộng' : 'trừ'} ${amount.toLocaleString('vi-VN')}đ`);
                fetchWallets();
            } else {
                toast.error(data.error || 'Điều chỉnh thất bại');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
        }
        setActionModal(null);
        setSelectedUser(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <Wallet className="w-7 h-7 text-primary-600" />
                            Quản lý Ví người dùng
                        </h1>
                        <p className="text-gray-600 mt-1">Xem và quản lý ví VNES của tất cả người dùng</p>
                    </div>
                    <button
                        onClick={fetchWallets}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </button>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                        <StatCard
                            icon={Users}
                            label="Tổng người dùng"
                            value={stats.totalUsers.toLocaleString()}
                            color="bg-blue-500"
                        />
                        <StatCard
                            icon={Wallet}
                            label="Tổng số dư"
                            value={`${(stats.totalBalance / 1000000).toFixed(1)}M`}
                            color="bg-primary-500"
                        />
                        <StatCard
                            icon={AlertTriangle}
                            label="Ví bị khóa"
                            value={stats.frozenWallets.toString()}
                            color="bg-red-500"
                        />
                        <StatCard
                            icon={TrendingUp}
                            label="Nạp hôm nay"
                            value={`${(stats.todayTopups / 1000000).toFixed(1)}M`}
                            color="bg-green-500"
                        />
                        <StatCard
                            icon={Download}
                            label="Rút hôm nay"
                            value={`${(stats.todayWithdrawals / 1000000).toFixed(1)}M`}
                            color="bg-orange-500"
                        />
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo email hoặc tên..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={frozenOnly}
                            onChange={(e) => {
                                setFrozenOnly(e.target.checked);
                                setPage(1);
                            }}
                            className="w-4 h-4 text-primary-600 rounded"
                        />
                        <span className="text-sm text-gray-700">Chỉ hiện ví bị khóa</span>
                    </label>
                </div>

                {/* Wallet Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Người dùng</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Số dư</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        Đang tải...
                                    </td>
                                </tr>
                            ) : wallets.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        Không tìm thấy ví nào
                                    </td>
                                </tr>
                            ) : (
                                wallets.map((wallet) => (
                                    <tr key={wallet.userId} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{wallet.displayName || 'Chưa đặt tên'}</div>
                                            <div className="text-sm text-gray-500">{wallet.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-semibold text-gray-900">
                                                {wallet.balance.toLocaleString('vi-VN')}đ
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {wallet.frozen ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                                                    <Lock className="w-3 h-3" /> Đã khóa
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                                    <Unlock className="w-3 h-3" /> Hoạt động
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(wallet);
                                                        setActionModal('freeze');
                                                    }}
                                                    className={`p-2 rounded-lg transition-colors ${wallet.frozen
                                                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                                        : 'bg-red-100 text-red-600 hover:bg-red-200'
                                                        }`}
                                                    title={wallet.frozen ? 'Mở khóa' : 'Khóa ví'}
                                                >
                                                    {wallet.frozen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(wallet);
                                                        setActionModal('adjust');
                                                    }}
                                                    className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                                    title="Điều chỉnh số dư"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
                            <span className="text-sm text-gray-600">
                                Trang {page} / {totalPages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Freeze Modal */}
                {actionModal === 'freeze' && selectedUser && (
                    <FreezeModal
                        user={selectedUser}
                        onClose={() => {
                            setActionModal(null);
                            setSelectedUser(null);
                        }}
                        onConfirm={(reason) => handleFreezeToggle(selectedUser, reason)}
                    />
                )}

                {/* Adjust Modal */}
                {actionModal === 'adjust' && selectedUser && (
                    <AdjustModal
                        user={selectedUser}
                        onClose={() => {
                            setActionModal(null);
                            setSelectedUser(null);
                        }}
                        onConfirm={(amount, type, reason) =>
                            handleAdjustBalance(selectedUser.userId, amount, type, reason)
                        }
                    />
                )}
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
    return (
        <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{label}</div>
        </div>
    );
}

// Freeze Modal
function FreezeModal({
    user,
    onClose,
    onConfirm,
}: {
    user: WalletUser;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}) {
    const [reason, setReason] = useState('');

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {user.frozen ? 'Mở khóa ví' : 'Đóng băng ví'}
                </h3>
                <p className="text-gray-600 mb-4">
                    {user.frozen
                        ? `Bạn có chắc muốn mở khóa ví cho ${user.email}?`
                        : `Bạn có chắc muốn đóng băng ví của ${user.email}?`}
                </p>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lý do</label>
                    <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Nhập lý do..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={() => onConfirm(reason)}
                        disabled={!reason.trim()}
                        className={`flex-1 px-4 py-2 rounded-lg text-white ${user.frozen
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-red-600 hover:bg-red-700'
                            } disabled:opacity-50`}
                    >
                        {user.frozen ? 'Mở khóa' : 'Đóng băng'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// Adjust Modal
function AdjustModal({
    user,
    onClose,
    onConfirm,
}: {
    user: WalletUser;
    onClose: () => void;
    onConfirm: (amount: number, type: 'add' | 'subtract', reason: string) => void;
}) {
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'add' | 'subtract'>('add');
    const [reason, setReason] = useState('');

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
                <h3 className="text-lg font-bold text-gray-900 mb-2">Điều chỉnh số dư</h3>
                <p className="text-gray-600 mb-4">
                    {user.email} - Số dư hiện tại: <strong>{user.balance.toLocaleString('vi-VN')}đ</strong>
                </p>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại điều chỉnh</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setType('add')}
                            className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${type === 'add'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            <Plus className="w-4 h-4" /> Cộng tiền
                        </button>
                        <button
                            onClick={() => setType('subtract')}
                            className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${type === 'subtract'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 text-gray-700'
                                }`}
                        >
                            <Minus className="w-4 h-4" /> Trừ tiền
                        </button>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền (VNĐ)</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lý do</label>
                    <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Nhập lý do điều chỉnh..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={() => onConfirm(parseFloat(amount), type, reason)}
                        disabled={!amount || parseFloat(amount) <= 0 || !reason.trim()}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                        Xác nhận
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
