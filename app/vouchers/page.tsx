'use client';

import { useState, useEffect } from 'react';
import { Ticket, Gift, TrendingUp, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface Voucher {
    voucher_id: string;
    code: string;
    name: string;
    description: string | null;
    discount_type: 'percent' | 'fixed';
    discount_value: number;
    max_discount: number | null;
    min_order_value: number;
    valid_until: string | null;
    is_claimed: boolean;
}

export default function VouchersPage() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'available' | 'claimed'>('available');

    useEffect(() => {
        fetchVouchers();
    }, []);

    const fetchVouchers = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/vouchers');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setVouchers(data.vouchers || []);
        } catch (error) {
            console.error('Fetch vouchers error:', error);
            toast.error('Không thể tải danh sách voucher');
        } finally {
            setLoading(false);
        }
    };

    const handleClaimVoucher = async (code: string) => {
        try {
            const res = await fetch('/api/vouchers/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ voucher_code: code })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to claim');
            }

            toast.success('Đã claim voucher thành công! 🎉');
            fetchVouchers();
        } catch (error: any) {
            toast.error(error.message || 'Claim voucher thất bại');
        }
    };

    const availableVouchers = vouchers.filter(v => !v.is_claimed);
    const claimedVouchers = vouchers.filter(v => v.is_claimed);
    const displayVouchers = activeTab === 'available' ? availableVouchers : claimedVouchers;

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary-500 to-primary-600 flex items-center justify-center">
                        <Ticket className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-dark-900">Voucher của tôi</h1>
                        <p className="text-dark-600">Nhận và sử dụng voucher giảm giá</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-soft mb-6">
                    <div className="border-b border-dark-200 flex">
                        <button
                            onClick={() => setActiveTab('available')}
                            className={`flex-1 px-6 py-3 font-medium ${activeTab === 'available'
                                    ? 'border-b-2 border-primary-500 text-primary-600'
                                    : 'text-dark-600 hover:text-dark-900'
                                }`}
                        >
                            Có thể nhận ({availableVouchers.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('claimed')}
                            className={`flex-1 px-6 py-3 font-medium ${activeTab === 'claimed'
                                    ? 'border-b-2 border-primary-500 text-primary-600'
                                    : 'text-dark-600 hover:text-dark-900'
                                }`}
                        >
                            Đã nhận ({claimedVouchers.length})
                        </button>
                    </div>
                </div>

                {/* Voucher Grid */}
                {loading ? (
                    <div className="text-center py-12 text-dark-600">Đang tải...</div>
                ) : displayVouchers.length === 0 ? (
                    <div className="text-center py-12">
                        <Gift className="w-16 h-16 text-dark-300 mx-auto mb-3" />
                        <p className="text-dark-600">
                            {activeTab === 'available' ? 'Hiện không có voucher nào' : 'Bạn chưa claim voucher nào'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayVouchers.map((voucher) => (
                            <VoucherCard
                                key={voucher.voucher_id}
                                voucher={voucher}
                                onClaim={handleClaimVoucher}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function VoucherCard({ voucher, onClaim }: { voucher: Voucher; onClaim: (code: string) => void }) {
    const isExpired = voucher.valid_until ? new Date(voucher.valid_until) < new Date() : false;

    return (
        <div className="bg-white rounded-xl shadow-soft border border-dark-200 overflow-hidden hover:shadow-lg transition-shadow">
            {/* Discount Badge */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 text-white text-center">
                <div className="text-3xl font-bold">
                    {voucher.discount_type === 'percent' ? (
                        <>{voucher.discount_value}%</>
                    ) : (
                        <>{(voucher.discount_value / 1000).toFixed(0)}K</>
                    )}
                </div>
                <div className="text-sm opacity-90">GIẢM GIÁ</div>
            </div>

            {/* Voucher Info */}
            <div className="p-4 space-y-3">
                <div>
                    <h3 className="font-bold text-dark-900 mb-1">{voucher.name}</h3>
                    {voucher.description && (
                        <p className="text-sm text-dark-600 line-clamp-2">{voucher.description}</p>
                    )}
                </div>

                {/* Code */}
                <div className="flex items-center justify-between bg-dark-50 rounded-lg px-3 py-2">
                    <span className="text-xs text-dark-500">Mã:</span>
                    <code className="font-mono font-bold text-primary-600">{voucher.code}</code>
                </div>

                {/* Details */}
                <div className="space-y-1 text-xs text-dark-600">
                    {voucher.min_order_value > 0 && (
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5 text-dark-400" />
                            Đơn tối thiểu: {voucher.min_order_value.toLocaleString('vi-VN')}đ
                        </div>
                    )}
                    {voucher.max_discount && voucher.discount_type === 'percent' && (
                        <div className="flex items-center gap-2">
                            <Gift className="w-3.5 h-3.5 text-dark-400" />
                            Giảm tối đa: {voucher.max_discount.toLocaleString('vi-VN')}đ
                        </div>
                    )}
                    {voucher.valid_until && (
                        <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-dark-400" />
                            HSD: {new Date(voucher.valid_until).toLocaleDateString('vi-VN')}
                        </div>
                    )}
                </div>

                {/* Action Button */}
                {voucher.is_claimed ? (
                    <div className="w-full py-2 text-center bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                        ✓ Đã nhận
                    </div>
                ) : (
                    <button
                        onClick={() => onClaim(voucher.code)}
                        disabled={isExpired}
                        className="w-full py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isExpired ? 'Đã hết hạn' : 'Nhận voucher'}
                    </button>
                )}
            </div>
        </div>
    );
}
