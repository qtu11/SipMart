'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard, Wallet, Building2, Globe,
    ChevronRight, Loader2, CheckCircle, AlertCircle,
    Banknote
} from 'lucide-react';

interface PaymentMethod {
    id: string;
    name: string;
    logo?: string;
    minAmount: number;
    maxAmount: number;
    feePercent: number;
    feeFixed: number;
}

interface PaymentSelectorProps {
    amount: number;
    userId: string;
    orderId?: string;
    onSuccess?: (url: string, transactionId: string) => void;
    onError?: (error: string) => void;
    returnUrl?: string;
}

// Default icons for providers
const providerIcons: Record<string, any> = {
    VNPAY: CreditCard,
    MOMO: Wallet,
    PAYPAL: Globe,
    BANK_TRANSFER: Building2,
};

// Default colors
const providerColors: Record<string, { bg: string; text: string; border: string }> = {
    VNPAY: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-500' },
    MOMO: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-500' },
    PAYPAL: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-500' },
    BANK_TRANSFER: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-500' },
};

export default function PaymentSelector({
    amount,
    userId,
    orderId,
    onSuccess,
    onError,
    returnUrl,
}: PaymentSelectorProps) {
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch available payment methods
    useEffect(() => {
        const fetchMethods = async () => {
            try {
                const res = await fetch('/api/payment/methods');
                const data = await res.json();

                if (data.success && data.methods) {
                    setMethods(data.methods);
                    if (data.methods.length > 0) {
                        setSelectedMethod(data.methods[0].id);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch payment methods:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMethods();
    }, []);

    // Handle payment
    const handlePayment = async () => {
        if (!selectedMethod || processing) return;

        setProcessing(true);
        setError(null);

        try {
            const res = await fetch('/api/payment/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    method: selectedMethod,
                    amount,
                    userId,
                    orderId,
                    returnUrl,
                }),
            });

            const data = await res.json();

            if (data.success && data.url) {
                onSuccess?.(data.url, data.transactionId);

                // Redirect to payment gateway
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'Tạo thanh toán thất bại');
            }
        } catch (err: any) {
            setError(err.message);
            onError?.(err.message);
        } finally {
            setProcessing(false);
        }
    };

    // Calculate fee
    const selectedMethodData = methods.find(m => m.id === selectedMethod);
    const fee = selectedMethodData
        ? (selectedMethodData.feePercent * amount / 100) + selectedMethodData.feeFixed
        : 0;
    const totalAmount = amount + fee;

    if (loading) {
        return (
            <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-center gap-2 text-dark-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang tải phương thức thanh toán...</span>
                </div>
            </div>
        );
    }

    if (methods.length === 0) {
        return (
            <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 text-yellow-600">
                    <AlertCircle className="w-5 h-5" />
                    <span>Không có phương thức thanh toán nào khả dụng</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-dark-900 flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-primary-500" />
                    Chọn phương thức thanh toán
                </h3>
            </div>

            {/* Methods */}
            <div className="p-4 space-y-3">
                {methods.map((method) => {
                    const Icon = providerIcons[method.id] || CreditCard;
                    const colors = providerColors[method.id] || providerColors.VNPAY;
                    const isSelected = selectedMethod === method.id;
                    const isDisabled = amount < method.minAmount || amount > method.maxAmount;

                    return (
                        <motion.button
                            key={method.id}
                            onClick={() => !isDisabled && setSelectedMethod(method.id)}
                            disabled={isDisabled}
                            className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${isSelected
                                    ? `${colors.border} ${colors.bg}`
                                    : 'border-gray-100 hover:border-gray-200 bg-white'
                                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            whileHover={!isDisabled ? { scale: 1.01 } : {}}
                            whileTap={!isDisabled ? { scale: 0.99 } : {}}
                        >
                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.bg}`}>
                                {method.logo ? (
                                    <img src={method.logo} alt={method.name} className="w-8 h-8 object-contain" />
                                ) : (
                                    <Icon className={`w-6 h-6 ${colors.text}`} />
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1">
                                <div className="font-semibold text-dark-900">{method.name}</div>
                                {method.feePercent > 0 || method.feeFixed > 0 ? (
                                    <div className="text-xs text-dark-400 mt-0.5">
                                        Phí: {method.feePercent > 0 ? `${method.feePercent}%` : ''}
                                        {method.feeFixed > 0 ? ` + ${method.feeFixed.toLocaleString()}đ` : ''}
                                    </div>
                                ) : (
                                    <div className="text-xs text-green-600 mt-0.5">Miễn phí</div>
                                )}
                            </div>

                            {/* Check */}
                            <AnimatePresence>
                                {isSelected && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        className={`w-6 h-6 rounded-full ${colors.text} flex items-center justify-center`}
                                    >
                                        <CheckCircle className="w-6 h-6" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    );
                })}
            </div>

            {/* Summary */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-2">
                <div className="flex justify-between text-sm text-dark-600">
                    <span>Số tiền nạp</span>
                    <span>{amount.toLocaleString()}đ</span>
                </div>
                {fee > 0 && (
                    <div className="flex justify-between text-sm text-dark-400">
                        <span>Phí giao dịch</span>
                        <span>+{fee.toLocaleString()}đ</span>
                    </div>
                )}
                <div className="flex justify-between font-bold text-dark-900 pt-2 border-t border-gray-200">
                    <span>Tổng thanh toán</span>
                    <span className="text-primary-600">{totalAmount.toLocaleString()}đ</span>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="px-4 pb-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                </div>
            )}

            {/* Button */}
            <div className="p-4 border-t border-gray-100">
                <motion.button
                    onClick={handlePayment}
                    disabled={!selectedMethod || processing}
                    className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25"
                    whileHover={{ scale: processing ? 1 : 1.01 }}
                    whileTap={{ scale: processing ? 1 : 0.99 }}
                >
                    {processing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Đang xử lý...
                        </>
                    ) : (
                        <>
                            Thanh toán {totalAmount.toLocaleString()}đ
                            <ChevronRight className="w-5 h-5" />
                        </>
                    )}
                </motion.button>
            </div>
        </div>
    );
}
