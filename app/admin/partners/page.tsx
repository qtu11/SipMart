'use client';

import Link from 'next/link';
import { Handshake, FileText, Calculator, Users, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/supabase/authFetch';

export default function PartnerDashboard() {
    const [stats, setStats] = useState({
        activeContracts: 0,
        activePartners: 0,
        pendingSettlements: 0
    });

    // Placeholder stats loading
    useEffect(() => {
        // Future: fetchStats();
        setStats({
            activeContracts: 3,
            activePartners: 0, // Need to implement partners API stats
            pendingSettlements: 1
        });
    }, []);

    return (
        <div className="min-h-screen bg-dark-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-dark-900">Quản lý Đối tác</h1>
                        <p className="text-dark-600">Quản lý hợp đồng, đối soát và tài khoản cửa hàng</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-dark-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Handshake className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-dark-500">Đối tác hoạt động</p>
                                <h3 className="text-2xl font-bold">{stats.activeContracts}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-dark-100">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Calculator className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-dark-500">Đối soát chờ duyệt</p>
                                <h3 className="text-2xl font-bold">{stats.pendingSettlements}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feature Navigation */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link href="/admin/partners/contracts" className="group">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-dark-100 hover:border-purple-500 transition-all h-full">
                            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-500 transition-colors">
                                <FileText className="w-6 h-6 text-purple-600 group-hover:text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-dark-900 mb-2">Hợp đồng</h3>
                            <p className="text-dark-500 text-sm">Quản lý các điều khoản hợp tác, mức hoa hồng và thời hạn.</p>
                        </div>
                    </Link>

                    <Link href="/admin/partners/settlements" className="group">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-dark-100 hover:border-green-500 transition-all h-full">
                            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-500 transition-colors">
                                <Calculator className="w-6 h-6 text-green-600 group-hover:text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-dark-900 mb-2">Đối soát</h3>
                            <p className="text-dark-500 text-sm">Tính toán doanh thu, hoa hồng và tạo lệnh thanh toán định kỳ.</p>
                        </div>
                    </Link>

                    <Link href="/admin/partners/accounts" className="group">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-dark-100 hover:border-blue-500 transition-all h-full">
                            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
                                <Users className="w-6 h-6 text-blue-600 group-hover:text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-dark-900 mb-2">Tài khoản Merchant</h3>
                            <p className="text-dark-500 text-sm">Cấp quyền truy cập cho nhân viên cửa hàng và quản lý PIN code.</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
