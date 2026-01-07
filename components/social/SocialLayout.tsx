'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import SocialHeader from './Header';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import ChatWindow from './ChatWindow';
import MobileBottomNav from './MobileBottomNav';

interface SocialLayoutProps {
    children: React.ReactNode;
    user: any;
}

export default function SocialLayout({ children, user }: SocialLayoutProps) {
    const [activeConversation, setActiveConversation] = useState<any>(null);

    const handleSearch = (query: string) => {
        console.log("Searching for:", query);
        // Implement search page or modal
    };

    const handleChatSelect = async (contact: any) => {
        try {
            // Call RPC to get or create conversation
            const { data: conversationId, error } = await createClient().rpc('get_or_create_conversation', {
                target_user_id: contact.id
            });

            if (error) throw error;

            setActiveConversation({
                id: conversationId,
                otherUser: {
                    id: contact.id,
                    name: contact.name,
                    avatar: contact.avatar,
                    status: contact.status
                }
            });
        } catch (error) {
            console.error('Error opening chat:', error);
            // Fallback for UI demo if RPC fails (though it shouldn't with correct schema)
            // toast.error('Không thể mở cuộc trò chuyện');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20 md:pb-0">
            <SocialHeader user={user} onSearch={handleSearch} />

            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Left Column - Fixed on Desktop */}
                    <div className="hidden md:block md:col-span-3 lg:col-span-3 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar">
                        <LeftSidebar user={user} />
                    </div>

                    {/* Center Column - Feed Scrollable */}
                    <div className="col-span-1 md:col-span-9 lg:col-span-6 space-y-6">
                        {children}
                    </div>

                    {/* Right Column - Fixed on Desktop */}
                    <div className="hidden lg:block lg:col-span-3 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar">
                        <RightSidebar onChatSelect={handleChatSelect} />
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />

            {/* Chat Window Popup */}
            {activeConversation && (
                <ChatWindow
                    conversationId={activeConversation.id}
                    currentUserId={user.id}
                    otherUser={activeConversation.otherUser}
                    onClose={() => setActiveConversation(null)}
                />
            )}
        </div>
    );
}
