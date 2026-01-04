'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

function PaymentFailedContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const reason = searchParams.get('reason');
    const code = searchParams.get('code');

    let message = 'Giao dịch không thành công. Vui lòng thử lại.';
    if (code === '24') message = 'Bạn đã hủy giao dịch.';
    if (reason === 'checksum_failed') message = 'Lỗi bảo mật: Checksum không hợp lệ.';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center"
            >
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-10 h-10 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thất bại</h1>
                <p className="text-gray-600 mb-8">
                    {message}
                </p>
                <div className="space-y-3">
                    <button
                        onClick={() => router.push('/wallet')}
                        className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition"
                    >
                        Thử lại
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
                    >
                        Về trang chủ
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

export default function PaymentFailedPage() {
    return (
        <Suspense fallback={<div>Đang tải...</div>}>
            <PaymentFailedContent />
        </Suspense>
    );
}
