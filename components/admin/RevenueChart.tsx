'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts';

interface RevenueChartProps {
    data?: {
        date: string;
        bikeRental: number;
        lateFees: number;
        busCommission: number;
        operatingCost: number;
    }[];
}

// Generate sample data for 30 days
const generateSampleData = () => {
    const data = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        data.push({
            date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
            bikeRental: Math.floor(Math.random() * 5000000) + 1000000,
            lateFees: Math.floor(Math.random() * 500000) + 50000,
            busCommission: Math.floor(Math.random() * 200000) + 10000,
            operatingCost: Math.floor(Math.random() * 2000000) + 500000,
        });
    }
    return data;
};

const formatCurrency = (value: number) => {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}Tr`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                <p className="font-semibold text-slate-900 dark:text-white mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-slate-600 dark:text-slate-400">{entry.name}:</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                            {formatCurrency(entry.value)} VNĐ
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function RevenueChart({ data }: RevenueChartProps) {
    const chartData = data || generateSampleData();

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Phân tích Dòng tiền & Doanh thu
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        30 ngày gần nhất
                    </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-slate-600 dark:text-slate-400">Thuê xe</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-slate-600 dark:text-slate-400">Phí quá hạn</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-slate-600 dark:text-slate-400">Hoa hồng Bus</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <span className="text-slate-600 dark:text-slate-400">Chi phí VH</span>
                    </div>
                </div>
            </div>

            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            axisLine={{ stroke: '#e2e8f0' }}
                            tickLine={false}
                            interval={4}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={formatCurrency}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="bikeRental" name="Thuê xe đạp" stackId="revenue" fill="#10b981" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="lateFees" name="Phí quá hạn" stackId="revenue" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="busCommission" name="Hoa hồng Bus" stackId="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Line
                            type="monotone"
                            dataKey="operatingCost"
                            name="Chi phí VH"
                            stroke="#f87171"
                            strokeWidth={2}
                            dot={false}
                            strokeDasharray="5 5"
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
