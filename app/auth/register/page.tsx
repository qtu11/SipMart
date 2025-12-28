'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import { signUpWithEmail } from '@/lib/supabase/auth';

declare global {
  interface Window {
    grecaptcha: any;
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

    setLoading(true);
    try {
      // Verify reCAPTCHA (skip nếu không có)
      let recaptchaPassed = false;
      if (window.grecaptcha) {
        try {
          const token = await window.grecaptcha.enterprise.execute(
            '6Lc-jjcsAAAAANH3H3PqDGVuHvqNW-A2DvfObniN',
            { action: 'REGISTER' }
          );

          // Verify token với backend
          const verifyRes = await fetch('/api/auth/verify-recaptcha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, action: 'REGISTER' }),
          });

          const verifyData = await verifyRes.json();
          recaptchaPassed = verifyData.success && (verifyData.score >= 0.5 || verifyData.message?.includes('Development'));
        } catch (error) {
          console.warn('reCAPTCHA error, continuing without verification:', error);
          recaptchaPassed = true; // Skip trong dev mode
        }
      } else {
        // Development mode - skip reCAPTCHA
        recaptchaPassed = true;
      }

      if (!recaptchaPassed) {
        toast.error('Xác thực không thành công. Vui lòng thử lại.');
        setLoading(false);
        return;
      }

      // Đăng ký với Supabase
      const user = await signUpWithEmail(
        formData.email,
        formData.password,
        formData.displayName,
        formData.studentId || undefined
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
      
      toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.');
      
      // Delay một chút để user thấy message
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (error: any) {
      console.error('Register error:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email đã được sử dụng');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Mật khẩu quá yếu');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Email không hợp lệ');
      } else {
        toast.error('Đăng ký thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600 mb-2">CupSipMart</h1>
          <p className="text-dark-500">Tham gia cộng đồng sống xanh 🌱</p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-2xl shadow-medium p-8">
          <h2 className="text-2xl font-semibold text-dark-800 mb-6">Đăng ký</h2>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className="w-full pl-12 pr-4 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-dark-100 text-dark-600 placeholder:text-dark-400"
                  required
                />
              </div>
            </div>

            {/* Student ID (Optional) */}
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Mã sinh viên
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  placeholder="SV001234"
                  className="w-full pl-12 pr-4 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-dark-100 text-dark-600 placeholder:text-dark-400"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your.email@example.com"
                  className="w-full pl-12 pr-4 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-dark-100 text-dark-600 placeholder:text-dark-400"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full pl-12 pr-12 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-dark-100 text-dark-600 placeholder:text-dark-400"
                  required
                  minLength={6}
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
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full pl-12 pr-12 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-dark-100 text-dark-600 placeholder:text-dark-400"
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 text-white rounded-xl py-3 font-semibold shadow-medium hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
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
          <div className="mt-6 text-center">
            <p className="text-sm text-dark-500">
              Đã có tài khoản?{' '}
              <Link href="/auth/login" className="text-primary-600 font-semibold hover:underline">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

