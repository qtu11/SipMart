'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Clock, CheckCircle, XCircle, Filter, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { onAuthChange } from '@/lib/supabase/auth';
import { isAdminEmail } from '@/lib/supabase/admin';
import toast from 'react-hot-toast';

interface Transaction {
    transactionId: string;
    userId: string;
    cupId: string;
    user: { email: string; displayName: string };
    cup: { material: string };
    borrowTime: string;
    dueTime: string;
    status: string;
    storeId: string;
}

export default function TransactionsManagementPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const router = useRouter();

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || '';
            const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';
            const email = adminKey.split(',')[0].trim();
            const { data: { session } } = await import('@/lib/supabase/client').then(m => m.supabase.auth.getSession());

            const query = new URLSearchParams({
                page: pagination.page.toString(),
                limit: '20',
                status: filterStatus === 'all' ? '' : filterStatus
            });

            const res = await fetch(`/api/admin/transactions?${query}`, {
                headers: {
                    'x-admin-email': email,
                    'x-admin-password': adminPassword,
                    'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
                },
            });

            const data = await res.json();
            if (data.success) {
                setTransactions(data.transactions);
                setPagination(prev => ({ ...prev, totalPages: data.pagination.totalPages }));
            } else {
                toast.error('Không thể tải giao dịch');
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, filterStatus]);

    useEffect(() => {
        const unsubscribe = onAuthChange(async (user) => {
            if (!user) {
                router.push('/auth/login');
                return;
            }
            const isAdmin = isAdminEmail(user.email || '');
            if (!isAdmin) {
                toast.error('Không có quyền truy cập');
                router.push('/');
                return;
            }
            setAuthorized(true);
            fetchTransactions();
        });
        return () => unsubscribe();
    }, [router, fetchTransactions]);

    const handleUpdateStatus = async (transactionId: string, newStatus: string) => {
        if (!confirm(`Bạn chắc chắn muốn chuyển trạng thái thành ${newStatus}?`)) return;

        try {
            const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || '';
            const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';
            const email = adminKey.split(',')[0].trim();
            const { data: { session } } = await import('@/lib/supabase/client').then(m => m.supabase.auth.getSession());

            const res = await fetch('/api/admin/transactions', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-email': email,
                    'x-admin-password': adminPassword,
                    'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
                },
                body: JSON.stringify({ transactionId, status: newStatus, forceComplete: true })
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Cập nhật thành công');
                fetchTransactions();
            } else {
                toast.error(data.error);
            }
        } catch (err) {
            toast.error('Lỗi kết nối');
        }
    };

    const statusColors: any = {
        ongoing: 'bg-blue-100 text-blue-700',
        completed: 'bg-green-100 text-green-700',
        overdue: 'bg-red-100 text-red-700',
        cancelled: 'bg-gray-100 text-gray-700'
    };

    if (!authorized && loading) return <div className="p-8 text-center">Checking access...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-800">Quản lý Giao Dịch</h1>
                    <p className="text-dark-500">Theo dõi mượn/trả ly theo thời gian thực</p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-dark-100 shadow-sm">
                    {['all', 'ongoing', 'overdue', 'completed'].map((status) => (
                        <button
                            key={status}
                            onClick={() => { setFilterStatus(status); setPagination(p => ({ ...p, page: 1 })) }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filterStatus === status
                                ? 'bg-primary-500 text-white shadow-sm'
                                : 'text-dark-500 hover:bg-dark-50'
                                }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-dark-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-dark-50 border-b border-dark-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 uppercase">ID / User</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 uppercase">Ly</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 uppercase">Thời gian</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-500 uppercase">Trạng thái</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-dark-500 uppercase">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-100">
                            {transactions.map((tx) => (
                                <tr key={tx.transactionId} className="hover:bg-primary-50/10 transition">
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-xs text-dark-400 mb-1">#{tx.transactionId.slice(0, 8)}</div>
                                        <div className="font-semibold text-dark-800">{tx.user?.displayName || 'Unknown'}</div>
                                        <div className="text-xs text-dark-500">{tx.user?.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-dark-100 text-dark-600 text-xs font-medium">
                                            {tx.cup?.material === 'bamboo_fiber' ? 'Sợi tre' : 'Nhựa PP'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-dark-800">
                                            {new Date(tx.borrowTime).toLocaleDateString('vi-VN')}
                                        </div>
                                        <div className="text-xs text-dark-500">
                                            {new Date(tx.borrowTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[tx.status] || 'bg-gray-100'}`}>
                                            {tx.status === 'ongoing' && <Clock className="w-3 h-3" />}
                                            {tx.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                                            {tx.status === 'overdue' && <XCircle className="w-3 h-3" />}
                                            {tx.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {tx.status === 'ongoing' || tx.status === 'overdue' ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleUpdateStatus(tx.transactionId, 'completed')}
                                                    title="Force Complete"
                                                    className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(tx.transactionId, 'cancelled')}
                                                    title="Cancel Transaction"
                                                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-dark-400">Đã xong</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
