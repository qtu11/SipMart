'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, CheckCircle, XCircle, Clock, Eye, Search, Filter,
    ChevronDown, User, Calendar, FileText, AlertTriangle, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/admin/AdminSidebar';
import LoadingSpinner from '@/components/LoadingSpinner';

interface KycRecord {
    id: string;
    user_id: string;
    id_number: string | null;
    full_name: string | null;
    dob: string | null;
    gender: string | null;
    place_of_residence: string | null;
    front_img_path: string | null;
    back_img_path: string | null;
    selfie_img_path: string | null;
    status: 'draft' | 'pending' | 'verified' | 'rejected';
    rejection_reason: string | null;
    ocr_confidence: number | null;
    submitted_at: string | null;
    verified_at: string | null;
    created_at: string;
}

export default function AdminKycPage() {
    const [records, setRecords] = useState<KycRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
    const [selectedRecord, setSelectedRecord] = useState<KycRecord | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [imageUrls, setImageUrls] = useState<{ front?: string; back?: string; selfie?: string }>({});

    // Fetch KYC records
    const fetchRecords = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('user_kyc')
                .select('*')
                .order('submitted_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setRecords(data || []);
        } catch (error: any) {
            console.error('Error fetching KYC records:', error);
            toast.error('Lỗi tải danh sách KYC');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, [filter]);

    // Get signed URLs for images
    const loadImageUrls = async (record: KycRecord) => {
        const urls: { front?: string; back?: string; selfie?: string } = {};

        if (record.front_img_path) {
            const { data } = await supabase.storage
                .from('kyc-documents')
                .createSignedUrl(record.front_img_path, 300);
            urls.front = data?.signedUrl;
        }

        if (record.back_img_path) {
            const { data } = await supabase.storage
                .from('kyc-documents')
                .createSignedUrl(record.back_img_path, 300);
            urls.back = data?.signedUrl;
        }

        if (record.selfie_img_path) {
            const { data } = await supabase.storage
                .from('kyc-documents')
                .createSignedUrl(record.selfie_img_path, 300);
            urls.selfie = data?.signedUrl;
        }

        setImageUrls(urls);
    };

    // Open detail modal
    const openDetail = async (record: KycRecord) => {
        setSelectedRecord(record);
        setShowModal(true);
        await loadImageUrls(record);
    };

    // Approve KYC
    const handleApprove = async () => {
        if (!selectedRecord) return;

        setProcessing(true);
        try {
            const { error } = await supabase
                .from('user_kyc')
                .update({
                    status: 'verified',
                    verified_at: new Date().toISOString(),
                    rejection_reason: null,
                })
                .eq('id', selectedRecord.id);

            if (error) throw error;

            toast.success('Đã duyệt hồ sơ KYC!');
            setShowModal(false);
            fetchRecords();
        } catch (error: any) {
            console.error('Approve error:', error);
            toast.error('Lỗi duyệt hồ sơ');
        } finally {
            setProcessing(false);
        }
    };

    // Reject KYC
    const handleReject = async () => {
        if (!selectedRecord) return;

        if (!rejectionReason.trim()) {
            toast.error('Vui lòng nhập lý do từ chối');
            return;
        }

        setProcessing(true);
        try {
            const { error } = await supabase
                .from('user_kyc')
                .update({
                    status: 'rejected',
                    verified_at: new Date().toISOString(),
                    rejection_reason: rejectionReason,
                })
                .eq('id', selectedRecord.id);

            if (error) throw error;

            toast.success('Đã từ chối hồ sơ KYC');
            setShowModal(false);
            setRejectionReason('');
            fetchRecords();
        } catch (error: any) {
            console.error('Reject error:', error);
            toast.error('Lỗi từ chối hồ sơ');
        } finally {
            setProcessing(false);
        }
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Chờ duyệt</span>;
            case 'verified':
                return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Đã duyệt</span>;
            case 'rejected':
                return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" /> Từ chối</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">Nháp</span>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar />

            <main className="flex-1 p-6 lg:p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-primary-500" />
                        Quản lý eKYC
                    </h1>
                    <p className="text-gray-500 mt-1">Xét duyệt hồ sơ xác minh danh tính</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Tất cả', value: 'all', color: 'gray' },
                        { label: 'Chờ duyệt', value: 'pending', color: 'yellow' },
                        { label: 'Đã duyệt', value: 'verified', color: 'green' },
                        { label: 'Từ chối', value: 'rejected', color: 'red' },
                    ].map((item) => (
                        <button
                            key={item.value}
                            onClick={() => setFilter(item.value as any)}
                            className={`p-4 rounded-xl border-2 transition-all ${filter === item.value
                                    ? `border-${item.color}-500 bg-${item.color}-50`
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                        >
                            <div className="text-sm font-medium text-gray-500">{item.label}</div>
                            <div className="text-2xl font-bold text-gray-900">
                                {item.value === 'all'
                                    ? records.length
                                    : records.filter(r => r.status === item.value).length
                                }
                            </div>
                        </button>
                    ))}
                </div>

                {/* Toolbar */}
                <div className="bg-white rounded-xl p-4 mb-6 flex items-center justify-between shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                            Hiển thị <strong>{records.length}</strong> hồ sơ
                        </span>
                    </div>
                    <button
                        onClick={fetchRecords}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Làm mới
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center">
                            <LoadingSpinner />
                        </div>
                    ) : records.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            Không có hồ sơ nào
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User ID</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Họ tên</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">CCCD</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">OCR Confidence</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ngày gửi</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {records.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                                {record.user_id.slice(0, 8)}...
                                            </code>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {record.full_name || 'Chưa có'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {record.id_number ? `****${record.id_number.slice(-4)}` : 'N/A'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {record.ocr_confidence ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${record.ocr_confidence > 80 ? 'bg-green-500' :
                                                                    record.ocr_confidence > 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                                }`}
                                                            style={{ width: `${record.ocr_confidence}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-600">{record.ocr_confidence.toFixed(0)}%</span>
                                                </div>
                                            ) : 'N/A'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {statusBadge(record.status)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {record.submitted_at
                                                ? new Date(record.submitted_at).toLocaleDateString('vi-VN')
                                                : 'N/A'
                                            }
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => openDetail(record)}
                                                className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                title="Xem chi tiết"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Detail Modal */}
                <AnimatePresence>
                    {showModal && selectedRecord && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                            onClick={() => setShowModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Modal Header */}
                                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                                    <h2 className="text-xl font-bold text-gray-900">Chi tiết hồ sơ KYC</h2>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="p-2 hover:bg-gray-100 rounded-lg"
                                    >
                                        <XCircle className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div className="p-6">
                                    {/* User Info */}
                                    <div className="grid grid-cols-2 gap-6 mb-6">
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                <User className="w-4 h-4" />
                                                Thông tin cá nhân
                                            </h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Họ tên:</span>
                                                    <span className="font-medium">{selectedRecord.full_name || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Số CCCD:</span>
                                                    <span className="font-medium">{selectedRecord.id_number || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Ngày sinh:</span>
                                                    <span className="font-medium">{selectedRecord.dob || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Giới tính:</span>
                                                    <span className="font-medium">{selectedRecord.gender || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                                <FileText className="w-4 h-4" />
                                                Thông tin xác minh
                                            </h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Trạng thái:</span>
                                                    {statusBadge(selectedRecord.status)}
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">OCR Confidence:</span>
                                                    <span className="font-medium">{selectedRecord.ocr_confidence?.toFixed(1) || 'N/A'}%</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Ngày gửi:</span>
                                                    <span className="font-medium">
                                                        {selectedRecord.submitted_at
                                                            ? new Date(selectedRecord.submitted_at).toLocaleString('vi-VN')
                                                            : 'N/A'
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Images */}
                                    <h3 className="font-semibold text-gray-900 mb-3">Hình ảnh xác minh</h3>
                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 mb-2">Mặt trước CCCD</p>
                                            <div className="aspect-[1.6/1] bg-gray-100 rounded-lg overflow-hidden">
                                                {imageUrls.front ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={imageUrls.front} alt="Front" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <LoadingSpinner size="sm" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 mb-2">Mặt sau CCCD</p>
                                            <div className="aspect-[1.6/1] bg-gray-100 rounded-lg overflow-hidden">
                                                {imageUrls.back ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={imageUrls.back} alt="Back" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <LoadingSpinner size="sm" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 mb-2">Selfie</p>
                                            <div className="aspect-[1.6/1] bg-gray-100 rounded-lg overflow-hidden">
                                                {imageUrls.selfie ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={imageUrls.selfie} alt="Selfie" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <LoadingSpinner size="sm" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rejection Reason Input */}
                                    {selectedRecord.status === 'pending' && (
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Lý do từ chối (nếu từ chối)
                                            </label>
                                            <textarea
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                placeholder="Nhập lý do từ chối hồ sơ..."
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                                rows={3}
                                            />
                                        </div>
                                    )}

                                    {/* Actions */}
                                    {selectedRecord.status === 'pending' && (
                                        <div className="flex gap-3 justify-end">
                                            <button
                                                onClick={handleReject}
                                                disabled={processing}
                                                className="flex items-center gap-2 px-6 py-3 bg-red-100 text-red-700 rounded-xl font-semibold hover:bg-red-200 disabled:opacity-50 transition-colors"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Từ chối
                                            </button>
                                            <button
                                                onClick={handleApprove}
                                                disabled={processing}
                                                className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Duyệt hồ sơ
                                            </button>
                                        </div>
                                    )}

                                    {/* Show rejection reason if rejected */}
                                    {selectedRecord.status === 'rejected' && selectedRecord.rejection_reason && (
                                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                                            <div className="flex items-start gap-2">
                                                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-medium text-red-700">Lý do từ chối:</p>
                                                    <p className="text-sm text-red-600">{selectedRecord.rejection_reason}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
