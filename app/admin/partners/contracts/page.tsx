'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Calendar, Building2 } from 'lucide-react';
import { authFetch } from '@/lib/supabase/authFetch';
import toast from 'react-hot-toast';

interface Contract {
    contract_id: string;
    store: { name: string };
    contract_type: 'revenue_share' | 'fixed_fee' | 'hybrid';
    commission_rate: number;
    fixed_fee: number;
    start_date: string;
    end_date: string | null;
    status: 'draft' | 'active' | 'expired' | 'terminated';
}

interface Store {
    store_id: string;
    name: string;
}

export default function ContractsPage() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [contractsRes, storesRes] = await Promise.all([
                authFetch('/api/admin/partners/contracts'),
                authFetch('/api/admin/stores')
            ]);

            if (contractsRes.ok) {
                const data = await contractsRes.json();
                setContracts(data.contracts || []);
            }
            if (storesRes.ok) {
                const data = await storesRes.json();
                setStores(data.stores || []);
            }
        } catch (error) {
            toast.error('Không thể tải dữ liệu hợp đồng');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-dark-900">Quản lý Hợp đồng</h1>
                            <p className="text-dark-600">Theo dõi hợp đồng hợp tác với các cửa hàng</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Tạo Hợp đồng Mới
                    </button>
                </div>

                {/* Contracts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <p className="text-dark-500">Đang tải...</p>
                    ) : contracts.length === 0 ? (
                        <div className="col-span-full text-center py-12 bg-white rounded-xl shadow-sm border border-dark-100">
                            <FileText className="w-12 h-12 text-dark-300 mx-auto mb-3" />
                            <p className="text-dark-500">Chưa có hợp đồng nào</p>
                        </div>
                    ) : (
                        contracts.map((contract) => (
                            <ContractCard key={contract.contract_id} contract={contract} />
                        ))
                    )}
                </div>

                {/* Create Modal */}
                {showCreateModal && (
                    <CreateContractModal
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

function ContractCard({ contract }: { contract: Contract }) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700';
            case 'draft': return 'bg-gray-100 text-gray-700';
            case 'expired': return 'bg-orange-100 text-orange-700';
            case 'terminated': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'revenue_share': return 'Chia sẻ doanh thu';
            case 'fixed_fee': return 'Phí cố định';
            case 'hybrid': return 'Hỗn hợp';
            default: return type;
        }
    };

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-dark-100 hover:border-purple-300 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-dark-400" />
                    <h3 className="font-bold text-dark-900">{contract.store?.name}</h3>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                    {contract.status.toUpperCase()}
                </span>
            </div>

            <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                    <span className="text-dark-500">Loại HĐ</span>
                    <span className="font-medium">{getTypeLabel(contract.contract_type)}</span>
                </div>
                {contract.contract_type !== 'fixed_fee' && (
                    <div className="flex justify-between text-sm">
                        <span className="text-dark-500">Hoa hồng</span>
                        <span className="font-medium text-blue-600">{contract.commission_rate}%</span>
                    </div>
                )}
                {contract.contract_type !== 'revenue_share' && (
                    <div className="flex justify-between text-sm">
                        <span className="text-dark-500">Phí cố định</span>
                        <span className="font-medium text-green-600">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(contract.fixed_fee)}
                        </span>
                    </div>
                )}
            </div>

            <div className="pt-4 border-t border-dark-50 flex items-center gap-2 text-xs text-dark-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>Hiệu lực: {new Date(contract.start_date).toLocaleDateString('vi-VN')}</span>
                {contract.end_date && <span>- {new Date(contract.end_date).toLocaleDateString('vi-VN')}</span>}
            </div>
        </div>
    );
}

function CreateContractModal({ stores, onClose, onSuccess }: { stores: Store[], onClose: () => void, onSuccess: () => void }) {
    const [formData, setFormData] = useState({
        store_id: '',
        contract_type: 'revenue_share',
        commission_rate: 15,
        fixed_fee: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        status: 'draft'
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const body = {
                ...formData,
                end_date: formData.end_date || null
            };
            const res = await authFetch('/api/admin/partners/contracts', {
                method: 'POST',
                body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error('Failed');
            toast.success('Đã tạo hợp đồng');
            onSuccess();
        } catch (e) {
            toast.error('Lỗi khi tạo hợp đồng');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6">
                <h2 className="text-xl font-bold mb-4">Tạo Hợp Đồng Mới</h2>
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
                            <label className="block text-sm font-medium mb-1">Loại hợp đồng</label>
                            <select
                                className="w-full px-3 py-2 border rounded-lg"
                                value={formData.contract_type}
                                onChange={e => setFormData({ ...formData, contract_type: e.target.value })}
                            >
                                <option value="revenue_share">Chia sẻ doanh thu</option>
                                <option value="fixed_fee">Phí cố định</option>
                                <option value="hybrid">Hỗn hợp</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Trạng thái</label>
                            <select
                                className="w-full px-3 py-2 border rounded-lg"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="draft">Nháp</option>
                                <option value="active">Hiệu lực</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">% Hoa hồng</label>
                            <input
                                type="number" step="0.5"
                                className="w-full px-3 py-2 border rounded-lg"
                                value={formData.commission_rate}
                                onChange={e => setFormData({ ...formData, commission_rate: Number(e.target.value) })}
                                disabled={formData.contract_type === 'fixed_fee'}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Phí cố định (VNĐ)</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 border rounded-lg"
                                value={formData.fixed_fee}
                                onChange={e => setFormData({ ...formData, fixed_fee: Number(e.target.value) })}
                                disabled={formData.contract_type === 'revenue_share'}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                            <input
                                type="date" required
                                className="w-full px-3 py-2 border rounded-lg"
                                value={formData.start_date}
                                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Ngày kết thúc (Tùy chọn)</label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 border rounded-lg"
                                value={formData.end_date}
                                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
                        <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
                            {submitting ? 'Đang tạo...' : 'Tạo Hợp đồng'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
