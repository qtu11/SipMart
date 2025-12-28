'use client';

import { motion } from 'framer-motion';
import { QrCode, ArrowRight, Clock, MapPin, Recycle, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function HowItWorksPage() {
  const steps = [
    {
      icon: QrCode,
      step: 1,
      title: 'Mượn ly',
      description: 'Đến quán nước bất kỳ trong hệ thống, quét mã QR trên ly tái sử dụng để mượn.',
      details: [
        'Quét mã QR bằng camera hoặc chọn ảnh từ gallery',
        'Đóng tiền cọc 10.000đ - 15.000đ (sẽ hoàn lại khi trả)',
        'Nhận ngay ưu đãi giảm giá 2.000đ - 5.000đ',
      ],
    },
    {
      icon: Clock,
      step: 2,
      title: 'Sử dụng & Nhắc nhở',
      description: 'Mang ly đi học, đi làm. Hệ thống sẽ tự động gửi thông báo nhắc nhở trả ly.',
      details: [
        'Nhận thông báo Push Notification tự động',
        'Theo dõi thời gian mượn trong app',
        'Nhắc nhở trả ly đúng hạn để nhận thêm Green Points',
      ],
    },
    {
      icon: MapPin,
      step: 3,
      title: 'Trả ly linh hoạt',
      description: 'Trả ly tại bất kỳ quán nào trong hệ thống hoặc trạm thu gom tự động.',
      details: [
        'Quét lại mã QR của ly đang mượn',
        'Chọn cửa hàng trả (không nhất thiết quán đã mượn)',
        'Hoặc trả tại các trạm thu gom tự động tại trường',
      ],
    },
    {
      icon: Recycle,
      step: 4,
      title: 'Hoàn cọc & Tái sử dụng',
      description: 'Nhận lại tiền cọc vào ví và tích Green Points. Ly được vệ sinh để tái sử dụng.',
      details: [
        'Tiền cọc được hoàn tự động vào ví điện tử',
        'Tích Green Points: +50 điểm (trả đúng hạn) hoặc +20 điểm (quá hạn)',
        'Ly được vệ sinh đạt chuẩn và sẵn sàng cho khách hàng tiếp theo',
      ],
    },
  ];

  const principles = [
    {
      title: 'Mạng lưới (Network is King)',
      description: 'Giá trị của hệ thống nằm ở sự bao phủ. Càng nhiều quán tham gia và nhiều điểm trả ly, sinh viên càng dễ dàng thực hiện hành vi trả ly.',
    },
    {
      title: 'Tiện lợi hóa (Seamless Experience)',
      description: 'Công nghệ QR và Mini App giúp quy trình diễn ra trong vài giây, không cần tải app mới, vượt qua rào cản về sự lười biếng.',
    },
    {
      title: 'Niềm tin thị giác (Visual Trust)',
      description: 'Ly mượn được làm từ vật liệu chất lượng cao (nhựa PP chịu nhiệt, sợi tre), thiết kế đẹp và luôn trông sạch sẽ để sinh viên tin tưởng vào quy trình vệ sinh.',
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
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
              Cách hoạt động
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
            Mô hình "Sip Smart"
          </h1>
          <p className="text-xl text-dark-600 max-w-3xl mx-auto">
            Hệ thống mượn-trả ly tuần hoàn quy mô nhỏ tại khu vực làng đại học. 
            Ly là tài sản chung, không thuộc về cá nhân hay quán riêng lẻ nào.
          </p>
        </motion.div>

        {/* Steps Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-dark-900">5 Bước đơn giản</h2>
          <div className="space-y-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-6 items-center`}
              >
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <step.icon className="w-12 h-12 text-white" />
                  </div>
                  <div className="text-center mt-4">
                    <span className="text-3xl font-bold text-primary-600">Bước {step.step}</span>
                  </div>
                </div>
                <div className="flex-1 bg-white rounded-2xl shadow-soft p-6 md:p-8">
                  <h3 className="text-2xl font-bold mb-3 text-dark-900">{step.title}</h3>
                  <p className="text-lg text-dark-700 mb-4">{step.description}</p>
                  <ul className="space-y-2">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-dark-600">
                        <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Principles Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-dark-900">Nguyên lý hoạt động</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {principles.map((principle, index) => (
              <motion.div
                key={principle.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="bg-white rounded-2xl shadow-soft p-6 hover:shadow-medium transition-shadow"
              >
                <h3 className="text-xl font-bold mb-3 text-primary-600">{principle.title}</h3>
                <p className="text-dark-600 leading-relaxed">{principle.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl shadow-soft p-8 md:p-12 text-white"
        >
          <h2 className="text-3xl font-bold mb-8 text-center">Lợi ích của mô hình</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              'Giảm thiểu rác thải nhựa dùng một lần',
              'Tiết kiệm chi phí cho quán nước (không cần mua ly nhựa)',
              'Sinh viên nhận ưu đãi giảm giá ngay khi mượn ly',
              'Tạo động lực sống xanh thông qua Green Points và ranking',
              'Xây dựng cộng đồng có ý thức môi trường',
              'Trải nghiệm tiện lợi, không cần mang theo ly',
            ].map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                <span className="text-lg">{benefit}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-primary-100 to-primary-50 rounded-3xl p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-4 text-dark-900">Sẵn sàng thử nghiệm?</h2>
            <p className="text-lg text-dark-700 mb-6 max-w-2xl mx-auto">
              Tham gia ngay để trải nghiệm mô hình "Sip Smart" và góp phần bảo vệ môi trường.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/scan"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
              >
                Quét QR ngay
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 bg-white text-primary-600 px-8 py-4 rounded-xl font-semibold border-2 border-primary-500 hover:bg-primary-50 transition-all"
              >
                Đăng ký tài khoản
              </Link>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}

