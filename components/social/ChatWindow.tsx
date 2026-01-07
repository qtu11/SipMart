'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Image as ImageIcon, Smile, MoreHorizontal, Phone, Video } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

interface ChatWindowProps {
    conversationId: string;
    onClose: () => void;
    currentUserId: string;
    otherUser: {
        id: string;
        name: string;
        avatar: string;
        status: string;
    };
}

export default function ChatWindow({ conversationId, onClose, currentUserId, otherUser }: ChatWindowProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch initial messages
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true })
                .limit(50);

            if (data) setMessages(data);
        };

        fetchMessages();

        // Subscribe to new messages
        const channel = supabase
            .channel(`chat:${conversationId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`
            }, (payload) => {
                setMessages(prev => [...prev, payload.new]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const [showEmoji, setShowEmoji] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleEmojiClick = () => {
        // Simple mock for emoji picker or implementation
        setShowEmoji(!showEmoji);
        // In real app, render an EmojiPicker component here
        toast('Tính năng Emoji đang cập nhật', { icon: '😎' });
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // TODO: Implement actual storage upload
        // For now, simple error toast or mock implementation
        toast.error('Chức năng gửi ảnh đang bảo trì (chưa cấu hình Storage)');
    };

    const handleCall = () => {
        toast('Tính năng gọi điện đang phát triển! 📞', { icon: '🚧' });
    };

    const handleVideoCall = () => {
        toast('Tính năng gọi video đang phát triển! 📹', { icon: '🚧' });
    };

    const handleSend = async () => {
        if (!newMessage.trim()) return;

        try {
            const { error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: currentUserId,
                    content: newMessage,
                    type: 'text'
                });

            if (error) throw error;
            setNewMessage('');
        } catch (error: any) {
            console.error('Error sending message:', error);
            toast.error(`Gửi thất bại: ${error.message || error.details}`);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-0 right-80 w-80 bg-white rounded-t-2xl shadow-xl border border-gray-200 z-50 flex flex-col h-[450px]"
        >
            {/* Header */}
            <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-2xl shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <img src={otherUser.avatar} className="w-8 h-8 rounded-full border border-gray-200" alt={otherUser.name} />
                        {otherUser.status === 'online' && (
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-gray-800">{otherUser.name}</h4>
                        <span className="text-xs text-green-500 block">{otherUser.status === 'online' ? 'Đang hoạt động' : 'Ngoại tuyến'}</span>
                    </div>
                </div>
                <div className="flex gap-2 text-green-600">
                    <button onClick={handleCall} className="p-1 hover:bg-gray-100 rounded-full"><Phone className="w-4 h-4" /></button>
                    <button onClick={handleVideoCall} className="p-1 hover:bg-gray-100 rounded-full"><Video className="w-4 h-4" /></button>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50/50">
                {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUserId;
                    return (
                        <div key={msg.message_id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {!isMe && <img src={otherUser.avatar} className="w-6 h-6 rounded-full self-end mr-2 mb-1" />}
                            <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${isMe
                                ? 'bg-green-500 text-white rounded-br-none'
                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                                }`}>
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-3 border-t border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                    <button onClick={handleImageClick} className="text-gray-400 hover:text-green-600 transition-colors"><ImageIcon className="w-5 h-5" /></button>
                    <button onClick={handleEmojiClick} className="text-gray-400 hover:text-yellow-500 transition-colors"><Smile className="w-5 h-5" /></button>
                    <div className="flex-1 bg-gray-100 rounded-full px-3 py-1.5 flex items-center">
                        <input
                            type="text"
                            className="w-full bg-transparent border-none outline-none text-sm"
                            placeholder="Nhập tin nhắn..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={!newMessage.trim()}
                        className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
