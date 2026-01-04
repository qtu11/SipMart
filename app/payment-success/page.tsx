'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PaymentSuccessPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to wallet after 5 seconds
        const timeout = setTimeout(() => {
            router.push('/wallet');
        }, 5000);
        return () => clearTimeout(timeout);
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center"
            >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thành công!</h1>
                <p className="text-gray-600 mb-8">
                    Giao dịch của bạn đã được xử lý thành công. Tiền sẽ được cộng vào ví trong giây lát.
                </p>
                <div className="space-y-3">
                    <button
                        onClick={() => router.push('/wallet')}
                        className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition"
                    >
                        Về ví của tôi
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
