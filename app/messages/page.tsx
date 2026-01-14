'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ArrowLeft, MessageSquare, Search, AlertCircle } from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase/auth';
import ChatWindow from '@/components/social/ChatWindow';

// Types
interface OtherUser {
    id: string;
    displayName: string;
    email?: string;
    avatar?: string;
}

interface LastMessage {
    content: string;
    created_at: string;
}

interface Conversation {
    conversation_id: string;
    otherUser: OtherUser;
    lastMessage?: LastMessage;
    unreadCount?: number;
}

function MessagesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const conversationIdParam = searchParams?.get('conversationId');

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobile, setIsMobile] = useState(false);

    // Handle responsive design
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Load conversations
    const loadConversations = useCallback(async (userId: string) => {
        try {
            setError(null);
            const res = await fetch('/api/messaging/conversations');

            if (!res.ok) {
                throw new Error('Không thể tải tin nhắn');
            }

            const data = await res.json();

            if (data.success) {
                setConversations(data.conversations);

                // Auto-select conversation from URL
                if (conversationIdParam) {
                    const conv = data.conversations.find(
                        (c: Conversation) => c.conversation_id === conversationIdParam
                    );
                    if (conv) {
                        setSelectedConversation(conv);
                    }
                }
            } else {
                throw new Error(data.error || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
            setError(error instanceof Error ? error.message : 'Không thể tải tin nhắn');
        } finally {
            setLoading(false);
        }
    }, [conversationIdParam]);

    // Initialize
    useEffect(() => {
        const init = async () => {
            try {
                const user = await getCurrentUser();
                if (!user) {
                    router.push('/auth/login');
                    return;
                }

                const uid = (user as any).id || (user as any).user_id;
                setCurrentUserId(uid);
                await loadConversations(uid);
            } catch (error) {
                console.error('Initialization error:', error);
                setError('Không thể khởi tạo trang');
                setLoading(false);
            }
        };

        init();
    }, [router, loadConversations]);

    // Filter conversations
    const filteredConversations = useMemo(() => {
        if (!searchQuery) return conversations;

        return conversations.filter((conv) => {
            const otherUserName = conv.otherUser?.displayName || conv.otherUser?.email || '';
            return otherUserName.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [conversations, searchQuery]);

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <div className="text-primary-600">Đang tải...</div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-soft p-8 max-w-md w-full text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-dark-900 mb-2">Có lỗi xảy ra</h2>
                    <p className="text-dark-600 mb-6">{error}</p>
                    <button
                        onClick={() => {
                            setError(null);
                            setLoading(true);
                            if (currentUserId) loadConversations(currentUserId);
                        }}
                        className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    // Mobile: Show chat full screen
    if (selectedConversation && isMobile) {
        return (
            <div className="min-h-screen bg-white">
                <ChatWindow
                    conversationId={selectedConversation.conversation_id}
                    onClose={() => setSelectedConversation(null)}
                    currentUserId={currentUserId!}
                    otherUser={{
                        id: selectedConversation.otherUser?.id || '',
                        name: selectedConversation.otherUser?.displayName || selectedConversation.otherUser?.email || 'User',
                        avatar: selectedConversation.otherUser?.avatar || '',
                        status: 'online',
                    }}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md shadow-soft sticky top-0 z-40 border-b border-primary-100">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
                        aria-label="Quay lại"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-medium hidden sm:inline">Quay lại</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <MessageSquare className="w-6 h-6 text-primary-600" />
                        <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                            Tin nhắn
                        </h1>
                    </div>
                    <div className="w-16" /> {/* Spacer for centering */}
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-8">
                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm cuộc trò chuyện..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
                            aria-label="Tìm kiếm cuộc trò chuyện"
                        />
                    </div>
                </div>

                {/* Conversations List */}
                <div className="space-y-3">
                    {filteredConversations.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-soft p-12 text-center">
                            <MessageSquare className="w-16 h-16 text-dark-300 mx-auto mb-4" />
                            <p className="text-dark-600 mb-2">
                                {searchQuery ? 'Không tìm thấy cuộc trò chuyện' : 'Chưa có cuộc trò chuyện nào'}
                            </p>
                            <p className="text-sm text-dark-500">
                                {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Kết bạn và bắt đầu nhắn tin với họ!'}
                            </p>
                        </div>
                    ) : (
                        filteredConversations.map((conv) => {
                            const otherUser = conv.otherUser || {
                                id: '',
                                displayName: 'Unknown User',
                                avatar: '',
                            };
                            const lastMessage = conv.lastMessage;
                            const unreadCount = conv.unreadCount || 0;

                            return (
                                <motion.button
                                    key={conv.conversation_id}
                                    onClick={() => setSelectedConversation(conv)}
                                    className="w-full bg-white rounded-xl shadow-soft p-4 hover:shadow-lg transition-all flex items-center gap-4 text-left"
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    aria-label={`Mở cuộc trò chuyện với ${otherUser.displayName}`}
                                >
                                    {/* Avatar */}
                                    <div className="relative">
                                        <Image
                                            src={otherUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.displayName)}`}
                                            alt={otherUser.displayName}
                                            width={56}
                                            height={56}
                                            className="w-14 h-14 rounded-full object-cover"
                                        />
                                        {unreadCount > 0 && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline justify-between mb-1">
                                            <h3 className="font-semibold text-dark-900 truncate">
                                                {otherUser.displayName}
                                            </h3>
                                            {lastMessage && (
                                                <span className="text-xs text-dark-500 ml-2 flex-shrink-0">
                                                    {new Date(lastMessage.created_at).toLocaleDateString('vi-VN', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-sm truncate ${unreadCount > 0 ? 'font-semibold text-dark-900' : 'text-dark-600'}`}>
                                            {lastMessage?.content || 'Chưa có tin nhắn'}
                                        </p>
                                    </div>
                                </motion.button>
                            );
                        })
                    )}
                </div>
            </main>

            {/* Desktop: Show chat in modal */}
            <AnimatePresence>
                {selectedConversation && !isMobile && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
                        onClick={() => setSelectedConversation(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ChatWindow
                                conversationId={selectedConversation.conversation_id}
                                onClose={() => setSelectedConversation(null)}
                                currentUserId={currentUserId!}
                                otherUser={{
                                    id: selectedConversation.otherUser?.id || '',
                                    name: selectedConversation.otherUser?.displayName || selectedConversation.otherUser?.email || 'User',
                                    avatar: selectedConversation.otherUser?.avatar || '',
                                    status: 'online',
                                }}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <div className="text-primary-600">Đang tải...</div>
                </div>
            </div>
        }>
            <MessagesContent />
        </Suspense>
    );
}