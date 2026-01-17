'use client';

import { motion } from 'framer-motion';
import { QrCode, Wallet, Trophy, MapPin, Bus, Bike, Coffee, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function FeatureShowcase() {
    const [activeTab, setActiveTab] = useState<'cups' | 'mobility'>('cups');

    return (
        <section className="py-24 bg-gray-50 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-primary-600 font-bold uppercase tracking-wider text-sm"
                    >
                        Hệ sinh thái All-in-One
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-4xl font-bold text-dark-900 mt-2"
                    >
                        Quy trình vận hành thông minh
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-dark-600 mt-4 leading-relaxed"
                    >
                        SipSmart kết nối mọi hoạt động sống xanh của bạn trong một nền tảng duy nhất.
                    </motion.p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-16">
                    <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-200 inline-flex">
                        <button
                            onClick={() => setActiveTab('cups')}
                            className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'cups'
                                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                                    : 'text-dark-500 hover:text-dark-900 hover:bg-gray-50'
                                }`}
                        >
                            <Coffee className="w-4 h-4" />
                            SipSmart Cups
                        </button>
                        <button
                            onClick={() => setActiveTab('mobility')}
                            className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'mobility'
                                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md'
                                    : 'text-dark-500 hover:text-dark-900 hover:bg-gray-50'
                                }`}
                        >
                            <Bike className="w-4 h-4" />
                            Green Mobility
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="relative min-h-[400px]">
                    {activeTab === 'cups' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
                        >
                            <FeatureCard
                                number="01"
                                icon={QrCode}
                                title="Mượn Ly (Deposit)"
                                desc="Quét QR trên ly. Hệ thống trừ cọc 20.000 VNĐ từ ví VNES chuyển vào Quỹ Ký quỹ an toàn."
                                color="bg-primary-100 text-primary-600"
                            />
                            <FeatureCard
                                number="02"
                                icon={Coffee}
                                title="Sử Dụng"
                                desc="Thưởng thức đồ uống. App hiển thị đồng hồ đếm ngược thời gian sử dụng."
                                color="bg-orange-100 text-orange-600"
                            />
                            <FeatureCard
                                number="03"
                                icon={Wallet}
                                title="Trả & Hoàn Tiền"
                                desc="Trả ly tại trạm thông minh. Hoàn tiền cọc trừ đi phí thuê (nếu có) ngay lập tức."
                                color="bg-green-100 text-green-600"
                            />
                            <FeatureCard
                                number="04"
                                icon={Trophy}
                                title="Tái Sinh & Thưởng"
                                desc="Ly được rửa sấy công nghiệp để tái sử dụng. Bạn nhận điểm VNES từ việc giảm nhựa."
                                color="bg-yellow-100 text-yellow-600"
                            />
                        </motion.div>
                    )}

                    {activeTab === 'mobility' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            <FeatureCard
                                number="A"
                                icon={Bus}
                                title="Bus & Metro"
                                desc="Quét QR tại cổng soát vé. Split Payment tự động: 99.9% tiền vé về nhà xe, 0.1% phí dịch vụ. Tự động tính CO2 giảm thiểu."
                                color="bg-blue-100 text-blue-600"
                            />
                            <FeatureCard
                                number="B"
                                icon={Bike}
                                title="e-Bike Sharing"
                                desc="Xác thực eKYC để mở khóa xe. Biểu phí linh hoạt từ 20k/giờ. Trả xe đúng trạm GPS để kết thúc chuyến."
                                color="bg-teal-100 text-teal-600"
                            />
                            <FeatureCard
                                number="C"
                                icon={MapPin}
                                title="Định vị Thông minh"
                                desc="Hệ thống GPS Geofencing cảnh báo khi xe ra khỏi vùng an toàn. Bản đồ nhiệt hỗ trợ tìm xe và trạm sạc de dang."
                                color="bg-purple-100 text-purple-600"
                            />
                        </motion.div>
                    )}
                </div>
            </div>
        </section>
    );
}

function FeatureCard({ number, icon: Icon, title, desc, color }: any) {
    return (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-6 opacity-10 font-black text-6xl text-gray-900 group-hover:opacity-5 transition-opacity select-none">
                {number}
            </div>
            <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center mb-6 relative z-10`}>
                <Icon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-dark-900 mb-3 relative z-10">{title}</h3>
            <p className="text-dark-600 leading-relaxed text-sm relative z-10">
                {desc}
            </p>
        </div>
    )
}
