'use client';

import { motion } from 'framer-motion';
import { Target, Heart, ArrowLeft, Globe, Zap, Users } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-dark-600 hover:text-primary-600 transition-colors group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Trang chủ</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white text-xs">S</span>
            </div>
            <span className="font-bold text-dark-900">Về SipSmart</span>
          </div>
        </div>
      </header>

      <main>
        {/* Intro */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-primary-600 font-bold tracking-wider uppercase text-sm mb-4 block"
            >
              Tầm nhìn & Sứ mệnh
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-extrabold text-dark-900 mb-8 leading-tight"
            >
              Biến mọi hành động bảo vệ môi trường thành <span className="text-primary-600">giá trị tài chính</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-dark-600 leading-relaxed"
            >
              SipSmart cam kết cắt giảm rác thải nhựa thông qua Ly tái sử dụng và giảm khí thải carbon thông qua Giao thông xanh, mang lại lợi ích thực tế cho cả người dùng và doanh nghiệp.
            </motion.p>
          </div>
        </section>

        {/* Values Grid */}
        <section className="py-20 max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Giá trị Cốt lõi</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white shadow-lg shadow-gray-200/50 border border-gray-100 hover:border-primary-200 transition-colors">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                <Globe className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Kinh tế Tuần hoàn</h3>
              <p className="text-dark-600 leading-relaxed">
                Xây dựng vòng lặp khép kín cho sản phẩm, tối ưu hóa tài nguyên và giảm thiểu tối đa rác thải ra môi trường.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-white shadow-lg shadow-gray-200/50 border border-gray-100 hover:border-blue-200 transition-colors">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Công nghệ Tiên phong</h3>
              <p className="text-dark-600 leading-relaxed">
                Ứng dụng IoT, Big Data và FinTech để tạo ra trải nghiệm sống xanh tiện lợi, thông minh và minh bạch nhất.
              </p>
            </div>
            <div className="p-8 rounded-3xl bg-white shadow-lg shadow-gray-200/50 border border-gray-100 hover:border-purple-200 transition-colors">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Cộng đồng Bền vững</h3>
              <p className="text-dark-600 leading-relaxed">
                Kết nối thế hệ Gen Z, doanh nghiệp và các tổ chức để cùng nhau tạo ra tác động tích cực lớn lao.
              </p>
            </div>
          </div>
        </section>

        {/* Impact Visual */}
        <section className="py-20 bg-dark-900 text-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Đối tác Chiến lược</h2>
                <div className="space-y-6 text-gray-300">
                  <p>
                    SipSmart hợp tác với các Doanh nghiệp, Nhà trường và Đơn vị vận hành để mở rộng mạng lưới điểm chấp nhận SipSmart Cup và trạm xe điện.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex gap-3 items-center">
                      <Target className="w-5 h-5 text-primary-500" />
                      <span>Tăng doanh thu từ tệp khách hàng Gen Z.</span>
                    </li>
                    <li className="flex gap-3 items-center">
                      <Target className="w-5 h-5 text-primary-500" />
                      <span>Nhận báo cáo ESG chuẩn quốc tế (Scope 3).</span>
                    </li>
                    <li className="flex gap-3 items-center">
                      <Target className="w-5 h-5 text-primary-500" />
                      <span>Không tốn chi phí đầu tư R&D công nghệ.</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="bg-white/10 p-8 rounded-3xl backdrop-blur-sm border border-white/10">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">Chia sẻ Doanh thu</h3>
                  <div className="text-6xl font-black text-primary-400 mb-2">99.9%</div>
                  <p className="opacity-80 mb-6">Doanh thu thuộc về Đối tác</p>
                  <div className="inline-block bg-primary-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Real-time Settlement
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
