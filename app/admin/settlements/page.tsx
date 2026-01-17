'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Receipt, DollarSign, CheckCircle, Clock, XCircle,
    ChevronLeft, ChevronRight, RefreshCw, Calendar,
    Building, Download, Eye, Filter, TrendingUp, Shield
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isAdminEmail } from '@/lib/supabase/admin-auth';
import toast from 'react-hot-toast';

interface Settlement {
    batchId: string;
    partnerId: string;
    partnerName?: string;
    periodStart: string;
    periodEnd: string;
    totalTransactions: number;
    grossAmount: number;
    commissionAmount: number;
    netAmount: number;
    status: 'pending' | 'approved' | 'processing' | 'paid' | 'failed' | 'cancelled';
    approvedAt?: string;
    paidAt?: string;
    paymentReference?: string;
}

interface EscrowSummary {
    escrowType: string;
    totalBalance: number;
    transactionCount: number;
}

export default function SettlementsPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [settlements, setSettlements] = useState<Settlement[]>([]);
    const [escrowSummary, setEscrowSummary] = useState<EscrowSummary[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
    const [actionModal, setActionModal] = useState<'approve' | 'payout' | null>(null);

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

    // Fetch settlements
    const fetchSettlements = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(statusFilter && { status: statusFilter }),
            });

            const res = await fetch(`/api/admin/settlements?${params}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            const data = await res.json();

            if (data.success) {
                setSettlements(data.data.settlements);
                setEscrowSummary(data.data.escrowSummary);
                setTotalPages(data.data.pagination.totalPages);
            }
        } catch (error) {
            console.error('Error fetching settlements:', error);
            toast.error('Không thể tải danh sách quyết toán');
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, supabase]);

    useEffect(() => {
        fetchSettlements();
    }, [fetchSettlements]);

    // Handle approve
    const handleApprove = async (batchId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('Vui lòng đăng nhập lại');
                return;
            }

            const res = await fetch('/api/admin/settlements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ action: 'approve', batchId }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Đã duyệt quyết toán');
                fetchSettlements();
            } else {
                toast.error(data.error || 'Duyệt thất bại');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
        }
        setActionModal(null);
        setSelectedSettlement(null);
    };

    // Handle payout
    const handlePayout = async (batchId: string, paymentReference: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('Vui lòng đăng nhập lại');
                return;
            }

            const res = await fetch('/api/admin/settlements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ action: 'payout', batchId, paymentReference }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Đã hoàn thành thanh toán');
                fetchSettlements();
            } else {
                toast.error(data.error || 'Thanh toán thất bại');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
        }
        setActionModal(null);
        setSelectedSettlement(null);
    };

    const getStatusBadge = (status: Settlement['status']) => {
        const styles: Record<string, { bg: string; text: string; icon: any }> = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
            approved: { bg: 'bg-blue-100', text: 'text-blue-700', icon: CheckCircle },
            processing: { bg: 'bg-purple-100', text: 'text-purple-700', icon: RefreshCw },
            paid: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
            failed: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
            cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', icon: XCircle },
        };

        const style = styles[status] || styles.pending;
        const Icon = style.icon;
        const labels: Record<string, string> = {
            pending: 'Chờ duyệt',
            approved: 'Đã duyệt',
            processing: 'Đang xử lý',
            paid: 'Đã thanh toán',
            failed: 'Thất bại',
            cancelled: 'Đã hủy',
        };

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${style.bg} ${style.text} text-xs font-medium`}>
                <Icon className="w-3 h-3" />
                {labels[status]}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <Receipt className="w-7 h-7 text-primary-600" />
                            Quản lý Quyết toán Đối tác
                        </h1>
                        <p className="text-gray-600 mt-1">Duyệt và thanh toán cho các đối tác cửa hàng, vận tải</p>
                    </div>
                    <button
                        onClick={fetchSettlements}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </button>
                </div>

                {/* Escrow Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {escrowSummary.map((escrow) => (
                        <div key={escrow.escrowType} className="bg-white rounded-xl p-4 border border-gray-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className="w-5 h-5 text-primary-600" />
                                <span className="text-sm font-medium text-gray-600">
                                    {escrow.escrowType.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                            <div className="text-xl font-bold text-gray-900">
                                {escrow.totalBalance.toLocaleString('vi-VN')}đ
                            </div>
                            <div className="text-xs text-gray-500">
                                {escrow.transactionCount.toLocaleString()} giao dịch
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="pending">Chờ duyệt</option>
                        <option value="approved">Đã duyệt</option>
                        <option value="paid">Đã thanh toán</option>
                        <option value="failed">Thất bại</option>
                    </select>
                </div>

                {/* Settlements Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Đối tác</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Kỳ</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Tổng GD</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Net Amount</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Đang tải...
                                    </td>
                                </tr>
                            ) : settlements.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Không có quyết toán nào
                                    </td>
                                </tr>
                            ) : (
                                settlements.map((s) => (
                                    <tr key={s.batchId} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                                    <Building className="w-5 h-5 text-primary-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {s.partnerName || 'Đối tác'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        ID: {s.partnerId.slice(0, 8)}...
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(s.periodStart).toLocaleDateString('vi-VN')} -{' '}
                                                {new Date(s.periodEnd).toLocaleDateString('vi-VN')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-gray-600">
                                            {s.totalTransactions.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-semibold text-gray-900">
                                                {s.netAmount.toLocaleString('vi-VN')}đ
                                            </span>
                                            <div className="text-xs text-gray-500">
                                                Phí: {s.commissionAmount.toLocaleString('vi-VN')}đ
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {getStatusBadge(s.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {s.status === 'pending' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedSettlement(s);
                                                            setActionModal('approve');
                                                        }}
                                                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                                                    >
                                                        Duyệt
                                                    </button>
                                                )}
                                                {s.status === 'approved' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedSettlement(s);
                                                            setActionModal('payout');
                                                        }}
                                                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                                                    >
                                                        Thanh toán
                                                    </button>
                                                )}
                                                {s.status === 'paid' && s.paymentReference && (
                                                    <span className="text-xs text-gray-500">
                                                        Ref: {s.paymentReference}
                                                    </span>
                                                )}
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

                {/* Approve Modal */}
                {actionModal === 'approve' && selectedSettlement && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-2xl p-6 max-w-md w-full"
                        >
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Duyệt quyết toán</h3>
                            <p className="text-gray-600 mb-4">
                                Xác nhận duyệt quyết toán{' '}
                                <strong>{selectedSettlement.netAmount.toLocaleString('vi-VN')}đ</strong> cho{' '}
                                {selectedSettlement.partnerName}?
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setActionModal(null);
                                        setSelectedSettlement(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={() => handleApprove(selectedSettlement.batchId)}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Xác nhận duyệt
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Payout Modal */}
                {actionModal === 'payout' && selectedSettlement && (
                    <PayoutModal
                        settlement={selectedSettlement}
                        onClose={() => {
                            setActionModal(null);
                            setSelectedSettlement(null);
                        }}
                        onConfirm={(ref) => handlePayout(selectedSettlement.batchId, ref)}
                    />
                )}
            </div>
        </div>
    );
}

// Payout Modal
function PayoutModal({
    settlement,
    onClose,
    onConfirm,
}: {
    settlement: Settlement;
    onClose: () => void;
    onConfirm: (paymentReference: string) => void;
}) {
    const [reference, setReference] = useState('');

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
                <h3 className="text-lg font-bold text-gray-900 mb-2">Xác nhận thanh toán</h3>
                <p className="text-gray-600 mb-4">
                    Thanh toán <strong>{settlement.netAmount.toLocaleString('vi-VN')}đ</strong> cho{' '}
                    {settlement.partnerName}
                </p>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mã tham chiếu chuyển khoản
                    </label>
                    <input
                        type="text"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="VD: VCB123456789"
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
                        onClick={() => onConfirm(reference)}
                        disabled={!reference.trim()}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                        Xác nhận đã thanh toán
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
