'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Star, Clock, Zap, Target, CheckCircle, ArrowRight } from 'lucide-react';
import { getCurrentUser, onAuthChange } from '@/lib/supabase/auth';
import { useRouter } from 'next/navigation';
import SocialLayout from '@/components/social/SocialLayout';
import toast from 'react-hot-toast';

interface Challenge {
    challengeId: string;
    name: string;
    description: string;
    icon: string;
    type: string;
    rewardPoints: number;
    startDate: string;
    endDate: string;
    joined: boolean;
    progress: number;
    progressPercentage: number;
    status: string; // not_joined, in_progress, completed
    requirementValue: number;
    requirementType: string;
}

export default function ChallengesPage() {
    const [user, setUser] = useState<any>(null);
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);
    const [joiningId, setJoiningId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const currentUser = await getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                fetchChallenges();
            } else {
                const unsubscribe = onAuthChange((user) => {
                    if (user) {
                        setUser(user);
                        fetchChallenges();
                    } else {
                        router.push('/auth/login');
                    }
                });
                return () => unsubscribe();
            }
        };
        checkUser();
    }, [router]);

    const fetchChallenges = async () => {
        try {
            const res = await fetch('/api/challenges');
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setChallenges(data.challenges);
                }
            }
        } catch (error) {
            console.error('Error fetching challenges:', error);
            toast.error('Không thể tải thử thách');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinChallenge = async (challengeId: string) => {
        setJoiningId(challengeId);
        try {
            const res = await fetch('/api/challenges', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ challengeId }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                toast.success('Đã tham gia thử thách thành công!');
                // Update local state
                setChallenges(prev => prev.map(c =>
                    c.challengeId === challengeId
                        ? { ...c, joined: true, status: 'in_progress' }
                        : c
                ));
            } else {
                toast.error(data.error || 'Có lỗi xảy ra');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
        } finally {
            setJoiningId(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'daily': return <Clock className="w-5 h-5 text-blue-500" />;
            case 'weekly': return <Star className="w-5 h-5 text-yellow-500" />;
            case 'special': return <Zap className="w-5 h-5 text-purple-500" />;
            default: return <Target className="w-5 h-5 text-green-500" />;
        }
    };

    if (!user) return null;

    return (
        <SocialLayout user={user}>
            <div className="max-w-3xl mx-auto pb-20">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                            Thử Thách
                        </h1>
                        <p className="text-gray-500 text-sm">Hoàn thành nhiệm vụ để nhận điểm thưởng.</p>
                    </div>
                    <div className="bg-green-100 px-3 py-1 rounded-full text-green-700 font-bold text-sm flex items-center gap-1">
                        {user.greenPoints || 0} pts
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : challenges.length > 0 ? (
                    <div className="space-y-4">
                        {challenges.map((challenge) => (
                            <div key={challenge.challengeId} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transform transition hover:shadow-md">
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${challenge.status === 'completed' ? 'bg-green-100' : 'bg-gray-50'
                                                }`}>
                                                {challenge.status === 'completed' ? (
                                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                                ) : (
                                                    getIcon(challenge.type)
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1">
                                                    {challenge.name}
                                                </h3>
                                                <p className="text-sm text-gray-500 line-clamp-2">
                                                    {challenge.description}
                                                </p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 font-medium">
                                                    <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded">
                                                        {challenge.type.toUpperCase()}
                                                    </span>
                                                    <span>
                                                        {formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end shrink-0">
                                            <span className="font-bold text-yellow-600 flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                                                +{challenge.rewardPoints} pts
                                            </span>
                                        </div>
                                    </div>

                                    {challenge.joined ? (
                                        <div className="mt-4">
                                            <div className="flex justify-between items-center text-sm mb-2">
                                                <span className={`${challenge.status === 'completed' ? 'text-green-600 font-bold' : 'text-gray-600'}`}>
                                                    {challenge.status === 'completed' ? 'Đã hoàn thành' : 'Tiến độ'}
                                                </span>
                                                <span className="text-gray-900 font-bold">
                                                    {challenge.progress}/{challenge.requirementValue}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${challenge.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                                                        }`}
                                                    style={{ width: `${challenge.progressPercentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-4 flex justify-end">
                                            <button
                                                onClick={() => handleJoinChallenge(challenge.challengeId)}
                                                disabled={joiningId === challenge.challengeId}
                                                className="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                                            >
                                                {joiningId === challenge.challengeId ? (
                                                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                                ) : (
                                                    <>Tham gia <ArrowRight className="w-4 h-4" /></>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trophy className="w-6 h-6 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Chưa có thử thách nào</h3>
                        <p className="text-gray-500">Hãy quay lại sau để nhận nhiệm vụ mới nhé!</p>
                    </div>
                )}
            </div>
        </SocialLayout>
    );
}
