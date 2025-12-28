'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { signInWithEmail, signInWithGoogle } from '@/lib/supabase/auth';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      // Verify reCAPTCHA (optional - skip nếu không có)
      let recaptchaPassed = true;
      if (window.grecaptcha) {
        try {
          const token = await window.grecaptcha.enterprise.execute(
            '6Lc-jjcsAAAAANH3H3PqDGVuHvqNW-A2DvfObniN',
            { action: 'LOGIN' }
          );

          // Verify token với backend
          const verifyRes = await fetch('/api/auth/verify-recaptcha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, action: 'LOGIN' }),
          });

          const verifyData = await verifyRes.json();
          recaptchaPassed = verifyData.success && (verifyData.score >= 0.5 || verifyData.message?.includes('Development'));
        } catch (error) {
          console.warn('reCAPTCHA error, continuing without verification:', error);
          recaptchaPassed = true; // Skip trong dev mode
        }
      }

      if (!recaptchaPassed) {
        toast.error('Xác thực không thành công. Vui lòng thử lại.');
        setLoading(false);
        return;
      }

      // Đăng nhập với Supabase
      const user = await signInWithEmail(email, password);
      console.log('Login successful, user:', user.email, 'UID:', user.id);
      
      // Check nếu là admin thì redirect đến admin page
      const userEmail = user.email || email;
      
      // Check admin credentials from env
      const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || '';
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '';
      let isAdminEmail = false;
      
      if (adminKey) {
        const adminKeys = adminKey.split(',').map(k => k.trim().toLowerCase());
        isAdminEmail = adminKeys.includes(userEmail.toLowerCase().trim());
      } else {
        // Fallback to hardcoded check
        isAdminEmail = userEmail.toLowerCase() === 'qtusadmin@gmail.com' || 
                      userEmail.toLowerCase() === 'qtusdev@gmail.com' ||
                      userEmail.toLowerCase().includes('qtusadmin') || 
                      userEmail.toLowerCase().includes('qtusdev');
      }
      
      if (isAdminEmail) {
        console.log('Admin login detected, redirecting to /admin');
        toast.success('Đăng nhập thành công! Chào mừng Admin!');
        // Delay nhỏ để toast hiển thị trước khi redirect
        setTimeout(() => {
          router.push('/admin');
        }, 500);
      } else {
        console.log('Regular user login, redirecting to /');
        toast.success('Đăng nhập thành công!');
        router.push('/');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      if (error.code === 'auth/user-not-found') {
        toast.error('Email không tồn tại. Vui lòng đăng ký tài khoản trước.');
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Mật khẩu không đúng. Vui lòng kiểm tra lại.');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Email không hợp lệ');
      } else if (error.code === 'auth/invalid-credential' || error.message?.includes('Invalid login credentials')) {
        toast.error('Thông tin đăng nhập không đúng. Vui lòng kiểm tra lại email và mật khẩu.');
      } else {
        toast.error(`Đăng nhập thất bại: ${error.message || 'Vui lòng thử lại'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Verify reCAPTCHA (optional - skip nếu không có)
      let recaptchaPassed = true;
      if (window.grecaptcha) {
        try {
          const token = await window.grecaptcha.enterprise.execute(
            '6Lc-jjcsAAAAANH3H3PqDGVuHvqNW-A2DvfObniN',
            { action: 'LOGIN' }
          );

          const verifyRes = await fetch('/api/auth/verify-recaptcha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, action: 'LOGIN' }),
          });

          const verifyData = await verifyRes.json();
          recaptchaPassed = verifyData.success && (verifyData.score >= 0.5 || verifyData.message?.includes('Development'));
        } catch (error) {
          console.warn('reCAPTCHA error, continuing without verification:', error);
          recaptchaPassed = true; // Skip trong dev mode
        }
      }

      if (!recaptchaPassed) {
        toast.error('Xác thực không thành công. Vui lòng thử lại.');
        setLoading(false);
        return;
      }

      await signInWithGoogle();
      // Google OAuth sẽ redirect, không cần xử lý ở đây
      toast.success('Đang chuyển hướng đến Google...');
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error('Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600 mb-2">CupSipMart</h1>
          <p className="text-dark-500">Mượn ly, Cứu hành tinh 🌍</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-medium p-8">
          <h2 className="text-2xl font-semibold text-dark-800 mb-6">Đăng nhập</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 text-white rounded-xl py-3 font-semibold shadow-medium hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                'Đang xử lý...'
              ) : (
                <>
                  Đăng nhập
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-dark-200"></div>
            <span className="px-4 text-sm text-dark-500">hoặc</span>
            <div className="flex-1 border-t border-dark-200"></div>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border-2 border-dark-200 text-dark-800 rounded-xl py-3 font-semibold hover:bg-dark-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Đăng nhập với Google
          </button>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-dark-500">
              Chưa có tài khoản?{' '}
              <Link href="/auth/register" className="text-primary-600 font-semibold hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

