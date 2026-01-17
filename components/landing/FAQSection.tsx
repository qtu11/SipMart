'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';
import Link from 'next/link';

const faqs = [
    {
        question: 'Làm sao để mượn ly tại SipSmart?',
        answer: 'Rất đơn giản! Tải ứng dụng hoặc truy cập web, đăng ký tài khoản và nạp cọc. Sau đó, quét mã QR tại quầy đối tác để nhận ly ngay lập tức.'
    },
    {
        question: 'Tôi có phải trả tiền thuê ly không?',
        answer: 'Hoàn toàn KHÔNG. Bạn chỉ cần đặt cọc (15.000đ/ly). Khi trả ly, bạn sẽ được hoàn lại 100% tiền cọc vào ví ngay lập tức.'
    },
    {
        question: 'Tôi có thể trả ly ở đâu?',
        answer: 'Tại BẤT KỲ quán đối tác nào trong hệ thống SipSmart, không nhất thiết phải là quán bạn đã mượn. Sử dụng bản đồ trong ứng dụng để tìm điểm trả gần nhất.'
    },
    {
        question: 'Nếu tôi làm mất hoặc hỏng ly thì sao?',
        answer: 'Nếu làm mất hoặc hỏng ly nặng (không thể tái sử dụng), bạn sẽ bị trừ số tiền cọc tương ứng với chiếc ly đó. Hãy giữ gìn người bạn xanh này nhé!'
    },
    {
        question: 'Ly có đảm bảo vệ sinh không?',
        answer: 'Chắc chắn rồi! Mỗi chiếc ly sau khi thu hồi đều được đưa về trung tâm xử lý, rửa và sấy tiệt trùng công nghiệp theo quy chuẩn an toàn thực phẩm trước khi tái sử dụng.'
    }
];

export default function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="py-24 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-4">
                        <HelpCircle className="w-6 h-6 text-primary-600" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-dark-900">Câu hỏi thường gặp</h2>
                    <p className="text-dark-600 mt-4 text-lg">Bạn thắc mắc về cách hoạt động? Chúng tôi có câu trả lời.</p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                            >
                                <span className="font-bold text-dark-900 text-lg pr-4">{faq.question}</span>
                                {openIndex === index ? (
                                    <Minus className="w-5 h-5 text-primary-500 shrink-0" />
                                ) : (
                                    <Plus className="w-5 h-5 text-dark-400 shrink-0" />
                                )}
                            </button>
                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="px-6 pb-6 pt-0 text-dark-600 leading-relaxed border-t border-gray-100 mt-2">
                                            <div className="pt-4">{faq.answer}</div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>

                <div className="text-center mt-12">
                    <p className="text-dark-600">
                        Vẫn còn câu hỏi?{' '}
                        <Link href="/contact" className="text-primary-600 font-bold hover:underline">
                            Liên hệ đội ngũ hỗ trợ
                        </Link>
                    </p>
                </div>
            </div>
        </section>
    );
}
