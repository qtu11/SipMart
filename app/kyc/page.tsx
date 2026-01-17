'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, Clock, XCircle, AlertTriangle, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { onAuthChange } from '@/lib/supabase/auth';
import { authFetch } from '@/lib/supabase/authFetch';
import KycForm from '@/components/kyc/KycForm';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function KycPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [kycStatus, setKycStatus] = useState<'none' | 'draft' | 'pending' | 'verified' | 'rejected'>('none');
    const [kycData, setKycData] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthChange(async (currentUser) => {
            if (!currentUser) {
                router.push('/auth/login?redirect=/kyc');
                return;
            }
            setUser(currentUser);

            // Fetch KYC status
            try {
                const res = await authFetch('/api/kyc/status');
                const data = await res.json();

                if (data.success) {
                    setKycStatus(data.status);
                    setKycData(data.kyc);
                }
            } catch (error) {
                console.error('Error fetching KYC status:', error);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    const handleKycComplete = async () => {
        setKycStatus('pending');
        // Refetch status
        try {
            const res = await authFetch('/api/kyc/status');
            const data = await res.json();
            if (data.success) {
                setKycStatus(data.status);
                setKycData(data.kyc);
            }
        } catch (error) {
            console.error('Error refetching KYC status:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // Render different UI based on KYC status
    const renderContent = () => {
        switch (kycStatus) {
            case 'verified':
                return (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md mx-auto text-center p-8"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.2 }}
                            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                        >
                            <CheckCircle className="w-14 h-14 text-green-500" />
                        </motion.div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Đã xác minh danh tính!</h1>
                        <p className="text-gray-600 mb-6">
                            Tài khoản của bạn đã được xác minh thành công. Bạn có thể sử dụng đầy đủ các dịch vụ của SipSmart.
                        </p>
                        <div className="bg-green-50 rounded-xl p-4 mb-6 text-left">
                            <h3 className="font-semibold text-green-800 mb-2">Thông tin đã xác minh:</h3>
                            <div className="space-y-1 text-sm text-green-700">
                                <p>Họ tên: {kycData?.full_name || 'N/A'}</p>
                                <p>CCCD: {kycData?.id_number ? `****${kycData.id_number.slice(-4)}` : 'N/A'}</p>
                                <p>Ngày xác minh: {kycData?.verified_at ? new Date(kycData.verified_at).toLocaleDateString('vi-VN') : 'N/A'}</p>
                            </div>
                        </div>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 transition-colors"
                        >
                            <Sparkles className="w-4 h-4" />
                            Tiếp tục sử dụng
                        </Link>
                    </motion.div>
                );

            case 'pending':
                return (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md mx-auto text-center p-8"
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6"
                        >
                            <Clock className="w-14 h-14 text-yellow-600" />
                        </motion.div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Đang chờ xét duyệt</h1>
                        <p className="text-gray-600 mb-6">
                            Hồ sơ xác minh của bạn đang được xem xét. Quá trình này thường mất 1-24 giờ.
                        </p>
                        <div className="bg-yellow-50 rounded-xl p-4 mb-6">
                            <div className="flex items-center gap-2 text-yellow-700">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="text-sm">Bạn sẽ nhận thông báo khi hồ sơ được duyệt.</span>
                            </div>
                        </div>
                        <div className="text-sm text-gray-500">
                            Đã gửi lúc: {kycData?.submitted_at ? new Date(kycData.submitted_at).toLocaleString('vi-VN') : 'N/A'}
                        </div>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-primary-600 font-medium mt-4 hover:underline"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Quay lại trang chủ
                        </Link>
                    </motion.div>
                );

            case 'rejected':
                return (
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-md mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
                        >
                            <div className="flex items-start gap-3">
                                <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-red-700">Hồ sơ bị từ chối</h3>
                                    <p className="text-sm text-red-600 mt-1">{kycData?.rejection_reason || 'Vui lòng gửi lại với thông tin chính xác.'}</p>
                                </div>
                            </div>
                        </motion.div>
                        <KycForm
                            userId={user.id}
                            existingData={kycData}
                            onComplete={handleKycComplete}
                        />
                    </div>
                );

            default:
                return (
                    <KycForm
                        userId={user.id}
                        onComplete={handleKycComplete}
                    />
                );
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium">Quay lại</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary-500" />
                        <span className="font-bold text-gray-900">Xác minh danh tính</span>
                    </div>
                    <div className="w-20" /> {/* Spacer */}
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Info Banner */}
                {kycStatus === 'none' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-primary-500 to-teal-500 rounded-2xl p-6 text-white mb-8 shadow-xl shadow-primary-500/20"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold mb-2">Tại sao cần xác minh?</h2>
                                <ul className="text-sm text-white/90 space-y-1">
                                    <li>✓ Bảo vệ tài khoản của bạn</li>
                                    <li>✓ Mở khóa tất cả tính năng (Ví, Mượn ly...)</li>
                                    <li>✓ Tăng giới hạn giao dịch</li>
                                    <li>✓ Nhận thêm 100 điểm xanh</li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                )}

                {renderContent()}
            </main>
        </div>
    );
}
