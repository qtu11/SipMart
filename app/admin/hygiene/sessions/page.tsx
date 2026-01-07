'use client';

import { useState, useEffect } from 'react';
import { Droplets, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { authFetch } from '@/lib/supabase/authFetch';
import toast from 'react-hot-toast';

interface Hub {
    hub_id: string;
    name: string;
}

interface Session {
    session_id: string;
    hub: { name: string };
    cup_count: number;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    started_at: string;
    completed_at: string | null;
    staff: { user_id: string };
    notes: string | null;
}

export default function CleaningSessionsPage() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [hubs, setHubs] = useState<Hub[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [sessionsRes, hubsRes] = await Promise.all([
                authFetch('/api/admin/cleaning-sessions'),
                authFetch('/api/admin/cleaning-hubs?status=active')
            ]);

            if (sessionsRes.ok) {
                const data = await sessionsRes.json();
                setSessions(data.sessions || []);
            }

            if (hubsRes.ok) {
                const data = await hubsRes.json();
                setHubs(data.hubs || []);
            }
        } catch (error) {
            toast.error('Có lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <Droplets className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-dark-900">Phiên Rửa Ly</h1>
                            <p className="text-dark-600">Theo dõi quy trình làm sạch và diệt khuẩn</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Bắt Đầu Phiên Mới
                    </button>
                </div>

                {/* Sessions List */}
                <div className="bg-white rounded-xl shadow-sm border border-dark-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-dark-50 border-b border-dark-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-dark-700">Trạm Rửa</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-dark-700">Số lượng</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-dark-700">Trạng thái</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-dark-700">Bắt đầu</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-dark-700">Nhân viên</th>
                                    <th className="px-6 py-4 text-right text-sm font-semibold text-dark-700">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-dark-500">Đang tải dữ liệu...</td>
                                    </tr>
                                ) : sessions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-dark-500">Chưa có phiên rửa nào</td>
                                    </tr>
                                ) : (
                                    sessions.map((session) => (
                                        <tr key={session.session_id} className="hover:bg-dark-50">
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-dark-900">{session.hub?.name}</span>
                                                {session.notes && <p className="text-xs text-dark-500 mt-1">{session.notes}</p>}
                                            </td>
                                            <td className="px-6 py-4 font-medium">{session.cup_count} ly</td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={session.status} />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-dark-600">
                                                {new Date(session.started_at).toLocaleString('vi-VN')}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-dark-600">
                                                {session.staff?.user_id?.substring(0, 8) || 'System'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {session.status === 'in_progress' && (
                                                    <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                                                        Hoàn tất
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Create Modal */}
                {showCreateModal && (
                    <CreateSessionModal
                        hubs={hubs}
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

function StatusBadge({ status }: { status: string }) {
    const styles = {
        pending: 'bg-gray-100 text-gray-700',
        in_progress: 'bg-blue-100 text-blue-700',
        completed: 'bg-green-100 text-green-700',
        cancelled: 'bg-red-100 text-red-700'
    };

    const labels = {
        pending: 'Đang chờ',
        in_progress: 'Đang xử lý',
        completed: 'Hoàn tất',
        cancelled: 'Đã hủy'
    };

    const Icon = status === 'in_progress' ? Clock : status === 'completed' ? CheckCircle : status === 'cancelled' ? XCircle : Clock;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${(styles as any)[status]}`}>
            <Icon className="w-3.5 h-3.5" />
            {(labels as any)[status] || status}
        </span>
    );
}

function CreateSessionModal({ hubs, onClose, onSuccess }: { hubs: Hub[], onClose: () => void, onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        hub_id: hubs[0]?.hub_id || '',
        cup_count: 50,
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const res = await authFetch('/api/admin/cleaning-sessions', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Create failed');

            toast.success('Đã bắt đầu phiên rửa');
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
                <h2 className="text-xl font-bold mb-4">Bắt Đầu Phiên Rửa Mới</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Chọn Trạm Rửa</label>
                        <select
                            required
                            className="w-full px-3 py-2 border rounded-lg"
                            value={formData.hub_id}
                            onChange={e => setFormData({ ...formData, hub_id: e.target.value })}
                        >
                            {hubs.map(hub => (
                                <option key={hub.hub_id} value={hub.hub_id}>{hub.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Số lượng ly (dự kiến)</label>
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
                        <label className="block text-sm font-medium mb-1">Ghi chú</label>
                        <textarea
                            className="w-full px-3 py-2 border rounded-lg"
                            rows={3}
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Ví dụ: Ly bẩn sau sự kiện sáng nay..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
                        <button
                            type="submit"
                            disabled={submitting || !formData.hub_id}
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                        >
                            {submitting ? 'Đang tạo...' : 'Bắt đầu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
