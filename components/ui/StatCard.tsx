import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'primary' | 'blue' | 'purple' | 'orange' | 'pink';
    loading?: boolean;
    delay?: number;
}

const colorStyles = {
    primary: {
        bg: 'from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20',
        icon: 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400',
        text: 'text-primary-600 dark:text-primary-400',
        border: 'border-primary-200 dark:border-primary-800',
    },
    blue: {
        bg: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
        icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
    },
    purple: {
        bg: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
        icon: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800',
    },
    orange: {
        bg: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20',
        icon: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
        text: 'text-orange-600 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-800',
    },
    pink: {
        bg: 'from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20',
        icon: 'bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400',
        text: 'text-pink-600 dark:text-pink-400',
        border: 'border-pink-200 dark:border-pink-800',
    },
};

export function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color = 'primary',
    loading = false,
    delay = 0,
}: StatCardProps) {
    const [displayValue, setDisplayValue] = useState(0);
    const styles = colorStyles[color];

    // Animated counter for numeric values
    useEffect(() => {
        if (typeof value === 'number' && !loading) {
            const duration = 1000;
            const steps = 60;
            const increment = value / steps;
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= value) {
                    setDisplayValue(value);
                    clearInterval(timer);
                } else {
                    setDisplayValue(Math.floor(current));
                }
            }, duration / steps);

            return () => clearInterval(timer);
        }
    }, [value, loading]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            whileHover={{ scale: 1.02, y: -4 }}
            className={cn(
                'relative overflow-hidden rounded-2xl p-6 shadow-xl border-2 transition-all duration-300 cursor-pointer',
                'bg-gradient-to-br',
                styles.bg,
                styles.border
            )}
        >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 dark:bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                    <div className={cn('p-3 rounded-xl', styles.icon)}>
                        <Icon className="w-6 h-6" />
                    </div>
                    {trend && (
                        <div
                            className={cn(
                                'text-xs font-semibold px-2 py-1 rounded-lg',
                                trend.isPositive
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            )}
                        >
                            {trend.isPositive ? '+' : ''}{trend.value}%
                        </div>
                    )}
                </div>

                <div className="mb-2">
                    <p className="text-sm font-medium text-dark-600 dark:text-dark-300 mb-1">
                        {title}
                    </p>
                    {loading ? (
                        <div className="h-8 w-24 bg-dark-200 dark:bg-dark-700 animate-pulse rounded" />
                    ) : (
                        <p className={cn('text-3xl font-bold', styles.text)}>
                            {typeof value === 'number' ? displayValue.toLocaleString('vi-VN') : value}
                        </p>
                    )}
                </div>

                {subtitle && (
                    <p className="text-xs text-dark-500 dark:text-dark-400">
                        {subtitle}
                    </p>
                )}
            </div>
        </motion.div>
    );
}
