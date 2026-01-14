'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Ticket, ArrowRight, Share2 } from 'lucide-react';
import { getCurrentUser, onAuthChange } from '@/lib/supabase/auth';
import { useRouter } from 'next/navigation';
import SocialLayout from '@/components/social/SocialLayout';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Event {
    challengeId: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    joined: boolean;
    type: string;
}

export default function EventsPage() {
    const [user, setUser] = useState<any>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const currentUser = await getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                fetchEvents();
            } else {
                const unsubscribe = onAuthChange((user) => {
                    if (user) {
                        setUser(user);
                        fetchEvents();
                    } else {
                        router.push('/auth/login');
                    }
                });
                return () => unsubscribe();
            }
        };
        checkUser();
    }, [router]);

    const fetchEvents = async () => {
        try {
            const res = await fetch('/api/challenges');
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    // Filter for events
                    const eventList = data.challenges.filter((c: any) => c.type === 'event' || c.type === 'special');
                    setEvents(eventList);
                }
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            toast.error('Không thể tải sự kiện');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (eventId: string) => {
        try {
            const res = await fetch('/api/challenges', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ challengeId: eventId }),
            });

            if (res.ok) {
                toast.success('Đăng ký sự kiện thành công!');
                setEvents(prev => prev.map(e => e.challengeId === eventId ? { ...e, joined: true } : e));
            } else {
                toast.error('Không thể đăng ký lúc này');
            }
        } catch (error) {
            toast.error('Lỗi kết nối');
        }
    };

    if (!user) return null;

    return (
        <SocialLayout user={user}>
            <div className="max-w-4xl mx-auto pb-20">
                <div className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                    <div className="relative z-10">
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                            <Calendar className="w-8 h-8" />
                            Sự Kiện Nổi Bật
                        </h1>
                        <p className="text-blue-100 max-w-lg">Tham gia các sự kiện cộng đồng để kết nối, chia sẻ và lan tỏa lối sống xanh.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2].map(i => (
                            <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : events.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                        {events.map((event) => (
                            <div key={event.challengeId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition">
                                <div className="md:w-1/3 bg-gray-200 relative h-48 md:h-auto">
                                    {/* Placeholder Image */}
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-100">
                                        <Calendar className="w-12 h-12 opacity-20" />
                                    </div>
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold shadow-sm">
                                        {new Date(event.startDate).toLocaleDateString('vi-VN')}
                                    </div>
                                </div>
                                <div className="p-6 md:w-2/3 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                                {event.type.toUpperCase()}
                                            </span>
                                            <button className="text-gray-400 hover:text-gray-600">
                                                <Share2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">{event.name}</h3>
                                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{event.description}</p>

                                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" /> Hall A
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users className="w-4 h-4" /> 120+ tham gia
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-auto">
                                        {event.joined ? (
                                            <div className="text-green-600 font-bold flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl">
                                                <Ticket className="w-5 h-5" />
                                                Đã Đăng Ký
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleRegister(event.challengeId)}
                                                className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-gray-200"
                                            >
                                                Đăng Ký Ngay <ArrowRight className="w-4 h-4" />
                                            </button>
                                        )}
                                        <Link href={`/challenges`} className="text-sm font-semibold text-gray-600 hover:text-gray-900">
                                            Chi tiết
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-800">Không có sự kiện nào</h3>
                        <p className="text-gray-500">Hiện tại chưa có sự kiện nào đang diễn ra.</p>
                    </div>
                )}
            </div>
        </SocialLayout>
    );
}
