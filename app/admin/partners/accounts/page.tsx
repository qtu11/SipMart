'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Key } from 'lucide-react';
import { authFetch } from '@/lib/supabase/authFetch';
import toast from 'react-hot-toast';

interface Account {
    account_id: string;
    store: { name: string };
    user: { email: string; display_name: string };
    role: 'owner' | 'manager' | 'staff';
    is_active: boolean;
}

interface Store {
    store_id: string;
    name: string;
}

export default function MerchantAccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [accRes, storesRes] = await Promise.all([
                authFetch('/api/admin/partners/accounts'),
                authFetch('/api/admin/stores')
            ]);

            if (accRes.ok) {
                const data = await accRes.json();
                setAccounts(data.accounts || []);
            }
            if (storesRes.ok) {
                const data = await storesRes.json();
                setStores(data.stores || []);
            }
        } catch (error) {
            toast.error('Lỗi tải dữ liệu');
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
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-dark-900">Tài khoản Merchant</h1>
                            <p className="text-dark-600">Quản lý nhân viên và quyền truy cập cửa hàng</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm Tài Khoản
                    </button>
                </div>

                {/* List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? <p>Đang tải...</p> : accounts.map(acc => (
                        <div key={acc.account_id} className="bg-white p-5 rounded-xl shadow-sm border border-dark-100">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="font-bold text-lg">{acc.store?.name}</p>
                                    <p className="text-sm text-dark-500">{acc.user?.email}</p>
                                </div>
                                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded uppercase">
                                    {acc.role}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-dark-500 mt-4 pt-4 border-t border-dark-50">
                                <Key className="w-4 h-4" />
                                <span>PIN access active</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Modal */}
                {showModal && (
                    <CreateAccountModal
                        stores={stores}
                        onClose={() => setShowModal(false)}
                        onSuccess={() => {
                            fetchData();
                            setShowModal(false);
                        }}
                    />
                )}
            </div>
        </div>
    );
}

function CreateAccountModal({ stores, onClose, onSuccess }: { stores: Store[], onClose: () => void, onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        store_id: '',
        email: '',
        role: 'staff',
        pin_code: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await authFetch('/api/admin/partners/accounts', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success('Đã thêm tài khoản');
            onSuccess();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
                <h2 className="text-xl font-bold mb-4">Cấp Quyền Merchant</h2>
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
                    <div>
                        <label className="block text-sm font-medium mb-1">Email User</label>
                        <input
                            required
                            type="email"
                            className="w-full px-3 py-2 border rounded-lg"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="user@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Vai trò</label>
                        <select
                            className="w-full px-3 py-2 border rounded-lg"
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="staff">Staff (Nhân viên)</option>
                            <option value="manager">Manager (Quản lý)</option>
                            <option value="owner">Owner (Chủ quán)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">PIN Code (4 số)</label>
                        <input
                            required
                            maxLength={4}
                            className="w-full px-3 py-2 border rounded-lg"
                            value={formData.pin_code}
                            onChange={e => setFormData({ ...formData, pin_code: e.target.value })}
                            placeholder="1234"
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
                        <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
                            {submitting ? 'Đang thêm...' : 'Cấp quyền'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
