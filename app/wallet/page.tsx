'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Plus, TrendingUp, Leaf } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { getCurrentUser, onAuthChange } from '@/lib/firebase/auth';

export default function WalletPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState({
    walletBalance: 0,
    greenPoints: 0,
    rankLevel: 'seed',
    totalCupsSaved: 0,
  });
  const [loading, setLoading] = useState(true);

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
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
  }, [router]);

  const fetchWallet = useCallback(async () => {
    if (!userId) return;
    
    try {
      const res = await fetch(`/api/wallet?userId=${userId}`);
      const data = await res.json();
      setWallet(data);
    } catch (error) {
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

  const handleTopUp = async (amount: number) => {
    if (!userId) {
      toast.error('Vui lòng đăng nhập');
      router.push('/auth/login');
      return;
    }

    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Nạp tiền thành công');
        fetchWallet();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Lỗi khi nạp tiền');
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

        {/* Quick Top-up - Nâng cấp */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-dark-800 mb-4 flex items-center gap-2">
            <Plus className="w-6 h-6 text-primary-600" />
            Nạp tiền nhanh
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {[50000, 100000, 200000].map((amount) => (
              <motion.button
                key={amount}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTopUp(amount)}
                className="bg-white rounded-2xl p-5 shadow-xl border-2 border-primary-100 hover:border-primary-300 transition-all text-center group"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary-200 transition">
                  <Plus className="w-6 h-6 text-primary-600" />
                </div>
                <div className="text-base font-bold text-dark-800">
                  {amount.toLocaleString('vi-VN')} đ
                </div>
              </motion.button>
            ))}
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

