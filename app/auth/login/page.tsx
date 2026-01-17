'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Leaf, Sparkles, Coffee, Bike } from 'lucide-react';
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
    <div className="min-h-screen flex">
      {/* Left Side - Branding with animated background */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary-600 via-primary-500 to-teal-500 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          {/* Floating circles */}
          <motion.div
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              y: [0, 40, 0],
              x: [0, -30, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-20 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              y: [0, -20, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/30 shadow-2xl">
              <Leaf className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl font-black mb-4 text-center"
          >
            SipSmart
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-white/90 mb-12 text-center"
          >
            Mượn ly, Cứu hành tinh 🌍
          </motion.p>

          {/* Feature highlights */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-4 w-full max-w-sm"
          >
            {[
              { icon: Coffee, text: 'Ly tái sử dụng thông minh' },
              { icon: Bike, text: 'Giao thông xanh tích hợp' },
              { icon: Sparkles, text: 'Nhận thưởng khi sống xanh' },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + idx * 0.1 }}
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-4 border border-white/20"
              >
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-medium">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-3 mb-4"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-black text-primary-600">SipSmart</span>
            </motion.div>
            <p className="text-dark-500">Mượn ly, Cứu hành tinh 🌍</p>
          </div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100"
          >
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-dark-900 mb-2">Chào mừng trở lại!</h2>
              <p className="text-dark-500">Đăng nhập để tiếp tục hành trình xanh</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-dark-700 mb-2">
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
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-0 focus:border-primary-500 bg-gray-50 text-dark-900 placeholder:text-dark-400 transition-colors"
                    disabled={loading}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-dark-700 mb-2">
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
                    className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-0 focus:border-primary-500 bg-gray-50 text-dark-900 placeholder:text-dark-400 transition-colors"
                    disabled={loading}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-dark-600 transition-colors"
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
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.99 }}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 rounded-xl font-bold text-lg hover:from-primary-600 hover:to-primary-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang xử lý...
                  </div>
                ) : (
                  <>
                    Đăng nhập
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-dark-400 font-medium">hoặc tiếp tục với</span>
              </div>
            </div>

            {/* Google Login */}
            <motion.button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className="w-full border-2 border-gray-200 bg-white text-dark-700 py-4 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
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
            </motion.button>

            {/* Sign Up Link */}
            <p className="text-center mt-8 text-dark-500">
              Chưa có tài khoản?{' '}
              <Link href="/auth/register" className="text-primary-600 hover:text-primary-700 font-bold">
                Đăng ký ngay
              </Link>
            </p>
          </motion.div>

          {/* Footer */}
          <p className="text-center mt-6 text-dark-400 text-sm">
            Bằng việc đăng nhập, bạn đồng ý với{' '}
            <Link href="/terms" className="text-primary-600 hover:underline">Điều khoản</Link>
            {' '}và{' '}
            <Link href="/privacy" className="text-primary-600 hover:underline">Chính sách bảo mật</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}