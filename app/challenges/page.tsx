'use client';

import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import Link from 'next/link';
import { getCurrentUser, onAuthChange } from '@/lib/supabase/auth';
import { useRouter } from 'next/navigation';
import SocialLayout from '@/components/social/SocialLayout';

export default function ChallengesPage() {
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const currentUser = await getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
            } else {
                const unsubscribe = onAuthChange((user) => {
                    if (user) {
                        setUser(user);
                    } else {
                        router.push('/auth/login');
                    }
                });
                return () => unsubscribe();
            }
        };
        checkUser();
    }, [router]);

    if (!user) return null;

    return (
        <SocialLayout user={user}>
            <div className="flex flex-col items-center justify-center h-[50vh]">
                <div className="bg-white rounded-2xl p-8 shadow-sm text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trophy className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Thử thách</h1>
                    <p className="text-gray-500 mb-6">Tham gia thử thách để nhận Green Points! Sắp ra mắt.</p>
                </div>
            </div>
        </SocialLayout>
    );
}
