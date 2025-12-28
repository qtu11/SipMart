'use client';

import { motion } from 'framer-motion';
import { Cookie, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-soft sticky top-0 z-40 border-b border-primary-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Về trang chủ</span>
          </Link>
          <div className="flex items-center gap-3">
            <Cookie className="w-6 h-6 text-primary-600" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
              Chính sách Cookie
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-soft p-8 md:p-12"
        >
          <h1 className="text-4xl font-bold mb-4 text-dark-900">Chính sách Cookie</h1>
          <p className="text-sm text-dark-500 mb-8">Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-dark-900">1. Cookie là gì?</h2>
            <p className="text-dark-700 leading-relaxed">
              Cookie là các tệp văn bản nhỏ được lưu trữ trên thiết bị của bạn khi bạn truy cập website hoặc ứng dụng. 
              Chúng giúp website ghi nhớ thông tin về bạn và cải thiện trải nghiệm sử dụng.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-dark-900">2. Cookie chúng tôi sử dụng</h2>
            
            <h3 className="text-xl font-semibold mb-3 text-dark-800">2.1. Cookie thiết yếu</h3>
            <p className="text-dark-700 leading-relaxed mb-4">
              Những cookie này cần thiết để ứng dụng hoạt động. Chúng bao gồm:
            </p>
            <ul className="list-disc list-inside text-dark-700 space-y-2 mb-6">
              <li>Cookie phiên đăng nhập (session cookies)</li>
              <li>Cookie xác thực người dùng</li>
              <li>Cookie bảo mật và CSRF protection</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-dark-800">2.2. Cookie phân tích</h3>
            <p className="text-dark-700 leading-relaxed mb-4">
              Chúng tôi sử dụng các công cụ phân tích để hiểu cách người dùng tương tác với ứng dụng:
            </p>
            <ul className="list-disc list-inside text-dark-700 space-y-2 mb-6">
              <li>Google Analytics (nếu được kích hoạt)</li>
              <li>Firebase Analytics</li>
              <li>Cookie theo dõi hành vi người dùng</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-dark-800">2.3. Cookie chức năng</h3>
            <p className="text-dark-700 leading-relaxed mb-4">
              Những cookie này cho phép ứng dụng ghi nhớ lựa chọn của bạn:
            </p>
            <ul className="list-disc list-inside text-dark-700 space-y-2">
              <li>Cookie ngôn ngữ và khu vực</li>
              <li>Cookie cài đặt giao diện (dark/light mode)</li>
              <li>Cookie tùy chọn người dùng</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-dark-900">3. Cookie của bên thứ ba</h2>
            <p className="text-dark-700 leading-relaxed mb-4">
              Chúng tôi có thể sử dụng cookie từ các dịch vụ bên thứ ba:
            </p>
            <ul className="list-disc list-inside text-dark-700 space-y-2">
              <li><strong>Firebase:</strong> Xác thực, lưu trữ dữ liệu, phân tích</li>
              <li><strong>Google Maps:</strong> Hiển thị bản đồ và vị trí</li>
              <li><strong>reCAPTCHA:</strong> Bảo vệ khỏi spam và bot</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-dark-900">4. Quản lý Cookie</h2>
            <p className="text-dark-700 leading-relaxed mb-4">
              Bạn có thể quản lý hoặc xóa cookie thông qua cài đặt trình duyệt:
            </p>
            <ul className="list-disc list-inside text-dark-700 space-y-2 mb-4">
              <li><strong>Chrome:</strong> Cài đặt → Quyền riêng tư → Cookie</li>
              <li><strong>Firefox:</strong> Tùy chọn → Quyền riêng tư → Cookie</li>
              <li><strong>Safari:</strong> Tùy chọn → Quyền riêng tư → Cookie</li>
            </ul>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-dark-700">
                <strong>Lưu ý:</strong> Vô hiệu hóa cookie có thể ảnh hưởng đến chức năng của ứng dụng. 
                Một số tính năng có thể không hoạt động bình thường.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-dark-900">5. Thời gian lưu trữ</h2>
            <ul className="list-disc list-inside text-dark-700 space-y-2">
              <li><strong>Cookie phiên:</strong> Xóa khi bạn đóng trình duyệt</li>
              <li><strong>Cookie lâu dài:</strong> Lưu trữ trong thời gian nhất định (thường 30-365 ngày)</li>
              <li><strong>Cookie vĩnh viễn:</strong> Lưu trữ cho đến khi bạn xóa thủ công</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-dark-900">6. Liên hệ</h2>
            <p className="text-dark-700 leading-relaxed mb-4">
              Nếu có câu hỏi về chính sách cookie, vui lòng liên hệ:
            </p>
            <div className="p-4 bg-primary-50 rounded-xl">
              <p className="text-dark-700"><strong>Email:</strong> privacy@cupsipmart.com</p>
              <p className="text-dark-700"><strong>Điện thoại:</strong> +84 123 456 789</p>
            </div>
          </section>
        </motion.div>
      </main>
    </div>
  );
}

