'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Plus, TrendingUp, Leaf, CreditCard, Landmark } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { getCurrentUser, onAuthChange } from '@/lib/supabase/auth';
import LoadingSpinner from '@/components/LoadingSpinner';
import FallingLeaves from '@/components/FallingLeaves';
import SocialLayout from '@/components/social/SocialLayout';

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

  const [user, setUser] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setUserId((currentUser as any).id || (currentUser as any).user_id);
        setLoading(false);
      } else {
        const unsubscribe = onAuthChange((user) => {
          if (user) {
            setUser(user);
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
      const { data: { session } } = await import('@/lib/supabase/client').then(m => m.createClient().auth.getSession());

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/wallet?userId=${userId}`, {
        headers
      });
      const data = await res.json();
      if (data && typeof data.walletBalance === 'number') {
        setWallet(prev => ({ ...prev, ...data }));
      } else {
        // Provide defaults or handle missing data
        console.warn('Invalid wallet data received', data);
      }
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
        userId, // Add userId to payload
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
        <FallingLeaves />
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <SocialLayout user={user}>
      <div className="max-w-md mx-auto space-y-6">
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
              {(wallet?.walletBalance ?? 0).toLocaleString('vi-VN')} đ
            </div>
            <div className="text-sm opacity-90 mb-4">
              Đủ để mượn {Math.floor((wallet?.walletBalance ?? 0) / 20000)} ly
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
                  <div className="bg-white p-1 rounded border border-gray-100"><Image src="/images/vnpay_logo.png" alt="QR" width={24} height={24} className="object-contain" /></div>
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

        {/* Withdrawal Section */}
        <WithdrawalSection userId={userId} onSuccess={fetchWallet} />

        {/* Transaction History */}
        <TransactionHistory userId={userId} />
      </div>
    </SocialLayout>
  );
}

function WithdrawalSection({ userId, onSuccess }: { userId: string | null; onSuccess: () => void }) {
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const handleWithdraw = async () => {
    if (!userId) return;

    if (!withdrawAmount || parseInt(withdrawAmount) < 50000) {
      toast.error('Số tiền rút tối thiểu 50.000đ');
      return;
    }

    if (!bankAccount.trim()) {
      toast.error('Vui lòng nhập số tài khoản');
      return;
    }

    if (!bankName.trim()) {
      toast.error('Vui lòng nhập tên ngân hàng');
      return;
    }

    if (!accountName.trim()) {
      toast.error('Vui lòng nhập tên chủ tài khoản');
      return;
    }

    setWithdrawing(true);
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: parseInt(withdrawAmount),
          bankName,
          accountNumber: bankAccount,
          accountName
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setWithdrawAmount('');
        setBankAccount('');
        setBankName('');
        setAccountName('');
        setShowWithdraw(false);
        onSuccess();
      } else {
        toast.error(data.error || 'Lỗi khi rút tiền');
      }
    } catch (error: any) {
      toast.error('Lỗi kết nối');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="mt-6">
      {!showWithdraw ? (
        <button
          onClick={() => setShowWithdraw(true)}
          className="w-full bg-white text-primary-600 border-2 border-primary-500 py-3 rounded-xl font-bold hover:bg-primary-50 transition"
        >
          Rút tiền về tài khoản
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white rounded-3xl p-6 shadow-xl border border-primary-100"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-dark-800">Rút tiền</h3>
            <button
              onClick={() => setShowWithdraw(false)}
              className="text-dark-400 hover:text-dark-600"
            >
              Đóng
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-600 mb-1">Số tiền (tối thiểu 50.000đ)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="VD: 100000"
                className="w-full px-4 py-3 border border-dark-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-600 mb-1">Ngân hàng</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="VD: Vietcombank, ACB..."
                className="w-full px-4 py-3 border border-dark-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-600 mb-1">Số tài khoản</label>
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="Số tài khoản ngân hàng"
                className="w-full px-4 py-3 border border-dark-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-600 mb-1">Tên chủ tài khoản</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Tên in hoa không dấu"
                className="w-full px-4 py-3 border border-dark-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <button
              onClick={handleWithdraw}
              disabled={withdrawing}
              className="w-full bg-primary-500 text-white py-3 rounded-xl font-bold hover:bg-primary-600 disabled:opacity-50 transition"
            >
              {withdrawing ? 'Đang xử lý...' : 'Xác nhận rút tiền'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function TransactionHistory({ userId }: { userId: string | null }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/wallet/transactions?userId=${userId}&limit=20`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (showTransactions && userId) {
      fetchTransactions();
    }
  }, [showTransactions, userId, fetchTransactions]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white rounded-3xl p-6 shadow-xl border border-primary-100 mt-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-dark-800">Lịch sử giao dịch</h2>
        <button
          onClick={() => setShowTransactions(!showTransactions)}
          className="text-sm text-primary-600 font-semibold hover:text-primary-700"
        >
          {showTransactions ? 'Ẩn' : 'Xem'}
        </button>
      </div>

      {showTransactions && (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="text-center py-4 text-dark-500">Đang tải...</div>
          ) : transactions.length === 0 ? (
            <p className="text-dark-500 text-center py-4">Chưa có giao dịch nào</p>
          ) : (
            transactions.map((tx) => (
              <div key={tx.transaction_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                <div>
                  <p className="font-semibold text-dark-800 text-sm">{tx.description || getTransactionDescription(tx)}</p>
                  <p className="text-xs text-dark-500">
                    {new Date(tx.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className={`text-sm font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.amount > 0 ? '+' : ''}{Math.abs(tx.amount).toLocaleString('vi-VN')}đ
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </motion.div>
  );
}

function getTransactionDescription(tx: any) {
  if (tx.metadata && tx.metadata.bankName) {
    return `Rút tiền về ${tx.metadata.bankName}`;
  }
  switch (tx.type) {
    case 'deposit': return 'Nạp tiền vào ví';
    case 'withdrawal': return 'Rút tiền';
    case 'borrow_fee': return 'Thuê ly';
    case 'return_deposit': return 'Hoàn tiền cọc';
    default: return 'Giao dịch';
  }
}