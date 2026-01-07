'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    showPercentage?: boolean;
}

export default function LoadingSpinner({
    size = 'md',
    showPercentage = true
}: LoadingSpinnerProps) {
    const [progress, setProgress] = useState(0);

    const sizes = {
        sm: { width: 60, strokeWidth: 4, fontSize: 'text-xs' },
        md: { width: 100, strokeWidth: 6, fontSize: 'text-lg' },
        lg: { width: 140, strokeWidth: 8, fontSize: 'text-2xl' },
    };

    const config = sizes[size];
    const radius = (config.width - config.strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    useEffect(() => {
        // Simulate loading progress
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                // Random increment between 5-15%
                const increment = Math.floor(Math.random() * 10) + 5;
                return Math.min(prev + increment, 100);
            });
        }, 300);

        return () => clearInterval(interval);
    }, []);

    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <motion.div
                className="relative"
                animate={{ rotate: 360 }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            >
                <svg
                    width={config.width}
                    height={config.width}
                    className="transform -rotate-90"
                >
                    {/* Background circle */}
                    <circle
                        cx={config.width / 2}
                        cy={config.width / 2}
                        r={radius}
                        stroke="#E0F2E9"
                        strokeWidth={config.strokeWidth}
                        fill="none"
                    />

                    {/* Gradient definition */}
                    <defs>
                        <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#22c55e" />
                            <stop offset="50%" stopColor="#16a34a" />
                            <stop offset="100%" stopColor="#15803d" />
                        </linearGradient>

                        {/* 3D shadow filter */}
                        <filter id="shadow3d" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                            <feOffset dx="0" dy="2" result="offsetblur" />
                            <feComponentTransfer>
                                <feFuncA type="linear" slope="0.3" />
                            </feComponentTransfer>
                            <feMerge>
                                <feMergeNode />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Progress circle with 3D effect */}
                    <motion.circle
                        cx={config.width / 2}
                        cy={config.width / 2}
                        r={radius}
                        stroke="url(#spinnerGradient)"
                        strokeWidth={config.strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        filter="url(#shadow3d)"
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                    />
                </svg>

                {/* Percentage in center */}
                {showPercentage && (
                    <motion.div
                        className={`absolute inset-0 flex items-center justify-center ${config.fontSize} font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent`}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        {progress}%
                    </motion.div>
                )}
            </motion.div>

            {/* Loading text */}
            <motion.p
                className="text-primary-600 font-medium"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            >
                Đang tải...
            </motion.p>
        </div>
    );
}
