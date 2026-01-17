'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Bike, Coffee, Bus, CreditCard } from 'lucide-react';

interface Transaction {
    id: string;
    type: 'bike' | 'cup' | 'bus' | 'wallet';
    user: string;
    amount: number;
    status: 'success' | 'pending' | 'failed';
    time: string;
}

interface TransactionsTableProps {
    transactions?: Transaction[];
}

const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
        case 'bike': return <Bike className="w-4 h-4" />;
        case 'cup': return <Coffee className="w-4 h-4" />;
        case 'bus': return <Bus className="w-4 h-4" />;
        case 'wallet': return <CreditCard className="w-4 h-4" />;
    }
};

const getTypeName = (type: Transaction['type']) => {
    switch (type) {
        case 'bike': return 'Thuê xe';
        case 'cup': return 'Mượn ly';
        case 'bus': return 'Vé Bus';
        case 'wallet': return 'Nạp ví';
    }
};

const getTypeColor = (type: Transaction['type']) => {
    switch (type) {
        case 'bike': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
        case 'cup': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
        case 'bus': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        case 'wallet': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    }
};

const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
        case 'success':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <ArrowUpRight className="w-3 h-3" />
                    Thành công
                </span>
            );
        case 'pending':
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                    Đang xử lý
                </span>
            );
        case 'failed':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    <ArrowDownRight className="w-3 h-3" />
                    Thất bại
                </span>
            );
    }
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);
};

// Sample data
const sampleTransactions: Transaction[] = [
    { id: 'TXN-001', type: 'bike', user: 'Nguyễn Văn A', amount: 25000, status: 'success', time: '5 phút trước' },
    { id: 'TXN-002', type: 'cup', user: 'Trần Thị B', amount: 20000, status: 'success', time: '12 phút trước' },
    { id: 'TXN-003', type: 'bus', user: 'Lê Minh C', amount: 7000, status: 'success', time: '18 phút trước' },
    { id: 'TXN-004', type: 'wallet', user: 'Phạm Hồng D', amount: 500000, status: 'pending', time: '25 phút trước' },
    { id: 'TXN-005', type: 'bike', user: 'Hoàng Văn E', amount: 35000, status: 'success', time: '32 phút trước' },
    { id: 'TXN-006', type: 'cup', user: 'Đỗ Thị F', amount: 20000, status: 'failed', time: '45 phút trước' },
    { id: 'TXN-007', type: 'bus', user: 'Vũ Quang G', amount: 14000, status: 'success', time: '1 giờ trước' },
    { id: 'TXN-008', type: 'wallet', user: 'Bùi Thị H', amount: 200000, status: 'success', time: '1.5 giờ trước' },
];

export default function TransactionsTable({ transactions }: TransactionsTableProps) {
    const data = transactions || sampleTransactions;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            Giao dịch Gần nhất
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Theo dõi hoạt động hệ thống
                        </p>
                    </div>
                    <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                        Xem tất cả →
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Loại
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Người dùng
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Số tiền
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Trạng thái
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Thời gian
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {data.map((txn) => (
                            <tr key={txn.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                                        {txn.id}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${getTypeColor(txn.type)}`}>
                                        {getTypeIcon(txn.type)}
                                        {getTypeName(txn.type)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                                        {txn.user}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {formatCurrency(txn.amount)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getStatusBadge(txn.status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                        {txn.time}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
