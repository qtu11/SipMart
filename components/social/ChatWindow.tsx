'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Image as ImageIcon, Smile, MoreHorizontal, Phone, Video, Reply, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { debounce } from 'lodash';

import { useRouter } from 'next/navigation';

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
    const router = useRouter();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
    const [messageReactions, setMessageReactions] = useState<Record<string, any[]>>({});
    const [replyTo, setReplyTo] = useState<any | null>(null);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch messages & Subscribe
    // Typing Logic
    const sendTypingStatus = useCallback(async (status: boolean) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) return;

            await fetch('/api/messaging/typing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ conversationId, isTyping: status })
            });
        } catch (e) {
            console.error('Typing status error', e);
        }
    }, [conversationId]);

    // Debounced stop typing
    const stopTypingDebounced = useMemo(() => debounce(() => {
        setIsTyping(false);
        sendTypingStatus(false);
    }, 2000), [sendTypingStatus]);

    const loadReactions = useCallback(async () => {
        const messageIds = messages.map(m => m.message_id);
        if (messageIds.length === 0) return;

        const { data } = await supabase
            .from('message_reactions')
            .select('*')
            .in('message_id', messageIds);

        if (data) {
            const grouped: Record<string, any[]> = {};
            data.forEach((reaction: any) => {
                if (!grouped[reaction.message_id]) grouped[reaction.message_id] = [];
                grouped[reaction.message_id].push(reaction);
            });
            setMessageReactions(grouped);
        }
    }, [messages]);

    // Ref to hold the latest loadReactions to avoid dependency cycle in subscription
    const loadReactionsRef = useRef(loadReactions);
    useEffect(() => { loadReactionsRef.current = loadReactions; }, [loadReactions]);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);

        if (!isTyping) {
            setIsTyping(true);
            sendTypingStatus(true);
        }
        stopTypingDebounced();
    };

    // Fetch messages & Subscribe
    useEffect(() => {
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true })
                .limit(50);

            if (data) setMessages(data);

            // Mark as read immediately on open
            await supabase.rpc('mark_conversation_as_read', {
                conv_id: conversationId,
                uid: currentUserId
            });
        };

        fetchMessages();

        // Channels
        const chatChannel = supabase.channel(`chat:${conversationId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
                (payload) => {
                    setMessages(prev => [...prev, payload.new]);
                    // If message is from other user, mark as read
                    if (payload.new.sender_id !== currentUserId) {
                        supabase.rpc('mark_conversation_as_read', { conv_id: conversationId, uid: currentUserId });
                    }
                })
            .subscribe();

        const reactionsChannel = supabase.channel(`reactions:${conversationId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' },
                () => loadReactionsRef.current())
            .subscribe();

        const typingChannel = supabase.channel(`typing:${conversationId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'typing_indicators', filter: `conversation_id=eq.${conversationId}` },
                async () => {
                    // Fetch current typing users
                    const { data } = await supabase
                        .from('typing_indicators')
                        .select('user_id')
                        .eq('conversation_id', conversationId);

                    if (data) {
                        const typers = data
                            .map((t: any) => t.user_id)
                            .filter((uid: string) => uid !== currentUserId);
                        setTypingUsers(typers);
                    }
                })
            .subscribe();

        return () => {
            supabase.removeChannel(chatChannel);
            supabase.removeChannel(reactionsChannel);
            supabase.removeChannel(typingChannel);
            // Stop typing if closing
            sendTypingStatus(false);
        };
    }, [conversationId, currentUserId, sendTypingStatus]);

    useEffect(() => { loadReactions(); }, [loadReactions]);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typingUsers, replyTo]);

    // Helpers
    const getReactionCounts = (messageId: string) => {
        const reactions = messageReactions[messageId] || [];
        const counts: Record<string, { count: number; userIds: string[] }> = {};
        reactions.forEach((r: any) => {
            if (!counts[r.emoji]) counts[r.emoji] = { count: 0, userIds: [] };
            counts[r.emoji].count++;
            counts[r.emoji].userIds.push(r.user_id);
        });
        return counts;
    };

    const hasUserReacted = (messageId: string, emoji: string) => {
        return getReactionCounts(messageId)[emoji]?.userIds.includes(currentUserId) || false;
    };

    const handleAddReaction = async (messageId: string, emoji: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) return;

            await fetch('/api/messaging/messages/react', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ messageId, emoji }),
            });
            setShowEmojiPicker(null);
            loadReactions();
        } catch (error) { toast.error('Lỗi reaction'); }
    };

    const handleRemoveReaction = async (messageId: string, emoji: string) => {
        try {
            await fetch(`/api/messaging/messages/react?messageId=${messageId}&emoji=${encodeURIComponent(emoji)}`, { method: 'DELETE' });
            loadReactions();
        } catch (error) { toast.error('Lỗi xóa reaction'); }
    };

    const handleSend = async () => {
        if (!newMessage.trim()) return;
        const tempMsg = newMessage;
        setNewMessage('');

        // Stop typing immediately
        stopTypingDebounced.cancel();
        setIsTyping(false);
        sendTypingStatus(false);

        const replyToId = replyTo ? replyTo.message_id : undefined;
        setReplyTo(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error('No auth token');

            // Using API to ensure everything is handled (including notification logic later)
            const res = await fetch('/api/messaging/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    conversationId,
                    content: tempMsg,
                    type: 'text',
                    replyTo: replyToId
                })
            });

            if (!res.ok) throw new Error('Send failed');

        } catch (error: any) {
            console.error('Error sending message:', error);
            toast.error(`Gửi thất bại: ${error.message}`);
            setNewMessage(tempMsg); // Restore
        }
    };

    // File Upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const uploadToast = toast.loading('Đang gửi ảnh...');
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error('No auth token');

            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/messaging/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            await fetch('/api/messaging/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    conversationId,
                    content: '[Hình ảnh]',
                    type: 'image',
                    mediaUrl: data.url,
                })
            });
            toast.success('Đã gửi ảnh');
        } catch (e) {
            toast.error('Gửi ảnh thất bại');
        } finally {
            toast.dismiss(uploadToast);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const getRepliedMessagePreview = (replyToId: string) => {
        const msg = messages.find(m => m.message_id === replyToId);
        if (!msg) return 'Tin nhắn đã ẩn';
        return msg.type === 'image' ? '[Hình ảnh]' : msg.content;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-0 md:bottom-0 left-0 md:left-auto md:right-4 lg:right-8 w-full md:w-96 bg-white md:rounded-t-2xl shadow-2xl border-t md:border border-gray-200 z-50 flex flex-col h-[100dvh] md:h-[600px] md:max-h-[85vh]"
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-2xl z-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Image
                            src={otherUser.avatar}
                            className="rounded-full border border-gray-200 object-cover"
                            alt={otherUser.name}
                            width={40}
                            height={40}
                            unoptimized={true}
                        />
                        {otherUser.status === 'online' && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800">{otherUser.name}</h4>
                        <span className="text-xs text-green-600 block flex items-center gap-1">
                            {typingUsers.includes(otherUser.id) ? (
                                <><Loader2 className="w-3 h-3 animate-spin" /> Đang soạn tin...</>
                            ) : (
                                otherUser.status === 'online' ? 'Đang hoạt động' : 'Ngoại tuyến'
                            )}
                        </span>
                    </div>
                </div>
                <div className="flex gap-1 text-gray-500">
                    <button
                        onClick={() => {
                            toast('Đang gọi audio...', { icon: '📞' });
                            // For now, redirect to call page but audio mode
                            router.push('/call');
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full"
                        title="Gọi thoại"
                    >
                        <Phone className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => {
                            toast('Đang gọi video...', { icon: '📹' });
                            router.push('/call');
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full"
                        title="Gọi video"
                    >
                        <Video className="w-5 h-5" />
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-red-50 rounded-full hover:text-red-500 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 scroll-smooth">
                {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUserId;
                    const reactionCounts = getReactionCounts(msg.message_id);
                    const hasReactions = Object.keys(reactionCounts).length > 0;
                    const isReplied = !!msg.reply_to;

                    return (
                        <div key={msg.message_id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group/msg relative`}>

                            {/* Reply Preview */}
                            {isReplied && (
                                <div className={`text-xs text-gray-400 mb-1 flex items-center gap-1 ${isMe ? 'mr-2' : 'ml-2'}`}>
                                    <Reply className="w-3 h-3" />
                                    <span className="italic line-clamp-1 max-w-[200px] bg-gray-100 px-2 py-0.5 rounded-md">
                                        {getRepliedMessagePreview(msg.reply_to)}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-end gap-2 max-w-[85%]">
                                {!isMe && (
                                    <Image
                                        src={otherUser.avatar}
                                        className="rounded-full mb-1 flex-shrink-0"
                                        alt="avatar"
                                        width={24}
                                        height={24}
                                        unoptimized={true}
                                    />
                                )}

                                <div className="relative group">
                                    <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm relative ${isMe
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                                        }`}>

                                        {msg.type === 'image' && msg.media_url ? (
                                            <div className="overflow-hidden rounded-xl mb-1">
                                                <Image
                                                    src={msg.media_url}
                                                    alt="Shared"
                                                    width={500}
                                                    height={300}
                                                    className="w-full h-auto max-h-60 object-cover"
                                                />
                                            </div>
                                        ) : null}

                                        {msg.content !== '[Hình ảnh]' && <div>{msg.content}</div>}
                                    </div>

                                    {/* Action Buttons (Hover) */}
                                    <div className={`absolute top-0 ${isMe ? '-left-14' : '-right-14'} opacity-0 group-hover/msg:opacity-100 transition-opacity flex gap-1 items-center bg-white border border-gray-100 rounded-full shadow-sm p-1`}>
                                        <button
                                            onClick={() => setReplyTo(msg)}
                                            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500"
                                            title="Trả lời"
                                        >
                                            <Reply className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setShowEmojiPicker(showEmojiPicker === msg.message_id ? null : msg.message_id)}
                                            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 relative"
                                            title="Thả cảm xúc"
                                        >
                                            <Smile className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Emoji Picker Popover */}
                                    {showEmojiPicker === msg.message_id && (
                                        <div className="absolute -top-12 left-0 bg-white border border-gray-200 rounded-full shadow-xl p-1 flex gap-1 z-20 animate-in zoom-in duration-200">
                                            {['❤️', '👍', '😂', '😮', '😢', '🔥'].map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => handleAddReaction(msg.message_id, emoji)}
                                                    className="w-8 h-8 hover:bg-gray-100 rounded-full flex items-center justify-center transition text-lg"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                            <button onClick={() => setShowEmojiPicker(null)} className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"><X className="w-3 h-3" /></button>
                                        </div>
                                    )}

                                    {/* Reactions Display */}
                                    {hasReactions && (
                                        <div className={`absolute -bottom-3 ${isMe ? 'right-0' : 'left-0'} flex gap-1`}>
                                            {Object.entries(reactionCounts).map(([emoji, data]) => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => hasUserReacted(msg.message_id, emoji) ? handleRemoveReaction(msg.message_id, emoji) : handleAddReaction(msg.message_id, emoji)}
                                                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] shadow-sm border ${hasUserReacted(msg.message_id, emoji)
                                                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                                                        : 'bg-white border-gray-200 text-gray-600'
                                                        }`}
                                                >
                                                    <span>{emoji}</span>
                                                    <span className="font-bold">{data.count}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {typingUsers.includes(otherUser.id) && (
                    <div className="flex items-center gap-2">
                        <Image
                            src={otherUser.avatar}
                            className="rounded-full"
                            alt="avt"
                            width={24}
                            height={24}
                        />
                        <div className="bg-gray-100 rounded-full px-3 py-2 flex gap-1">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Reply Context Bar */}
            <AnimatePresence>
                {replyTo && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs"
                    >
                        <div className="flex items-center gap-2 text-gray-600 overflow-hidden">
                            <Reply className="w-4 h-4 text-blue-500" />
                            <div className="flex flex-col">
                                <span className="font-bold text-blue-600">Đang trả lời {replyTo.sender_id === currentUserId ? 'chính mình' : otherUser.name}</span>
                                <span className="truncate max-w-[200px]">{replyTo.content === '[Hình ảnh]' ? '📷 Hình ảnh' : replyTo.content}</span>
                            </div>
                        </div>
                        <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-gray-200 rounded-full"><X className="w-4 h-4" /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Footer */}
            <div className="p-3 border-t border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-full transition"><ImageIcon className="w-5 h-5" /></button>

                    <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 flex items-center gap-2 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                        <input
                            ref={inputRef}
                            type="text"
                            className="w-full bg-transparent border-none outline-none text-sm placeholder:text-gray-400"
                            placeholder="Nhập tin nhắn..."
                            value={newMessage}
                            onChange={handleInput}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button className="text-gray-400 hover:text-yellow-500"><Smile className="w-5 h-5" /></button>
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={!newMessage.trim()}
                        className="p-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl shadow-lg hover:shadow-blue-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
