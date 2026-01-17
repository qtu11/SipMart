'use client';

import { motion } from 'framer-motion';
import { Search, HelpCircle, Book, MessageCircle, FileText, ChevronRight, ArrowLeft, Bot } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function SupportPage() {
    const [searchQuery, setSearchQuery] = useState('');

    const categories = [
        {
            icon: Book,
            title: 'Quy trình hoạt động',
            description: 'Tìm hiểu chi tiết các bước mượn ly và vận hành.',
            color: 'bg-blue-100 text-blue-600',
            link: '/how-it-works'
        },
        {
            icon: FileText,
            title: 'Chính sách & Quy định',
            description: 'Điều khoản sử dụng, biểu phí và chính sách phạt.',
            color: 'bg-green-100 text-green-600',
            link: '/policies'
        },
        {
            icon: HelpCircle,
            title: 'Câu hỏi thường gặp',
            description: 'Giải đáp nhanh các thắc mắc.',
            color: 'bg-purple-100 text-purple-600',
            link: '/faq' // Assuming FAQ might be a section or separate page, linking here for structure
        },
        {
            icon: MessageCircle,
            title: 'Liên hệ hỗ trợ',
            description: 'Gửi yêu cầu trực tiếp cho Admin.',
            color: 'bg-orange-100 text-orange-600',
            link: '/contact'
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-dark-600 hover:text-primary-600 transition-colors group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold">Quay lại</span>
                    </Link>
                    <h1 className="font-bold text-lg text-dark-900">Trung tâm Hỗ trợ</h1>
                </div>
            </header>

            {/* Hero Search */}
            <section className="bg-gradient-to-br from-dark-800 to-dark-900 text-white py-16 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-3xl md:text-4xl font-bold mb-6"
                    >
                        Xin chào, chúng tôi có thể giúp gì?
                    </motion.h1>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="relative max-w-xl mx-auto"
                    >
                        <input
                            type="text"
                            placeholder="Tìm kiếm chính sách, quy trình..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl text-dark-900 placeholder:text-dark-400 focus:outline-none focus:ring-4 focus:ring-primary-500/30 shadow-2xl"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 w-5 h-5" />
                    </motion.div>
                </div>
            </section>

            <main className="max-w-6xl mx-auto px-4 py-12 -mt-10 relative z-10">
                {/* Categories Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {categories.map((cat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + index * 0.05 }}
                            className="bg-white p-6 rounded-2xl shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all group"
                        >
                            <Link href={cat.link} className="block h-full">
                                <div className={`w-12 h-12 ${cat.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <cat.icon className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-lg text-dark-900 mb-2">{cat.title}</h3>
                                <p className="text-sm text-dark-500 mb-4">{cat.description}</p>
                                <span className="text-primary-600 text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                                    Xem chi tiết <ChevronRight className="w-4 h-4" />
                                </span>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Chat Support Section */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8">
                    <div className="bg-primary-50 p-6 rounded-full">
                        <Bot className="w-12 h-12 text-primary-600" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-bold text-dark-900 mb-2">Chat với Trợ lý ảo SipBot (AI)</h3>
                        <p className="text-dark-600 mb-4">
                            SipBot hoạt động 24/7 để giải đáp ngay lập tức các câu hỏi về tài khoản, điểm thưởng và cách sử dụng dịch vụ.
                            Nhấn vào biểu tượng chat ở góc màn hình để bắt đầu.
                        </p>
                        <p className="text-xs text-dark-400 bg-gray-50 inline-block px-3 py-1 rounded-lg border border-gray-100">
                            *Đối với các vấn đề kỹ thuật phức tạp, SipBot sẽ tự động kết nối bạn với Nhân viên hỗ trợ (Admin).
                        </p>
                    </div>
                    <button
                        onClick={() => document.querySelector<HTMLElement>('.fixed.bottom-6.right-6 button')?.click()}
                        className="bg-dark-900 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                    >
                        Mở Chat Nhanh
                    </button>
                </div>
            </main>
        </div>
    );
}
