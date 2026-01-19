'use client';

import { motion } from 'framer-motion';
import {
  Coffee, QrCode, Wallet, Recycle,
  Bus, Bike, CreditCard, MapPin,
  CheckCircle, ArrowRight, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function HowItWorksPage() {
  const [activeTab, setActiveTab] = useState<'cups' | 'mobility'>('cups');

  return (
    <div className="min-h-screen bg-white text-dark-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md shadow-sm z-50 border-b border-gray-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group text-dark-600 hover:text-primary-600">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold">Trang chủ</span>
          </Link>
          <h1 className="text-lg font-bold">Quy trình Vận hành</h1>
          <div className="w-8"></div> {/* Spacer */}
        </div>
      </header>

      <main className="pt-28 pb-20">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto px-4 mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold mb-6"
          >
            Hệ sinh thái <br />
            <span className="bg-gradient-to-r from-primary-600 to-teal-500 bg-clip-text text-transparent">
              Vận hành như thế nào?
            </span>
          </motion.h1>
          <p className="text-lg text-dark-600">
            Khám phá quy trình khép kín từ mượn ly tái sử dụng đến giao thông xanh tiện lợi.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-20 px-4">
          <div className="bg-gray-100 p-1.5 rounded-2xl inline-flex relative">
            <div
              className={`absolute inset-y-1.5 transition-all duration-300 ease-spring rounded-xl shadow-sm bg-white ${activeTab === 'cups' ? 'left-1.5 w-[calc(50%-6px)]' : 'left-[50%] w-[calc(50%-6px)]'
                }`}
            ></div>
            <button
              onClick={() => setActiveTab('cups')}
              className={`relative z-10 px-8 py-3 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${activeTab === 'cups' ? 'text-primary-600' : 'text-dark-500 hover:text-dark-900'
                }`}
            >
              <Coffee className="w-4 h-4" />
              SipSmart Cups
            </button>
            <button
              onClick={() => setActiveTab('mobility')}
              className={`relative z-10 px-8 py-3 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${activeTab === 'mobility' ? 'text-teal-600' : 'text-dark-500 hover:text-dark-900'
                }`}
            >
              <Bike className="w-4 h-4" />
              Green Mobility
            </button>
          </div>
        </div>

        {/* Cups Flow */}
        {activeTab === 'cups' && (
          <div className="max-w-5xl mx-auto px-4 relative">
            {/* Vertical Line for Desktop */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-100 via-primary-200 to-primary-50 -translate-x-1/2 rounded-full"></div>

            <TimelineItem
              step="01"
              title="Mượn Ly (Deposit)"
              desc="Người dùng quét mã QR tại quầy. Hệ thống tự động trừ tiền cọc."
              detail="Cọc 20.000 VNĐ được chuyển vào quỹ ký quỹ an toàn."
              icon={QrCode}
              color="primary"
              align="left"
            />
            <TimelineItem
              step="02"
              title="Sử Dụng"
              desc="Thưởng thức đồ uống yêu thích của bạn."
              detail="Bạn có 2h để sử dụng ly miễn phí trước khi tính phí trễ."
              icon={Coffee}
              color="orange"
              align="right"
            />
            <TimelineItem
              step="03"
              title="Trả Ly & Hoàn Tiền"
              desc="Trả ly tại bất kỳ trạm thu hồi SipSmart nào."
              detail="Hoàn lại 98% tiền cọc (18.000 VNĐ) về ví ngay lập tức."
              icon={Wallet}
              color="green"
              align="left"
            />
            <TimelineItem
              step="04"
              title="Tái Sinh"
              desc="Ly được thu gom, rửa sấy tiệt trùng công nghiệp."
              detail="Sẵn sàng quay lại vòng đời phục vụ mới."
              icon={Recycle}
              color="blue"
              align="right"
            />
          </div>
        )}

        {/* Mobility Flow */}
        {activeTab === 'mobility' && (
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Bus/Metro */}
              <div className="bg-blue-50/50 rounded-[2.5rem] p-8 border border-blue-100">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                    <Bus className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-dark-900">Bus điện & Metro</h2>
                </div>
                <div className="space-y-8">
                  <StepCard
                    number="1"
                    title="Quét QR Soát vé"
                    desc="Sử dụng App SipSmart quét mã tại cổng ga hoặc trên xe bus."
                  />
                  <StepCard
                    number="2"
                    title="Split Payment"
                    desc="Doanh thu được chia tách tự động: 99.9% về đơn vị vận tải, 0.1% phí nền tảng."
                  />
                  <StepCard
                    number="3"
                    title="Nhận điểm VNES"
                    desc="Hệ thống tự tính quãng đường và quy đổi ra CO2 giảm thiểu."
                  />
                </div>
              </div>

              {/* e-Bike */}
              <div className="bg-teal-50/50 rounded-[2.5rem] p-8 border border-teal-100">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center text-teal-600">
                    <Bike className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-dark-900">Xe đạp điện</h2>
                </div>
                <div className="space-y-8">
                  <StepCard
                    number="1"
                    title="Xác thực eKYC"
                    desc="Chụp CCCD và khuôn mặt để xác minh danh tính (One-time only)."
                  />
                  <StepCard
                    number="2"
                    title="Mở khóa & Di chuyển"
                    desc="Quét QR trên xe để mở khóa. Biểu phí từ 20.000đ/giờ."
                  />
                  <StepCard
                    number="3"
                    title="Trả xe đúng trạm"
                    desc="Trả xe tại trạm sạc có GPS khớp với hệ thống để kết thúc chuyến."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-20">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-dark-900 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-xl hover:-translate-y-1 transition-all"
          >
            Trải nghiệm ngay
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>
    </div>
  );
}

function TimelineItem({ step, title, desc, detail, icon: Icon, color, align }: any) {
  const isLeft = align === 'left';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      className={`flex flex-col md:flex-row items-center gap-8 mb-16 md:mb-0 ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}
    >
      {/* Content Side */}
      <div className={`md:w-1/2 flex ${isLeft ? 'justify-end' : 'justify-start'} text-center ${isLeft ? 'md:text-right' : 'md:text-left'}`}>
        <div className="bg-white p-6 rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 max-w-sm hover:border-primary-200 transition-colors">
          <div className="text-sm font-bold text-gray-400 mb-2">BƯỚC {step}</div>
          <h3 className="text-xl font-bold text-dark-900 mb-2">{title}</h3>
          <p className="text-dark-600 mb-3">{desc}</p>
          <div className={`text-sm p-3 rounded-xl bg-${color}-50 text-${color}-700 font-medium`}>
            {detail}
          </div>
        </div>
      </div>

      {/* Icon Center */}
      <div className="relative z-10 flex-shrink-0">
        <div className={`w-16 h-16 rounded-full bg-white border-4 border-${color}-100 flex items-center justify-center shadow-lg`}>
          <Icon className={`w-7 h-7 text-${color}-600`} />
        </div>
      </div>

      {/* Empty Side for layout balance */}
      <div className="md:w-1/2"></div>
    </motion.div>
  );
}

function StepCard({ number, title, desc }: any) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-sm text-dark-900 flex-shrink-0 shadow-sm">
        {number}
      </div>
      <div>
        <h4 className="font-bold text-dark-900 mb-1">{title}</h4>
        <p className="text-sm text-dark-600 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}
