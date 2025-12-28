'use client';

import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
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
            <Shield className="w-6 h-6 text-primary-600" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
              Chính sách Bảo mật
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
          <h1 className="text-4xl font-bold mb-4 text-dark-900">Chính sách Bảo mật</h1>
          <p className="text-sm text-dark-500 mb-8">Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-dark-900">1. Giới thiệu</h2>
            <p className="text-dark-700 leading-relaxed mb-4">
              CupSipMart cam kết bảo vệ quyền riêng tư của người dùng. Chính sách này mô tả cách chúng tôi 
              thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn khi sử dụng ứng dụng CupSipMart.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-dark-900">2. Thông tin chúng tôi thu thập</h2>
            <h3 className="text-xl font-semibold mb-3 text-dark-800">2.1. Thông tin đăng ký</h3>
            <ul className="list-disc list-inside text-dark-700 space-y-2 mb-4">
              <li>Email, số điện thoại</li>
              <li>Tên hiển thị, avatar (nếu cung cấp)</li>
              <li>Thông tin đăng nhập (mã hóa)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-dark-800">2.2. Thông tin sử dụng</h3>
            <ul className="list-disc list-inside text-dark-700 space-y-2 mb-4">
              <li>Lịch sử mượn/trả ly</li>
              <li>Giao dịch ví điện tử</li>
              <li>Green Points và ranking</li>
              <li>Vị trí địa lý (nếu cấp quyền)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-dark-800">2.3. Thông tin thiết bị</h3>
            <ul className="list-disc list-inside text-dark-700 space-y-2">
              <li>Loại thiết bị, hệ điều hành</li>
              <li>Địa chỉ IP</li>
              <li>Token thiết bị cho push notifications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-dark-900">3. Cách chúng tôi sử dụng thông tin</h2>
            <ul className="list-disc list-inside text-dark-700 space-y-2">
              <li>Cung cấp và cải thiện dịch vụ</li>
              <li>Xử lý giao dịch và quản lý tài khoản</li>
              <li>Gửi thông báo về dịch vụ (mượn/trả ly, cập nhật)</li>
              <li>Phân tích và cải thiện trải nghiệm người dùng</li>
              <li>Tuân thủ nghĩa vụ pháp lý</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-dark-900">4. Chia sẻ thông tin</h2>
            <p className="text-dark-700 leading-relaxed mb-4">
              Chúng tôi không bán thông tin cá nhân của bạn. Chúng tôi chỉ chia sẻ thông tin trong các trường hợp:
            </p>
            <ul className="list-disc list-inside text-dark-700 space-y-2">
              <li>Với nhà cung cấp dịch vụ (Firebase, payment gateway) để vận hành ứng dụng</li>
              <li>Khi được yêu cầu bởi cơ quan pháp luật</li>
              <li>Với sự đồng ý của bạn</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-dark-900">5. Bảo mật dữ liệu</h2>
            <p className="text-dark-700 leading-relaxed">
              Chúng tôi sử dụng các biện pháp bảo mật tiên tiến như mã hóa SSL/TLS, 
              xác thực Firebase, và lưu trữ an toàn trên đám mây để bảo vệ thông tin của bạn.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-dark-900">6. Quyền của bạn</h2>
            <p className="text-dark-700 leading-relaxed mb-4">Bạn có quyền:</p>
            <ul className="list-disc list-inside text-dark-700 space-y-2">
              <li>Truy cập và chỉnh sửa thông tin cá nhân</li>
              <li>Yêu cầu xóa tài khoản</li>
              <li>Từ chối nhận thông báo marketing</li>
              <li>Xuất dữ liệu cá nhân của bạn</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-dark-900">7. Cookie và công nghệ theo dõi</h2>
            <p className="text-dark-700 leading-relaxed">
              Chúng tôi sử dụng cookies để cải thiện trải nghiệm, phân tích lưu lượng truy cập và cá nhân hóa nội dung. 
              Bạn có thể quản lý cookies trong cài đặt trình duyệt.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-dark-900">8. Thay đổi chính sách</h2>
            <p className="text-dark-700 leading-relaxed">
              Chúng tôi có thể cập nhật chính sách này theo thời gian. 
              Thay đổi sẽ được thông báo qua ứng dụng hoặc email.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-dark-900">9. Liên hệ</h2>
            <p className="text-dark-700 leading-relaxed">
              Nếu có câu hỏi về chính sách bảo mật, vui lòng liên hệ:
            </p>
            <div className="mt-4 p-4 bg-primary-50 rounded-xl">
              <p className="text-dark-700"><strong>Email:</strong> privacy@cupsipmart.com</p>
              <p className="text-dark-700"><strong>Điện thoại:</strong> +84 123 456 789</p>
            </div>
          </section>
        </motion.div>
      </main>
    </div>
  );
}

