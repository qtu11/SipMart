'use client';

import { motion } from 'framer-motion';
import {
  Target, Heart, ArrowLeft, Globe, Zap, Users, Leaf,
  TrendingUp, Shield, Coffee, Bike, Recycle, Award,
  CheckCircle, ArrowRight, Sparkles, BarChart3
} from 'lucide-react';
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
        {/* Hero Vision/Mission - Expanded */}
        <section className="py-20 lg:py-28 bg-gradient-to-b from-primary-50 via-white to-gray-50 relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100/40 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-100/40 rounded-full blur-3xl" />

          <div className="max-w-5xl mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 text-primary-600 font-bold tracking-wider uppercase text-sm bg-primary-100 px-4 py-2 rounded-full mb-6"
              >
                <Sparkles className="w-4 h-4" />
                Tầm nhìn & Sứ mệnh
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-dark-900 mb-8 leading-tight"
              >
                Biến mọi hành động bảo vệ môi trường thành <span className="text-primary-600">giá trị tài chính</span>
              </motion.h1>
            </div>

            {/* Vision & Mission Cards */}
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {/* Vision */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-bl-full" />
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary-500/25">
                    <Target className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-dark-900 mb-4">Tầm Nhìn 2030</h2>
                  <p className="text-dark-600 leading-relaxed mb-4">
                    Trở thành <strong className="text-dark-900">nền tảng sống xanh số 1 Đông Nam Á</strong>,
                    kết nối hàng triệu người dùng với hệ sinh thái kinh tế tuần hoàn,
                    nơi mỗi hành động bảo vệ môi trường đều được ghi nhận và đền đáp xứng đáng.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span className="text-dark-600">10 triệu người dùng Việt Nam</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span className="text-dark-600">50.000 điểm chấp nhận toàn quốc</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span className="text-dark-600">Mở rộng ra Singapore, Thailand, Indonesia</span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              {/* Mission */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full" />
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-teal-500/25">
                    <Heart className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-dark-900 mb-4">Sứ Mệnh</h2>
                  <p className="text-dark-600 leading-relaxed mb-4">
                    <strong className="text-dark-900">Dân chủ hóa lối sống bền vững</strong> bằng cách
                    loại bỏ mọi rào cản tham gia, tạo động lực tài chính
                    và xây dựng cộng đồng những người tiên phong trong cuộc cách mạng xanh.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span className="text-dark-600">Giảm 100 triệu ly nhựa một lần/năm</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span className="text-dark-600">Cắt giảm 50.000 tấn CO2/năm</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span className="text-dark-600">Hoàn trả 100 tỷ VNĐ cho người dùng xanh</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>

            {/* Philosophy statement */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-primary-600 to-teal-600 rounded-3xl p-8 lg:p-10 text-white text-center"
            >
              <p className="text-xl lg:text-2xl font-medium leading-relaxed opacity-95">
                "Chúng tôi tin rằng <strong>mỗi cá nhân đều có thể tạo ra tác động lớn</strong> khi được trang bị
                công cụ phù hợp. SipSmart không chỉ là ứng dụng — mà là <strong>phong trào</strong>,
                là <strong>cộng đồng</strong>, là <strong>cam kết</strong> của thế hệ tiên phong trong cuộc cách mạng xanh."
              </p>
              <div className="mt-6 flex items-center justify-center gap-2 text-white/80 text-sm font-medium">
                <Leaf className="w-4 h-4" />
                Đội ngũ sáng lập SipSmart
              </div>
            </motion.div>
          </div>
        </section>

        {/* How We Work - The Problem & Solution */}
        <section className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-dark-900 mb-4">Vấn đề & Giải pháp</h2>
              <p className="text-lg text-dark-600 max-w-2xl mx-auto">
                Hiểu rõ thách thức, thiết kế giải pháp đột phá
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Problem */}
              <div className="bg-red-50 rounded-3xl p-8 border border-red-100">
                <h3 className="text-xl font-bold text-red-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white rotate-180" />
                  </div>
                  Thách thức hiện tại
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-red-700 font-bold text-xs">1</span>
                    </div>
                    <div>
                      <strong className="text-dark-900">500 tỷ ly nhựa/năm</strong>
                      <p className="text-dark-600 text-sm">Việt Nam đứng thứ 4 thế giới về rác thải nhựa ra đại dương</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-red-700 font-bold text-xs">2</span>
                    </div>
                    <div>
                      <strong className="text-dark-900">Khí thải giao thông tăng 15%/năm</strong>
                      <p className="text-dark-600 text-sm">Xe máy chiếm 95% phương tiện cá nhân tại các đô thị lớn</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-red-700 font-bold text-xs">3</span>
                    </div>
                    <div>
                      <strong className="text-dark-900">Thiếu động lực kinh tế</strong>
                      <p className="text-dark-600 text-sm">Hành vi xanh chưa được ghi nhận và đền đáp phù hợp</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Solution */}
              <div className="bg-green-50 rounded-3xl p-8 border border-green-100">
                <h3 className="text-xl font-bold text-green-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  Giải pháp SipSmart
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Coffee className="w-3 h-3 text-green-700" />
                    </div>
                    <div>
                      <strong className="text-dark-900">Ly tái sử dụng thông minh</strong>
                      <p className="text-dark-600 text-sm">Mượn - Trả - Nhận thưởng tự động qua ví VNES</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Bike className="w-3 h-3 text-green-700" />
                    </div>
                    <div>
                      <strong className="text-dark-900">Giao thông xanh tích hợp</strong>
                      <p className="text-dark-600 text-sm">Xe buýt, Metro, E-bike trong một ứng dụng duy nhất</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Award className="w-3 h-3 text-green-700" />
                    </div>
                    <div>
                      <strong className="text-dark-900">Green Points & Ví VNES</strong>
                      <p className="text-dark-600 text-sm">Token hóa hành vi xanh, quy đổi thành giá trị thực</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Values Grid - Enhanced */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-dark-900 mb-4">Giá trị Cốt lõi</h2>
              <p className="text-lg text-dark-600 max-w-2xl mx-auto">
                Ba trụ cột định hướng mọi quyết định và hành động của chúng tôi
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-8 rounded-3xl bg-white shadow-xl border border-gray-100 hover:border-green-200 transition-all hover:-translate-y-2 group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-500/25 group-hover:scale-110 transition-transform">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-dark-900">Kinh tế Tuần hoàn</h3>
                <p className="text-dark-600 leading-relaxed mb-4">
                  Xây dựng vòng lặp khép kín cho sản phẩm, tối ưu hóa tài nguyên và giảm thiểu tối đa rác thải ra môi trường.
                </p>
                <ul className="space-y-2 text-sm text-dark-500">
                  <li className="flex items-center gap-2">
                    <Recycle className="w-4 h-4 text-green-500" />
                    100% ly được tái sử dụng
                  </li>
                  <li className="flex items-center gap-2">
                    <Recycle className="w-4 h-4 text-green-500" />
                    Vòng đời sản phẩm 3+ năm
                  </li>
                  <li className="flex items-center gap-2">
                    <Recycle className="w-4 h-4 text-green-500" />
                    Zero-waste trong vận hành
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="p-8 rounded-3xl bg-white shadow-xl border border-gray-100 hover:border-blue-200 transition-all hover:-translate-y-2 group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-dark-900">Công nghệ Tiên phong</h3>
                <p className="text-dark-600 leading-relaxed mb-4">
                  Ứng dụng IoT, Big Data và FinTech để tạo ra trải nghiệm sống xanh tiện lợi, thông minh và minh bạch nhất.
                </p>
                <ul className="space-y-2 text-sm text-dark-500">
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    Blockchain cho giao dịch
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    AI dự đoán hành vi
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    Real-time analytics
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="p-8 rounded-3xl bg-white shadow-xl border border-gray-100 hover:border-purple-200 transition-all hover:-translate-y-2 group"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-dark-900">Cộng đồng Bền vững</h3>
                <p className="text-dark-600 leading-relaxed mb-4">
                  Kết nối thế hệ Gen Z, doanh nghiệp và các tổ chức để cùng nhau tạo ra tác động tích cực lớn lao.
                </p>
                <ul className="space-y-2 text-sm text-dark-500">
                  <li className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-purple-500" />
                    Gamification & Leaderboard
                  </li>
                  <li className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-purple-500" />
                    Challenge cộng đồng
                  </li>
                  <li className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-purple-500" />
                    Mạng lưới đối tác ESG
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Impact Stats */}
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-6 rounded-2xl bg-primary-50">
                <div className="text-4xl lg:text-5xl font-black text-primary-600 mb-2">1M+</div>
                <div className="text-dark-600 font-medium">Ly được tái sử dụng</div>
              </div>
              <div className="text-center p-6 rounded-2xl bg-teal-50">
                <div className="text-4xl lg:text-5xl font-black text-teal-600 mb-2">50T+</div>
                <div className="text-dark-600 font-medium">Tấn nhựa giảm</div>
              </div>
              <div className="text-center p-6 rounded-2xl bg-blue-50">
                <div className="text-4xl lg:text-5xl font-black text-blue-600 mb-2">500+</div>
                <div className="text-dark-600 font-medium">Đối tác toàn quốc</div>
              </div>
              <div className="text-center p-6 rounded-2xl bg-purple-50">
                <div className="text-4xl lg:text-5xl font-black text-purple-600 mb-2">100K+</div>
                <div className="text-dark-600 font-medium">Người dùng xanh</div>
              </div>
            </div>
          </div>
        </section>

        {/* Strategic Partners */}
        <section className="py-20 bg-dark-900 text-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Đối tác Chiến lược</h2>
                <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                  SipSmart hợp tác với các <strong className="text-white">Doanh nghiệp F&B</strong>,
                  <strong className="text-white"> Trường học</strong>, <strong className="text-white">Toà nhà văn phòng</strong> và
                  <strong className="text-white"> Đơn vị vận hành giao thông</strong> để mở rộng mạng lưới điểm chấp nhận.
                </p>
                <div className="space-y-6">
                  <ul className="space-y-4">
                    <li className="flex gap-4 items-start">
                      <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <strong className="text-white">Tăng doanh thu từ tệp khách hàng Gen Z</strong>
                        <p className="text-gray-400 text-sm mt-1">Thu hút khách hàng trẻ có ý thức môi trường cao</p>
                      </div>
                    </li>
                    <li className="flex gap-4 items-start">
                      <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <strong className="text-white">Báo cáo ESG chuẩn quốc tế (Scope 3)</strong>
                        <p className="text-gray-400 text-sm mt-1">Dữ liệu tác động môi trường real-time, có thể audit</p>
                      </div>
                    </li>
                    <li className="flex gap-4 items-start">
                      <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <strong className="text-white">Không tốn chi phí đầu tư R&D</strong>
                        <p className="text-gray-400 text-sm mt-1">Toàn bộ hạ tầng công nghệ do SipSmart cung cấp</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="bg-gradient-to-br from-white/10 to-white/5 p-8 rounded-3xl backdrop-blur-sm border border-white/10">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">Chia sẻ Doanh thu</h3>
                  <div className="text-7xl font-black bg-gradient-to-r from-primary-400 to-teal-400 bg-clip-text text-transparent mb-2">99.9%</div>
                  <p className="opacity-80 mb-6 text-lg">Doanh thu thuộc về Đối tác</p>
                  <div className="inline-flex items-center gap-2 bg-primary-600 px-5 py-2 rounded-full text-sm font-bold uppercase tracking-wider">
                    <Zap className="w-4 h-4" />
                    Real-time Settlement
                  </div>
                  <p className="text-gray-400 text-sm mt-4">
                    Quyết toán tự động mỗi ngày qua ví VNES
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-r from-primary-600 to-teal-600">
          <div className="max-w-4xl mx-auto px-4 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Sẵn sàng tham gia cuộc cách mạng xanh?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Dù bạn là người dùng cá nhân hay doanh nghiệp, SipSmart có giải pháp phù hợp cho bạn.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors"
              >
                Đăng ký ngay
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 bg-white/20 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/30 transition-colors border border-white/30"
              >
                Tìm hiểu thêm
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
