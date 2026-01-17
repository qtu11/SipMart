'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    DollarSign, TrendingUp, Leaf, Download, Wallet,
    Package, AlertTriangle, Clock, CheckCircle, XCircle,
    ArrowUpRight, ArrowDownRight, FileText, Bike, Coffee
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PartnerStats {
    revenue: number;
    orders: number;
    cupsInUse: number;
    cupsAvailable: number;
    cupsCleaning: number;
    pendingCleaning: number;
    kpi: {
        cupsReusedThisMonth: number;
        plasticSavedKg: number;
        co2SavedKg: number;
        treesEquivalent: number;
    };
    recentTransactions: any[];
    inventoryAlerts: any[];
}

interface PayoutRequest {
    payout_id: string;
    amount: number;
    status: string;
    requested_at: string;
    processed_at?: string;
}

export default function EnhancedPartnerDashboard() {
    const [stats, setStats] = useState<PartnerStats | null>(null);
    const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'esg' | 'payouts' | 'inventory'>('overview');
    const [payoutAmount, setPayoutAmount] = useState('');
    const [requesting, setRequesting] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [statsRes, payoutsRes] = await Promise.all([
                fetch('/api/partner/dashboard'),
                fetch('/api/partner/payout/history').catch(() => ({ json: () => ({ payouts: [] }) }))
            ]);

            const statsData = await statsRes.json();
            const payoutsData = await payoutsRes.json();

            setStats(statsData);
            setPayouts(payoutsData.payouts || []);
        } catch (e) {
            console.error(e);
            toast.error('Không thể tải dữ liệu');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePayoutRequest = async () => {
        const amount = parseInt(payoutAmount);
        if (!amount || amount < 10000) {
            toast.error('Số tiền tối thiểu là 10.000₫');
            return;
        }

        setRequesting(true);
        try {
            const res = await fetch('/api/partner/payout/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount })
            });
            const data = await res.json();

            if (res.ok) {
                toast.success('Đã gửi yêu cầu rút tiền!');
                setPayoutAmount('');
                fetchData();
            } else {
                toast.error(data.error || 'Lỗi gửi yêu cầu');
            }
        } catch (e) {
            toast.error('Lỗi kết nối');
        } finally {
            setRequesting(false);
        }
    };

    const downloadESGReport = () => {
        window.open('/api/partner/esg-report?format=json&period=month', '_blank');
        toast.success('Đang tải báo cáo ESG...');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        );
    }

    if (!stats) return <div className="p-8 text-center">Không có dữ liệu</div>;

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Partner Dashboard</h1>
                    <p className="text-gray-500 mt-1">Quản lý doanh thu và tác động môi trường</p>
                </div>
                <button
                    onClick={downloadESGReport}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                >
                    <Download className="w-5 h-5" />
                    Tải báo cáo ESG
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 pb-2">
                {[
                    { id: 'overview', label: 'Tổng quan', icon: TrendingUp },
                    { id: 'esg', label: 'ESG Report', icon: Leaf },
                    { id: 'payouts', label: 'Rút tiền', icon: Wallet },
                    { id: 'inventory', label: 'Kho hàng', icon: Package },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === tab.id
                            ? 'bg-green-100 text-green-700 font-semibold'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            icon={DollarSign}
                            label="Doanh thu hôm nay"
                            value={`${stats.revenue.toLocaleString('vi-VN')}₫`}
                            color="green"
                            subtext="99.9% của tổng giao dịch"
                        />
                        <StatCard
                            icon={Package}
                            label="Đơn hàng"
                            value={stats.orders.toString()}
                            color="blue"
                        />
                        <StatCard
                            icon={Coffee}
                            label="Ly đang dùng"
                            value={stats.cupsInUse.toString()}
                            color="orange"
                        />
                        <StatCard
                            icon={Leaf}
                            label="CO₂ tiết kiệm"
                            value={`${stats.kpi.co2SavedKg}kg`}
                            color="emerald"
                            subtext="Tháng này"
                        />
                    </div>

                    {/* Recent Transactions */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-lg text-gray-800 mb-4">Giao dịch gần đây</h3>
                        <div className="space-y-3">
                            {stats.recentTransactions.slice(0, 5).map((tx, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                                            }`}>
                                            {tx.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{tx.user || 'Khách hàng'}</p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(tx.borrowTime).toLocaleString('vi-VN')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">{tx.amount?.toLocaleString('vi-VN')}₫</p>
                                        <p className="text-xs text-gray-500">+{tx.points || 0} điểm</p>
                                    </div>
                                </div>
                            ))}
                            {stats.recentTransactions.length === 0 && (
                                <p className="text-center text-gray-500 py-4">Chưa có giao dịch</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ESG Tab */}
            {activeTab === 'esg' && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-8 text-white">
                        <h2 className="text-2xl font-bold mb-2">Báo cáo Tác động Môi trường</h2>
                        <p className="opacity-80 mb-6">Dữ liệu ESG theo tiêu chuẩn IPCC - Scope 3</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <p className="text-4xl font-bold">{stats.kpi.cupsReusedThisMonth}</p>
                                <p className="text-sm opacity-80">Ly tái sử dụng</p>
                            </div>
                            <div className="text-center">
                                <p className="text-4xl font-bold">{stats.kpi.plasticSavedKg}</p>
                                <p className="text-sm opacity-80">kg Nhựa giảm</p>
                            </div>
                            <div className="text-center">
                                <p className="text-4xl font-bold">{stats.kpi.co2SavedKg}</p>
                                <p className="text-sm opacity-80">kg CO₂ giảm</p>
                            </div>
                            <div className="text-center">
                                <p className="text-4xl font-bold">{stats.kpi.treesEquivalent}</p>
                                <p className="text-sm opacity-80">🌳 Cây tương đương</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border">
                        <h3 className="font-bold text-lg mb-4">Xuất báo cáo</h3>
                        <p className="text-gray-600 mb-4">
                            Tải báo cáo ESG để nộp cho kiểm toán xanh hoặc làm hồ sơ vay vốn xanh.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => window.open('/api/partner/esg-report?format=json&period=month', '_blank')}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                <FileText className="w-4 h-4 inline mr-2" />
                                Tháng này
                            </button>
                            <button
                                onClick={() => window.open('/api/partner/esg-report?format=json&period=quarter', '_blank')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <FileText className="w-4 h-4 inline mr-2" />
                                Quý này
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payouts Tab */}
            {activeTab === 'payouts' && (
                <div className="space-y-6">
                    {/* Request Payout */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border">
                        <h3 className="font-bold text-lg mb-4">Yêu cầu rút tiền</h3>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm text-gray-600 mb-1">Số tiền (VNĐ)</label>
                                <input
                                    type="number"
                                    value={payoutAmount}
                                    onChange={(e) => setPayoutAmount(e.target.value)}
                                    placeholder="Tối thiểu 100.000₫"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <button
                                onClick={handlePayoutRequest}
                                disabled={requesting}
                                className="px-6 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 self-end"
                            >
                                {requesting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                            </button>
                        </div>
                    </div>

                    {/* Payout History */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border">
                        <h3 className="font-bold text-lg mb-4">Lịch sử rút tiền</h3>
                        <div className="space-y-3">
                            {payouts.map((payout, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${payout.status === 'completed' ? 'bg-green-100 text-green-600' :
                                            payout.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                                                'bg-red-100 text-red-600'
                                            }`}>
                                            {payout.status === 'completed' ? <CheckCircle className="w-5 h-5" /> :
                                                payout.status === 'pending' ? <Clock className="w-5 h-5" /> :
                                                    <XCircle className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {payout.amount.toLocaleString('vi-VN')}₫
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(payout.requested_at).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${payout.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        payout.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                        {payout.status === 'completed' ? 'Đã chuyển' :
                                            payout.status === 'pending' ? 'Đang xử lý' : 'Từ chối'}
                                    </span>
                                </div>
                            ))}
                            {payouts.length === 0 && (
                                <p className="text-center text-gray-500 py-4">Chưa có yêu cầu rút tiền</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-gray-900">{stats.cupsAvailable}</p>
                                    <p className="text-sm text-gray-500">Ly sẵn sàng</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-gray-900">{stats.cupsInUse}</p>
                                    <p className="text-sm text-gray-500">Đang sử dụng</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm border">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Package className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-gray-900">{stats.cupsCleaning}</p>
                                    <p className="text-sm text-gray-500">Đang vệ sinh</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Alerts */}
                    {stats.inventoryAlerts && stats.inventoryAlerts.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
                            <h3 className="font-bold text-yellow-800 flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-5 h-5" />
                                Cảnh báo kho hàng
                            </h3>
                            <div className="space-y-2">
                                {stats.inventoryAlerts.map((alert, i) => (
                                    <div key={i} className="flex items-center justify-between bg-white p-3 rounded-lg">
                                        <span className="text-gray-700">{alert.branchName}</span>
                                        <span className="text-yellow-700 font-medium">
                                            {alert.alertType === 'low_stock' ? 'Sắp hết ly sạch' : 'Quá nhiều ly bẩn'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, color, subtext }: {
    icon: any;
    label: string;
    value: string;
    color: string;
    subtext?: string;
}) {
    const colorClasses: Record<string, string> = {
        green: 'bg-green-100 text-green-600',
        blue: 'bg-blue-100 text-blue-600',
        orange: 'bg-orange-100 text-orange-600',
        emerald: 'bg-emerald-100 text-emerald-600',
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
            <p className="text-sm text-gray-500">{label}</p>
            {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </motion.div>
    );
}
