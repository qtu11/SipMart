'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface MessageListPanelProps {
    currentUserId: string;
    onClose: () => void;
    onChatSelect: (contact: any) => void;
}

export default function MessageListPanel({ currentUserId, onClose, onChatSelect }: MessageListPanelProps) {
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchConversations();

        // Realtime subscription for new messages
        const channel = supabase
            .channel('conversations')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
                fetchConversations();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUserId]);

    const fetchConversations = async () => {
        try {
            // This is simplified - in production you'd have a proper conversation list RPC
            const { data: users, error } = await supabase
                .from('users')
                .select('id, display_name, avatar, email')
                .neq('id', currentUserId)
                .limit(20);

            if (error) throw error;

            const formattedContacts = (users || []).map((u: any) => ({
                id: u.id,
                name: u.display_name || u.email,
                avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.display_name || u.email)}&background=random`,
                status: 'offline', // In production, fetch from presence table
                lastMessage: '', // In production, fetch last message
                unread: 0, // In production, fetch unread count
            }));

            setConversations(formattedContacts);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredConversations = conversations.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleContactClick = (contact: any) => {
        onChatSelect(contact);
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 md:absolute md:inset-auto md:top-16 md:right-4 lg:right-8 w-full md:w-96 bg-white md:rounded-2xl shadow-2xl border-t md:border border-gray-200 z-50 max-h-screen md:max-h-[600px] flex flex-col"
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    Tin nhắn
                </h3>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-gray-100">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Tìm kiếm cuộc trò chuyện..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-100 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Đang tải...</div>
                ) : filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>Chưa có cuộc trò chuyện nào</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredConversations.map((contact) => (
                            <motion.div
                                key={contact.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => handleContactClick(contact)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-shrink-0">
                                        <Image
                                            src={contact.avatar}
                                            alt={contact.name}
                                            width={48}
                                            height={48}
                                            className="rounded-full object-cover border border-gray-200"
                                            unoptimized={true}
                                        />
                                        {contact.status === 'online' && (
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                        )}
                                        {contact.unread > 0 && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                                <span className="text-[10px] text-white font-bold">
                                                    {contact.unread > 9 ? '9+' : contact.unread}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-gray-900 text-sm truncate">
                                                {contact.name}
                                            </h4>
                                            <span className="text-xs text-gray-400">
                                                {/* Time placeholder */}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate mt-0.5">
                                            {contact.lastMessage || 'Bắt đầu cuộc trò chuyện...'}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
