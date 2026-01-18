'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { X, Type, Music, Sticker, Download, Send, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

interface StoryEditorProps {
    initialFile?: File;
    onClose: () => void;
    onPosted: () => void;
    currentUserId: string;
    userName: string;
    userAvatar: string;
}

export default function StoryEditor({ initialFile, onClose, onPosted, currentUserId, userName, userAvatar }: StoryEditorProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(initialFile || null);
    const [text, setText] = useState('');
    const [showTextInput, setShowTextInput] = useState(false);
    const [textColor, setTextColor] = useState('#ffffff');
    const [isUploading, setIsUploading] = useState(false);

    // Filter state (simple CSS filters)
    const [filter, setFilter] = useState('');
    const filters = [
        { name: 'Normal', value: '' },
        { name: 'Warm', value: 'sepia(30%) contrast(110%)' },
        { name: 'Cool', value: 'hue-rotate(30deg) contrast(110%)' },
        { name: 'Mono', value: 'grayscale(100%) contrast(120%)' },
        { name: 'Vintage', value: 'sepia(50%) hue-rotate(-30deg) saturate(140%)' },
    ];

    useEffect(() => {
        if (initialFile) {
            handleFileProcess(initialFile);
        }
    }, [initialFile]);

    const handleFileProcess = (f: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(f);
        setFile(f);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            handleFileProcess(e.target.files[0]);
        }
    };

    const handlePost = async () => {
        if (!file || !preview) return;

        try {
            setIsUploading(true);

            // In a real app, you'd upload the file to Storage first then get URL.
            // For this quick implementation/MVP (as per existing code), we store Base64/DataURL directly
            // or assume we upload it. Existing Feed.tsx uses base64 for stories.
            // We will stick to existing pattern but wrap it here.

            // Note: Storing heavy base64 in DB is bad practice but fits current MVP constraints.
            // Ideally: upload to Supabase Storage -> get URL -> save to DB.

            const { error } = await supabase.from('stories').insert({
                user_id: currentUserId,
                type: file.type.startsWith('video') ? 'video' : 'image',
                content: preview, // Using base64 as per Feed.tsx pattern
                thumbnail: preview,
                display_name: userName,
                avatar: userAvatar,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                status: 'pending' // Pending moderation
            });

            if (error) throw error;

            toast.success('Đã đăng tin thành công!');
            onPosted();
            onClose();

        } catch (error: any) {
            console.error('Post story error:', error);
            toast.error('Lỗi: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black flex items-center justify-center p-4">
            <div className="relative w-full h-full max-w-md bg-gray-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col">

                {/* Header Actions */}
                <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center text-white">
                    <button onClick={onClose} className="p-2 bg-black/40 rounded-full backdrop-blur-md">
                        <X className="w-6 h-6" />
                    </button>
                    <div className="flex gap-4">
                        <button onClick={() => setShowTextInput(!showTextInput)} className="p-2 bg-black/40 rounded-full backdrop-blur-md hover:bg-white/20">
                            <Type className="w-6 h-6" />
                        </button>
                        <button className="p-2 bg-black/40 rounded-full backdrop-blur-md hover:bg-white/20">
                            <Music className="w-6 h-6" />
                        </button>
                        <button className="p-2 bg-black/40 rounded-full backdrop-blur-md hover:bg-white/20">
                            <Sticker className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Main Canvas */}
                <div className="flex-1 relative bg-gray-800 flex items-center justify-center overflow-hidden">
                    {preview ? (
                        <div className="relative w-full h-full">
                            <img
                                src={preview}
                                alt="Preview"
                                className="w-full h-full object-cover transition-all duration-300"
                                style={{ filter: filter }}
                            />
                            {/* Text Overlay Layer */}
                            {text && (
                                <motion.div
                                    drag
                                    dragConstraints={{ left: -100, right: 100, top: -200, bottom: 200 }}
                                    className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                                >
                                    <h2
                                        className="text-2xl font-bold text-center px-4 pointer-events-auto cursor-move drop-shadow-xl"
                                        style={{ color: textColor, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                                    >
                                        {text}
                                    </h2>
                                </motion.div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 text-gray-400">
                            <ImageIcon className="w-16 h-16 opacity-50" />
                            <p>Chọn ảnh để bắt đầu</p>
                            <label className="bg-green-600 text-white px-6 py-2 rounded-full cursor-pointer hover:bg-green-700 font-bold">
                                Chọn từ thư viện
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                            </label>
                        </div>
                    )}
                </div>

                {/* Text Input Modal Overlay */}
                <AnimatePresence>
                    {showTextInput && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center p-6"
                        >
                            <input
                                autoFocus
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                className="bg-transparent text-white text-3xl font-bold text-center border-none outline-none w-full mb-8 max-w-sm"
                                placeholder="Nhập văn bản..."
                            />
                            <div className="flex gap-3 mb-8">
                                {['#ffffff', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'].map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setTextColor(color)}
                                        className={`w-8 h-8 rounded-full border-2 ${textColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={() => setShowTextInput(false)}
                                className="bg-white text-black px-8 py-2 rounded-full font-bold"
                            >
                                Xong
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Controls */}
                <div className="p-4 bg-black relative z-20 pb-8">
                    {/* Filters Row */}
                    {preview && (
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide mb-2">
                            {filters.map(f => (
                                <button
                                    key={f.name}
                                    onClick={() => setFilter(f.value)}
                                    className={`flex-shrink-0 flex flex-col items-center gap-1 ${filter === f.value ? 'text-green-400' : 'text-gray-400'}`}
                                >
                                    <div className={`w-12 h-12 rounded-full border-2 overflow-hidden ${filter === f.value ? 'border-green-400' : 'border-transparent'}`}>
                                        <img src={preview} className="w-full h-full object-cover" style={{ filter: f.value }} />
                                    </div>
                                    <span className="text-[10px] font-medium">{f.name}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <button className="flex flex-col items-center gap-1 text-white/50 hover:text-white">
                            <span className="p-2 bg-white/10 rounded-full"><Download className="w-5 h-5" /></span>
                            <span className="text-[10px]">Lưu</span>
                        </button>

                        <button
                            onClick={handlePost}
                            disabled={!preview || isUploading}
                            className="bg-green-600 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/20"
                        >
                            {isUploading ? 'Đang đăng...' : 'Chia sẻ ngay'}
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
