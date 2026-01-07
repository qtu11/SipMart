'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Activity, Droplets, RotateCcw } from 'lucide-react';
import { authFetch } from '@/lib/supabase/authFetch';
import Link from 'next/link';
import { Doughnut } from 'react-chartjs-2'; // Placeholder for charts
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function HygieneDashboard() {
    const [stats, setStats] = useState({
        activeHubs: 0,
        cupsCleaning: 0,
        cupsCleanedToday: 0,
        pendingRedistribution: 0
    });
    const [loading, setLoading] = useState(true);

    // Fake data for now until we have real data populated
    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await authFetch('/api/admin/hygiene/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
            } else {
                // Fallback zeroes if fail
                setStats({
                    activeHubs: 0,
                    cupsCleaning: 0,
                    cupsCleanedToday: 0,
                    pendingRedistribution: 0
                });
            }
        } catch (error) {
            console.error('Failed to fetch stats', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-dark-100">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-dark-500 text-sm font-medium">{title}</p>
                    <h3 className="text-2xl font-bold text-dark-900 mt-1">{value}</h3>
                </div>
                <div className={`p-3 rounded-lg ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
            {subtext && <p className="text-xs text-dark-400">{subtext}</p>}
        </div>
    );

    return (
        <div className="min-h-screen bg-dark-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-dark-900">Vệ sinh & Vận hành</h1>
                        <p className="text-dark-600">Quản lý trạm rửa, vòng đời ly và điều phối</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Trạm rửa hoạt động"
                        value={stats.activeHubs}
                        icon={Sparkles}
                        color="bg-blue-500"
                        subtext="Trên tổng số 2 trạm"
                    />
                    <StatCard
                        title="Ly đang xử lý"
                        value={stats.cupsCleaning}
                        icon={Droplets}
                        color="bg-cyan-500"
                        subtext="Đang trong quy trình rửa"
                    />
                    <StatCard
                        title="Ly sạch hôm nay"
                        value={stats.cupsCleanedToday}
                        icon={Activity}
                        color="bg-green-500"
                        subtext="+12% so với hôm qua"
                    />
                    <StatCard
                        title="Lệnh điều chuyển"
                        value={stats.pendingRedistribution}
                        icon={RotateCcw}
                        color="bg-orange-500"
                        subtext="Đang chờ xử lý"
                    />
                </div>

                {/* Quick Actions / Sub-modules */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Cleaning Hubs */}
                    <Link href="/admin/hygiene/hubs" className="group">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-dark-100 hover:border-primary-500 transition-all h-full">
                            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
                                <Sparkles className="w-6 h-6 text-blue-600 group-hover:text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-dark-900 mb-2">Trạm Rửa (Hubs)</h3>
                            <p className="text-dark-500 text-sm">Quản lý các trạm rừa, nhân viên phụ trách và công suất hoạt động.</p>
                        </div>
                    </Link>

                    {/* Cleaning Sessions */}
                    <Link href="/admin/hygiene/sessions" className="group">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-dark-100 hover:border-primary-500 transition-all h-full">
                            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-500 transition-colors">
                                <Droplets className="w-6 h-6 text-green-600 group-hover:text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-dark-900 mb-2">Phiên Rửa</h3>
                            <p className="text-dark-500 text-sm">Tạo và theo dõi các lô ly đang được làm sạch, nhập số lượng ly sạch/hỏng.</p>
                        </div>
                    </Link>

                    {/* Redistribution */}
                    <Link href="/admin/redistribution" className="group">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-dark-100 hover:border-primary-500 transition-all h-full">
                            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-500 transition-colors">
                                <RotateCcw className="w-6 h-6 text-orange-600 group-hover:text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-dark-900 mb-2">Điều Phối Ly</h3>
                            <p className="text-dark-500 text-sm">Cân bằng số lượng ly giữa các điểm bán. Xử lý cảnh báo thừa/thiếu ly.</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
