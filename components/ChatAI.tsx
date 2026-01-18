'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User as UserIcon, Loader2, Sparkles, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  "🚲 Cách thuê xe điện?",
  "🚌 Đi Bus nhận điểm thế nào?",
  "🌱 Lợi ích Green Mobility?",
  "🥤 Quy trình mượn ly?",
];

export default function ChatAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 **Xin chào!** Tôi là **SipBot** - Trợ lý ảo AI của SipSmart.\n\nTôi ở đây để đồng hành cùng bạn trên hành trình Sống Xanh:\n\n🥤 **Mượn Ly**: Quy trình mượn/trả ly tại các trạm.\n🚲 **Xe Điện (e-Bike)**: Hướng dẫn thuê xe và mở khóa.\n🚌 **Bus & Metro**: Tích điểm khi sử dụng phương tiện công cộng.\n\nBạn cần tôi hỗ trợ về **Xe điện** hay **Mượn ly** ngay bây giờ?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async (msgText: string = input) => {
    if (!msgText.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: msgText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // 1. Process Logic Locally First (To ensure accuracy for key scenarios)
      const lowerMsg = msgText.toLowerCase();
      let responseText = "";

      if (lowerMsg.includes('xe') || lowerMsg.includes('bike') || lowerMsg.includes('đạp')) {
          responseText = "🚲 **Hướng dẫn thuê xe đạp điện e-Bike:**\n\n1. **Xác thực eKYC**: Chụp CCCD & Khuôn mặt (chỉ cần làm 1 lần đầu).\n2. **Mở khóa**: Mở App SipSmart -> Quét mã QR trên thân xe.\n3. **Chi phí**: 20.000đ/giờ đầu tiên. (Gói 24h: 120.000đ).\n4. **Trả xe**: Bắt buộc trả tại trạm sạc có GPS khớp với bản đồ.\n\n💡 *Mẹo: Bạn sẽ nhận được Green Points gấp đôi khi di chuyển bằng xe điện!*";
      } else if (lowerMsg.includes('bus') || lowerMsg.includes('metro') || lowerMsg.includes('tàu')) {
          responseText = "🚌 **Đi Bus/Metro tích điểm VNES:**\n\n1. **Quét vé**: Dùng App SipSmart quét mã QR tại cổng soát vé hoặc trên xe.\n2. **Split Payment**: Hệ thống tự động trừ tiền vé và chuyển 99.9% cho nhà xe.\n3. **Nhận điểm**: Quãng đường di chuyển được tự động quy đổi ra lượng CO2 giảm thiểu -> Cộng điểm VNES tương ứng.";
      } else if (lowerMsg.includes('ly') || lowerMsg.includes('cup') || lowerMsg.includes('mượn')) {
          responseText = "🥤 **Quy trình Mượn Ly SipSmart:**\n\n1. **Deposit (Cọc)**: Quét QR trên ly -> Hệ thống tạm giữ 20.000đ cọc.\n2. **Sử dụng**: Bạn có 24h để sử dụng ly miễn phí.\n3. **Trả ly**: Đem ly đến bất kỳ trạm thu hồi nào -> Quét mã trả ly.\n4. **Hoàn tiền**: Nhận lại ngay 20.000đ vào ví.\n\n✨ *Mỗi ly bạn dùng giúp giảm 1 ly nhựa thải ra môi trường!*";
      } else if (lowerMsg.includes('lợi ích') || lowerMsg.includes('tại sao') || lowerMsg.includes('là gì')) {
          responseText = "🌱 **Lợi ích khi tham gia SipSmart:**\n\n✅ **Tiết kiệm**: Tích điểm đổi Voucher, quà tặng.\n✅ **Tiện lợi**: Một ứng dụng cho tất cả: Mượn ly, Thuê xe, Đi bus.\n✅ **Ý nghĩa**: Đóng góp trực tiếp vào mục tiêu Net Zero, bảo vệ trái đất.\n\nBạn muốn thử tính năng nào trước?";
      } else {
        // Fallback to API if no keyword matched
         const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: userMessage.content,
              history: messages.slice(-5).map(m => ({
                role: m.role,
                content: m.content,
              })),
            }),
         });
         const data = await response.json();
         responseText = data.response;
      }

      if (!responseText) responseText = "Xin lỗi, tôi chưa hiểu rõ ý bạn. Bạn có thể hỏi về 'Thuê xe', 'Mượn ly' hoặc 'Đi Bus' được không?";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      logger.error('Chat error', { error });
      // Silent error or fallback
       const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Hệ thống đang bận một chút. Bạn thử hỏi lại về "Cách thuê xe" xem sao nhé!',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <>
      {/* Chat Trigger Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-dark-900 hover:bg-black text-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center z-50 border border-white/10 transition-all group"
      >
        <div className="absolute inset-0 bg-primary-500/20 rounded-2xl blur-xl group-hover:opacity-100 transition-opacity opacity-0"></div>
        <Sparkles className="w-7 h-7 relative z-10" />
        {!isOpen && messages.length > 1 && (
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
            {messages.length - 1}
          </span>
        )}
      </motion.button>

      {/* Main Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95, rotateX: 5 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", bounce: 0.2 }}
              className="fixed bottom-24 right-4 sm:right-6 w-[90vw] sm:w-[400px] h-[600px] max-h-[80vh] bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-100"
            >
              {/* Header */}
              <div className="bg-dark-900 text-white p-5 flex items-center justify-between flex-shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-teal-600/20"></div>
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                    <Bot className="w-6 h-6 text-primary-400" />
                  </div>
                  <div>
                     <h3 className="font-bold text-lg leading-tight">SipBot AI</h3>
                     <div className="flex items-center gap-1.5 opacity-80">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium">Online 24/7</span>
                     </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 hover:bg-white/10 rounded-xl flex items-center justify-center transition active:scale-95 relative z-10"
                >
                  <X className="w-5 h-5 opacity-80" />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 bg-white border border-gray-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                        <Bot className="w-4 h-4 text-dark-900" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-6 ${message.role === 'user'
                        ? 'bg-dark-900 text-white rounded-br-none'
                        : 'bg-white text-dark-800 border border-gray-100 rounded-tl-none'
                        }`}
                    >
                      <div dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                      
                      <p className={`text-[10px] mt-2 font-medium opacity-60 text-right ${message.role === 'user' ? 'text-white' : 'text-dark-400'}`}>
                        {message.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {loading && (
                   <div className="flex gap-3">
                     <div className="w-8 h-8 bg-white border border-gray-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Bot className="w-4 h-4 text-dark-900" />
                      </div>
                      <div className="bg-white rounded-2xl rounded-tl-none px-5 py-4 border border-gray-200 shadow-sm">
                        <div className="flex gap-1.5">
                            <div className="w-2 h-2 bg-dark-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-dark-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-dark-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                   </div>
                )}
                <div ref={messagesEndRef} />
              </div>

               {/* Suggested Questions */}
               {messages.length < 3 && !loading && (
                   <div className="px-4 py-2 bg-gray-50/50 flex gap-2 overflow-x-auto no-scrollbar snap-x">
                       {SUGGESTED_QUESTIONS.map((q, i) => (
                           <button 
                                key={i}
                                onClick={() => handleSend(q)}
                                className="whitespace-nowrap px-3 py-1.5 bg-white border border-gray-200 text-primary-600 text-xs font-bold rounded-lg shadow-sm hover:bg-primary-50 transition snap-start flex-shrink-0"
                            >
                               {q}
                           </button>
                       ))}
                   </div>
               )}

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-gray-100">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Hỏi tôi về SipSmart..."
                    className="w-full pl-5 pr-14 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary-200 focus:ring-4 focus:ring-primary-50 transition-all font-medium text-dark-900 placeholder:text-gray-400"
                    disabled={loading}
                  />
                  <button
                    onClick={() => handleSend(input)}
                    disabled={!input.trim() || loading}
                    className="absolute right-2 top-2 bottom-2 w-11 bg-dark-900 text-white rounded-xl flex items-center justify-center hover:bg-black active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <div className="text-center mt-3">
                    <p className="text-[10px] text-gray-400 font-medium">Powered by Nguyễn Quang Tú</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
