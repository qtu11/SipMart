'use client';

import { useState, useEffect, useCallback } from 'react';
import { Ticket, Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { authFetch } from '@/lib/supabase/authFetch';

interface Voucher {
    voucher_id: string;
    code: string;
    name: string;
    description: string | null;
    discount_type: 'percent' | 'fixed';
    discount_value: number;
    max_discount: number | null;
    min_order_value: number;
    usage_limit: number | null;
    usage_per_user: number;
    valid_from: string;
    valid_until: string | null;
    target_rank: string | null;
    is_active: boolean;
    created_at: string;
}

export default function AdminVouchersPage() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
    const [search, setSearch] = useState('');
    const [filterActive, setFilterActive] = useState<boolean | null>(null);

    const fetchVouchers = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (filterActive !== null) params.set('isActive', filterActive.toString());

            const res = await authFetch(`/api/admin/vouchers?${params}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setVouchers(data.vouchers || []);
        } catch (error) {
            console.error('Fetch vouchers error:', error);
            toast.error('Không thể tải danh sách voucher');
        } finally {
            setLoading(false);
        }
    }, [search, filterActive]);

    useEffect(() => {
        fetchVouchers();
    }, [fetchVouchers]);

    const handleDelete = async (voucherId: string) => {
        if (!confirm('Bạn có chắc muốn xóa voucher này?')) return;

        try {
            const res = await authFetch(`/api/admin/vouchers/${voucherId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Delete failed');
            toast.success('Đã xóa voucher');
            fetchVouchers();
        } catch (error) {
            toast.error('Xóa voucher thất bại');
        }
    };

    return (
        <div className="min-h-screen bg-dark-50">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary-500 to-primary-600 flex items-center justify-center">
                            <Ticket className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-dark-900">Quản lý Voucher</h1>
                            <p className="text-dark-600">Tạo và quản lý mã giảm giá</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                    >
                        <Plus className="w-4 h-4" />
                        Tạo Voucher
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-soft p-4 mb-6">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                            <input
                                type="text"
                                placeholder="Tìm theo mã hoặc tên..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-dark-200 rounded-lg"
                            />
                        </div>
                        <select
                            value={filterActive === null ? 'all' : filterActive.toString()}
                            onChange={(e) => setFilterActive(e.target.value === 'all' ? null : e.target.value === 'true')}
                            className="px-4 py-2 border border-dark-200 rounded-lg"
                        >
                            <option value="all">Tất cả</option>
                            <option value="true">Đang hoạt động</option>
                            <option value="false">Đã tắt</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow-soft overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-dark-600">Đang tải...</div>
                    ) : vouchers.length === 0 ? (
                        <div className="p-8 text-center text-dark-600">Chưa có voucher nào</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-dark-50 border-b border-dark-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-dark-700">Mã</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-dark-700">Tên</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-dark-700">Giảm giá</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-dark-700">Giới hạn</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-dark-700">Hạn sử dụng</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-dark-700">Trạng thái</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-dark-700">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-100">
                                    {vouchers.map((voucher) => (
                                        <tr key={voucher.voucher_id} className="hover:bg-dark-50">
                                            <td className="px-4 py-3">
                                                <code className="px-2 py-1 bg-dark-100 rounded text-sm font-mono">
                                                    {voucher.code}
                                                </code>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-dark-900">{voucher.name}</td>
                                            <td className="px-4 py-3 text-sm">
                                                {voucher.discount_type === 'percent' ? (
                                                    <span className="text-primary-600 font-semibold">{voucher.discount_value}%</span>
                                                ) : (
                                                    <span className="text-primary-600 font-semibold">
                                                        {voucher.discount_value.toLocaleString('vi-VN')}đ
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-dark-600">
                                                {voucher.usage_limit ? `${voucher.usage_limit} lượt` : 'Không giới hạn'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-dark-600">
                                                {voucher.valid_until
                                                    ? new Date(voucher.valid_until).toLocaleDateString('vi-VN')
                                                    : 'Vô thời hạn'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${voucher.is_active
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                        }`}
                                                >
                                                    {voucher.is_active ? 'Hoạt động' : 'Đã tắt'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setEditingVoucher(voucher)}
                                                        className="p-2 text-primary-600 hover:bg-primary-50 rounded"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(voucher.voucher_id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {(showCreateModal || editingVoucher) && (
                <VoucherModal
                    voucher={editingVoucher}
                    onClose={() => {
                        setShowCreateModal(false);
                        setEditingVoucher(null);
                    }}
                    onSuccess={() => {
                        fetchVouchers();
                        setShowCreateModal(false);
                        setEditingVoucher(null);
                    }}
                />
            )}
        </div>
    );
}

// Voucher Modal Component
function VoucherModal({
    voucher,
    onClose,
    onSuccess
}: {
    voucher: Voucher | null;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = useState({
        code: voucher?.code || '',
        name: voucher?.name || '',
        description: voucher?.description || '',
        discount_type: voucher?.discount_type || 'percent',
        discount_value: voucher?.discount_value || 10,
        max_discount: voucher?.max_discount || '',
        min_order_value: voucher?.min_order_value || 0,
        usage_limit: voucher?.usage_limit || '',
        usage_per_user: voucher?.usage_per_user || 1,
        valid_from: voucher?.valid_from?.split('T')[0] || new Date().toISOString().split('T')[0],
        valid_until: voucher?.valid_until?.split('T')[0] || '',
        target_rank: voucher?.target_rank || '',
        is_active: voucher?.is_active !== undefined ? voucher.is_active : true
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = voucher
                ? `/api/admin/vouchers/${voucher.voucher_id}`
                : '/api/admin/vouchers';
            const method = voucher ? 'PATCH' : 'POST';

            const res = await authFetch(url, {
                method,
                body: JSON.stringify({
                    ...formData,
                    max_discount: formData.max_discount ? Number(formData.max_discount) : null,
                    usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
                    valid_until: formData.valid_until || null,
                    target_rank: formData.target_rank || null
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed');
            }

            toast.success(voucher ? 'Đã cập nhật voucher' : 'Đã tạo voucher mới');
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || 'Có lỗi xảy ra');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-dark-200">
                    <h2 className="text-xl font-bold text-dark-900">
                        {voucher ? 'Chỉnh sửa Voucher' : 'Tạo Voucher Mới'}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-dark-700 mb-1">
                                Mã Voucher <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                className="w-full px-3 py-2 border border-dark-200 rounded-lg uppercase"
                                placeholder="SUMMER50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-dark-700 mb-1">
                                Tên Voucher <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-dark-200 rounded-lg"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-dark-700 mb-1">Mô tả</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-dark-200 rounded-lg"
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-dark-700 mb-1">Loại giảm giá</label>
                            <select
                                value={formData.discount_type}
                                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                                className="w-full px-3 py-2 border border-dark-200 rounded-lg"
                            >
                                <option value="percent">Phần trăm (%)</option>
                                <option value="fixed">Số tiền cố định</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-dark-700 mb-1">Giá trị</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.discount_value}
                                onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-dark-200 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-dark-700 mb-1">Giảm tối đa</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.max_discount}
                                onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                                className="w-full px-3 py-2 border border-dark-200 rounded-lg"
                                placeholder="Không giới hạn"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-dark-700 mb-1">Đơn tối thiểu</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.min_order_value}
                                onChange={(e) => setFormData({ ...formData, min_order_value: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-dark-200 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-dark-700 mb-1">Tổng lượt dùng</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.usage_limit}
                                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                                className="w-full px-3 py-2 border border-dark-200 rounded-lg"
                                placeholder="Không giới hạn"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-dark-700 mb-1">Lượt/người</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.usage_per_user}
                                onChange={(e) => setFormData({ ...formData, usage_per_user: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-dark-200 rounded-lg"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-dark-700 mb-1">Từ ngày</label>
                            <input
                                type="date"
                                required
                                value={formData.valid_from}
                                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                                className="w-full px-3 py-2 border border-dark-200 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-dark-700 mb-1">Đến ngày</label>
                            <input
                                type="date"
                                value={formData.valid_until}
                                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                                className="w-full px-3 py-2 border border-dark-200 rounded-lg"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-dark-700 mb-1">Rank yêu cầu</label>
                            <select
                                value={formData.target_rank}
                                onChange={(e) => setFormData({ ...formData, target_rank: e.target.value })}
                                className="w-full px-3 py-2 border border-dark-200 rounded-lg"
                            >
                                <option value="">Tất cả</option>
                                <option value="seed">Seed</option>
                                <option value="sprout">Sprout</option>
                                <option value="sapling">Sapling</option>
                                <option value="tree">Tree</option>
                                <option value="forest">Forest</option>
                            </select>
                        </div>
                        <div className="flex items-center">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 text-primary-500 rounded"
                                />
                                <span className="text-sm font-medium text-dark-700">Kích hoạt ngay</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-dark-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-dark-200 text-dark-700 rounded-lg hover:bg-dark-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                        >
                            {saving ? 'Đang lưu...' : voucher ? 'Cập nhật' : 'Tạo mới'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
