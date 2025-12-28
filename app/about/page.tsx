'use client';

import { motion } from 'framer-motion';
import { Leaf, Users, Target, Heart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
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
              CupSipMart
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
            Về CupSipMart
          </h1>
          <p className="text-xl text-dark-600 max-w-2xl mx-auto">
            Hệ thống mượn trả ly tái sử dụng thông minh, góp phần xây dựng tương lai xanh cho thế hệ Gen Z
          </p>
        </motion.div>

        {/* Mission Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-16"
        >
          <div className="bg-white rounded-3xl shadow-soft p-8 md:p-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-dark-900">Sứ mệnh của chúng tôi</h2>
            </div>
            <p className="text-lg text-dark-700 leading-relaxed mb-6">
              CupSipMart được sinh ra từ tầm nhìn về một tương lai không còn rác thải nhựa dùng một lần. 
              Chúng tôi tin rằng bằng cách thay đổi cách chúng ta uống nước, chúng ta có thể tạo ra 
              tác động tích cực lâu dài đến môi trường.
            </p>
            <p className="text-lg text-dark-700 leading-relaxed">
              Mỗi ly tái sử dụng không chỉ giảm 15g nhựa mà còn ngăn chặn 450 năm ô nhiễm. 
              Với mô hình "Sip Smart", chúng tôi làm cho việc sống xanh trở nên dễ dàng, 
              tiện lợi và thú vị hơn bao giờ hết.
            </p>
          </div>
        </motion.section>

        {/* Values Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-12 text-dark-900">Giá trị cốt lõi</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Leaf,
                title: 'Bền vững',
                description: 'Cam kết giảm thiểu rác thải nhựa và bảo vệ môi trường cho thế hệ tương lai.',
                color: 'from-green-500 to-green-600',
              },
              {
                icon: Users,
                title: 'Cộng đồng',
                description: 'Xây dựng cộng đồng Gen Z có ý thức môi trường, cùng nhau hành động vì tương lai xanh.',
                color: 'from-blue-500 to-blue-600',
              },
              {
                icon: Heart,
                title: 'Đổi mới',
                description: 'Ứng dụng công nghệ để tạo ra trải nghiệm sống xanh tiện lợi và thú vị nhất.',
                color: 'from-primary-500 to-primary-600',
              },
            ].map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white rounded-2xl shadow-soft p-6 hover:shadow-medium transition-shadow"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${value.color} rounded-xl flex items-center justify-center mb-4`}>
                  <value.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-dark-900">{value.title}</h3>
                <p className="text-dark-600 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Impact Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl shadow-soft p-8 md:p-12 text-white">
            <h2 className="text-3xl font-bold mb-8 text-center">Tác động của chúng tôi</h2>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-5xl font-bold mb-2">0.015kg</div>
                <p className="text-lg opacity-90">Nhựa giảm thiểu mỗi ly</p>
              </div>
              <div>
                <div className="text-5xl font-bold mb-2">450 năm</div>
                <p className="text-lg opacity-90">Ô nhiễm được ngăn chặn</p>
              </div>
              <div>
                <div className="text-5xl font-bold mb-2">100%</div>
                <p className="text-lg opacity-90">Ly có thể tái sử dụng</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Team Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-8 text-dark-900">Đội ngũ của chúng tôi</h2>
          <div className="bg-white rounded-3xl shadow-soft p-8 md:p-12">
            <p className="text-lg text-dark-700 leading-relaxed mb-6">
              CupSipMart được phát triển bởi một đội ngũ trẻ, đam mê với môi trường và công nghệ. 
              Chúng tôi đến từ các trường đại học hàng đầu, với mong muốn tạo ra sự thay đổi tích cực 
              trong cộng đồng sinh viên.
            </p>
            <p className="text-lg text-dark-700 leading-relaxed">
              Chúng tôi hợp tác chặt chẽ với các quán nước đối tác, nhà trường và các tổ chức môi trường 
              để xây dựng hệ sinh thái bền vững, nơi mỗi người đều có thể đóng góp vào việc bảo vệ hành tinh.
            </p>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-primary-100 to-primary-50 rounded-3xl p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-4 text-dark-900">Tham gia cùng chúng tôi</h2>
            <p className="text-lg text-dark-700 mb-6 max-w-2xl mx-auto">
              Hãy cùng chúng tôi tạo ra tác động tích cực đến môi trường. 
              Mỗi hành động nhỏ của bạn đều tạo nên sự khác biệt lớn.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
            >
              Bắt đầu ngay
            </Link>
          </div>
        </motion.section>
      </main>
    </div>
  );
}

