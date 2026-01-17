'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Star, Target, ShieldCheck } from 'lucide-react';

export default function AboutSection() {
    return (
        <section className="py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Visual Side */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative order-2 lg:order-1"
                    >
                        <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl bg-gradient-to-br from-dark-800 to-dark-900 p-8 flex flex-col justify-center items-center text-center text-white">
                            <div className="mb-6">
                                <Target className="w-20 h-20 text-primary-500 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold mb-2">ESG & Net Zero</h3>
                                <p className="text-gray-400 text-sm max-w-xs mx-auto">
                                    Chúng tôi cung cấp dữ liệu báo cáo giảm phát thải (Scope 3) chuẩn quốc tế cho doanh nghiệp.
                                </p>
                            </div>
                            <div className="w-full h-px bg-white/10 my-6"></div>
                            <div>
                                <ShieldCheck className="w-20 h-20 text-teal-500 mx-auto mb-4" />
                                <h3 className="text-2xl font-bold mb-2">Minh Bạch Tài Chính</h3>
                                <p className="text-gray-400 text-sm max-w-xs mx-auto">
                                    Công nghệ Split Payment đảm bảo 99.9% doanh thu về tay đối tác theo thời gian thực.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Content Side */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="order-1 lg:order-2"
                    >
                        <span className="text-primary-600 font-bold uppercase tracking-wider text-sm mb-2 block">Về Chúng Tôi</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-dark-900 mb-6 leading-tight">
                            Circular Economy <br className="hidden lg:block" /> Platform
                        </h2>
                        <p className="text-lg text-dark-600 mb-6 leading-relaxed">
                            SipSmart không chỉ là một ứng dụng, chúng tôi là nền tảng <strong>Kinh tế Doanh nghiệp</strong> tích hợp công nghệ IoT và FinTech.
                        </p>
                        <p className="text-lg text-dark-600 mb-8 leading-relaxed">
                            Sứ mệnh của chúng tôi là biến mọi hành động bảo vệ môi trường thành giá trị tài chính minh bạch cho người dùng và giá trị báo cáo ESG cho doanh nghiệp.
                            Từ việc cắt giảm rác thải nhựa đến thúc đẩy giao thông xanh, SipSmart kiến tạo một lối sống bền vững, hiện đại.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href="/about"
                                className="inline-flex items-center gap-2 text-primary-600 font-bold text-lg group hover:text-primary-700"
                            >
                                Đọc tầm nhìn & sứ mệnh
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        <div className="mt-12 pt-8 border-t border-gray-100 grid grid-cols-2 gap-8">
                            <div>
                                <div className="text-4xl font-extrabold text-dark-900 mb-1">0.1%</div>
                                <div className="text-dark-500 font-medium">Phí dịch vụ cực thấp</div>
                            </div>
                            <div>
                                <div className="text-4xl font-extrabold text-dark-900 mb-1">Real-time</div>
                                <div className="text-dark-500 font-medium">Quyết toán tài chính</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
