'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface KpiCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    sparklineData?: number[];
    color: 'green' | 'blue' | 'orange' | 'purple' | 'red';
    delay?: number;
}

const colorMap = {
    green: {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        icon: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-100 dark:border-emerald-800/50',
        chart: '#10b981',
        gradient: 'from-emerald-500/20 to-emerald-500/5',
    },
    blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        icon: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-100 dark:border-blue-800/50',
        chart: '#3b82f6',
        gradient: 'from-blue-500/20 to-blue-500/5',
    },
    orange: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        icon: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-100 dark:border-amber-800/50',
        chart: '#f59e0b',
        gradient: 'from-amber-500/20 to-amber-500/5',
    },
    purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        icon: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-100 dark:border-purple-800/50',
        chart: '#8b5cf6',
        gradient: 'from-purple-500/20 to-purple-500/5',
    },
    red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        icon: 'text-red-600 dark:text-red-400',
        border: 'border-red-100 dark:border-red-800/50',
        chart: '#ef4444',
        gradient: 'from-red-500/20 to-red-500/5',
    },
};

export default function KpiCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    sparklineData,
    color = 'green',
    delay = 0,
}: KpiCardProps) {
    const colors = colorMap[color];
    const chartData = sparklineData?.map((val, i) => ({ value: val, index: i })) || [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            className={`relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border ${colors.border} p-6 shadow-sm hover:shadow-md transition-all`}
        >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-50`} />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${colors.icon}`} />
                    </div>
                    {trend && (
                        <div className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-lg ${trend.isPositive
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                            {trend.isPositive ? (
                                <TrendingUp className="w-3.5 h-3.5" />
                            ) : (
                                <TrendingDown className="w-3.5 h-3.5" />
                            )}
                            {trend.isPositive ? '+' : ''}{trend.value}%
                        </div>
                    )}
                </div>

                {/* Value */}
                <div className="mb-1">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {value}
                    </h3>
                </div>

                {/* Title & Subtitle */}
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
                {subtitle && (
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{subtitle}</p>
                )}

                {/* Sparkline Chart */}
                {chartData.length > 0 && (
                    <div className="mt-4 h-12 -mx-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={colors.chart} stopOpacity={0.4} />
                                        <stop offset="100%" stopColor={colors.chart} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={colors.chart}
                                    strokeWidth={2}
                                    fill={`url(#gradient-${color})`}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
