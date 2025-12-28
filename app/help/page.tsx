'use client';

import { motion } from 'framer-motion';
import { HelpCircle, QrCode, Wallet, Trophy, Leaf, MessageCircle } from 'lucide-react';
import Link from 'next/link';

const faqs = [
  {
    question: 'Làm thế nào để mượn ly?',
    answer: 'Vào trang "Quét QR", quét mã QR trên ly, chọn cửa hàng và xác nhận. Bạn cần có ít nhất 20,000đ trong ví để làm cọc.',
  },
  {
    question: 'Khi nào tôi nhận lại tiền cọc?',
    answer: 'Tiền cọc sẽ được hoàn lại ngay khi bạn trả ly. Trả đúng hạn bạn sẽ nhận 50 Green Points, trả quá hạn chỉ nhận 20 điểm.',
  },
  {
    question: 'Green Points dùng để làm gì?',
    answer: 'Green Points giúp bạn lên rank (seed → sprout → sapling → tree → forest) và thi đua trên bảng xếp hạng. Tích lũy điểm bằng cách trả ly đúng hạn!',
  },
  {
    question: 'Làm sao để nạp tiền vào ví?',
    answer: 'Vào trang "Ví điện tử", chọn số tiền muốn nạp (50k, 100k, 200k) hoặc nhập số tiền tùy ý. Hiện tại hỗ trợ nạp qua ví điện tử.',
  },
  {
    question: 'Tôi có thể trả ly ở cửa hàng khác không?',
    answer: 'Có! Bạn có thể trả ly ở bất kỳ cửa hàng nào trong hệ thống. Quét QR và chọn cửa hàng trả là được.',
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <header className="bg-white/80 backdrop-blur-md shadow-soft px-4 py-4 border-b border-primary-100">
        <h1 className="text-xl font-semibold text-dark-800">Trợ giúp</h1>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/scan">
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white rounded-2xl p-6 shadow-xl border-2 border-primary-100 hover:border-primary-300 transition"
            >
              <QrCode className="w-8 h-8 text-primary-600 mb-3" />
              <h3 className="font-bold text-lg mb-2">Hướng dẫn quét QR</h3>
              <p className="text-sm text-dark-500">Cách mượn và trả ly bằng QR code</p>
            </motion.div>
          </Link>

          <Link href="/wallet">
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white rounded-2xl p-6 shadow-xl border-2 border-blue-100 hover:border-blue-300 transition"
            >
              <Wallet className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-bold text-lg mb-2">Quản lý ví</h3>
              <p className="text-sm text-dark-500">Nạp tiền và quản lý số dư</p>
            </motion.div>
          </Link>

          <Link href="/leaderboard">
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-white rounded-2xl p-6 shadow-xl border-2 border-yellow-100 hover:border-yellow-300 transition"
            >
              <Trophy className="w-8 h-8 text-yellow-600 mb-3" />
              <h3 className="font-bold text-lg mb-2">Green Points</h3>
              <p className="text-sm text-dark-500">Hiểu về hệ thống điểm và ranking</p>
            </motion.div>
          </Link>

          <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-green-100">
            <MessageCircle className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-bold text-lg mb-2">Chat với AI</h3>
            <p className="text-sm text-dark-500">Nhấn vào nút chat ở góc phải màn hình để được hỗ trợ</p>
          </div>
        </div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-xl border-2 border-dark-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <HelpCircle className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-dark-800">Câu hỏi thường gặp</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border-2 border-primary-100 rounded-xl p-5 hover:border-primary-300 transition"
              >
                <h3 className="font-bold text-dark-800 mb-2 flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-primary-600" />
                  {faq.question}
                </h3>
                <p className="text-dark-600 text-sm leading-relaxed">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl p-8 shadow-2xl text-center"
        >
          <h3 className="text-2xl font-bold mb-2">Cần hỗ trợ thêm?</h3>
          <p className="text-primary-100 mb-4">Liên hệ với chúng tôi qua email hoặc chat AI</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:support@cupsipmart.com"
              className="bg-white text-primary-600 px-6 py-3 rounded-xl font-semibold hover:bg-primary-50 transition"
            >
              Gửi email
            </a>
            <button className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition border border-white/30">
              Chat với AI
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

