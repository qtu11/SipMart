'use client';

import { useState, useEffect } from 'react';
import { Calculator, Plus, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { authFetch } from '@/lib/supabase/authFetch';
import toast from 'react-hot-toast';

interface Settlement {
    settlement_id: string;
    store: { name: string };
    period_start: string;
    period_end: string;
    total_revenue: number;
    net_payable: number;
    status: 'pending' | 'approved' | 'paid';
    created_at: string;
}

interface Store {
    store_id: string;
    name: string;
}

export default function SettlementsPage() {
    const [settlements, setSettlements] = useState<Settlement[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [showGenerateModal, setShowGenerateModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [settlementsRes, storesRes] = await Promise.all([
                authFetch('/api/admin/partners/settlements'),
                authFetch('/api/admin/stores')
            ]);

            if (settlementsRes.ok) {
                const data = await settlementsRes.json();
                setSettlements(data.settlements || []);
            }
            if (storesRes.ok) {
                const data = await storesRes.json();
                setStores(data.stores || []);
            }
        } catch (error) {
            toast.error('Lỗi tải dữ liệu đối soát');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="min-h-screen bg-dark-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <Calculator className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-dark-900">Đối soát Doanh thu</h1>
                            <p className="text-dark-600">Quyết toán tài chính định kỳ với đối tác</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowGenerateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Tạo Kỳ Đối Soát
                    </button>
                </div>

                {/* List */}
                <div className="bg-white rounded-xl shadow-sm border border-dark-100 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-dark-50 border-b border-dark-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-700">Cửa hàng</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-dark-700">Kỳ đối soát</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-dark-700">Tổng thu</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-dark-700">Thực nhận</th>
                                <th className="px-6 py-4 text-center text-sm font-semibold text-dark-700">Trạng thái</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-dark-700">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-100">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-8 text-dark-500">Đang tải...</td></tr>
                            ) : settlements.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-8 text-dark-500">Chưa có dữ liệu</td></tr>
                            ) : (
                                settlements.map((item) => (
                                    <tr key={item.settlement_id} className="hover:bg-dark-50">
                                        <td className="px-6 py-4 font-medium">{item.store?.name}</td>
                                        <td className="px-6 py-4 text-sm text-dark-600">
                                            {new Date(item.period_start).toLocaleDateString('vi-VN')} - {new Date(item.period_end).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium">{formatCurrency(item.total_revenue)}</td>
                                        <td className="px-6 py-4 text-right font-bold text-green-600">{formatCurrency(item.net_payable)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                    item.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {item.status === 'paid' ? 'Đã thanh toán' :
                                                    item.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Chi tiết</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Generate Modal */}
                {showGenerateModal && (
                    <GenerateSettlementModal
                        stores={stores}
                        onClose={() => setShowGenerateModal(false)}
                        onSuccess={() => {
                            fetchData();
                            setShowGenerateModal(false);
                        }}
                    />
                )}
            </div>
        </div>
    );
}

function GenerateSettlementModal({ stores, onClose, onSuccess }: { stores: Store[], onClose: () => void, onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        store_id: '',
        period_start: '',
        period_end: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await authFetch('/api/admin/partners/settlements', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');

            toast.success('Đã tạo đối soát mẫu');
            onSuccess();
        } catch (e: any) {
            toast.error(e.message || 'Lỗi khi tạo đối soát');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4">Tạo Kỳ Đối Soát Mới</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Cửa hàng</label>
                        <select
                            required
                            className="w-full px-3 py-2 border rounded-lg"
                            value={formData.store_id}
                            onChange={e => setFormData({ ...formData, store_id: e.target.value })}
                        >
                            <option value="">Chọn cửa hàng</option>
                            {stores.map(s => <option key={s.store_id} value={s.store_id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Từ ngày</label>
                            <input
                                type="date" required
                                className="w-full px-3 py-2 border rounded-lg"
                                value={formData.period_start}
                                onChange={e => setFormData({ ...formData, period_start: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Đến ngày</label>
                            <input
                                type="date" required
                                className="w-full px-3 py-2 border rounded-lg"
                                value={formData.period_end}
                                onChange={e => setFormData({ ...formData, period_end: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
                        <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
                            {submitting ? 'Đang xử lý...' : 'Tạo Đối soát'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
