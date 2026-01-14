'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, CloudRain, Droplets, Trophy, ArrowLeft, Leaf, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import SocialLayout from '@/components/social/SocialLayout';
import { useAuth } from '@/hooks/useAuth';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { toast } from 'react-hot-toast';

interface TreeData {
    level: number;
    growth: number;
    health: 'healthy' | 'wilting' | 'dead';
    totalWaterings: number;
}

export default function TreeWateringGame() {
    const { user, loading: authLoading } = useAuth();
    const [tree, setTree] = useState<TreeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [watering, setWatering] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const { width, height } = useWindowSize();

    const fetchTree = async () => {
        try {
            const res = await fetch('/api/tree');
            if (res.ok) {
                const data = await res.json();
                setTree(data);
            }
        } catch (error) {
            console.error('Failed to fetch tree', error);
            toast.error('Không thể tải dữ liệu cây');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchTree();
    }, [user]);

    const handleWater = async () => {
        if (watering || !tree) return;
        setWatering(true);

        try {
            const res = await fetch('/api/tree', { method: 'POST' });
            const data = await res.json();

            if (res.ok) {
                setTree(data.tree);
                if (data.leveledUp) {
                    setShowConfetti(true);
                    toast.success('Chúc mừng! Cây của bạn đã lên cấp!', { icon: '🎉' });
                    setTimeout(() => setShowConfetti(false), 5000);
                } else {
                    toast.success('Đã tưới nước! Cây đang lớn lên 🌱');
                }
            } else {
                toast.error('Có lỗi xảy ra khi tưới cây');
            }
        } catch (error) {
            console.error('Error watering', error);
            toast.error('Lỗi kết nối');
        } finally {
            setTimeout(() => setWatering(false), 1500); // Animation duration
        }
    };

    const TreeIcon = ({ level }: { level: number }) => {
        // Render different icons/sizes based on level
        if (level < 3) return <Sprout className="w-32 h-32 text-green-500" />;
        if (level < 6) return <Leaf className="w-48 h-48 text-green-600" />;
        return <div className="relative">
            <motion.div
                animate={{ rotate: [0, 1, 0, -1, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-64 h-64 text-green-700"
                >
                    <path d="M12 19V6M5 19h14a2 2 0 002-2c0-8-6-10-8-14-2 4-8 6-8 14a2 2 0 002 2z" />
                </svg>
            </motion.div>
            {/* Decorate with fruits if level > 8 */}
            {level > 8 && (
                <>
                    <motion.div className="absolute top-10 left-10 w-4 h-4 bg-red-500 rounded-full" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                    <motion.div className="absolute top-16 right-16 w-4 h-4 bg-red-500 rounded-full" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
                </>
            )}
        </div>;
    };

    if (authLoading || loading) {
        return (
            <SocialLayout user={user}>
                <div className="flex justify-center items-center h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                </div>
            </SocialLayout>
        );
    }

    return (
        <SocialLayout user={user}>
            {showConfetti && <Confetti width={width} height={height} numberOfPieces={200} recycle={false} />}

            <div className="max-w-2xl mx-auto pb-20 px-4">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/games" className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-gray-600">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800">Tưới Cây</h1>
                    <div className="ml-auto flex items-center gap-2 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">
                        <Trophy className="w-4 h-4" />
                        Level {tree?.level || 1}
                    </div>
                </div>

                {/* Game Area */}
                <div className="bg-gradient-to-b from-sky-100 to-green-50 rounded-3xl p-8 shadow-xl border border-white relative overflow-hidden min-h-[500px] flex flex-col items-center justify-between">

                    {/* Clouds Background */}
                    <motion.div
                        className="absolute top-10 left-10 text-white opacity-60"
                        animate={{ x: [0, 50, 0] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                        <CloudRain className="w-16 h-16" />
                    </motion.div>
                    <motion.div
                        className="absolute top-20 right-20 text-white opacity-40"
                        animate={{ x: [0, -30, 0] }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    >
                        <CloudRain className="w-24 h-24" />
                    </motion.div>

                    {/* Stats */}
                    <div className="w-full grid grid-cols-2 gap-4 z-10">
                        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl shadow-sm">
                            <p className="text-xs text-gray-500 font-medium">Tăng trưởng</p>
                            <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-green-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${tree?.growth}%` }}
                                    transition={{ duration: 1 }}
                                />
                            </div>
                            <p className="text-right text-xs mt-1 text-green-600 font-bold">{Math.round(tree?.growth || 0)}%</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl shadow-sm text-center">
                            <p className="text-xs text-gray-500 font-medium">Tổng số lần tưới</p>
                            <p className="text-xl font-bold text-blue-600">{tree?.totalWaterings || 0}</p>
                        </div>
                    </div>

                    {/* Tree Container */}
                    <div className="relative flex-1 flex items-center justify-center w-full z-10 py-10">
                        {/* Water Drops Animation */}
                        <AnimatePresence>
                            {watering && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2">
                                    {[1, 2, 3].map((i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ y: -50, opacity: 0 }}
                                            animate={{ y: 200, opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.8, delay: i * 0.2 }}
                                            className="text-blue-500"
                                        >
                                            <Droplets className="w-8 h-8 fill-current" />
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </AnimatePresence>

                        <motion.div
                            animate={watering ? { scale: [1, 1.05, 1] } : {}}
                            transition={{ duration: 0.5 }}
                        >
                            <TreeIcon level={tree?.level || 1} />
                        </motion.div>

                        {/* Ground */}
                        <div className="absolute bottom-0 w-full h-8 bg-black/5 rounded-[50%] blur-xl transform scale-x-150" />
                    </div>

                    {/* Action Button */}
                    <div className="z-20 w-full max-w-xs">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleWater}
                            disabled={watering}
                            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${watering
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-blue-200'
                                }`}
                        >
                            {watering ? (
                                'Đang tưới...'
                            ) : (
                                <>
                                    <Droplets className="w-6 h-6" /> Tưới Nước
                                </>
                            )}
                        </motion.button>
                        <p className="text-center text-xs text-gray-500 mt-3 flex items-center justify-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Bảo vệ cây không héo bằng cách tưới mỗi ngày!
                        </p>
                    </div>
                </div>
            </div>
        </SocialLayout>
    );
}
