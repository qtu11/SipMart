'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import { signUpWithEmail } from '@/lib/supabase/auth';
import HCaptcha from '@hcaptcha/react-hcaptcha';

declare global {
  interface Window {
    hcaptcha: any;
  }
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    studentId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.password || !formData.displayName) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    if (!captchaToken) {
      toast.error('Vui lòng xác nhận bạn không phải người máy');
      return;
    }

    setLoading(true);
    try {
      // Đăng ký với Supabase kèm captcha token
      const user = await signUpWithEmail(
        formData.email,
        formData.password,
        formData.displayName,
        formData.studentId || undefined,
        captchaToken
      );

      // Gửi email thông báo đăng ký
      try {
        await fetch('/api/email/send-welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            displayName: formData.displayName,
            userId: user.id,
          }),
        });
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Không block đăng ký nếu email fail
      }

      // Check nếu email confirmation được bật
      // Nếu user chưa confirm, Supabase sẽ trả về user nhưng email_confirmed_at = null
      if (user.email_confirmed_at) {
        toast.success('Đăng ký thành công!');
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } else {
        toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    } catch (error: unknown) {
      console.error('Registration error:', error);
      toast.error(error instanceof Error ? error.message : 'Đăng ký thất bại');
    } finally {
      if (window.hcaptcha) window.hcaptcha.reset();
      setCaptchaToken(null);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md my-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600 mb-2">CupSipMart</h1>
          <p className="text-dark-500">Tham gia cộng đồng xanh 🌿</p>
        </div>

        <div className="bg-white rounded-2xl shadow-medium p-8">
          <h2 className="text-2xl font-semibold text-dark-800 mb-6">Đăng ký tài khoản</h2>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Họ và tên
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className="w-full pl-12 pr-4 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-dark-100 text-dark-800 placeholder:text-dark-400"
                  required
                />
              </div>
            </div>

            {/* Student ID */}
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Mã số sinh viên (nếu có)
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  placeholder="202xxxxx"
                  className="w-full pl-12 pr-4 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-dark-100 text-dark-800 placeholder:text-dark-400"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@university.edu.vn"
                  className="w-full pl-12 pr-4 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-dark-100 text-dark-800 placeholder:text-dark-400"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-dark-100 text-dark-800 placeholder:text-dark-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-dark-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-dark-100 text-dark-800 placeholder:text-dark-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-dark-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* HCaptcha */}
            <div className="flex justify-center my-4">
              <HCaptcha
                sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001'}
                onVerify={(token) => setCaptchaToken(token)}
                ref={captchaRef}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 text-white rounded-xl py-3 font-semibold shadow-medium hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                'Đang xử lý...'
              ) : (
                <>
                  Đăng ký
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          < div className="mt-6 text-center" >
            <p className="text-sm text-dark-500">
              Đã có tài khoản?{' '}
              <Link href="/auth/login" className="text-primary-600 font-semibold hover:underline">
                Đăng nhập ngay
              </Link>
            </p>
          </div >
        </div >
      </motion.div >
    </div >
  );
}

