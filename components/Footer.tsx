'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Leaf, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Github, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Về SipSmart', href: '/about' },
      { name: 'Cách hoạt động', href: '/how-it-works' },
      { name: 'Tính năng', href: '/features' },
      { name: 'Bảng xếp hạng', href: '/leaderboard' },
    ],
    legal: [
      { name: 'Chính sách bảo mật', href: '/privacy' },
      { name: 'Điều khoản sử dụng', href: '/terms' },
      { name: 'Chính sách cookie', href: '/cookies' },
      { name: 'Trợ giúp', href: '/help' },
      { name: 'Câu hỏi thường gặp', href: '/help#faq' },
      { name: 'Liên hệ', href: '/contact' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com/sipsmart', label: 'Facebook' },
    { icon: Instagram, href: 'https://instagram.com/sipsmart', label: 'Instagram' },
    { icon: Twitter, href: 'https://twitter.com/sipsmart', label: 'Twitter' },
    { icon: Github, href: 'https://github.com/sipsmart', label: 'GitHub' },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-dark-900 to-dark-800 text-white border-t border-dark-700">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        {/* Brand Section - Full Width on Mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-6 sm:mb-12"
        >
          <Link href="/" className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4 group">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Leaf className="w-4 h-4 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">
                SipSmart
              </h3>
              <p className="text-[10px] sm:text-sm text-dark-300">Mượn ly, Cứu hành tinh</p>
            </div>
          </Link>
          <p className="text-dark-300 text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed max-w-2xl">
            Hệ thống mượn trả ly tái sử dụng thông minh, giúp giảm thiểu rác thải nhựa và bảo vệ môi trường cho thế hệ tương lai.
          </p>

          {/* Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 max-w-3xl">
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-dark-300">
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-400 flex-shrink-0" />
              <a href="mailto:contact@sipsmart.com" className="hover:text-primary-400 transition-colors break-all">
                contact@sipsmart.com
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
              <span>Khu vực Làng Đại học, TP.HCM</span>
            </div>
          </div>
        </motion.div>

        {/* 3 Columns: Products | Legal & Support | Connect */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8 sm:gap-8 lg:gap-12 mb-8 sm:mb-12">

          {/* Column 1: Sản phẩm */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="text-sm sm:text-lg font-bold mb-3 sm:mb-4 text-white">Sản phẩm</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-primary-400 transition-colors text-xs sm:text-sm flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-1.5 h-0.5 bg-primary-400 transition-all duration-200" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Column 2: Pháp lý & Hỗ trợ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="text-sm sm:text-lg font-bold mb-3 sm:mb-4 text-white">Pháp lý & Hỗ trợ</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-primary-400 transition-colors text-xs sm:text-sm flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-1.5 h-0.5 bg-primary-400 transition-all duration-200" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Column 3: Kết nối + Logo Bộ Công Thương - Full width on very small screens if needed, or col-span-2 on mobile? Let's keep it in flow or stick to grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="col-span-2 lg:col-span-1"
          >
            <h4 className="text-sm sm:text-lg font-bold mb-3 sm:mb-4 text-white">Kết nối với SipSmart</h4>
            <div className="flex items-center gap-3 mb-6">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-dark-700/50 hover:bg-primary-500 rounded-full flex items-center justify-center transition-all duration-200 border border-dark-600 hover:border-primary-500 hover:scale-105"
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 group-hover:text-white transition-colors" />
                  </a>
                );
              })}
            </div>

            {/* Logo Bộ Công Thương */}
            <div>
              <h5 className="text-xs font-medium mb-2 text-gray-400">Đã đăng ký với Bộ Công Thương</h5>
              <a
                href="http://online.gov.vn/Home/WebDetails/108058"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-white/5 p-2 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
              >
                <Image
                  src="/bocongthuong.png"
                  alt="Logo Bộ Công Thương"
                  width={100}
                  height={38}
                  className="h-8 sm:h-10 w-auto object-contain brightness-0 invert opacity-80 hover:opacity-100 transition-opacity"
                />
              </a>
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
                © {currentYear} SipSmart. Made with{' '}
                <Heart className="inline w-3 h-3 sm:w-4 sm:h-4 text-red-500 fill-red-500" /> for a greener future.
              </p>
            </div>
            <div className="text-xs sm:text-sm text-dark-400 text-center md:text-left">
              <p>
                SipSmart. Bản quyền thuộc Nguyễn Quang Tú - Đại học Kinh Tế Tài chính UEF
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm text-dark-400">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="whitespace-nowrap">Hệ thống hoạt động</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Gradient overlay at bottom */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-dark-900 to-transparent pointer-events-none" />
    </footer>
  );
}
