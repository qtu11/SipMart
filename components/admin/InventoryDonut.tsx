'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface InventoryDonutProps {
    data?: {
        inUse: number;
        available: number;
        cleaning: number;
        lost: number;
    };
}

const COLORS = {
    inUse: '#3b82f6',      // Blue
    available: '#10b981',   // Green
    cleaning: '#8b5cf6',    // Purple
    lost: '#ef4444',        // Red
};

const LABELS = {
    inUse: 'Đang sử dụng',
    available: 'Sẵn sàng',
    cleaning: 'Đang vệ sinh',
    lost: 'Mất/Hư hỏng',
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        return (
            <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: data.payload.fill }}
                    />
                    <span className="font-medium text-slate-900 dark:text-white">
                        {data.name}: {data.value} ly ({data.payload.percent}%)
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

export default function InventoryDonut({ data }: InventoryDonutProps) {
    const defaultData = {
        inUse: 350,
        available: 520,
        cleaning: 80,
        lost: 50,
    };

    const chartInput = data || defaultData;
    const total = chartInput.inUse + chartInput.available + chartInput.cleaning + chartInput.lost;

    const chartData = [
        { name: LABELS.inUse, value: chartInput.inUse, fill: COLORS.inUse, percent: ((chartInput.inUse / total) * 100).toFixed(1) },
        { name: LABELS.available, value: chartInput.available, fill: COLORS.available, percent: ((chartInput.available / total) * 100).toFixed(1) },
        { name: LABELS.cleaning, value: chartInput.cleaning, fill: COLORS.cleaning, percent: ((chartInput.cleaning / total) * 100).toFixed(1) },
        { name: LABELS.lost, value: chartInput.lost, fill: COLORS.lost, percent: ((chartInput.lost / total) * 100).toFixed(1) },
    ];

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm h-full">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Trạng thái Kho Ly
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Phân bổ tài sản theo trạng thái
                </p>
            </div>

            <div className="flex items-center gap-6">
                {/* Donut Chart */}
                <div className="relative w-48 h-48 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={80}
                                paddingAngle={3}
                                dataKey="value"
                                strokeWidth={0}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Center Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-slate-900 dark:text-white">
                            {total}
                        </span>
                        <span className="text-xs text-slate-500">Tổng ly</span>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-3">
                    {chartData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: item.fill }}
                                />
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                    {item.name}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                    {item.value}
                                </span>
                                <span className="text-xs text-slate-500 ml-1">
                                    ({item.percent}%)
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
