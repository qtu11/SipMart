'use client';

import { useState, useEffect } from 'react';
import { RotateCcw, Plus, ArrowRight, Truck } from 'lucide-react';
import { authFetch } from '@/lib/supabase/authFetch';
import toast from 'react-hot-toast';

interface Store {
    store_id: string;
    name: string;
}

interface Order {
    order_id: string;
    from_store: { name: string };
    to_store: { name: string };
    cup_count: number;
    status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high';
    created_at: string;
    notes?: string;
}

export default function RedistributionPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ordersRes, storesRes] = await Promise.all([
                authFetch('/api/admin/redistribution'),
                authFetch('/api/admin/stores') // Assuming existing stores API
            ]);

            if (ordersRes.ok) {
                const data = await ordersRes.json();
                setOrders(data.orders || []);
            }

            if (storesRes.ok) {
                const data = await storesRes.json();
                setStores(data.stores || []);
            }
        } catch (error) {
            //   toast.error('Có lỗi khi tải dữ liệu');
            // Silently fail or minimal error as stores API might need adjustment
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                            <RotateCcw className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-dark-900">Điều Phối Ly</h1>
                            <p className="text-dark-600">Cân bằng số lượng ly giữa các điểm bán</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Tạo Lệnh Điều Chuyển
                    </button>
                </div>

                {/* Orders List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loading ? (
                        <p className="text-dark-500">Đang tải...</p>
                    ) : orders.length === 0 ? (
                        <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm border border-dark-100">
                            <Truck className="w-12 h-12 text-dark-300 mx-auto mb-3" />
                            <p className="text-dark-500">Chưa có lệnh điều chuyển nào</p>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <OrderCard key={order.order_id} order={order} />
                        ))
                    )}
                </div>

                {/* Create Modal */}
                {showCreateModal && (
                    <CreateOrderModal
                        stores={stores}
                        onClose={() => setShowCreateModal(false)}
                        onSuccess={() => {
                            fetchData();
                            setShowCreateModal(false);
                        }}
                    />
                )}
            </div>
        </div>
    );
}

function OrderCard({ order }: { order: Order }) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'in_transit': return 'bg-blue-100 text-blue-700';
            case 'completed': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-dark-100">
            <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${order.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600'
                    }`}>
                    {order.priority === 'high' ? 'Khẩn cấp' : 'Thường'}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                </span>
            </div>

            <div className="flex items-center gap-3 my-4">
                <div className="flex-1">
                    <p className="text-xs text-dark-500 mb-1">Từ kho</p>
                    <p className="font-semibold text-dark-900">{order.from_store?.name}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-dark-300" />
                <div className="flex-1 text-right">
                    <p className="text-xs text-dark-500 mb-1">Đến kho</p>
                    <p className="font-semibold text-dark-900">{order.to_store?.name}</p>
                </div>
            </div>

            <div className="pt-4 border-t border-dark-50 flex justify-between items-center text-sm">
                <span className="font-bold text-primary-600">{order.cup_count} Ly</span>
                <span className="text-dark-400">{new Date(order.created_at).toLocaleDateString('vi-VN')}</span>
            </div>
        </div>
    )
}


function CreateOrderModal({ stores, onClose, onSuccess }: { stores: Store[], onClose: () => void, onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        from_store_id: '',
        to_store_id: '',
        cup_count: 50,
        priority: 'medium',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.from_store_id === formData.to_store_id) {
            toast.error('Kho đi và kho đến không được trùng nhau');
            return;
        }

        setSubmitting(true);

        try {
            const res = await authFetch('/api/admin/redistribution', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Create failed');

            toast.success('Đã tạo lệnh điều chuyển');
            onSuccess();
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4">Tạo Lệnh Điều Chuyển</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Từ kho</label>
                            <select
                                required
                                className="w-full px-3 py-2 border rounded-lg"
                                value={formData.from_store_id}
                                onChange={e => setFormData({ ...formData, from_store_id: e.target.value })}
                            >
                                <option value="">Chọn kho</option>
                                {stores.map(s => (
                                    <option key={s.store_id} value={s.store_id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Đến kho</label>
                            <select
                                required
                                className="w-full px-3 py-2 border rounded-lg"
                                value={formData.to_store_id}
                                onChange={e => setFormData({ ...formData, to_store_id: e.target.value })}
                            >
                                <option value="">Chọn kho</option>
                                {stores.map(s => (
                                    <option key={s.store_id} value={s.store_id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Số lượng ly</label>
                        <input
                            type="number"
                            min="1"
                            required
                            className="w-full px-3 py-2 border rounded-lg"
                            value={formData.cup_count}
                            onChange={e => setFormData({ ...formData, cup_count: Number(e.target.value) })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Mức độ ưu tiên</label>
                        <select
                            className="w-full px-3 py-2 border rounded-lg"
                            value={formData.priority}
                            onChange={e => setFormData({ ...formData, priority: e.target.value })}
                        >
                            <option value="low">Thấp</option>
                            <option value="medium">Bình thường</option>
                            <option value="high">Khẩn cấp</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Ghi chú</label>
                        <textarea
                            className="w-full px-3 py-2 border rounded-lg"
                            rows={2}
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                        >
                            {submitting ? 'Đang tạo...' : 'Tạo lệnh'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
