'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Leaf, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Github, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Về CupSipMart', href: '/about' },
      { name: 'Cách hoạt động', href: '/how-it-works' },
      { name: 'Tính năng', href: '/features' },
      { name: 'Bảng xếp hạng', href: '/leaderboard' },
    ],
    support: [
      { name: 'Trợ giúp', href: '/help' },
      { name: 'Câu hỏi thường gặp', href: '/help#faq' },
      { name: 'Liên hệ', href: '/contact' },
    ],
    legal: [
      { name: 'Chính sách bảo mật', href: '/privacy' },
      { name: 'Điều khoản sử dụng', href: '/terms' },
      { name: 'Chính sách cookie', href: '/cookies' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com/cupsipmart', label: 'Facebook' },
    { icon: Instagram, href: 'https://instagram.com/cupsipmart', label: 'Instagram' },
    { icon: Twitter, href: 'https://twitter.com/cupsipmart', label: 'Twitter' },
    { icon: Github, href: 'https://github.com/cupsipmart', label: 'GitHub' },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-dark-900 to-dark-800 text-white border-t border-dark-700">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-500" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 mb-8 sm:mb-12">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="sm:col-span-2 lg:col-span-1"
          >
            <Link href="/" className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Leaf className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">
                  CupSipMart
                </h3>
                <p className="text-xs sm:text-sm text-dark-300">Mượn ly, Cứu hành tinh</p>
              </div>
            </Link>
            <p className="text-dark-300 text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed">
              Hệ thống mượn trả ly tái sử dụng thông minh, giúp giảm thiểu rác thải nhựa và bảo vệ môi trường cho thế hệ tương lai.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-dark-300">
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-400 flex-shrink-0" />
                <a href="mailto:contact@cupsipmart.com" className="hover:text-primary-400 transition-colors break-all">
                  contact@cupsipmart.com
                </a>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-dark-300">
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-400 flex-shrink-0" />
                <a href="tel:+84123456789" className="hover:text-primary-400 transition-colors">
                  +84 123 456 789
                </a>
              </div>
              <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-dark-300">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                <span>Khu vực Làng Đại học, TP.HCM, Việt Nam</span>
              </div>
            </div>
          </motion.div>

          {/* Product Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-primary-400">Sản phẩm</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-dark-300 hover:text-primary-400 transition-colors text-xs sm:text-sm flex items-center gap-2 group active:text-primary-400"
                  >
                    <span className="w-0 group-hover:w-1.5 h-0.5 bg-primary-400 transition-all duration-200" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Support Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-primary-400">Hỗ trợ</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.support.filter((link, index, self) => 
                index === self.findIndex(l => l.name === link.name)
              ).map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-dark-300 hover:text-primary-400 transition-colors text-xs sm:text-sm flex items-center gap-2 group active:text-primary-400"
                  >
                    <span className="w-0 group-hover:w-1.5 h-0.5 bg-primary-400 transition-all duration-200" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="sm:col-span-2 lg:col-span-1"
          >
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-primary-400">Pháp lý</h4>
            <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-0">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-dark-300 hover:text-primary-400 transition-colors text-xs sm:text-sm flex items-center gap-2 group active:text-primary-400"
                  >
                    <span className="w-0 group-hover:w-1.5 h-0.5 bg-primary-400 transition-all duration-200" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Social Links */}
            <div className="mt-6 sm:mt-8 lg:mt-8">
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-primary-400">Kết nối</h4>
              <div className="flex items-center gap-3 sm:gap-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="w-9 h-9 sm:w-10 sm:h-10 bg-dark-700 hover:bg-primary-500 active:bg-primary-600 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 hover:shadow-lg hover:shadow-primary-500/50 group"
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-dark-300 group-hover:text-white transition-colors" />
                    </a>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="border-t border-dark-700 pt-6 sm:pt-8 mt-6 sm:mt-8"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="text-xs sm:text-sm text-dark-400 text-center md:text-left">
              <p>
                © {currentYear} CupSipMart. Made with{' '}
                <Heart className="inline w-3 h-3 sm:w-4 sm:h-4 text-red-500 fill-red-500" /> for a greener future.
              </p>
            </div>
            <div className="text-xs sm:text-sm text-dark-400 text-center md:text-left">
              <p>
                CupSipMart. Bản quyền thuộc Nguyễn Quang Tú - Đại học Kinh Tế Tài chính UEF
                </p>
            </div>
            <div className="hidden sm:flex items-center gap-6 text-sm text-dark-400">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Tất cả hệ thống hoạt động bình thường
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Gradient overlay at bottom */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-dark-900 to-transparent pointer-events-none" />
    </footer>
  );
}

