'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Plus, TrendingUp, Leaf, CreditCard, Landmark } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { getCurrentUser, onAuthChange } from '@/lib/supabase/auth';

export default function WalletPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState({
    walletBalance: 0,
    greenPoints: 0,
    rankLevel: 'seed',
    totalCupsSaved: 0,
  });
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState('');

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUserId((currentUser as any).id || (currentUser as any).user_id);
        setLoading(false);
      } else {
        const unsubscribe = onAuthChange((user) => {
          if (user) {
            setUserId((user as any).id || (user as any).user_id);
            setLoading(false);
          } else {
            router.push('/auth/login');
          }
        });
        return () => unsubscribe();
      }
    };
    checkUser();
  }, [router]);

  const fetchWallet = useCallback(async () => {
    if (!userId) return;

    try {
      const res = await fetch(`/api/wallet?userId=${userId}`);
      const data = await res.json();
      setWallet(data);
    } catch (error: unknown) {
      const err = error as Error;
      toast.error('Lỗi khi tải thông tin ví');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchWallet();
    }
  }, [userId, fetchWallet]);

  const handleTopUp = async (amountInput?: number) => {
    if (!userId) {
      toast.error('Vui lòng đăng nhập');
      router.push('/auth/login');
      return;
    }

    const amount = amountInput || (customAmount ? parseInt(customAmount) : 0);

    if (amount < 10000) {
      toast.error('Số tiền nạp tối thiểu là 10.000đ');
      return;
    }

    try {
      const body: any = {
        amount,
        orderInfo: `Nap tien vao vi ${userId}`,
        bankCode: selectedBank || undefined
      };

      const res = await fetch('/api/vnpay/create_payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Không thể tạo liên kết thanh toán');
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast.error('Lỗi kết nối thanh toán: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="text-primary-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-soft px-4 py-4 border-b border-primary-100">
        <h1 className="text-xl font-semibold text-dark-800">Ví điện tử</h1>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Wallet Card - Nâng cấp */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <Wallet className="w-8 h-8" />
              <span className="text-sm opacity-90">Số dư</span>
            </div>
            <div className="text-5xl font-bold mb-3">
              {wallet.walletBalance.toLocaleString('vi-VN')} đ
            </div>
            <div className="text-sm opacity-90 mb-4">
              Đủ để mượn {Math.floor(wallet.walletBalance / 20000)} ly
            </div>
            <div className="flex items-center gap-2 text-xs opacity-75">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>Số dư khả dụng</span>
            </div>
          </div>
        </motion.div>

        {/* Top-up Form - Integrated */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 shadow-xl border border-primary-100"
        >
          <h2 className="text-lg font-bold text-dark-800 mb-4 flex items-center gap-2">
            <Plus className="w-6 h-6 text-primary-600" />
            Nạp tiền vào ví
          </h2>

          <div className="space-y-4">
            {/* Quick Options */}
            <div className="grid grid-cols-3 gap-3">
              {[50000, 100000, 200000].map((val) => (
                <button
                  key={val}
                  onClick={() => handleTopUp(val)}
                  className="py-3 px-1 rounded-xl border border-primary-200 text-primary-700 font-semibold hover:bg-primary-50 transition text-sm shadow-sm"
                >
                  {val.toLocaleString('vi-VN')}đ
                </button>
              ))}
            </div>

            <div className="border-t border-gray-100 my-2"></div>

            {/* Custom Amount */}
            <div>
              <label className="block text-sm font-medium text-dark-600 mb-1.5 ml-1">Nhập số tiền khác</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 font-semibold">đ</span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Ví dụ: 250000"
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-dark-200 focus:ring-2 focus:ring-primary-500 outline-none transition bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Bank Selection (Optional) */}
            <div>
              <label className="block text-sm font-medium text-dark-600 mb-1.5 ml-1">Chọn ngân hàng (Tùy chọn)</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedBank(selectedBank === 'VNPAYQR' ? '' : 'VNPAYQR')}
                  className={`py-2 px-2 rounded-lg border text-xs font-medium transition flex flex-col items-center justify-center gap-1 h-20 ${selectedBank === 'VNPAYQR' ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <div className="bg-white p-1 rounded border border-gray-100"><Image src="https://sandbox.vnpayment.vn/paymentv2/Images/bank/VNPAYQR.png" alt="QR" width={24} height={24} className="object-contain" onError={(e) => e.currentTarget.style.display = 'none'} /></div>
                  VNPAY QR
                </button>
                <button
                  onClick={() => setSelectedBank(selectedBank === 'VNBANK' ? '' : 'VNBANK')}
                  className={`py-2 px-2 rounded-lg border text-xs font-medium transition flex flex-col items-center justify-center gap-1 h-20 ${selectedBank === 'VNBANK' ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <Landmark className="w-6 h-6" />
                  ATM Nội địa
                </button>
                <button
                  onClick={() => setSelectedBank(selectedBank === 'INTCARD' ? '' : 'INTCARD')}
                  className={`py-2 px-2 rounded-lg border text-xs font-medium transition flex flex-col items-center justify-center gap-1 h-20 ${selectedBank === 'INTCARD' ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <CreditCard className="w-6 h-6" />
                  Thẻ Quốc tế
                </button>
              </div>
            </div>

            {/* Main Action Button */}
            <button
              onClick={() => handleTopUp()}
              disabled={!customAmount || parseInt(customAmount) < 10000}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none disabled:transform-none"
            >
              Thanh toán ngay
            </button>
          </div>
        </motion.div>

        {/* Stats - Nâng cấp */}
        <div className="grid md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-gradient-to-br from-white to-yellow-50 rounded-2xl p-6 shadow-xl border-2 border-yellow-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary-50 rounded-xl p-3">
                  <TrendingUp className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <div className="text-sm text-dark-500">Green Points</div>
                  <div className="text-xl font-bold text-dark-800">
                    {wallet.greenPoints}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-dark-500">Hạng</div>
                <div className="text-lg font-semibold text-primary-600">
                  {wallet.rankLevel}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-gradient-to-br from-white to-primary-50 rounded-2xl p-6 shadow-xl border-2 border-primary-100"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary-50 rounded-xl p-3">
                <Leaf className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <div className="text-sm text-dark-500">Ly đã cứu</div>
                <div className="text-xl font-bold text-dark-800">
                  {wallet.totalCupsSaved}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
