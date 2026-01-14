'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store as StoreIcon, MapPin, Edit, Power, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Store {
    storeId: string;
    name: string;
    address: string;
    partnerStatus: string;
    cupInventory: {
        available: number;
        total: number;
    };
}

export default function PartnerStoresPage() {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const res = await fetch('/api/partner/stores');
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                if (data.stores) setStores(data.stores);
            } catch (e) {
                console.error(e);
                toast.error('Không thể tải danh sách cửa hàng');
            } finally {
                setLoading(false);
            }
        };
        fetchStores();
    }, []);

    const toggleStatus = async (storeId: string, currentStatus: string) => {
        // Simulate API call
        toast.success(`Đã cập nhật trạng thái cửa hàng: ${currentStatus === 'active' ? 'Đóng cửa' : 'Mở cửa'}`);
        setStores(prev => prev.map(s => s.storeId === storeId ? { ...s, partnerStatus: currentStatus === 'active' ? 'inactive' : 'active' } : s));
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>;

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý cửa hàng</h1>
                    <p className="text-gray-500">Danh sách các điểm bán của bạn</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-blue-700 transition flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Thêm cửa hàng
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores.map((store) => (
                    <motion.div
                        key={store.storeId}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <StoreIcon className="w-6 h-6" />
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-bold border ${store.partnerStatus === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                {store.partnerStatus === 'active' ? 'Đang hoạt động' : 'Tạm đóng'}
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-1">{store.name}</h3>
                        <p className="text-gray-500 text-sm flex items-start gap-1 mb-6 min-h-[40px]">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            {store.address}
                        </p>

                        <div className="bg-gray-50 rounded-xl p-3 mb-6 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Ly có sẵn</p>
                                <p className="text-lg font-bold text-gray-900">{store.cupInventory.available}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Tổng nhập</p>
                                <p className="text-lg font-bold text-gray-900">{store.cupInventory.total}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold text-sm hover:bg-gray-200 transition flex items-center justify-center gap-2">
                                <Edit className="w-4 h-4" /> Sửa
                            </button>
                            <button
                                onClick={() => toggleStatus(store.storeId, store.partnerStatus)}
                                className={`p-2 rounded-lg transition ${store.partnerStatus === 'active' ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                                title={store.partnerStatus === 'active' ? 'Tắt hoạt động' : 'Mở hoạt động'}
                            >
                                <Power className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                ))}

                {/* Add New Placeholer */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all min-h-[300px]"
                >
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-white">
                        <Plus className="w-6 h-6" />
                    </div>
                    <span className="font-bold">Đăng ký điểm bán mới</span>
                </motion.button>
            </div>
        </div>
    );
}
