'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles, Repeat, Leaf, Zap, Smartphone, ShieldCheck, Globe } from 'lucide-react';

export default function HeroSection() {
    return (
        <section className="relative pt-24 pb-12 sm:pt-32 sm:pb-40 overflow-hidden bg-white">
            {/* Premium Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-gradient-to-br from-primary-100/40 to-teal-100/40 rounded-full blur-[120px] mix-blend-multiply opacity-70" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-[100px] mix-blend-multiply opacity-70" />
                <div className="absolute inset-0 bg-[url('/patterns/grid-subtle.svg')] opacity-[0.03]"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                    {/* Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-center lg:text-left"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 bg-white border border-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs sm:text-sm font-bold mb-6 sm:mb-8 shadow-sm hover:shadow-md transition-shadow cursor-default"
                        >
                            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-500" />
                            <span className="tracking-wide">HỆ SINH THÁI CARBON REWARD & FINTECH</span>
                        </motion.div>

                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-dark-900 leading-[1.1] mb-6 sm:mb-8 tracking-tight">
                            Sống Xanh <br />
                            <span className="bg-gradient-to-r from-primary-600 via-teal-500 to-emerald-600 bg-clip-text text-transparent">
                                Thông Minh Hơn.
                            </span>
                        </h1>

                        <p className="text-base sm:text-lg md:text-xl text-dark-600 mb-8 sm:mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium opacity-80">
                            Nền tảng <strong>All-in-One</strong> tiên phong kết hợp IoT và tài chính.
                            Biến mỗi chiếc ly bạn dùng, mỗi chuyến xe bạn đi thành
                            <span className="text-primary-700 font-bold"> tài sản thực</span> và
                            <span className="text-teal-700 font-bold"> tín chỉ xanh</span> cho tương lai.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center lg:justify-start">
                            <Link
                                href="/auth/register"
                                className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 bg-dark-900 text-white rounded-2xl font-bold text-base sm:text-lg shadow-xl shadow-dark-900/20 hover:bg-black hover:-translate-y-1 transition-all flex items-center justify-center gap-3 group"
                            >
                                Trải nghiệm ngay
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/how-it-works"
                                className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 bg-white text-dark-800 border-2 border-gray-100 hover:border-primary-500/30 hover:bg-gray-50 rounded-2xl font-bold text-base sm:text-lg transition-all flex items-center justify-center gap-3"
                            >
                                Xem quy trình
                            </Link>
                        </div>

                        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-100 grid grid-cols-2 md:grid-cols-3 gap-6 text-left">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                    <Leaf className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-dark-900">20k+</div>
                                    <div className="text-xs text-dark-500 font-medium">Ly được cứu</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-teal-50 rounded-lg text-teal-600">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-dark-900">100%</div>
                                    <div className="text-xs text-dark-500 font-medium">Xe điện eKYC</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                    <Globe className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-dark-900">Net Zero</div>
                                    <div className="text-xs text-dark-500 font-medium">Tiêu chuẩn ESG</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Premium Visual - App Mockup Composition */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, rotate: 5 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 1, type: "spring", bounce: 0.3 }}
                        className="relative h-[480px] lg:h-[700px] w-full flex justify-center lg:block"
                    >
                        {/* Abstract Backdrop */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-to-tr from-primary-100/30 via-teal-50/20 to-transparent rounded-full blur-3xl" />

                        {/* Main Phone Mockup */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[520px] lg:w-[340px] lg:h-[680px] bg-dark-900 rounded-[2.5rem] lg:rounded-[3rem] p-3 shadow-2xl shadow-primary-900/40 border-[6px] border-dark-800 rotate-[-4deg] lg:rotate-[-6deg] hover:rotate-[0deg] transition-transform duration-700 z-10">
                            {/* Screen Content */}
                            <div className="w-full h-full bg-white rounded-[2rem] lg:rounded-[2.2rem] overflow-hidden relative flex flex-col">
                                {/* Fake Status Bar */}
                                <div className="h-6 lg:h-8 bg-white flex justify-between px-6 items-center pt-2">
                                    <div className="text-[10px] font-bold text-dark-900">9:41</div>
                                    <div className="flex gap-1">
                                        <div className="w-3 h-3 bg-dark-900 rounded-full opacity-20"></div>
                                        <div className="w-3 h-3 bg-dark-900 rounded-full opacity-20"></div>
                                        <div className="w-4 h-2.5 bg-dark-900 rounded-[2px]"></div>
                                    </div>
                                </div>

                                {/* App Header */}
                                <div className="px-5 pt-3 pb-2 flex justify-between items-center">
                                    <div>
                                        <div className="text-[10px] lg:text-xs text-gray-500 font-medium">Xin chào, Nguyễn!</div>
                                        <div className="text-base lg:text-lg font-bold text-dark-900">Green Member 🌿</div>
                                    </div>
                                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-100 rounded-full"></div>
                                </div>

                                {/* Balance Card */}
                                <div className="px-5 py-3">
                                    <div className="bg-gradient-to-br from-dark-800 to-black p-4 lg:p-5 rounded-2xl text-white shadow-xl shadow-dark-900/20 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles className="w-12 h-12 lg:w-16 lg:h-16" /></div>
                                        <div className="text-[10px] lg:text-xs opacity-70 mb-1">Ví VNES</div>
                                        <div className="text-xl lg:text-2xl font-bold mb-3 lg:mb-4">450.000 đ</div>
                                        <div className="flex gap-2 lg:gap-3 text-[10px] lg:text-xs font-semibold">
                                            <div className="bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-md">+ Nạp tiền</div>
                                            <div className="bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-md">Rút tiền</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Grid */}
                                <div className="px-5 grid grid-cols-2 gap-3 lg:gap-4 mb-4 lg:mb-6">
                                    <div className="bg-primary-50 p-3 lg:p-4 rounded-2xl flex flex-col items-center justify-center gap-2 aspect-square">
                                        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                                            <Leaf className="w-4 h-4 lg:w-5 lg:h-5" />
                                        </div>
                                        <span className="font-bold text-primary-900 text-xs lg:text-sm">Mượn Ly</span>
                                    </div>
                                    <div className="bg-teal-50 p-3 lg:p-4 rounded-2xl flex flex-col items-center justify-center gap-2 aspect-square">
                                        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
                                            <Zap className="w-4 h-4 lg:w-5 lg:h-5" />
                                        </div>
                                        <span className="font-bold text-teal-900 text-xs lg:text-sm">Thuê Xe</span>
                                    </div>
                                </div>

                                {/* Stats List */}
                                <div className="px-5 space-y-2 lg:space-y-3 pb-4">
                                    <div className="text-xs lg:text-sm font-bold text-dark-900 mb-1 lg:mb-2">Hoạt động gần đây</div>
                                    <div className="flex items-center gap-3 p-2 lg:p-3 bg-gray-50 rounded-xl">
                                        <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs">+</div>
                                        <div className="flex-1">
                                            <div className="text-xs lg:text-sm font-bold text-dark-900">Trả ly thành công</div>
                                            <div className="text-[9px] lg:text-[10px] text-gray-500">Hoàn cọc 20.000đ</div>
                                        </div>
                                        <div className="text-xs lg:text-sm font-bold text-green-600">+20k</div>
                                    </div>
                                    <div className="flex items-center gap-3 p-2 lg:p-3 bg-gray-50 rounded-xl">
                                        <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">-</div>
                                        <div className="flex-1">
                                            <div className="text-xs lg:text-sm font-bold text-dark-900">Thuê xe điện</div>
                                            <div className="text-[9px] lg:text-[10px] text-gray-500">2 giờ di chuyển</div>
                                        </div>
                                        <div className="text-xs lg:text-sm font-bold text-dark-900">-40k</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Elements (Glass Cards) */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="hidden md:block absolute top-[20%] right-[5%] lg:right-[10%] bg-white/80 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/50 w-48 z-20"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <ShieldCheck className="w-5 h-5 text-green-600" />
                                <span className="font-bold text-xs text-dark-700">Đã xác thực eKYC</span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full w-full bg-green-500 rounded-full"></div>
                            </div>
                        </motion.div>

                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="hidden md:block absolute bottom-[15%] left-[5%] bg-white/80 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/50 w-52 z-20"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600">
                                    <Globe className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-500 uppercase">CO2 Giảm thiểu</div>
                                    <div className="text-xl font-bold text-dark-900">12.5 kg</div>
                                </div>
                            </div>
                        </motion.div>

                    </motion.div>
                </div>
            </div>
        </section>
    );
}
