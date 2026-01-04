import { verifyVnpayReturn } from '@/lib/vnpay';
import Link from 'next/link';
import { CheckCircle, XCircle } from 'lucide-react';
import { redirect } from 'next/navigation';

export default function VnpayReturnPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    // Normalize params for verification
    const vnp_Params: any = { ...searchParams };

    // Verify signature
    const { isValid, code } = verifyVnpayReturn(vnp_Params);

    const isSuccess = isValid && code === '00';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                {isSuccess ? (
                    <>
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thành công!</h1>
                        <p className="text-gray-600 mb-6">
                            Giao dịch của bạn đã được ghi nhận. Số dư ví sẽ được cập nhật trong giây lát.
                        </p>
                    </>
                ) : (
                    <>
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-10 h-10 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thất bại</h1>
                        <p className="text-gray-600 mb-6">
                            Giao dịch bị lỗi hoặc bị hủy. Vui lòng thử lại sau.
                            <br />
                            <span className="text-sm text-gray-400">Mã lỗi: {code}</span>
                        </p>
                    </>
                )}

                <Link
                    href="/wallet"
                    className={`block w-full py-3 px-6 rounded-xl font-bold text-white transition-colors ${isSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
                        }`}
                >
                    Trở về Ví
                </Link>
            </div>
        </div>
    );
}
