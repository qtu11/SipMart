'use client';

import { motion } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
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
            <FileText className="w-6 h-6 text-primary-600" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
              Điều khoản Sử dụng
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
          <h1 className="text-4xl font-bold mb-4 text-dark-900">Điều khoản Sử dụng</h1>
          <p className="text-sm text-dark-500 mb-8">Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-dark-900">1. Chấp nhận điều khoản</h2>
            <p className="text-dark-700 leading-relaxed">
              Bằng việc sử dụng ứng dụng CupSipMart, bạn đồng ý tuân thủ các điều khoản và điều kiện này. 
              Nếu không đồng ý, vui lòng không sử dụng dịch vụ.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-dark-900">2. Đăng ký tài khoản</h2>
            <ul className="list-disc list-inside text-dark-700 space-y-2">
              <li>Bạn phải cung cấp thông tin chính xác khi đăng ký</li>
              <li>Chịu trách nhiệm bảo mật tài khoản và mật khẩu</li>
              <li>Phải từ 18 tuổi trở lên hoặc có sự đồng ý của phụ huynh</li>
              <li>Một người chỉ được đăng ký một tài khoản</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-dark-900">3. Sử dụng dịch vụ</h2>
            <h3 className="text-xl font-semibold mb-3 text-dark-800">3.1. Mượn và trả ly</h3>
            <ul className="list-disc list-inside text-dark-700 space-y-2 mb-4">
              <li>Bạn có trách nhiệm trả ly đúng hạn</li>
              <li>Phải trả tiền cọc khi mượn ly</li>
              <li>Nếu làm mất hoặc hỏng ly, bạn phải bồi thường</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-dark-800">3.2. Ví điện tử</h3>
            <ul className="list-disc list-inside text-dark-700 space-y-2 mb-4">
              <li>Số dư trong ví không thể rút tiền mặt</li>
              <li>Chỉ được sử dụng để mượn ly và các dịch vụ trong ứng dụng</li>
              <li>Chúng tôi không chịu trách nhiệm nếu bạn chia sẻ thông tin thanh toán</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-dark-800">3.3. Green Points</h3>
            <ul className="list-disc list-inside text-dark-700 space-y-2">
              <li>Green Points không có giá trị tiền tệ</li>
              <li>Không thể chuyển nhượng hoặc bán</li>
              <li>Có thể bị điều chỉnh theo quy định của hệ thống</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-dark-900">4. Hành vi bị cấm</h2>
            <ul className="list-disc list-inside text-dark-700 space-y-2">
              <li>Sử dụng ứng dụng cho mục đích bất hợp pháp</li>
              <li>Gian lận, hack, hoặc thao túng hệ thống</li>
              <li>Đăng nội dung phản cảm, lừa đảo, hoặc vi phạm bản quyền</li>
              <li>Spam, quấy rối người dùng khác</li>
              <li>Chia sẻ tài khoản với người khác</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-dark-900">5. Quyền sở hữu trí tuệ</h2>
            <p className="text-dark-700 leading-relaxed">
              Tất cả nội dung, logo, thiết kế trong ứng dụng thuộc quyền sở hữu của CupSipMart. 
              Bạn không được sao chép, phân phối hoặc sử dụng cho mục đích thương mại mà không có sự cho phép.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-dark-900">6. Miễn trừ trách nhiệm</h2>
            <p className="text-dark-700 leading-relaxed mb-4">
              Chúng tôi không chịu trách nhiệm về:
            </p>
            <ul className="list-disc list-inside text-dark-700 space-y-2">
              <li>Thiệt hại do sử dụng hoặc không thể sử dụng dịch vụ</li>
              <li>Mất mát dữ liệu do lỗi kỹ thuật</li>
              <li>Hành vi của người dùng khác</li>
              <li>Thiệt hại gián tiếp hoặc hậu quả phát sinh</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-dark-900">7. Chấm dứt tài khoản</h2>
            <p className="text-dark-700 leading-relaxed mb-4">
              Chúng tôi có quyền đình chỉ hoặc chấm dứt tài khoản của bạn nếu:
            </p>
            <ul className="list-disc list-inside text-dark-700 space-y-2">
              <li>Vi phạm điều khoản sử dụng</li>
              <li>Gian lận hoặc lạm dụng hệ thống</li>
              <li>Không sử dụng tài khoản trong thời gian dài</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-dark-900">8. Thay đổi điều khoản</h2>
            <p className="text-dark-700 leading-relaxed">
              Chúng tôi có quyền thay đổi điều khoản bất cứ lúc nào. 
              Thay đổi sẽ có hiệu lực sau khi được đăng tải. 
              Việc tiếp tục sử dụng dịch vụ được coi là chấp nhận điều khoản mới.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-dark-900">9. Liên hệ</h2>
            <p className="text-dark-700 leading-relaxed mb-4">
              Nếu có câu hỏi về điều khoản, vui lòng liên hệ:
            </p>
            <div className="p-4 bg-primary-50 rounded-xl">
              <p className="text-dark-700"><strong>Email:</strong> support@cupsipmart.com</p>
              <p className="text-dark-700"><strong>Điện thoại:</strong> +84 123 456 789</p>
            </div>
          </section>
        </motion.div>
      </main>
    </div>
  );
}

