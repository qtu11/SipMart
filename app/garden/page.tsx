'use client';

import React, { useState, useEffect } from 'react';
import { TreeDeciduous, Droplets, Sprout, Wind, Sun, Award } from 'lucide-react';
import { getCurrentUser, onAuthChange } from '@/lib/supabase/auth';
import { useRouter } from 'next/navigation';
import SocialLayout from '@/components/social/SocialLayout';
import Scene3D from '@/components/Scene3D';
import toast from 'react-hot-toast';

interface TreeData {
    level: number;
    growth: number;
    health: string;
    lastWatered: string;
    totalWaterings: number;
}

export default function GardenPage() {
    const [user, setUser] = useState<any>(null);
    const [tree, setTree] = useState<TreeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [watering, setWatering] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const currentUser = await getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                fetchTreeData();
            } else {
                const unsubscribe = onAuthChange((user) => {
                    if (user) {
                        setUser(user);
                        fetchTreeData();
                    } else {
                        router.push('/auth/login');
                    }
                });
                return () => unsubscribe();
            }
        };
        checkUser();
    }, [router]);

    const fetchTreeData = async () => {
        try {
            const res = await fetch('/api/tree');
            if (res.ok) {
                const data = await res.json();
                setTree(data);
            }
        } catch (error) {
            console.error('Error fetching tree:', error);
            toast.error('Không thể tải dữ liệu cây');
        } finally {
            setLoading(false);
        }
    };

    const handleWater = async () => {
        if (watering) return;
        setWatering(true);
        try {
            const res = await fetch('/api/tree', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                if (data.tree) {
                    setTree(data.tree);
                    toast.success('Đã tưới cây! +10% Tăng trưởng');
                    if (data.leveledUp) {
                        toast.custom((t) => (
                            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-yellow-100 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                                <div className="flex-1 w-0 p-4">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 pt-0.5">
                                            <Award className="h-10 w-10 text-yellow-500" />
                                        </div>
                                        <div className="ml-3 flex-1">
                                            <p className="text-sm font-medium text-yellow-900">
                                                Chúc mừng! Cây đã lên cấp {data.tree.level}!
                                            </p>
                                            <p className="mt-1 text-sm text-yellow-700">
                                                Bạn nhận được 50 Green Points.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ), { duration: 5000 });
                    }
                }
            } else {
                toast.error('Có lỗi xảy ra khi tưới cây');
            }
        } catch (error) {
            console.error('Error watering:', error);
            toast.error('Không thể kết nối đến server');
        } finally {
            setWatering(false);
        }
    };

    if (!user) return null;

    return (
        <SocialLayout user={user}>
            <div className="max-w-4xl mx-auto pb-20">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <TreeDeciduous className="w-6 h-6 text-green-600" />
                        Vườn Cây Ảo
                    </h1>
                    <p className="text-gray-500 text-sm">Nuôi dưỡng cây xanh, tích lũy điểm thưởng và bảo vệ môi trường.</p>
                </div>

                {/* 3D Scene Wrapper */}
                <div className="relative mb-8 transform transition-all hover:scale-[1.01] duration-500">
                    <Scene3D />

                    {/* Overlay Stats if needed or leave clean */}
                </div>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                ) : tree ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Status Card */}
                        <div className="md:col-span-2 space-y-6">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <Sprout className="w-5 h-5 text-green-600" />
                                        </div>
                                        <span className="text-gray-500 font-medium text-sm">Cấp Độ</span>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-800">Level {tree.level}</div>
                                    <div className="text-xs text-green-600 mt-1 font-medium">Cây Tri Thức</div>
                                </div>

                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Droplets className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <span className="text-gray-500 font-medium text-sm">Đã Tưới</span>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-800">{tree.totalWaterings} lần</div>
                                    <div className="text-xs text-blue-600 mt-1 font-medium">Tuyệt vời!</div>
                                </div>
                            </div>

                            {/* Growth Progress */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                        <Sun className="w-5 h-5 text-yellow-500" />
                                        Tiến Trình Tăng Trưởng
                                    </h3>
                                    <span className="text-sm font-bold text-green-600">{Math.round(tree.growth)}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden mb-2">
                                    <div
                                        className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full transition-all duration-1000 ease-out relative"
                                        style={{ width: `${tree.growth}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 text-center">Tưới cây để đạt 100% và lên cấp mới!</p>
                            </div>
                        </div>

                        {/* Action Card */}
                        <div className="bg-gradient-to-b from-green-50 to-white p-6 rounded-2xl shadow-sm border border-green-100 flex flex-col items-center justify-center text-center">
                            <div className="mb-4 relative">
                                <div className="absolute inset-0 bg-blue-400 blur-xl opacity-20 rounded-full animate-pulse"></div>
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md relative z-10">
                                    <Droplets className={`w-10 h-10 text-blue-500 ${watering ? 'animate-bounce' : ''}`} />
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">Chăm Sóc Cây</h3>
                            <p className="text-sm text-gray-500 mb-6">Tưới nước giúp cây phát triển và nhận điểm thưởng xanh.</p>

                            <button
                                onClick={handleWater}
                                disabled={watering}
                                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transform transition active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {watering ? (
                                    <>
                                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                                        Đang tưới...
                                    </>
                                ) : (
                                    <>
                                        <Droplets className="w-5 h-5" />
                                        Tưới Nước Ngay
                                    </>
                                )}
                            </button>
                            <p className="mt-4 text-xs text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                +10% Tăng trưởng / lần tưới
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
                        <p className="text-gray-500">Chưa có dữ liệu cây.</p>
                    </div>
                )}

                {/* Additional Info Area */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-2xl border border-orange-100">
                        <h4 className="font-bold text-orange-800 flex items-center gap-2 mb-2">
                            <Wind className="w-5 h-5" /> Effect Môi Trường
                        </h4>
                        <p className="text-sm text-orange-700/80">
                            Cây của bạn đã giúp lọc khoảng 2.5kg CO2 từ không khí. Hãy tiếp tục duy trì nhé!
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-5 rounded-2xl border border-purple-100">
                        <h4 className="font-bold text-purple-800 flex items-center gap-2 mb-2">
                            <Sprout className="w-5 h-5" /> Mẹo Xanh
                        </h4>
                        <p className="text-sm text-purple-700/80">
                            Sử dụng ly cá nhân khi mua đồ uống giúp giảm rác thải nhựa đáng kể mỗi năm.
                        </p>
                    </div>
                </div>
            </div>
        </SocialLayout>
    );
}
