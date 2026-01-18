'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Send, MoreHorizontal, Eye, Heart, MessageCircle } from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';
import { supabase } from '@/lib/supabase';
import { getOrCreateConversation, sendMessage } from '@/lib/supabase/chat';
import { toast } from 'react-hot-toast';

interface StoryViewerProps {
    stories: any[];
    initialStoryIndex: number;
    onClose: () => void;
    currentUserId: string;
}

export default function StoryViewer({ stories, initialStoryIndex, onClose, currentUserId }: StoryViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [comment, setComment] = useState('');
    const [reactions, setReactions] = useState<any[]>([]);

    // Real Data State
    const [viewCount, setViewCount] = useState(0);
    const [viewers, setViewers] = useState<any[]>([]);
    const [showViewersList, setShowViewersList] = useState(false);

    // Derived state
    const currentStory = stories[currentIndex];
    const isOwner = currentStory?.user_id === currentUserId;

    // Timer ref
    const progressInterval = useRef<NodeJS.Timeout | null>(null);
    const DURATION = 5000; // 5 seconds per story

    // Navigation
    const nextStory = useCallback(() => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setProgress(0);
        } else {
            onClose(); // End of all stories
        }
    }, [currentIndex, stories.length, onClose]);

    const prevStory = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setProgress(0);
        }
    }, [currentIndex]);

    const selectStory = (index: number) => {
        setCurrentIndex(index);
        setProgress(0);
        setShowViewersList(false);
    };

    // Auto-advance logic
    useEffect(() => {
        if (isPaused || comment || showViewersList) return;

        progressInterval.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    nextStory();
                    return 0;
                }
                return prev + (100 / (DURATION / 50));
            });
        }, 50);

        return () => {
            if (progressInterval.current) clearInterval(progressInterval.current);
        };
    }, [currentIndex, isPaused, comment, nextStory, showViewersList]);

    // Mark as viewed & Fetch Views
    useEffect(() => {
        const handleView = async () => {
            if (!currentStory) return;

            // 1. Mark Viewed
            if (!isOwner) {
                await supabase.from('story_views').insert({
                    story_id: currentStory.story_id,
                    user_id: currentUserId
                }).then(({ error }) => {
                    if (error && error.code !== '23505') console.error(error);
                });
            }

            // 2. Fetch View Count
            const { count } = await supabase
                .from('story_views')
                .select('*', { count: 'exact', head: true })
                .eq('story_id', currentStory.story_id);

            setViewCount(count || 0);

            // 3. Fetch Viewers List (only if owner)
            if (isOwner) {
                const { data } = await supabase
                    .from('story_views')
                    .select('*, user:users(display_name, avatar)')
                    .eq('story_id', currentStory.story_id)
                    .order('viewed_at', { ascending: false });

                if (data) setViewers(data.map((v: any) => v.user));
            }
        };
        handleView();
    }, [currentStory, currentUserId, isOwner]);

    const handleReaction = async (emoji: string) => {
        const id = Date.now();
        setReactions(prev => [...prev, { id, emoji, x: Math.random() * 80 + 10 }]);
        setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 2000);

        await supabase.from('story_reactions').insert({
            story_id: currentStory.story_id,
            user_id: currentUserId,
            type: 'like'
        });

        if (!isOwner) {
            const convoId = await getOrCreateConversation(currentUserId, currentStory.user_id);
            if (convoId) {
                await sendMessage(convoId, currentUserId, `Đã bày tỏ cảm xúc ${emoji} về tin của bạn.`, 'text', { story_id: currentStory.story_id });
            }
        }
    };

    const handleSendComment = async () => {
        if (!comment.trim()) return;
        const content = comment;
        setComment('');
        setIsPaused(false);

        try {
            await supabase.from('story_comments').insert({
                story_id: currentStory.story_id,
                user_id: currentUserId,
                content
            });

            if (!isOwner) {
                const convoId = await getOrCreateConversation(currentUserId, currentStory.user_id);
                if (convoId) {
                    await sendMessage(convoId, currentUserId, `Phản hồi tin của bạn: ${content}`, 'text', { story_id: currentStory.story_id });
                }
                toast.success('Đã gửi tin nhắn');
            }
        } catch (error) {
            toast.error('Gửi thất bại');
        }
    };

    if (!currentStory) return null;

    const reactionEmojis = ['❤️', '😂', '😮', '😢', '😡', '🔥'];

    return (
        <div className="fixed inset-0 z-[60] bg-black flex overflow-hidden">

            {/* LEFT SIDEBAR (Desktop) */}
            <div className="hidden md:flex w-[360px] h-full bg-[#242526] flex-col border-r border-[#2f3031] z-20">
                <div className="p-4 border-b border-[#2f3031]">
                    <h2 className="text-xl font-bold text-white">Tin</h2>
                    <div className="flex gap-2 mt-4 text-sm font-semibold">
                        <span onClick={() => toast('Đã mở Kho lưu trữ tin')} className="text-blue-500 cursor-pointer hover:underline">Kho lưu trữ tin</span>
                        <span className="text-white">·</span>
                        <span onClick={() => toast('Đã mở Cài đặt tin')} className="text-blue-500 cursor-pointer hover:underline">Cài đặt</span>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-lg font-bold text-white">Tin của bạn</h3>
                        <div className="flex items-center gap-3 mt-2 p-2 rounded-lg hover:bg-[#323436] cursor-pointer" onClick={() => toast('Tính năng tạo tin đã sẵn sàng ở trang chủ')}>
                            <div className="w-12 h-12 bg-[#3a3b3c] rounded-full flex items-center justify-center text-blue-500 text-2xl font-bold font-plus-jakarta">+</div>
                            <div>
                                <p className="text-white font-semibold">Tạo tin</p>
                                <p className="text-[#b0b3b8] text-xs">Bạn có thể chia sẻ ảnh hoặc viết gì đó.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    <h3 className="text-lg font-bold text-white px-2 mt-2 mb-2">Tất cả tin</h3>
                    {stories.map((story, index) => (
                        <div
                            key={story.story_id}
                            onClick={() => selectStory(index)}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${index === currentIndex ? 'bg-[#2d88ff]/10' : 'hover:bg-[#323436]'}`}
                        >
                            <div className={`rounded-full p-[2px] ${index === currentIndex ? 'bg-blue-500' : 'bg-gray-600'}`}>
                                <UserAvatar user={null} src={story.avatar} name={story.display_name} className="w-10 h-10 border-2 border-[#242526]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`font-semibold truncate ${index === currentIndex ? 'text-blue-500' : 'text-white'}`}>
                                    {story.display_name}
                                </p>
                                <p className="text-[#b0b3b8] text-xs">
                                    {new Date(story.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 relative flex items-center justify-center bg-black">
                {/* Background Ambient Blur */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src={currentStory.content || currentStory.thumbnail}
                        alt="Background"
                        fill
                        className="object-cover opacity-30 blur-3xl scale-125"
                        unoptimized
                    />
                    <div className="absolute inset-0 bg-black/60" />
                </div>

                {/* Desktop Close Button */}
                <div className="absolute top-4 right-4 z-50 flex gap-4">
                    <button className="w-10 h-10 bg-[#3a3b3c] hover:bg-[#4e4f50] rounded-full flex items-center justify-center text-white transition-colors" onClick={onClose}>
                        <X className="w-6 h-6" />
                    </button>
                    <UserAvatar
                        src={currentUserId ? '' : ''} // This is just top right user avatar
                        name="User"
                        className="w-10 h-10 md:block hidden"
                    />
                </div>

                {/* Story Card Container */}
                <div className="relative w-full h-full md:w-[350px] md:h-[650px] lg:w-[400px] lg:h-[85vh] bg-black md:rounded-xl overflow-hidden shadow-2xl flex flex-col z-10">

                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 right-0 z-20 pt-4 px-2 flex gap-1 safe-area-top">
                        {stories.map((s, idx) => (
                            <div key={s.story_id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-white"
                                    initial={{ width: idx < currentIndex ? '100%' : '0%' }}
                                    animate={{ width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%' }}
                                    transition={{ ease: 'linear', duration: 0 }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Story Header */}
                    <div className="absolute top-8 left-0 right-0 z-20 px-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <UserAvatar
                                src={currentStory.avatar}
                                name={currentStory.display_name}
                                className="w-10 h-10 border border-white/20"
                            />
                            <div>
                                <p className="text-white font-semibold text-sm hover:underline cursor-pointer">{currentStory.display_name}</p>
                                <p className="text-white/70 text-xs">
                                    {new Date(currentStory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                        <button className="text-white hover:bg-white/10 p-2 rounded-full">
                            <MoreHorizontal className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Image Content */}
                    <div className="flex-1 relative bg-[#18191a] flex items-center justify-center overflow-hidden">
                        <Image
                            src={currentStory.content || currentStory.thumbnail}
                            alt="Story"
                            fill
                            className="object-contain" // Maintain aspect ratio to verify logo issue
                            unoptimized
                        />

                        {/* Mobile Nav Taps */}
                        <div className="absolute inset-y-0 left-0 w-1/4 z-10 md:hidden" onClick={prevStory} />
                        <div className="absolute inset-y-0 right-0 w-1/4 z-10 md:hidden" onClick={nextStory} />

                        {/* Floating Reactions */}
                        <AnimatePresence>
                            {reactions.map(r => (
                                <motion.div
                                    key={r.id}
                                    initial={{ opacity: 1, y: 0, scale: 0.5 }}
                                    animate={{ opacity: 0, y: -300, scale: 2 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute bottom-20 text-5xl pointer-events-none z-30"
                                    style={{ left: `${r.x}%` }}
                                >
                                    {r.emoji}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Footer / Interactions */}
                    <div className="p-3 bg-black z-20">
                        {isOwner ? (
                            <div
                                className="flex items-center gap-2 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition"
                                onClick={() => setShowViewersList(true)}
                            >
                                <Eye className="w-5 h-5 text-white" />
                                <span className="text-white font-semibold text-sm">{viewCount} người xem</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        placeholder="Trả lời..."
                                        className="w-full bg-[#3a3b3c] text-white rounded-full px-4 py-2.5 border border-[#3a3b3c] focus:border-white/20 focus:outline-none placeholder-[#b0b3b8] text-sm"
                                        value={comment}
                                        onChange={e => setComment(e.target.value)}
                                        onFocus={() => setIsPaused(true)}
                                        onBlur={() => setIsPaused(false)}
                                        onKeyDown={e => e.key === 'Enter' && handleSendComment()}
                                    />
                                    {comment && (
                                        <button onClick={handleSendComment} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-500 hover:bg-white/10 p-1 rounded-full"><Send className="w-4 h-4" /></button>
                                    )}
                                </div>
                                {!comment && reactionEmojis.map(emoji => (
                                    <button key={emoji} onClick={() => handleReaction(emoji)} className="text-2xl hover:scale-125 transition active:scale-95">
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Previous/Next Buttons (Desktop) */}
                    <button
                        onClick={prevStory}
                        className="hidden md:flex absolute top-1/2 -left-16 -translate-y-1/2 w-12 h-12 bg-[#3a3b3c] hover:bg-white rounded-full items-center justify-center text-white hover:text-black transition-all z-50 shadow-lg disabled:opacity-50"
                        disabled={currentIndex === 0}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={nextStory}
                        className="hidden md:flex absolute top-1/2 -right-16 -translate-y-1/2 w-12 h-12 bg-[#3a3b3c] hover:bg-white rounded-full items-center justify-center text-white hover:text-black transition-all z-50 shadow-lg"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* VIEWERS LIST BOTTOM SHEET (Mobile/Desktop Overlay) */}
            <AnimatePresence>
                {showViewersList && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 500 }}
                        className="absolute bottom-0 left-0 right-0 md:top-0 md:left-auto md:right-0 md:w-[400px] h-2/3 md:h-full z-[70] bg-[#242526] rounded-t-2xl md:rounded-none shadow-2xl border-l border-[#2f3031] flex flex-col"
                    >
                        <div className="p-4 border-b border-[#2f3031] flex justify-between items-center bg-[#242526]">
                            <h3 className="text-white font-bold text-lg">Người đã xem ({viewCount})</h3>
                            <button onClick={() => setShowViewersList(false)} className="p-2 hover:bg-[#3a3b3c] rounded-full text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {viewers.length === 0 ? (
                                <p className="text-[#b0b3b8] text-center mt-10">Chưa có ai xem tin này.</p>
                            ) : (
                                viewers.map((v: any, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 hover:bg-[#3a3b3c] rounded-lg cursor-pointer transition">
                                        <UserAvatar src={v.avatar} name={v.display_name} className="w-10 h-10" />
                                        <p className="text-white font-semibold">{v.display_name}</p>
                                    </div>
                                ))
                            )}
                            <div className="h-10" /> {/* Spacer */}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
