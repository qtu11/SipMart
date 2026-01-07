'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Plus, MapPin, Activity } from 'lucide-react';
import { authFetch } from '@/lib/supabase/authFetch';
import toast from 'react-hot-toast';

interface CleaningHub {
    hub_id: string;
    name: string;
    location: string;
    capacity: number;
    current_load: number;
    status: 'active' | 'maintenance' | 'closed';
    manager?: { user_id: string };
    created_at: string;
}

export default function CleaningHubsPage() {
    const [hubs, setHubs] = useState<CleaningHub[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchHubs();
    }, []);

    const fetchHubs = async () => {
        try {
            setLoading(true);
            const res = await authFetch('/api/admin/cleaning-hubs');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setHubs(data.hubs || []);
        } catch (error) {
            toast.error('Không thể tải danh sách trạm rửa');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-dark-900">Quản lý Trạm Rửa</h1>
                            <p className="text-dark-600">Danh sách các điểm xử lý vệ sinh ly</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm Trạm Mới
                    </button>
                </div>

                {/* Hubs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <p className="text-dark-500">Đang tải...</p>
                    ) : hubs.length === 0 ? (
                        <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm">
                            <Sparkles className="w-12 h-12 text-dark-300 mx-auto mb-3" />
                            <p className="text-dark-500">Chưa có trạm rửa nào được tạo</p>
                        </div>
                    ) : (
                        hubs.map((hub) => (
                            <HubCard key={hub.hub_id} hub={hub} />
                        ))
                    )}
                </div>

                {/* Create Modal */}
                {showCreateModal && (
                    <CreateHubModal
                        onClose={() => setShowCreateModal(false)}
                        onSuccess={() => {
                            fetchHubs();
                            setShowCreateModal(false);
                        }}
                    />
                )}
            </div>
        </div>
    );
}

function HubCard({ hub }: { hub: CleaningHub }) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700';
            case 'maintenance': return 'bg-yellow-100 text-yellow-700';
            case 'closed': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active': return 'Hoạt động';
            case 'maintenance': return 'Bảo trì';
            case 'closed': return 'Đóng cửa';
            default: return status;
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-dark-100 hover:border-blue-300 transition-all p-5">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-lg text-dark-900">{hub.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-dark-500 mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {hub.location || 'Chưa cập nhật vị trí'}
                    </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(hub.status)}`}>
                    {getStatusText(hub.status)}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-dark-50 my-4">
                <div>
                    <p className="text-xs text-dark-500 mb-1">Công suất</p>
                    <p className="font-semibold text-dark-800">{hub.capacity} ly/h</p>
                </div>
                <div>
                    <p className="text-xs text-dark-500 mb-1">Đang xử lý</p>
                    <p className="font-semibold text-blue-600">{hub.current_load} ly</p>
                </div>
            </div>

            <div className="flex items-center justify-between text-xs text-dark-400">
                <span>Quản lý: {hub.manager?.user_id?.substring(0, 8) || 'Admin'}</span>
                <span>{new Date(hub.created_at).toLocaleDateString('vi-VN')}</span>
            </div>
        </div>
    );
}

function CreateHubModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        capacity: 100,
        status: 'active'
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const res = await authFetch('/api/admin/cleaning-hubs', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Create failed');

            toast.success('Đã tạo trạm rửa mới');
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
                <h2 className="text-xl font-bold mb-4">Thêm Trạm Rửa Mới</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Tên trạm <span className="text-red-500">*</span></label>
                        <input
                            required
                            className="w-full px-3 py-2 border rounded-lg"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ví dụ: Hub Trung Tâm UEF"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Vị trí</label>
                        <input
                            className="w-full px-3 py-2 border rounded-lg"
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                            placeholder="Ví dụ: Tầng hầm B1"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Công suất (ly/h)</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border rounded-lg"
                                value={formData.capacity}
                                onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Trạng thái</label>
                            <select
                                className="w-full px-3 py-2 border rounded-lg"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="active">Hoạt động</option>
                                <option value="maintenance">Bảo trì</option>
                                <option value="closed">Đóng cửa</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                        >
                            {submitting ? 'Đang tạo...' : 'Tạo mới'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
