'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface Leaf {
    id: number;
    x: number;
    delay: number;
    duration: number;
    size: number;
    rotation: number;
}

export default function FallingLeaves() {
    // Generate random leaves
    const leaves = useMemo(() => {
        const leafArray: Leaf[] = [];
        for (let i = 0; i < 15; i++) {
            leafArray.push({
                id: i,
                x: Math.random() * 100, // Start position (0-100%)
                delay: Math.random() * 5, // Random delay
                duration: 5 + Math.random() * 5, // 5-10 seconds
                size: 20 + Math.random() * 30, // 20-50px
                rotation: Math.random() * 360,
            });
        }
        return leafArray;
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
            {leaves.map((leaf) => (
                <motion.div
                    key={leaf.id}
                    className="absolute"
                    initial={{
                        top: -50,
                        right: `${leaf.x}%`,
                        rotate: leaf.rotation,
                        opacity: 0,
                    }}
                    animate={{
                        top: '110vh',
                        right: `${leaf.x - 30}%`, // Drift from right to left
                        rotate: leaf.rotation + 720, // Multiple rotations
                        opacity: [0, 1, 1, 0],
                    }}
                    transition={{
                        duration: leaf.duration,
                        delay: leaf.delay,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                    style={{
                        width: leaf.size,
                        height: leaf.size,
                    }}
                >
                    {/* SVG Leaf */}
                    <svg
                        viewBox="0 0 100 100"
                        className="w-full h-full drop-shadow-lg"
                    >
                        <defs>
                            <linearGradient id={`leafGradient${leaf.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#22c55e" />
                                <stop offset="50%" stopColor="#16a34a" />
                                <stop offset="100%" stopColor="#15803d" />
                            </linearGradient>
                        </defs>

                        {/* Leaf shape */}
                        <path
                            d="M50 10 Q70 30 75 50 Q70 70 50 90 Q30 70 25 50 Q30 30 50 10 Z"
                            fill={`url(#leafGradient${leaf.id})`}
                            opacity="0.8"
                        />

                        {/* Leaf vein */}
                        <path
                            d="M50 10 L50 90"
                            stroke="#15803d"
                            strokeWidth="2"
                            fill="none"
                            opacity="0.3"
                        />
                        <path
                            d="M50 30 Q40 35 35 40 M50 50 Q40 55 38 58 M50 70 Q40 72 37 75"
                            stroke="#15803d"
                            strokeWidth="1"
                            fill="none"
                            opacity="0.2"
                        />
                        <path
                            d="M50 30 Q60 35 65 40 M50 50 Q60 55 62 58 M50 70 Q60 72 63 75"
                            stroke="#15803d"
                            strokeWidth="1"
                            fill="none"
                            opacity="0.2"
                        />
                    </svg>
                </motion.div>
            ))}
        </div>
    );
}
