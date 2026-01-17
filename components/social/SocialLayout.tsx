'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import SocialHeader from './Header';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import ChatWindow from './ChatWindow';
import MobileBottomNav from '@/components/MobileBottomNav';
import NotificationPanel from './NotificationPanel';
import MessageListPanel from './MessageListPanel';
import MobileMenu from './MobileMenu';
import { AnimatePresence } from 'framer-motion';

interface SocialLayoutProps {
    children: React.ReactNode;
    user: any;
}

export default function SocialLayout({ children, user }: SocialLayoutProps) {
    const router = useRouter();
    const [activeConversation, setActiveConversation] = useState<any>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showMessageList, setShowMessageList] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

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

            if (error) {
                console.error('Error getting conversation:', error);
                // Navigate to messages page anyway, create will happen there
                router.push(`/messages`);
                return;
            }

            // Navigate to messages page with conversation ID
            router.push(`/messages?conversationId=${conversationId}`);
        } catch (error) {
            console.error('Error opening chat:', error);
            router.push('/messages');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20 md:pb-0">
            <SocialHeader
                user={user}
                onSearch={handleSearch}
                onNotificationClick={() => setShowNotifications(!showNotifications)}
                onMessagesClick={() => setShowMessageList(!showMessageList)}
                onFriendSearchClick={() => router.push('/friends')}
            />

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
            <MobileBottomNav onMenuClick={() => setShowMobileMenu(true)} />

            {/* Mobile Menu */}
            <MobileMenu
                isOpen={showMobileMenu}
                onClose={() => setShowMobileMenu(false)}
                user={user}
            />

            {/* Notification Panel */}
            <AnimatePresence>
                {showNotifications && (
                    <NotificationPanel
                        userId={user.id}
                        onClose={() => setShowNotifications(false)}
                    />
                )}
            </AnimatePresence>

            {/* Message List Panel */}
            <AnimatePresence>
                {showMessageList && (
                    <MessageListPanel
                        currentUserId={user.id}
                        onClose={() => setShowMessageList(false)}
                        onChatSelect={(contact) => {
                            handleChatSelect(contact);
                            setShowMessageList(false);
                        }}
                    />
                )}
            </AnimatePresence>

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
