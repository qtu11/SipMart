'use client';

import { motion } from 'framer-motion';
import {
  QrCode, Wallet, Trophy, MapPin, Bell,
  Users, Leaf, Smartphone, ArrowLeft,
  Coffee, Bus, Bike, CreditCard, ShieldCheck, Zap
} from 'lucide-react';
import Link from 'next/link';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-dark-600 hover:text-primary-600 transition-colors group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold">Trang chủ</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-primary-500 to-teal-500 text-white p-2 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-dark-900">
              Hệ sinh thái All-in-One
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-extrabold mb-6 text-dark-900"
          >
            Quy trình & <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-primary-600 to-teal-500 bg-clip-text text-transparent">
              Cơ chế Vận hành
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-dark-600 max-w-3xl mx-auto"
          >
            Công nghệ FinTech & IoT kết hợp để tạo ra trải nghiệm sống xanh liền mạch, minh bạch và bổ ích.
          </motion.p>
        </div>

        {/* SECTION 1: SIPSMART CUPS */}
        <section className="mb-24">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-primary-100 rounded-xl text-primary-600">
              <Coffee className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-dark-900">1. SipSmart Cups - Vòng lặp ly tuần hoàn</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-gray-100">
            <div className="space-y-8">
              <div className="relative pl-8 border-l-2 border-primary-200">
                <div className="absolute top-0 left-[-9px] w-4 h-4 bg-primary-500 rounded-full border-4 border-white"></div>
                <h3 className="text-xl font-bold text-dark-900 mb-2">Bước 1: Mượn (Deposit)</h3>
                <p className="text-dark-600">Quét mã QR định danh trên ly. Hệ thống trừ cọc <strong className="text-primary-600">20.000 VNĐ</strong> từ Ví VNES vào 'Quỹ Ký quỹ'.</p>
              </div>
              <div className="relative pl-8 border-l-2 border-primary-200">
                <div className="absolute top-0 left-[-9px] w-4 h-4 bg-primary-500 rounded-full border-4 border-white"></div>
                <h3 className="text-xl font-bold text-dark-900 mb-2">Bước 2: Sử dụng</h3>
                <p className="text-dark-600">Thưởng thức đồ uống. App hiển thị đồng hồ đếm ngược thời gian miễn phí/có phí.</p>
              </div>
              <div className="relative pl-8 border-l-2 border-primary-200">
                <div className="absolute top-0 left-[-9px] w-4 h-4 bg-primary-500 rounded-full border-4 border-white"></div>
                <h3 className="text-xl font-bold text-dark-900 mb-2">Bước 3: Trả & Hoàn tiền</h3>
                <p className="text-dark-600 mb-2">Trả tại trạm thu hồi. Tiền hoàn = 20,000 - (Phí thuê). Hoàn tiền tức thì về ví.</p>
                <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-100">
                  Lưu ý: Nếu quá hạn 24 giờ, ly được coi là đã bán.
                </div>
              </div>
              <div className="relative pl-8 border-l-2 border-transparent">
                <div className="absolute top-0 left-[-9px] w-4 h-4 bg-primary-500 rounded-full border-4 border-white"></div>
                <h3 className="text-xl font-bold text-dark-900 mb-2">Bước 4: Tái sinh</h3>
                <p className="text-dark-600">Ly bẩn được thu gom về Hub, rửa sấy công nghiệp và tái cung ứng.</p>
              </div>
            </div>
            <div className="bg-primary-50 rounded-3xl p-8 flex flex-col justify-center items-center text-center">
              <ShieldCheck className="w-24 h-24 text-primary-300 mb-6" />
              <h3 className="text-2xl font-bold text-primary-900 mb-2">Quỹ Ký Quỹ (Escrow)</h3>
              <p className="text-primary-700">Tiền cọc của người dùng được giữ an toàn trong tài khoản Escrow riêng biệt, đảm bảo khả năng thanh khoản hoàn tiền 100% bất cứ lúc nào.</p>
            </div>
          </div>
        </section>

        {/* SECTION 2: GREEN MOBILITY */}
        <section className="mb-24">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-teal-100 rounded-xl text-teal-600">
              <Bus className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-dark-900">2. Green Mobility - Giao thông xanh</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Bus & Metro */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <Bus className="w-6 h-6 text-blue-500" />
                <h3 className="text-xl font-bold">Bus điện & Metro</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <strong className="block text-dark-900">Cơ chế Split Payment</strong>
                    <span className="text-dark-600 text-sm">99.9% doanh thu chuyển thẳng về Nhà xe. SipSmart chỉ thu 0.1% phí hoa hồng.</span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Leaf className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <strong className="block text-dark-900">Ghi nhận ESG</strong>
                    <span className="text-dark-600 text-sm">Tự động tính quãng đường di chuyển và quy đổi ra lượng CO2 giảm thiểu để cộng điểm VNES.</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* e-Bike */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <Bike className="w-6 h-6 text-teal-500" />
                <h3 className="text-xl font-bold">e-Bike Sharing</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <strong className="block text-dark-900">Yêu cầu eKYC</strong>
                    <span className="text-dark-600 text-sm">Bắt buộc xác thực danh tính để đảm bảo an toàn tài sản.</span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Wallet className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <strong className="block text-dark-900">Biểu phí (Lũy tiến)</strong>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm bg-gray-50 p-3 rounded-lg">
                      <span>1 Giờ: 20k</span>
                      <span>3 Giờ: 45k</span>
                      <span>5 Giờ: 80k</span>
                      <span>24 Giờ: 120k</span>
                    </div>
                  </div>
                </li>
                <li className="flex gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <strong className="block text-dark-900">GPS Geofencing</strong>
                    <span className="text-dark-600 text-sm">Bắt buộc trả xe đúng trạm để kết thúc chuyến đi.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* SECTION 3: TECH & SECURITY */}
        <section>
          <div className="bg-dark-900 text-white rounded-[2.5rem] p-8 md:p-12">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-8">Công nghệ & Bảo mật</h2>
              <div className="grid md:grid-cols-3 gap-8 text-left">
                <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
                  <h3 className="font-bold text-lg mb-2 text-primary-400">eKYC &lt; 30s</h3>
                  <p className="text-gray-400 text-sm">OCR trích xuất CCCD, Liveness Check chống giả mạo khuôn mặt và so khớp sinh trắc học.</p>
                </div>
                <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
                  <h3 className="font-bold text-lg mb-2 text-teal-400">Financial Hub</h3>
                  <p className="text-gray-400 text-sm">Xử lý triệu giao dịch vi mô. Tự động thanh toán (Payouts) cho đối tác T+1 hoặc Real-time.</p>
                </div>
                <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
                  <h3 className="font-bold text-lg mb-2 text-purple-400">IoT & MQTT</h3>
                  <p className="text-gray-400 text-sm">Kết nối thời gian thực với khóa ly thông minh và khóa xe điện. Cảnh báo rủi ro tức thì.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
