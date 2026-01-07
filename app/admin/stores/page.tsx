'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store as StoreIcon, Plus, MapPin, Package, Edit, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { onAuthChange } from '@/lib/supabase/auth';
import { isAdminEmail } from '@/lib/supabase/admin';
import toast from 'react-hot-toast';

interface Store {
    storeId: string;
    name: string;
    address: string;
    gpsLat: number;
    gpsLng: number;
    cupAvailable: number;
    cupInUse: number;
    cupCleaning: number;
    cupTotal: number;
    partnerStatus: string;
}

export default function StoresManagementPage() {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({
        name: '',
        address: '',
        gpsLat: '',
        gpsLng: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const fetchStores = useCallback(async () => {
        try {
            const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || '';
            const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';
            const email = adminKey.split(',')[0].trim();

            const { data: { session } } = await import('@/lib/supabase/client').then(m => m.supabase.auth.getSession());

            const res = await fetch('/api/admin/stores', {
                headers: {
                    'x-admin-email': email,
                    'x-admin-password': adminPassword,
                    'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
                },
            });

            const data = await res.json();
            if (data.success) {
                setStores(data.stores);
            } else {
                toast.error('Không thể tải danh sách cửa hàng');
            }
        } catch (error) {
            console.error('Error fetching stores:', error);
            toast.error('Lỗi kết nối');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthChange(async (user) => {
            if (!user) {
                router.push('/auth/login');
                return;
            }
            // Use local check only for UI access
            const isAdmin = isAdminEmail(user.email || '');
            if (!isAdmin) {
                toast.error('Không có quyền truy cập');
                router.push('/');
                return;
            }
            setAuthorized(true);
            fetchStores();
        });
        return () => unsubscribe();
    }, [router, fetchStores]);

    const [editingStoreId, setEditingStoreId] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || '';
            const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';
            const email = adminKey.split(',')[0].trim();

            const url = editingStoreId
                ? `/api/admin/stores/${editingStoreId}`
                : '/api/admin/stores';

            const method = editingStoreId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-email': email,
                    'x-admin-password': adminPassword,
                },
                body: JSON.stringify({
                    ...form,
                    gpsLat: parseFloat(form.gpsLat) || 0,
                    gpsLng: parseFloat(form.gpsLng) || 0,
                    partnerStatus: 'active'
                }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success(editingStoreId ? 'Cập nhật thành công' : 'Thêm cửa hàng thành công');
                setForm({ name: '', address: '', gpsLat: '', gpsLng: '' });
                setEditingStoreId(null);
                setIsModalOpen(false);
                fetchStores();
            } else {
                toast.error(data.error || 'Lỗi khi lưu cửa hàng');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (store: Store) => {
        setEditingStoreId(store.storeId);
        setForm({
            name: store.name,
            address: store.address,
            gpsLat: store.gpsLat.toString(),
            gpsLng: store.gpsLng.toString()
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (storeId: string) => {
        if (!confirm('Bạn có chắc chắn muốn xóa (lưu trữ) cửa hàng này không?')) return;

        try {
            const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || '';
            const email = adminKey.split(',')[0].trim();

            const res = await fetch(`/api/admin/stores/${storeId}`, {
                method: 'DELETE',
                headers: {
                    'x-admin-email': email,
                },
            });

            if (res.ok) {
                toast.success('Đã lưu trữ cửa hàng');
                fetchStores();
            } else {
                toast.error('Lỗi khi xóa');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingStoreId(null);
        setForm({ name: '', address: '', gpsLat: '', gpsLng: '' });
    };

    if (loading || !authorized) {
        return <div className="p-8 text-center text-dark-500">Đang tải...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark-800">Quản lý Cửa Hàng</h1>
                    <p className="text-dark-500">Danh sách các điểm đối tác và tình trạng ly</p>
                </div>
                <button
                    onClick={() => {
                        setEditingStoreId(null);
                        setForm({ name: '', address: '', gpsLat: '', gpsLng: '' });
                        setIsModalOpen(true);
                    }}
                    className="bg-primary-500 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-primary-600 transition"
                >
                    <Plus className="w-5 h-5" />
                    Thêm cửa hàng
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {stores.map((store) => (
                    <motion.div
                        key={store.storeId}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl p-6 shadow-soft border border-dark-100"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
                                    <StoreIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-dark-800">{store.name}</h3>
                                    <div className="flex items-center gap-1 text-sm text-dark-500">
                                        <MapPin className="w-3 h-3" />
                                        <span className="truncate max-w-[200px]">{store.address}</span>
                                    </div>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${store.partnerStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {store.partnerStatus === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-dark-50">
                            <div>
                                <div className="text-xs text-dark-400 mb-1">Có sẵn</div>
                                <div className="text-xl font-bold text-primary-600">{store.cupAvailable}</div>
                            </div>
                            <div>
                                <div className="text-xs text-dark-400 mb-1">Đang dùng</div>
                                <div className="text-xl font-bold text-orange-500">{store.cupInUse}</div>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                            <button
                                onClick={() => handleEdit(store)}
                                className="flex-1 px-3 py-2 bg-dark-50 text-dark-600 rounded-xl text-sm font-semibold hover:bg-dark-100 transition flex items-center justify-center gap-2"
                            >
                                <Edit className="w-4 h-4" />
                                Sửa
                            </button>
                            <button
                                onClick={() => handleDelete(store.storeId)}
                                className="px-3 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition flex items-center justify-center"
                                title="Lưu trữ (Xóa)"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Modal Add/Edit Store */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseModal}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-lg relative z-10 shadow-xl"
                        >
                            <h3 className="text-xl font-bold text-dark-800 mb-4">
                                {editingStoreId ? 'Cập nhật cửa hàng' : 'Thêm cửa hàng mới'}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-dark-700 mb-1">Tên cửa hàng</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-dark-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="VD: Coffee House A"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-dark-700 mb-1">Địa chỉ</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.address}
                                        onChange={e => setForm({ ...form, address: e.target.value })}
                                        className="w-full px-4 py-2 border border-dark-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="Số nhà, đường..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-dark-700 mb-1">Lat</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={form.gpsLat}
                                            onChange={e => setForm({ ...form, gpsLat: e.target.value })}
                                            className="w-full px-4 py-2 border border-dark-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-dark-700 mb-1">Lng</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={form.gpsLng}
                                            onChange={e => setForm({ ...form, gpsLng: e.target.value })}
                                            className="w-full px-4 py-2 border border-dark-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 px-4 py-2 border border-dark-200 text-dark-600 rounded-xl font-semibold hover:bg-dark-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Đang lưu...' : (editingStoreId ? 'Cập nhật' : 'Lưu cửa hàng')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
