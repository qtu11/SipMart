'use client';

import { motion } from 'framer-motion';
import { QrCode, Wallet, Trophy, MapPin, Bell, Users, Leaf, Smartphone, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function FeaturesPage() {
  const features = [
    {
      icon: QrCode,
      title: 'Quét QR Thông minh',
      description: 'Quét mã QR nhanh chóng bằng camera hoặc chọn ảnh từ gallery. Hỗ trợ cả nhập thủ công khi cần.',
      color: 'from-blue-500 to-blue-600',
      link: '/scan',
    },
    {
      icon: Wallet,
      title: 'Ví Điện tử Tích hợp',
      description: 'Nạp tiền, cọc ly, hoàn cọc tự động. Quản lý tài chính mượt mà trong một ứng dụng duy nhất.',
      color: 'from-green-500 to-green-600',
      link: '/wallet',
    },
    {
      icon: Trophy,
      title: 'Green Points & Ranking',
      description: 'Tích điểm xanh khi sống xanh, lên rank từ Seed đến Forest. Cạnh tranh với cộng đồng trên bảng xếp hạng.',
      color: 'from-yellow-500 to-orange-600',
      link: '/leaderboard',
    },
    {
      icon: MapPin,
      title: 'Bản đồ Đối tác',
      description: 'Tìm quán nước đối tác gần nhất, xem địa chỉ, khoảng cách và chỉ đường. Trả ly linh hoạt tại bất kỳ đâu.',
      color: 'from-red-500 to-pink-600',
      link: '/map',
    },
    {
      icon: Bell,
      title: 'Thông báo Nhắc nhở',
      description: 'Nhận thông báo push tự động để nhắc nhở trả ly đúng hạn. Không bao giờ quên trả ly nữa!',
      color: 'from-purple-500 to-purple-600',
      link: '/notifications',
    },
    {
      icon: Users,
      title: 'Green Feed',
      description: 'Chia sẻ khoảnh khắc sống xanh, tương tác với cộng đồng. Like, comment và lan tỏa tinh thần bảo vệ môi trường.',
      color: 'from-teal-500 to-cyan-600',
      link: '/feed',
    },
    {
      icon: Leaf,
      title: 'Theo dõi Tác động',
      description: 'Xem số ly đã cứu, lượng nhựa giảm thiểu và thời gian ô nhiễm được ngăn chặn. Mỗi hành động đều có ý nghĩa.',
      color: 'from-emerald-500 to-green-600',
      link: '/tree',
    },
    {
      icon: Smartphone,
      title: 'Thiết kế Hiện đại',
      description: 'Giao diện đẹp mắt, dễ sử dụng, tối ưu cho mobile. Trải nghiệm mượt mà trên mọi thiết bị.',
      color: 'from-indigo-500 to-blue-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-soft sticky top-0 z-40 border-b border-primary-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Về trang chủ</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
              Tính năng
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
            Tính năng nổi bật
          </h1>
          <p className="text-xl text-dark-600 max-w-3xl mx-auto">
            Tất cả những gì bạn cần để sống xanh một cách dễ dàng và thú vị
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-soft p-6 hover:shadow-medium transition-all hover:scale-105"
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-dark-900">{feature.title}</h3>
              <p className="text-dark-600 leading-relaxed mb-4">{feature.description}</p>
              {feature.link && (
                <Link
                  href={feature.link}
                  className="text-primary-600 font-medium hover:text-primary-700 transition-colors inline-flex items-center gap-1"
                >
                  Khám phá ngay →
                </Link>
              )}
            </motion.div>
          ))}
        </div>

        {/* Benefits Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl shadow-soft p-8 md:p-12 text-white mb-16"
        >
          <h2 className="text-3xl font-bold mb-8 text-center">Tại sao chọn CupSipMart?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Leaf className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Dễ sử dụng</h3>
                <p className="opacity-90">Giao diện đơn giản, quy trình rõ ràng. Chỉ cần quét QR là xong!</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Tiết kiệm chi phí</h3>
                <p className="opacity-90">Nhận ưu đãi giảm giá khi mượn ly. Tiền cọc được hoàn lại 100%.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Gamification</h3>
                <p className="opacity-90">Tích điểm, lên rank, thi đua với bạn bè. Sống xanh trở nên thú vị!</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Linh hoạt</h3>
                <p className="opacity-90">Trả ly tại bất kỳ quán nào trong hệ thống. Không cần trả tại nơi mượn.</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-primary-100 to-primary-50 rounded-3xl p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-4 text-dark-900">Bắt đầu ngay hôm nay</h2>
            <p className="text-lg text-dark-700 mb-6 max-w-2xl mx-auto">
              Khám phá tất cả các tính năng và trải nghiệm sống xanh cùng CupSipMart
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
            >
              Đăng ký miễn phí
            </Link>
          </div>
        </motion.section>
      </main>
    </div>
  );
}

