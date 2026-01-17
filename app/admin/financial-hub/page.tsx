'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    DollarSign, Wallet, Package, Leaf, AlertTriangle,
    Clock, CheckCircle, XCircle, Download, TrendingUp,
    Users, Bike, Coffee, Shield, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface FinancialStats {
    financial: {
        total_revenue: number;
        sipsmart_commission: number;
        partner_revenue: number;
        escrow_balance: number;
        total_topups: number;
    };
    transactions: {
        green_mobility: number;
        ebike_rentals: number;
        cup_transactions: number;
        payment_topups: number;
    };
    esg: {
        total_co2_saved_kg: string;
        mobility_co2_kg: string;
        cup_co2_kg: string;
        trees_equivalent: number;
    };
    period: string;
}

export default function FinancialHubPage() {
    const [stats, setStats] = useState<FinancialStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('today');
    const router = useRouter();

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/financial-hub?period=${period}`);
            if (res.status === 401) {
                router.push('/auth/login');
                return;
            }
            if (res.status === 403) {
                toast.error('Bạn không có quyền truy cập');
                router.push('/admin');
                return;
            }
            const data = await res.json();
            setStats(data);
        } catch (e) {
            console.error(e);
            toast.error('Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    }, [period, router]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/admin" className="text-green-600 hover:underline text-sm mb-2 inline-block">
                        ← Quay lại Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Financial Hub</h1>
                    <p className="text-gray-500">Quản lý dòng tiền và kế toán hệ thống</p>
                </div>
                <div className="flex gap-2">
                    {['today', 'week', 'month', 'all'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${period === p
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {p === 'today' ? 'Hôm nay' : p === 'week' ? 'Tuần' : p === 'month' ? 'Tháng' : 'Tất cả'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={DollarSign}
                    label="Tổng Doanh thu"
                    value={`${stats.financial.total_revenue.toLocaleString('vi-VN')}₫`}
                    color="green"
                    description="Tổng giao dịch thành công"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Hoa hồng SipSmart (0.1%)"
                    value={`${stats.financial.sipsmart_commission.toLocaleString('vi-VN')}₫`}
                    color="blue"
                    description="Thu nhập ròng"
                />
                <StatCard
                    icon={Users}
                    label="Doanh thu Đối tác (99.9%)"
                    value={`${stats.financial.partner_revenue.toLocaleString('vi-VN')}₫`}
                    color="purple"
                    description="Đã/sẽ chuyển cho đối tác"
                />
                <StatCard
                    icon={Shield}
                    label="Quỹ Ký quỹ (Escrow)"
                    value={`${stats.financial.escrow_balance.toLocaleString('vi-VN')}₫`}
                    color="orange"
                    description="Tiền cọc ly đang giữ"
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Transaction Counts */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border">
                    <h3 className="font-bold text-lg text-gray-800 mb-4">Số lượng Giao dịch</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Bike className="w-5 h-5 text-blue-600" />
                                <span className="text-sm text-gray-600">Green Mobility</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-700">{stats.transactions.green_mobility}</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Bike className="w-5 h-5 text-green-600" />
                                <span className="text-sm text-gray-600">E-Bike Rentals</span>
                            </div>
                            <p className="text-2xl font-bold text-green-700">{stats.transactions.ebike_rentals}</p>
                        </div>
                        <div className="bg-orange-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Coffee className="w-5 h-5 text-orange-600" />
                                <span className="text-sm text-gray-600">Cup Transactions</span>
                            </div>
                            <p className="text-2xl font-bold text-orange-700">{stats.transactions.cup_transactions}</p>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Wallet className="w-5 h-5 text-purple-600" />
                                <span className="text-sm text-gray-600">Nạp tiền</span>
                            </div>
                            <p className="text-2xl font-bold text-purple-700">{stats.transactions.payment_topups}</p>
                        </div>
                    </div>
                </div>

                {/* ESG Impact */}
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Leaf className="w-5 h-5" />
                        Tác động Môi trường (ESG)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-3xl font-bold">{stats.esg.total_co2_saved_kg}</p>
                            <p className="text-sm opacity-80">kg CO₂ tiết kiệm</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold">{stats.esg.trees_equivalent}</p>
                            <p className="text-sm opacity-80">🌳 Cây tương đương</p>
                        </div>
                        <div>
                            <p className="text-xl font-semibold">{stats.esg.mobility_co2_kg} kg</p>
                            <p className="text-xs opacity-70">Từ giao thông xanh</p>
                        </div>
                        <div>
                            <p className="text-xl font-semibold">{stats.esg.cup_co2_kg} kg</p>
                            <p className="text-xs opacity-70">Từ ly tái sử dụng</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <h3 className="font-bold text-lg text-gray-800 mb-4">Thao tác nhanh</h3>
                <div className="flex flex-wrap gap-4">
                    <Link
                        href="/admin/transactions"
                        className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        <DollarSign className="w-5 h-5 text-gray-600" />
                        <span>Xem giao dịch</span>
                    </Link>
                    <Link
                        href="/admin/ekyc-approval"
                        className="flex items-center gap-2 px-4 py-3 bg-blue-100 rounded-xl hover:bg-blue-200 transition-colors"
                    >
                        <Shield className="w-5 h-5 text-blue-600" />
                        <span>Duyệt eKYC</span>
                    </Link>
                    <Link
                        href="/admin/partners"
                        className="flex items-center gap-2 px-4 py-3 bg-purple-100 rounded-xl hover:bg-purple-200 transition-colors"
                    >
                        <Users className="w-5 h-5 text-purple-600" />
                        <span>Quản lý Đối tác</span>
                    </Link>
                    <button
                        onClick={() => window.open('/api/admin/financial-hub?format=csv', '_blank')}
                        className="flex items-center gap-2 px-4 py-3 bg-green-100 rounded-xl hover:bg-green-200 transition-colors"
                    >
                        <Download className="w-5 h-5 text-green-600" />
                        <span>Xuất báo cáo</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// Stat Card Component  
function StatCard({ icon: Icon, label, value, color, description }: {
    icon: any;
    label: string;
    value: string;
    color: string;
    description?: string;
}) {
    const colorClasses: Record<string, string> = {
        green: 'bg-green-100 text-green-600',
        blue: 'bg-blue-100 text-blue-600',
        purple: 'bg-purple-100 text-purple-600',
        orange: 'bg-orange-100 text-orange-600',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-600 font-medium">{label}</p>
            {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
        </motion.div>
    );
}
