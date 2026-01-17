'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    DollarSign, TrendingUp, Leaf, Download, Wallet,
    Package, AlertTriangle, Clock, CheckCircle, XCircle,
    FileText, Bike, Coffee, BarChart3, Users
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PartnerPortalPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'esg' | 'payout' | 'inventory'>('dashboard');
    const [payoutAmount, setPayoutAmount] = useState('');
    const [requesting, setRequesting] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/partner/dashboard');
            if (res.ok) {
                const result = await res.json();
                setData(result);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePayoutRequest = async () => {
        const amount = parseInt(payoutAmount);
        if (!amount || amount < 100000) {
            toast.error('Số tiền tối thiểu 100.000₫');
            return;
        }
        setRequesting(true);
        try {
            const res = await fetch('/api/partner/payout/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount })
            });
            if (res.ok) {
                toast.success('Đã gửi yêu cầu rút tiền!');
                setPayoutAmount('');
                fetchData();
            } else {
                const err = await res.json();
                toast.error(err.error || 'Lỗi');
            }
        } catch {
            toast.error('Lỗi kết nối');
        } finally {
            setRequesting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-8 px-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold">Partner Portal</h1>
                    <p className="opacity-80 mt-1">Quản lý doanh thu, ESG và kho hàng của bạn</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-6 -mt-4">
                <div className="bg-white rounded-xl shadow-sm inline-flex p-1">
                    {[
                        { id: 'dashboard', label: 'Tổng quan', icon: BarChart3 },
                        { id: 'esg', label: 'Báo cáo ESG', icon: Leaf },
                        { id: 'payout', label: 'Rút tiền', icon: Wallet },
                        { id: 'inventory', label: 'Kho hàng', icon: Package },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === tab.id
                                    ? 'bg-green-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <StatCard
                                icon={DollarSign}
                                label="Doanh thu hôm nay"
                                value={`${(data?.revenue || 0).toLocaleString('vi-VN')}₫`}
                                color="green"
                                subtext="99.9% của tổng giao dịch"
                            />
                            <StatCard
                                icon={Package}
                                label="Đơn hàng"
                                value={data?.orders || 0}
                                color="blue"
                            />
                            <StatCard
                                icon={Coffee}
                                label="Ly đang sử dụng"
                                value={data?.cupsInUse || 0}
                                color="orange"
                            />
                            <StatCard
                                icon={Leaf}
                                label="CO₂ tiết kiệm"
                                value={`${data?.kpi?.co2SavedKg || 0}kg`}
                                color="emerald"
                                subtext="Tháng này"
                            />
                        </div>

                        {/* Recent Transactions */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h3 className="font-bold text-lg text-gray-800 mb-4">Giao dịch gần đây</h3>
                            <div className="space-y-3">
                                {(data?.recentTransactions || []).slice(0, 5).map((tx: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                                                }`}>
                                                {tx.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">Mượn ly #{String(tx.id).slice(0, 8)}</p>
                                                <p className="text-sm text-gray-500">{new Date(tx.borrowTime || tx.time).toLocaleString('vi-VN')}</p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-gray-900">{(tx.amount || 0).toLocaleString('vi-VN')}₫</p>
                                    </div>
                                ))}
                                {(!data?.recentTransactions || data.recentTransactions.length === 0) && (
                                    <p className="text-center text-gray-500 py-4">Chưa có giao dịch</p>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* ESG Tab */}
                {activeTab === 'esg' && (
                    <>
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-8 text-white">
                            <h2 className="text-2xl font-bold mb-2">Báo cáo Tác động Môi trường</h2>
                            <p className="opacity-80 mb-6">Dữ liệu ESG theo tiêu chuẩn IPCC - Scope 3</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="text-center">
                                    <p className="text-4xl font-bold">{data?.kpi?.cupsReusedThisMonth || 0}</p>
                                    <p className="text-sm opacity-80">Ly tái sử dụng</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-4xl font-bold">{data?.kpi?.plasticSavedKg || 0}</p>
                                    <p className="text-sm opacity-80">kg Nhựa giảm</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-4xl font-bold">{data?.kpi?.co2SavedKg || 0}</p>
                                    <p className="text-sm opacity-80">kg CO₂ giảm</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-4xl font-bold">{data?.kpi?.treesEquivalent || 0}</p>
                                    <p className="text-sm opacity-80">🌳 Cây tương đương</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-lg mb-4">Xuất báo cáo</h3>
                            <p className="text-gray-600 mb-4">
                                Tải báo cáo ESG để nộp cho kiểm toán xanh hoặc làm hồ sơ vay vốn xanh.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => window.open('/api/partner/esg-report?period=month', '_blank')}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    <FileText className="w-4 h-4 inline mr-2" />
                                    Báo cáo Tháng
                                </button>
                                <button
                                    onClick={() => window.open('/api/partner/esg-report?period=quarter', '_blank')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    <FileText className="w-4 h-4 inline mr-2" />
                                    Báo cáo Quý
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Payout Tab */}
                {activeTab === 'payout' && (
                    <>
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-lg mb-4">Yêu cầu rút tiền</h3>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm text-gray-600 mb-1">Số tiền (VNĐ)</label>
                                    <input
                                        type="number"
                                        value={payoutAmount}
                                        onChange={(e) => setPayoutAmount(e.target.value)}
                                        placeholder="Tối thiểu 100.000₫"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500"
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

                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-lg mb-4">Lịch sử rút tiền</h3>
                            <p className="text-center text-gray-500 py-8">Tính năng đang phát triển</p>
                        </div>
                    </>
                )}

                {/* Inventory Tab */}
                {activeTab === 'inventory' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">{data?.cupsAvailable || 0}</p>
                                    <p className="text-sm text-gray-500">Ly sẵn sàng</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">{data?.cupsInUse || 0}</p>
                                    <p className="text-sm text-gray-500">Đang sử dụng</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Package className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">{data?.cupsCleaning || 0}</p>
                                    <p className="text-sm text-gray-500">Đang vệ sinh</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color, subtext }: {
    icon: any;
    label: string;
    value: string | number;
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
            className="bg-white rounded-2xl p-6 shadow-sm"
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
