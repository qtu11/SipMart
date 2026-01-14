'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { signInWithEmail, signInWithGoogle } from '@/lib/supabase/auth';
import HCaptcha from '@hcaptcha/react-hcaptcha';

declare global {
  interface Window {
    hcaptcha: any;
  }
}

// Move admin check to a utility function for better security
const checkIsAdmin = (email: string): boolean => {
  const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY || '';

  if (adminKey) {
    const adminKeys = adminKey.split(',').map(k => k.trim().toLowerCase());
    return adminKeys.includes(email.toLowerCase().trim());
  }

  // Fallback (consider removing hardcoded emails in production)
  const hardcodedAdmins = ['qtusadmin@gmail.com', 'qtusdev@gmail.com'];
  return hardcodedAdmins.some(admin =>
    email.toLowerCase().includes(admin.toLowerCase())
  );
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const router = useRouter();

  // Check for OAuth error in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');

    if (error === 'oauth_failed') {
      toast.error('Đăng nhập Google thất bại. Vui lòng thử lại.');
      router.replace('/auth/login');
    } else if (error === 'no_user') {
      toast.error('Không thể tạo tài khoản. Vui lòng thử lại.');
      router.replace('/auth/login');
    }
  }, [router]);

  const resetCaptcha = () => {
    if (captchaRef.current) {
      captchaRef.current.resetCaptcha();
    }
    setCaptchaToken(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!email.trim() || !password) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Email không hợp lệ');
      return;
    }

    // Optional: Skip captcha validation in development
    // if (!captchaToken) {
    //   toast.error('Vui lòng xác nhận bạn không phải người máy');
    //   return;
    // }

    setLoading(true);

    try {
      const user = await signInWithEmail(email.trim(), password, captchaToken || undefined);
      const userEmail = user.email || email;

      if (checkIsAdmin(userEmail)) {
        toast.success('Đăng nhập thành công! Chào mừng Admin!');
        setTimeout(() => router.push('/admin'), 500);
      } else {
        toast.success('Đăng nhập thành công!');
        router.push('/');
      }
    } catch (error: unknown) {
      const err = error as any;
      console.error('Login error:', err);

      // Better error handling
      const errorCode = err.code || '';
      const errorMessage = err.message || '';

      if (errorCode === 'auth/user-not-found' || errorMessage.includes('User not found')) {
        toast.error('Email không tồn tại. Vui lòng đăng ký tài khoản trước.');
      } else if (errorCode === 'auth/wrong-password' || errorMessage.includes('Invalid password')) {
        toast.error('Mật khẩu không đúng. Vui lòng kiểm tra lại.');
      } else if (errorCode === 'auth/invalid-email') {
        toast.error('Email không hợp lệ');
      } else if (errorCode === 'auth/invalid-credential' || errorMessage.includes('Invalid login credentials')) {
        toast.error('Thông tin đăng nhập không đúng. Vui lòng kiểm tra lại email và mật khẩu.');
      } else if (errorMessage.includes('captcha')) {
        toast.error('Xác thực captcha thất bại. Vui lòng thử lại.');
      } else if (errorCode === 'auth/too-many-requests') {
        toast.error('Quá nhiều lần thử. Vui lòng đợi vài phút và thử lại.');
      } else {
        toast.error(`Đăng nhập thất bại: ${errorMessage || 'Vui lòng thử lại'}`);
      }

      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      const result = await signInWithGoogle();

      if (result?.url) {
        toast.success('Đang chuyển hướng đến Google...');
      } else {
        setLoading(false);
        toast.error('Không thể khởi tạo đăng nhập Google. Vui lòng thử lại.');
      }
    } catch (error: unknown) {
      const err = error as Error;
      setLoading(false);

      if (err.message?.includes('popup')) {
        toast.error('Popup bị chặn. Vui lòng cho phép popup và thử lại.');
      } else if (err.message?.includes('redirect')) {
        toast.error('Không thể redirect đến Google. Vui lòng kiểm tra cấu hình.');
      } else {
        toast.error(`Đăng nhập Google thất bại: ${err.message || 'Vui lòng thử lại'}`);
      }
    }
  };

  const handleCaptchaExpire = () => {
    setCaptchaToken(null);
    toast.error('Captcha đã hết hạn. Vui lòng xác nhận lại.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold text-primary-600 mb-2"
          >
            SipSmart
          </motion.h1>
          <p className="text-dark-600">Mượn ly, Cứu hành tinh 🌍</p>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <h2 className="text-2xl font-bold text-dark-800 mb-6">Đăng nhập</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-400 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-12 pr-4 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-dark-100 text-dark-800 placeholder:text-dark-400"
                  disabled={loading}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dark-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-400 w-5 h-5" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-dark-100 text-dark-800 placeholder:text-dark-400"
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-dark-600"
                  disabled={loading}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* HCaptcha */}
            <div className="flex justify-center">
              <HCaptcha
                sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001'}
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={handleCaptchaExpire}
                ref={captchaRef}
              />
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full bg-primary-600 text-white py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                'Đang xử lý...'
              ) : (
                <>
                  Đăng nhập
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-dark-500">hoặc</span>
            </div>
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full border-2 border-dark-200 text-dark-700 py-3 rounded-xl font-semibold hover:bg-dark-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Đăng nhập với Google
          </button>

          {/* Sign Up Link */}
          <p className="text-center mt-6 text-dark-600">
            Chưa có tài khoản?{' '}
            <Link href="/auth/register" className="text-primary-600 hover:text-primary-700 font-semibold">
              Đăng ký ngay
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}