import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Image, Gift, Smile, MoreVertical, Phone, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id: string;
    sender_id: string;
    text: string;
    type: 'text' | 'image' | 'sticker' | 'voucher';
    created_at: string;
}

interface ChatWindowProps {
    friendId: string;
    friendName: string;
    friendAvatar: string;
    friendStatus: string; // online, offline
    onClose: () => void;
    currentUserId: string;
}

export default function ChatWindow({ friendId, friendName, friendAvatar, friendStatus, onClose, currentUserId }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', sender_id: friendId, text: 'Hi cậu, hôm nay đi cafe không?', type: 'text', created_at: new Date().toISOString() },
        { id: '2', sender_id: currentUserId, text: 'Oki nè, quán cũ nha? Tớ mượn ly CupSip rồi.', type: 'text', created_at: new Date().toISOString() },
    ]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!inputText.trim()) return;
        const newMessage: Message = {
            id: Date.now().toString(),
            sender_id: currentUserId,
            text: inputText,
            type: 'text',
            created_at: new Date().toISOString(),
        };
        setMessages([...messages, newMessage]);
        setInputText('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-0 right-20 w-80 md:w-96 bg-white rounded-t-2xl shadow-2xl border border-gray-200 flex flex-col z-[100] h-[500px]"
        >
            {/* Chat Header */}
            <div className="bg-white p-3 rounded-t-2xl border-b border-gray-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img src={friendAvatar} alt={friendName} className="w-10 h-10 rounded-full border border-gray-100" />
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${friendStatus === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 text-sm">{friendName}</h4>
                        <span className="text-xs text-green-600 flex items-center gap-1">
                            {friendStatus === 'online' ? 'Đang hoạt động' : 'Hoạt động 5p trước'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                    <button className="p-2 hover:bg-green-50 rounded-full transition-colors">
                        <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2 hover:bg-green-50 rounded-full transition-colors">
                        <Video className="w-5 h-5" />
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 custom-scrollbar">
                {/* Streak Badge */}
                <div className="flex justify-center mb-4">
                    <div className="bg-orange-100 text-orange-600 text-xs px-3 py-1 rounded-full flex items-center gap-1 font-bold border border-orange-200">
                        🔥 Bạn và {friendName} đã giữ chuỗi 12 ngày!
                    </div>
                </div>

                {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUserId;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {!isMe && (
                                <img src={friendAvatar} className="w-8 h-8 rounded-full mr-2 self-end mb-1" alt="Avatar" />
                            )}
                            <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${isMe
                                    ? 'bg-green-500 text-white rounded-br-none'
                                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-gray-100 rounded-b-none">
                <div className="flex gap-2 mb-2">
                    <button className="text-gray-400 hover:text-green-600 transition-colors bg-gray-50 p-1.5 rounded-lg">
                        <Image className="w-5 h-5" />
                    </button>
                    <button className="text-gray-400 hover:text-pink-600 transition-colors bg-gray-50 p-1.5 rounded-lg">
                        <Gift className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center">
                        <input
                            type="text"
                            className="bg-transparent border-none outline-none w-full text-sm"
                            placeholder="Nhập tin nhắn..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyPress}
                        />
                        <Smile className="w-5 h-5 text-gray-400 hover:text-yellow-500 cursor-pointer ml-2" />
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={!inputText.trim()}
                        className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
