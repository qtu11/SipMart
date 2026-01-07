// VNPay Return Page - User lands here after payment
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PaymentResult {
    status: 'success' | 'failed' | 'pending';
    amount?: number;
    transactionCode?: string;
    message: string;
    responseCode?: string;
}

const RESPONSE_MESSAGES: Record<string, string> = {
    '00': 'Giao dịch thành công!',
    '07': 'Giao dịch nghi ngờ. Vui lòng liên hệ hỗ trợ.',
    '09': 'Thẻ chưa đăng ký Internet Banking.',
    '10': 'Xác thực thông tin thẻ sai quá 3 lần.',
    '11': 'Hết hạn chờ thanh toán.',
    '12': 'Thẻ/Tài khoản bị khóa.',
    '13': 'Nhập sai OTP.',
    '24': 'Giao dịch đã bị hủy.',
    '51': 'Tài khoản không đủ số dư.',
    '65': 'Vượt quá hạn mức giao dịch trong ngày.',
    '75': 'Ngân hàng đang bảo trì.',
    '79': 'Nhập sai mật khẩu thanh toán quá số lần.',
    '99': 'Lỗi không xác định.',
};

function LoadingSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Đang xử lý kết quả thanh toán...</p>
            </div>
        </div>
    );
}

function PaymentReturnContent() {
    const searchParams = useSearchParams();
    const [result, setResult] = useState<PaymentResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const responseCode = searchParams.get('vnp_ResponseCode');
        const transactionStatus = searchParams.get('vnp_TransactionStatus');
        const amount = searchParams.get('vnp_Amount');
        const txnRef = searchParams.get('vnp_TxnRef');

        if (!responseCode) {
            setResult({
                status: 'failed',
                message: 'Không có thông tin giao dịch.',
            });
            setLoading(false);
            return;
        }

        const isSuccess = responseCode === '00' && transactionStatus === '00';
        const parsedAmount = amount ? parseInt(amount) / 100 : 0;

        setResult({
            status: isSuccess ? 'success' : 'failed',
            amount: parsedAmount,
            transactionCode: txnRef || undefined,
            responseCode,
            message: RESPONSE_MESSAGES[responseCode] || 'Lỗi không xác định.',
        });
        setLoading(false);
    }, [searchParams]);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                {result?.status === 'success' ? (
                    <>
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thành công!</h1>
                        <p className="text-gray-600 mb-4">{result.message}</p>

                        {result.amount && (
                            <div className="bg-green-50 rounded-xl p-4 mb-6">
                                <p className="text-sm text-gray-500">Số tiền nạp</p>
                                <p className="text-3xl font-bold text-green-600">
                                    {result.amount.toLocaleString('vi-VN')}đ
                                </p>
                            </div>
                        )}

                        {result.transactionCode && (
                            <p className="text-sm text-gray-500 mb-6">
                                Mã giao dịch: <span className="font-mono">{result.transactionCode}</span>
                            </p>
                        )}
                    </>
                ) : (
                    <>
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thất bại</h1>
                        <p className="text-gray-600 mb-6">{result?.message}</p>

                        {result?.responseCode && (
                            <p className="text-sm text-gray-400 mb-4">
                                Mã lỗi: {result.responseCode}
                            </p>
                        )}
                    </>
                )}

                <div className="flex flex-col gap-3">
                    <Link
                        href="/wallet"
                        className="w-full bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 transition"
                    >
                        Về ví của tôi
                    </Link>
                    <Link
                        href="/"
                        className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition"
                    >
                        Về trang chủ
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function VNPayReturnPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <PaymentReturnContent />
        </Suspense>
    );
}
