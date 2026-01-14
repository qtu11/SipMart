'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, ShoppingBag, DollarSign, Activity } from 'lucide-react';

const stats = [
    { label: 'Doanh thu hôm nay', value: '2.450.000₫', change: '+12.5%', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Đơn hàng', value: '145', change: '+5.2%', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Khách hàng mới', value: '32', change: '-2.1%', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Ly đang dùng', value: '86', change: '+8.4%', icon: Activity, color: 'text-orange-600', bg: 'bg-orange-100' },
];

export default function PartnerDashboard() {
    const [stats, setStats] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/partner/dashboard');
                const data = await res.json();
                setStats(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>;
    if (!stats) return null;

    const displayStats = [
        { label: 'Doanh thu hôm nay', value: `${stats.revenue?.toLocaleString()}₫`, change: '+0%', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Đơn hàng', value: stats.orders, change: '+0%', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Ly đang dùng', value: stats.cupsInUse, change: '+0%', icon: Activity, color: 'text-orange-600', bg: 'bg-orange-100' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Tổng quan</h1>
                <p className="text-gray-500 mt-1">Chào mừng trở lại! Đây là báo cáo hôm nay của bạn.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayStats.map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                        <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Recent Transactions */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg text-gray-800 mb-6">Giao dịch gần đây</h3>
                <div className="space-y-4">
                    {stats.recentTransactions?.map((t: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer border border-gray-50 hover:border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">Mượn ly #{String(t.id).slice(0, 8)}</p>
                                    <p className="text-xs text-gray-500">{new Date(t.time).toLocaleTimeString()} • {t.user}</p>
                                </div>
                            </div>
                            <span className="font-bold text-gray-900">-{t.amount?.toLocaleString()}₫</span>
                        </div>
                    ))}
                    {stats.recentTransactions?.length === 0 && <p className="text-center text-gray-500">Chưa có giao dịch nào.</p>}
                </div>
            </div>
        </div>
    );
}
